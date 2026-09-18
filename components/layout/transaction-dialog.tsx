"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
  Camera,
  ScanLine,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addTransaction, createCategory, createTransferTransaction } from "@/app/actions";
import { scanReceiptAction } from "@/app/actions/receipt";
import { compressAndConvertToBase64 } from "@/lib/image-utils";
import { BANK_ACCOUNTS as MOCK_BANK_ACCOUNTS } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import type { BankAccountRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories, CategoryOption } from "@/lib/supabase/queries";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import fluentEmojisKeys from "@/lib/fluent-emojis-keys.json";

const EMOJI_OPTIONS = fluentEmojisKeys as string[];
const COLOR_OPTIONS = ["#E85024", "#FAD170", "#D8F5A2", "#FDD5C1", "#E0E6FD", "#DAEFEA", "#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

function slugifyCategoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/* ── Zod schema ─────────────────────────────────────────── */
const schema = z
  .object({
    amount: z.number().positive("Nominal harus lebih dari 0"),
    type: z.enum(["income", "expense", "transfer"]),
    bankAccountId: z.string().min(1, "Pilih rekening asal"),
    transferAccountId: z.string().optional(),
    category: z.string(),
    name: z.string().min(2, "Min. 2 karakter").max(60),
    date: z.string().min(1, "Pilih tanggal"),
    notes: z.string().max(200).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "transfer" && !values.category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "Pilih kategori",
      });
    }

    if (values.type === "transfer") {
      if (!values.transferAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transferAccountId"],
          message: "Pilih rekening tujuan",
        });
      }

      if (values.transferAccountId && values.transferAccountId === values.bankAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transferAccountId"],
          message: "Rekening tujuan harus berbeda",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: "income" | "expense" | "transfer";
  bankAccounts?: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
}

