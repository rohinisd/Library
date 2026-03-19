"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Task = {
  id: string;
  title: string;
  task_type: string;
  due_date: string | null;
  time_allotment_minutes: number;
  reminder_at: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export default function TaskList({ type }: { type: "daily" | "weekly" | "monthly" | "yearly" }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/tasks?type=${type}`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), [type]);

  async function toggle(id: string, completed: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <ul className="space-y-3">
      <AnimatePresence>
        {tasks.map((task, i) => (
          <motion.li
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-4 border-4 flex items-center gap-3 ${
              task.completed ? "bg-green-100 border-green-300" : "bg-white border-candy-lavender"
            } shadow-md`}
          >
            <button
              type="button"
              onClick={() => toggle(task.id, !task.completed)}
              className={`w-8 h-8 rounded-lg flex-shrink-0 font-bold text-white ${
                task.completed ? "bg-green-500" : "bg-candy-pink"
              }`}
            >
              {task.completed ? "✓" : ""}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                {task.title}
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                {task.due_date && <span>📅 {task.due_date}</span>}
                {task.time_allotment_minutes > 0 && <span>⏱️ {task.time_allotment_minutes} min</span>}
                {task.reminder_at && <span>🔔 Reminder set</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(task.id)}
              className="text-red-500 hover:text-red-700 font-bold px-2"
            >
              🗑️
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
      {tasks.length === 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 text-center py-8">
          No tasks yet. Add one!
        </motion.p>
      )}
    </ul>
  );
}
