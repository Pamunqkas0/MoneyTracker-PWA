"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, PencilLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { updateTransaction } from "@/app/actions";
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
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  bankAccounts,
  availableCategories,
}: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMsg("");
      setIsSuccess(false);
      setIsLoading(false);
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

      setIsLoading(false);
      setIsSuccess(true);

      window.setTimeout(() => {
        handleDialogChange(false);
      }, 1200);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Coba lagi.");
      setIsLoading(false);
    }
  };

  const defaultCategories =
    type === "income" ? categoryState.income : categoryState.expense;

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent showHandle className="p-0 overflow-hidden rounded-t-[28px] md:rounded-[32px] bg-white border border-black/[0.04] shadow-2xl max-w-lg w-full mx-auto">
        <DialogHeader className="p-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FDD5C1] text-[#E85024] shadow-xs">
              <PencilLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#18181B]">
                Edit Transaksi
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 mt-0.5">
                Perbarui detail transaksi tanpa menghilangkan sinkron saldo rekening.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 pb-8 pt-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F5A2] text-stone-900 shadow-sm">
              <CheckCircle2 className="h-7 w-7 text-stone-800" />
            </div>
            <div>
              <p className="font-bold text-[#18181B] text-base">Transaksi Berhasil Diperbarui</p>
              <p className="mt-1 text-xs text-stone-500">
                Nilai terbaru <span className="font-bold text-[#18181B]">{formatCurrency(Number(rawAmount || 0), true)}</span> sudah tersimpan.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 pb-6 pt-3">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1.5 rounded-full bg-surface-muted/80 p-1 border border-black/[0.03]">
                  <button
                    type="button"
                    onClick={() => field.onChange("expense")}
                    className={cn(
                      "rounded-full py-2 text-xs font-semibold transition-all cursor-pointer",
                      field.value === "expense"
                        ? "bg-[#1A1A1A] text-white shadow-xs"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange("income")}
                    className={cn(
                      "rounded-full py-2 text-xs font-semibold transition-all cursor-pointer",
                      field.value === "income"
                        ? "bg-[#E85024] text-white shadow-xs"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    Pemasukan
                  </button>
                </div>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold text-stone-500">Nama Transaksi</Label>
                <Input
                  id="edit-name"
                  {...register("name")}
                  placeholder="Contoh: Belanja Mingguan"
                  className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                />
                {errors.name && <p className="text-[11px] text-[#E85024] font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-date" className="text-xs font-semibold text-stone-500">Tanggal</Label>
                <Input
                  id="edit-date"
                  type="date"
                  {...register("date")}
                  className="h-11 text-sm rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
                />
                {errors.date && <p className="text-[11px] text-[#E85024] font-medium">{errors.date.message}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount" className="text-xs font-semibold text-stone-500">Nominal</Label>
                <div className="relative flex items-center rounded-2xl bg-surface-muted/60 border border-stone-200/50 p-1 focus-within:ring-2 focus-within:ring-black/10 focus-within:bg-white transition-all">
                  <span className="pl-3 text-sm font-bold text-stone-400">Rp</span>
                  <Input
                    id="edit-amount"
                    inputMode="numeric"
                    value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-lg h-9 text-[#18181B] tabular-nums bg-transparent pr-2"
                  />
                </div>
                {errors.amount && <p className="text-[11px] text-[#E85024] font-medium">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-500">Rekening</Label>
                <Controller
                  name="bank_account_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-11 rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 font-medium text-sm">
                        <SelectValue placeholder="Pilih rekening" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-stone-200">
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="rounded-xl">
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.bank_account_id && <p className="text-[11px] text-[#E85024] font-medium">{errors.bank_account_id.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-500">Kategori</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-11 rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 font-medium text-sm">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200">
                      {defaultCategories.map((category) => {
                        return (
                          <SelectItem key={`${category.type}-${category.slug}`} value={category.slug} className="rounded-xl">
                            <span className="flex items-center gap-2">
                              <AnimatedEmoji emoji={category.emoji} size={16} />
                              <span>{category.name}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-[11px] text-[#E85024] font-medium">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs font-semibold text-stone-500">Catatan <span className="opacity-50 font-normal">(opsional)</span></Label>
              <Textarea
                id="edit-notes"
                {...register("notes")}
                rows={2}
                placeholder="Catatan singkat…"
                className="rounded-2xl bg-surface-muted/60 border-stone-200/50 px-4 py-2.5 text-sm resize-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white transition-all font-medium"
              />
              {errors.notes && <p className="text-[11px] text-[#E85024] font-medium">{errors.notes.message}</p>}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer text-sm"
                onClick={() => handleDialogChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white font-bold cursor-pointer shadow-sm text-sm transition-all active:scale-[0.99]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

