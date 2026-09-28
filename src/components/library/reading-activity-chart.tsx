"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Release D — personal reading activity, last 14 days (FD-12).
 * Single violet series (read events for THIS profile), same visual language
 * as the admin ActivityChart so both views feel like one product.
 */
export function ReadingActivityChart({
  data,
}: {
  data: { day: string; label: string; events: number }[];
}) {
  return (
    <div
      className="h-40 w-full"
      dir="ltr"
      role="img"
      aria-label="رسم بياني: نشاط قراءتك خلال أسبوعين"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="streakFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9B7BFF" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#9B7BFF" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,148,163,0.15)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94949F" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: "#94949F" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "rgba(155,123,255,0.35)" }}
            contentStyle={{
              background: "#15151E",
              border: "1px solid rgba(148,148,163,0.25)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#EDEDF2" }}
            formatter={(value: number | string) => [value, "نشاط القراءة"]}
          />
          <Area
            type="monotone"
            dataKey="events"
            stroke="#9B7BFF"
            strokeWidth={2}
            fill="url(#streakFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
