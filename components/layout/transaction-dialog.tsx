"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addTransaction, createCategory, createTransferTransaction } from "@/app/actions";
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all active:scale-95 cursor-pointer"
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
                  : "w-1.5 h-1.5 bg-stone-200"
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
      setStep(0);
    }
    onOpenChange(v);
  };

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

  const { defaults: categoryDefaults } = getAllCategories();
  const selectedBank = displayBankAccounts.find((b) => b.id === bankId);
  const selectedTransferBank = displayBankAccounts.find((b) => b.id === transferBankId);
  const isSelectedBankImgLogo = selectedBank?.logo?.startsWith("/");
  const isSelectedTransferBankImgLogo = selectedTransferBank?.logo?.startsWith("/");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showHandle className="p-0 overflow-hidden rounded-t-[28px] md:rounded-[32px] bg-white border border-black/[0.04] shadow-2xl max-w-md w-full mx-auto">
        {/* Dynamic Header */}
        <DialogHeader className="p-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl shadow-xs",
              step === 3 ? "bg-[#E0E6FD] text-[#3B4CCA]" : "bg-[#FDD5C1] text-[#E85024]"
            )}>
              {step === 3 ? <Sparkles className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#18181B]">
                {step === 3 ? "Buat Kategori Baru" : "Tambah Transaksi"}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 mt-0.5">
                {step === 3 ? "Sesuaikan nama, emoji, dan warna kategori" : step === 0 ? "Tentukan nominal rupiah & rekening" : "Lengkapi detail catatan transaksi"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 overflow-y-auto max-h-[76vh] sm:max-h-[550px] custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ── STEP 2: SUCCESS VIEW ─────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 gap-4 text-center"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#D8F5A2]/60 animate-ping" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F5A2] text-stone-900 shadow-sm">
                    <CheckCircle2 className="h-8 w-8 text-stone-800" />
                  </div>
                </div>
                <div className="space-y-1.5 px-2">
                  <p className="text-lg font-bold text-[#18181B]">Transaksi Berhasil Disimpan!</p>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                    Catatan {type === "income" ? "pemasukan" : type === "transfer" ? "transfer" : "pengeluaran"}{" "}
                    <span className="font-bold text-[#18181B] tabular-nums">
                      {formatCurrency(Number(rawAmount))}
                    </span>{" "}
                    {type === "transfer" ? (
                      <>
                        berhasil dipindahkan dari{" "}
                        <span className="font-bold text-[#18181B]">{selectedBank?.name}</span>
                        {" "}ke{" "}
                        <span className="font-bold text-[#18181B]">{selectedTransferBank?.name}</span>
                      </>
                    ) : (
                      <>
                        telah tercatat pada dompet{" "}
                        <span className="font-bold text-[#18181B]">{selectedBank?.name}</span>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 0: INITIAL INFO ────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 pt-0.5"
              >
                <StepIndicator total={2} current={0} onBack={() => { }} showBack={false} />

                {/* Segmented Type Toggle */}
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1.5 rounded-full bg-surface-muted/80 p-1 border border-black/[0.03]">
                      <TypeButton
                        active={field.value === "expense"}
                        onClick={() => field.onChange("expense")}
                        icon={<TrendingDown className="h-3.5 w-3.5" />}
                        label="Pengeluaran"
                        activeClass="bg-[#1A1A1A] text-white shadow-xs"
                      />
                      <TypeButton
                        active={field.value === "income"}
                        onClick={() => field.onChange("income")}
                        icon={<TrendingUp className="h-3.5 w-3.5" />}
                        label="Pemasukan"
                        activeClass="bg-[#E85024] text-white shadow-xs"
                      />
                      <TypeButton
                        active={field.value === "transfer"}
                        onClick={() => field.onChange("transfer")}
                        icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                        label="Transfer"
                        activeClass="bg-stone-700 text-white shadow-xs"
                      />
                    </div>
                  )}
                />

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="d-amount" className="text-xs font-semibold text-stone-500">Nominal Transaksi</Label>
                  <div className="relative flex items-center rounded-2xl bg-surface-muted/60 border border-stone-200/50 p-2 focus-within:ring-2 focus-within:ring-black/10 focus-within:bg-white transition-all">
                    <span className="pl-3 text-sm font-bold text-stone-400">
                      Rp
                    </span>
                    <Input
                      id="d-amount"
                      inputMode="numeric"
                      placeholder="0"
                      value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                      onChange={handleAmountChange}
                      className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-2xl h-10 text-[#18181B] tabular-nums bg-transparent pr-2"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.amount.message}</p>
                  )}
                </div>

                {/* Bank Grid View */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-500">
                    {type === "transfer" ? "Pilih Rekening Asal" : "Pilih Rekening / Dompet"}
                  </Label>
                  <Controller
                    name="bankAccountId"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {displayBankAccounts.map((account) => {
                          const isSelected = field.value === account.id;
                          const isImgLogo = account.logo?.startsWith("/");
                          return (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => field.onChange(account.id)}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-center transition-all duration-150 select-none cursor-pointer min-h-[76px] border",
                                isSelected
                                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm"
                                  : "border-stone-200/60 bg-surface-muted/40 hover:bg-surface-muted text-stone-700"
                              )}
                            >
                              {isImgLogo ? (
                                <div className={cn("h-6 flex items-center justify-center rounded-lg p-0.5 w-10 shrink-0", isSelected ? "bg-white/95 shadow-xs" : "bg-white border border-stone-200/50")}>
                                  <img src={account.logo} alt={account.name} className="max-h-full max-w-full object-contain" />
                                </div>
                              ) : (
                                <span className="text-xl leading-none">{account.logo}</span>
                              )}

                              <span className={cn("text-[10px] font-bold tracking-tight truncate w-full px-0.5", isSelected ? "text-white" : "text-[#18181B]")}>
                                {account.name}
                              </span>
                              {isSelected && (
                                <span className="text-[8px] text-stone-300 font-medium tracking-wide tabular-nums truncate w-full">
                                  {formatCurrency(account.balance, true)}
                                </span>
                              )}
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

                {type === "transfer" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500">Pilih Rekening Tujuan</Label>
                    <Controller
                      name="transferAccountId"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2">
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
                                    "relative flex items-center gap-2 rounded-2xl border p-2.5 text-left transition-all duration-150 select-none cursor-pointer min-h-[64px]",
                                    isSelected
                                      ? "border-[#E85024] bg-[#FDD5C1]/30 shadow-xs"
                                      : "border-stone-200/60 bg-surface-muted/40 hover:bg-surface-muted"
                                  )}
                                >
                                  <div className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200/60 overflow-hidden bg-white shadow-2xs"
                                  )}>
                                    {isImgLogo ? (
                                      <img src={account.logo} alt={account.name} className="max-h-5 max-w-6 object-contain" />
                                    ) : (
                                      <span className="text-base leading-none">{account.logo}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn("truncate text-xs font-bold", isSelected ? "text-[#E85024]" : "text-[#18181B]")}>
                                      {account.name}
                                    </p>
                                    <p className="mt-0.5 truncate text-[10px] text-stone-400 tabular-nums">
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

                {/* Active Wallet Details Anchor banner */}
                <div className="min-h-[46px]">
                  <AnimatePresence mode="wait">
                    {selectedBank && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="flex items-center gap-3 rounded-2xl p-2.5 border border-stone-200/60 bg-surface-muted/50"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm border border-stone-200/60 overflow-hidden bg-white shadow-2xs",
                            isSelectedBankImgLogo ? "p-1" : ""
                          )}
                        >
                          {isSelectedBankImgLogo ? (
                            <img src={selectedBank.logo} alt={selectedBank.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            selectedBank.logo
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#18181B] truncate">{selectedBank.name}</p>
                          <p className="text-[10px] text-stone-500 font-medium mt-0.5 tabular-nums">
                            {type === "transfer" ? "Saldo Asal" : "Sisa Saldo"}: <span className="font-bold text-stone-700">{formatCurrency(selectedBank.balance, true)}</span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNextStep}
                    className="w-full h-12 text-sm font-bold rounded-full gap-2 shadow-sm text-white cursor-pointer bg-[#E85024] hover:bg-[#d44319] transition-all active:scale-[0.99]"
                  >
                    <span>Lanjut Isi Detail</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: COMPLEMENTARY DETAILS ──────────────────────────── */}
            {step === 1 && (
              <motion.form
                key="step1"
                onSubmit={handleSubmit(onSubmit)}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-0.5"
              >
                <StepIndicator total={2} current={1} onBack={() => setStep(0)} showBack={true} />

                <div className="flex items-center gap-3 rounded-2xl border border-stone-200/60 bg-surface-muted/50 p-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200/60 text-sm overflow-hidden bg-white shadow-2xs",
                    isSelectedBankImgLogo ? "p-1" : ""
                  )}>
                    {isSelectedBankImgLogo ? (
                      <img src={selectedBank?.logo} alt={selectedBank?.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      selectedBank?.logo
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-stone-500">
                      {type === "income" ? "Rencana Masuk" : type === "transfer" ? "Rencana Transfer" : "Rencana Keluar"} &bull; {selectedBank?.name}
                      {type === "transfer" && selectedTransferBank ? ` -> ${selectedTransferBank.name}` : ""}
                    </p>
                    <p className="text-base font-black text-[#18181B] tabular-nums mt-0.5">
                      {formatCurrency(Number(rawAmount))}
                    </p>
                  </div>
                </div>

                {/* Input Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="d-name" className="text-xs font-semibold text-stone-500">Nama Transaksi</Label>
                  <Input
                    id="d-name"
                    placeholder="Mis. Belanja Mingguan, Makan Siang, Gaji…"
                    className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                    {...register("name")}
                  />
                  {errors.name && <p className="text-[11px] text-[#E85024] font-medium">{errors.name.message}</p>}
                </div>

                {/* Category Grid Selection */}
                {type !== "transfer" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-stone-500">Pilih Kategori</Label>
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
                                    ? "border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold shadow-xs"
                                    : "border-stone-200/60 bg-surface-muted/40 text-stone-700 hover:bg-surface-muted"
                                )}
                              >
                                <AnimatedEmoji emoji={cat.emoji} size={16} />
                                <span className={cn("text-[10px] leading-tight truncate w-full px-0.5", isSelected ? "text-white" : "text-[#18181B]")}>
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

                {/* Responsive Date + Notes Row */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="d-date" className="text-xs font-semibold text-stone-500">Tanggal</Label>
                    <Input id="d-date" type="date" className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium" {...register("date")} />
                    {errors.date && <p className="text-[11px] text-[#E85024] font-medium">{errors.date.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="d-notes" className="text-xs font-semibold text-stone-500">Catatan <span className="opacity-50 font-normal">(opsional)</span></Label>
                    <Textarea id="d-notes" placeholder="Catatan singkat…" rows={1} className="h-11 min-h-[44px] text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 py-3 resize-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium" {...register("notes")} />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full h-12 text-sm font-bold rounded-full gap-2 text-white cursor-pointer shadow-sm transition-all active:scale-[0.99] bg-[#E85024] hover:bg-[#d44319]"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> <span>Sedang Menyimpan…</span></>
                    ) : (
                      <>{type === "transfer" ? <ArrowRightLeft className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />} <span>{type === "transfer" ? "Simpan Transfer" : "Simpan Transaksi"}</span></>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 3: CREATE CUSTOM CATEGORY VIEW (MULTI-STEP INTEGRATED) ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-0.5"
              >
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
                  <Label className="text-xs font-semibold text-stone-500">Nama Kategori</Label>
                  <Input
                    placeholder="Nama kategori..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                {/* Emoji Selection */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-500">Pilih Emoji</span>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl border border-stone-200/60 bg-surface-muted/40 max-h-[130px] overflow-y-auto custom-scrollbar">
                    {EMOJI_OPTIONS.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => setNewCatEmoji(emoji)}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer",
                          newCatEmoji === emoji
                            ? "bg-white shadow-xs ring-2 ring-[#E85024]"
                            : "hover:bg-white/60"
                        )}
                      >
                        <AnimatedEmoji emoji={emoji} size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-stone-500">Pilih Warna Aksen</span>
                  <div className="flex flex-wrap gap-2 p-2 rounded-2xl border border-stone-200/60 bg-surface-muted/40">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={cn(
                          "h-7 w-7 rounded-full transition-all cursor-pointer shadow-xs",
                          newCatColor === color ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Submit Kategori */}
                <div className="pt-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim()}
                    className="w-full h-12 text-sm font-bold rounded-full bg-[#1A1A1A] hover:bg-black text-white cursor-pointer disabled:opacity-50 shadow-sm transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Simpan Kategori
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
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
        active ? activeClass : "text-stone-500 hover:text-stone-800"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
