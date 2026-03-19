import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request) {
  if (useBackend()) {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    return proxyToBackend("/api/stats", { method: "GET", query });
  }
  try {
    const { userId } = await requireSession();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const rows = await sql`
      SELECT task_type, completed, due_date, completed_at
      FROM tasks
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;
    const list = rows as { task_type: string; completed: boolean; due_date: string | null; completed_at: string | null }[];
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStart = startOfWeek.toISOString().slice(0, 10);
    const monthStart = now.toISOString().slice(0, 7) + "-01";
    const yearStart = now.getFullYear() + "-01-01";

    const filterByPeriod = (arr: typeof list, start: string, end?: string) => {
      return arr.filter((t) => {
        const d = t.due_date || t.completed_at?.slice(0, 10);
        if (!d) return false;
        if (end) return d >= start && d <= end;
        return d >= start;
      });
    };

    const daily = filterByPeriod(list, today);
    const weekly = filterByPeriod(list, weekStart, today);
    const monthly = filterByPeriod(list, monthStart, today);
    const yearly = filterByPeriod(list, yearStart, today);

    const toStats = (arr: typeof list) => {
      const total = arr.length;
      const done = arr.filter((t) => t.completed).length;
      return { total, completed: done, pending: total - done };
    };

    return NextResponse.json({
      daily: toStats(daily),
      weekly: toStats(weekly),
      monthly: toStats(monthly),
      yearly: toStats(yearly),
      byType: {
        daily: toStats(list.filter((t) => t.task_type === "daily")),
        weekly: toStats(list.filter((t) => t.task_type === "weekly")),
        monthly: toStats(list.filter((t) => t.task_type === "monthly")),
        yearly: toStats(list.filter((t) => t.task_type === "yearly")),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
