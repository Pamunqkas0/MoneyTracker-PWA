"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyData } from "@/lib/types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const income = payload.find(p => p.name === "income")?.value || 0;
  const expense = payload.find(p => p.name === "expense")?.value || 0;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]/95 backdrop-blur-md p-3 shadow-xl max-w-[240px] sm:max-w-none">
      <p className="mb-1.5 text-xs font-semibold text-[var(--muted-foreground)]">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--muted-foreground)] capitalize">
                {entry.name === "income" ? "Pemasukan" : "Pengeluaran"}
              </span>
            </div>
            <span className="font-semibold text-[var(--foreground)] tabular-nums">
              {formatCurrency(entry.value, true)}
            </span>
          </div>
        ))}
      </div>

      {payload.length === 2 && (
        <div className="mt-2 border-t border-[var(--card-border)] pt-2 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-[var(--muted-foreground)]">Selisih</span>
          <span
            className="font-semibold tabular-nums"
            style={{
              color: income >= expense ? "#10b981" : "#f43f5e",
            }}
          >
            {income >= expense ? "+" : "-"}{formatCurrency(Math.abs(income - expense), true)}
          </span>
        </div>
      )}
    </div>
  );
}

// Menambahkan props 'year' agar teks deskripsi dinamis
interface CashflowChartProps {
  data: MonthlyData[];
  year?: number;
}

export function CashflowChart({ data, year }: CashflowChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil tahun aktif dari props atau gunakan fallback tahun berjalan
  const displayYear = year || new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                Arus Kas Bulanan
              </CardTitle>
              <CardDescription className="mt-0.5 text-[11px] sm:text-xs">
                Perbandingan pemasukan dan pengeluaran Jan – Des {displayYear}
              </CardDescription>
            </div>

            {/* Custom Legend Layout */}
            <div className="flex items-center gap-4 text-[11px] sm:text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[var(--muted-foreground)]">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-[var(--muted-foreground)]">Pengeluaran</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-1 sm:px-6 pt-2 pb-4">
          <div className="h-[240px] sm:h-[280px] w-full mt-4 text-[10px] sm:text-xs select-none">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4"
                    stroke="var(--card-border)"
                    vertical={false}
                    opacity={0.5}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />

                  <YAxis
                    tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v === 0 ? "0" : `${(v / 1_000_000).toFixed(0)}jt`}
                    dx={5}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "var(--card-border)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                    dot={false}
                    activeDot={{ r: 4.5, fill: "#10b981", strokeWidth: 1.5, stroke: "var(--card)" }}
                    animationDuration={800}
                  />

                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#expenseGradient)"
                    dot={false}
                    activeDot={{ r: 4.5, fill: "#f43f5e", strokeWidth: 1.5, stroke: "var(--card)" }}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}