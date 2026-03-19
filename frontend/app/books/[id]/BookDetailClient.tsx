"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
};

export default function BookDetailClient({ bookId, hasSession }: { bookId: string; hasSession: boolean }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/books/${bookId}/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [bookId]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!book) notFound();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{book.title}</h1>
      <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
      {book.category && (
        <span className="inline-block px-3 py-1 rounded-full bg-candy-lavender/50 text-gray-700 text-sm mb-4">
          {book.category}
        </span>
      )}
      <p className="text-gray-600 mb-6">
        {book.availableCopies} of {book.totalCopies} copies available
      </p>
      {hasSession ? (
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-xl bg-candy-pink text-white font-bold hover:opacity-90"
        >
          Borrow from dashboard
        </Link>
      ) : (
        <p className="text-gray-600">
          <Link href="/login" className="text-candy-pink font-bold hover:underline">Sign in</Link>
          {" "}to borrow this book.
        </p>
      )}
    </div>
  );
}
