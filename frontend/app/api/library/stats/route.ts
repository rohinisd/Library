import { NextResponse } from "next/server";
import { API_BACKEND_URL } from "@/lib/backend";

/** Public: catalog stats for landing page */
export async function GET() {
  if (!API_BACKEND_URL) {
    return NextResponse.json({
      totalTitles: 0,
      totalCopies: 0,
      availableCopies: 0,
      categoryCount: 0,
    });
  }
  try {
    const res = await fetch(`${API_BACKEND_URL.replace(/\/$/, "")}/api/library/stats`, {
      next: { revalidate: 60 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({
        totalTitles: 0,
        totalCopies: 0,
        availableCopies: 0,
        categoryCount: 0,
      });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      totalTitles: 0,
      totalCopies: 0,
      availableCopies: 0,
      categoryCount: 0,
    });
  }
}
