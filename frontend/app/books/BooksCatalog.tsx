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
};

export default function BooksCatalog({ hasSession }: { hasSession: boolean }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const useBackendApi = useBackend();

  useEffect(() => {
    const api = hasSession ? "/api/books" : (useBackendApi ? "/api/books/public" : "/api/books");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`${api}?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setBooks(Array.isArray(d) ? d : []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [useBackendApi, hasSession, q]);

  return (
    <div className="space-y-6">
      <input
        type="search"
        placeholder="Search by title or author..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full max-w-md px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-candy-pink outline-none"
      />
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : books.length === 0 ? (
        <div className="bg-white/60 rounded-2xl p-8 text-center text-gray-600">
          <p className="mb-2">No books in the catalog yet.</p>
          {hasSession && (
            <Link href="/dashboard/add" className="text-candy-pink font-bold hover:underline">
              Add the first book →
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/books/${book.id}`}
                className="block bg-white rounded-xl p-4 shadow border border-gray-100 hover:border-candy-mint hover:shadow-lg transition"
              >
                <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-600">{book.author}</p>
                {book.category && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {book.category}
                  </span>
                )}
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
