"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Share2, ReceiptText, ShoppingBag, PiggyBank, Receipt, ChevronRight } from "lucide-react";
import type { FinancialSummary, CategoryExpense } from "@/lib/types";
import type { SavingsGoalRow, UpcomingBillRow } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import { UpcomingBillsBento } from "@/components/features/dashboard/bento/upcoming-bills-bento";
import { TactileIconBadge } from "@/components/ui/tactile-icon-badge";

interface MiddleColumnBentoProps {
  summary?: FinancialSummary;
  savingsGoals?: SavingsGoalRow[];
  categoryExpenses?: CategoryExpense[];
  upcomingBills?: UpcomingBillRow[];
}

const BENTO_CARD_CLASS =
  "bg-white dark:bg-[#1C1E23] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.06] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200";

export function MiddleColumnBento({
  summary,
  savingsGoals = [],
  categoryExpenses = [],
  upcomingBills = [],
}: MiddleColumnBentoProps) {
  // ── 1. KALKULASI NOMINAL & PERSENTASE REAL ──
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Rasio Income (dibandingkan benchmark)
  const incomeBenchmark = Math.max(totalIncome, totalExpenses, 1000);
  const rawIncomePercent = incomeBenchmark > 0 ? Math.round((totalIncome / incomeBenchmark) * 100) : 0;
  const incomePercent = totalIncome > 0 ? Math.max(8, Math.min(rawIncomePercent, 100)) : 0;

  // Rasio Outcome (pengeluaran terhadap pemasukan)
  const rawOutcomePercent = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : (totalExpenses > 0 ? 100 : 0);
  const outcomePercent = totalExpenses > 0 ? Math.max(8, Math.min(rawOutcomePercent, 100)) : 0;

  // ── 2. KALKULASI 4 KATEGORI SPEND RATE DINAMIS ──
  const dynamicCategories = useMemo(() => {
    const palette = [
      { variant: "blue" as const, bar: "#B2CDD6", icon: Share2, label: "Connections", trend: "up" as const, percent: 4 },
      { variant: "peach" as const, bar: "#F4B3A2", icon: ReceiptText, label: "Bills", trend: "down" as const, percent: 2 },
      { variant: "lime" as const, bar: "#C6EE9D", icon: ShoppingBag, label: "Groceries", trend: "down" as const, percent: 5 },
      { variant: "cyan" as const, bar: "#78CEDD", icon: PiggyBank, label: "Savings", trend: "up" as const, percent: 4 },
    ];

    if (categoryExpenses && categoryExpenses.length > 0) {
      const topCategories = [...categoryExpenses].sort((a, b) => b.amount - a.amount).slice(0, 4);
      return palette.map((p, i) => {
        const cat = topCategories[i];
        if (!cat) return p;
        const share = totalExpenses > 0 ? Math.max(5, Math.round((cat.amount / totalExpenses) * 100)) : p.percent;
        const catName = cat.label || cat.category || "Other";
        const label = catName.length > 11 ? catName.slice(0, 10) + "…" : catName;
        return {
          ...p,
          label,
          percent: share,
          trend: i % 2 === 0 ? ("up" as const) : ("down" as const),
        };
      });
    }
    return palette;
  }, [categoryExpenses, totalExpenses]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3.5 font-sans antialiased text-[#111111] dark:text-white transition-colors duration-200">
      
      {/* ── BARIS 1: INCOME & OUTCOME CARDS (2 KOLOM DINAMIS) ── */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* ── 1. INCOME CARD ── */}
        <div className={`${BENTO_CARD_CLASS} flex flex-col justify-between min-h-[210px] cursor-pointer`}>
          {/* Icon Bulat Hijau Pastel */}
          <TactileIconBadge size="lg" shape="circle" variant="lime">
            <TrendingUp className="w-6 h-6 stroke-[2.4]" />
          </TactileIconBadge>

          <div>
            <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 block mb-1">Income</span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white mb-2.5 truncate tabular-nums leading-tight" title={String(totalIncome)}>
              {totalIncome > 0 ? formatCurrency(totalIncome, true) : "Rp0"}
            </p>

            {/* Scale Ticks Dinamis */}
            <div className="relative w-full text-[10px] font-bold text-stone-400 dark:text-stone-500 mb-1.5 h-3">
              <span className="absolute left-0">0%</span>
              {incomePercent > 10 && incomePercent < 90 && (
                <span 
                  className="absolute -translate-x-1/2 text-[#60BA3A] dark:text-emerald-400 font-extrabold transition-all duration-300"
                  style={{ left: `${incomePercent}%` }}
                >
                  {incomePercent}%
                </span>
              )}
              <span className="absolute right-0">100%</span>
            </div>

            {/* Progress Bar Dinamis dengan Garis Pemisah Hitam */}
            <div className="flex items-center gap-1.5 w-full h-4">
              <div 
                className="h-full bg-[#8CE644] rounded-full transition-all duration-500 min-w-[12px]"
                style={{ width: `${Math.max(incomePercent, 4)}%` }}
              />
              <div className="w-[2px] h-full bg-black/80 dark:bg-white/80 rounded-full shrink-0" />
              <div 
                className="h-full bg-[#ECECE8] dark:bg-slate-800 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(100 - incomePercent, 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. OUTCOME CARD ── */}
        <div className={`${BENTO_CARD_CLASS} flex flex-col justify-between min-h-[210px] cursor-pointer`}>
          {/* Icon Bulat Peach Pastel */}
          <TactileIconBadge size="lg" shape="circle" variant="peach">
            <TrendingDown className="w-6 h-6 stroke-[2.4]" />
          </TactileIconBadge>

          <div>
            <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 block mb-1">Outcome</span>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white mb-2.5 truncate tabular-nums leading-tight" title={String(totalExpenses)}>
              {totalExpenses > 0 ? formatCurrency(totalExpenses, true) : "Rp0"}
            </p>

            {/* Scale Ticks Dinamis */}
            <div className="relative w-full text-[10px] font-bold text-stone-400 dark:text-stone-500 mb-1.5 h-3">
              <span className="absolute left-0">0%</span>
              {outcomePercent > 10 && outcomePercent < 90 && (
                <span 
                  className="absolute -translate-x-1/2 text-[#E64C1E] dark:text-orange-400 font-extrabold transition-all duration-300"
                  style={{ left: `${outcomePercent}%` }}
                >
                  {outcomePercent}%
                </span>
              )}
              <span className="absolute right-0">100%</span>
            </div>

            {/* Progress Bar Dinamis dengan Garis Pemisah Hitam */}
            <div className="flex items-center gap-1.5 w-full h-4">
              <div 
                className="h-full bg-[#E64C1E] rounded-full transition-all duration-500 min-w-[12px]"
                style={{ width: `${Math.max(outcomePercent, 4)}%` }}
              />
              <div className="w-[2px] h-full bg-black/80 dark:bg-white/80 rounded-full shrink-0" />
              <div 
                className="h-full bg-[#ECECE8] dark:bg-slate-800 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(100 - outcomePercent, 4)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── BARIS 2: CURRENT SPEND RATE BENTO CARD (KATEGORI DINAMIS) ── */}
      <div className={`${BENTO_CARD_CLASS} flex flex-col gap-4`}>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-black dark:text-white">
            Current spend rate
          </h3>
          <div className="text-stone-800 dark:text-stone-200">
            <Receipt className="w-5 h-5 stroke-[2]" />
          </div>
        </div>

        {/* 4 Kolom Kategori */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          {dynamicCategories.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center min-w-0">
                <TactileIconBadge size="lg" shape="circle" variant={item.variant} className="mb-2">
                  <IconComponent className="w-5 h-5 stroke-[2.2]" />
                </TactileIconBadge>
                <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 mb-1 truncate w-full" title={item.label}>
                  {item.label}
                </span>
                <span className={`text-[10px] font-extrabold flex items-center justify-center gap-0.5 ${item.trend === "up" ? "text-[#3B9E2B] dark:text-emerald-400" : "text-[#E03B24] dark:text-rose-400"}`}>
                  <span className={`w-2.5 h-2.5 rounded-full text-white flex items-center justify-center text-[8px] leading-none ${item.trend === "up" ? "bg-[#3B9E2B]" : "bg-[#E03B24]"}`}>
                    {item.trend === "up" ? "↑" : "↓"}
                  </span>
                  {item.percent}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Multi-Color Segment Bar Dinamis Berdasarkan Proporsi Kategori */}
        <div className="flex items-center gap-1.5 w-full h-4 mt-1">
          {dynamicCategories.map((item, idx) => (
            <React.Fragment key={idx}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: item.bar, 
                  flex: `${Math.max(item.percent, 10)} 1 0%` 
                }} 
              />
              {idx < dynamicCategories.length - 1 && (
                <div className="w-[2px] h-full bg-black/80 dark:bg-white/80 rounded-full shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

      </div>

      {/* ── BARIS 3: SAVINGS GOALS ── */}
      <section className={`${BENTO_CARD_CLASS} flex flex-col gap-4`} aria-labelledby="savings-goals-title">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 id="savings-goals-title" className="text-base sm:text-lg font-black tracking-tight text-[#111827] dark:text-white">
              Savings Goals
            </h3>
          </div>
          <Link
            href="/dashboard/budget"
            className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-[#E85024] transition-transform hover:underline active:scale-95"
          >
            Lihat semua <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {savingsGoals.length > 0 ? (
          <div className="flex flex-col gap-3">
            {savingsGoals.slice(0, 1).map((goal) => {
              const percent = goal.target_amount > 0
                ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
                : 0;
              const progressColorClass = percent < 30
                ? "stroke-[#E85024] dark:stroke-[#FF7A45]"
                : percent < 70
                  ? "stroke-[#D99A00] dark:stroke-[#FAD170]"
                  : "stroke-[#059669] dark:stroke-[#34D399]";
              return (
                <Link
                  key={goal.id}
                  href="/dashboard/budget"
                  aria-label={`${goal.name}, ${percent}% tercapai`}
                  className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2"
                >
                  <div className="relative rounded-2xl bg-[#F7F4EE] p-4 dark:bg-[#15171C]">
                    <svg
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label={`Progress ${goal.name}: ${percent}%`}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    >
                      <rect
                        x="1.5"
                        y="1.5"
                        width="calc(100% - 3px)"
                        height="calc(100% - 3px)"
                        rx="16"
                        pathLength="100"
                        fill="none"
                        stroke="#D1D5DB"
                        className="dark:stroke-[#374151]"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="1.5"
                        y="1.5"
                        width="calc(100% - 3px)"
                        height="calc(100% - 3px)"
                        rx="16"
                        pathLength="100"
                        fill="none"
                        stroke="#059669"
                        className={progressColorClass}
                        strokeWidth="2.5"
                        strokeDasharray={`${percent} ${100 - percent}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.5s ease-out" }}
                      />
                    </svg>

                    <div className="flex items-center gap-3">
                      <TactileIconBadge size="lg" variant="lime" className="transition-transform group-hover:scale-105">
                        <AnimatedEmoji emoji={goal.emoji || "🎯"} size={24} />
                      </TactileIconBadge>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-[#18181B] dark:text-white sm:text-base">
                          {goal.name}
                        </h4>
                        <p className="mt-0.5 text-xs font-medium tabular-nums text-stone-500 dark:text-stone-400">
                          {formatCurrency(Math.round(goal.current_amount))} terkumpul
                        </p>
                      </div>
                      <span className="shrink-0 text-lg font-black tracking-tight tabular-nums text-[#111827] dark:text-white">
                        {percent}%
                      </span>
                    </div>

                  </div>

                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Belum ada target tabungan.
          </p>
        )}
      </section>

      {/* ── BARIS 4: DEDICATED UPCOMING BILLS (TAGIHAN MENDATANG) BENTO CARD ── */}
      <UpcomingBillsBento bills={upcomingBills} />

    </div>
  );
}
