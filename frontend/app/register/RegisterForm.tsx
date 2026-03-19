"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName: displayName || username, password }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(res.status === 503 ? "Server not configured. Try again later." : "Sign up failed.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Sign up failed");
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
      className="w-full max-w-sm space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-mint outline-none transition"
          placeholder="Pick a username"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-mint outline-none transition"
          placeholder="What we call you"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={4}
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-mint outline-none transition"
        />
      </div>
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-candy-mint text-gray-800 font-bold text-lg disabled:opacity-70"
      >
        {loading ? "..." : "Sign up"}
      </motion.button>
    </motion.form>
  );
}
