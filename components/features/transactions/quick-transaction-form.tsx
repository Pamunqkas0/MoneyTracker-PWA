"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, PlusCircle, TrendingDown, TrendingUp, AlertCircle, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { addTransaction, createCategory, createTransferTransaction } from "@/app/actions";
import type { AvailableTransactionCategories, CategoryOption } from "@/lib/supabase/queries";
import type { BankAccountRow } from "@/lib/supabase/types";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import fluentEmojisKeys from "@/lib/fluent-emojis-keys.json";
const EMOJI_OPTIONS = fluentEmojisKeys as string[];
const COLOR_OPTIONS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6", "#06b6d4", "#f97316", "#ef4444"];

function slugifyCategoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

const schema = z
  .object({
    amount: z.number().positive("Nominal harus lebih dari 0"),
    type: z.enum(["income", "expense", "transfer"]),
    category: z.string(),
    name: z.string().min(2, "Nama transaksi min. 2 karakter").max(60),
    date: z.string().min(1, "Pilih tanggal"),
    notes: z.string().max(200).optional(),
    bank_account_id: z.string().min(1, "Pilih rekening asal"),
    transfer_account_id: z.string().optional(),
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
      if (!values.transfer_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transfer_account_id"],
          message: "Pilih rekening tujuan",
        });
      }

      if (values.transfer_account_id && values.transfer_account_id === values.bank_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transfer_account_id"],
          message: "Rekening tujuan harus berbeda",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export function QuickTransactionForm({
  bankAccounts,
  availableCategories,
}: {
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [categoryState, setCategoryState] = useState<AvailableTransactionCategories>(availableCategories);
  const [isCustomEditorOpen, setIsCustomEditorOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const [newCatColor, setNewCatColor] = useState("#10b981");
  const [visibleEmojiCount, setVisibleEmojiCount] = useState(60);

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
      transfer_account_id: "",
    },
  });

  const type = watch("type");
  const selectedCategory = watch("category");
  const selectedAccountId = watch("bank_account_id");
  const transferAccountId = watch("transfer_account_id");
  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);
  const selectedTransferAccount = bankAccounts.find((a) => a.id === transferAccountId);

  useEffect(() => {
    setCategoryState(availableCategories);
  }, [availableCategories]);

  useEffect(() => {
    if (type === "transfer") {
      setValue("category", "transfer", { shouldValidate: false });
      setIsCustomEditorOpen(false);
      return;
    }

    if (!selectedCategory) return;

    const defaults = type === "income" ? categoryState.income : categoryState.expense;
    if (!defaults.some((category) => category.slug === selectedCategory)) {
      setValue("category", "", { shouldValidate: false });
    }
  }, [categoryState.expense, categoryState.income, selectedCategory, setValue, type]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawAmount(raw);
    setValue("amount", Number(raw), { shouldValidate: true });
  };

  const handleOpenCustomEditor = () => {
    setIsCustomEditorOpen(true);
    setNewCatName("");
    setNewCatEmoji("🏷️");
    setNewCatColor("#10b981");
    setVisibleEmojiCount(60);
  };

  const handleEmojiScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleEmojiCount((prev) => Math.min(prev + 60, EMOJI_OPTIONS.length));
    }
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
      setErrorMsg(result.error || "Gagal menyimpan kategori.");
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
    setNewCatColor("#10b981");
    setIsCustomEditorOpen(false);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result =
        data.type === "transfer"
          ? await createTransferTransaction({
              name: data.name,
              amount: data.amount,
              date: data.date,
              notes: data.notes,
              from_bank_account_id: data.bank_account_id,
              to_bank_account_id: data.transfer_account_id || "",
            })
          : await addTransaction({
              name: data.name,
              amount: data.amount,
              type: data.type,
              category: data.category,
              date: data.date,
              notes: data.notes,
              bank_account_id: data.bank_account_id,
            });

      if (!result.success) {
        setErrorMsg(result.error || "Gagal menyimpan transaksi");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]); // Success vibration pattern
      }

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        reset({
          type: "expense",
          date: new Date().toISOString().split("T")[0],
          bank_account_id: bankAccounts[0]?.id ?? "",
          transfer_account_id: "",
        });
        setRawAmount("");
      }, 2000);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsLoading(false);
    }
  };

  const categoryOptions = type === "income" ? categoryState.income : categoryState.expense;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <PlusCircle className={cn(
              "h-5 w-5 transition-colors",
              type === "income" ? "text-emerald-500" : type === "transfer" ? "text-teal-600" : "text-rose-500"
            )} />
            Tambah Transaksi Fast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-10 gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base text-[var(--foreground)]">Transaksi Ditambahkan!</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formatCurrency(Number(rawAmount))} berhasil disimpan
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Error banner */}
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 text-xs text-rose-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Segmented Control – Type */}
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--card-border)]/25 bg-[var(--muted)]/50 p-2">
                      <button
                        type="button"
                        onClick={() => field.onChange("income")}
                        className={cn(
                          "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all duration-150 cursor-pointer sm:min-h-[56px] sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                          field.value === "income"
                            ? "border border-[var(--card-border)]/50 bg-[var(--card)] text-emerald-600 shadow-sm dark:text-emerald-400"
                            : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--card)]/45 hover:text-[var(--foreground)]"
                        )}
                      >
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        <span className="text-center leading-[1.1]">
                          <span className="block">Uang</span>
                          <span className="block">Masuk</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("expense")}
                        className={cn(
                          "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all duration-150 cursor-pointer sm:min-h-[56px] sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                          field.value === "expense"
                            ? "border border-[var(--card-border)]/50 bg-[var(--card)] text-rose-600 shadow-sm dark:text-rose-400"
                            : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--card)]/45 hover:text-[var(--foreground)]"
                        )}
                      >
                        <TrendingDown className="h-4 w-4 shrink-0" />
                        <span className="text-center leading-[1.1]">
                          <span className="block">Uang</span>
                          <span className="block">Keluar</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("transfer")}
                        className={cn(
                          "flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-semibold transition-all duration-150 cursor-pointer sm:min-h-[56px] sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                          field.value === "transfer"
                            ? "border border-[var(--card-border)]/50 bg-[var(--card)] text-teal-600 shadow-sm dark:text-teal-400"
                            : "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--card)]/45 hover:text-[var(--foreground)]"
                        )}
                      >
                        <ArrowRightLeft className="h-4 w-4 shrink-0" />
                        <span className="text-center leading-[1.1]">
                          <span className="block">Pindah</span>
                          <span className="block">Dana</span>
                        </span>
                      </button>
                    </div>
                  )}
                />

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-medium text-[var(--muted-foreground)]">Nominal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted-foreground)]">
                      Rp
                    </span>
                    <Input
                      id="amount"
                      inputMode="numeric"
                      placeholder="0"
                      value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                      onChange={handleAmountChange}
                      className="pl-9 pr-3 text-right font-bold text-base h-11 focus-visible:ring-2 focus-visible:ring-offset-0"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.amount.message}</p>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-[var(--muted-foreground)]">Nama Transaksi</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Makan Siang, Gaji Bulanan"
                    className="h-10 text-sm"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Grid Container for Desktop optimizations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs font-medium text-[var(--muted-foreground)]">Tanggal</Label>
                    <Input id="date" type="date" className="h-10 text-sm" {...register("date")} />
                    {errors.date && (
                      <p className="text-[11px] text-rose-500 font-medium">{errors.date.message}</p>
                    )}
                  </div>
                </div>

                {/* Category */}
                {type !== "transfer" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-medium text-[var(--muted-foreground)]">Kategori</Label>
                    <button
                      type="button"
                      onClick={() => setIsCustomEditorOpen((prev) => !prev)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-500"
                    >
                      <PlusCircle className="h-3 w-3" />
                      {isCustomEditorOpen ? "Tutup Custom" : "Custom"}
                    </button>
                  </div>

                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {categoryOptions.map((cat) => {
                            const isSelected = field.value === cat.slug;

                            return (
                              <button
                                key={`${cat.type}-${cat.slug}`}
                                type="button"
                                onClick={() => field.onChange(cat.slug)}
                                className={cn(
                                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition-all",
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-500/5 font-bold text-emerald-600 shadow-sm"
                                    : "border-[var(--card-border)] bg-[var(--muted)]/40 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/75"
                                )}
                              >
                                <AnimatedEmoji emoji={cat.emoji} size={16} />
                                <span className="w-full truncate px-0.5 text-[10px] leading-tight">{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  />

                  {errors.category && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.category.message}</p>
                  )}

                  <AnimatePresence initial={false}>
                    {isCustomEditorOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--muted)]/20"
                      >
                        <div className="space-y-3 p-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="custom-category-name" className="text-[11px] font-medium text-[var(--muted-foreground)]">
                              Nama kategori baru
                            </Label>
                            <Input
                              id="custom-category-name"
                              value={newCatName}
                              onChange={(event) => setNewCatName(event.target.value)}
                              placeholder="Mis. Nongkrong, Bonus, Hadiah"
                              className="h-10 text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-[var(--muted-foreground)]">Emoji</Label>
                            <div 
                              className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1"
                              onScroll={handleEmojiScroll}
                            >
                              {EMOJI_OPTIONS.slice(0, visibleEmojiCount).map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => setNewCatEmoji(emoji)}
                                  className={cn(
                                    "flex h-9 items-center justify-center rounded-lg border text-base transition-all",
                                    newCatEmoji === emoji
                                      ? "border-emerald-500 bg-emerald-500/10"
                                      : "border-[var(--card-border)] bg-[var(--card)]"
                                  )}
                                >
                                  <AnimatedEmoji emoji={emoji} size={24} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-[var(--muted-foreground)]">Warna</Label>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setNewCatColor(color)}
                                  className={cn(
                                    "h-7 w-7 rounded-full border-2 transition-transform",
                                    newCatColor === color
                                      ? "scale-110 border-[var(--foreground)]"
                                      : "border-white/50"
                                  )}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Pilih warna ${color}`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between rounded-xl border border-[var(--card-border)]/40 bg-[var(--card)] px-3 py-2">
                            <div className="flex items-center gap-2">
                              <AnimatedEmoji emoji={newCatEmoji} size={24} />
                              <span className="text-sm font-semibold" style={{ color: newCatColor }}>
                                {newCatName || "Preview kategori"}
                              </span>
                            </div>
                            <Button type="button" size="sm" onClick={handleCreateCategory} disabled={!newCatName.trim()}>
                              Simpan
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}

                {/* Bank Account */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--muted-foreground)]">
                    {type === "transfer" ? "Rekening Asal" : "Rekening Tujuan"}
                  </Label>
                  <Controller
                    name="bank_account_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            {selectedAccount ? (
                              <>
                                {selectedAccount.logo?.startsWith("/") ? (
                                  <div className="bg-white dark:bg-neutral-800 p-0.5 rounded border border-[var(--card-border)]/40 flex items-center justify-center w-6 h-4 shrink-0 shadow-sm">
                                    <img src={selectedAccount.logo} alt="" className="max-h-full max-w-full object-contain" />
                                  </div>
                                ) : (
                                  <span className="text-sm leading-none shrink-0">{selectedAccount.logo}</span>
                                )}
                                <span className="truncate">{selectedAccount.name}</span>
                              </>
                            ) : (
                              <span className="text-[var(--muted-foreground)]">Pilih rekening...</span>
                            )}
                          </div>
                        </SelectTrigger>

                        <SelectContent>
                          {bankAccounts.map((account) => {
                            const isImgLogo = account.logo?.startsWith("/");
                            return (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center justify-between w-full min-w-[240px] text-sm">
                                  <span className="flex items-center gap-2 truncate">
                                    {isImgLogo ? (
                                      <div className="bg-white p-0.5 rounded border border-neutral-200 dark:border-neutral-800 flex items-center justify-center w-6 h-4 shrink-0">
                                        <img src={account.logo} alt="" className="max-h-full max-w-full object-contain" />
                                      </div>
                                    ) : (
                                      <span className="text-base leading-none shrink-0">{account.logo}</span>
                                    )}
                                    <span className="truncate">{account.name}</span>
                                  </span>
                                  <span className="text-[var(--muted-foreground)] text-xs font-medium ml-auto pl-4 tabular-nums shrink-0">
                                    {formatCurrency(account.balance, true)}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bank_account_id && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.bank_account_id.message}</p>
                  )}
                </div>

                {type === "transfer" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--muted-foreground)]">Rekening Tujuan Transfer</Label>
                    <Controller
                      name="transfer_account_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10 text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              {selectedTransferAccount ? (
                                <>
                                  {selectedTransferAccount.logo?.startsWith("/") ? (
                                    <div className="bg-white dark:bg-neutral-800 p-0.5 rounded border border-[var(--card-border)]/40 flex items-center justify-center w-6 h-4 shrink-0 shadow-sm">
                                      <img src={selectedTransferAccount.logo} alt="" className="max-h-full max-w-full object-contain" />
                                    </div>
                                  ) : (
                                    <span className="text-sm leading-none shrink-0">{selectedTransferAccount.logo}</span>
                                  )}
                                  <span className="truncate">{selectedTransferAccount.name}</span>
                                </>
                              ) : (
                                <span className="text-[var(--muted-foreground)]">Pilih rekening tujuan...</span>
                              )}
                            </div>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {bankAccounts
                              .filter((account) => account.id !== selectedAccountId)
                              .map((account) => {
                                const isImgLogo = account.logo?.startsWith("/");
                                return (
                                  <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center justify-between w-full min-w-[240px] text-sm">
                                      <span className="flex items-center gap-2 truncate">
                                        {isImgLogo ? (
                                          <div className="bg-white p-0.5 rounded border border-neutral-200 dark:border-neutral-800 flex items-center justify-center w-6 h-4 shrink-0">
                                            <img src={account.logo} alt="" className="max-h-full max-w-full object-contain" />
                                          </div>
                                        ) : (
                                          <span className="text-base leading-none shrink-0">{account.logo}</span>
                                        )}
                                        <span className="truncate">{account.name}</span>
                                      </span>
                                      <span className="text-[var(--muted-foreground)] text-xs font-medium ml-auto pl-4 tabular-nums shrink-0">
                                        {formatCurrency(account.balance, true)}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.transfer_account_id && (
                      <p className="text-[11px] text-rose-500 font-medium">{errors.transfer_account_id.message}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-medium text-[var(--muted-foreground)]">
                    Catatan <span className="text-[var(--muted-foreground)]/60 font-normal">(opsional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Tambahkan catatan singkat transaksi..."
                    className="text-sm resize-none"
                    rows={2}
                    {...register("notes")}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-11 font-semibold text-sm rounded-xl transition-all duration-200 mt-2 shadow-sm cursor-pointer text-white",
                    type === "income"
                      ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      : type === "transfer"
                        ? "bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                        : "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {type === "transfer" ? <ArrowRightLeft className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                      <span>
                        {type === "income"
                          ? "Simpan Pemasukan"
                          : type === "transfer"
                            ? "Simpan Transfer"
                            : "Simpan Pengeluaran"}
                      </span>
                    </div>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
