"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  Landmark,
  Wallet2,
  Banknote,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  PencilLine,
  X,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BANK_PRESETS } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { addBankAccount, updateBankAccountBalance } from "@/app/actions";
import type { BankAccountType, BankPreset } from "@/lib/types";
import type { BankAccountRow } from "@/lib/supabase/types";
import { usePrivacy } from "@/hooks/use-privacy";

/* ── Add-account schema ────────────────────────────────── */
const addSchema = z.object({
  presetId: z.string().min(1, "Pilih jenis rekening"),
  nickname: z.string().min(2, "Nama min. 2 karakter").max(30),
  accountNumber: z.string().max(20).optional(),
  initialBalance: z.number().min(0, "Saldo tidak boleh negatif"),
});
type AddFormValues = z.infer<typeof addSchema>;

/* ── Type icon helper ──────────────────────────────────── */
function TypeIcon({ type, size = 14 }: { type: BankAccountType; size?: number }) {
  const cls = `shrink-0`;
  if (type === "bank") return <Landmark className={cls} style={{ width: size, height: size }} />;
  if (type === "ewallet") return <Wallet2 className={cls} style={{ width: size, height: size }} />;
  return <Banknote className={cls} style={{ width: size, height: size }} />;
}

/* ── Single account card ───────────────────────────────── */
function AccountCard({ account, hidden }: { account: BankAccountRow; hidden: boolean }) {
  const isImgLogo = account.logo?.startsWith("/");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative shrink-0 w-60 sm:w-64 h-[140px] sm:h-[150px] rounded-2xl overflow-hidden cursor-pointer group snap-start border-0 transition-all duration-300 text-white"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${account.gradient[0]} 90%, #1e1e2f), color-mix(in srgb, ${account.gradient[1]} 60%, #0b0b12))`,
      }}
    >
      {/* Decorative background elements for credit card look */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/20 rounded-full blur-xl -ml-4 -mb-4 pointer-events-none" />

      {/* Circle watermark (subtle) */}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full border-[1.5px] border-white/10 pointer-events-none opacity-50" />
      <div className="absolute -right-2 -bottom-2 h-16 w-16 rounded-full border border-white/5 pointer-events-none opacity-50" />

      <div className="relative h-full p-4 flex flex-col justify-between z-10">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          {/* Fake credit card chip */}
          <div className="w-8 h-6 bg-yellow-500/30 rounded border border-yellow-300/40 flex items-center justify-center overflow-hidden relative shadow-sm">
             <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-transparent"></div>
             <div className="w-full h-px bg-yellow-300/30 absolute top-1/2"></div>
             <div className="h-full w-px bg-yellow-300/30 absolute left-[30%]"></div>
             <div className="h-full w-px bg-yellow-300/30 absolute right-[30%]"></div>
          </div>

          {/* Logo Bank */}
          {isImgLogo ? (
            <div className="bg-white/95 p-1 rounded-md flex items-center justify-center w-9 h-6 shadow-sm shrink-0">
              <img src={account.logo} alt={account.bank_name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <span className="text-xl leading-none shrink-0 drop-shadow-sm">{account.logo}</span>
          )}
        </div>

        {/* Middle row: Balance (Card Number style) */}
        <div className="mt-2 mb-1">
          <p className="text-xl sm:text-2xl font-black text-white tracking-wider tabular-nums font-mono drop-shadow-md">
            {hidden ? "•••• •••• ••••" : formatCurrency(account.balance, true)}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between gap-2 w-full mt-auto">
          <div className="min-w-0 flex flex-col">
            <span className="text-[8px] sm:text-[9px] text-white/60 uppercase tracking-widest mb-0.5">Card Holder</span>
            <p className="text-[10px] sm:text-xs font-semibold text-white/95 truncate uppercase tracking-wide">
              {account.name}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[8px] sm:text-[9px] text-white/60 uppercase tracking-widest mb-0.5 text-right">{account.bank_name}</span>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-white/90 font-medium bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-md">
              <TypeIcon type={account.type as BankAccountType} size={10} />
              {account.account_number ? (
                <span className="tracking-widest">··{account.account_number.slice(-4)}</span>
              ) : (
                <span className="capitalize">{account.type}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EditBalanceDialog({
  account,
  open,
  onOpenChange,
}: {
  account: BankAccountRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rawBalance, setRawBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!account || !open) {
      setRawBalance("");
      setErrorMsg("");
      setIsLoading(false);
      return;
    }

    setRawBalance(String(Math.max(0, Math.trunc(Number(account.balance) || 0))));
    setErrorMsg("");
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!account) return;

    const balance = Number(rawBalance || "0");
    if (!Number.isFinite(balance) || balance < 0) {
      setErrorMsg("Nominal saldo tidak valid.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await updateBankAccountBalance({
        id: account.id,
        balance,
      });

      if (!result.success) {
        setErrorMsg(result.error || "Gagal memperbarui saldo.");
        setIsLoading(false);
        return;
      }

      onOpenChange(false);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showHandle className="max-w-md p-0 overflow-hidden rounded-t-[28px] md:rounded-[32px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl w-full mx-auto">
        <DialogHeader className="p-6 pb-4 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAD170] dark:bg-amber-500/20 text-stone-900 dark:text-amber-300 shadow-xs">
              <PencilLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#18181B] dark:text-slate-100">Ubah Nominal Saldo</DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Revisi saldo aktual untuk rekening atau dompet yang dipilih.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-3">
          {account && (
            <div className="rounded-2xl border border-stone-200/60 dark:border-slate-700/60 bg-surface-muted/50 dark:bg-slate-800/60 p-3.5">
              <p className="text-xs font-bold text-[#18181B] dark:text-slate-100">{account.name}</p>
              <p className="mt-0.5 text-[11px] text-stone-500 dark:text-slate-400 font-medium">{account.bank_name}</p>
              <p className="mt-2 text-xs text-stone-600 dark:text-slate-300 font-medium">
                Saldo saat ini: <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">{formatCurrency(account.balance)}</span>
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-balance" className="text-xs font-semibold text-stone-500 dark:text-slate-400">
              Nominal Saldo Terbaru
            </Label>
            <div className="relative flex items-center rounded-2xl bg-surface-muted/60 dark:bg-slate-800/80 border border-stone-200/50 dark:border-slate-700 p-1 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
              <span className="pl-3 text-sm font-bold text-stone-400 dark:text-slate-500">Rp</span>
              <Input
                id="edit-balance"
                inputMode="numeric"
                placeholder="0"
                value={rawBalance ? Number(rawBalance).toLocaleString("id-ID") : ""}
                onChange={(e) => setRawBalance(e.target.value.replace(/\D/g, ""))}
                className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-lg h-9 text-[#18181B] dark:text-slate-100 tabular-nums bg-transparent pr-2 placeholder:text-stone-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 font-semibold cursor-pointer text-sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white font-bold cursor-pointer shadow-sm text-sm transition-all active:scale-[0.99]"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
              ) : (
                <><PencilLine className="h-4 w-4 mr-1.5" /> Simpan Saldo</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add-account dialog ────────────────────────────────── */
export function AddAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [rawBalance, setRawBalance] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"bank" | "ewallet" | "cash">("bank");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { initialBalance: 0, presetId: "" },
  });

  const selectedPresetId = watch("presetId");
  const selectedPreset = BANK_PRESETS.find((p) => p.id === selectedPresetId);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawBalance(raw);
    setValue("initialBalance", Number(raw), { shouldValidate: !!raw });
  };

  const handleAddQuickAmount = (val: number) => {
    const current = Number(rawBalance) || 0;
    const updated = current + val;
    setRawBalance(String(updated));
    setValue("initialBalance", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: AddFormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    const preset = BANK_PRESETS.find((p) => p.id === data.presetId);
    if (!preset) {
      setErrorMsg("Pilih jenis rekening terlebih dahulu");
      setIsLoading(false);
      return;
    }

    try {
      const result = await addBankAccount({
        name: data.nickname,
        bank_name: preset.fullName,
        type: preset.type as "bank" | "ewallet" | "cash",
        account_number: data.accountNumber || undefined,
        balance: data.initialBalance,
        color: preset.color,
        logo: preset.logo,
        gradient: preset.gradient,
      });

      if (!result.success) {
        setErrorMsg(result.error || "Gagal menyimpan rekening");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        reset({ initialBalance: 0, presetId: "" });
        setRawBalance("");
        onOpenChange(false);
      }, 1800);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsLoading(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      reset({ initialBalance: 0, presetId: "" });
      setRawBalance("");
      setIsSuccess(false);
      setErrorMsg("");
    }
    onOpenChange(v);
  };

  const filteredPresets = BANK_PRESETS.filter((p) => p.type === activeCategoryTab);

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
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xs shrink-0 transition-colors bg-[#E0E6FD]/80 dark:bg-indigo-500/20 text-[#3B4CCA] dark:text-indigo-300">
                <Landmark className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                  {isSuccess ? "Rekening Ditambahkan" : "Tambah Rekening Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  {isSuccess
                    ? "Rekening baru berhasil disimpan ke sistem"
                    : "Hubungkan bank, e-wallet, atau pos kas tunai"}
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
                <p className="text-lg font-bold text-[#18181B] dark:text-slate-100">Rekening Berhasil Disimpan!</p>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Rekening <span className="font-bold text-[#18181B] dark:text-slate-100">{selectedPreset?.fullName || "baru"}</span> dengan saldo awal{" "}
                  <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">
                    {formatCurrency(Number(rawBalance) || 0)}
                  </span>{" "}
                  telah siap digunakan.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMsg("")}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Saldo Awal Box (Hero Bento Number Card) */}
                <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                      Saldo Awal Rekening
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
                      id="acc-bal-input"
                      inputMode="numeric"
                      placeholder="0"
                      value={rawBalance ? Number(rawBalance).toLocaleString("id-ID") : ""}
                      onChange={handleBalanceChange}
                      className={cn(
                        "w-full text-right font-black text-[#18181B] dark:text-slate-100 tracking-tight bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 tabular-nums placeholder:text-stone-300 dark:placeholder:text-slate-600 cursor-text leading-tight",
                        rawBalance.length > 10
                          ? "!text-2xl sm:!text-3xl"
                          : rawBalance.length > 7
                            ? "!text-3xl sm:!text-4xl"
                            : "!text-4xl sm:!text-5xl"
                      )}
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 max-w-full">
                    {[
                      { label: "+100 rb", val: 100000 },
                      { label: "+500 rb", val: 500000 },
                      { label: "+1 jt", val: 1000000 },
                      { label: "+5 jt", val: 5000000 },
                      { label: "+10 jt", val: 10000000 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleAddQuickAmount(chip.val)}
                        className="bg-white dark:bg-slate-800 hover:bg-[#FAD170]/40 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-full border border-black/[0.03] dark:border-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 select-none"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {errors.initialBalance && (
                    <p className="text-[11px] text-[#E85024] font-medium mt-1">{errors.initialBalance.message}</p>
                  )}
                </div>

                {/* 2. Type/Category Switcher Tabs for Presets */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider block">
                      Pilih Jenis Bank / E-Wallet
                    </Label>
                  </div>

                  <div className="rounded-full bg-stone-100/80 dark:bg-slate-800/80 p-1 grid grid-cols-3 gap-1 mb-2 w-full border border-black/[0.03] dark:border-slate-700/50">
                    {[
                      { id: "bank" as const, label: "Bank", icon: Landmark },
                      { id: "ewallet" as const, label: "E-Wallet", icon: Wallet2 },
                      { id: "cash" as const, label: "Lainnya", icon: Banknote },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeCategoryTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveCategoryTab(tab.id)}
                          className={cn(
                            "py-2 px-1.5 sm:px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold min-w-0",
                            isActive
                              ? "bg-[#1A1A1A] dark:bg-slate-700 text-white shadow-xs"
                              : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 font-semibold"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preset Grid Cards */}
                  <Controller
                    name="presetId"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[170px] overflow-y-auto p-0.5 custom-scrollbar">
                        {filteredPresets.map((preset) => {
                          const isSelected = field.value === preset.id;
                          const isImgLogo = preset.logo?.startsWith("/");
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                field.onChange(preset.id);
                                const currentNick = watch("nickname");
                                if (!currentNick) {
                                  setValue("nickname", preset.name);
                                }
                              }}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 sm:p-3 text-center select-none cursor-pointer min-h-[74px] border transition-all duration-200 min-w-0",
                                isSelected
                                  ? "bg-gradient-to-b from-orange-50/60 dark:from-orange-950/30 to-white dark:to-slate-800 ring-2 ring-[#E85024] shadow-md shadow-orange-500/10 -translate-y-0.5 border-[#E85024]/40"
                                  : "bg-white dark:bg-slate-800/70 hover:bg-stone-50/80 dark:hover:bg-slate-800 border-black/[0.04] dark:border-slate-700/60 shadow-xs hover:-translate-y-0.5"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center p-1 shrink-0 overflow-hidden border border-black/[0.02] dark:border-slate-800",
                                  isSelected ? "ring-1 ring-[#E85024]/30" : ""
                                )}
                              >
                                {isImgLogo ? (
                                  <img src={preset.logo} alt={preset.name} className="max-h-full max-w-full object-contain" />
                                ) : (
                                  <span className="text-base leading-none">{preset.logo}</span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-[#18181B] dark:text-slate-100 truncate w-full px-0.5">
                                {preset.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.presetId && (
                    <p className="text-[11px] text-[#E85024] font-medium mt-1">{errors.presetId.message}</p>
                  )}
                </div>

                {/* 3. Nickname & Account Number Fields */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-nick" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                      Nama Panggilan Rekening
                    </Label>
                    <Input
                      id="acc-nick"
                      placeholder="Mis. BCA Utama, GoPay Jajan, Tabungan..."
                      className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs placeholder:text-stone-400 dark:placeholder:text-slate-500"
                      {...register("nickname")}
                    />
                    {errors.nickname && (
                      <p className="text-[11px] text-[#E85024] font-medium">{errors.nickname.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="acc-num" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                        No. Rekening / Nomor Kartu
                      </Label>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">Opsional</span>
                    </div>
                    <Input
                      id="acc-num"
                      placeholder="Mis. 4 digit terakhir atau no. lengkap"
                      maxLength={25}
                      className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs placeholder:text-stone-400 dark:placeholder:text-slate-500"
                      {...register("accountNumber")}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Fixed Pinned Footer Submit Button */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> <span>Menyimpan Rekening…</span></>
                  ) : (
                    <><Plus className="h-4 w-4 stroke-[2.5]" /> <span>Tambah Rekening</span></>
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

/* ── Main widget ───────────────────────────────────────── */
export function BankAccountsWidget({ accounts }: { accounts: BankAccountRow[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const { hidden, toggleHidden } = usePrivacy();
  const [showAll, setShowAll] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountRow | null>(null);

  const displayedAccounts = showAll ? accounts : accounts.slice(0, 3);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const bankCount = accounts.filter((a) => a.type === "bank").length;
  const ewalletCount = accounts.filter((a) => a.type === "ewallet").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Landmark className="h-4 w-4 text-blue-500" />
                Rekening & Dompet
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-[var(--muted-foreground)] mt-0.5">
                {bankCount} bank &bull; {ewalletCount} e-wallet &bull; {accounts.filter(a => a.type === "cash").length} tunai
              </p>
            </div>
            <button
              onClick={toggleHidden}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted-foreground)] bg-[var(--muted)]/50 hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          {/* Total balance card */}
          <div className="mt-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-sm relative overflow-hidden text-white">
            <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/5" />
            <p className="text-[11px] font-medium text-emerald-100/90 tracking-wide uppercase">Total Semua Rekening</p>
            <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight tabular-nums leading-tight">
              {hidden ? "Rp ••••••••" : formatCurrency(totalBalance)}
            </p>
            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-emerald-100/70 font-medium">
              <span>{bankCount} Bank</span>
              <span className="opacity-40">&bull;</span>
              <span>{ewalletCount} E-Wallet</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          {/* Horizontal scroll carousel */}
          <div className="flex gap-3 overflow-x-auto overflow-y-visible py-4 -my-4 px-1 -mx-1 scrollbar-none snap-x snap-mandatory min-h-[160px]">
            {displayedAccounts.map((account, i) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="snap-start shrink-0"
              >
                <AccountCard account={account} hidden={hidden} />
              </motion.div>
            ))}

            {accounts.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="snap-start shrink-0 w-28 h-[135px] sm:h-[150px] rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted)]/10 flex flex-col items-center justify-center gap-1 text-[var(--muted-foreground)] hover:border-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer"
              >
                <span className="text-xs font-semibold px-2">{showAll ? "Tutup" : "Lihat Semua"}</span>
              </button>
            )}

            <button
              onClick={() => setAddOpen(true)}
              className="snap-start shrink-0 w-28 h-[135px] sm:h-[150px] rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted)]/10 flex flex-col items-center justify-center gap-2 text-[var(--muted-foreground)] hover:border-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--muted)] shadow-sm">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold text-center px-2 leading-tight">Tambah Baru</span>
            </button>
          </div>

          {/* Account list view */}
          <div className="mt-4 space-y-1 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
            {accounts.map((account) => {
              const pct = totalBalance > 0 ? Math.round((account.balance / totalBalance) * 100) : 0;
              const isImgLogo = account.logo?.startsWith("/");

              return (
                <div
                  key={account.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--muted)]/60 border border-transparent hover:border-[var(--card-border)]/30 transition-all cursor-default group"
                >
                  {/* UBAHAN 3: Render Gambar Logo Bank di Tampilan Baris List/Daftar Bawah */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base border border-[var(--card-border)]/30 overflow-hidden",
                      isImgLogo ? "bg-slate-50 dark:bg-neutral-900 p-1" : ""
                    )}
                    style={
                      !isImgLogo
                        ? { background: `linear-gradient(135deg, ${account.gradient[0]}15, ${account.gradient[1]}08)` }
                        : undefined
                    }
                  >
                    {isImgLogo ? (
                      <img src={account.logo} alt={account.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      account.logo
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate">{account.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 font-medium border-none shadow-none bg-[var(--muted)] text-[var(--muted-foreground)]">
                        <TypeIcon type={account.type as BankAccountType} size={8} />
                        <span className="capitalize">{account.type}</span>
                      </Badge>
                      {account.account_number && (
                        <span className="truncate max-w-[70px] sm:max-w-none">
                          &bull; {account.account_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 text-right">
                    <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] tabular-nums">
                      {hidden ? "••••" : formatCurrency(account.balance, true)}
                    </p>
                    <p className="text-[9px] font-medium text-[var(--muted-foreground)] mt-0.5">{pct}% porsi</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingAccount(account)}
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    aria-label={`Ubah saldo ${account.name}`}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </button>

                  <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 md:group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditBalanceDialog
        account={editingAccount}
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null);
        }}
      />
    </motion.div>
  );
}
