import { NextResponse } from "next/server";
import { getSession, requireSession } from "@/lib/auth";
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

export async function GET(req: Request) {
  if (useBackend()) {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    return proxyToBackend("/api/books", { method: "GET", query });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json([]);
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    let rows: BookRow[];
    if (q && category) {
      rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
        FROM books WHERE (title ILIKE ${"%" + q + "%"} OR author ILIKE ${"%" + q + "%"}) AND category = ${category} ORDER BY title` as BookRow[];
    } else if (q) {
      rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
        FROM books WHERE title ILIKE ${"%" + q + "%"} OR author ILIKE ${"%" + q + "%"} ORDER BY title` as BookRow[];
    } else if (category) {
      rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
        FROM books WHERE category = ${category} ORDER BY title` as BookRow[];
    } else {
      rows = await sql`SELECT id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
        FROM books ORDER BY title` as BookRow[];
    }
    return NextResponse.json(rows.map(toBook));
  } catch (e) {
    return NextResponse.json({ error: "Failed to load books" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (useBackend()) {
    return proxyToBackend("/api/books", {
      method: "POST",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await requireSession();
    const body = await req.json();
    const { title, author, isbn, category, totalCopies } = body;
    if (!title || !author) return NextResponse.json({ error: "Title and author required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO books (isbn, title, author, category, total_copies, available_copies)
      VALUES (${isbn || null}, ${title}, ${author}, ${category || null}, ${totalCopies ?? 1}, ${totalCopies ?? 1})
      RETURNING id, isbn, title, author, category, total_copies, available_copies, created_at, updated_at
    `;
    return NextResponse.json(toBook(rows[0] as BookRow));
  } catch (e) {
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 });
  }
}
