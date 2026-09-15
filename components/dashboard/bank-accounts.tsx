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
          <p className="text-lg sm:text-xl font-bold text-white tracking-widest tabular-nums font-mono drop-shadow-md">
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { initialBalance: 0, presetId: "" },
  });

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawBalance(raw);
    setValue("initialBalance", Number(raw), { shouldValidate: !!raw });
  };

  const onSubmit = async (data: AddFormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    const preset = BANK_PRESETS.find((p) => p.id === data.presetId);
    if (!preset) {
      setErrorMsg("Preset rekening tidak ditemukan");
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
    }
    onOpenChange(v);
  };

  const bankPresets = BANK_PRESETS.filter((p) => p.type === "bank");
  const ewalletPresets = BANK_PRESETS.filter((p) => p.type === "ewallet");
  const cashPresets = BANK_PRESETS.filter((p) => p.type === "cash");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showHandle className="max-w-lg p-0 overflow-hidden rounded-t-[28px] md:rounded-[32px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl w-full mx-auto">
        <DialogHeader className="p-6 pb-4 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E0E6FD] dark:bg-indigo-500/20 text-[#3B4CCA] dark:text-indigo-300 shadow-xs">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#18181B] dark:text-slate-100">Tambah Rekening</DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Tambahkan bank atau e-wallet kamu secara instan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto max-h-[72vh] sm:max-h-[600px] space-y-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-3"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F5A2] dark:bg-emerald-950/60 text-stone-900 dark:text-emerald-300 shadow-sm border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-stone-800 dark:text-emerald-300" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-[#18181B] dark:text-slate-100">Rekening Ditambahkan!</p>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">Rekening baru berhasil disimpan ke sistem.</p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Preset Picker */}
                <Controller
                  name="presetId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3 bg-surface-muted/40 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/60 p-3.5 rounded-3xl">
                      {/* Banks */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">🏦 Bank</p>
                        <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
                          {bankPresets.map((p) => (
                            <PresetButton key={p.id} preset={p} selected={field.value === p.id} onSelect={() => field.onChange(p.id)} />
                          ))}
                        </div>
                      </div>
                      {/* E-wallets */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">💳 E-Wallet</p>
                        <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
                          {ewalletPresets.map((p) => (
                            <PresetButton key={p.id} preset={p} selected={field.value === p.id} onSelect={() => field.onChange(p.id)} />
                          ))}
                        </div>
                      </div>
                      {/* Cash */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">💵 Lainnya</p>
                        <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
                          {cashPresets.map((p) => (
                            <PresetButton key={p.id} preset={p} selected={field.value === p.id} onSelect={() => field.onChange(p.id)} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                />
                {errors.presetId && (
                  <p className="text-[11px] text-[#E85024] font-medium -mt-2">{errors.presetId.message}</p>
                )}

                {/* Nickname */}
                <div className="space-y-1.5">
                  <Label htmlFor="acc-nick" className="text-xs font-semibold text-stone-500 dark:text-slate-400">Nama Panggilan Rekening</Label>
                  <Input id="acc-nick" placeholder="Mis. BCA Tabungan, GoPay Utama…" className="h-11 text-sm rounded-2xl bg-surface-muted/60 dark:bg-slate-800/80 border-stone-200/50 dark:border-slate-700 px-4 text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all font-medium" {...register("nickname")} />
                  {errors.nickname && (
                    <p className="text-[11px] text-[#E85024] font-medium">{errors.nickname.message}</p>
                  )}
                </div>

                {/* Responsive Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-num" className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                      No. Rekening <span className="text-stone-400 dark:text-slate-500 font-normal">(opsional)</span>
                    </Label>
                    <Input id="acc-num" placeholder="4 digit terakhir" maxLength={25} className="h-11 text-sm rounded-2xl bg-surface-muted/60 dark:bg-slate-800/80 border-stone-200/50 dark:border-slate-700 px-4 text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all font-medium" {...register("accountNumber")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc-bal" className="text-xs font-semibold text-stone-500 dark:text-slate-400">Saldo Awal</Label>
                    <div className="relative flex items-center rounded-2xl bg-surface-muted/60 dark:bg-slate-800/80 border border-stone-200/50 dark:border-slate-700 p-1 focus-within:ring-2 focus-within:ring-black/10 dark:focus-within:ring-white/10 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                      <span className="pl-3 text-sm font-bold text-stone-400 dark:text-slate-500">Rp</span>
                      <Input
                        id="acc-bal"
                        inputMode="numeric"
                        placeholder="0"
                        value={rawBalance ? Number(rawBalance).toLocaleString("id-ID") : ""}
                        onChange={handleBalanceChange}
                        className="border-0 shadow-none focus-visible:ring-0 text-right font-black text-lg h-9 text-[#18181B] dark:text-slate-100 tabular-nums bg-transparent pr-2 placeholder:text-stone-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    {errors.initialBalance && (
                      <p className="text-[11px] text-[#E85024] font-medium">{errors.initialBalance.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-sm font-bold rounded-full cursor-pointer text-white bg-[#E85024] hover:bg-[#d44319] shadow-sm transition-all active:scale-[0.99]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-1.5" /> Tambah Rekening</>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Preset Button ─────────────────────────────────────── */
function PresetButton({ preset, selected, onSelect }: { preset: BankPreset; selected: boolean; onSelect: () => void }) {
  const isImgLogo = preset.logo?.startsWith("/");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-all duration-150 select-none cursor-pointer min-h-[64px]",
        selected
          ? "border-[#1A1A1A] bg-[#1A1A1A] dark:border-slate-600 dark:bg-slate-700 text-white font-bold shadow-xs"
          : "border-stone-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300"
      )}
    >
      {isImgLogo ? (
        <div className={cn("h-5 flex items-center justify-center rounded-md p-0.5 w-9", selected ? "bg-white/95" : "bg-white/90 dark:bg-slate-900/90")}>
          <img src={preset.logo} alt={preset.name} className="h-full w-auto object-contain max-w-[38px]" />
        </div>
      ) : (
        <span className="text-base sm:text-lg leading-none">{preset.logo}</span>
      )}
      <span className={cn("text-[9px] font-semibold leading-tight tracking-tight truncate max-w-full", selected ? "text-white" : "text-[#18181B] dark:text-slate-200")}>
        {preset.name}
      </span>
    </button>
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
            <p className="text-xl sm:text-2xl font-bold mt-1 tracking-tight tabular-nums">
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
