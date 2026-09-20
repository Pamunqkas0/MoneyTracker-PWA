"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  X,
  Sparkles,
  Check,
  Briefcase,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_IDX_STOCKS } from "@/lib/stocks";
import { upsertStockHolding } from "@/app/actions";
import type { StockHoldingRow } from "@/lib/supabase/types";

interface StockHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding?: StockHoldingRow | null;
  onSuccess?: () => void;
}

export function StockHoldingDialog({
  open,
  onOpenChange,
  holding,
  onSuccess,
}: StockHoldingDialogProps) {
  const [symbol, setSymbol] = useState("BBCA");
  const [companyName, setCompanyName] = useState("Bank Central Asia");
  const [lots, setLots] = useState("1"); // 1 Lot = 100 lembar
  const [avgBuyPrice, setAvgBuyPrice] = useState("10000");
  const [currentPrice, setCurrentPrice] = useState("10125");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (holding) {
      setSymbol(holding.symbol);
      setCompanyName(holding.company_name);
      setLots(String(Math.max(1, Math.round(holding.shares_count / 100))));
      setAvgBuyPrice(String(holding.avg_buy_price));
      setCurrentPrice(String(holding.current_price || holding.avg_buy_price));
      setNotes(holding.notes || "");
    } else {
      setSymbol("BBCA");
      setCompanyName("Bank Central Asia");
      setLots("1");
      setAvgBuyPrice("10000");
      setCurrentPrice("10125");
      setNotes("");
    }
    setErrorMsg("");
    setIsSuccess(false);
  }, [holding, open]);

  const handleSelectPresetStock = (preset: typeof DEFAULT_IDX_STOCKS[0]) => {
    setSymbol(preset.symbol);
    setCompanyName(preset.name);
    setCurrentPrice(String(preset.defaultPrice));
    if (!holding) {
      setAvgBuyPrice(String(preset.defaultPrice));
    }
  };

  const handleQuickAddLot = (val: number) => {
    const current = Number(lots) || 0;
    const updated = Math.max(1, current + val);
    setLots(String(updated));
  };

  const totalShares = (Number(lots) || 0) * 100;
  const totalInvestment = totalShares * (Number(avgBuyPrice) || 0);
  const currentValue = totalShares * (Number(currentPrice) || Number(avgBuyPrice) || 0);
  const unrealizedPL = currentValue - totalInvestment;
  const unrealizedPLPct = totalInvestment > 0 ? (unrealizedPL / totalInvestment) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setErrorMsg("Kode saham wajib diisi");
      return;
    }
    if (Number(lots) <= 0) {
      setErrorMsg("Jumlah lot harus lebih dari 0");
      return;
    }
    if (Number(avgBuyPrice) <= 0) {
      setErrorMsg("Harga beli rata-rata harus lebih dari 0");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await upsertStockHolding({
        id: holding?.id,
        symbol: symbol.toUpperCase().trim(),
        company_name: companyName.trim() || symbol.toUpperCase().trim(),
        shares_count: totalShares,
        avg_buy_price: Number(avgBuyPrice),
        current_price: Number(currentPrice) || Number(avgBuyPrice),
        notes: notes.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan data saham");
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      setIsLoading(false);
      setIsSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 1400);
    } catch {
      setErrorMsg("Terjadi kesalahan sistem. Coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="p-0 overflow-hidden flex flex-col max-h-[90svh] sm:max-h-[86vh] h-auto rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-black/[0.04] dark:border-slate-800 shadow-2xl max-w-lg w-full text-stone-900 dark:text-slate-100"
      >
        {/* Dynamic Header (Identik dengan Tambah Transaksi) */}
        <div className="p-5 sm:p-6 pb-3 shrink-0">
          {/* Grab Handle Bar (Atas - khusus mobile) */}
          <div className="w-12 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#003B70] text-white flex items-center justify-center text-xs font-black shadow-2xs shrink-0 tracking-tight">
                IDX
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-[#18181B] dark:text-slate-100 tracking-tight">
                  {holding ? "Edit Catatan Saham" : "Catat Saham Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Pantau portofolio saham Stockbit Anda
                </DialogDescription>
              </div>
            </div>

            {/* Tombol Tutup Bulat */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 transition-all cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-2 space-y-4 custom-scrollbar">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {isSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>Saham berhasil disimpan ke Portofolio!</span>
              </div>
            )}

            {/* 1. Hero Bento Card: Total Investasi & Live Floating Profit/Loss */}
            <div className="bg-[#FAF8F5] dark:bg-slate-800/50 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-2xs flex flex-col gap-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                  Estimasi Nilai Pasar
                </span>
                <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl shadow-2xs font-extrabold text-[11px] sm:text-xs text-stone-600 dark:text-slate-300 border border-black/[0.02] dark:border-slate-700">
                  IDR (Rp)
                </span>
              </div>

              {/* Angka Hero Besar */}
              <div className="flex items-baseline justify-end gap-2 py-1 min-h-[50px]">
                <span className="text-2xl sm:text-3xl font-black text-stone-300 dark:text-slate-600 select-none pb-0.5">
                  Rp
                </span>
                <span
                  className={cn(
                    "font-black text-[#18181B] dark:text-slate-100 tracking-tight tabular-nums text-right",
                    String(currentValue).length > 10
                      ? "text-2xl sm:text-3xl"
                      : String(currentValue).length > 7
                        ? "text-3xl sm:text-4xl"
                        : "text-4xl sm:text-5xl"
                  )}
                >
                  {currentValue.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Floating Gain/Loss Pill & Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.03] dark:border-slate-700/60 text-xs">
                <span className="text-stone-500 dark:text-slate-400 font-semibold">
                  Modal: {formatCurrency(totalInvestment, true)}
                </span>
                <span
                  className={cn(
                    "font-black px-2.5 py-0.5 rounded-full text-[11px] tabular-nums",
                    unrealizedPL >= 0
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300"
                  )}
                >
                  {unrealizedPL >= 0 ? "+" : ""}
                  {formatCurrency(unrealizedPL, true)} ({unrealizedPLPct >= 0 ? "+" : ""}
                  {unrealizedPLPct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* 2. Pilihan Saham Populer (Tactile Preset Chips) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider block">
                Pilih Saham Populer (IDX)
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                {DEFAULT_IDX_STOCKS.map((stk) => {
                  const isSelected = symbol.toUpperCase() === stk.symbol;
                  return (
                    <button
                      key={stk.symbol}
                      type="button"
                      onClick={() => handleSelectPresetStock(stk)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all border cursor-pointer select-none",
                        isSelected
                          ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs scale-105"
                          : "bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-black/[0.04] dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 shadow-2xs"
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stk.color }}
                      />
                      <span>{stk.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ticker & Nama Perusahaan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 dark:text-slate-400">
                  Kode Saham (Ticker)
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Mis. BBCA"
                  maxLength={6}
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-sm font-black uppercase text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E85024]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 dark:text-slate-400">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mis. Bank Central Asia"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-sm font-semibold text-[#18181B] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E85024]"
                />
              </div>
            </div>

            {/* 4. Jumlah Lot (dengan Quick Chips) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-600 dark:text-slate-400">
                  Jumlah Lot
                </label>
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400">
                  = {totalShares.toLocaleString("id-ID")} Lembar
                </span>
              </div>
              <input
                type="number"
                min={1}
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-sm font-black text-[#18181B] dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E85024]"
              />
              {/* Lot Quick Chips */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: "+1 Lot", val: 1 },
                  { label: "+5 Lot", val: 5 },
                  { label: "+10 Lot", val: 10 },
                  { label: "+50 Lot", val: 50 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleQuickAddLot(chip.val)}
                    className="bg-white dark:bg-slate-800 hover:bg-[#FAD170]/40 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold text-[11px] px-3 py-1.5 rounded-full border border-black/[0.03] dark:border-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Avg Buy Price & Live Current Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 dark:text-slate-400">
                  Avg Price (Rp/Lembar)
                </label>
                <input
                  type="number"
                  min={1}
                  value={avgBuyPrice}
                  onChange={(e) => setAvgBuyPrice(e.target.value)}
                  placeholder="Harga beli Stockbit"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-sm font-black text-[#18181B] dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E85024]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-600 dark:text-slate-400 truncate">
                    Harga Terkini (Rp)
                  </label>
                  <span className="text-[9px] font-bold text-[#E85024] shrink-0">Live Sync</span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="Harga pasar"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-sm font-black text-[#18181B] dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E85024]"
                />
              </div>
            </div>

            {/* 6. Catatan (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-slate-400">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mis. Portofolio Dividen / Stockbit Akun 1"
                className="w-full h-11 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-black/[0.06] dark:border-slate-700 text-xs font-medium text-[#18181B] dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Fixed Pinned Footer Button (Identik dengan Tambah Transaksi) */}
          <div className="p-4 sm:p-6 pt-3 pb-5 sm:pb-6 shrink-0 bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white font-extrabold py-3.5 sm:py-4 text-sm sm:text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Portofolio…</span>
                </>
              ) : (
                <>
                  <span>{holding ? "Simpan Perubahan Saham" : "Tambahkan ke Portofolio"}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
