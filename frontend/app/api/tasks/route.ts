import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

type TaskRow = { id: string; title: string; task_type: string; due_date: string | null; time_allotment_minutes: number; reminder_at: string | null; completed: boolean; completed_at: string | null; created_at: string };

export async function GET(req: Request) {
  if (useBackend()) {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });
    return proxyToBackend("/api/tasks", { method: "GET", query });
  }
  try {
    const { userId } = await requireSession();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const rows = await sql`SELECT id, title, task_type, due_date, time_allotment_minutes, reminder_at, completed, completed_at, created_at FROM tasks WHERE user_id = ${userId}::uuid ORDER BY due_date ASC NULLS LAST, created_at DESC`;
    let list = rows as TaskRow[];
    if (type) list = list.filter((t) => t.task_type === type);
    if (from) list = list.filter((t) => !t.due_date || t.due_date >= from);
    if (to) list = list.filter((t) => !t.due_date || t.due_date <= to);
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (useBackend()) {
    return proxyToBackend("/api/tasks", {
      method: "POST",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { userId } = await requireSession();
    const body = await req.json();
    const { title, taskType, dueDate, timeAllotmentMinutes, reminderAt } = body;
    if (!title || !taskType) return NextResponse.json({ error: "Title and type required" }, { status: 400 });
    const validTypes = ["daily", "weekly", "monthly", "yearly"];
    if (!validTypes.includes(taskType)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    const rows = await sql`
      INSERT INTO tasks (user_id, title, task_type, due_date, time_allotment_minutes, reminder_at)
      VALUES (${userId}::uuid, ${title}, ${taskType}, ${dueDate || null}, ${timeAllotmentMinutes ?? 0}, ${reminderAt || null})
      RETURNING id, title, task_type, due_date, time_allotment_minutes, reminder_at, completed, completed_at, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
