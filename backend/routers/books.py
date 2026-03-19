from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_pool
from dependencies import get_current_user
from schemas import BookCreateBody, BookResponse, BookUpdateBody

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("/public", response_model=list)
async def list_books_public(
    q: str | None = Query(None, description="Search title/author"),
    category: str | None = Query(None),
    limit: int = Query(50, le=100),
):
    """Public catalog: no auth required."""
    pool = await get_pool()
    if q or category:
        if q and category:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE (title ILIKE $1 OR author ILIKE $1) AND category = $2
                   ORDER BY title LIMIT $3""",
                f"%{q}%",
                category,
                limit,
            )
        elif q:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE title ILIKE $1 OR author ILIKE $1 ORDER BY title LIMIT $2""",
                f"%{q}%",
                limit,
            )
        else:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE category = $1 ORDER BY title LIMIT $2""",
                category,
                limit,
            )
    else:
        rows = await pool.fetch(
            """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
               FROM books ORDER BY title LIMIT $1""",
            limit,
        )
    return [_row_to_book(r) for r in rows]


@router.get("/public/{book_id}", response_model=dict)
async def get_book_public(book_id: str):
    """Public single book: no auth."""
    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
           FROM books WHERE id = $1""",
        book_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return _row_to_book(row)


@router.get("", response_model=list)
async def list_books(
    q: str | None = Query(None, description="Search title/author"),
    category: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    pool = await get_pool()
    if q or category:
        if q and category:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE (title ILIKE $1 OR author ILIKE $1) AND category = $2
                   ORDER BY title""",
                f"%{q}%",
                category,
            )
        elif q:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE title ILIKE $1 OR author ILIKE $1 ORDER BY title""",
                f"%{q}%",
            )
        else:
            rows = await pool.fetch(
                """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
                   FROM books WHERE category = $1 ORDER BY title""",
                category,
            )
    else:
        rows = await pool.fetch(
            """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
               FROM books ORDER BY title"""
        )
    return [_row_to_book(r) for r in rows]


@router.get("/{book_id}", response_model=dict)
async def get_book(book_id: str, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
           FROM books WHERE id = $1""",
        book_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return _row_to_book(row)


@router.post("", response_model=dict, status_code=201)
async def create_book(body: BookCreateBody, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    try:
        row = await pool.fetchrow(
            """INSERT INTO books (isbn, title, author, category, total_copies, available_copies)
               VALUES ($1, $2, $3, $4, $5, $5)
               RETURNING id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at""",
            body.isbn or None,
            body.title,
            body.author,
            body.category or None,
            body.totalCopies or 1,
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="ISBN already exists")
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_book(row)


@router.patch("/{book_id}", response_model=dict)
async def update_book(book_id: str, body: BookUpdateBody, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT id, total_copies, available_copies FROM books WHERE id = $1", book_id)
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    updates = []
    values = []
    i = 1
    if body.title is not None:
        updates.append(f"title = ${i}")
        values.append(body.title)
        i += 1
    if body.author is not None:
        updates.append(f"author = ${i}")
        values.append(body.author)
        i += 1
    if body.category is not None:
        updates.append(f"category = ${i}")
        values.append(body.category)
        i += 1
    if body.totalCopies is not None:
        diff = body.totalCopies - row["total_copies"]
        updates.append(f"total_copies = ${i}")
        values.append(body.totalCopies)
        i += 1
        updates.append(f"available_copies = GREATEST(0, available_copies + {diff})")
    if not updates:
        row = await pool.fetchrow(
            """SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
               FROM books WHERE id = $1""",
            book_id,
        )
        return _row_to_book(row)
    values.append(book_id)
    sql = f"UPDATE books SET {', '.join(updates)}, updated_at = NOW() WHERE id = ${i} RETURNING id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at"
    row = await pool.fetchrow(sql, *values)
    return _row_to_book(row)


def _row_to_book(r) -> dict:
    return {
        "id": str(r["id"]),
        "isbn": r["isbn"],
        "title": r["title"],
        "author": r["author"],
        "category": r["category"],
        "totalCopies": r["total_copies"],
        "availableCopies": r["available_copies"],
        "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
        "updatedAt": r["updated_at"].isoformat() if r["updated_at"] else None,
    }
