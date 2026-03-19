"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
  isbn?: string | null;
};

type Loan = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  dueAt: string;
  returnedAt: string | null;
};

export default function DashboardClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/books").then((r) => r.json()),
      fetch("/api/loans?activeOnly=true").then((r) => r.json()),
    ])
      .then(([b, l]) => {
        setBooks(Array.isArray(b) ? b : []);
        setLoans(Array.isArray(l) ? l : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function checkout(bookId: string) {
    const res = await fetch("/api/loans/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    if (res.ok) {
      const list = await fetch("/api/loans?activeOnly=true").then((r) => r.json());
      setLoans(Array.isArray(list) ? list : []);
      const bList = await fetch("/api/books").then((r) => r.json());
      setBooks(Array.isArray(bList) ? bList : []);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Checkout failed");
    }
  }

  const filteredBooks = books.filter(
    (b) =>
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-black text-gray-800"
      >
        📚 Catalog & My Loans
      </motion.h1>

      {/* Active loans */}
      {loans.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50/90 rounded-2xl p-6 shadow-xl border-2 border-amber-200"
        >
          <h2 className="text-xl font-black text-gray-800 mb-4">📖 Currently borrowed</h2>
          <ul className="space-y-2">
            {loans.map((loan) => {
                const due = loan.dueAt?.slice(0, 10);
                const dueDate = due ? new Date(due) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let badge = "";
                if (dueDate) {
                  dueDate.setHours(0, 0, 0, 0);
                  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysLeft < 0) badge = " (Overdue)";
                  else if (daysLeft <= 3) badge = ` (in ${daysLeft} days)`;
                }
                return (
              <li key={loan.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl p-3 shadow">
                <span className="font-semibold">{loan.bookTitle}</span>
                <span className="text-gray-600 text-sm">Due: {due}{badge}</span>
                <Link
                  href={`/dashboard/loans`}
                  className="text-sm text-candy-pink font-bold hover:underline"
                >
                  Return from My Loans →
                </Link>
              </li>
            );})}
          </ul>
        </motion.section>
      )}

      {/* Search */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>

      {/* Books catalog */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-candy-lavender"
      >
        <h2 className="text-xl font-black text-gray-800 mb-4">All books</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filteredBooks.length === 0 ? (
          <p className="text-gray-500">No books yet. <Link href="/dashboard/add" className="text-candy-pink font-bold">Add one</Link>.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <motion.li
                key={book.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-white to-candy-mint/20 rounded-xl p-4 shadow-lg border-2 border-candy-mint/50"
              >
                <h3 className="font-bold text-gray-800 truncate">{book.title}</h3>
                <p className="text-sm text-gray-600">{book.author}</p>
                {book.category && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-candy-lavender/50 text-gray-700">
                    {book.category}
                  </span>
                )}
                <p className="text-sm mt-2 text-gray-600">
                  {book.availableCopies} / {book.totalCopies} available
                </p>
                <button
                  onClick={() => checkout(book.id)}
                  disabled={book.availableCopies < 1}
                  className="mt-3 w-full py-2 rounded-lg bg-candy-pink text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                >
                  {book.availableCopies >= 1 ? "Borrow" : "Unavailable"}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      <div className="flex justify-center">
        <Link
          href="/dashboard/add"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-candy-pink to-candy-peach text-white font-black text-lg shadow-lg hover:scale-105 transition-transform"
        >
          ➕ Add a book
        </Link>
      </div>
    </div>
  );
}
