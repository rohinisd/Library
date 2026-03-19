"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AddBookForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [totalCopies, setTotalCopies] = useState("1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          isbn: isbn || undefined,
          category: category || undefined,
          totalCopies: totalCopies ? parseInt(totalCopies, 10) : 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add book");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-candy-mint space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block font-bold text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Book title"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Author *</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          placeholder="Author name"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">ISBN (optional)</label>
        <input
          type="text"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="e.g. 978-0-..."
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Category (optional)</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Fiction, Tech"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Copies</label>
        <input
          type="number"
          min={1}
          value={totalCopies}
          onChange={(e) => setTotalCopies(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      {error && <p className="text-red-600 font-medium">{error}</p>}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-candy-pink text-white font-black text-lg"
      >
        {loading ? "Adding..." : "Add book"}
      </motion.button>
    </motion.form>
  );
}
