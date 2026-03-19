from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from database import get_pool
from dependencies import get_current_user
from schemas import CheckoutBody, LoanResponse

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.get("", response_model=list)
async def my_loans(active_only: bool = False, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    if active_only:
        rows = await pool.fetch(
            """SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
                      b.title as book_title, b.author as book_author, b.isbn as book_isbn
               FROM loans l JOIN books b ON b.id = l.book_id
               WHERE l.user_id = $1 AND l.returned_at IS NULL
               ORDER BY l.due_at""",
            user["userId"],
        )
    else:
        rows = await pool.fetch(
            """SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
                      b.title as book_title, b.author as book_author, b.isbn as book_isbn
               FROM loans l JOIN books b ON b.id = l.book_id
               WHERE l.user_id = $1
               ORDER BY l.returned_at NULLS FIRST, l.due_at""",
            user["userId"],
        )
    return [_row_to_loan(r) for r in rows]


@router.post("/checkout", response_model=dict, status_code=201)
async def checkout(body: CheckoutBody, user: dict = Depends(get_current_user)):
    book_id = body.bookId.strip()
    pool = await get_pool()
    book = await pool.fetchrow(
        "SELECT id, title, available_copies FROM books WHERE id = $1",
        book_id,
    )
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book["available_copies"] < 1:
        raise HTTPException(status_code=400, detail="No copies available")
    due = date.today() + timedelta(days=14)
    row = await pool.fetchrow(
        """INSERT INTO loans (user_id, book_id, due_at)
           VALUES ($1, $2, $3)
           RETURNING id, user_id, book_id, borrowed_at, due_at, returned_at, created_at""",
        user["userId"],
        book_id,
        due,
    )
    await pool.execute(
        "UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = $1",
        book_id,
    )
    loan = _row_to_loan(row)
    loan["bookTitle"] = book["title"]
    return loan


@router.post("/{loan_id}/return", response_model=dict)
async def return_loan(loan_id: str, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, user_id, book_id, returned_at FROM loans WHERE id = $1",
        loan_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Loan not found")
    if str(row["user_id"]) != user["userId"]:
        raise HTTPException(status_code=403, detail="Not your loan")
    if row["returned_at"]:
        raise HTTPException(status_code=400, detail="Already returned")
    await pool.execute(
        "UPDATE loans SET returned_at = NOW() WHERE id = $1",
        loan_id,
    )
    await pool.execute(
        "UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1",
        str(row["book_id"]),
    )
    row = await pool.fetchrow(
        """SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
                  b.title as book_title, b.author as book_author, b.isbn as book_isbn
           FROM loans l JOIN books b ON b.id = l.book_id WHERE l.id = $1""",
        loan_id,
    )
    return _row_to_loan(row)


def _row_to_loan(r) -> dict:
    return {
        "id": str(r["id"]),
        "userId": str(r["user_id"]),
        "bookId": str(r["book_id"]),
        "borrowedAt": r["borrowed_at"].isoformat() if r.get("borrowed_at") else None,
        "dueAt": r["due_at"].isoformat() if isinstance(r.get("due_at"), date) else str(r.get("due_at")),
        "returnedAt": r["returned_at"].isoformat() if r.get("returned_at") else None,
        "createdAt": r["created_at"].isoformat() if r.get("created_at") else None,
        "bookTitle": r.get("book_title"),
        "bookAuthor": r.get("book_author"),
        "bookIsbn": r.get("book_isbn"),
    }
