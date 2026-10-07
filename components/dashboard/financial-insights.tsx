"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/types";
import { generateFinancialInsightsAction } from "@/app/actions/insights";

const insightStyles = {
  warning: {
    bg: "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/15 dark:border-amber-500/20",
    label: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    text: "Perhatian",
  },
  success: {
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/20",
    label: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    text: "Pencapaian",
  },
  info: {
    bg: "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/15 dark:border-blue-500/20",
    label: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    text: "Informasi",
  },
  tip: {
    bg: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/15 dark:border-purple-500/20",
    label: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    text: "Tips",
  },
};

interface FinancialInsightsProps {
  initialInsights?: Insight[];
  month?: number;
  year?: number;
}

const InsightSkeleton = () => (
  <>
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="flex flex-col justify-between rounded-xl border border-[var(--card-border)] bg-gray-500/5 dark:bg-gray-500/10 p-3.5 h-[84px] animate-pulse"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-14 bg-gray-200/50 dark:bg-gray-800/50 rounded-md" />
            <div className="h-4 w-4 bg-gray-200/50 dark:bg-gray-800/50 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-gray-200/50 dark:bg-gray-800/50 rounded-md" />
            <div className="h-3 w-3/4 bg-gray-200/50 dark:bg-gray-800/50 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </>
);

export function FinancialInsights({ initialInsights = [], month, year }: FinancialInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>(initialInsights);
  const [isGenerating, setIsGenerating] = useState<boolean>(initialInsights.length === 0);

  const cacheKey = `moneytracker_insights_${month !== undefined ? month : "current"}_${
    year !== undefined ? year : "current"
  }`;

  const loadInsights = useCallback(
    async (force = false) => {
      try {
        if (!force) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache berlaku selama 1 jam (3.600.000 ms)
            if (Date.now() - timestamp < 3600000 && Array.isArray(data) && data.length > 0) {
              setInsights(data);
              setIsGenerating(false);
              return;
            }
          }
        }

        setIsGenerating(true);
        const data = await generateFinancialInsightsAction(month, year);

        if (data && data.length > 0) {
          setInsights(data);
          const hasError = data.some(
            (insight) => insight.id.startsWith("err-") || insight.id.startsWith("fb-")
          );
          if (!hasError) {
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          }
        }
      } catch (err) {
        console.error("Gagal meload insight AI:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [month, year, cacheKey]
  );

  useEffect(() => {
    // Refresh otomatis jika parameter waktu berubah
    loadInsights(false);
  }, [loadInsights]);

  const handleRegenerate = () => {
    if (isGenerating) return;
    loadInsights(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-full"
    >
      <Card className="h-full border-[var(--card-border)] bg-gradient-to-br from-[var(--card)] to-[var(--background)]">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold">AI Insights</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs mt-0.5">
                  Insight singkat dari pola pengeluaranmu
                </CardDescription>
              </div>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-white/50 px-2.5 text-xs font-semibold text-[var(--foreground)] shadow-sm backdrop-blur-sm transition-all hover:bg-gray-50 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-900/50 dark:hover:bg-gray-800 cursor-pointer",
                isGenerating && "cursor-not-allowed"
              )}
              title="Buat ulang insight dengan AI"
            >
              <RefreshCw className={cn("h-3 w-3 text-purple-500", isGenerating && "animate-spin")} />
              <span className="hidden sm:inline text-[11px] sm:text-xs">Refresh insight</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[180px]">
          {isGenerating ? (
            <InsightSkeleton />
          ) : insights.length > 0 ? (
            insights.map((insight, i) => {
              const style = insightStyles[insight.type] || insightStyles.info;
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 active:scale-[0.99] md:hover:-translate-y-0.5 shadow-sm/5",
                    style.bg
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={cn(
                          "text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          style.label
                        )}
                      >
                        {style.text}
                      </span>
                      <span
                        className="text-base leading-none select-none shrink-0"
                        role="img"
                        aria-label={style.text}
                      >
                        {insight.icon}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--foreground)] font-medium">
                      {insight.message}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-6 text-center text-xs text-gray-500">
              <p>Insight belum tersedia.</p>
              <button
                onClick={handleRegenerate}
                className="mt-2 text-purple-500 font-semibold hover:underline"
              >
                Buat insight
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
