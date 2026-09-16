"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Share2, ReceiptText, ShoppingBag, PiggyBank, Receipt } from "lucide-react";
import type { FinancialSummary, CategoryExpense } from "@/lib/types";
import type { SavingsGoalRow, UpcomingBillRow } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { UpcomingBillsBento } from "@/components/dashboard/upcoming-bills-bento";

interface MiddleColumnBentoProps {
  summary?: FinancialSummary;
  savingsGoals?: SavingsGoalRow[];
  categoryExpenses?: CategoryExpense[];
  upcomingBills?: UpcomingBillRow[];
}

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
      { bg: "#BCE0E6", bar: "#B2CDD6", icon: Share2, label: "Connections", trend: "up" as const, percent: 4 },
      { bg: "#F7C2B2", bar: "#F4B3A2", icon: ReceiptText, label: "Bills", trend: "down" as const, percent: 2 },
      { bg: "#C4EE9B", bar: "#C6EE9D", icon: ShoppingBag, label: "Groceries", trend: "down" as const, percent: 5 },
      { bg: "#72D3E3", bar: "#78CEDD", icon: PiggyBank, label: "Savings", trend: "up" as const, percent: 4 },
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
        <div className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[210px] border border-black/[0.02] dark:border-white/[0.06] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
          {/* Icon Bulat Hijau Pastel */}
          <div className="w-12 h-12 rounded-full bg-[#E8F8B8] dark:bg-[#E8F8B8]/20 flex items-center justify-center text-emerald-800 dark:text-[#E8F8B8] transition-transform group-hover:scale-105">
            <TrendingUp className="w-6 h-6 stroke-[2.4]" />
          </div>

          <div>
            <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 block mb-1">Income</span>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white mb-2.5 truncate tabular-nums" title={String(totalIncome)}>
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
        <div className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[210px] border border-black/[0.02] dark:border-white/[0.06] hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
          {/* Icon Bulat Peach Pastel */}
          <div className="w-12 h-12 rounded-full bg-[#F8D8CE] dark:bg-[#F8D8CE]/20 flex items-center justify-center text-[#E84A1C] dark:text-[#F8D8CE] transition-transform group-hover:scale-105">
            <TrendingDown className="w-6 h-6 stroke-[2.4]" />
          </div>

          <div>
            <span className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-400 block mb-1">Outcome</span>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white mb-2.5 truncate tabular-nums" title={String(totalExpenses)}>
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
      <div className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 shadow-xs flex flex-col gap-4 border border-black/[0.02] dark:border-white/[0.06] hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        
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
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-black mb-2 transition-transform hover:scale-105"
                  style={{ backgroundColor: item.bg }}
                >
                  <IconComponent className="w-5 h-5 stroke-[2.2]" />
                </div>
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

      {/* ── BARIS 3: DEDICATED UPCOMING BILLS (TAGIHAN MENDATANG) BENTO CARD ── */}
      <UpcomingBillsBento bills={upcomingBills} />

    </div>
  );
}
