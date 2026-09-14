"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowRightLeft,
  Trash2,
  Download,
  Calendar,
  ArrowLeft,
  FilterX,
  SlidersHorizontal,
  X,
  CreditCard,
  PencilLine,
  Square,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { removeTransaction, deleteMultipleTransactions } from "@/app/actions";
import { EditTransactionDialog } from "@/components/dashboard/edit-transaction-dialog";
import { AnimatedEmoji } from "@/components/ui/animated-emoji";
import type { TransactionRow, BankAccountRow } from "@/lib/supabase/types";
import type { TransactionType } from "@/lib/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

const PAGE_SIZE = 10;

const MONTHS = [
  { value: 0, label: "Januari" },
  { value: 1, label: "Februari" },
  { value: 2, label: "Maret" },
  { value: 3, label: "April" },
  { value: 4, label: "Mei" },
  { value: 5, label: "Juni" },
  { value: 6, label: "Juli" },
  { value: 7, label: "Agustus" },
  { value: 8, label: "September" },
  { value: 9, label: "Oktober" },
  { value: 10, label: "November" },
  { value: 11, label: "Desember" },
];

const YEARS = [2024, 2025, 2026, 2027];

interface TransactionsClientProps {
  initialTransactions: TransactionRow[];
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
  currentMonth: number;
  currentYear: number;
}

