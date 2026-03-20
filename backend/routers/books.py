from fastapi import APIRouter, Depends, HTTPException, Query
from dependencies import get_current_user, get_db_pool
from schemas import BookCreateBody, BookUpdateBody

router = APIRouter(prefix="/api/books", tags=["books"])

BOOK_ROW = """id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at,
              description, publication_year, publisher, language, shelf_location"""


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
        "description": r.get("description"),
        "publicationYear": r["publication_year"],
        "publisher": r.get("publisher"),
        "language": r.get("language"),
        "shelfLocation": r.get("shelf_location"),
    }


def _order_clause(sort: str | None) -> str:
    s = (sort or "title").lower()
    if s == "author":
        return "ORDER BY author ASC, title ASC"
    if s == "year":
        return "ORDER BY publication_year DESC NULLS LAST, title ASC"
    if s == "newest":
        return "ORDER BY created_at DESC NULLS LAST"
    return "ORDER BY title ASC"


def _search_where(q: str | None) -> tuple[str, list]:
    """Returns SQL fragment and params for title/author/description search."""
    if not q or not q.strip():
        return "", []
    term = f"%{q.strip()}%"
    return (
        """(title ILIKE $1 OR author ILIKE $1 OR COALESCE(description, '') ILIKE $1)""",
        [term],
    )


@router.get("/public", response_model=list)
async def list_books_public(
    q: str | None = Query(None, description="Search title, author, description"),
    category: str | None = Query(None),
    sort: str | None = Query(None, description="title | author | year | newest"),
    limit: int = Query(80, le=200),
    pool=Depends(get_db_pool),
):
    """Public catalog: no auth required."""
    order = _order_clause(sort)
    sw, sparams = _search_where(q)

    if category and sw:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books
                WHERE {sw} AND category = ${len(sparams) + 1}
                {order} LIMIT ${len(sparams) + 2}""",
            *sparams,
            category,
            limit,
        )
    elif category:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books WHERE category = $1 {order} LIMIT $2""",
            category,
            limit,
        )
    elif sw:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books WHERE {sw} {order} LIMIT $2""",
            *sparams,
            limit,
        )
    else:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books {order} LIMIT $1""",
            limit,
        )
    return [_row_to_book(r) for r in rows]


@router.get("/public/{book_id}", response_model=dict)
async def get_book_public(book_id: str, pool=Depends(get_db_pool)):
    row = await pool.fetchrow(
        f"""SELECT {BOOK_ROW} FROM books WHERE id = $1""",
        book_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return _row_to_book(row)


@router.get("", response_model=list)
async def list_books(
    q: str | None = Query(None),
    category: str | None = Query(None),
    sort: str | None = Query(None),
    user: dict = Depends(get_current_user),
    pool=Depends(get_db_pool),
):
    order = _order_clause(sort)
    sw, sparams = _search_where(q)

    if category and sw:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books
                WHERE {sw} AND category = ${len(sparams) + 1}
                {order}""",
            *sparams,
            category,
        )
    elif category:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books WHERE category = $1 {order}""",
            category,
        )
    elif sw:
        rows = await pool.fetch(
            f"""SELECT {BOOK_ROW} FROM books WHERE {sw} {order}""",
            *sparams,
        )
    else:
        rows = await pool.fetch(f"""SELECT {BOOK_ROW} FROM books {order}""")
    return [_row_to_book(r) for r in rows]


@router.get("/{book_id}", response_model=dict)
async def get_book(book_id: str, user: dict = Depends(get_current_user), pool=Depends(get_db_pool)):
    row = await pool.fetchrow(f"""SELECT {BOOK_ROW} FROM books WHERE id = $1""", book_id)
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return _row_to_book(row)


@router.post("", response_model=dict, status_code=201)
async def create_book(body: BookCreateBody, user: dict = Depends(get_current_user), pool=Depends(get_db_pool)):
    try:
        row = await pool.fetchrow(
            f"""INSERT INTO books (
                isbn, title, author, category, total_copies, available_copies,
                description, publication_year, publisher, language, shelf_location
            )
            VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
            RETURNING {BOOK_ROW}""",
            body.isbn or None,
            body.title,
            body.author,
            body.category or None,
            body.totalCopies or 1,
            body.description or None,
            body.publicationYear,
            body.publisher or None,
            body.language or "English",
            body.shelfLocation or None,
        )
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="ISBN already exists")
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_book(row)


@router.patch("/{book_id}", response_model=dict)
async def update_book(book_id: str, body: BookUpdateBody, user: dict = Depends(get_current_user), pool=Depends(get_db_pool)):
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
    if body.description is not None:
        updates.append(f"description = ${i}")
        values.append(body.description)
        i += 1
    if body.publicationYear is not None:
        updates.append(f"publication_year = ${i}")
        values.append(body.publicationYear)
        i += 1
    if body.publisher is not None:
        updates.append(f"publisher = ${i}")
        values.append(body.publisher)
        i += 1
    if body.language is not None:
        updates.append(f"language = ${i}")
        values.append(body.language)
        i += 1
    if body.shelfLocation is not None:
        updates.append(f"shelf_location = ${i}")
        values.append(body.shelfLocation)
        i += 1
    if body.totalCopies is not None:
        diff = body.totalCopies - row["total_copies"]
        updates.append(f"total_copies = ${i}")
        values.append(body.totalCopies)
        i += 1
        updates.append(f"available_copies = GREATEST(0, available_copies + {diff})")
    if not updates:
        row = await pool.fetchrow(f"""SELECT {BOOK_ROW} FROM books WHERE id = $1""", book_id)
        return _row_to_book(row)
    values.append(book_id)
    sql = f"UPDATE books SET {', '.join(updates)}, updated_at = NOW() WHERE id = ${i} RETURNING {BOOK_ROW}"
    row = await pool.fetchrow(sql, *values)
    return _row_to_book(row)
