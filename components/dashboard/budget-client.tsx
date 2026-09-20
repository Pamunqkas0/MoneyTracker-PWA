"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Edit2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Calendar,
  ArrowUp,
  Sparkles,
  PiggyBank,
  Check,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_META } from "@/lib/mock-data";
import { AppTopHeader } from "@/components/dashboard/app-top-header";
import { GoalDialog } from "@/components/dashboard/goal-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { upsertBudgetItem, updateSavingsGoal } from "@/app/actions";
import type { BudgetItemRow, SavingsGoalRow } from "@/lib/supabase/types";
import type { Category } from "@/lib/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

// Schema validasi budget limit
const budgetSchema = z.object({
  category: z.string().min(1, "Pilih kategori anggaran"),
  limit: z.number().positive("Limit harus lebih dari 0"),
});
type BudgetFormValues = z.infer<typeof budgetSchema>;

const MONTHS = [
  { value: 0, label: "Januari" },
  { value: 1, label: "Februari" },
  { value: 2, label: "Maret" },
  { value: 3, label: "April" },
  { value: 4, label: "Mei" },
  { value: 5, label: "Juni" },
  { value: 6, label: "Juli" },
  { value: 7, label: "Agustus" },
  { value: 8, label: "September" },
  { value: 9, label: "Oktober" },
  { value: 10, label: "November" },
  { value: 11, label: "Desember" },
];

const YEARS = [2024, 2025, 2026, 2027];

interface BudgetClientProps {
  initialBudgets: BudgetItemRow[];
  availableCategories: AvailableTransactionCategories;
  savingsGoals?: SavingsGoalRow[];
  currentMonth: number;
  currentYear: number;
}

const GOAL_CARD_THEMES = [
  { bg: "bg-[#D8F5A2]", text: "text-emerald-950", bar: "bg-emerald-600", lightBar: "bg-emerald-200/80" },
  { bg: "bg-[#FDD5C1]", text: "text-amber-950", bar: "bg-[#E85024]", lightBar: "bg-orange-200/80" },
  { bg: "bg-[#FAD170]", text: "text-amber-950", bar: "bg-amber-600", lightBar: "bg-amber-200/80" },
  { bg: "bg-[#E0E6FD]", text: "text-indigo-950", bar: "bg-indigo-600", lightBar: "bg-indigo-200/80" },
  { bg: "bg-[#DAEFEA]", text: "text-teal-950", bar: "bg-teal-600", lightBar: "bg-teal-200/80" },
];

