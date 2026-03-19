import { NextResponse } from "next/server";
import { useBackend } from "@/lib/backend";
import { fetchBackend } from "@/lib/proxy";

/** Public catalog: no auth. Used for landing and /books when logged out. */
export async function GET(req: Request) {
  if (useBackend()) {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    const res = await fetchBackend("/api/books/public", { method: "GET", query });
    const data = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(data) ? data : []);
  }
  return NextResponse.json([]);
}
