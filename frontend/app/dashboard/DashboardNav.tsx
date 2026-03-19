"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardNav({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Catalog" },
    { href: "/dashboard/loans", label: "My Loans" },
    { href: "/dashboard/add", label: "Add Book" },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur shadow-lg rounded-b-2xl border-b-4 border-candy-pink">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link href="/dashboard" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-candy-pink to-candy-peach">
          📚 Library
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.span
                className={`block px-4 py-2 rounded-xl font-bold transition-colors ${
                  pathname === link.href
                    ? "bg-candy-pink text-white"
                    : "bg-candy-lemon/50 text-gray-800 hover:bg-candy-lemon"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.label}
              </motion.span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium hidden sm:inline">Hi, {username}!</span>
          <motion.button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-candy-grape/30 text-gray-700 font-bold hover:bg-candy-grape/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
