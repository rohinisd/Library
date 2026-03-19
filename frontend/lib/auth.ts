import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { sql } from "./db";
import { useBackend, JWT_SECRET } from "./backend";

const SESSION_COOKIE = "habit_session";
const TOKEN_COOKIE = "habit_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type Session = { userId: string; username: string; displayName: string | null };

async function getSessionFromToken(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; displayName?: string };
    return {
      userId: payload.userId,
      username: payload.username,
      displayName: payload.displayName ?? null,
    };
  } catch {
    return null;
  }
}

async function getSessionFromDb(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  if (!process.env.DATABASE_URL) return null;
  try {
    const rows = await sql`SELECT id, username, display_name FROM users WHERE id = ${sessionId}::uuid LIMIT 1`;
    const u = rows[0] as { id: string; username: string; display_name: string | null } | undefined;
    if (!u) return null;
    return { userId: u.id, username: u.username, displayName: u.display_name };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  if (useBackend()) return getSessionFromToken();
  return getSessionFromDb();
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function setTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(TOKEN_COOKIE);
}
