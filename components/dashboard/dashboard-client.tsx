"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LeftColumnBento } from "@/components/dashboard/left-column-bento";
import { MiddleColumnBento } from "@/components/dashboard/middle-column-bento";
import { RightColumnBento } from "@/components/dashboard/right-column-bento";
import { QuickSearchDialog } from "@/components/dashboard/quick-search-dialog";
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import { EditTransactionDialog } from "@/components/dashboard/edit-transaction-dialog";
import type {
  TransactionRow,
  BankAccountRow,
  BudgetItemRow,
  SavingsGoalRow,
  UpcomingBillRow,
  StockHoldingRow,
} from "@/lib/supabase/types";
import type { MonthlyData, CategoryExpense, Insight, FinancialSummary } from "@/lib/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";
import { formatCurrency, cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export interface DashboardClientProps {
  summary: FinancialSummary;
  monthlyData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  insights: Insight[];
  transactions: TransactionRow[];
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
  budgetItems: BudgetItemRow[];
  savingsGoals: SavingsGoalRow[];
  upcomingBills: UpcomingBillRow[];
  stockHoldings?: StockHoldingRow[];
  currentMonth: number;
  currentYear: number;
  recentNotifications: TransactionRow[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function DashboardClient({
  summary,
  monthlyData,
  categoryExpenses,
  insights,
  transactions,
  bankAccounts,
  availableCategories,
  budgetItems,
  savingsGoals,
  upcomingBills,
  stockHoldings = [],
  currentMonth,
  currentYear,
  recentNotifications,
}: DashboardClientProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionRow | null>(null);

  // Navigasi Filter Bulan
  const handlePrevMonth = () => {
    triggerHaptic("selection");
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`);
  };

  const handleNextMonth = () => {
    triggerHaptic("selection");
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`);
  };

  const handleCurrentMonth = () => {
    triggerHaptic("selection");
    const now = new Date();
    router.push(`/dashboard?month=${now.getMonth()}&year=${now.getFullYear()}`);
  };

  const isCurrentMonthActive = () => {
    const now = new Date();
    return currentMonth === now.getMonth() && currentYear === now.getFullYear();
  };

  return (
    // ── 1. Full Viewport Background Wrapper ──
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-3 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20">
      {/* ── 2. Main Card Canvas / Outer Shell ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs flex flex-col gap-5 sm:gap-6"
      >
        {/* ── 3. Top Navigation Bar (SavOr Pill Header) ── */}
        <DashboardHeader
          bankAccounts={bankAccounts}
          availableCategories={availableCategories}
          recentNotifications={recentNotifications}
        />

        {/* ── 4. Dynamic Live Title & Actions Header ── */}
        <div className="flex flex-col gap-3.5 mb-1">
          {/* Baris 1: Judul Dashboard + Month Selector Navigator */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#18181B] dark:text-slate-100">
                  Dashboard
                </h1>
                {!isCurrentMonthActive() && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E85024]/10 text-[#E85024] border border-[#E85024]/20 shrink-0">
                    Filter Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                Periode <span className="font-bold text-stone-800 dark:text-slate-200">{MONTH_NAMES[currentMonth]} {currentYear}</span>
              </p>
            </div>

            {/* Interactive Month Selector (< Sep 2026 >) */}
            <div className="flex items-center shrink-0 bg-surface-muted/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-black/[0.04] dark:border-slate-700/60 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-90"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                  isCurrentMonthActive()
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-950 shadow-2xs"
                    : "text-stone-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60"
                )}
                title="Klik untuk kembali ke Bulan Ini"
              >
                {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-90"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Baris 2: Full Width Quick Search Bar */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setSearchOpen(true);
            }}
            className="h-10 w-full px-3.5 rounded-2xl bg-surface-muted/70 dark:bg-slate-800/70 border border-black/[0.04] dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs group select-none"
            title="Cari transaksi (Shortcut: ⌘K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-stone-400 group-hover:text-[#E85024] transition-colors shrink-0" />
              <span>Cari transaksi apa saja...</span>
            </div>
            <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-black/[0.04] dark:border-slate-700 text-stone-400 shrink-0">
              ⌘K
            </span>
          </button>
        </div>

        {/* ── Quick Search Dialog Modal (⌘K) ── */}
        <QuickSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          transactions={transactions}
          onSelectTransaction={(tx) => setEditTx(tx)}
        />

        {/* ── Edit Transaction Dialog ── */}
        {editTx && (
          <EditTransactionDialog
            transaction={editTx}
            bankAccounts={bankAccounts}
            availableCategories={availableCategories}
            open={!!editTx}
            onOpenChange={(open) => {
              if (!open) setEditTx(null);
            }}
          />
        )}

        {/* ── 5. Bento Grid System with Stagger Entrance (3 Kolom Modular) ── */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 w-full"
        >
          {/* ═════════ KOLOM 1 (Kiri): Currency, Hero Card & Portfolio (lg:col-span-4) ═════════ */}
          <motion.div variants={columnVariants} className="lg:col-span-4 flex flex-col gap-5">
            <LeftColumnBento
              summary={summary}
              bankAccounts={bankAccounts}
              availableCategories={availableCategories}
            />
          </motion.div>

          {/* ═════════ KOLOM 2 (Tengah): Income, Outcome, Spend Rate & Tagihan Mendatang (lg:col-span-4) ═════════ */}
          <motion.div variants={columnVariants} className="lg:col-span-4 flex flex-col gap-5">
            <MiddleColumnBento
              summary={summary}
              savingsGoals={savingsGoals}
              categoryExpenses={categoryExpenses}
              upcomingBills={upcomingBills}
            />
          </motion.div>

          {/* ═════════ KOLOM 3 (Kanan): Market Chart & Real Budget (lg:col-span-4) ═════════ */}
          <motion.div variants={columnVariants} className="lg:col-span-4 flex flex-col gap-5">
            <RightColumnBento
              summary={summary}
              monthlyData={monthlyData}
              budgetItems={budgetItems}
              stockHoldings={stockHoldings}
            />
          </motion.div>
        </motion.main>
      </motion.div>
    </div>
  );
}

