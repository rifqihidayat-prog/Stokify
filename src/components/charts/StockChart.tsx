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

export type StockChartData = { name: string; current: number; min: number }[];

export function StockChart({ data }: { data: StockChartData }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222938" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={{ stroke: "#222938" }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
            contentStyle={{
              backgroundColor: "#121620",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              fontSize: 12,
              color: "#f4f4f5",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
              padding: "10px 14px",
            }}
            itemStyle={{ color: "#f4f4f5", fontSize: 12 }}
            labelStyle={{ color: "#fbbf24", fontWeight: 700, marginBottom: 6, fontSize: 13 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar
            dataKey="current"
            name="Stok Saat Ini"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="min"
            name="Min. Stok Pusat"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

