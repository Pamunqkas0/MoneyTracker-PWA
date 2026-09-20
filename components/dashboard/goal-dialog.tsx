"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from "@/app/actions";
import type { SavingsGoalRow } from "@/lib/supabase/types";
import {
  Loader2,
  Trash2,
  X,
  Plus,
  Target,
  CheckCircle2,
  AlertCircle,
  PiggyBank,
} from "lucide-react";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import { cn, formatCurrency } from "@/lib/utils";

interface GoalDialogProps {
  goal: SavingsGoalRow | null; // null for add mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GOAL_PRESETS = [
  { name: "Dana Darurat", emoji: "🛡️" },
  { name: "Beli Rumah / Kos", emoji: "🏠" },
  { name: "Kendaraan / Mobil", emoji: "🚗" },
  { name: "Gadget / Laptop", emoji: "💻" },
  { name: "Liburan & Wisata", emoji: "✈️" },
  { name: "Investasi / Modal", emoji: "📈" },
  { name: "Pernikahan", emoji: "💍" },
  { name: "Lainnya", emoji: "🎯" },
];

export function GoalDialog({ goal, open, onOpenChange }: GoalDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    emoji: "🎯",
  });

  // Reset or populate form when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      setIsSuccess(false);
      if (goal) {
        setFormData({
          name: goal.name,
          target_amount: goal.target_amount.toString(),
          current_amount: goal.current_amount.toString(),
          target_date: goal.target_date,
          emoji: goal.emoji,
        });
      } else {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setFormData({
          name: "",
          target_amount: "",
          current_amount: "0",
          target_date: nextYear.toISOString().slice(0, 10),
          emoji: "🎯",
        });
      }
    }
  }, [open, goal]);

  const handleAmountChange = (key: "target_amount" | "current_amount", value: string) => {
    const raw = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, [key]: raw }));
  };

  const handleAddQuickTarget = (val: number) => {
    const current = Number(formData.target_amount) || 0;
    const updated = current + val;
    setFormData((prev) => ({ ...prev, target_amount: String(updated) }));
  };

  const handleSelectPreset = (preset: (typeof GOAL_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name ? prev.name : preset.name,
      emoji: preset.emoji,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const values = {
      name: formData.name.trim(),
      target_amount: Number(formData.target_amount.replace(/[^0-9]/g, "")),
      current_amount: Number(formData.current_amount.replace(/[^0-9]/g, "")),
      target_date: formData.target_date,
      emoji: formData.emoji || "🎯",
    };

    if (!values.name || !values.target_amount || !values.target_date) {
      setError("Mohon lengkapi nama target, nominal sasaran, dan tenggat waktu.");
      setLoading(false);
      return;
    }

    try {
      let res;
      if (goal) {
        res = await updateSavingsGoal(goal.id, values);
      } else {
        res = await addSavingsGoal(values);
      }

      if (!res.success) {
        throw new Error(res.error || "Gagal menyimpan target tabungan.");
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      setLoading(false);
      setIsSuccess(true);
      router.refresh();

      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 1600);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !window.confirm(`Apakah Anda yakin ingin menghapus target "${goal.name}"?`)) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await deleteSavingsGoal(goal.id);
      if (!res.success) {
        throw new Error(res.error || "Gagal menghapus target.");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setError(null);
      setIsSuccess(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hideClose
        className="p-0 overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[86vh] h-auto rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full"
      >
        {/* Dynamic Header (Fixed Top) */}
        <div className="p-5 sm:p-6 pb-3 shrink-0">
          {/* Grab Handle Bar (khusus mobile) */}
          <div className="w-12 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xs shrink-0 transition-colors bg-[#D8F5A2]/80 dark:bg-emerald-950/80 text-stone-900 dark:text-emerald-300">
                <AnimatedEmoji emoji={formData.emoji || "🎯"} size={22} />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                  {isSuccess
                    ? "Target Disimpan"
                    : goal
                      ? "Edit Target"
                      : "Target Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  {isSuccess
                    ? "Data berhasil diperbarui"
                    : goal
                      ? "Perbarui nominal atau tenggat waktu"
                      : "Tentukan sasaran nominal tabungan"}
                </DialogDescription>
              </div>
            </div>

            {/* Tombol Tutup Bulat */}
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="w-9 h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 transition-all cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-10 px-5 sm:px-7 gap-4 text-center"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#D8F5A2]/60 dark:bg-emerald-500/30 animate-ping" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F5A2] dark:bg-emerald-950/60 text-stone-900 dark:text-emerald-300 shadow-sm border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-stone-800 dark:text-emerald-300" />
                </div>
              </div>
              <div className="space-y-1.5 px-2">
                <p className="text-lg font-bold text-[#18181B] dark:text-slate-100">
                  {goal ? "Perubahan Disimpan!" : "Target Berhasil Dibuat!"}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Target <span className="font-bold text-[#18181B] dark:text-slate-100">{formData.name}</span> sebesar{" "}
                  <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">
                    {formatCurrency(Number(formData.target_amount) || 0)}
                  </span>{" "}
                  telah aktif.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Target Nominal Hero Box */}
                <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                      Target Nominal
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 border border-black/[0.02] dark:border-slate-700">
                      IDR (Rp)
                    </span>
                  </div>

                  {/* Input Angka Besar */}
                  <div className="flex items-baseline justify-end gap-2 py-1 min-h-[56px]">
                    <span className="text-2xl sm:text-3xl font-black text-stone-300 dark:text-slate-600 select-none pb-0.5">
                      Rp
                    </span>
                    <input
                      id="goal-target-amount"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.target_amount ? Number(formData.target_amount).toLocaleString("id-ID") : ""}
                      onChange={(e) => handleAmountChange("target_amount", e.target.value)}
                      className={cn(
                        "w-full text-right font-black text-[#18181B] dark:text-slate-100 tracking-tight bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 tabular-nums placeholder:text-stone-300 dark:placeholder:text-slate-600 cursor-text leading-tight",
                        formData.target_amount.length > 10
                          ? "!text-2xl sm:!text-3xl"
                          : formData.target_amount.length > 7
                            ? "!text-3xl sm:!text-4xl"
                            : "!text-4xl sm:!text-5xl"
                      )}
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 max-w-full">
                    {[
                      { label: "+1 jt", val: 1000000 },
                      { label: "+5 jt", val: 5000000 },
                      { label: "+10 jt", val: 10000000 },
                      { label: "+25 jt", val: 25000000 },
                      { label: "+50 jt", val: 50000000 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleAddQuickTarget(chip.val)}
                        className="bg-white dark:bg-slate-800 hover:bg-[#FAD170]/40 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-full border border-black/[0.03] dark:border-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 select-none"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Preset Cepat Impian */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider block">
                    Pilihan Kategori Cepat
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {GOAL_PRESETS.map((preset) => {
                      const isSelected = formData.emoji === preset.emoji;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center transition-all duration-150 select-none cursor-pointer min-h-[64px] border",
                            isSelected
                              ? "bg-gradient-to-b from-orange-50/60 dark:from-orange-950/30 to-white dark:to-slate-800 ring-2 ring-[#E85024] shadow-md shadow-orange-500/10 -translate-y-0.5 border-[#E85024]/40 font-bold"
                              : "bg-white dark:bg-slate-800/70 hover:bg-stone-50/80 dark:hover:bg-slate-800 border-black/[0.04] dark:border-slate-700/60 shadow-xs hover:-translate-y-0.5 text-stone-700 dark:text-slate-300"
                          )}
                        >
                          <AnimatedEmoji emoji={preset.emoji} size={20} />
                          <span className={cn("text-[10px] leading-tight truncate w-full px-0.5", isSelected ? "text-[#18181B] dark:text-slate-100 font-bold" : "text-stone-600 dark:text-slate-300 font-medium")}>
                            {preset.name.split("/")[0].trim()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Input Nama & Emoji Kustom */}
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2.5">
                    <div className="space-y-1.5 w-[76px] shrink-0">
                      <Label htmlFor="goal-emoji" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        Emoji
                      </Label>
                      <Input
                        id="goal-emoji"
                        value={formData.emoji}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emoji: e.target.value }))}
                        className="h-12 text-xl text-center rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all font-medium"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Label htmlFor="goal-name" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        Nama Target
                      </Label>
                      <Input
                        id="goal-name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Mis. Dana Darurat, DP Rumah…"
                        className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs placeholder:text-stone-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* 4. Tabungan Saat Ini & Tenggat Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="goal-current-amount" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        Terkumpul Saat Ini
                      </Label>
                      <div className="relative flex items-center rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 p-1 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                        <span className="pl-3 text-xs font-bold text-stone-400 dark:text-slate-500">Rp</span>
                        <Input
                          id="goal-current-amount"
                          inputMode="numeric"
                          placeholder="0"
                          value={formData.current_amount ? Number(formData.current_amount).toLocaleString("id-ID") : ""}
                          onChange={(e) => handleAmountChange("current_amount", e.target.value)}
                          className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-sm h-10 text-[#18181B] dark:text-slate-100 tabular-nums bg-transparent pr-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="goal-target-date" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        Tenggat Waktu
                      </Label>
                      <Input
                        id="goal-target-date"
                        type="date"
                        value={formData.target_date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, target_date: e.target.value }))}
                        className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-semibold px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs w-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Fixed Pinned Footer Action */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800 flex gap-2.5">
                {goal && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading || deleting}
                    className="h-12 px-5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shrink-0"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 stroke-[2.2]" />}
                    <span>Hapus</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || deleting}
                  className="flex-1 rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> <span>Menyimpan…</span></>
                  ) : (
                    <>{goal ? <Target className="h-4 w-4 stroke-[2.5]" /> : <Plus className="h-4 w-4 stroke-[2.5]" />} <span>{goal ? "Simpan Perubahan" : "Simpan Target"}</span></>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
