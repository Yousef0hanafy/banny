"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardPoint } from "@/lib/queries";

/** Activity chart (Release B): daily reads/logins/publishes from seeded events. */
export function ActivityChart({ data }: { data: DashboardPoint[] }) {
  const shaped = data.map((d) => ({
    ...d,
    label: `${Number(d.day.slice(8, 10))}/${Number(d.day.slice(5, 7))}`,
  }));

  return (
    <div className="h-64 w-full" dir="ltr" role="img" aria-label="رسم بياني: أحداث القراءة وتسجيل الدخول والنشر خلال أسبوعين">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={shaped} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,148,163,0.15)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94949F" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: "#94949F" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(155,123,255,0.08)" }}
            contentStyle={{ background: "#15151E", border: "1px solid rgba(148,148,163,0.25)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#EDEDF2" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="reads" name="قراءات" fill="#9B7BFF" radius={[3, 3, 0, 0]} />
          <Bar dataKey="logins" name="دخول" fill="#5FCB9B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="publish" name="نشر" fill="#DDBB77" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
