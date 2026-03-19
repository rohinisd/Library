import Link from "next/link";
import { getSession } from "@/lib/auth";
import BooksCatalog from "./BooksCatalog";

export const metadata = {
  title: "Browse Books – Library",
  description: "Browse the library catalog. Sign in to borrow books.",
};

export default async function BooksPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-white/20 bg-white/5 backdrop-blur">
        <Link href="/" className="text-2xl font-black text-gray-900">
          📚 Library
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/books" className="px-4 py-2 rounded-xl font-semibold text-gray-900 bg-white/30">
            Browse
          </Link>
          {session ? (
            <Link href="/dashboard" className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-white/20">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-white/20">
                Sign in
              </Link>
              <Link href="/register" className="px-4 py-2.5 rounded-xl bg-candy-pink text-white font-bold">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Browse catalog</h1>
        <p className="text-gray-600 mb-6">
          {session ? "You can borrow any available book from your dashboard." : "Sign in to borrow books and manage your loans."}
        </p>
        <BooksCatalog hasSession={!!session} />
      </main>
    </div>
  );
}
