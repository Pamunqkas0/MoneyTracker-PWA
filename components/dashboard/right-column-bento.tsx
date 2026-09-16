"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight as ArrowUpRightIcon,
  CandlestickChart,
  AreaChart as AreaIcon,
} from "lucide-react";
import type { FinancialSummary, MonthlyData } from "@/lib/types";
import type { BudgetItemRow } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { TradingViewStockChart } from "@/components/dashboard/tradingview-stock-chart";

interface RightColumnBentoProps {
  summary: FinancialSummary;
  monthlyData?: MonthlyData[];
  budgetItems?: BudgetItemRow[];
}

export function RightColumnBento({
  summary,
  budgetItems = [],
}: RightColumnBentoProps) {
  const [selectedStock, setSelectedStock] = useState<string>("IDX:BBCA");
  const [chartType, setChartType] = useState<"area" | "candlesticks">("area");

  // Perhitungan Budget & Pengeluaran Riil
  const totalSpent = summary?.totalExpenses ?? 0;
  const totalBudget =
    budgetItems.length > 0
      ? budgetItems.reduce((acc, item) => acc + item.limit, 0)
      : (summary?.totalIncome ?? 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  // Daftar Saham Unggulan Indonesia (IDX / BEI)
  const idxStocks = [
    {
      id: "IDX:BBCA",
      name: "BCA",
      symbol: "BBCA",
      fullName: "Bank Central Asia",
      iconBg: "bg-[#003B70]",
      badge: "BCA",
    },
    {
      id: "IDX:BBRI",
      name: "BRI",
      symbol: "BBRI",
      fullName: "Bank Rakyat Indonesia",
      iconBg: "bg-[#00529C]",
      badge: "BRI",
    },
    {
      id: "IDX:BMRI",
      name: "Mandiri",
      symbol: "BMRI",
      fullName: "Bank Mandiri",
      iconBg: "bg-[#0A2972]",
      badge: "BMRI",
    },
    {
      id: "IDX:TLKM",
      name: "Telkom",
      symbol: "TLKM",
      fullName: "Telkom Indonesia",
      iconBg: "bg-[#EE1C25]",
      badge: "TLKM",
    },
    {
      id: "IDX:ASII",
      name: "Astra",
      symbol: "ASII",
      fullName: "Astra International",
      iconBg: "bg-[#002D62]",
      badge: "ASII",
    },
    {
      id: "IDX:GOTO",
      name: "GoTo",
      symbol: "GOTO",
      fullName: "GoTo Gojek Tokopedia",
      iconBg: "bg-[#00AA13]",
      badge: "GOTO",
    },
    {
      id: "IDX:COMPOSITE",
      name: "IHSG",
      symbol: "IHSG",
      fullName: "Composite Index",
      iconBg: "bg-[#E85024]",
      badge: "IDX",
    },
  ];

  return (
    <div className="w-full rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-800/90 border border-black/[0.03] dark:border-slate-700/60 shadow-xs p-4 sm:p-5 md:p-6 flex flex-col justify-between gap-3.5 sm:gap-4.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      {/* ═════════ 1. HEADER & IDX STOCK SELECTOR ═════════ */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Header */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
              Market Price (IDX)
            </h2>
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-muted/60 dark:bg-slate-900/60 p-0.5 rounded-full border border-black/[0.03] dark:border-slate-700/40">
            <button
              onClick={() => setChartType("area")}
              title="Area Chart"
              className={`p-1 rounded-full transition-all cursor-pointer ${
                chartType === "area"
                  ? "bg-white dark:bg-slate-800 text-[#E85024] shadow-2xs"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
              }`}
            >
              <AreaIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("candlesticks")}
              title="Candlestick Chart"
              className={`p-1 rounded-full transition-all cursor-pointer ${
                chartType === "candlesticks"
                  ? "bg-white dark:bg-slate-800 text-[#E85024] shadow-2xs"
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
              }`}
            >
              <CandlestickChart className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stock Ticker Icons (Horizontal Scrollable Row) */}
        <div className="p-1.5 sm:p-2 rounded-2xl bg-surface-muted/40 dark:bg-slate-900/60 border border-black/[0.02] dark:border-slate-700/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {idxStocks.map((stock) => {
            const isSelected = selectedStock === stock.id;
            return (
              <button
                key={stock.id}
                onClick={() => setSelectedStock(stock.id)}
                className={`flex flex-col items-center gap-1 p-1 sm:p-1.5 rounded-xl transition-all duration-150 cursor-pointer shrink-0 min-w-[46px] sm:min-w-[50px] ${
                  isSelected
                    ? "bg-white dark:bg-slate-800 shadow-xs scale-105"
                    : "opacity-65 hover:opacity-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${stock.iconBg} flex items-center justify-center shadow-2xs`}
                >
                  <span className="font-black text-[9px] sm:text-[10px] text-white tracking-tight">
                    {stock.badge}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-stone-600 dark:text-slate-300 truncate max-w-[48px]">
                  {stock.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════ 2. REALTIME TRADINGVIEW WIDGET ═════════ */}
      <div className="w-full">
        <TradingViewStockChart
          symbol={selectedStock}
          chartType={chartType}
          height={240}
        />
      </div>

      {/* ═════════ 3. BUDGET & SPENDING BREAKDOWN RIIL ═════════ */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-center pt-2 border-t border-stone-100 dark:border-slate-700/60">
        <div className="min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-tight block truncate">
            Pengeluaran
          </span>
          <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-slate-100 tabular-nums truncate block">
            {formatCurrency(totalSpent, true)}
          </span>
        </div>

        <div className="min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-tight block truncate">
            Budget
          </span>
          <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-slate-100 tabular-nums truncate block">
            {totalBudget > 0 ? formatCurrency(totalBudget, true) : "Belum diatur"}
          </span>
        </div>

        <div className="flex justify-end">
          <Link
            href="/dashboard/budget"
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#5CB85C] hover:bg-[#4ea04e] text-white font-black text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shadow-xs tracking-tight transition-colors"
            title="Sisa Anggaran (Klik untuk ke Budget)"
          >
            <ArrowUpRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            <span>{formatCurrency(remainingBudget, true)}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
