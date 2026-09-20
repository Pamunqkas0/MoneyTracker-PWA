"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight as ArrowUpRightIcon,
  CandlestickChart,
  AreaChart as AreaIcon,
  Plus,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Edit2,
  Trash2,
} from "lucide-react";
import type { FinancialSummary, MonthlyData } from "@/lib/types";
import type { BudgetItemRow, StockHoldingRow } from "@/lib/supabase/types";
import { formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_IDX_STOCKS } from "@/lib/stocks";
import { TradingViewStockChart } from "@/components/dashboard/tradingview-stock-chart";
import { StockHoldingDialog } from "@/components/dashboard/stock-holding-dialog";
import { deleteStockHolding } from "@/app/actions";

interface RightColumnBentoProps {
  summary: FinancialSummary;
  monthlyData?: MonthlyData[];
  budgetItems?: BudgetItemRow[];
  stockHoldings?: StockHoldingRow[];
}

export function RightColumnBento({
  summary,
  budgetItems = [],
  stockHoldings = [],
}: RightColumnBentoProps) {
  const router = useRouter();
  const [selectedStock, setSelectedStock] = useState<string>("IDX:BBCA");
  const [chartType, setChartType] = useState<"area" | "candlesticks">("area");
  const [activeTab, setActiveTab] = useState<"market" | "portfolio">("portfolio");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<StockHoldingRow | null>(null);

  // Perhitungan Portofolio Saham
  const totalStockInvestment = stockHoldings.reduce(
    (acc, item) => acc + item.shares_count * item.avg_buy_price,
    0
  );
  const totalStockValue = stockHoldings.reduce(
    (acc, item) => acc + item.shares_count * (item.current_price || item.avg_buy_price),
    0
  );
  const totalUnrealizedPL = totalStockValue - totalStockInvestment;
  const totalUnrealizedPLPct =
    totalStockInvestment > 0 ? (totalUnrealizedPL / totalStockInvestment) * 100 : 0;

  // Perhitungan Budget & Pengeluaran Riil
  const totalSpent = summary?.totalExpenses ?? 0;
  const totalBudget =
    budgetItems.length > 0
      ? budgetItems.reduce((acc, item) => acc + item.limit, 0)
      : (summary?.totalIncome ?? 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);

  const handleOpenAddStock = () => {
    setEditingHolding(null);
    setDialogOpen(true);
  };

  const handleOpenEditStock = (holding: StockHoldingRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHolding(holding);
    setDialogOpen(true);
  };

  const handleDeleteStock = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Hapus catatan saham "${name}" dari portofolio?`)) return;
    try {
      await deleteStockHolding(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-800/90 border border-black/[0.03] dark:border-slate-700/60 shadow-xs p-4 sm:p-5 md:p-6 flex flex-col justify-between gap-3.5 sm:gap-4.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      {/* ═════════ 1. HEADER & TAB SELECTOR (Market vs Saham Ku) ═════════ */}
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
              Saham & Pasar (IDX)
            </h2>
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* Tab Switcher (Portofolio vs Pantauan Pasar) */}
          <div className="flex items-center bg-surface-muted/80 dark:bg-slate-900/80 p-0.5 rounded-full border border-black/[0.03] dark:border-slate-700/40 text-[10px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-all cursor-pointer",
                activeTab === "portfolio"
                  ? "bg-[#E85024] text-white shadow-2xs"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              )}
            >
              Portofolio ({stockHoldings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("market")}
              className={cn(
                "px-2.5 py-1 rounded-full transition-all cursor-pointer",
                activeTab === "market"
                  ? "bg-[#E85024] text-white shadow-2xs"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              )}
            >
              Pasar
            </button>
          </div>
        </div>

        {/* ── Sub-view 1: Portofolio Saham Ringkasan ── */}
        {activeTab === "portfolio" && (
          <div className="flex flex-col gap-2.5">
            {/* Bento Card Portofolio Stockbit Total */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-muted/40 dark:bg-slate-900/60 border border-black/[0.02] dark:border-slate-700/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-tight block">
                  Nilai Portofolio Stockbit
                </span>
                <span className="text-lg sm:text-xl font-black text-stone-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(totalStockValue)}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold mt-0.5">
                  <span
                    className={cn(
                      "flex items-center gap-0.5 tabular-nums",
                      totalUnrealizedPL >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {totalUnrealizedPL >= 0 ? "+" : ""}
                    {formatCurrency(totalUnrealizedPL, true)} ({totalUnrealizedPLPct >= 0 ? "+" : ""}
                    {totalUnrealizedPLPct.toFixed(1)}%)
                  </span>
                  <span className="text-stone-300 dark:text-slate-600">&bull;</span>
                  <span className="text-stone-500 dark:text-slate-400 font-medium">
                    Modal: {formatCurrency(totalStockInvestment, true)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddStock}
                className="h-8 px-2.5 rounded-full bg-[#18181B] dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Saham</span>
              </button>
            </div>

            {/* List Saham yang dimiliki (Scrollable horizontal chips / mini cards) */}
            {stockHoldings.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                {stockHoldings.map((holding) => {
                  const isSelected = selectedStock === `IDX:${holding.symbol}`;
                  const sharesInLot = Math.round(holding.shares_count / 100);
                  const curPrice = holding.current_price || holding.avg_buy_price;
                  const pl = (curPrice - holding.avg_buy_price) * holding.shares_count;
                  const plPct =
                    holding.avg_buy_price > 0
                      ? ((curPrice - holding.avg_buy_price) / holding.avg_buy_price) * 100
                      : 0;

                  return (
                    <div
                      key={holding.id}
                      onClick={() => setSelectedStock(`IDX:${holding.symbol}`)}
                      className={cn(
                        "flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer select-none shrink-0 min-w-[170px]",
                        isSelected
                          ? "bg-white dark:bg-slate-800 border-[#E85024] shadow-xs ring-1 ring-[#E85024]"
                          : "bg-surface-muted/30 dark:bg-slate-900/40 border-black/[0.03] dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-[#18181B] dark:text-slate-100">
                            {holding.symbol}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500">
                            {sharesInLot} lot
                          </span>
                        </div>
                        <div className="text-[10px] font-bold tabular-nums mt-0.5">
                          <span
                            className={cn(
                              pl >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {pl >= 0 ? "+" : ""}
                            {plPct.toFixed(1)}% ({formatCurrency(pl, true)})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditStock(holding, e)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Saham"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteStock(holding.id, holding.symbol, e)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Hapus Saham"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-surface-muted/20 dark:bg-slate-900/30 border border-dashed border-stone-200 dark:border-slate-800 text-center flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  Belum ada saham yang dicatat dari Stockbit
                </span>
                <button
                  type="button"
                  onClick={handleOpenAddStock}
                  className="text-xs font-bold text-[#E85024] hover:underline cursor-pointer"
                >
                  + Tambah Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Sub-view 2: Daftar Saham Pasar Populer ── */}
        {activeTab === "market" && (
          <div className="p-1.5 sm:p-2 rounded-2xl bg-surface-muted/40 dark:bg-slate-900/60 border border-black/[0.02] dark:border-slate-700/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {DEFAULT_IDX_STOCKS.map((stock) => {
              const stockId = `IDX:${stock.symbol}`;
              const isSelected = selectedStock === stockId;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stockId)}
                  className={`flex flex-col items-center gap-1 p-1 sm:p-1.5 rounded-xl transition-all duration-150 cursor-pointer shrink-0 min-w-[46px] sm:min-w-[50px] ${
                    isSelected
                      ? "bg-white dark:bg-slate-800 shadow-xs scale-105 ring-1 ring-[#E85024]"
                      : "opacity-65 hover:opacity-100 hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: stock.color }}
                  >
                    <span className="font-black text-[9px] sm:text-[10px] text-white tracking-tight">
                      {stock.badge}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-stone-600 dark:text-slate-300 truncate max-w-[48px]">
                    {stock.symbol}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Chart View Toolbar (Toggle Candlestick / Area) */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
            Grafik Live: <strong className="text-stone-900 dark:text-slate-100">{selectedStock}</strong>
          </span>

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
      </div>

      {/* ═════════ 2. REALTIME TRADINGVIEW WIDGET ═════════ */}
      <div className="w-full">
        <TradingViewStockChart
          symbol={selectedStock}
          chartType={chartType}
          height={230}
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

      {/* ── Modal Dialog Catat Saham ── */}
      <StockHoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        holding={editingHolding}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
