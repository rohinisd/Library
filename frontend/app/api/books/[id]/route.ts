import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

type BookRow = {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  category: string | null;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
};

function toBook(row: BookRow) {
  return {
    id: row.id,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    category: row.category,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (useBackend()) {
    return proxyToBackend(`/api/books/${id}`, { method: "GET" });
  }
  try {
    await requireSession();
    const rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
      FROM books WHERE id = ${id}::uuid LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json(toBook(rows[0] as BookRow));
  } catch (e) {
    return NextResponse.json({ error: "Failed to load book" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (useBackend()) {
    return proxyToBackend(`/api/books/${id}`, {
      method: "PATCH",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await requireSession();
    const body = await req.json();
    const { title, author, category, totalCopies } = body;
    const existing = await sql`SELECT total_copies, available_copies FROM books WHERE id = ${id}::uuid LIMIT 1` as { total_copies: number; available_copies: number }[];
    if (!existing.length) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    const diff = totalCopies != null ? totalCopies - existing[0].total_copies : 0;
    const updates: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (title != null) { updates.push(`title = $${i}`); values.push(title); i++; }
    if (author != null) { updates.push(`author = $${i}`); values.push(author); i++; }
    if (category != null) { updates.push(`category = $${i}`); values.push(category); i++; }
    if (totalCopies != null) {
      updates.push(`total_copies = $${i}`);
      values.push(totalCopies);
      i++;
      updates.push(`available_copies = GREATEST(0, available_copies + ${diff})`);
    }
    if (updates.length === 0) {
      const rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at FROM books WHERE id = ${id}::uuid`;
      return NextResponse.json(toBook(rows[0] as BookRow));
    }
    updates.push("updated_at = NOW()");
    values.push(id);
    const { getDb } = await import("@/lib/db");
    const pool = await getDb();
    const result = await pool.query(
      `UPDATE books SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at`,
      values
    );
    return NextResponse.json(toBook(result.rows[0] as BookRow));
  } catch (e) {
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}
