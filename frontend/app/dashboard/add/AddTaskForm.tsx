"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const TYPES = [
  { value: "daily", label: "Daily", emoji: "📅" },
  { value: "weekly", label: "Weekly", emoji: "📆" },
  { value: "monthly", label: "Monthly", emoji: "🗓️" },
  { value: "yearly", label: "Yearly", emoji: "🎯" },
];

export default function AddTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("daily");
  const [dueDate, setDueDate] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          taskType,
          dueDate: dueDate || null,
          timeAllotmentMinutes: timeMinutes ? parseInt(timeMinutes, 10) : 0,
          reminderAt: reminderAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-candy-mint space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block font-bold text-gray-700 mb-1">Task name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Read for 15 mins"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <motion.button
              key={t.value}
              type="button"
              onClick={() => setTaskType(t.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl font-bold ${
                taskType === t.value ? "bg-candy-pink text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {t.emoji} {t.label}
            </motion.button>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">Due date (optional)</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">⏱️ Time (minutes, optional)</label>
        <input
          type="number"
          min={0}
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          placeholder="e.g. 15"
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      <div>
        <label className="block font-bold text-gray-700 mb-1">🔔 Remind me at (optional)</label>
        <input
          type="datetime-local"
          value={reminderAt}
          onChange={(e) => setReminderAt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-candy-lavender focus:border-candy-pink outline-none"
        />
      </div>
      {error && <p className="text-red-600 font-medium">{error}</p>}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl bg-candy-pink text-white font-black text-lg"
      >
        {loading ? "Adding..." : "Add task"}
      </motion.button>
    </motion.form>
  );
}
