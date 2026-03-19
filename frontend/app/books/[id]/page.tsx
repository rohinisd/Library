import Link from "next/link";
import { getSession } from "@/lib/auth";
import BookDetailClient from "./BookDetailClient";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-white/20 bg-white/5 backdrop-blur">
        <Link href="/books" className="text-2xl font-black text-gray-900">
          📚 Library
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/books" className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-white/20">
            Catalog
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/books" className="text-sm text-gray-600 hover:underline mb-6 inline-block">
          ← Back to catalog
        </Link>
        <BookDetailClient bookId={id} hasSession={!!session} />
      </main>
    </div>
  );
}
