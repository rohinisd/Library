import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav - solid bar so Sign in / Sign up are always visible */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 bg-white border-b-2 border-gray-200 shadow-sm">
        <Link href="/" className="text-2xl font-black text-gray-900">
          📚 Library
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/books" className="px-3 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">
            Browse
          </Link>
          <Link href="/login" className="px-4 py-2.5 rounded-xl font-bold text-gray-800 border-2 border-gray-300 hover:border-candy-pink hover:bg-gray-50">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2.5 rounded-xl bg-candy-pink text-white font-bold shadow-md hover:opacity-90">
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 max-w-3xl leading-tight mb-4">
          Borrow books. Track loans. <span className="text-transparent bg-clip-text bg-gradient-to-r from-candy-pink to-candy-peach">Simple.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-xl mb-10">
          Your library in one place. Browse the catalog, check out books, and never miss a due date.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-gray-800 text-white font-bold text-lg shadow-xl hover:bg-gray-900 transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 rounded-2xl bg-candy-pink text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform"
          >
            Sign up
          </Link>
          <Link
            href="/books"
            className="px-8 py-4 rounded-2xl bg-white text-gray-800 font-bold text-lg border-2 border-gray-300 hover:border-candy-mint transition"
          >
            Browse catalog
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 md:py-20 bg-white/40 border-t border-white/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-12">
            Why Library?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Browse & search</h3>
              <p className="text-gray-600">Find any book by title, author, or category. One place for the whole catalog.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Borrow & return</h3>
              <p className="text-gray-600">Check out with one click. Return when done. Due dates and history in your dashboard.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Your account</h3>
              <p className="text-gray-600">Sign up with email or Google. Your loans and profile in one secure place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center border-t border-white/20">
        <p className="text-gray-600 mb-4">Ready to start?</p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 rounded-2xl bg-candy-mint text-gray-900 font-bold text-lg shadow-lg hover:scale-105 transition-transform"
        >
          Sign up free
        </Link>
      </section>

      <footer className="py-6 text-center text-gray-500 text-sm border-t border-white/20">
        Library – Book & loan management. No credit card required.
      </footer>
    </div>
  );
}
