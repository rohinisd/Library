import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: loanId } = await params;
  if (useBackend()) {
    return proxyToBackend(`/api/loans/${loanId}/return`, { method: "POST" });
  }
  try {
    const { userId } = await requireSession();
    const loanRows = await sql`SELECT id, user_id, book_id, returned_at FROM loans WHERE id = ${loanId}::uuid LIMIT 1`;
    if (!loanRows.length) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    const loan = loanRows[0] as { user_id: string; book_id: string; returned_at: string | null };
    if (String(loan.user_id) !== userId) return NextResponse.json({ error: "Not your loan" }, { status: 403 });
    if (loan.returned_at) return NextResponse.json({ error: "Already returned" }, { status: 400 });
    await sql`UPDATE loans SET returned_at = NOW() WHERE id = ${loanId}::uuid`;
    await sql`UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = ${loan.book_id}`;
    const updated = await sql`
      SELECT l.id, l.user_id, l.book_id, l.borrowed_at, l.due_at, l.returned_at, l.created_at,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM loans l JOIN books b ON b.id = l.book_id WHERE l.id = ${loanId}::uuid
    `;
    const r = updated[0] as Record<string, unknown>;
    return NextResponse.json({
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
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to return" }, { status: 500 });
  }
}
