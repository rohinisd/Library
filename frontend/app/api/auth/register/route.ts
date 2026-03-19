import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession, setTokenCookie } from "@/lib/auth";
import { useBackend } from "@/lib/backend";
import { fetchBackend } from "@/lib/proxy";

export async function POST(req: Request) {
  if (!useBackend() && !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Server not configured. Set API_BACKEND_URL or DATABASE_URL." },
      { status: 503 }
    );
  }
  if (useBackend()) {
    const res = await fetchBackend("/api/auth/register", {
      method: "POST",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
    const data = (await res.json()) as { ok?: boolean; token?: string; error?: string };
    if (data.token) await setTokenCookie(data.token);
    return NextResponse.json(data.ok ? { ok: true } : data, { status: res.status });
  }
  try {
    const { username, displayName, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (username, password_hash, display_name)
      VALUES (${username}, ${hash}, ${displayName || username})
      RETURNING id, username, display_name
    `;
    const user = rows[0] as { id: string };
    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "23505") return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
  }
}
