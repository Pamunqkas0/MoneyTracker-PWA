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
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  User,
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

const PASTEL_COLORS = [
  { bg: "bg-[#FAD170]/70 dark:bg-amber-950/60", border: "border-[#FAD170]", bar: "bg-[#FAD170]", text: "text-amber-900 dark:text-amber-200" },
  { bg: "bg-[#D8F5A2]/70 dark:bg-emerald-950/60", border: "border-[#D8F5A2]", bar: "bg-[#8ce99a]", text: "text-emerald-900 dark:text-emerald-200" },
  { bg: "bg-[#FDD5C1]/70 dark:bg-rose-950/60", border: "border-[#FDD5C1]", bar: "bg-[#FFA8A8]", text: "text-rose-900 dark:text-rose-200" },
  { bg: "bg-[#E0E6FD]/70 dark:bg-indigo-950/60", border: "border-[#E0E6FD]", bar: "bg-[#91A7FF]", text: "text-indigo-900 dark:text-indigo-200" },
];

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

  const savingsRate = useMemo(() => {
    if (stats.income <= 0) return 0;
    return Math.max(0, Math.round((stats.net / stats.income) * 100));
  }, [stats]);

  // Top 4 Expense Categories for "Current Spend Rate"
  const topExpenseCategories = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    let totalExp = 0;

    filteredAndSorted.forEach((tx) => {
      if (tx.type === "expense") {
        expenseMap[tx.category] = (expenseMap[tx.category] || 0) + tx.amount;
        totalExp += tx.amount;
      }
    });

    const sorted = Object.entries(expenseMap)
      .map(([slug, amount]) => ({
        slug,
        amount,
        percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
        meta: availableCategories.bySlug[slug] || {
          name: slug,
          emoji: "🏷️",
          color: "#E85024",
        },
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { sorted, totalExp };
  }, [filteredAndSorted, availableCategories]);

  // Sparkline Chart points generator based on monthly daily cashflow
  const sparklineData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyTotals = Array.from({ length: Math.min(daysInMonth, 14) }, () => 0);

    filteredAndSorted.forEach((tx) => {
      const day = new Date(tx.date).getDate();
      const index = Math.min(dailyTotals.length - 1, Math.floor((day / daysInMonth) * dailyTotals.length));
      if (typeFilter === "income") {
        if (tx.type === "income") dailyTotals[index] += tx.amount;
      } else if (typeFilter === "expense") {
        if (tx.type === "expense") dailyTotals[index] += tx.amount;
      } else {
        dailyTotals[index] += tx.amount;
      }
    });

    const maxVal = Math.max(...dailyTotals, 1);
    const width = 500;
    const height = 110;
    const stepX = width / (dailyTotals.length - 1);

    const points = dailyTotals.map((val, idx) => {
      const x = idx * stepX;
      const normalized = val / maxVal;
      const y = height - normalized * (height - 24) - 12;
      return { x, y, val };
    });

    // Create bezier curve SVG path
    if (points.length < 2) return { path: "", area: "", points: [] };

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const area = `${d} L ${points[points.length - 1].x} ${height + 20} L ${points[0].x} ${height + 20} Z`;

    return { path: d, area, points };
  }, [filteredAndSorted, currentMonth, currentYear, typeFilter]);

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
      tx.type === "income" ? "Masuk" : tx.type === "transfer" ? "Transfer" : "Keluar",
      availableCategories.bySlug[tx.category]?.name || tx.category,
      `"${(BANK_MAP[tx.bank_account_id]?.name || "Cash").replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
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
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0b0f1a] text-[#18181B] dark:text-[#f1f5f9] px-3 pb-3 pt-0 sm:p-5 md:p-6 lg:p-8 flex justify-center items-start selection:bg-brand-orange/20">
      {/* ── Outer Shell Canvas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl rounded-[32px] sm:rounded-[36px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-black/[0.04] dark:border-slate-800 p-5 sm:p-7 md:p-8 shadow-xs flex flex-col gap-6"
      >
        {/* ── 1. TOP HEADER MOBILE (☰ vs Hello, Fred vs 👤) ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-black/[0.06] dark:border-slate-700 shadow-xs flex items-center justify-center text-stone-800 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            aria-label="Kembali ke Dashboard"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </Link>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100 leading-tight">
              Hello, Fred
            </h1>
            <span className="text-xs text-stone-400 dark:text-slate-400 font-medium leading-tight">
              @freddoe12
            </span>
          </div>

          <Link
            href="/dashboard/profile"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-black/[0.06] dark:border-slate-700 shadow-xs flex items-center justify-center text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            aria-label="Profil Pengguna"
          >
            <User className="w-5 h-5 stroke-[2.2]" />
          </Link>
        </div>

        {/* ── 2. TRANSACTIONS TITLE & CONTROLS (MONTH/YEAR/EXPORT) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B] dark:text-slate-100 tracking-tight">
              Transactions
            </h2>
            <span className="bg-[#D8F5A2] dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
              {filteredAndSorted.length} Catatan
            </span>
          </div>

          {/* Month, Year, Export */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Month Selector */}
            <div className="flex-1 sm:flex-initial sm:w-32">
              <Select
                value={String(currentMonth)}
                onValueChange={(val) => handlePeriodChange(Number(val), currentYear)}
              >
                <SelectTrigger className="w-full rounded-full border border-black/[0.05] dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-bold text-[#18181B] dark:text-slate-200 h-10 hover:bg-stone-50 dark:hover:bg-slate-700 shadow-2xs transition-all">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-stone-400 dark:text-slate-400 shrink-0" />
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl max-h-[260px]">
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs font-semibold rounded-xl cursor-pointer">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div className="w-24">
              <Select
                value={String(currentYear)}
                onValueChange={(val) => handlePeriodChange(currentMonth, Number(val))}
              >
                <SelectTrigger className="w-full rounded-full border border-black/[0.05] dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-bold text-[#18181B] dark:text-slate-200 h-10 hover:bg-stone-50 dark:hover:bg-slate-700 shadow-2xs transition-all">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs font-semibold rounded-xl cursor-pointer">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export CSV Button */}
            <Button
              onClick={handleExportCSV}
              variant="ghost"
              size="sm"
              className="h-10 rounded-full gap-1.5 font-bold bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 border border-black/[0.05] dark:border-slate-700 shadow-2xs text-xs px-3.5 text-stone-700 dark:text-slate-200 cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-[#E85024]" />
              <span className="hidden xs:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* ── 2. HERO INTERAKTIF: BENTO CASHFLOW & MINI SPARKLINE CHART ── */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE4] dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 border border-black/[0.05] dark:border-slate-800 p-4 sm:p-6 md:p-7 shadow-xs overflow-hidden">
          {/* Decorative background blur glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FAD170]/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#E85024]/10 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
            {/* Top Bar: Net Cashflow Title & Interactive Filter Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#E85024]" />
                  <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
                    Net Cashflow Bulanan
                  </p>
                </div>
                <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black text-[#18181B] dark:text-slate-100 tracking-tight tabular-nums">
                    {stats.net >= 0 ? "+" : ""}{formatCurrency(stats.net, true)}
                  </p>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs",
                    stats.net >= 0
                      ? "bg-[#D8F5A2] text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-[#FDD5C1] text-rose-900 dark:bg-rose-950/80 dark:text-rose-300"
                  )}>
                    {stats.net >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {savingsRate}% Ratio
                  </span>
                </div>
              </div>

              {/* Interactive Type Filter Switcher Pill (Grid on Mobile, Flex on Desktop) */}
              <div className="w-full sm:w-auto grid grid-cols-4 sm:flex items-center gap-1 rounded-full bg-stone-200/60 dark:bg-slate-800 p-1 border border-black/[0.04] dark:border-slate-700/60">
                {[
                  { id: "all" as const, label: "Semua" },
                  { id: "income" as const, label: "Masuk" },
                  { id: "expense" as const, label: "Keluar" },
                  { id: "transfer" as const, label: "Transfer" },
                ].map((tab) => {
                  const isActive = typeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleFilterChange(setTypeFilter, tab.id)}
                      className={cn(
                        "w-full sm:w-auto px-1.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none text-center truncate",
                        isActive
                          ? "bg-[#E85024] text-white shadow-xs"
                          : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coral Sparkline Graph Area */}
            <div className="w-full h-20 sm:h-28 relative my-0.5">
              <svg
                viewBox="0 0 500 110"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="coralAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E85024" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#E85024" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#E85024" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {sparklineData.area && (
                  <path d={sparklineData.area} fill="url(#coralAreaGrad)" />
                )}
                {sparklineData.path && (
                  <path
                    d={sparklineData.path}
                    fill="none"
                    stroke="#E85024"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  />
                )}
                {sparklineData.points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill="#FFFFFF"
                    stroke="#E85024"
                    strokeWidth="2.5"
                    className="transition-all hover:r-5 cursor-pointer"
                  />
                ))}
              </svg>
            </div>

            {/* 3 Quick Stat Pills (Income, Expense, Net Ratio) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5 border-t border-black/[0.04] dark:border-slate-800/80">
              <div className="bg-[#D8F5A2] dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-extrabold px-3 py-2 rounded-2xl sm:rounded-full text-xs flex items-center justify-between sm:justify-center gap-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Masuk:</span>
                </div>
                <span className="font-black tabular-nums">{formatCurrency(stats.income, true)}</span>
              </div>
              <div className="bg-[#FDD5C1] dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 font-extrabold px-3 py-2 rounded-2xl sm:rounded-full text-xs flex items-center justify-between sm:justify-center gap-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Keluar:</span>
                </div>
                <span className="font-black tabular-nums">{formatCurrency(stats.expense, true)}</span>
              </div>
              <div className="bg-[#E0E6FD] dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 font-extrabold px-3 py-2 rounded-2xl sm:rounded-full text-xs flex items-center justify-between sm:justify-center gap-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Selisih:</span>
                </div>
                <span className="font-black tabular-nums">{stats.net >= 0 ? "+" : ""}{formatCurrency(stats.net, true)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. "CURRENT SPEND RATE" CATEGORY PERFORMANCE (FUN BENTO ELEMENT) ── */}
        {topExpenseCategories.sorted.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-black/[0.04] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-extrabold text-stone-400 dark:text-slate-400 uppercase tracking-wider">
                Kategori
              </h2>
              <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500">
                Total {formatCurrency(topExpenseCategories.totalExp, true)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topExpenseCategories.sorted.map((item, index) => {
                const colorTheme = PASTEL_COLORS[index % PASTEL_COLORS.length];
                return (
                  <div
                    key={item.slug}
                    className={cn(
                      "rounded-2xl p-3 sm:p-3.5 border border-black/[0.03] dark:border-slate-800/80 flex flex-col justify-between gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-xs",
                      colorTheme.bg
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-base shadow-2xs shrink-0">
                        <AnimatedEmoji emoji={item.meta.emoji} size={18} />
                      </div>
                      <span className={cn("text-xs font-black px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 shadow-2xs", colorTheme.text)}>
                        {item.percentage}%
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-black text-[#18181B] dark:text-slate-100 truncate">
                        {item.meta.name}
                      </p>
                      <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 tabular-nums mt-0.5">
                        {formatCurrency(item.amount, true)}
                      </p>
                    </div>

                    {/* Color Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colorTheme.bar)}
                        style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. SEARCH & PASTEL CATEGORY PILLS (INTERAKTIF) ── */}
        <div className="flex flex-col gap-3">
          {/* Search Bar & Mobile Trigger */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
              <Input
                placeholder="Cari transaksi berdasarkan nama atau catatan..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-11 pr-4 bg-surface-muted/70 dark:bg-slate-800/80 border-none focus-visible:ring-2 focus-visible:ring-[#E85024]/40 focus-visible:bg-white dark:focus-visible:bg-slate-800 h-11 text-xs sm:text-sm rounded-full w-full font-medium transition-all text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 shadow-2xs"
              />
            </div>

            {/* Desktop Quick Selectors */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Rekening Filter */}
              <Select value={bankFilter} onValueChange={(v) => handleFilterChange(setBankFilter, v)}>
                <SelectTrigger className="h-11 bg-surface-muted/70 dark:bg-slate-800 border-none rounded-full text-xs font-bold px-4 min-w-[140px] cursor-pointer text-[#18181B] dark:text-slate-200 shadow-2xs">
                  <SelectValue placeholder="Semua Rekening" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900">
                  <SelectItem value="all" className="rounded-xl font-semibold">Semua Rekening</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className="rounded-xl font-semibold">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-stone-400" />
                        <span>{account.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Urutan */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-11 bg-surface-muted/70 dark:bg-slate-800 border-none rounded-full text-xs font-bold px-4 min-w-[130px] cursor-pointer text-[#18181B] dark:text-slate-200 shadow-2xs">
                  <SelectValue placeholder="Urutan" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900">
                  <SelectItem value="date_desc" className="rounded-xl font-semibold">Terbaru</SelectItem>
                  <SelectItem value="date_asc" className="rounded-xl font-semibold">Terlama</SelectItem>
                  <SelectItem value="amount_desc" className="rounded-xl font-semibold">Nominal Terbesar</SelectItem>
                  <SelectItem value="amount_asc" className="rounded-xl font-semibold">Nominal Terkecil</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  onClick={resetAllFilters}
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3.5 rounded-full text-xs font-extrabold text-[#E85024] hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer gap-1"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "lg:hidden h-11 px-4 rounded-full gap-1.5 text-xs font-extrabold shrink-0 shadow-2xs bg-surface-muted/80 dark:bg-slate-800 border-stone-200/60 dark:border-slate-700 text-[#18181B] dark:text-slate-200 cursor-pointer",
                hasActiveFilters && "border-[#E85024] bg-[#FDD5C1]/40 dark:bg-brand-orange/20 text-[#E85024]"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-[#E85024]" />
              )}
            </Button>
          </div>

          {/* Pastel Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap scrollbar-none py-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => handleFilterChange(setCategoryFilter, "all")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 hover:scale-105 active:scale-95",
                categoryFilter === "all"
                  ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-surface-muted/80 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200/80 dark:hover:bg-slate-700"
              )}
            >
              Semua
            </button>
            {Object.values(availableCategories.bySlug).map((cat, idx) => {
              const isSelected = categoryFilter === cat.slug;
              const colorCycle = PASTEL_COLORS[idx % PASTEL_COLORS.length];
              return (
                <button
                  key={`${cat.type}-${cat.slug}`}
                  type="button"
                  onClick={() => handleFilterChange(setCategoryFilter, cat.slug)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 hover:scale-105 active:scale-95",
                    isSelected
                      ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900 shadow-xs ring-2 ring-[#E85024]"
                      : `${colorCycle.bg} ${colorCycle.text} border border-black/[0.04] dark:border-transparent`
                  )}
                >
                  <AnimatedEmoji emoji={cat.emoji} size={15} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 5. TACTILE TRANSACTION CARDS LIST ── */}
        <div className="min-h-[420px] flex flex-col justify-between pt-1">
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {paginatedTransactions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-3 bg-surface-muted/30 dark:bg-slate-800/40 border border-black/[0.03] dark:border-slate-700/60 rounded-3xl text-center px-4"
                >
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-400 dark:text-slate-500">
                    <FilterX className="h-6 w-6 opacity-60" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#18181B] dark:text-slate-100">Transaksi Tidak Ditemukan</p>
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 max-w-sm">Sesuaikan filter atau ubah kata kunci pencarian Anda untuk menampilkan data transaksi.</p>
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
                        "group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-black/[0.04] dark:border-slate-800 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 mb-2.5",
                        selectedIds.has(tx.id) && "ring-2 ring-[#E85024] bg-[#FDD5C1]/10 dark:bg-brand-orange/10"
                      )}
                    >
                      {/* SISI KIRI (Checkbox + Icon Squircle + Info Transaksi) */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleSelection(tx.id)}
                          className="text-stone-400 dark:text-slate-600 hover:text-[#E85024] dark:hover:text-[#E85024] shrink-0 cursor-pointer p-0.5 transition-colors"
                          aria-label="Pilih transaksi"
                        >
                          {selectedIds.has(tx.id) ? (
                            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#E85024]" />
                          ) : (
                            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>

                        {/* Avatar Emoji Squircle */}
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-2xs shrink-0 border border-black/[0.02] dark:border-slate-800",
                            tx.type === "income"
                              ? "bg-[#D8F5A2]/60 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                              : tx.type === "transfer"
                              ? "bg-[#E0E6FD]/60 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300"
                              : "bg-[#FDD5C1]/60 dark:bg-rose-950/80 text-[#E85024] dark:text-rose-300"
                          )}
                        >
                          <AnimatedEmoji emoji={catMeta.emoji} size={18} />
                        </div>

                        {/* Info Teks: Baris 1 Nama Transaksi, Baris 2 Rekening & Kategori */}
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate max-w-[140px] sm:max-w-xs md:max-w-md leading-tight"
                            title={tx.name}
                          >
                            {tx.name}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-stone-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span>{tx.type === "transfer" && transferBank && bank ? `${bank.name} → ${transferBank.name}` : (bank?.name || "Cash")}</span>
                            <span>&bull;</span>
                            <span>{catMeta.name}</span>
                          </p>
                          {tx.notes && (
                            <p className="text-[10px] text-stone-500 dark:text-slate-300 mt-1 bg-surface-muted/60 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-black/[0.02] dark:border-slate-700/50 italic truncate max-w-xs sm:max-w-md">
                              {tx.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* SISI KANAN (Nominal + Tanggal + Aksi) */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right flex flex-col items-end justify-center">
                          <p
                            className={cn(
                              "font-black text-xs sm:text-sm tabular-nums tracking-tight",
                              tx.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : tx.type === "transfer"
                                ? "text-teal-600 dark:text-teal-400"
                                : "text-[#18181B] dark:text-slate-100"
                            )}
                          >
                            {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}
                            {formatCurrency(tx.amount, true)}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 tabular-nums">
                            {formatDate(tx.date, "dd MMM yyyy")} {tx.created_at ? `• ${formatDate(tx.created_at, "HH:mm")}` : ""}
                          </p>
                        </div>

                        {/* Tombol Edit & Hapus */}
                        <div className="flex items-center gap-0.5">
                          {tx.type !== "transfer" && (
                            <button
                              type="button"
                              onClick={() => setEditingTransaction(tx)}
                              className="p-1.5 rounded-full text-stone-400 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-100 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              aria-label="Edit transaksi"
                              title="Edit"
                            >
                              <PencilLine className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 rounded-full text-stone-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            aria-label="Hapus transaksi"
                            title="Hapus"
                          >
                            {deletingId === tx.id ? (
                              <span className="block h-3.5 w-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div className="flex flex-col xs:flex-row gap-3 items-center justify-between border-t border-stone-100 dark:border-slate-800 pt-5 mt-4">
              <p className="text-[11px] sm:text-xs font-medium text-stone-500 dark:text-slate-400 text-center xs:text-left order-2 xs:order-1">
                Total {filteredAndSorted.length} data &bull; Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center justify-between xs:justify-end w-full xs:w-auto gap-1.5 order-1 xs:order-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 rounded-full border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-3 text-[#18181B] dark:text-slate-100">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-9 w-9 rounded-full border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 shadow-2xs cursor-pointer"
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1A1A]/95 dark:bg-slate-900/95 backdrop-blur-md text-white border border-white/10 dark:border-slate-700 rounded-full px-5 py-3 flex items-center gap-4 shadow-2xl min-w-[320px]"
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
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-slate-900 border-t border-black/[0.04] dark:border-slate-800 rounded-t-[32px] px-6 pt-4 pb-8 max-h-[85vh] overflow-y-auto lg:hidden flex flex-col gap-4 shadow-2xl"
            >
              <div className="h-1.5 w-12 bg-stone-200 dark:bg-slate-700 rounded-full mx-auto mb-1 shrink-0" onClick={() => setIsFilterDrawerOpen(false)} />

              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base font-bold text-[#18181B] dark:text-slate-100">Filter Transaksi</h3>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="h-8 w-8 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-600 dark:text-slate-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Jenis Transaksi</label>
                  <Select value={typeFilter} onValueChange={(v) => handleFilterChange(setTypeFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 dark:bg-slate-800 border-stone-200/50 dark:border-slate-700 rounded-2xl text-xs font-medium text-[#18181B] dark:text-slate-100">
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 z-[90]">
                      <SelectItem value="all" className="rounded-xl">Semua Jenis</SelectItem>
                      <SelectItem value="income" className="rounded-xl">Pemasukan (+)</SelectItem>
                      <SelectItem value="expense" className="rounded-xl">Pengeluaran (-)</SelectItem>
                      <SelectItem value="transfer" className="rounded-xl">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Kategori</label>
                  <Select value={categoryFilter} onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 dark:bg-slate-800 border-stone-200/50 dark:border-slate-700 rounded-2xl text-xs font-medium text-[#18181B] dark:text-slate-100">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 z-[90] max-h-[260px]">
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
                  <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Rekening</label>
                  <Select value={bankFilter} onValueChange={(v) => handleFilterChange(setBankFilter, v)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 dark:bg-slate-800 border-stone-200/50 dark:border-slate-700 rounded-2xl text-xs font-medium text-[#18181B] dark:text-slate-100">
                      <SelectValue placeholder="Pilih Rekening" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 z-[90]">
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
                  <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">Urutan Tanggal / Nominal</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-11 bg-surface-muted/60 dark:bg-slate-800 border-stone-200/50 dark:border-slate-700 rounded-2xl text-xs font-medium text-[#18181B] dark:text-slate-100">
                      <SelectValue placeholder="Urutan Tanggal" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 z-[90]">
                      <SelectItem value="date_desc" className="rounded-xl">Terbaru</SelectItem>
                      <SelectItem value="date_asc" className="rounded-xl">Terlama</SelectItem>
                      <SelectItem value="amount_desc" className="rounded-xl">Nominal Terbesar</SelectItem>
                      <SelectItem value="amount_asc" className="rounded-xl">Nominal Terkecil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Drawer Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-4 pt-2 pb-6">
                <Button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full bg-[#E85024] hover:bg-[#d44319] text-white font-bold py-3.5 rounded-full text-xs shadow-md active:scale-95 transition-all cursor-pointer h-12"
                >
                  Terapkan Filter
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetAllFilters}
                  className="w-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 font-bold py-3 rounded-full text-xs transition-all cursor-pointer h-11"
                >
                  Reset Filter
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

