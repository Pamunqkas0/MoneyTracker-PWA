"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LeftColumnBento } from "@/components/dashboard/left-column-bento";
import { MiddleColumnBento } from "@/components/dashboard/middle-column-bento";
import { RightColumnBento } from "@/components/dashboard/right-column-bento";
import type {
  TransactionRow,
  BankAccountRow,
  BudgetItemRow,
  SavingsGoalRow,
  UpcomingBillRow,
} from "@/lib/supabase/types";
import type { MonthlyData, CategoryExpense, Insight, FinancialSummary } from "@/lib/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

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
  currentMonth: number;
  currentYear: number;
  recentNotifications: TransactionRow[];
}

import type { Variants } from "framer-motion";

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
  currentMonth,
  currentYear,
  recentNotifications,
}: DashboardClientProps) {
  return (
    // ── 1. Full Viewport Background Wrapper with Mobile Bottom Padding ──
    <div className="min-h-screen bg-[#F7F4EE] text-[#18181B] p-3 sm:p-5 md:p-6 lg:p-8 pb-28 lg:pb-8 flex justify-center items-start selection:bg-brand-orange/20">
      {/* ── 2. Main Card Canvas / Outer Shell ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-[28px] sm:rounded-[32px] md:rounded-[36px] bg-white/95 backdrop-blur-sm border border-black/[0.04] p-4 sm:p-6 md:p-8 lg:p-10 shadow-xs flex flex-col gap-5 sm:gap-6"
      >
        {/* ── 3. Top Navigation Bar (SavOr Pill Header) ── */}
        <DashboardHeader
          bankAccounts={bankAccounts}
          availableCategories={availableCategories}
          recentNotifications={recentNotifications}
        />

        {/* ── 4. Title Slot & Actions Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-1">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#18181B]">
              Dashboard
            </h1>
            <p className="text-xs md:text-sm text-stone-500 mt-0.5 font-medium">
              Warm Soft Bento Grid Financial Overview
            </p>
          </div>

          {/* Filter & Search Controls */}
          <div className="flex items-center gap-2">
            <div className="h-9 px-3.5 rounded-full bg-surface-muted/80 border border-black/[0.03] flex items-center text-xs text-stone-500 min-w-[130px] justify-between transition-all hover:bg-surface-muted">
              <span>🔍 Cari transaksi...</span>
            </div>
            <div className="flex items-center bg-surface-muted/80 p-1 rounded-full border border-black/[0.03] text-xs font-medium">
              <span className="px-3 py-1 rounded-full bg-[#E85024] text-white shadow-xs font-semibold">
                24h
              </span>
              <span className="px-2.5 py-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer">7D</span>
              <span className="px-2.5 py-1 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer">30D</span>
            </div>
          </div>
        </div>

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

          {/* ═════════ KOLOM 2 (Tengah): Savings Statistics & Spend Rate (lg:col-span-4) ═════════ */}
          <motion.div variants={columnVariants} className="lg:col-span-4 flex flex-col gap-5">
            <MiddleColumnBento
              summary={summary}
              savingsGoals={savingsGoals}
              categoryExpenses={categoryExpenses}
            />
          </motion.div>

          {/* ═════════ KOLOM 3 (Kanan): Market Chart & Team (lg:col-span-4) ═════════ */}
          <motion.div variants={columnVariants} className="lg:col-span-4 flex flex-col gap-5">
            <RightColumnBento
              summary={summary}
              monthlyData={monthlyData}
            />
          </motion.div>
        </motion.main>
      </motion.div>
    </div>
  );
}

