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
  const [description, setDescription] = useState("");
  const [publicationYear, setPublicationYear] = useState("");
  const [publisher, setPublisher] = useState("");
  const [language, setLanguage] = useState("English");
  const [shelfLocation, setShelfLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title,
        author,
        isbn: isbn || undefined,
        category: category || undefined,
        totalCopies: totalCopies ? parseInt(totalCopies, 10) : 1,
        description: description || undefined,
        publisher: publisher || undefined,
        language: language || "English",
        shelfLocation: shelfLocation || undefined,
      };
      const y = publicationYear.trim();
      if (y) body.publicationYear = parseInt(y, 10);
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="grid md:grid-cols-2 gap-4">
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
          <label className="block font-bold text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Fiction, Technology"
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Description / summary</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional annotation for the catalog (OPAC-style)"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none resize-y min-h-[80px]"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Publication year</label>
          <input
            type="number"
            value={publicationYear}
            onChange={(e) => setPublicationYear(e.target.value)}
            placeholder="e.g. 2020"
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Publisher</label>
          <input
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="Publisher name"
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Shelf / call number</label>
          <input
            type="text"
            value={shelfLocation}
            onChange={(e) => setShelfLocation(e.target.value)}
            placeholder="e.g. FIC-LEE-004"
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
          />
        </div>
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
