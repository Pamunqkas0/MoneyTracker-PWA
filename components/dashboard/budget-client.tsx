"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Plus,
  Edit2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Calendar,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowUpRight,
  Menu,
  User,
  Car,
  Home,
  Briefcase,
  Sparkles,
  PiggyBank,
} from "lucide-react";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { CATEGORY_META } from "@/lib/mock-data";
import { AppTopHeader } from "@/components/dashboard/app-top-header";
import { cn, formatCurrency } from "@/lib/utils";
import { upsertBudgetItem, updateSavingsGoal } from "@/app/actions";
import type { BudgetItemRow, SavingsGoalRow } from "@/lib/supabase/types";
import type { Category } from "@/lib/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

// Schema validasi
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [activeGoalIndex, setActiveGoalIndex] = useState(1);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItemRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rawLimit, setRawLimit] = useState("");

  // Update state when props change
  useEffect(() => {
    setCurrentMonth(initialMonth);
    setCurrentYear(initialYear);
    setBudgets(initialBudgets);
    if (initialSavingsGoals && initialSavingsGoals.length > 0) {
      setSavingsGoals(initialSavingsGoals);
    }
  }, [initialMonth, initialYear, initialBudgets, initialSavingsGoals]);

  // Default demo goals jika belum ada data di database
  const displayGoals = useMemo(() => {
    if (savingsGoals && savingsGoals.length > 0) {
      return savingsGoals.map((g, idx) => ({
        id: g.id,
        name: g.name,
        current_amount: g.current_amount,
        target_amount: g.target_amount,
        color: idx === 0 ? "bg-[#D8F5A2]" : idx === 1 ? "bg-[#FDD5C1]" : "bg-[#FAD170]",
        barColor: idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-[#E85024]" : "bg-amber-400",
        icon: idx === 0 ? Car : idx === 1 ? Home : Briefcase,
      }));
    }

    return [
      {
        id: "goal-1",
        name: "Electric Car",
        current_amount: 1200,
        target_amount: 45000,
        color: "bg-[#D8F5A2]",
        barColor: "bg-emerald-500",
        icon: Car,
      },
      {
        id: "goal-2",
        name: "My House",
        current_amount: 4000,
        target_amount: 120000,
        color: "bg-[#FDD5C1]",
        barColor: "bg-[#E85024]",
        icon: Home,
      },
      {
        id: "goal-3",
        name: "Business Expansion",
        current_amount: 850,
        target_amount: 25000,
        color: "bg-[#FAD170]",
        barColor: "bg-amber-400",
        icon: Briefcase,
      },
    ];
  }, [savingsGoals]);

  const activeGoal = displayGoals[activeGoalIndex] || displayGoals[0];

  // Total savings calculation
  const totalSavings = useMemo(() => {
    const sum = displayGoals.reduce((acc, g) => acc + g.current_amount, 0);
    return sum > 0 ? sum : 4113.89;
  }, [displayGoals]);

  // Handle Quick Top Up
  const handleTopUp = async (amount: number) => {
    if (activeGoal) {
      const newAmount = activeGoal.current_amount + amount;
      
      // Update local state for immediate feedback
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === activeGoal.id ? { ...g, current_amount: newAmount } : g
        )
      );

      setTopUpSuccessMsg(`Berhasil top up $${amount} ke ${activeGoal.name}!`);
      setTimeout(() => setTopUpSuccessMsg(null), 2500);

      try {
        if (!activeGoal.id.startsWith("goal-")) {
          await updateSavingsGoal(activeGoal.id, {
            name: activeGoal.name,
            target_amount: activeGoal.target_amount,
            current_amount: newAmount,
            target_date: new Date().toISOString(),
            emoji: "💰",
          });
        }
      } catch (err) {
        console.error("Top up error:", err);
      }
    }
  };

  // Fungsi untuk update query params URL saat dropdown diganti
  const handlePeriodChange = (month: number, year: number) => {
    startTransition(() => {
      router.push(`/dashboard/budget?month=${month}&year=${year}`);
    });
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { limit: 0 },
  });

  // Kalkulasi total budget
  const totals = useMemo(() => {
    const totalLimit = initialBudgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = initialBudgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = Math.max(0, totalLimit - totalSpent);
    return { totalLimit, totalSpent, remaining };
  }, [initialBudgets]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawLimit(raw);
    setValue("limit", Number(raw), { shouldValidate: !!raw });
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    reset({ category: "", limit: 0 });
    setRawLimit("");
    setErrorMsg("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (budget: BudgetItemRow) => {
    setEditingBudget(budget);
    reset({ category: budget.category, limit: budget.limit });
    setRawLimit(budget.limit.toString());
    setErrorMsg("");
    setDialogOpen(true);
  };

  const onSubmit = async (data: BudgetFormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await upsertBudgetItem(data.category, data.limit);

      if (!result.success) {
        setErrorMsg(result.error || "Gagal menyimpan anggaran");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDialogOpen(false);
      }, 1500);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-3 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl rounded-[32px] sm:rounded-[36px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-5 sm:p-7 md:p-8 shadow-xs flex flex-col gap-6"
      >
        {/* ── 1. TOP HEADER (☰ vs Hello, Fred vs 👤) ── */}
        <AppTopHeader />

        {/* ── 2. SAVINGS TITLE & TIMEFRAME SELECTOR ── */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B] dark:text-slate-100 tracking-tight">
              Savings
            </h2>

            {/* Timeframe selector pill */}
            <div className="flex items-center bg-surface-muted/80 dark:bg-slate-800/80 p-1 rounded-full border border-black/[0.03] dark:border-slate-700/60 text-xs font-medium">
              {(["24h", "7d", "30d"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    "px-3 py-1 rounded-full transition-all cursor-pointer font-bold",
                    selectedTimeframe === tf
                      ? "bg-[#E85024] text-white shadow-xs"
                      : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Big Amount */}
          <div className="my-1">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-slate-100 tracking-tight tabular-nums block">
              $ {totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Gain subtext */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>$3,0043.99 (0,34%)</span>
          </div>
        </div>

        {/* ── 3. MULTI-GOAL AVATARS ROW & BARCODE SPECTRUM PROGRESS BAR ── */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Goal Avatars Row */}
          <div className="flex items-center justify-between px-1">
            {displayGoals.map((goal, idx) => {
              const GoalIcon = goal.icon;
              const isActive = activeGoalIndex === idx;

              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setActiveGoalIndex(idx)}
                  className="flex items-center gap-2.5 transition-transform active:scale-95 cursor-pointer text-left select-none"
                >
                  {/* Squircle Avatar */}
                  <div
                    className={cn(
                      "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xs transition-all",
                      goal.color,
                      isActive ? "ring-2 ring-black/20 dark:ring-white/40 scale-105" : "opacity-85 hover:opacity-100"
                    )}
                  >
                    <GoalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-stone-900" />
                  </div>

                  {/* Active Goal Label Info */}
                  {isActive && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#18181B] dark:text-slate-100 leading-tight">
                        {goal.name}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 tabular-nums">
                        {goal.current_amount.toLocaleString("en-US")} / {goal.target_amount.toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Barcode Spectrum Chart with Soft Glow */}
          <div className="relative pt-2 pb-1">
            {/* Glow background */}
            <div className="absolute inset-0 blur-xl opacity-35 bg-gradient-to-r from-[#D8F5A2] via-[#FDD5C1] to-[#FAD170] pointer-events-none" />

            {/* Vertical Tick Barcode Grid */}
            <div className="relative flex items-center justify-between gap-[2px] w-full overflow-hidden px-1">
              {Array.from({ length: 54 }).map((_, i) => {
                // Segmentasi warna barcode: Hijau (0-16), Coral (17-38), Kuning (39-53)
                let barColor = "bg-[#D8F5A2]";
                let barHeight = "h-11";

                if (i >= 17 && i <= 38) {
                  barColor = "bg-[#FDD5C1]";
                  barHeight = "h-13";
                } else if (i > 38) {
                  barColor = "bg-[#FAD170]";
                  barHeight = "h-10";
                }

                // Wave pattern height variation
                const isTick = i % 2 === 0;

                return (
                  <div
                    key={i}
                    className={cn(
                      "w-[2.5px] sm:w-[3px] rounded-full transition-all duration-300",
                      barColor,
                      isTick ? barHeight : "h-9"
                    )}
                    style={{
                      opacity: 0.7 + ((i % 5) * 0.06),
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 4. TEAM MEMBERS SECTION ── */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
              Team Members
            </h3>
            <button
              type="button"
              className="text-xs font-bold text-[#E85024] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Stacked Circular Avatars */}
              <div className="flex items-center -space-x-2.5">
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden shadow-xs bg-amber-100 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                    alt="Member 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden shadow-xs bg-stone-800 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Member 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden shadow-xs bg-rose-100 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Member 3"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                You & 2 members
              </span>
            </div>

            {/* Circular Orange Plus Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-10 h-10 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Tambah Anggota / Goal"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ── 5. WIDGET "TOP UP NOW" (Koin Emas $50, $100, $150, $250) ── */}
        <div className="rounded-3xl border border-stone-200/60 dark:border-slate-700/60 bg-surface-muted/30 dark:bg-slate-800/40 p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100">
                Top up now
              </span>
            </div>

            {topUpSuccessMsg && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full"
              >
                {topUpSuccessMsg}
              </motion.span>
            )}
          </div>

          {/* 4 Gold Coin Buttons Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[50, 100, 150, 250].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleTopUp(val)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-3.5 border border-stone-200/70 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center gap-1.5 hover:scale-105 hover:border-amber-400 hover:shadow-md active:scale-95 transition-all cursor-pointer group"
              >
                {/* Shiny Gold Coin Emblem */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 flex items-center justify-center shadow-xs border border-amber-300 group-hover:rotate-12 transition-transform">
                  <span className="text-xs font-black text-amber-900 leading-none">
                    🪙
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-800 dark:text-slate-200 tabular-nums">
                  ${val}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 6. MONTHLY BUDGET BREAKDOWN SECTION (Preserved) ── */}
        <div className="flex flex-col gap-4 pt-2 border-t border-stone-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">
                Batas Pengeluaran Bulanan
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                Kontrol limit pengeluaran per kategori
              </p>
            </div>

            {/* Periode Selector */}
            <div className="flex items-center gap-2">
              <Select
                value={String(currentMonth)}
                onValueChange={(val) => handlePeriodChange(Number(val), currentYear)}
              >
                <SelectTrigger className="w-28 rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-xs font-bold h-9 text-[#18181B] dark:text-slate-200">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-stone-400 dark:text-slate-400" />
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
                <SelectTrigger className="w-24 rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-xs font-bold h-9 text-[#18181B] dark:text-slate-200">
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
                onClick={handleOpenAdd}
                className="h-9 px-3.5 rounded-full bg-[#1A1A1A] dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Limit</span>
              </Button>
            </div>
          </div>

          {/* Budget Items List */}
          <div className="space-y-2.5">
            {initialBudgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 rounded-3xl bg-surface-muted/30 dark:bg-slate-800/40 border border-stone-200/50 dark:border-slate-700/60 text-center px-4">
                <Target className="h-8 w-8 text-stone-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">Belum Ada Anggaran</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">Buat limit pengeluaran bulanan pertama Anda.</p>
                <Button
                  onClick={handleOpenAdd}
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
                const metaEmoji = categoryMeta?.emoji || fallbackMeta?.emoji || "📝";
                const metaLabel = categoryMeta?.name || fallbackMeta?.label || item.category;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-surface-muted/40 dark:bg-slate-800/60 hover:bg-surface-muted/70 dark:hover:bg-slate-800 transition-colors border border-stone-200/50 dark:border-slate-700/60 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{metaEmoji}</span>
                        <span className="text-xs font-bold text-[#18181B] dark:text-slate-100">{metaLabel}</span>
                        {isOver && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                            Overlimit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black tabular-nums text-stone-900 dark:text-slate-100">
                          {formatCurrency(item.spent, true)} / {formatCurrency(item.limit, true)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-slate-700/50 cursor-pointer ml-1"
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

      {/* ── Dialog Form Tambah / Edit Limit Budget ── */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70]" onClick={() => setDialogOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl border border-black/[0.04] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl z-[80] max-h-[90vh] overflow-y-auto pb-10 sm:pb-6 text-stone-900 dark:text-slate-100"
            >
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F5A2]">
                    <CheckCircle2 className="h-7 w-7 text-emerald-800" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-base text-[#18181B] dark:text-slate-100">Anggaran Berhasil Disimpan!</p>
                    <p className="text-xs text-stone-500 dark:text-slate-400">Limit baru berhasil diperbarui dalam sistem.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-slate-800">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FAD170] text-amber-900 shadow-xs">
                      <Target className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100">
                        {editingBudget ? "Edit Batas Anggaran" : "Atur Anggaran Kategori"}
                      </h2>
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                        Tentukan batas limit bulanan untuk kategori pengeluaran.
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-500/20 px-3 py-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Kategori */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Kategori Pengeluaran</Label>
                    {editingBudget ? (
                      <Input
                        disabled
                        value={availableCategories.bySlug[editingBudget.category]?.name || editingBudget.category}
                        className="bg-surface-muted/60 dark:bg-slate-800 rounded-2xl h-10 text-sm font-semibold text-[#18181B] dark:text-slate-100 border-stone-200 dark:border-slate-700"
                      />
                    ) : (
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-2xl h-10 text-xs sm:text-sm cursor-pointer bg-surface-muted/60 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-[#18181B] dark:text-slate-100">
                              <SelectValue placeholder="Pilih kategori..." />
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

                  {/* Limit */}
                  <div className="space-y-1.5">
                    <Label htmlFor="limit" className="text-xs font-semibold text-stone-500 dark:text-slate-400">Batas Limit Bulanan</Label>
                    <div className="relative flex items-center rounded-2xl bg-surface-muted/60 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 p-1 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/20 focus-within:bg-white dark:focus-within:bg-slate-850 transition-all">
                      <span className="pl-3 text-sm font-bold text-stone-400 dark:text-slate-500">
                        Rp
                      </span>
                      <Input
                        id="limit"
                        inputMode="numeric"
                        placeholder="0"
                        value={rawLimit ? Number(rawLimit).toLocaleString("id-ID") : ""}
                        onChange={handleLimitChange}
                        className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-base h-9 text-[#18181B] dark:text-slate-100 tabular-nums bg-transparent pr-2"
                      />
                    </div>
                    {errors.limit && (
                      <p className="text-[11px] text-rose-500 font-medium">{errors.limit.message}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5 pt-2 pb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1 rounded-full h-11 text-xs font-bold cursor-pointer bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 rounded-full h-11 text-xs font-bold text-white bg-[#E85024] hover:bg-[#d44319] cursor-pointer shadow-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-1.5 justify-center">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        "Simpan Limit"
                      )}
                    </Button>
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

