"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminChart({ data }: { data: { name: string; registrations: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={false} width={28} />
          <Tooltip />
          <Bar dataKey="registrations" fill="#121316" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
