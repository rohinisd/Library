import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import TaskList from "@/components/TaskList";
import PeriodChart from "./PeriodChart";

const PERIODS = {
  daily: { label: "Daily", emoji: "📅", bg: "bg-candy-pink", border: "border-candy-pink" },
  weekly: { label: "Weekly", emoji: "📆", bg: "bg-candy-mint", border: "border-candy-mint" },
  monthly: { label: "Monthly", emoji: "🗓️", bg: "bg-candy-lemon", border: "border-candy-lemon" },
  yearly: { label: "Yearly", emoji: "🎯", bg: "bg-candy-sky", border: "border-candy-sky" },
} as const;

type PageProps = { params: Promise<{ period: string }> };

export default async function PeriodPage({ params }: PageProps) {
  await requireSession();
  const { period } = await params;
  if (!(period in PERIODS)) return null;
  const meta = PERIODS[period as keyof typeof PERIODS];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-3xl font-black text-gray-800 bg-white/90 rounded-2xl p-4 inline-block border-4 ${meta.border}`}
      >
        {meta.emoji} {meta.label} tasks
      </motion.h1>

      <PeriodChart period={period as keyof typeof PERIODS} />

      <section className="bg-white/90 rounded-2xl p-6 shadow-xl border-4 border-candy-lavender">
        <TaskList type={period as "daily" | "weekly" | "monthly" | "yearly"} />
      </section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
        <Link
          href="/dashboard/add"
          className="px-6 py-3 rounded-xl bg-candy-pink text-white font-bold shadow-lg hover:scale-105 transition-transform"
        >
          ➕ Add task
        </Link>
      </motion.div>
    </div>
  );
}
