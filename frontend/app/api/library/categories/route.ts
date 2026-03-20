import { NextResponse } from "next/server";
import { API_BACKEND_URL } from "@/lib/backend";

export async function GET() {
  if (!API_BACKEND_URL) return NextResponse.json([]);
  try {
    const res = await fetch(`${API_BACKEND_URL.replace(/\/$/, "")}/api/library/categories`, {
      next: { revalidate: 120 },
    });
    const data = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
