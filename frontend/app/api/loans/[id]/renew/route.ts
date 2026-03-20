import { NextResponse } from "next/server";
import { useBackend } from "@/lib/backend";
import { fetchBackend } from "@/lib/proxy";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!useBackend()) {
    return NextResponse.json({ error: "Backend required" }, { status: 503 });
  }
  const res = await fetchBackend(`/api/loans/${id}/renew`, { method: "POST" });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "Renew failed" };
  }
  return NextResponse.json(data, { status: res.status });
}
