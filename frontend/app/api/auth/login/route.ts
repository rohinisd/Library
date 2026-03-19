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
    const res = await fetchBackend("/api/auth/login", {
      method: "POST",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
    const data = (await res.json()) as { ok?: boolean; token?: string; error?: string };
    if (data.token) await setTokenCookie(data.token);
    return NextResponse.json(data.ok ? { ok: true } : data, { status: res.status });
  }
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    const rows = await sql`SELECT id, username, display_name, password_hash FROM users WHERE username = ${username} LIMIT 1`;
    const user = rows[0] as { id: string; username: string; display_name: string | null; password_hash: string } | undefined;
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
    await setSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
