"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import type { BudgetItemRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";

export function BudgetProgress({
  budgetItems,
  availableCategories,
}: {
  budgetItems: BudgetItemRow[];
  availableCategories: AvailableTransactionCategories;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Target className="h-4 w-4 text-emerald-500" />
            Budget Bulanan
          </CardTitle>
          <CardDescription className="text-xs">Progres pengeluaran per kategori · Juni 2026</CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="flex flex-col gap-2">
            {budgetItems.map((item, i) => {
              const pct = Math.min(Math.round((item.spent / item.limit) * 100), 999);
              const isOver = pct >= 100;
              const isWarning = pct >= 80 && pct < 100;
              const meta = availableCategories.bySlug[item.category] || { emoji: "📝", name: item.category };

              const barColor = isOver ? "#f43f5e" : isWarning ? "#f59e0b" : "var(--primary)";
              const pctColor = isOver
                ? "text-rose-500"
                : isWarning
                  ? "text-amber-500"
                  : "text-[var(--foreground)]";

              return (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className={cn(
                    "py-3",
                    i < budgetItems.length - 1 && "border-b border-[var(--card-border)]/50"
                  )}
                >
                  {/* Row 1: Label & percentage */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AnimatedEmoji emoji={meta.emoji} size={16} />
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">{meta.name}</span>
                      {(isOver || isWarning) && (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            isOver ? "bg-rose-500 animate-pulse" : "bg-amber-400"
                          )}
                        />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5 shrink-0 ml-3">
                      <span className="text-[11px] text-[var(--muted-foreground)] tabular-nums">
                        {formatCurrency(item.spent, true)}<span className="opacity-50"> / </span>{formatCurrency(item.limit, true)}
                      </span>
                      <span className={cn("text-xs font-semibold tabular-nums w-8 text-right", pctColor)}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Progress bar */}
                  <Progress
                    value={Math.min(pct, 100)}
                    indicatorColor={barColor}
                    className="h-1.5 rounded-full"
                  />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
