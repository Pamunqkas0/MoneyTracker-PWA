"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { CategoryExpense } from "@/lib/types";

export function ExpenseChart({ data }: { data: CategoryExpense[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = data.reduce((s, c) => s + c.amount, 0);
  const active = activeIdx !== null ? data[activeIdx] : null;

  // Fungsi pengaman klik untuk perangkat mobile/touchscreen
  const handlePieClick = (index: number) => {
    setActiveIdx(activeIdx === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col justify-between">
        <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <CardTitle className="text-sm sm:text-base font-semibold">
            Distribusi Pengeluaran
          </CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">
            Breakdown per kategori &bull; Total {formatCurrency(total, true)}
          </CardDescription>
        </CardHeader>

        {/* REKAYASA LAYOUT: Flex-col di mobile, Flex-row berdampingan di desktop/tablet */}
        <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-1">
          
          {/* Sisi Kiri / Atas: Donut Chart Container */}
          <div className="relative h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={84}
                    dataKey="amount"
                    paddingAngle={2}
                    onMouseEnter={(_, i) => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                    onClick={(_, i) => handlePieClick(i)}
                    className="cursor-pointer outline-none"
                    animationBegin={150}
                    animationDuration={700}
                  >
                    {data.map((entry, i) => (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        opacity={activeIdx === null || activeIdx === i ? 1 : 0.4}
                        stroke="var(--card)"
                        strokeWidth={1.5}
                        style={{
                          transform: activeIdx === i ? "scale(1.03)" : "scale(1)",
                          transformOrigin: "center",
                          transition: "opacity 0.2s, transform 0.2s",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center text overlay */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              {active ? (
                <div className="animate-fade-in space-y-0.5">
                  <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider truncate max-w-[90px]">
                    {active.label}
                  </p>
                  <p className="text-xs font-bold text-[var(--foreground)] tabular-nums">
                    {active.percentage}%
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] opacity-90 truncate max-w-[95px]">
                    {formatCurrency(active.amount, true)}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-widest font-medium text-[var(--muted-foreground)]">Total</p>
                  <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] tabular-nums leading-tight">
                    {formatCurrency(total, true)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan / Bawah: Grid Legend List */}
          <div className="w-full flex-1 grid grid-cols-2 sm:grid-cols-1 gap-1.5 overflow-y-auto max-h-[160px] sm:max-h-[220px] pr-0.5 custom-scrollbar">
            {data.map((entry, i) => (
              <button
                key={entry.category}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                onClick={() => handlePieClick(i)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs transition-all duration-150 border border-transparent select-none cursor-pointer",
                  activeIdx === i 
                    ? "bg-[var(--muted)] border-[var(--card-border)]/60 shadow-sm" 
                    : "hover:bg-[var(--muted)]/40"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform"
                  style={{ 
                    backgroundColor: entry.color,
                    transform: activeIdx === i ? "scale(1.2)" : "scale(1)"
                  }}
                />
                <span className="truncate text-[var(--muted-foreground)] font-medium flex-1">
                  {entry.label}
                </span>
                <span className="font-bold text-[var(--foreground)] tabular-nums text-[11px] sm:text-xs">
                  {entry.percentage}%
                </span>
              </button>
            ))}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}