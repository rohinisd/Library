"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBackend } from "@/lib/backend";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
  publicationYear?: number | null;
  publisher?: string | null;
  shelfLocation?: string | null;
};

export default function BooksCatalog({ hasSession }: { hasSession: boolean }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("title");
  const useBackendApi = useBackend();

  useEffect(() => {
    fetch("/api/library/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const api = hasSession ? "/api/books" : useBackendApi ? "/api/books/public" : "/api/books";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    setLoading(true);
    fetch(`${api}?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBooks(Array.isArray(d) ? d : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [useBackendApi, hasSession, q, category, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
        <input
          type="search"
          placeholder="Search title, author, or description..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-candy-pink outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white min-w-[180px]"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white min-w-[160px]"
          aria-label="Sort by"
        >
          <option value="title">Sort: Title</option>
          <option value="author">Sort: Author</option>
          <option value="year">Sort: Year (newest)</option>
          <option value="newest">Sort: Recently added</option>
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading catalog…</p>
      ) : books.length === 0 ? (
        <div className="bg-white/60 rounded-2xl p-8 text-center text-gray-600">
          <p className="mb-2">No books match your filters.</p>
          {hasSession && (
            <Link href="/dashboard/add" className="text-candy-pink font-bold hover:underline">
              Add a book →
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/books/${book.id}`}
                className="block bg-white rounded-xl p-4 shadow border border-gray-100 hover:border-candy-mint hover:shadow-lg transition h-full"
              >
                <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-600">{book.author}</p>
                {book.category && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {book.category}
                  </span>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {[book.publicationYear, book.publisher].filter(Boolean).join(" · ")}
                  {book.shelfLocation ? ` · Shelf ${book.shelfLocation}` : ""}
                </p>
                <p className="text-sm mt-2 text-gray-500">
                  {book.availableCopies} of {book.totalCopies} available
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
