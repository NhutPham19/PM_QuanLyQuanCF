import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { vnd } from "@/lib/format";

export interface ChartDayData {
  date: string;
  displayDate: string;
  revenue: number;
  expense: number;
}

interface RevenueChartProps {
  data: ChartDayData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="displayDate"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748B" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              vnd(Number(value) || 0),
              name === "revenue" ? "Doanh thu" : "Chi phí",
            ]}
            contentStyle={{
              backgroundColor: "#0F172A",
              borderRadius: "16px",
              border: "none",
              color: "#FFF",
              fontSize: "12px",
              padding: "10px 14px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            }}
            labelStyle={{ color: "#94A3B8", fontWeight: 600, marginBottom: "4px" }}
          />
          <Bar
            dataKey="revenue"
            name="revenue"
            fill="#6366F1"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="#FB923C"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
