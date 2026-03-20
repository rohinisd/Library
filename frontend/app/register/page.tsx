import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { API_BACKEND_URL } from "@/lib/backend";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // Avoid 500 if cookies/auth throws (e.g. edge runtime)
  }
  if (session) redirect("/dashboard");
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-white/20 bg-white/5 backdrop-blur">
        <Link href="/" className="text-2xl font-black text-gray-900">📚 Library</Link>
        <div className="flex gap-3">
          <Link href="/books" className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-white/20">Browse</Link>
          <Link href="/login" className="px-4 py-2.5 rounded-xl bg-candy-pink text-white font-bold">Sign in</Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black text-candy-mint mb-2">Create account</h1>
        <p className="text-gray-600 mb-6">Sign up to borrow books and manage your loans.</p>
        <RegisterForm googleSignInAvailable={Boolean(API_BACKEND_URL)} />
        <p className="mt-6 text-gray-600 text-sm">
          Already have an account? <Link href="/login" className="text-candy-pink font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
