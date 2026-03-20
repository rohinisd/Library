"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import GoogleSignInButton, { GoogleSignInDivider } from "@/components/GoogleSignInButton";

type Props = { googleLoginAvailable?: boolean };
export default function LoginForm({ googleLoginAvailable = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(err === "access_denied" ? "Sign-in was cancelled." : err);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 503 ? (data.error || "Server not configured. Please try again later.") : (data.error || "Login failed"));
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm space-y-4"
    >
      {googleLoginAvailable && <GoogleSignInButton />}
      {googleLoginAvailable && <GoogleSignInDivider />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink focus:ring-2 focus:ring-candy-pink/30 outline-none transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink focus:ring-2 focus:ring-candy-pink/30 outline-none transition"
          />
        </div>
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-candy-pink text-white font-bold text-lg disabled:opacity-70"
        >
          {loading ? "..." : "Login"}
        </motion.button>
      </form>
    </motion.div>
  );
}