export function BudgetClient({
  initialBudgets,
  availableCategories,
  savingsGoals: initialSavingsGoals = [],
  currentMonth: initialMonth,
  currentYear: initialYear,
}: BudgetClientProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [budgets, setBudgets] = useState<BudgetItemRow[]>(initialBudgets);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalRow[]>(initialSavingsGoals);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"Semua" | "Aktif" | "Tercapai">("Semua");
  const [activeGoalId, setActiveGoalId] = useState<string>("");
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  // Dialog State untuk Goal & Budget Limit
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalRow | null>(null);

  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItemRow | null>(null);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [isBudgetSuccess, setIsBudgetSuccess] = useState(false);
  const [budgetErrorMsg, setBudgetErrorMsg] = useState("");
  const [rawLimit, setRawLimit] = useState("");

  // Update state when props change
  useEffect(() => {
    setCurrentMonth(initialMonth);
    setCurrentYear(initialYear);
    setBudgets(initialBudgets);
    if (initialSavingsGoals) {
      setSavingsGoals(initialSavingsGoals);
      if (initialSavingsGoals.length > 0 && !activeGoalId) {
        setActiveGoalId(initialSavingsGoals[0].id);
      }
    }
  }, [initialMonth, initialYear, initialBudgets, initialSavingsGoals]);

  // Selected Active Goal
  const activeGoal = useMemo(() => {
    if (savingsGoals.length === 0) return null;
    return savingsGoals.find((g) => g.id === activeGoalId) || savingsGoals[0];
  }, [savingsGoals, activeGoalId]);

  // Total savings calculation
  const totalSavings = useMemo(() => {
    return savingsGoals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
  }, [savingsGoals]);

  const totalTargetSavings = useMemo(() => {
    return savingsGoals.reduce((acc, g) => acc + (g.target_amount || 0), 0);
  }, [savingsGoals]);

  const overallProgressPct = useMemo(() => {
    if (totalTargetSavings === 0) return 0;
    return Math.min(Math.round((totalSavings / totalTargetSavings) * 100), 100);
  }, [totalSavings, totalTargetSavings]);

  // Handle Quick Top Up to Active Goal
  const handleTopUp = async (amount: number) => {
    if (!activeGoal || isTopUpLoading) return;

    setIsTopUpLoading(true);
    const newAmount = (activeGoal.current_amount || 0) + amount;

    // Optimistic UI update
    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === activeGoal.id ? { ...g, current_amount: newAmount } : g
      )
    );

    setTopUpSuccessMsg(`+${formatCurrency(amount, true)} ke "${activeGoal.name}"!`);
    setTimeout(() => setTopUpSuccessMsg(null), 2500);

    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate([20, 30, 20]);
    }

    try {
      await updateSavingsGoal(activeGoal.id, {
        name: activeGoal.name,
        target_amount: activeGoal.target_amount,
        current_amount: newAmount,
        target_date: activeGoal.target_date,
        emoji: activeGoal.emoji || "🎯",
      });
      router.refresh();
    } catch (err) {
      console.error("Top up error:", err);
    } finally {
      setIsTopUpLoading(false);
    }
  };

  // Filter goals based on tab
  const filteredGoals = useMemo(() => {
    if (selectedTimeframe === "Aktif") {
      return savingsGoals.filter((g) => g.current_amount < g.target_amount);
    }
    if (selectedTimeframe === "Tercapai") {
      return savingsGoals.filter((g) => g.current_amount >= g.target_amount);
    }
    return savingsGoals;
  }, [savingsGoals, selectedTimeframe]);

  // Handle Month/Year period change
  const handlePeriodChange = (month: number, year: number) => {
    startTransition(() => {
      router.push(`/dashboard/budget?month=${month}&year=${year}`);
    });
  };

  // React Hook Form for Budget Limits
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { limit: 0 },
  });

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawLimit(raw);
    setValue("limit", Number(raw), { shouldValidate: !!raw });
  };

  const handleOpenAddBudget = () => {
    setEditingBudget(null);
    reset({ category: "", limit: 0 });
    setRawLimit("");
    setBudgetErrorMsg("");
    setBudgetDialogOpen(true);
  };

  const handleOpenEditBudget = (budget: BudgetItemRow) => {
    setEditingBudget(budget);
    reset({ category: budget.category, limit: budget.limit });
    setRawLimit(budget.limit.toString());
    setBudgetErrorMsg("");
    setBudgetDialogOpen(true);
  };

  const onBudgetSubmit = async (data: BudgetFormValues) => {
    setIsBudgetLoading(true);
    setBudgetErrorMsg("");

    try {
      const result = await upsertBudgetItem(data.category, data.limit);

      if (!result.success) {
        setBudgetErrorMsg(result.error || "Gagal menyimpan anggaran");
        setIsBudgetLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      setIsBudgetLoading(false);
      setIsBudgetSuccess(true);
      router.refresh();
      setTimeout(() => {
        setIsBudgetSuccess(false);
        setBudgetDialogOpen(false);
      }, 1400);
    } catch {
      setBudgetErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsBudgetLoading(false);
    }
  };

  const openAddGoalDialog = () => {
    setEditingGoal(null);
    setGoalDialogOpen(true);
  };

  const openEditGoalDialog = (goal: SavingsGoalRow) => {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-8 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl rounded-[32px] sm:rounded-[36px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-5 sm:p-7 md:p-8 shadow-xs flex flex-col gap-6"
      >
        {/* ── 1. TOP HEADER (Navigation & Profile) ── */}
        <AppTopHeader />

        {/* ── 2. SAVINGS & GOALS HERO SECTION (Rupiah Real) ── */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B] dark:text-slate-100 tracking-tight">
              Tabungan
            </h2>

            {/* Timeframe / Filter Selector Pill */}
            <div className="flex items-center bg-surface-muted/80 dark:bg-slate-800/80 p-1 rounded-full border border-black/[0.03] dark:border-slate-700/60 text-xs font-medium">
              {(["Semua", "Aktif", "Tercapai"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTimeframe(tab)}
                  className={cn(
                    "px-3 py-1 rounded-full transition-all cursor-pointer font-bold text-[11px] sm:text-xs",
                    selectedTimeframe === tab
                      ? "bg-[#E85024] text-white shadow-xs"
                      : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Big Amount in Rupiah */}
          <div className="my-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-slate-100 tracking-tight tabular-nums block leading-tight">
              {formatCurrency(totalSavings)}
            </span>
          </div>

          {/* Progress Subtext */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-wrap">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{overallProgressPct}%</span>
            </div>
            <span className="text-stone-300 dark:text-slate-600">&bull;</span>
            <span className="text-stone-600 dark:text-slate-400 font-semibold">
              Target: {formatCurrency(totalTargetSavings, true)} ({savingsGoals.length} Impian)
            </span>
          </div>
        </div>

        {/* ── 3. GOAL SQUIRCLE CHIPS & SPECTRUM PROGRESS BAR ── */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Goal Avatars Selector Row */}
          {savingsGoals.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
              {savingsGoals.map((goal, idx) => {
                const isActive = activeGoal?.id === goal.id;
                const theme = GOAL_CARD_THEMES[idx % GOAL_CARD_THEMES.length];
                const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setActiveGoalId(goal.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer select-none shrink-0 border",
                      isActive
                        ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-950 border-transparent shadow-xs scale-[1.02]"
                        : "bg-white dark:bg-slate-800/80 text-stone-800 dark:text-slate-200 border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-2xs shrink-0", theme.bg)}>
                      <AnimatedEmoji emoji={goal.emoji || "🎯"} size={16} />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold truncate max-w-[120px]">
                        {goal.name}
                      </span>
                      <span className={cn("text-[10px] font-semibold tabular-nums", isActive ? "text-stone-300 dark:text-slate-600" : "text-stone-500 dark:text-slate-400")}>
                        {pct}% &bull; {formatCurrency(goal.current_amount, true)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Dynamic Spectrum Wave Progress Indicator */}
          <div className="relative pt-2 pb-1 group">
            {/* Ambient Glow matching progress */}
            <div 
              className={cn(
                "absolute inset-0 blur-xl opacity-35 transition-all duration-700 pointer-events-none",
                activeGoal
                  ? (activeGoal.target_amount > 0 && activeGoal.current_amount >= activeGoal.target_amount)
                    ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500"
                    : "bg-gradient-to-r from-[#D8F5A2] via-[#FDD5C1] to-[#FAD170]"
                  : "bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 dark:from-slate-800 dark:to-slate-700"
              )} 
            />
            <div className="relative flex items-center justify-between gap-[2px] sm:gap-[3px] w-full overflow-hidden px-1 py-1">
              {Array.from({ length: 50 }).map((_, i) => {
                const totalBars = 50;
                const barPctThreshold = (i / (totalBars - 1)) * 100;
                
                // Active goal percent vs overall percent
                const currentGoalPct = activeGoal && activeGoal.target_amount > 0
                  ? Math.min(Math.round((activeGoal.current_amount / activeGoal.target_amount) * 100), 100)
                  : overallProgressPct;

                const isFilled = barPctThreshold <= currentGoalPct;
                const isCurrentCursor = Math.abs(barPctThreshold - currentGoalPct) < (100 / totalBars);

                // Wave pattern math
                const wave = Math.sin((i / totalBars) * Math.PI);
                const isTick = i % 2 === 0;
                const heightClass = isTick
                  ? wave > 0.6
                    ? "h-11 sm:h-12"
                    : "h-9 sm:h-10"
                  : wave > 0.6
                  ? "h-8 sm:h-9"
                  : "h-6 sm:h-7";

                let barColorClass = "bg-stone-200/60 dark:bg-slate-800/80"; // Unfilled state

                if (isFilled) {
                  if (currentGoalPct >= 100) {
                    barColorClass = "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                  } else if (i < totalBars * 0.35) {
                    barColorClass = "bg-[#78B13F] dark:bg-[#A3E635]"; // Green tone
                  } else if (i < totalBars * 0.75) {
                    barColorClass = "bg-[#E85024] dark:bg-[#FF6B3D]"; // Brand orange tone
                  } else {
                    barColorClass = "bg-[#E5A000] dark:bg-[#FBBF24]"; // Golden tone
                  }
                }

                return (
                  <div
                    key={i}
                    title={`${Math.round(barPctThreshold)}%`}
                    className={cn(
                      "w-[2px] sm:w-[3px] rounded-full transition-all duration-500 transform-gpu",
                      barColorClass,
                      heightClass,
                      isCurrentCursor && "scale-y-110 brightness-125",
                      !isFilled && "opacity-40 hover:opacity-75"
                    )}
                    style={{
                      transitionDelay: `${i * 6}ms`,
                    }}
                  />
                );
              })}
            </div>

            {/* Indicator legend / percentage status */}
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-slate-500 px-1 pt-1.5 tabular-nums">
              <span>0%</span>
              <span className="text-stone-700 dark:text-slate-300 font-extrabold flex items-center gap-1">
                {activeGoal ? (
                  <>
                    <span>{activeGoal.name}:</span>
                    <span className="text-[#E85024]">
                      {activeGoal.target_amount > 0
                        ? Math.round((activeGoal.current_amount / activeGoal.target_amount) * 100)
                        : 0}%
                    </span>
                  </>
                ) : (
                  <span>Total: {overallProgressPct}%</span>
                )}
              </span>
              <span>100% Target</span>
            </div>
          </div>
        </div>

        {/* ── 4. QUICK TOP-UP WIDGET (Rupiah Functional) ── */}
        {activeGoal && (
          <div className="rounded-3xl border border-stone-200/60 dark:border-slate-700/60 bg-surface-muted/30 dark:bg-slate-800/40 p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate">
                    Top Up: <span className="text-[#E85024]">{activeGoal.name}</span>
                  </span>
                </div>
              </div>

              {topUpSuccessMsg && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full shrink-0"
                >
                  {topUpSuccessMsg}
                </motion.span>
              )}
            </div>

            {/* 4 Quick Top Up Nominal Chips (Rupiah) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "+50 rb", val: 50000 },
                { label: "+100 rb", val: 100000 },
                { label: "+250 rb", val: 250000 },
                { label: "+500 rb", val: 500000 },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleTopUp(chip.val)}
                  disabled={isTopUpLoading}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3.5 border border-stone-200/70 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center gap-1 hover:scale-105 hover:border-amber-400 hover:shadow-md active:scale-95 transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 flex items-center justify-center shadow-xs border border-amber-300 group-hover:rotate-12 transition-transform">
                    <span className="text-xs font-black text-amber-900 leading-none">🪙</span>
                  </div>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 tabular-nums">
                    {chip.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. DAFTAR TARGET TABUNGAN ── */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
              Target Impian
            </h3>
            <button
              type="button"
              onClick={openAddGoalDialog}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Target</span>
            </button>
          </div>

          {/* Goal Cards Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            {filteredGoals.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-7 rounded-3xl bg-surface-muted/30 dark:bg-slate-800/40 border border-stone-200/50 dark:border-slate-700/60 text-center px-4">
                <PiggyBank className="h-7 w-7 text-stone-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">Belum Ada Target</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                  Mulai rencanakan tabungan Anda.
                </p>
                <button
                  type="button"
                  onClick={openAddGoalDialog}
                  className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white text-xs font-bold cursor-pointer"
                >
                  + Target Baru
                </button>
              </div>
            ) : (
              filteredGoals.map((goal, idx) => {
                const theme = GOAL_CARD_THEMES[idx % GOAL_CARD_THEMES.length];
                const pct = goal.target_amount > 0 ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100) : 0;
                const isCompleted = goal.current_amount >= goal.target_amount;

                return (
                  <div
                    key={goal.id}
                    onClick={() => openEditGoalDialog(goal)}
                    className="p-3.5 sm:p-4 rounded-3xl bg-surface-muted/40 dark:bg-slate-800/50 hover:bg-surface-muted/70 dark:hover:bg-slate-800 border border-stone-200/50 dark:border-slate-700/60 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-lg shadow-2xs shrink-0", theme.bg)}>
                          <AnimatedEmoji emoji={goal.emoji || "🎯"} size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate group-hover:text-[#E85024] transition-colors">
                            {goal.name}
                          </h4>
                          <span className="text-[10px] font-medium text-stone-500 dark:text-slate-400">
                            {goal.target_date ? new Date(goal.target_date).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold">
                            Tercapai
                          </span>
                        )}
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 group-hover:text-stone-800 dark:group-hover:text-white transition-colors">
                          <Edit2 className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">
                          {formatCurrency(goal.current_amount)}
                        </span>
                        <span className="font-semibold text-stone-500 dark:text-slate-400 tabular-nums text-[10px] sm:text-[11px]">
                          {pct}% dari {formatCurrency(goal.target_amount, true)}
                        </span>
                      </div>
                      <div className="w-full bg-stone-200/80 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", isCompleted ? "bg-emerald-500" : theme.bar)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 6. BATAS PENGELUARAN BULANAN (Monthly Budget Breakdown) ── */}
        <div className="flex flex-col gap-3 pt-2 border-t border-stone-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">
                Batas Anggaran
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Limit belanja bulanan per kategori
              </p>
            </div>

            {/* Periode Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Select
                value={String(currentMonth)}
                onValueChange={(val) => handlePeriodChange(Number(val), currentYear)}
              >
                <SelectTrigger className="w-26 rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-xs font-bold h-8 sm:h-9 text-[#18181B] dark:text-slate-200">
                  <Calendar className="h-3 w-3 mr-1 text-stone-400 dark:text-slate-400" />
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:border-slate-800 dark:bg-slate-900">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs font-medium">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(currentYear)}
                onValueChange={(val) => handlePeriodChange(currentMonth, Number(val))}
              >
                <SelectTrigger className="w-20 rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-xs font-bold h-8 sm:h-9 text-[#18181B] dark:text-slate-200">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:border-slate-800 dark:bg-slate-900">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs font-medium">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleOpenAddBudget}
                className="h-8 sm:h-9 px-3 rounded-full bg-[#1A1A1A] dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span>Limit</span>
              </Button>
            </div>
          </div>

          {/* Budget Items List */}
          <div className="space-y-2.5">
            {initialBudgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 rounded-3xl bg-surface-muted/30 dark:bg-slate-800/40 border border-stone-200/50 dark:border-slate-700/60 text-center px-4">
                <Target className="h-8 w-8 text-stone-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">Belum Ada Batas Anggaran</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                  Buat limit pengeluaran bulanan pertama Anda.
                </p>
                <Button
                  onClick={handleOpenAddBudget}
                  className="mt-3 h-8 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Atur Limit
                </Button>
              </div>
            ) : (
              initialBudgets.map((item) => {
                const pct = Math.min(Math.round((item.spent / item.limit) * 100), 999);
                const isOver = pct >= 100;
                const categoryMeta = availableCategories.bySlug[item.category];
                const fallbackMeta = CATEGORY_META[item.category as Category];
                const metaEmoji = categoryMeta?.emoji || fallbackMeta?.emoji || "🏷️";
                const metaLabel = categoryMeta?.name || fallbackMeta?.label || item.category;
                const metaColor = categoryMeta?.color || fallbackMeta?.color || "#E85024";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-surface-muted/40 dark:bg-slate-800/60 hover:bg-surface-muted/70 dark:hover:bg-slate-800 transition-colors border border-stone-200/50 dark:border-slate-700/60 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category Squircle Icon */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-black/[0.02] dark:border-white/[0.04]"
                          style={{
                            backgroundColor: `${metaColor}18`,
                          }}
                        >
                          <AnimatedEmoji emoji={metaEmoji} size={20} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate">
                              {metaLabel}
                            </span>
                            {isOver && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 shrink-0">
                                Overlimit ({pct}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black tabular-nums text-stone-900 dark:text-slate-100">
                          {formatCurrency(item.spent, true)} / {formatCurrency(item.limit, true)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditBudget(item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                          title="Edit Limit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-stone-200/80 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isOver ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-[#1A1A1A] dark:bg-slate-100"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Dialog Form Target Impian (GoalDialog) ── */}
      <GoalDialog
        goal={editingGoal}
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
      />

      {/* ── Dialog Form Tambah / Edit Limit Budget ── */}
      <AnimatePresence>
        {budgetDialogOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70]" onClick={() => setBudgetDialogOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-black/[0.04] dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-2xl z-[80] max-h-[90svh] overflow-hidden flex flex-col text-stone-900 dark:text-slate-100"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 pb-3 shrink-0">
                <div className="w-12 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xs shrink-0 transition-colors bg-[#FAD170] text-amber-900">
                      <Target className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                        {editingBudget ? "Edit Batas Anggaran" : "Atur Batas Anggaran"}
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                        Tentukan batas limit pengeluaran bulanan per kategori.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBudgetDialogOpen(false)}
                    className="w-9 h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 transition-all cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {isBudgetSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F5A2]">
                    <CheckCircle2 className="h-8 w-8 text-emerald-800" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-lg text-[#18181B] dark:text-slate-100">Anggaran Berhasil Disimpan!</p>
                    <p className="text-xs text-stone-500 dark:text-slate-400">Limit baru berhasil diperbarui dalam sistem.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onBudgetSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                    {budgetErrorMsg && (
                      <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{budgetErrorMsg}</p>
                      </div>
                    )}

                    {/* Limit Box (Bento Hero Input) */}
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                          Batas Limit Bulanan
                        </span>
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 border border-black/[0.02] dark:border-slate-700">
                          IDR (Rp)
                        </span>
                      </div>

                      <div className="flex items-baseline justify-end gap-2 py-1 min-h-[56px]">
                        <span className="text-2xl sm:text-3xl font-black text-stone-300 dark:text-slate-600 select-none pb-0.5">
                          Rp
                        </span>
                        <input
                          id="limit"
                          inputMode="numeric"
                          placeholder="0"
                          value={rawLimit ? Number(rawLimit).toLocaleString("id-ID") : ""}
                          onChange={handleLimitChange}
                          className="w-full text-right font-black text-[#18181B] dark:text-slate-100 tracking-tight bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 tabular-nums placeholder:text-stone-300 dark:placeholder:text-slate-600 cursor-text leading-tight !text-3xl sm:!text-4xl"
                        />
                      </div>

                      {/* Quick Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 max-w-full">
                        {[
                          { label: "+500 rb", val: 500000 },
                          { label: "+1 jt", val: 1000000 },
                          { label: "+2 jt", val: 2000000 },
                          { label: "+5 jt", val: 5000000 },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              const current = Number(rawLimit) || 0;
                              const updated = current + chip.val;
                              setRawLimit(String(updated));
                              setValue("limit", updated, { shouldValidate: true });
                            }}
                            className="bg-white dark:bg-slate-800 hover:bg-[#FAD170]/40 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-full border border-black/[0.03] dark:border-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 select-none"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {errors.limit && (
                        <p className="text-[11px] text-rose-500 font-medium">{errors.limit.message}</p>
                      )}
                    </div>

                    {/* Kategori Pengeluaran */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        Kategori Pengeluaran
                      </Label>
                      {editingBudget ? (
                        <Input
                          disabled
                          value={availableCategories.bySlug[editingBudget.category]?.name || editingBudget.category}
                          className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 font-bold text-[#18181B] dark:text-slate-100"
                        />
                      ) : (
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="h-12 rounded-2xl cursor-pointer bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4">
                                <SelectValue placeholder="Pilih kategori pengeluaran..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl dark:border-slate-800 dark:bg-slate-900 z-[90] max-h-[260px]">
                                {availableCategories.expense.map((cat) => (
                                  <SelectItem key={`${cat.type}-${cat.slug}`} value={cat.slug} className="rounded-xl">
                                    <span className="flex items-center gap-2 text-xs sm:text-sm">
                                      <AnimatedEmoji emoji={cat.emoji} size={16} />
                                      <span>{cat.name}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                      {errors.category && (
                        <p className="text-[11px] text-rose-500 font-medium">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Fixed Pinned Footer */}
                  <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={isBudgetLoading}
                      className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isBudgetLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> <span>Menyimpan Anggaran…</span></>
                      ) : (
                        <><Target className="h-4 w-4 stroke-[2.5]" /> <span>Simpan Batas Anggaran</span></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
