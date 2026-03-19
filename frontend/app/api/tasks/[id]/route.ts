import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { useBackend } from "@/lib/backend";
import { proxyToBackend } from "@/lib/proxy";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (useBackend()) {
    return proxyToBackend(`/api/tasks/${id}`, {
      method: "PATCH",
      body: await req.text(),
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { userId } = await requireSession();
    const body = await req.json();
    const { completed, title, dueDate, timeAllotmentMinutes, reminderAt } = body;
    if (typeof completed === "boolean") {
      await sql`UPDATE tasks SET completed = ${completed}, completed_at = ${completed ? new Date().toISOString() : null}, updated_at = NOW() WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    }
    if (title !== undefined) await sql`UPDATE tasks SET title = ${title}, updated_at = NOW() WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    if (dueDate !== undefined) await sql`UPDATE tasks SET due_date = ${dueDate || null}, updated_at = NOW() WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    if (timeAllotmentMinutes !== undefined) await sql`UPDATE tasks SET time_allotment_minutes = ${timeAllotmentMinutes}, updated_at = NOW() WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    if (reminderAt !== undefined) await sql`UPDATE tasks SET reminder_at = ${reminderAt || null}, updated_at = NOW() WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    const rows = await sql`SELECT id, title, task_type, due_date, time_allotment_minutes, reminder_at, completed, completed_at, created_at FROM tasks WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    return NextResponse.json(rows[0] ?? { error: "Not found" }, { status: rows[0] ? 200 : 404 });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (useBackend()) {
    return proxyToBackend(`/api/tasks/${id}`, { method: "DELETE" });
  }
  try {
    const { userId } = await requireSession();
    await sql`DELETE FROM tasks WHERE id = ${id}::uuid AND user_id = ${userId}::uuid`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
