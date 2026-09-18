"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PencilLine,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTransaction } from "@/app/actions";
import { BANK_ACCOUNTS as MOCK_BANK_ACCOUNTS } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import type { BankAccountRow, TransactionRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

const schema = z.object({
  amount: z.number().positive("Nominal harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Pilih kategori"),
  name: z.string().min(2, "Nama transaksi min. 2 karakter").max(60),
  date: z.string().min(1, "Pilih tanggal"),
  notes: z.string().max(200).optional(),
  bank_account_id: z.string().min(1, "Pilih rekening"),
});

type FormValues = z.infer<typeof schema>;

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionRow | null;
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
  onDelete?: (id: string) => Promise<void>;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  bankAccounts,
  availableCategories,
  onDelete,
}: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [categoryState, setCategoryState] = useState<AvailableTransactionCategories>(availableCategories);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      bank_account_id: bankAccounts[0]?.id ?? "",
    },
  });

  const type = watch("type");
  const selectedCategory = watch("category");
  const selectedBankId = watch("bank_account_id");

  const displayBankAccounts =
    bankAccounts.length > 0
      ? bankAccounts.map((account) => ({
          id: account.id,
          name: account.name,
          balance: account.balance,
          logo: account.logo,
          gradient: account.gradient,
        }))
      : MOCK_BANK_ACCOUNTS;

  useEffect(() => {
    setCategoryState(availableCategories);
  }, [availableCategories]);

  useEffect(() => {
    if (!open || !transaction) return;

    reset({
      amount: transaction.amount,
      type: transaction.type === "income" ? "income" : "expense",
      category: transaction.category,
      name: transaction.name,
      date: transaction.date,
      notes: transaction.notes ?? "",
      bank_account_id: transaction.bank_account_id,
    });
    setRawAmount(String(transaction.amount));
    setErrorMsg("");
    setIsSuccess(false);
  }, [open, reset, transaction]);

  useEffect(() => {
    if (!selectedCategory) return;

    const defaults =
      type === "income" ? categoryState.income : categoryState.expense;
    if (!defaults.some((category) => category.slug === selectedCategory)) {
      setValue("category", "", { shouldValidate: false });
    }
  }, [categoryState.expense, categoryState.income, selectedCategory, setValue, type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawAmount(raw);
    setValue("amount", Number(raw), { shouldValidate: true });
  };

  const handleAddQuickAmount = (val: number) => {
    const current = Number(rawAmount) || 0;
    const updated = current + val;
    setRawAmount(String(updated));
    setValue("amount", updated, { shouldValidate: true });
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMsg("");
      setIsSuccess(false);
      setIsLoading(false);
      setIsDeleting(false);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (data: FormValues) => {
    if (!transaction) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await updateTransaction(transaction.id, data);

      if (!result.success) {
        setErrorMsg(result.error || "Gagal memperbarui transaksi");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        handleDialogChange(false);
      }, 1400);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsLoading(false);
    }
  };

  const defaultCategories =
    type === "income" ? categoryState.income : categoryState.expense;

  const selectedBank = displayBankAccounts.find((b) => b.id === selectedBankId);

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        hideClose
        className="p-0 overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[86vh] h-auto rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full"
      >
        {/* Dynamic Fixed Header */}
        <div className="p-5 sm:p-6 pb-3 shrink-0">
          {/* Grab Handle Bar (Mobile) */}
          <div className="w-12 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FDD5C1]/70 dark:bg-[#E85024]/20 text-[#E85024] dark:text-[#FDD5C1] flex items-center justify-center text-xl shadow-2xs shrink-0">
                <PencilLine className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                  Edit Transaksi
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Perbarui detail atau nominal transaksi
                </DialogDescription>
              </div>
            </div>

            {/* Action Buttons: Delete & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onDelete && transaction && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isDeleting) return;
                    setIsDeleting(true);
                    try {
                      await onDelete(transaction.id);
                      handleDialogChange(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || isLoading}
                  className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                  aria-label="Hapus Transaksi"
                  title="Hapus Transaksi"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 stroke-[2.2]" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDialogChange(false)}
                className="w-9 h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 transition-all cursor-pointer shrink-0"
                aria-label="Tutup"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Content & Pinned Actions */}
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
                  Transaksi Berhasil Diperbarui!
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Catatan {type === "income" ? "pemasukan" : "pengeluaran"}{" "}
                  <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">
                    {formatCurrency(Number(rawAmount || 0))}
                  </span>{" "}
                  telah diperbarui pada dompet{" "}
                  <span className="font-bold text-[#18181B] dark:text-slate-100">
                    {selectedBank?.name}
                  </span>
                  .
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
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {errorMsg}
                      </p>
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

                {/* 1. Tipe Transaksi Switcher */}
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="rounded-full bg-stone-100/80 dark:bg-slate-800/80 p-1 grid grid-cols-2 gap-1 mb-1 w-full border border-black/[0.03] dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => field.onChange("expense")}
                        className={cn(
                          "py-2 px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold min-w-0",
                          field.value === "expense"
                            ? "bg-[#1A1A1A] dark:bg-slate-700 text-white shadow-xs"
                            : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 font-semibold"
                        )}
                      >
                        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Pengeluaran</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("income")}
                        className={cn(
                          "py-2 px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold min-w-0",
                          field.value === "income"
                            ? "bg-[#1A1A1A] dark:bg-slate-700 text-white shadow-xs"
                            : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 font-semibold"
                        )}
                      >
                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Pemasukan</span>
                      </button>
                    </div>
                  )}
                />

                {/* 2. Hero Nominal Card & Quick Chips */}
                <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                      Nominal Transaksi
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
                      id="edit-amount"
                      inputMode="numeric"
                      placeholder="0"
                      value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                      onChange={handleAmountChange}
                      className={cn(
                        "w-full text-right font-black text-[#18181B] dark:text-slate-100 tracking-tight bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 tabular-nums placeholder:text-stone-300 dark:placeholder:text-slate-600 cursor-text leading-tight",
                        rawAmount.length > 10
                          ? "!text-2xl sm:!text-3xl"
                          : rawAmount.length > 7
                            ? "!text-3xl sm:!text-4xl"
                            : "!text-4xl sm:!text-5xl"
                      )}
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 max-w-full">
                    {[
                      { label: "+10 rb", val: 10000 },
                      { label: "+50 rb", val: 50000 },
                      { label: "+100 rb", val: 100000 },
                      { label: "+500 rb", val: 500000 },
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

                  {errors.amount && (
                    <p className="text-[11px] text-[#E85024] font-medium mt-1">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                {/* 3. Grid Rekening / Dompet (Tactile Bank Cards) */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Pilih Rekening / Dompet
                  </Label>
                  <Controller
                    name="bank_account_id"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                        {displayBankAccounts.map((account) => {
                          const isSelected = field.value === account.id;
                          const isImgLogo = account.logo?.startsWith("/");
                          return (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => field.onChange(account.id)}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 sm:p-3 text-center select-none cursor-pointer min-h-[78px] sm:min-h-[82px] border transition-all duration-200 min-w-0",
                                isSelected
                                  ? "bg-gradient-to-b from-orange-50/60 dark:from-orange-950/30 to-white dark:to-slate-800 ring-2 ring-[#E85024] shadow-md shadow-orange-500/10 -translate-y-0.5 border-[#E85024]/40"
                                  : "bg-white dark:bg-slate-800/70 hover:bg-stone-50/80 dark:hover:bg-slate-800 border-black/[0.04] dark:border-slate-700/60 shadow-xs hover:-translate-y-0.5"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center p-1 shrink-0 overflow-hidden border border-black/[0.02] dark:border-slate-800",
                                  isSelected ? "ring-1 ring-[#E85024]/30" : ""
                                )}
                              >
                                {isImgLogo ? (
                                  <img
                                    src={account.logo}
                                    alt={account.name}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-base leading-none">{account.logo}</span>
                                )}
                              </div>

                              <span className="text-xs font-bold text-[#18181B] dark:text-slate-100 truncate w-full px-0.5">
                                {account.name}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium tabular-nums truncate w-full">
                                {formatCurrency(account.balance, true)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.bank_account_id && (
                    <p className="text-[11px] text-[#E85024] font-medium">
                      {errors.bank_account_id.message}
                    </p>
                  )}
                </div>

                {/* 4. Nama Transaksi Input */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Nama Transaksi
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Mis. Belanja Mingguan, Makan Siang, Gaji…"
                    className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs placeholder:text-stone-400 dark:placeholder:text-slate-500"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* 5. Category Grid Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Pilih Kategori
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
                        <div className="grid grid-cols-3 gap-2">
                          {defaultCategories.map((cat) => {
                            const isSelected = field.value === cat.slug;
                            return (
                              <button
                                key={`${cat.type}-${cat.slug}`}
                                type="button"
                                onClick={() => field.onChange(cat.slug)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-1 rounded-2xl border py-2.5 px-1.5 text-center transition-all duration-150 select-none cursor-pointer min-h-[58px]",
                                  isSelected
                                    ? "border-[#1A1A1A] bg-[#1A1A1A] dark:border-slate-600 dark:bg-slate-700 text-white font-bold shadow-xs"
                                    : "border-stone-200/60 dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/40 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                                )}
                              >
                                <AnimatedEmoji emoji={cat.emoji} size={16} />
                                <span
                                  className={cn(
                                    "text-[10px] leading-tight truncate w-full px-0.5",
                                    isSelected
                                      ? "text-white"
                                      : "text-[#18181B] dark:text-slate-200"
                                  )}
                                >
                                  {cat.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  />
                  {errors.category && (
                    <p className="text-[11px] text-[#E85024] font-medium">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* 6. Tanggal Transaksi */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-date"
                    className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Tanggal Transaksi
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-semibold px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs w-full cursor-pointer"
                    {...register("date")}
                  />
                  {errors.date && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.date.message}</p>
                  )}
                </div>

                {/* 7. Catatan Transaksi */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="edit-notes"
                      className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider"
                    >
                      Catatan
                    </Label>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">
                      Opsional
                    </span>
                  </div>
                  <Textarea
                    id="edit-notes"
                    placeholder="Tulis catatan atau deskripsi transaksi di sini…"
                    rows={3}
                    className="min-h-[84px] text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium p-3.5 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs resize-none placeholder:text-stone-400 dark:placeholder:text-slate-500"
                    {...register("notes")}
                  />
                  {errors.notes && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.notes.message}</p>
                  )}
                </div>
              </div>

              {/* Fixed Pinned Footer */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sedang Menyimpan…</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 stroke-[2.5]" />
                      <span>Simpan Perubahan</span>
                    </>
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
