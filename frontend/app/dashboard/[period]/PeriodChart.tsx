"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;

export default function PeriodChart({ period }: { period: (typeof PERIODS)[number] }) {
  const [stats, setStats] = useState<{ completed: number; pending: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data[period]))
      .catch(() => setStats(null));
  }, [period]);

  if (!stats) return null;

  const data = [
    { name: "Done ✅", value: stats.completed, fill: "#22c55e" },
    { name: "To do 📋", value: stats.pending, fill: "#fbbf24" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="bg-white/90 rounded-2xl p-4 shadow-lg border-4 border-candy-peach">
      <p className="font-bold text-gray-700 mb-2 capitalize">This {period} progress</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
