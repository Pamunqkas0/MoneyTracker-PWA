"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Inbox, TrendingUp, TrendingDown, ArrowUpDown, ArrowRightLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { removeTransaction } from "@/app/actions";
import { AppPagination } from "@/components/ui/app-pagination";
import type { TransactionType } from "@/lib/types";
import type { TransactionRow, BankAccountRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

const PAGE_SIZE = 6;

export function RecentTransactions({
  transactions,
  bankAccounts,
  availableCategories,
}: {
  transactions: TransactionRow[];
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
}) {
  const BANK_MAP = useMemo(() => Object.fromEntries(bankAccounts.map((b) => [b.id, b])), [bankAccounts]);
  const [search, setSearch]     = useState("");
  const [typeFilter, setFilter] = useState<"all" | TransactionType>("all");
  const [page, setPage]         = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.name.toLowerCase().includes(search.toLowerCase()) ||
        (availableCategories.bySlug[tx.category]?.name.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (BANK_MAP[tx.bank_account_id]?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchType = typeFilter === "all" || tx.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter, transactions, BANK_MAP]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleFilter = (v: string) => { setFilter(v as "all" | TransactionType); setPage(1); };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await removeTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="shadow-sm border-[var(--card-border)]">
        {/* REKAYASA HEADER: Flex-col di mobile agar input lebar, flex-row di sm (desktop/tablet) */}
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm sm:text-base font-semibold text-[var(--foreground)] shrink-0">
              Transaksi Terbaru
            </CardTitle>

            {/* Filter Row: Mengambil w-full di mobile, max-w-xs di desktop */}
            <div className="flex items-center gap-2 w-full sm:max-w-xs sm:ml-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
                <Input
                  placeholder="Cari transaksi..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-9 text-xs w-full bg-[var(--muted)]/50 border-transparent focus-visible:ring-1 focus-visible:ring-[var(--ring)] rounded-xl"
                />
              </div>
              <Select value={typeFilter} onValueChange={handleFilter}>
                <SelectTrigger className="h-9 w-[105px] sm:w-[110px] text-xs shrink-0 bg-[var(--muted)]/50 border-transparent rounded-xl focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-1.5"><ArrowUpDown className="h-3 w-3" /> Semua</span>
                  </SelectItem>
                  <SelectItem value="income">
                    <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-emerald-500" /> Masuk</span>
                  </SelectItem>
                  <SelectItem value="expense">
                    <span className="flex items-center gap-1.5"><TrendingDown className="h-3 w-3 text-rose-500" /> Keluar</span>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <span className="flex items-center gap-1.5"><ArrowRightLeft className="h-3 w-3 text-teal-600" /> Transfer</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="min-h-[288px] flex flex-col justify-between">
            <div className="divide-y divide-[var(--card-border)]/30 space-y-0.5">
              <AnimatePresence mode="popLayout">
                {paginated.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 gap-2.5 text-[var(--muted-foreground)] text-center"
                  >
                    <Inbox className="h-9 w-9 opacity-25" />
                    <p className="text-xs font-medium">Tidak ada transaksi ditemukan</p>
                  </motion.div>
                ) : (
                  paginated.map((tx, i) => {
                    const catMeta = availableCategories.bySlug[tx.category] || {
                      name: tx.category,
                      emoji: "🏷️",
                      color: "#94a3b8",
                    };
                    const bank    = BANK_MAP[tx.bank_account_id];
                    const transferBank = tx.transfer_account_id ? BANK_MAP[tx.transfer_account_id] : null;

                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.15) }}
                        className="flex items-center justify-between gap-3 py-2.5 hover:bg-[var(--muted)]/30 px-1.5 -mx-1.5 rounded-xl transition-colors cursor-default"
                      >
                        {/* Kiri: Icon + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Category icon */}
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base shadow-sm border border-[var(--card-border)]/10"
                            style={{ backgroundColor: `${catMeta?.color ?? "#6366f1"}15` }}
                          >
                            {catMeta?.emoji ?? "💳"}
                          </div>

                          {/* Info Text */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs sm:text-sm font-semibold text-[var(--foreground)] leading-snug">
                              {tx.name}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)] mt-0.5 truncate font-medium">
                              {catMeta.name}
                              {bank ? ` • ${tx.type === "transfer" && transferBank ? `${bank.name} -> ${transferBank.name}` : bank.name}` : ""}
                              {` • ${formatDate(tx.date, "dd MMM")}`}
                            </p>
                          </div>
                        </div>

                        {/* Kanan: Amount + Delete Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-bold tabular-nums ${
                              tx.type === "income" ? "text-emerald-500" : tx.type === "transfer" ? "text-teal-600" : "text-rose-500"
                            }`}
                          >
                            {tx.type === "transfer" ? "" : tx.type === "income" ? "+" : "−"}
                            {tx.type === "transfer" ? <ArrowRightLeft className="mr-1 inline h-3.5 w-3.5" /> : null}
                            {formatCurrency(tx.amount, true)}
                          </span>
                          
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                            aria-label="Hapus transaksi"
                          >
                            {deletingId === tx.id ? (
                              <span className="block h-3.5 w-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 border-t border-[var(--card-border)]/60 pt-3">
                <AppPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  showSummary={true}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
