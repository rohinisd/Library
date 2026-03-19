import { NextRequest, NextResponse } from "next/server";
import { setTokenCookie } from "@/lib/auth";

/**
 * After OAuth (e.g. Google), the backend redirects here with ?token=...
 * We set the token cookie and redirect to the dashboard.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  }
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }
  await setTokenCookie(token);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
