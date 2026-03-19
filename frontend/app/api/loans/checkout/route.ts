import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

export async function POST(req: Request) {
  if (useBackend()) {
    return proxyToBackend("/api/loans/checkout", {
      method: "POST",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { userId } = await requireSession();
    const body = await req.json();
    const bookId = (body.bookId || body.book_id || "").trim();
    if (!bookId) return NextResponse.json({ error: "bookId required" }, { status: 400 });
    const bookRows = await sql`SELECT id, title, available_copies FROM books WHERE id = ${bookId}::uuid LIMIT 1`;
    if (!bookRows.length) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const book = bookRows[0] as { id: string; title: string; available_copies: number };
    if (book.available_copies < 1) return NextResponse.json({ error: "No copies available" }, { status: 400 });
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueStr = due.toISOString().slice(0, 10);
    const loanRows = await sql`
      INSERT INTO loans (user_id, book_id, due_at)
      VALUES (${userId}::uuid, ${bookId}::uuid, ${dueStr}::date)
      RETURNING id, user_id, book_id, borrowed_at, due_at, returned_at, created_at
    `;
    await sql`UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = ${bookId}::uuid`;
    const loan = loanRows[0] as Record<string, unknown>;
    return NextResponse.json({
      ...loan,
      bookTitle: book.title,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to checkout" }, { status: 500 });
  }
}
