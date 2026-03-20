from pydantic import BaseModel, Field, field_validator
from typing import Optional

# bcrypt limit: password must be <= 72 bytes (UTF-8)
BCRYPT_MAX_BYTES = 72


def _truncate_password_72(password: str) -> str:
    if not password:
        return password
    b = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    return b.decode("utf-8", errors="replace")


# Auth
class RegisterBody(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = None

    @field_validator("password", mode="before")
    @classmethod
    def truncate_password(cls, v: str) -> str:
        if isinstance(v, str):
            return _truncate_password_72(v)
        return v


class LoginBody(BaseModel):
    username: str
    password: str

    @field_validator("password", mode="before")
    @classmethod
    def truncate_password(cls, v: str) -> str:
        if isinstance(v, str):
            return _truncate_password_72(v)
        return v


class AuthResponse(BaseModel):
    ok: bool = True
    token: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str


# Books
class BookCreateBody(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    category: Optional[str] = None
    totalCopies: Optional[int] = 1
    description: Optional[str] = None
    publicationYear: Optional[int] = None
    publisher: Optional[str] = None
    language: Optional[str] = "English"
    shelfLocation: Optional[str] = None


class BookUpdateBody(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    totalCopies: Optional[int] = None
    description: Optional[str] = None
    publicationYear: Optional[int] = None
    publisher: Optional[str] = None
    language: Optional[str] = None
    shelfLocation: Optional[str] = None


class BookResponse(BaseModel):
    id: str
    isbn: Optional[str] = None
    title: str
    author: str
    category: Optional[str] = None
    totalCopies: int
    availableCopies: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    description: Optional[str] = None
    publicationYear: Optional[int] = None
    publisher: Optional[str] = None
    language: Optional[str] = None
    shelfLocation: Optional[str] = None


# Loans
class CheckoutBody(BaseModel):
    bookId: str


class LoanResponse(BaseModel):
    id: str
    userId: str
    bookId: str
    borrowedAt: Optional[str] = None
    dueAt: Optional[str] = None
    returnedAt: Optional[str] = None
    bookTitle: Optional[str] = None
    bookAuthor: Optional[str] = None
    bookIsbn: Optional[str] = None
