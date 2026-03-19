import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request) {
  if (useBackend()) {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    return proxyToBackend("/api/loans", { method: "GET", query });
  }
  try {
    const { userId } = await requireSession();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const rows = activeOnly
      ? await sql`
          SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
                 b.title as book_title, b.author as book_author, b.isbn as book_isbn
          FROM loans l JOIN books b ON b.id = l.book_id
          WHERE l.user_id = ${userId}::uuid AND l.returned_at IS NULL
          ORDER BY l.due_at
        `
      : await sql`
          SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
                 b.title as book_title, b.author as book_author, b.isbn as book_isbn
          FROM loans l JOIN books b ON b.id = l.book_id
          WHERE l.user_id = ${userId}::uuid
          ORDER BY l.returned_at NULLS FIRST, l.due_at
        `;
    const list = (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      bookId: r.book_id,
      borrowedAt: r.borrowed_at,
      dueAt: r.due_at,
      returnedAt: r.returned_at,
      createdAt: r.created_at,
      bookTitle: r.book_title,
      bookAuthor: r.book_author,
      bookIsbn: r.book_isbn,
    }));
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load loans" }, { status: 500 });
  }
}
