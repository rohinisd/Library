"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Loan = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  dueAt: string;
  returnedAt: string | null;
  borrowedAt?: string;
};

export default function LoansClient() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);

  function load() {
    fetch("/api/loans")
      .then((r) => r.json())
      .then((data) => setLoans(Array.isArray(data) ? data : []))
      .catch(() => setLoans([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function returnBook(loanId: string) {
    setReturning(loanId);
    try {
      const res = await fetch(`/api/loans/${loanId}/return`, { method: "POST" });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Return failed");
      }
    } finally {
      setReturning(null);
    }
  }

  const active = loans.filter((l) => !l.returnedAt);
  const past = loans.filter((l) => l.returnedAt);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-amber-50/90 rounded-2xl p-6 shadow-xl border-2 border-amber-200"
      >
        <h2 className="text-xl font-black text-gray-800 mb-4">Currently borrowed</h2>
        {active.length === 0 ? (
          <p className="text-gray-600">
            No active loans. <Link href="/dashboard" className="text-candy-pink font-bold">Browse catalog</Link> to borrow.
          </p>
        ) : (
          <ul className="space-y-3">
            {active.map((loan) => (
              <li
                key={loan.id}
                className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl p-4 shadow"
              >
                <div>
                  <p className="font-bold text-gray-800">{loan.bookTitle}</p>
                  <p className="text-sm text-gray-600">{loan.bookAuthor}</p>
                  {(() => {
                  const due = loan.dueAt?.slice(0, 10);
                  if (!due) return null;
                  const dueDate = new Date(due);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDate.setHours(0, 0, 0, 0);
                  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;
                  const isSoon = daysLeft >= 0 && daysLeft <= 3;
                  return (
                    <p className={`text-sm mt-1 ${isOverdue ? "text-red-600 font-semibold" : isSoon ? "text-amber-700 font-medium" : "text-amber-700"}`}>
                      Due: {due} {isOverdue ? "(Overdue)" : isSoon ? `(in ${daysLeft} days)` : ""}
                    </p>
                  );
                })()}
                </div>
                <button
                  onClick={() => returnBook(loan.id)}
                  disabled={returning === loan.id}
                  className="px-4 py-2 rounded-lg bg-candy-mint text-gray-800 font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {returning === loan.id ? "Returning..." : "Return"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {past.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-2xl p-6 shadow border border-gray-200"
        >
          <h2 className="text-lg font-black text-gray-700 mb-4">Returned</h2>
          <ul className="space-y-2">
            {past.map((loan) => (
              <li key={loan.id} className="flex justify-between items-center text-gray-600 text-sm py-2 border-b border-gray-200 last:border-0">
                <span>{loan.bookTitle} — {loan.bookAuthor}</span>
                <span>Returned {loan.returnedAt?.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </div>
  );
}
