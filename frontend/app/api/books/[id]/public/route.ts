import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { fetchBackend } from "@/lib/proxy";

/** Public single book: no auth. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (useBackend()) {
    const base = (process.env.API_BACKEND_URL || "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/books/public/${id}`, { method: "GET" });
    const data = await res.json();
    if (res.status === 404) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json(data);
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  try {
    const rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at,
      description, publication_year, publisher, language, shelf_location
      FROM books WHERE id = ${id}::uuid LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: r.id,
      isbn: r.isbn,
      title: r.title,
      author: r.author,
      category: r.category,
      totalCopies: r.total_copies,
      availableCopies: r.available_copies,
      description: r.description,
      publicationYear: r.publication_year,
      publisher: r.publisher,
      language: r.language,
      shelfLocation: r.shelf_location,
    });
  } catch {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }
}
