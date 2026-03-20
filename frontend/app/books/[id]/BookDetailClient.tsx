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
  isbn?: string | null;
  description?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  language?: string | null;
  shelfLocation?: string | null;
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

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!book) notFound();

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 max-w-3xl">
      <div className="flex flex-wrap gap-2 mb-2">
        {book.category && (
          <span className="px-3 py-1 rounded-full bg-candy-lavender/50 text-gray-800 text-sm font-medium">{book.category}</span>
        )}
        {book.shelfLocation && (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">Shelf {book.shelfLocation}</span>
        )}
      </div>
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{book.title}</h1>
      <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm mb-6 border-t border-b border-gray-100 py-4">
        {book.isbn && (
          <>
            <dt className="text-gray-500">ISBN</dt>
            <dd className="font-mono text-gray-800">{book.isbn}</dd>
          </>
        )}
        {book.publicationYear != null && (
          <>
            <dt className="text-gray-500">Publication</dt>
            <dd className="text-gray-800">{book.publicationYear}</dd>
          </>
        )}
        {book.publisher && (
          <>
            <dt className="text-gray-500">Publisher</dt>
            <dd className="text-gray-800">{book.publisher}</dd>
          </>
        )}
        {book.language && (
          <>
            <dt className="text-gray-500">Language</dt>
            <dd className="text-gray-800">{book.language}</dd>
          </>
        )}
        <dt className="text-gray-500">Copies</dt>
        <dd className="text-gray-800">
          {book.availableCopies} available of {book.totalCopies} total
        </dd>
      </dl>
      {book.description && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">About this book</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{book.description}</p>
        </div>
      )}
      {hasSession ? (
        <Link href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-candy-pink text-white font-bold hover:opacity-90">
          Borrow from dashboard
        </Link>
      ) : (
        <p className="text-gray-600">
          <Link href="/login" className="text-candy-pink font-bold hover:underline">
            Sign in
          </Link>{" "}
          to borrow this book.
        </p>
      )}
    </div>
  );
}
