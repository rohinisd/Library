"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error?.message ?? error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-4 text-center max-w-md">
        {error?.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl bg-candy-pink text-white font-semibold hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
