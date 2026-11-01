"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, ArrowUpRight, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import type { TransactionRow } from "@/lib/supabase/types";
import { triggerHaptic } from "@/lib/haptics";

interface QuickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: TransactionRow[];
  onSelectTransaction?: (tx: TransactionRow) => void;
}

export function QuickSearchDialog({
  open,
  onOpenChange,
  transactions,
  onSelectTransaction,
}: QuickSearchDialogProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const filteredTransactions = useMemo(() => {
    if (!query.trim()) {
      return transactions.slice(0, 8); // Tampilkan 8 transaksi terbaru jika belum ada query
    }
    const q = query.toLowerCase().trim();
    return transactions.filter((tx) => {
      const nameMatch = tx.name?.toLowerCase().includes(q);
      const catMatch = tx.category?.toLowerCase().includes(q);
      const notesMatch = tx.notes?.toLowerCase().includes(q);
      const amountMatch = tx.amount.toString().includes(q);
      return nameMatch || catMatch || notesMatch || amountMatch;
    });
  }, [transactions, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-[28px] border border-black/[0.06] dark:border-slate-800 shadow-2xl">
        <DialogTitle className="sr-only">Cari Transaksi</DialogTitle>
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/[0.05] dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama, kategori, nominal transaksi..."
            autoFocus
            className="border-0 focus-visible:ring-0 text-sm md:text-base font-semibold p-0 h-auto bg-transparent text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 placeholder:font-normal"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono bg-stone-100 dark:bg-slate-800 text-stone-500 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Transaction Result List */}
        <div className="max-h-[360px] overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <span>{query ? `Hasil Pencarian (${filteredTransactions.length})` : "Transaksi Terbaru"}</span>
            <span className="text-[10px] font-normal normal-case">Klik untuk detail</span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-stone-500 dark:text-slate-400">
              <p className="text-sm font-semibold">Tidak ada transaksi ditemukan</p>
              <p className="text-xs mt-1 text-stone-400">Coba kata kunci lain atau periksa ejaan</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpense = tx.type === "expense";
              const isIncome = tx.type === "income";

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelectTransaction?.(tx);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group border border-transparent hover:border-black/[0.03] dark:hover:border-slate-700/60 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs font-bold",
                        isIncome
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : isExpense
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      )}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isExpense ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate group-hover:text-[#E85024] transition-colors">
                        {tx.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10.5px] text-stone-500 dark:text-slate-400 mt-0.5">
                        <span className="capitalize">{tx.category}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-black tabular-nums font-mono",
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isExpense
                          ? "text-[#18181B] dark:text-slate-100"
                          : "text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {isIncome ? "+" : isExpense ? "-" : ""}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
