"""Public library stats and category lists (no auth)."""

from fastapi import APIRouter, Depends

from dependencies import get_db_pool

router = APIRouter(prefix="/api/library", tags=["library"])


@router.get("/stats")
async def library_stats(pool=Depends(get_db_pool)):
    row = await pool.fetchrow(
        """
        SELECT
          (SELECT COUNT(*)::int FROM books) AS total_titles,
          (SELECT COALESCE(SUM(total_copies), 0)::int FROM books) AS total_copies,
          (SELECT COALESCE(SUM(available_copies), 0)::int FROM books) AS available_copies,
          (SELECT COUNT(DISTINCT category)::int FROM books WHERE category IS NOT NULL AND trim(category) <> '') AS category_count
        """
    )
    return {
        "totalTitles": row["total_titles"],
        "totalCopies": row["total_copies"],
        "availableCopies": row["available_copies"],
        "categoryCount": row["category_count"],
    }


@router.get("/categories")
async def library_categories(pool=Depends(get_db_pool)):
    rows = await pool.fetch(
        """SELECT DISTINCT category FROM books
           WHERE category IS NOT NULL AND trim(category) <> ''
           ORDER BY category"""
    )
    return [r["category"] for r in rows]
