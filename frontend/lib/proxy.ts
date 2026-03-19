import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BACKEND_URL } from "./backend";

const TOKEN_COOKIE = "habit_token";

export async function getBackendToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

/** Forward request to backend; returns the fetch Response so the route can read body and status. */
export async function fetchBackend(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {}
): Promise<Response> {
  const base = API_BACKEND_URL.replace(/\/$/, "");
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (init.query) {
    Object.entries(init.query).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const { query: _q, ...rest } = init;
  const token = await getBackendToken();
  const headers = new Headers(rest.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url.toString(), { ...rest, headers });
}

/** Proxy to backend and return a NextResponse with the same status and body. */
export async function proxyToBackend(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {}
): Promise<NextResponse> {
  const res = await fetchBackend(path, init);
  const text = await res.text();
  let body: unknown = text;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return NextResponse.json(body, { status: res.status });
}
