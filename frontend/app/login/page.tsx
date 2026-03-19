import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { API_BACKEND_URL } from "@/lib/backend";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  const googleLoginAvailable = Boolean(API_BACKEND_URL);
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-white/20 bg-white/5 backdrop-blur">
        <a href="/" className="text-2xl font-black text-gray-900">📚 Library</a>
        <div className="flex gap-3">
          <a href="/books" className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-white/20">Browse</a>
          <a href="/register" className="px-4 py-2.5 rounded-xl bg-candy-pink text-white font-bold">Sign up</a>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black text-candy-pink mb-2">Sign in</h1>
        <p className="text-gray-600 mb-6">Welcome back. Sign in to borrow and manage your loans.</p>
        <LoginForm googleLoginAvailable={googleLoginAvailable} />
        <p className="mt-6 text-gray-600 text-sm">
          No account? <a href="/register" className="text-candy-pink font-bold hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
