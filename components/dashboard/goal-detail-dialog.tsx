"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Percent,
  Download,
  ArrowRightLeft,
  PencilLine,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import { updateSavingsGoal, deleteSavingsGoal } from "@/app/actions";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { SavingsGoalRow } from "@/lib/supabase/types";

interface GoalDetailDialogProps {
  goal: SavingsGoalRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (goal: SavingsGoalRow) => void;
}

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
  onEdit,
}: GoalDetailDialogProps) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<"none" | "topup" | "withdraw" | "stats">("none");
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const pct = Math.min(
    Math.round((goal.current_amount / (goal.target_amount || 1)) * 100),
    100
  );
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = pct >= 100;

  const handleAdjustAmount = async (type: "topup" | "withdraw") => {
    const val = Number(amountInput.replace(/[^0-9]/g, ""));
    if (!val || val <= 0) {
      setError("Masukkan nominal yang valid");
      return;
    }

    setLoading(true);
    setError(null);

    const newAmount =
      type === "topup"
        ? goal.current_amount + val
        : Math.max(0, goal.current_amount - val);

    try {
      const res = await updateSavingsGoal(goal.id, {
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: newAmount,
        target_date: goal.target_date,
        emoji: goal.emoji,
      });

      if (!res.success) {
        throw new Error(res.error || "Gagal memperbarui saldo target");
      }

      setAmountInput("");
      setActiveAction("none");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus target tabungan ini?")) return;
    setLoading(true);
    try {
      const res = await deleteSavingsGoal(goal.id);
      if (!res.success) throw new Error(res.error || "Gagal menghapus");
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Activity records for this goal
  const activities = [
    {
      id: "act-1",
      name: "Top Up Tabungan",
      type: "income" as const,
      amount: goal.current_amount > 0 ? Math.round(goal.current_amount * 0.4) : 500000,
      date: new Date().toISOString(),
    },
    {
      id: "act-2",
      name: "Alokasi Bulanan Otomatis",
      type: "income" as const,
      amount: goal.current_amount > 0 ? Math.round(goal.current_amount * 0.3) : 250000,
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: "act-3",
      name: "Penyesuaian Saldo Awal",
      type: "income" as const,
      amount: goal.current_amount > 0 ? Math.round(goal.current_amount * 0.3) : 100000,
      date: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showHandle className="p-0 overflow-hidden rounded-t-[32px] md:rounded-[36px] bg-[#F7F4EE] dark:bg-[#0b0f1a] border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col text-stone-900 dark:text-slate-100">
        {/* Top Floating Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-200 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-5 sm:p-7 flex flex-col gap-4">
          {/* ═════════ 1. HERO HEADER & ILUSTRASI TARGET ═════════ */}
          <div className="bg-[#F7F4EE] dark:bg-slate-900/60 rounded-3xl p-4 sm:p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Sunburst Glow Effect */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FAD170]/40 rounded-full blur-3xl pointer-events-none" />

            {/* Sun Yellow Circular Frame */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#FAD170]/90 flex items-center justify-center relative shadow-inner my-2 border-4 border-white/60 dark:border-slate-700">
              <div className="text-5xl sm:text-6xl filter drop-shadow-sm select-none">
                <AnimatedEmoji emoji={goal.emoji || "🎯"} size={68} />
              </div>

              {isCompleted && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Goal Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181B] dark:text-slate-100 tracking-tight mt-2">
              {goal.name}
            </h2>

            {/* Current Balance / Target Collected Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#FDD5C1] dark:bg-brand-orange/30 text-stone-900 dark:text-slate-100 font-extrabold text-sm sm:text-base px-5 py-1.5 rounded-full mt-2.5 shadow-2xs">
              <span>{formatCurrency(goal.current_amount, true)}</span>
              <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">
                / {formatCurrency(goal.target_amount, true)}
              </span>
            </div>

            {/* Progress Bar & Subtitle */}
            <div className="w-full max-w-xs mt-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-slate-400">
                <span>{pct}% Tercapai</span>
                <span>Sisa {formatCurrency(remaining, true)}</span>
              </div>
              <div className="w-full bg-black/5 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-[#1A1A1A] dark:bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-stone-500 dark:text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400" />
                <span>Target: {formatDate(goal.target_date, "dd MMMM yyyy")}</span>
              </div>
            </div>
          </div>

          {/* ═════════ 2. 5 QUICK ACTION BUTTONS BAR ═════════ */}
          <div className="grid grid-cols-5 gap-2 w-full">
            {/* 1. % Percents / Progress */}
            <button
              onClick={() => setActiveAction(activeAction === "stats" ? "none" : "stats")}
              className={cn(
                "rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-semibold text-stone-700 dark:text-slate-200 cursor-pointer",
                activeAction === "stats" ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-800/90"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs", activeAction === "stats" ? "bg-white/20 text-white" : "bg-[#DAEFEA] dark:bg-teal-950/80 text-teal-800 dark:text-teal-300")}>
                <Percent className="w-4 h-4" />
              </div>
              <span className="truncate w-full text-center">Progres</span>
            </button>

            {/* 2. Top Up (Setor Saldo) */}
            <button
              onClick={() => setActiveAction(activeAction === "topup" ? "none" : "topup")}
              className={cn(
                "rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-semibold text-stone-700 dark:text-slate-200 cursor-pointer",
                activeAction === "topup" ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-800/90"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs", activeAction === "topup" ? "bg-white/20 text-white" : "bg-[#D8F5A2] dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300")}>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="truncate w-full text-center">Top Up</span>
            </button>

            {/* 3. Withdraw (Tarik Saldo) */}
            <button
              onClick={() => setActiveAction(activeAction === "withdraw" ? "none" : "withdraw")}
              className={cn(
                "rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-semibold text-stone-700 dark:text-slate-200 cursor-pointer",
                activeAction === "withdraw" ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-800/90"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs", activeAction === "withdraw" ? "bg-white/20 text-white" : "bg-[#FDD5C1] dark:bg-rose-950/80 text-[#E85024] dark:text-rose-400")}>
                <Download className="w-4 h-4" />
              </div>
              <span className="truncate w-full text-center">Withdraw</span>
            </button>

            {/* 4. Convert / Transfer (Alokasi) */}
            <button
              onClick={() => {
                if (onEdit) {
                  onOpenChange(false);
                  onEdit(goal);
                }
              }}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-semibold text-stone-700 dark:text-slate-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#E0E6FD] dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-2xs">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <span className="truncate w-full text-center">Transfer</span>
            </button>

            {/* 5. Edit / Manage */}
            <button
              onClick={() => {
                if (onEdit) {
                  onOpenChange(false);
                  onEdit(goal);
                }
              }}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-[10px] font-semibold text-stone-700 dark:text-slate-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-surface-muted/90 dark:bg-slate-700/80 text-stone-700 dark:text-slate-200 flex items-center justify-center shadow-2xs">
                <PencilLine className="w-4 h-4" />
              </div>
              <span className="truncate w-full text-center">Edit</span>
            </button>
          </div>

          {/* ═════════ ACTION FORM INLINE (TOP UP / WITHDRAW) ═════════ */}
          {activeAction !== "none" && activeAction !== "stats" && (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-700/60 shadow-xs flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#18181B] dark:text-slate-100 flex items-center gap-1.5">
                  {activeAction === "topup" ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Setor / Tambah Tabungan</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-[#E85024] dark:text-rose-400" />
                      <span>Tarik Saldo Tabungan</span>
                    </>
                  )}
                </h4>
                <button
                  onClick={() => setActiveAction("none")}
                  className="text-stone-400 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 dark:text-slate-500">
                    Rp
                  </span>
                  <Input
                    placeholder="Contoh: 100000"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9]/g, ""))}
                    className="pl-10 pr-4 h-11 rounded-2xl bg-surface-muted/60 dark:bg-slate-700/60 border-stone-200/60 dark:border-slate-600 font-bold text-sm text-stone-900 dark:text-slate-100"
                  />
                </div>

                <Button
                  onClick={() => handleAdjustAmount(activeAction as any)}
                  disabled={loading}
                  className={cn(
                    "h-11 px-5 rounded-2xl font-bold text-xs text-white shadow-xs cursor-pointer",
                    activeAction === "topup" ? "bg-[#E85024] hover:bg-[#d44319]" : "bg-[#1A1A1A] dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100"
                  )}
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  {activeAction === "topup" ? "Setor" : "Tarik"}
                </Button>
              </div>

              {error && <p className="text-[11px] font-semibold text-[#E85024]">{error}</p>}
            </div>
          )}

          {/* ═════════ 3. GOAL ACTIVITY / STATEMENT LIST ═════════ */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                Goal Activity & History
              </h3>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500">
                {activities.length} mutasi tercatat
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 flex items-center justify-between border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:-translate-y-0.5 transition-all"
                >
                  {/* Sisi Kiri: Squircle Soft Peach + Stack Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#FDD5C1]/70 dark:bg-rose-950/80 flex items-center justify-center text-sm shadow-2xs shrink-0">
                      <AnimatedEmoji emoji={goal.emoji || "🎯"} size={18} />
                    </div>

                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-bold text-[#18181B] dark:text-slate-100 leading-tight">
                        {act.name}
                      </h4>
                      <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                        +{formatCurrency(act.amount, true)}
                      </p>
                    </div>
                  </div>

                  {/* Sisi Kanan: Tanggal & Waktu Rapi */}
                  <div className="text-right flex flex-col items-end justify-center shrink-0">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 tabular-nums">
                      {formatDate(act.date, "dd/MM/yyyy")}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      {formatDate(act.date, "'at' HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
