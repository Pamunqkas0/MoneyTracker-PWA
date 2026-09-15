"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Receipt,
  PiggyBank,
  Plus,
  Percent,
  Download,
  Flame,
  ShoppingBag,
  Wifi,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { GoalDialog } from "./goal-dialog";
import { GoalDetailDialog } from "./goal-detail-dialog";
import type { SavingsGoalRow } from "@/lib/supabase/types";
import type { FinancialSummary, CategoryExpense } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MiddleColumnBentoProps {
  summary: FinancialSummary;
  savingsGoals: SavingsGoalRow[];
  categoryExpenses?: CategoryExpense[];
}

export function MiddleColumnBento({
  summary,
  savingsGoals = [],
  categoryExpenses = [],
}: MiddleColumnBentoProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalRow | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalRow | null>(null);

  const totalIncome = summary?.totalIncome ?? 2300;
  const totalExpenses = summary?.totalExpenses ?? 400.32;

  // Calculate percentage ratios for progress bars
  const maxBenchmark = Math.max(totalIncome, totalExpenses, 3000);
  const incomePercent = Math.min(Math.round((totalIncome / maxBenchmark) * 100), 100) || 75;
  const outcomePercent = Math.min(Math.round((totalExpenses / (totalIncome || 1)) * 100), 100) || 20;

  const openAddGoalDialog = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const openEditGoalDialog = (goal: SavingsGoalRow) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const openGoalDetail = (goal: SavingsGoalRow) => {
    setSelectedGoal(goal);
    setDetailDialogOpen(true);
  };

  const handleEditFromDetail = (goal: SavingsGoalRow) => {
    setDetailDialogOpen(false);
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  // Default display goals matching SavOr reference if list is empty
  const displayGoals: SavingsGoalRow[] =
    savingsGoals.length > 0
      ? savingsGoals
      : [
          {
            id: "goal-1",
            user_id: "user-1",
            name: "Car",
            target_amount: 5000,
            current_amount: 2300,
            target_date: "2027-12-31",
            emoji: "🚗",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "goal-2",
            user_id: "user-1",
            name: "Boat",
            target_amount: 1500,
            current_amount: 300,
            target_date: "2028-06-30",
            emoji: "⛵",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

  // Category filter pills
  const filterPills = [
    { id: "all", label: "All spendings", activeClass: "bg-[#E85024] text-white shadow-xs" },
    { id: "groceries", label: "Groceries", activeClass: "bg-[#D8F5A2] text-stone-900 shadow-xs" },
    { id: "bills", label: "Bills", activeClass: "bg-[#FDD5C1] text-stone-900 shadow-xs" },
    { id: "connection", label: "Connection", activeClass: "bg-[#E0E6FD] text-stone-900 shadow-xs" },
  ];

  // Spend rate category items
  const spendRateItems = [
    {
      label: "Connections",
      percent: "4%",
      bgIcon: "bg-[#E0E6FD]",
      barColor: "bg-[#E0E6FD]",
      icon: <Wifi className="w-3.5 h-3.5 text-blue-700" />,
    },
    {
      label: "Bills",
      percent: "3%",
      bgIcon: "bg-[#FDD5C1]",
      barColor: "bg-[#FDD5C1]",
      icon: <Flame className="w-3.5 h-3.5 text-rose-700" />,
    },
    {
      label: "Groceries",
      percent: "9%",
      bgIcon: "bg-[#D8F5A2]",
      barColor: "bg-[#D8F5A2]",
      icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-800" />,
    },
    {
      label: "Savings",
      percent: "4%",
      bgIcon: "bg-[#DAEFEA]",
      barColor: "bg-[#DAEFEA]",
      icon: <PiggyBank className="w-3.5 h-3.5 text-teal-800" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ═════════ 1. HEADER & FILTER CATEGORY PILLS ═════════ */}
      <div className="flex flex-col gap-3">
        {/* Header Title & Filter Icon */}
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-[#18181B] tracking-tight">
            Savings Statistic
          </h2>
          <button
            title="Filter kategori"
            className="w-8 h-8 rounded-full bg-white border border-black/[0.04] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Pills (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterPills.map((pill) => {
            const isActive = activeCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveCategory(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? pill.activeClass
                    : "bg-surface-muted/70 text-stone-600 hover:bg-surface-muted hover:text-stone-900 border border-black/[0.02]"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════ 2. INCOME & OUTCOME CARDS (2 Kolom Kecil) ═════════ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="rounded-[24px] bg-white border border-black/[0.03] shadow-xs p-4 flex flex-col justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-[#DAEFEA] flex items-center justify-center text-teal-800 shadow-2xs">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              0% - 100%
            </span>
          </div>

          <div>
            <span className="text-xs text-stone-500 font-medium block">Income</span>
            <div className="text-lg md:text-xl font-black text-[#18181B] tracking-tight tabular-nums mt-0.5">
              ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
          </div>

          {/* Income Progress Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-stone-400">
              <span>0%</span>
              <span className="text-emerald-700 font-extrabold">{incomePercent}%</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D8F5A2] h-full rounded-full transition-all duration-500"
                style={{ width: `${incomePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Outcome / Expense Card */}
        <div className="rounded-[24px] bg-white border border-black/[0.03] shadow-xs p-4 flex flex-col justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-[#FDD5C1] flex items-center justify-center text-[#E85024] shadow-2xs">
              <TrendingDown className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              0% - 100%
            </span>
          </div>

          <div>
            <span className="text-xs text-stone-500 font-medium block">Outcome</span>
            <div className="text-lg md:text-xl font-black text-[#18181B] tracking-tight tabular-nums mt-0.5">
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Outcome Progress Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-stone-400">
              <span>0%</span>
              <span className="text-brand-orange font-extrabold">{outcomePercent}%</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#E85024] h-full rounded-full transition-all duration-500"
                style={{ width: `${outcomePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ 3. CURRENT SPEND RATE (Category Icons Bar) ═════════ */}
      <div className="rounded-[24px] bg-white border border-black/[0.03] shadow-xs p-4 flex flex-col gap-3.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-[#18181B] tracking-tight">
            Current spend rate
          </h3>
          <button
            title="Detail kategori"
            className="w-6 h-6 rounded-full bg-surface-muted/60 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Category Icons with percentage and bottom bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {spendRateItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5">
              {/* Category Icon */}
              <div
                className={`w-9 h-9 rounded-2xl ${item.bgIcon} flex items-center justify-center shadow-2xs`}
              >
                {item.icon}
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-stone-600 truncate w-full">
                {item.label}
              </span>

              {/* Percent Tag */}
              <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-stone-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{item.percent}</span>
              </div>

              {/* Colored Horizontal Bar Underneath */}
              <div className={`w-full ${item.barColor} h-1.5 rounded-full mt-0.5`} />
            </div>
          ))}
        </div>
      </div>

      {/* ═════════ 4. MY SAVINGS / GOALS TRACKER SECTION ═════════ */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-[#18181B] tracking-tight">My Savings</h2>
          <button
            onClick={openAddGoalDialog}
            className="text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Target Baru</span>
          </button>
        </div>

        {/* List of Goals */}
        <div className="flex flex-col gap-2">
          {displayGoals.map((goal) => {
            const pct = Math.min(
              Math.round((goal.current_amount / (goal.target_amount || 1)) * 100),
              100
            );

            return (
              <div
                key={goal.id}
                onClick={() => openGoalDetail(goal)}
                className="rounded-[22px] bg-white border border-black/[0.03] shadow-xs p-3 flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group cursor-pointer"
              >
                {/* Left: Piggy / Emoji in Yellow Box + Goal Name & Amount */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#FAD170] flex items-center justify-center text-lg shadow-2xs shrink-0">
                    {goal.emoji || "🐷"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      {goal.name}
                    </span>
                    <span className="text-xs font-extrabold text-stone-700 tabular-nums">
                      ${goal.current_amount.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                {/* Right: Actions (% percent button & detail/download button) */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Percent Button / Progress badge */}
                  <button
                    onClick={() => openGoalDetail(goal)}
                    title={`Progres: ${pct}%`}
                    className="h-8 px-2 rounded-full border border-black/[0.06] bg-surface-muted/40 hover:bg-white text-stone-700 flex items-center gap-1 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Percent className="w-3 h-3 text-stone-500" />
                    <span>{pct}%</span>
                  </button>

                  {/* Detail/Edit Action Button */}
                  <button
                    onClick={() => openGoalDetail(goal)}
                    title="Buka detail target tabungan"
                    className="w-8 h-8 rounded-full border border-black/[0.06] bg-surface-muted/40 hover:bg-white hover:text-brand-orange text-stone-600 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal Detail View Modal (SavOr Style) */}
      <GoalDetailDialog
        goal={selectedGoal}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEditFromDetail}
      />

      {/* Goal Form Dialog Modal (Create / Edit) */}
      <GoalDialog
        goal={editingGoal}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
      />
    </div>
  );
}
