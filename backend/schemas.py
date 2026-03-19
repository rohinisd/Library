from pydantic import BaseModel, Field
from typing import Optional


# Auth
class RegisterBody(BaseModel):
    username: str
    password: str
    displayName: Optional[str] = None


class LoginBody(BaseModel):
    username: str
    password: str


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


class BookUpdateBody(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    totalCopies: Optional[int] = None


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
