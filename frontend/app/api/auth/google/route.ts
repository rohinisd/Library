import { NextResponse } from "next/server";
import { API_BACKEND_URL } from "@/lib/backend";

/**
 * Redirects to the backend Google OAuth start URL.
 * Only used when API_BACKEND_URL is set (PaaS backend).
 */
export async function GET() {
  if (!API_BACKEND_URL) {
    return NextResponse.json(
      { error: "Google sign-in is only available when using the external backend (API_BACKEND_URL)." },
      { status: 503 }
    );
  }
  const url = `${API_BACKEND_URL.replace(/\/$/, "")}/api/auth/google`;
  return NextResponse.redirect(url);
}