export function TransactionsClient({
  initialTransactions,
  bankAccounts,
  availableCategories,
  currentMonth: initialMonth,
  currentYear: initialYear,
}: TransactionsClientProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);

  useEffect(() => {
    setCurrentMonth(initialMonth);
    setCurrentYear(initialYear);
  }, [initialMonth, initialYear]);

  const handlePeriodChange = (month: number, year: number) => {
    router.push(`/dashboard/transactions?month=${month}&year=${year}`);
  };

  const BANK_MAP = useMemo(() => {
    return Object.fromEntries(bankAccounts.map((b) => [b.id, b]));
  }, [bankAccounts]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleFilterChange = (setter: (v: any) => void, val: any) => {
    setter(val);
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...initialTransactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.name.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") result = result.filter((tx) => tx.type === typeFilter);
    if (categoryFilter !== "all") result = result.filter((tx) => tx.category === categoryFilter);
    if (bankFilter !== "all") result = result.filter((tx) => tx.bank_account_id === bankFilter);

    result.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date_asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount_desc") return b.amount - a.amount;
      if (sortBy === "amount_asc") return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [initialTransactions, search, typeFilter, categoryFilter, bankFilter, sortBy]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredAndSorted.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [filteredAndSorted]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    return filteredAndSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredAndSorted, page]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Hapus transaksi ini secara permanen?")) return;

    setDeletingId(id);
    try {
      const res = await removeTransaction(id);
      if (res && !res.success) alert(res.error || "Gagal menghapus");
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    if (!confirm(`Hapus ${selectedIds.size} transaksi terpilih secara permanen?`)) return;

    setIsBulkDeleting(true);
    try {
      const res = await deleteMultipleTransactions(Array.from(selectedIds));
      if (res && !res.success) {
        alert(res.error || "Gagal menghapus beberapa transaksi");
      } else {
        setSelectedIds(new Set());
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus massal.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredAndSorted.length === 0) return alert("Data kosong");
    const headers = ["Tanggal", "Nama Transaksi", "Jenis", "Kategori", "Rekening", "Nominal", "Catatan"];
    const rows = filteredAndSorted.map((tx) => [
      tx.date,
      `"${tx.name.replace(/"/g, '""')}"`,
      tx.type === "income" ? "Masuk" : "Keluar",
      availableCategories.bySlug[tx.category]?.name || tx.category,
      `"${(BANK_MAP[tx.bank_account_id]?.name || "Cash").replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_ArusKas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAllFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setBankFilter("all");
    setSortBy("date_desc");
    setPage(1);
  };

  const hasActiveFilters = search || typeFilter !== "all" || categoryFilter !== "all" || bankFilter !== "all" || sortBy !== "date_desc";

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#18181B] p-3 sm:p-5 md:p-6 lg:p-8 pb-32 lg:pb-12 flex justify-center items-start selection:bg-brand-orange/20">
      {/* ── Outer Shell Canvas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-7xl rounded-[24px] sm:rounded-[32px] md:rounded-[36px] bg-white/95 backdrop-blur-sm border border-black/[0.04] p-3.5 sm:p-6 md:p-8 lg:p-10 shadow-xs flex flex-col gap-5 sm:gap-6"
      >
        {/* ── 1. HEADER SECTION & PERIOD CONTROLS ── */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Title & Back Button */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] truncate">
                  Transactions
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-stone-500 mt-0.5 font-medium truncate">
                  {filteredAndSorted.length} catatan transaksi terekam
                </p>
              </div>
            </div>

            {/* Period Selector & Export Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Month Selector */}
              <div className="flex-1 sm:flex-initial sm:min-w-[120px]">
                <Select
                  value={String(currentMonth)}
                  onValueChange={(val) => handlePeriodChange(Number(val), currentYear)}
                >
                  <SelectTrigger className="w-full rounded-full border border-black/[0.04] bg-surface-muted/80 px-3 sm:px-4 text-xs font-semibold text-[#18181B] h-9 sm:h-10 hover:bg-surface-muted transition-all">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-stone-500 shrink-0" />
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-stone-200 shadow-xl max-h-[240px]">
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)} className="text-xs font-medium rounded-xl cursor-pointer">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selector */}
              <div className="flex-1 sm:flex-initial sm:min-w-[90px]">
                <Select
                  value={String(currentYear)}
                  onValueChange={(val) => handlePeriodChange(currentMonth, Number(val))}
                >
                  <SelectTrigger className="w-full rounded-full border border-black/[0.04] bg-surface-muted/80 px-3 sm:px-4 text-xs font-semibold text-[#18181B] h-9 sm:h-10 hover:bg-surface-muted transition-all">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-stone-200 shadow-xl">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs font-medium rounded-xl cursor-pointer">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button
                onClick={handleExportCSV}
                variant="ghost"
                size="sm"
                className="h-9 sm:h-10 rounded-full gap-1 sm:gap-1.5 font-bold bg-surface-muted/80 hover:bg-surface-muted border border-black/[0.04] shadow-2xs text-xs px-3 sm:px-4 text-stone-700 cursor-pointer shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-[#E85024]" />
                <span className="hidden xs:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* ── 2. QUICK SUMMARY BENTO CARDS (3 Mini Cards Grid) ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            {/* Total Income Card */}
            <div className="rounded-2xl bg-surface-muted/50 border border-black/[0.03] p-2.5 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3.5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 min-w-0">
              <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#D8F5A2] text-stone-900 shadow-2xs">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-800 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate">Income</p>
                <p className="text-xs xs:text-sm sm:text-lg lg:text-xl font-black text-emerald-600 tracking-tight tabular-nums truncate mt-0.5">
                  {formatCurrency(stats.income, true)}
                </p>
              </div>
            </div>

            {/* Total Expense Card */}
            <div className="rounded-2xl bg-surface-muted/50 border border-black/[0.03] p-2.5 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3.5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 min-w-0">
              <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#FDD5C1] text-[#E85024] shadow-2xs">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-[#E85024] stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate">Expense</p>
                <p className="text-xs xs:text-sm sm:text-lg lg:text-xl font-black text-[#18181B] tracking-tight tabular-nums truncate mt-0.5">
                  {formatCurrency(stats.expense, true)}
                </p>
              </div>
            </div>

            {/* Net Balance Card */}
            <div className="rounded-2xl bg-surface-muted/50 border border-black/[0.03] p-2.5 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3.5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 min-w-0">
              <div className={cn(
                "flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl shadow-2xs",
                stats.net >= 0 ? "bg-[#DAEFEA] text-teal-800" : "bg-[#FAD170] text-stone-900"
              )}>
                <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate">Net</p>
                <p className={cn(
                  "text-xs xs:text-sm sm:text-lg lg:text-xl font-black tracking-tight tabular-nums truncate mt-0.5",
                  stats.net >= 0 ? "text-emerald-700" : "text-[#E85024]"
                )}>
                  {stats.net > 0 ? "+" : ""}{formatCurrency(stats.net, true)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. SEARCH & CATEGORY PILL FILTER BAR ── */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Top Search & Filter Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Cari transaksi berdasarkan nama atau catatan..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-10 sm:pl-11 pr-4 bg-surface-muted/60 border border-stone-200/50 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:bg-white h-10 sm:h-11 text-xs sm:text-sm rounded-full w-full font-medium transition-all"
              />
            </div>

            {/* Mobile Filter Trigger Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "lg:hidden h-10 sm:h-11 px-3 sm:px-4 rounded-full gap-1.5 text-xs font-bold shrink-0 shadow-2xs bg-surface-muted/80 border-stone-200/60 cursor-pointer",
                hasActiveFilters && "border-[#E85024] bg-[#FDD5C1]/30 text-[#E85024]"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="text-xs">Filter</span>
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#E85024]" />
              )}
            </Button>
          </div>

          {/* Desktop Filter Row (Type Pills + Selectors) */}
          <div className="hidden lg:flex items-center justify-between gap-3 pt-1">
            {/* Transaction Type Segmented Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-surface-muted/80 p-1 border border-black/[0.03]">
              {[
                { id: "all" as const, label: "Semua" },
                { id: "expense" as const, label: "Pengeluaran" },
                { id: "income" as const, label: "Pemasukan" },
                { id: "transfer" as const, label: "Transfer" },
              ].map((tab) => {
                const isActive = typeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterChange(setTypeFilter, tab.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#1A1A1A] text-white shadow-xs"
                        : "text-stone-500 hover:text-stone-800"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Select Dropdowns: Category, Bank, Sort */}
            <div className="flex items-center gap-2">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}>
                <SelectTrigger className="h-9 bg-surface-muted/70 border border-stone-200/50 rounded-full text-xs font-medium px-3.5 min-w-[140px] cursor-pointer">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200">
                  <SelectItem value="all" className="rounded-xl">Semua Kategori</SelectItem>
                  {Object.values(availableCategories.bySlug).map((category) => (
                    <SelectItem key={`${category.type}-${category.slug}`} value={category.slug} className="rounded-xl">
                      <span className="flex items-center gap-2">
                        <AnimatedEmoji emoji={category.emoji} size={14} />
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bank Filter */}
              <Select value={bankFilter} onValueChange={(v) => handleFilterChange(setBankFilter, v)}>
                <SelectTrigger className="h-9 bg-surface-muted/70 border border-stone-200/50 rounded-full text-xs font-medium px-3.5 min-w-[140px] cursor-pointer">
                  <SelectValue placeholder="Semua Rekening" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200">
                  <SelectItem value="all" className="rounded-xl">Semua Rekening</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className="rounded-xl">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-stone-400" />
                        <span>{account.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-9 bg-surface-muted/70 border border-stone-200/50 rounded-full text-xs font-medium px-3.5 min-w-[130px] cursor-pointer">
                  <SelectValue placeholder="Urutan Tanggal" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200">
                  <SelectItem value="date_desc" className="rounded-xl">Terbaru</SelectItem>
                  <SelectItem value="date_asc" className="rounded-xl">Terlama</SelectItem>
                  <SelectItem value="amount_desc" className="rounded-xl">Nominal Terbesar</SelectItem>
                  <SelectItem value="amount_asc" className="rounded-xl">Nominal Terkecil</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  onClick={resetAllFilters}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-full text-xs font-bold text-[#E85024] hover:bg-rose-50 cursor-pointer gap-1"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap scrollbar-none py-1 -mx-1 px-1">
            <button
              onClick={() => handleFilterChange(setCategoryFilter, "all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0",
                categoryFilter === "all"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-surface-muted/70 text-stone-600 hover:bg-surface-muted hover:text-stone-900 border border-black/[0.02]"
              )}
            >
              Semua
            </button>
            {Object.values(availableCategories.bySlug).map((cat) => {
              const isSelected = categoryFilter === cat.slug;
              return (
                <button
                  key={`${cat.type}-${cat.slug}`}
                  onClick={() => handleFilterChange(setCategoryFilter, cat.slug)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0",
                    isSelected
                      ? "bg-[#1A1A1A] text-white shadow-xs"
                      : "bg-surface-muted/70 text-stone-600 hover:bg-surface-muted hover:text-stone-900 border border-black/[0.02]"
                  )}
                >
                  <AnimatedEmoji emoji={cat.emoji} size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. TRANSACTION LIST / BENTO CARDS ── */}
        <div className="min-h-[420px] flex flex-col justify-between pt-1">
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {paginatedTransactions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-3 bg-surface-muted/30 border border-black/[0.03] rounded-3xl text-center px-4"
                >
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                    <FilterX className="h-6 w-6 opacity-60" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#18181B]">Transaksi Tidak Ditemukan</p>
                    <p className="text-xs text-stone-500 mt-0.5 max-w-sm">Sesuaikan filter atau ubah kata kunci pencarian Anda untuk menampilkan data transaksi.</p>
                  </div>
                </motion.div>
              ) : (
                paginatedTransactions.map((tx, i) => {
                  const catMeta = availableCategories.bySlug[tx.category] || {
                    name: tx.category,
                    emoji: "🏷️",
                    color: "#94a3b8",
                  };
                  const bank = BANK_MAP[tx.bank_account_id];
                  const transferBank = tx.transfer_account_id ? BANK_MAP[tx.transfer_account_id] : null;

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.12) }}
                      className={cn(
                        "group bg-white rounded-2xl md:rounded-3xl p-3.5 sm:p-4 border border-black/[0.03] shadow-xs flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200",
                        selectedIds.has(tx.id) && "ring-2 ring-[#E85024] bg-[#FDD5C1]/10"
                      )}
                    >
                      {/* ── SISI KIRI: [Checkbox] + [Squircle Icon] + [Vertical Stack: Judul & Nominal] ── */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox Selector */}
                        <button
                          type="button"
                          onClick={() => toggleSelection(tx.id)}
                          className="text-stone-400 hover:text-[#E85024] shrink-0 cursor-pointer p-0.5"
                          aria-label="Pilih transaksi"
                        >
                          {selectedIds.has(tx.id) ? (
                            <CheckSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#E85024]" />
                          ) : (
                            <Square className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                          )}
                        </button>

                        {/* Squircle Icon Kategori */}
                        <div
                          className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-2xs border border-black/[0.03]",
                            tx.type === "income"
                              ? "bg-[#D8F5A2]/60"
                              : tx.type === "transfer"
                              ? "bg-[#DAEFEA]/60"
                              : "bg-[#FDD5C1]/60"
                          )}
                        >
                          <AnimatedEmoji emoji={catMeta.emoji} size={20} />
                        </div>

                        {/* Info Transaksi (Vertical Stack) */}
                        <div className="min-w-0 flex-1">
                          {/* Baris 1: Judul Transaksi */}
                          <h3 className="truncate text-xs sm:text-sm font-bold text-[#18181B] leading-tight" title={tx.name}>
                            {tx.name}
                          </h3>

                          {/* Baris 2: Nominal Saldo */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={cn(
                                "font-extrabold text-xs sm:text-sm tabular-nums tracking-tight",
                                tx.type === "income"
                                  ? "text-emerald-600"
                                  : tx.type === "transfer"
                                  ? "text-stone-700"
                                  : "text-[#18181B]"
                              )}
                            >
                              {tx.type === "transfer" ? <ArrowRightLeft className="inline-block h-3 w-3 mr-0.5 text-stone-500" /> : null}
                              {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}
                              {formatCurrency(tx.amount, true)}
                            </span>

                            {/* Rekening / Category Subtitle */}
                            <span className="hidden xs:inline-block text-[10px] text-stone-400 font-medium truncate">
                              &bull; {tx.type === "transfer" && transferBank && bank ? `${bank.name} → ${transferBank.name}` : (bank?.name || catMeta.name)}
                            </span>
                          </div>

                          {/* Note if available */}
                          {tx.notes && (
                            <p className="text-[10px] text-stone-500 mt-1 bg-surface-muted/60 px-2 py-0.5 rounded-lg border border-black/[0.02] italic truncate max-w-xs sm:max-w-md">
                              {tx.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── SISI KANAN: [Tanggal, Waktu / Rekening] + [Aksi Cepat] ── */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Tanggal & Jam (2 Baris Teks Abu-abu Rapi) */}
                        <div className="text-right flex flex-col items-end justify-center">
                          <span className="text-[11px] font-semibold text-stone-500 tabular-nums">
                            {formatDate(tx.date, "dd/MM/yyyy")}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {tx.created_at ? formatDate(tx.created_at, "'at' HH:mm") : (bank?.name || "at 12:00")}
                          </span>
                        </div>

                        {/* Aksi Cepat (Tombol Bulat Halus) */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {tx.type !== "transfer" && (
                            <button
                              type="button"
                              onClick={() => setEditingTransaction(tx)}
                              className="p-1.5 sm:p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all cursor-pointer"
                              aria-label="Edit transaksi"
                              title="Edit"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 sm:p-2 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            aria-label="Hapus transaksi"
                            title="Hapus"
                          >
                            {deletingId === tx.id ? (
                              <span className="block h-3.5 w-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* ── PAGINATION CONTROLS ── */}
          {totalPages > 1 && (
            <div className="flex flex-col xs:flex-row gap-3 items-center justify-between border-t border-stone-100 pt-5 mt-4">
              <p className="text-[11px] sm:text-xs font-medium text-stone-500 text-center xs:text-left order-2 xs:order-1">
                Total {filteredAndSorted.length} data &bull; Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center justify-between xs:justify-end w-full xs:w-auto gap-1.5 order-1 xs:order-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 rounded-full border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-3 text-[#18181B]">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-9 w-9 rounded-full border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── BULK ACTION BAR ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1A1A]/95 backdrop-blur-md text-white border border-white/10 rounded-full px-5 py-3 flex items-center gap-4 shadow-2xl min-w-[320px]"
          >
            <div className="flex-1 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E85024] text-white text-xs font-bold">
                {selectedIds.size}
              </span>
              <span className="text-xs font-bold text-white">Item Terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-stone-400 hover:text-white rounded-full h-8 px-3 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1.5 rounded-full h-8 px-4 shadow-sm cursor-pointer"
              >
                {isBulkDeleting ? (
                  <span className="block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Hapus
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE FILTER BOTTOM SHEET DRAWER ── */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/[0.04] rounded-t-[32px] px-6 pt-4 pb-8 max-h-[85vh] overflow-y-auto lg:hidden flex flex-col gap-4 shadow-2xl"
            >
              <div className="h-1.5 w-12 bg-stone-200 rounded-full mx-auto mb-1 shrink-0" onClick={() => setIsFilterDrawerOpen(false)} />

              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base font-bold text-[#18181B]">Filter Transaksi</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500">Jenis Transaksi</label>
                  <Select value={typeFilter} onValueChange={(v) => handleFilterChange(setTypeFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 border-stone-200/50 rounded-2xl text-xs font-medium">
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200">
                      <SelectItem value="all" className="rounded-xl">Semua Jenis</SelectItem>
                      <SelectItem value="income" className="rounded-xl">Pemasukan (+)</SelectItem>
                      <SelectItem value="expense" className="rounded-xl">Pengeluaran (-)</SelectItem>
                      <SelectItem value="transfer" className="rounded-xl">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500">Kategori</label>
                  <Select value={categoryFilter} onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 border-stone-200/50 rounded-2xl text-xs font-medium">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200">
                      <SelectItem value="all" className="rounded-xl">Semua Kategori</SelectItem>
                      {Object.values(availableCategories.bySlug).map((category) => (
                        <SelectItem key={`${category.type}-${category.slug}`} value={category.slug} className="rounded-xl">
                          <span className="flex items-center gap-2">
                            <AnimatedEmoji emoji={category.emoji} size={14} />
                            <span>{category.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500">Rekening</label>
                  <Select value={bankFilter} onValueChange={(v) => handleFilterChange(setBankFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 border-stone-200/50 rounded-2xl text-xs font-medium">
                      <SelectValue placeholder="Pilih Rekening" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200">
                      <SelectItem value="all" className="rounded-xl">Semua Rekening</SelectItem>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="rounded-xl">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-stone-400" />
                            <span>{account.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500">Urutan Tanggal / Nominal</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 border-stone-200/50 rounded-2xl text-xs font-medium">
                      <SelectValue placeholder="Urutan Tanggal" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200">
                      <SelectItem value="date_desc" className="rounded-xl">Terbaru</SelectItem>
                      <SelectItem value="date_asc" className="rounded-xl">Terlama</SelectItem>
                      <SelectItem value="amount_desc" className="rounded-xl">Nominal Terbesar</SelectItem>
                      <SelectItem value="amount_asc" className="rounded-xl">Nominal Terkecil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Drawer Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-1">
                <Button
                  variant="ghost"
                  onClick={resetAllFilters}
                  className="h-12 rounded-full text-xs font-bold gap-1 text-[#E85024] bg-rose-50 hover:bg-rose-100 cursor-pointer"
                >
                  <FilterX className="h-3.5 w-3.5" /> Reset
                </Button>
                <Button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="h-12 rounded-full text-xs font-bold text-white bg-[#E85024] hover:bg-[#d44319] cursor-pointer shadow-sm"
                >
                  Terapkan Filter
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EditTransactionDialog
        open={editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />
    </div>
  );
}