function StepIndicator({ total, current, onBack, showBack }: { total: number; current: number; onBack: () => void; showBack: boolean }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <div className="w-8">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "w-6 h-1.5 bg-[#E85024]"
                : i < current
                  ? "w-1.5 h-1.5 bg-[#E85024]/40"
                  : "w-1.5 h-1.5 bg-stone-200 dark:bg-slate-700"
            )}
          />
        ))}
      </div>
      <div className="w-8" />
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────────────────────── */
export function TransactionDialog({
  open,
  onOpenChange,
  defaultType = "expense",
  bankAccounts = [],
  availableCategories,
}: TransactionDialogProps) {
  const [step, setStep] = useState(0); // 0: Info Awal, 1: Detail Lengkap, 2: Sukses, 3: Form Kategori Kustom
  const [isLoading, setLoading] = useState(false);
  const [rawAmount, setRawAmount] = useState("");
  const [categoryState, setCategoryState] = useState<AvailableTransactionCategories>(availableCategories);

  // State OCR & Scanner Struk AI
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<string | null>(null);

  // State manajemen pembuatan kategori kustom
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#E85024");

  // Muat kategori kustom saat dialog dibuka
  useEffect(() => {
    if (open) {
      setCategoryState(availableCategories);
    }
  }, [availableCategories, open]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      date: new Date().toISOString().split("T")[0],
      transferAccountId: "",
    },
  });

  const type = watch("type");
  const selectedCategory = watch("category");
  const bankId = watch("bankAccountId");
  const transferBankId = watch("transferAccountId");

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

  // Handler untuk pemindaian struk dengan AI Gemini Multimodal
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningReceipt(true);
      setScanError(null);
      setReceiptSuccessMsg(null);

      // Kompresi di sisi browser agar upload super cepat & hemat token
      const { base64Data, mimeType, previewUrl } = await compressAndConvertToBase64(file);
      setReceiptPreview(previewUrl);

      const response = await scanReceiptAction(base64Data, mimeType);

      if (!response.success) {
        setScanError(response.error || "Gagal membaca struk belanja.");
        setIsScanningReceipt(false);
        return;
      }

      const receipt = response.data;

      // Isi form secara otomatis
      setValue("type", "expense");
      setValue("amount", receipt.total_amount, { shouldValidate: true });
      setRawAmount(String(receipt.total_amount));
      setValue("name", receipt.merchant_name, { shouldValidate: true });
      setValue("date", receipt.date, { shouldValidate: true });

      // Kategorikan secara otomatis
      const defaults = categoryState.expense;
      const matchedCategory = defaults.find((c) => c.slug === receipt.category);
      if (matchedCategory) {
        setValue("category", matchedCategory.slug, { shouldValidate: true });
      } else if (defaults.length > 0) {
        setValue("category", "shopping", { shouldValidate: true });
      }

      if (receipt.items_summary) {
        setValue("notes", receipt.items_summary);
      }

      // Jika belum ada rekening dipilih, pilih rekening pertama
      if (!bankId && displayBankAccounts.length > 0) {
        setValue("bankAccountId", displayBankAccounts[0].id, { shouldValidate: true });
      }

      setReceiptSuccessMsg(`Struk "${receipt.merchant_name}" terbaca: Rp ${receipt.total_amount.toLocaleString("id-ID")}`);

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 40, 30]);
      }

      // Beri sedikit jeda agar visual scanning tampak mulus, lalu langsung ke Step 1
      setTimeout(() => {
        setStep(1);
      }, 700);
    } catch (err) {
      console.error("Receipt scan error:", err);
      setScanError(err instanceof Error ? err.message : "Gagal memproses struk belanja.");
    } finally {
      setIsScanningReceipt(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Pisahkan kategori bawaan dan kustom berdasarkan tipe transaksi aktif
  const getAllCategories = () => {
    const defaults = type === "income" ? categoryState.income : categoryState.expense;
    return { defaults };
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || type === "transfer") return;

    const slug = slugifyCategoryName(newCatName);
    if (!slug) return;

    const result = await createCategory({
      name: newCatName.trim(),
      slug,
      type,
      emoji: newCatEmoji,
      color: newCatColor,
    });

    if (!result.success || !result.data) {
      alert(result.error || "Gagal menyimpan kategori.");
      return;
    }

    const newCategory: CategoryOption = {
      id: result.data.id,
      slug: result.data.slug,
      name: result.data.name,
      type: result.data.type,
      emoji: result.data.emoji,
      color: result.data.color,
      is_system: result.data.is_system,
    };

    setCategoryState((current) => {
      const nextBySlug = { ...current.bySlug, [newCategory.slug]: newCategory };
      return newCategory.type === "income"
        ? {
          bySlug: nextBySlug,
          income: [...current.income.filter((item) => item.slug !== newCategory.slug), newCategory],
          expense: current.expense,
        }
        : {
          bySlug: nextBySlug,
          income: current.income,
          expense: [...current.expense.filter((item) => item.slug !== newCategory.slug), newCategory],
        };
    });

    setValue("category", newCategory.slug, { shouldValidate: true });
    setNewCatName("");
    setNewCatEmoji("🏷️");
    setNewCatColor("#E85024");
    setStep(1);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawAmount(raw);
    setValue("amount", Number(raw), { shouldValidate: !!raw });
  };

  useEffect(() => {
    if (type === "transfer") {
      setValue("category", "transfer", { shouldValidate: false });
      return;
    }

    if (!selectedCategory) return;

    const defaults = type === "income" ? categoryState.income : categoryState.expense;
    if (!defaults.some((category) => category.slug === selectedCategory)) {
      setValue("category", "", { shouldValidate: false });
    }
  }, [categoryState.expense, categoryState.income, selectedCategory, setValue, type]);

  const handleNextStep = async () => {
    const fields =
      type === "transfer"
        ? ["amount", "bankAccountId", "transferAccountId"] as const
        : ["amount", "bankAccountId"] as const;
    const ok = await trigger(fields);
    if (ok) setStep(1);
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const result =
      data.type === "transfer"
        ? await createTransferTransaction({
          name: data.name,
          amount: data.amount,
          date: data.date,
          notes: data.notes,
          from_bank_account_id: data.bankAccountId,
          to_bank_account_id: data.transferAccountId || "",
        })
        : await addTransaction({
          name: data.name,
          amount: data.amount,
          type: data.type,
          category: data.category,
          date: data.date,
          notes: data.notes,
          bank_account_id: data.bankAccountId,
        });

    setLoading(false);

    if (!result.success) {
      alert(result.error || "Gagal menyimpan transaksi.");
      return;
    }

    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate([30, 50, 30]); // Success vibration pattern
    }

    setStep(2);
    setTimeout(() => {
      handleOpenChange(false);
    }, 1800);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      reset({ type: defaultType, date: new Date().toISOString().split("T")[0], transferAccountId: "" });
      setRawAmount("");
      setNewCatName("");
      setScanError(null);
      setIsScanningReceipt(false);
      setReceiptPreview(null);
      setReceiptSuccessMsg(null);
      setStep(0);
    }
    onOpenChange(v);
  };

  const { defaults: categoryDefaults } = getAllCategories();
  const selectedBank = displayBankAccounts.find((b) => b.id === bankId);
  const selectedTransferBank = displayBankAccounts.find((b) => b.id === transferBankId);
  const isSelectedBankImgLogo = selectedBank?.logo?.startsWith("/");
  const isSelectedTransferBankImgLogo = selectedTransferBank?.logo?.startsWith("/");

  const handleAddQuickAmount = (val: number) => {
    const current = Number(rawAmount) || 0;
    const updated = current + val;
    setRawAmount(String(updated));
    setValue("amount", updated, { shouldValidate: true });
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose
        className="p-0 overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[86vh] h-auto rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full"
      >
        {/* Dynamic Header (Fixed Top) */}
        <div className="p-5 sm:p-6 pb-3 shrink-0">
          {/* Grab Handle Bar (Atas - khusus mobile) */}
          <div className="w-12 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xs shrink-0 transition-colors",
                  step === 3
                    ? "bg-[#E0E6FD] dark:bg-indigo-500/20 text-[#3B4CCA] dark:text-indigo-300"
                    : "bg-[#FDD5C1]/70 dark:bg-[#E85024]/20 text-[#E85024] dark:text-[#FDD5C1]"
                )}
              >
                {step === 3 ? <Sparkles className="h-5 w-5 stroke-[2.2]" /> : <Wallet className="h-5 w-5 stroke-[2.2]" />}
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                  {step === 3
                    ? "Buat Kategori Baru"
                    : step === 1
                      ? "Detail Transaksi"
                      : step === 2
                        ? "Transaksi Berhasil"
                        : "Tambah Transaksi"}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  {step === 3
                    ? "Sesuaikan nama, emoji, dan warna kategori"
                    : step === 0
                      ? "Tentukan nominal rupiah & rekening"
                      : step === 1
                        ? "Lengkapi detail catatan transaksi"
                        : "Status penyimpanan catatan"}
                </DialogDescription>
              </div>
            </div>

            {/* Tombol Tutup (Kanan) */}
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-9 h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 transition-all cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content & Pinned Action Footers */}
        <AnimatePresence mode="wait">
          {/* ── STEP 2: SUCCESS VIEW ─────────────────────────── */}
          {step === 2 && (
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
                <p className="text-lg font-bold text-[#18181B] dark:text-slate-100">Transaksi Berhasil Disimpan!</p>
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Catatan {type === "income" ? "pemasukan" : type === "transfer" ? "transfer" : "pengeluaran"}{" "}
                  <span className="font-bold text-[#18181B] dark:text-slate-100 tabular-nums">
                    {formatCurrency(Number(rawAmount))}
                  </span>{" "}
                  {type === "transfer" ? (
                    <>
                      berhasil dipindahkan dari{" "}
                      <span className="font-bold text-[#18181B] dark:text-slate-100">{selectedBank?.name}</span>
                      {" "}ke{" "}
                      <span className="font-bold text-[#18181B] dark:text-slate-100">{selectedTransferBank?.name}</span>
                    </>
                  ) : (
                    <>
                      telah tercatat pada dompet{" "}
                      <span className="font-bold text-[#18181B] dark:text-slate-100">{selectedBank?.name}</span>
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 0: INITIAL INFO (Tactile Hero Bento Card) ────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                {/* 1. Quick Receipt Scanner Banner / Button */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanningReceipt}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-500/20 dark:via-amber-500/15 dark:to-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 text-stone-800 dark:text-slate-200 transition-all active:scale-[0.99] cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5C28] to-[#E85024] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#18181B] dark:text-slate-100">Scan Struk Belanja</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E85024]/15 text-[#E85024] dark:text-orange-300 font-extrabold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                          Foto struk / nota, AI otomatis isi form
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#E85024] dark:text-orange-400 flex items-center gap-0.5 shrink-0 pl-2">
                      <span>Foto</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>

                {/* State Loading Scanning AI */}
                {isScanningReceipt && (
                  <div className="p-3.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center gap-3">
                    {receiptPreview ? (
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-orange-500/30 shrink-0 bg-stone-900">
                        <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                        <ScanLine className="w-5 h-5 animate-pulse" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-[#E85024] animate-spin shrink-0" />
                        <p className="text-xs font-bold text-stone-800 dark:text-slate-100">
                          AI sedang membaca struk...
                        </p>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                        Mengekstrak nama toko, nominal, tanggal & kategori
                      </p>
                    </div>
                  </div>
                )}

                {/* State Error Scan */}
                {scanError && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {scanError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScanError(null)}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 2. Switcher Tipe Transaksi (Pengeluaran / Pemasukan / Transfer) */}
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="rounded-full bg-stone-100/80 dark:bg-slate-800/80 p-1 grid grid-cols-3 gap-1 mb-1 w-full border border-black/[0.03] dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => field.onChange("expense")}
                        className={cn(
                          "py-2 px-1.5 sm:px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold min-w-0",
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
                          "py-2 px-1.5 sm:px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold min-w-0",
                          field.value === "income"
                            ? "bg-[#1A1A1A] dark:bg-slate-700 text-white shadow-xs"
                            : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 font-semibold"
                        )}
                      >
                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Pemasukan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("transfer")}
                        className={cn(
                          "py-2 px-1.5 sm:px-3 rounded-full text-center transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold min-w-0",
                          field.value === "transfer"
                            ? "bg-[#1A1A1A] dark:bg-slate-700 text-white shadow-xs"
                            : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 font-semibold"
                        )}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Transfer</span>
                      </button>
                    </div>
                  )}
                />

                {/* 3. Nominal Input Box (Hero Number Card & Quick Chips) */}
                <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                      Nominal Transaksi
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 border border-black/[0.02] dark:border-slate-700">
                      IDR (Rp)
                    </span>
                  </div>

                  {/* Input Angka Besar & Jelas */}
                  <div className="flex items-baseline justify-end gap-2 py-1 min-h-[56px]">
                    <span className="text-2xl sm:text-3xl font-black text-stone-300 dark:text-slate-600 select-none pb-0.5">
                      Rp
                    </span>
                    <input
                      id="d-amount"
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
                    <p className="text-[11px] text-[#E85024] font-medium mt-1">{errors.amount.message}</p>
                  )}
                </div>

                {/* 4. Grid Rekening / Dompet (Tactile Bank Cards) */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    {type === "transfer" ? "Pilih Rekening Asal" : "Pilih Rekening / Dompet"}
                  </Label>
                  <Controller
                    name="bankAccountId"
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
                                  <img src={account.logo} alt={account.name} className="max-h-full max-w-full object-contain" />
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
                  {errors.bankAccountId && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.bankAccountId.message}</p>
                  )}
                </div>

                {/* Transfer Rekening Tujuan (Khusus Transfer) */}
                {type === "transfer" && (
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                      Pilih Rekening Tujuan
                    </Label>
                    <Controller
                      name="transferAccountId"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2.5">
                          {displayBankAccounts
                            .filter((account) => account.id !== bankId)
                            .map((account) => {
                              const isSelected = field.value === account.id;
                              const isImgLogo = account.logo?.startsWith("/");
                              return (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() => field.onChange(account.id)}
                                  className={cn(
                                    "relative flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all duration-200 select-none cursor-pointer min-h-[64px] min-w-0",
                                    isSelected
                                      ? "bg-gradient-to-b from-orange-50/60 dark:from-orange-950/30 to-white dark:to-slate-800 ring-2 ring-[#E85024] shadow-md shadow-orange-500/10 border-[#E85024]/40"
                                      : "bg-white dark:bg-slate-800/70 hover:bg-stone-50/80 dark:hover:bg-slate-800 border-black/[0.04] dark:border-slate-700/60 shadow-xs"
                                  )}
                                >
                                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center p-1 shrink-0 overflow-hidden border border-black/[0.02] dark:border-slate-800">
                                    {isImgLogo ? (
                                      <img src={account.logo} alt={account.name} className="max-h-full max-w-full object-contain" />
                                    ) : (
                                      <span className="text-sm leading-none">{account.logo}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-[#18181B] dark:text-slate-100">
                                      {account.name}
                                    </p>
                                    <p className="mt-0.5 truncate text-[10px] text-stone-500 dark:text-slate-400 tabular-nums">
                                      {formatCurrency(account.balance, true)}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    />
                    {errors.transferAccountId && (
                      <p className="text-[11px] text-[#E85024] font-medium">{errors.transferAccountId.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Tombol Submit (Fixed Pinned Footer) */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Lanjut Isi Detail</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: COMPLEMENTARY DETAILS ──────────────────────────── */}
          {step === 1 && (
            <motion.form
              key="step1"
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                <StepIndicator total={2} current={1} onBack={() => setStep(0)} showBack={true} />

                {/* Banner Sukses Scan AI */}
                {receiptSuccessMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                        {receiptSuccessMsg}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Data telah diisi otomatis oleh AI. Silakan cek detail di bawah.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-2xl border border-stone-200/60 dark:border-slate-800 bg-surface-muted/50 dark:bg-slate-800/50 p-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200/60 dark:border-slate-700 text-sm overflow-hidden bg-white dark:bg-slate-900 shadow-2xs",
                    isSelectedBankImgLogo ? "p-1" : ""
                  )}>
                    {isSelectedBankImgLogo ? (
                      <img src={selectedBank?.logo} alt={selectedBank?.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      selectedBank?.logo
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-stone-500 dark:text-slate-400">
                      {type === "income" ? "Rencana Masuk" : type === "transfer" ? "Rencana Transfer" : "Rencana Keluar"} &bull; {selectedBank?.name}
                      {type === "transfer" && selectedTransferBank ? ` -> ${selectedTransferBank.name}` : ""}
                    </p>
                    <p className="text-base font-black text-[#18181B] dark:text-slate-100 tabular-nums mt-0.5">
                      {formatCurrency(Number(rawAmount))}
                    </p>
                  </div>
                </div>

                {/* Input Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="d-name" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">Nama Transaksi</Label>
                  <Input
                    id="d-name"
                    placeholder="Mis. Belanja Mingguan, Makan Siang, Gaji…"
                    className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs placeholder:text-stone-400 dark:placeholder:text-slate-500"
                    {...register("name")}
                  />
                  {errors.name && <p className="text-[11px] text-[#E85024] font-medium">{errors.name.message}</p>}
                </div>

                {/* Category Grid Selection */}
                {type !== "transfer" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">Pilih Kategori</Label>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex items-center gap-1 text-xs font-bold text-[#E85024] hover:underline cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Custom</span>
                      </button>
                    </div>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2 max-h-[130px] overflow-y-auto pr-0.5 custom-scrollbar">
                          {/* Default Categories */}
                          <div className="grid grid-cols-3 gap-2">
                            {categoryDefaults.map((cat) => {
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
                                      : "border-stone-200/60 dark:border-slate-800 bg-surface-muted/40 dark:bg-slate-800/40 text-stone-700 dark:text-slate-300 hover:bg-surface-muted dark:hover:bg-slate-800"
                                  )}
                                >
                                  <AnimatedEmoji emoji={cat.emoji} size={16} />
                                  <span className={cn("text-[10px] leading-tight truncate w-full px-0.5", isSelected ? "text-white" : "text-[#18181B] dark:text-slate-200")}>
                                    {cat.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    />
                    {errors.category && <p className="text-[11px] text-[#E85024] font-medium">{errors.category.message}</p>}
                  </div>
                )}

                {/* Tanggal Transaksi */}
                <div className="space-y-1.5">
                  <Label htmlFor="d-date" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">Tanggal Transaksi</Label>
                  <Input
                    id="d-date"
                    type="date"
                    className="h-12 text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-semibold px-4 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs w-full cursor-pointer"
                    {...register("date")}
                  />
                  {errors.date && <p className="text-[11px] text-[#E85024] font-medium">{errors.date.message}</p>}
                </div>

                {/* Catatan Transaksi (Textarea Nyata) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="d-notes" className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">Catatan</Label>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">Opsional</span>
                  </div>
                  <Textarea
                    id="d-notes"
                    placeholder="Tulis catatan atau deskripsi transaksi di sini…"
                    rows={3}
                    className="min-h-[84px] text-sm rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border-black/[0.06] dark:border-slate-700 text-[#18181B] dark:text-slate-100 font-medium p-3.5 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-2xs resize-none placeholder:text-stone-400 dark:placeholder:text-slate-500"
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* Submit Action (Fixed Pinned Footer) */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> <span>Sedang Menyimpan…</span></>
                  ) : (
                    <>{type === "transfer" ? <ArrowRightLeft className="h-4 w-4 stroke-[2.5]" /> : <PlusCircle className="h-4 w-4 stroke-[2.5]" />} <span>{type === "transfer" ? "Simpan Transfer" : "Simpan Transaksi"}</span></>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* ── STEP 3: CREATE CUSTOM CATEGORY VIEW (MULTI-STEP INTEGRATED) ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
                <StepIndicator total={1} current={0} onBack={() => setStep(1)} showBack={true} />

                {/* Preview Tampilan */}
                <div className="flex items-center justify-center py-2">
                  <div
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-3 px-6 min-w-[90px] shadow-xs"
                    style={{ borderColor: newCatColor, backgroundColor: `${newCatColor}15` }}
                  >
                    <AnimatedEmoji emoji={newCatEmoji} size={24} />
                    <span className="text-xs font-bold" style={{ color: newCatColor }}>
                      {newCatName || "Nama Kategori"}
                    </span>
                  </div>
                </div>

                {/* Category Name Input */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Nama Kategori</Label>
                  <Input
                    placeholder="Nama kategori..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-11 text-sm rounded-2xl bg-surface-muted/60 dark:bg-slate-800/80 border-stone-200/50 dark:border-slate-700 px-4 text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all font-medium"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                {/* Emoji Selection */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Pilih Emoji</span>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl border border-stone-200/60 dark:border-slate-800 bg-surface-muted/40 dark:bg-slate-800/40 max-h-[130px] overflow-y-auto custom-scrollbar">
                    {EMOJI_OPTIONS.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => setNewCatEmoji(emoji)}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer",
                          newCatEmoji === emoji
                            ? "bg-white dark:bg-slate-700 shadow-xs ring-2 ring-[#E85024]"
                            : "hover:bg-white/60 dark:hover:bg-slate-700/60"
                        )}
                      >
                        <AnimatedEmoji emoji={emoji} size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">Pilih Warna Aksen</span>
                  <div className="flex flex-wrap gap-2 p-2 rounded-2xl border border-stone-200/60 dark:border-slate-800 bg-surface-muted/40 dark:bg-slate-800/40">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={cn(
                          "h-7 w-7 rounded-full transition-all cursor-pointer shadow-xs",
                          newCatColor === color ? "ring-2 ring-offset-2 ring-black dark:ring-white scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Submit Kategori (Fixed Pinned Footer) */}
              <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  className="w-full h-12 text-sm font-bold rounded-full bg-[#1A1A1A] dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white cursor-pointer disabled:opacity-50 shadow-sm transition-all active:scale-[0.99]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Simpan Kategori
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function TypeButton({ active, onClick, icon, label, activeClass }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: React.ReactNode; activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition-all duration-150 select-none cursor-pointer",
        active ? activeClass : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
