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
  Download,
  Calendar,
  FilterX,
  SlidersHorizontal,
  X,
  CreditCard,
  Trash2,
  Square,
  CheckSquare,
  ChevronDown,
  PiggyBank,
  BarChart3,
  LineChart,
  LayoutGrid,
  Plus,
  ArrowRightLeft,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
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
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import { AppTopHeader } from "@/components/dashboard/app-top-header";
import { AppPagination } from "@/components/ui/app-pagination";
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
    setCurrentMonth(month);
    setCurrentYear(year);
    router.push(`/dashboard/transactions?month=${month}&year=${year}`);
  };

  const BANK_MAP = useMemo(() => {
    return Object.fromEntries(bankAccounts.map((b) => [b.id, b]));
  }, [bankAccounts]);

  const totalBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  }, [bankAccounts]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [page, setPage] = useState(1);
  const [chartMode, setChartMode] = useState<"net" | "flow">("net");
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleFilterChange = (setter: (v: any) => void, val: any) => {
    setter(val);
    setPage(1);
  };

  const hasLiveTransactions = initialTransactions.length > 0;

  // Filter & Sort All Transactions for Current Period
  const filteredAndSorted = useMemo(() => {
    let result = [...initialTransactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.name.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          (availableCategories.bySlug[tx.category]?.name && availableCategories.bySlug[tx.category].name.toLowerCase().includes(q))
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
  }, [initialTransactions, search, typeFilter, categoryFilter, bankFilter, sortBy, availableCategories]);

  // Real Financial Statistics
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;

    initialTransactions.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expense += tx.amount;
      else if (tx.type === "transfer") transfer += tx.amount;
    });

    const net = income - expense;
    const isCurrentMonthActive =
      currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
    const daysElapsed = isCurrentMonthActive
      ? Math.max(1, new Date().getDate())
      : new Date(currentYear, currentMonth + 1, 0).getDate();

    const burnRateDaily = expense > 0 ? expense / daysElapsed : 0;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const runwayMonths =
      expense > 0 ? Math.max(1, Math.round(totalBankBalance / expense)) : totalBankBalance > 0 ? 12 : 0;

    return {
      income,
      expense,
      transfer,
      net,
      savingsRate,
      runwayMonths,
      burnRateDaily,
      burnRateTotal: expense,
      burnRateBudget: income > 0 ? income : expense,
      hasIncome: income > 0,
      hasExpense: expense > 0,
    };
  }, [initialTransactions, currentMonth, currentYear, totalBankBalance]);

  // Real Category Spending Breakdown
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExp = 0;

    initialTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
        totalExp += tx.amount;
      }
    });

    const items = Object.entries(map).map(([catSlug, amount]) => {
      const meta = availableCategories.bySlug[catSlug] || {
        name: catSlug,
        emoji: "🏷️",
        color: "#E85024",
      };
      const percentage = totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0;
      return {
        slug: catSlug,
        name: meta.name,
        emoji: meta.emoji,
        color: meta.color || "#E85024",
        amount,
        percentage,
      };
    });

    items.sort((a, b) => b.amount - a.amount);
    return { items, totalExp };
  }, [initialTransactions, availableCategories]);

  // Real Cumulative Cashflow Sparkline Data
  const sparklineData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyNetMap: Record<number, number> = {};
    const dailyFlowMap: Record<number, number> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      dailyNetMap[d] = 0;
      dailyFlowMap[d] = 0;
    }

    initialTransactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const d = txDate.getDate();
      if (d >= 1 && d <= daysInMonth) {
        if (tx.type === "income") {
          dailyNetMap[d] += tx.amount;
          dailyFlowMap[d] += tx.amount;
        } else if (tx.type === "expense") {
          dailyNetMap[d] -= tx.amount;
          dailyFlowMap[d] += tx.amount;
        }
      }
    });

    let runningNet = 0;
    const values: { day: number; val: number }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      if (chartMode === "net") {
        runningNet += dailyNetMap[d];
        values.push({ day: d, val: runningNet });
      } else {
        values.push({ day: d, val: dailyFlowMap[d] });
      }
    }

    const allVals = values.map((v) => v.val);
    const maxVal = Math.max(...allVals, 1000);
    const minVal = Math.min(...allVals, 0);
    const range = Math.max(maxVal - minVal, 1000);

    let peakItem = values[0];
    values.forEach((v) => {
      if (v.val > peakItem.val) peakItem = v;
    });

    const step = Math.max(1, Math.floor(daysInMonth / 6));
    const sampleDays = [
      1,
      Math.min(daysInMonth, 1 + step),
      Math.min(daysInMonth, 1 + step * 2),
      Math.min(daysInMonth, 1 + step * 3),
      Math.min(daysInMonth, 1 + step * 4),
      Math.min(daysInMonth, 1 + step * 5),
      daysInMonth,
    ];
    const uniqueSampleDays = Array.from(new Set(sampleDays)).sort((a, b) => a - b);

    const width = 500;
    const height = 130;
    const padX = 25;
    const chartWidth = width - padX * 2;

    const points = uniqueSampleDays.map((d) => {
      const item = values.find((v) => v.day === d) || { day: d, val: 0 };
      const x = padX + ((d - 1) / (daysInMonth - 1 || 1)) * chartWidth;
      const normalized = (item.val - minVal) / range;
      const y = height - 20 - normalized * (height - 44);
      return {
        day: d,
        label: d < 10 ? `0${d}` : `${d}`,
        val: item.val,
        x,
        y,
        isPeak: d === peakItem.day,
      };
    });

    const peakX = padX + ((peakItem.day - 1) / (daysInMonth - 1 || 1)) * chartWidth;
    const peakNorm = (peakItem.val - minVal) / range;
    const peakY = height - 20 - peakNorm * (height - 44);
    const peakPoint = {
      day: peakItem.day,
      label: `${peakItem.day < 10 ? `0${peakItem.day}` : peakItem.day}`,
      val: peakItem.val,
      x: peakX,
      y: peakY,
      isPeak: true,
    };

    let dPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      dPath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const area = `${dPath} L ${points[points.length - 1].x} ${height + 20} L ${points[0].x} ${height + 20} Z`;

    return {
      path: dPath,
      area,
      points,
      peakPoint,
      height,
      hasData: initialTransactions.length > 0,
    };
  }, [initialTransactions, currentMonth, currentYear, chartMode]);

  // Real Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAndSorted.slice(start, start + PAGE_SIZE);
  }, [filteredAndSorted, page]);

  // Real Grouped Display Transactions by Date
  const groupedDisplayTransactions = useMemo(() => {
    const groupsMap: Record<string, { groupLabel: string; netAmount: number; items: TransactionRow[] }> = {};

    paginatedTransactions.forEach((tx) => {
      const txDate = tx.date;
      if (!groupsMap[txDate]) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        let dayLabel = formatDate(txDate, "dd MMMM yyyy");
        if (txDate === todayStr) {
          dayLabel = `Hari Ini • ${formatDate(txDate, "dd MMM yyyy")}`;
        } else if (txDate === yesterdayStr) {
          dayLabel = `Kemarin • ${formatDate(txDate, "dd MMM yyyy")}`;
        }

        groupsMap[txDate] = {
          groupLabel: dayLabel,
          netAmount: 0,
          items: [],
        };
      }

      groupsMap[txDate].items.push(tx);
      if (tx.type === "income") groupsMap[txDate].netAmount += tx.amount;
      else if (tx.type === "expense") groupsMap[txDate].netAmount -= tx.amount;
    });

    return Object.values(groupsMap);
  }, [paginatedTransactions]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Hapus transaksi ini?")) return;

    setDeletingId(id);
    try {
      const res = await removeTransaction(id);
      if (res && !res.success) alert(res.error || "Gagal menghapus transaksi");
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
    if (!confirm(`Hapus ${selectedIds.size} transaksi terpilih?`)) return;

    setIsBulkDeleting(true);
    try {
      const res = await deleteMultipleTransactions(Array.from(selectedIds));
      if (res && !res.success) {
        alert(res.error || "Gagal menghapus beberapa transaksi");
      } else {
        setSelectedIds(new Set());
      }
    } catch {
      alert("Terjadi kesalahan saat menghapus.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredAndSorted.length === 0) {
      alert("Tidak ada transaksi untuk diekspor.");
      return;
    }

    const headers = ["Tanggal", "Nama Transaksi", "Tipe", "Kategori", "Rekening", "Nominal (Rp)", "Catatan"];
    const rows = filteredAndSorted.map((tx) => [
      tx.date,
      `"${(tx.name || "").replace(/"/g, '""')}"`,
      tx.type === "income" ? "Pemasukan" : tx.type === "transfer" ? "Transfer" : "Pengeluaran",
      `"${(availableCategories.bySlug[tx.category]?.name || tx.category || "").replace(/"/g, '""')}"`,
      `"${(BANK_MAP[tx.bank_account_id]?.name || tx.bank_account_id || "Dompet").replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Transaksi_${MONTHS[currentMonth]?.label}_${currentYear}.csv`);
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
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#121316] text-[#18181B] dark:text-[#F1F5F9] px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 flex justify-center items-start selection:bg-[#E85024]/20">
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col gap-4 sm:gap-5 pb-24">
        
        {/* ══════════════════════════════════════════════════════════
            1. APP TOP HEADER (CONSISTENT REUSABLE COMPONENT)
           ══════════════════════════════════════════════════════════ */}
        <AppTopHeader />

        {/* ══════════════════════════════════════════════════════════
            2. PAGE TITLE & CONTROLS (REAL DATA)
           ══════════════════════════════════════════════════════════ */}
        <header className="flex flex-col gap-2.5 pt-0.5">
          {/* Row 1: Title & Export Pill */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#18181B] dark:text-white tracking-tight leading-none">
                Arus Kas & Transaksi
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-medium mt-1">
                {hasLiveTransactions ? `${filteredAndSorted.length} transaksi terekam` : "Belum ada transaksi bulan ini"}
              </p>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!hasLiveTransactions}
              className="rounded-full bg-white dark:bg-[#1C1E23] border border-black/[0.04] dark:border-white/[0.06] px-3.5 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 shadow-2xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Export CSV"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E85024]" />
              <span>{filteredAndSorted.length} Data</span>
              <Download className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400 ml-0.5" />
            </button>
          </div>

          {/* Row 2: Period & Status Sinkron */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="relative">
              <Select
                value={`${currentMonth}-${currentYear}`}
                onValueChange={(val) => {
                  const [m, y] = val.split("-").map(Number);
                  handlePeriodChange(m, y);
                }}
              >
                <SelectTrigger className="rounded-full bg-white dark:bg-[#1C1E23] border border-black/[0.04] dark:border-white/[0.06] px-3.5 py-2 h-9 text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 shadow-2xs hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 dark:text-slate-400 shrink-0" />
                  <span>{MONTHS[currentMonth]?.label || "September"} {currentYear}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5 shrink-0" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-stone-200 dark:border-slate-800 dark:bg-slate-900 shadow-xl max-h-[260px]">
                  {YEARS.map((y) =>
                    MONTHS.map((m) => (
                      <SelectItem key={`${m.value}-${y}`} value={`${m.value}-${y}`} className="text-xs font-semibold rounded-xl cursor-pointer">
                        {m.label} {y}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-[#ECFDC5] dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sinkron Realtime</span>
            </div>
          </div>

          {/* Row 3: Quick Time Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1">
            {[
              {
                id: "current_month",
                label: "Bulan Ini",
                onClick: () => {
                  const now = new Date();
                  handlePeriodChange(now.getMonth(), now.getFullYear());
                },
                active: currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear(),
              },
              {
                id: "last_month",
                label: "Bulan Lalu",
                onClick: () => {
                  const now = new Date();
                  const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                  const lastY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                  handlePeriodChange(lastM, lastY);
                },
                active:
                  currentMonth === (new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1) &&
                  currentYear === (new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()),
              },
              {
                id: "year_filter",
                label: `Tahun ${currentYear}`,
                onClick: () => {},
                active: false,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0",
                  tab.active
                    ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-stone-900 shadow-xs"
                    : "bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.06] hover:bg-stone-50 dark:hover:bg-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            3. HERO BENTO: SALDO KAS BERSIH (REAL METRICS)
           ══════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col gap-4 transition-all">
          {/* Top Row: Label vs Savings Rate Badge */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400 truncate">
              Saldo Kas Bersih
            </p>
            <div
              className={cn(
                "font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs shrink-0 whitespace-nowrap",
                stats.net >= 0
                  ? "bg-[#ECFDC5] dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200"
                  : "bg-[#FFE2D9] dark:bg-rose-950/60 text-rose-900 dark:text-rose-200"
              )}
            >
              {stats.net >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>
                {stats.savingsRate >= 0 ? `+${stats.savingsRate}%` : `${stats.savingsRate}%`} Tabungan
              </span>
            </div>
          </div>

          {/* Nominal Utama */}
          <div className="my-0.5">
            <h2 className="text-3xl sm:text-4xl font-black text-[#18181B] dark:text-white tracking-tight tabular-nums">
              {stats.net >= 0 ? "+" : ""}{formatCurrency(stats.net, false)}
            </h2>
          </div>

          {/* Dual Mini Summary Cards (Grid 2 Kolom) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pemasukan */}
            <div className="bg-[#ECFDC5]/60 dark:bg-emerald-950/40 rounded-2xl p-3 sm:p-3.5 border border-emerald-200/40 dark:border-emerald-800/30 flex flex-col justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold">Pemasukan</span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-black text-stone-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(stats.income, false)}
                </p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {stats.hasIncome ? "Dana kas masuk" : "Belum ada pemasukan"}
                </p>
              </div>
            </div>

            {/* Pengeluaran */}
            <div className="bg-[#FFE2D9]/60 dark:bg-rose-950/40 rounded-2xl p-3 sm:p-3.5 border border-rose-200/40 dark:border-rose-800/30 flex flex-col justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5] text-[#E85024]" />
                </div>
                <span className="text-xs font-bold">Pengeluaran</span>
              </div>
              <div>
                <p className="text-sm sm:text-base font-black text-stone-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(stats.expense, false)}
                </p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-rose-700 dark:text-rose-400 mt-0.5">
                  {stats.hasExpense ? "Total belanja & biaya" : "Belum ada pengeluaran"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.04] text-xs">
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Runway: <strong className="font-bold text-stone-900 dark:text-white">{stats.runwayMonths > 0 ? `${stats.runwayMonths} Bulan` : "Aman"}</strong></span>
            </div>
            <Link
              href="/dashboard/budget"
              className="text-[#E85024] font-bold text-xs flex items-center gap-0.5 hover:underline active:scale-95 transition-transform"
            >
              <span>Target Anggaran</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            4. BENTO CARD: ARUS KAS KUMULATIF (REAL DATA SPARKLINE)
           ══════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col gap-3 transition-all relative overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#18181B] dark:text-white tracking-tight whitespace-nowrap">
                  Arus Kas Kumulatif
                </h3>
                <span className="bg-[#FFE2D9] dark:bg-[#E85024]/20 text-[#E85024] dark:text-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  {MONTHS[currentMonth]?.label?.slice(0, 3)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-slate-400 font-medium mt-0.5 truncate">
                Tren pergerakan saldo kas harian
              </p>
            </div>

            {/* Switcher Pill: Net | Volume */}
            <div className="bg-stone-100 dark:bg-[#252830] p-1 rounded-full text-xs font-bold flex items-center gap-1 border border-black/[0.03] dark:border-white/[0.05] shrink-0">
              <button
                type="button"
                onClick={() => setChartMode("net")}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                  chartMode === "net"
                    ? "bg-white dark:bg-stone-800 text-[#18181B] dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 dark:text-slate-400"
                )}
              >
                Net
              </button>
              <button
                type="button"
                onClick={() => setChartMode("flow")}
                className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                  chartMode === "flow"
                    ? "bg-white dark:bg-stone-800 text-[#18181B] dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 dark:text-slate-400"
                )}
              >
                Volume
              </button>
            </div>
          </div>

          {/* Area Sparkline Chart Container */}
          <div className="w-full relative pt-7 pb-2">
            {/* Interactive Peak Tooltip Pill (Clamped to avoid clipping on edges) */}
            {hasLiveTransactions && (
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-8 bg-[#1A1A1A] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none select-none whitespace-nowrap"
                style={{
                  left: `${Math.max(22, Math.min(78, (sparklineData.peakPoint.x / 500) * 100))}%`,
                  top: `${Math.max(24, sparklineData.peakPoint.y)}px`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85024]" />
                <span>
                  {sparklineData.peakPoint.day} {MONTHS[currentMonth]?.label?.slice(0, 3)} • {sparklineData.peakPoint.val >= 0 ? "+" : ""}{formatCurrency(sparklineData.peakPoint.val, true)}
                </span>
              </div>
            )}

            <svg
              viewBox="0 0 500 130"
              preserveAspectRatio="none"
              className="w-full h-28 sm:h-32 overflow-visible"
            >
              <defs>
                <linearGradient id="stitchCoralGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E85024" stopOpacity="0.25" />
                  <stop offset="60%" stopColor="#E85024" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#E85024" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {hasLiveTransactions && sparklineData.peakPoint.val > 0 && (
                <line
                  x1={sparklineData.peakPoint.x}
                  y1={sparklineData.peakPoint.y}
                  x2={sparklineData.peakPoint.x}
                  y2={125}
                  stroke="#E85024"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
              )}

              {sparklineData.area && (
                <path d={sparklineData.area} fill="url(#stitchCoralGrad)" />
              )}

              {sparklineData.path && (
                <path
                  d={sparklineData.path}
                  fill="none"
                  stroke="#E85024"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {hasLiveTransactions && sparklineData.peakPoint.val > 0 && (
                <circle
                  cx={sparklineData.peakPoint.x}
                  cy={sparklineData.peakPoint.y}
                  r="4.5"
                  fill="#E85024"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="drop-shadow-xs"
                />
              )}
            </svg>

            {/* Sumbu X Labels */}
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 dark:text-slate-500 px-2 mt-1">
              {sparklineData.points.map((p, idx) => (
                <span
                  key={idx}
                  className={cn(
                    p.isPeak && hasLiveTransactions && sparklineData.peakPoint.val > 0
                      ? "text-[#E85024] font-black"
                      : ""
                  )}
                >
                  {p.label}{p.isPeak && hasLiveTransactions && sparklineData.peakPoint.val > 0 ? " (Puncak)" : ""}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            5. BENTO CARD: LAJU BAKAR HARIAN (REAL BURN RATE & CATEGORY SPLIT)
           ══════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-[#1C1E23] rounded-[32px] p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.06] shadow-xs flex flex-col gap-3.5 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-400">
              Laju Bakar Harian
            </h3>
            <div className={cn(
              "font-extrabold text-xs px-2.5 py-1 rounded-full shadow-2xs",
              stats.net >= 0
                ? "bg-[#FEF08A]/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200"
                : "bg-[#FFE2D9] dark:bg-rose-950/60 text-rose-900 dark:text-rose-200"
            )}>
              {stats.net >= 0 ? `Surplus ${formatCurrency(stats.net, true)}` : `Defisit ${formatCurrency(Math.abs(stats.net), true)}`}
            </div>
          </div>

          {/* Metrik Utama */}
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#18181B] dark:text-white tracking-tight tabular-nums">
                {formatCurrency(stats.burnRateDaily, true)}
              </span>
              <span className="text-xs text-stone-400 dark:text-slate-400 font-semibold">
                /hari rata-rata
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-stone-700 dark:text-slate-300 tabular-nums">
              {formatCurrency(stats.burnRateTotal, true)} / {formatCurrency(stats.burnRateBudget, true)}
            </span>
          </div>

          {/* Multi-Color Dynamic Category Progress Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex gap-0.5 bg-stone-100 dark:bg-slate-800 p-0.5">
            {categorySpending.items.length > 0 ? (
              categorySpending.items.map((cat, idx) => (
                <div
                  key={cat.slug}
                  className={cn("h-full transition-all", idx === 0 && "rounded-l-full", idx === categorySpending.items.length - 1 && "rounded-r-full")}
                  style={{
                    width: `${Math.max(cat.percentage, 4)}%`,
                    backgroundColor: cat.color || "#E85024",
                  }}
                  title={`${cat.name}: ${cat.percentage}% (${formatCurrency(cat.amount, true)})`}
                />
              ))
            ) : (
              <div className="h-full w-full rounded-full bg-stone-200 dark:bg-slate-700" title="Belum ada pengeluaran" />
            )}
          </div>

          {/* Dynamic Legend Kategori */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-stone-600 dark:text-slate-300 pt-1">
            {categorySpending.items.length > 0 ? (
              categorySpending.items.slice(0, 4).map((cat) => (
                <div key={cat.slug} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#E85024" }}
                  />
                  <span className="truncate">
                    {cat.name}: <strong>{cat.percentage}%</strong>
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-stone-400 text-xs text-center py-1 font-medium">
                Belum ada pengeluaran yang tercatat pada bulan ini
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            6. SEARCH & FILTER TRANSAKSI (DYNAMIC CATEGORIES)
           ══════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-2 pt-1">
          {/* Search Input with Integrated Filter Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Cari transaksi atau kategori..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-full bg-white dark:bg-[#1C1E23] border border-black/[0.04] dark:border-white/[0.06] text-xs sm:text-sm font-medium text-[#18181B] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#E85024]/40 transition-all"
              />
            </div>

            {/* Filter Lanjutan Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={cn(
                "h-11 px-3.5 sm:px-4 rounded-full bg-white dark:bg-[#1C1E23] border border-black/[0.04] dark:border-white/[0.06] shadow-2xs flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shrink-0",
                hasActiveFilters && "border-[#E85024] bg-orange-50/60 dark:bg-orange-950/30 text-[#E85024]"
              )}
              title="Filter Lanjutan"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E85024]" />
              <span className="hidden xs:inline">Filter</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#E85024]" />}
            </button>
          </div>

          {/* Quick Filter Pills: Types & Dynamic Categories with Real Animated Emojis */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-1 px-1">
            {[
              { id: "all" as const, label: "Semua" },
              { id: "income" as const, label: "Masuk" },
              { id: "expense" as const, label: "Keluar" },
              { id: "transfer" as const, label: "Transfer" },
            ].map((t) => {
              const isActive = typeFilter === t.id && categoryFilter === "all";
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(t.id);
                    setCategoryFilter("all");
                    setPage(1);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0",
                    isActive
                      ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-stone-900 shadow-xs"
                      : "bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.06] hover:bg-stone-50"
                  )}
                >
                  {t.label}
                </button>
              );
            })}

            <div className="h-4 w-[1px] bg-stone-200 dark:bg-slate-700 shrink-0 mx-0.5" />

            {/* User Real Categories */}
            {availableCategories.expense.slice(0, 8).map((cat) => {
              const isSelected = categoryFilter === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => handleFilterChange(setCategoryFilter, isSelected ? "all" : cat.slug)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 border border-black/[0.04] dark:border-white/[0.06]",
                    isSelected
                      ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-stone-900 shadow-xs ring-2 ring-[#E85024]"
                      : "bg-white dark:bg-[#1C1E23] text-stone-600 dark:text-slate-300 hover:bg-stone-50"
                  )}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[11px]">
                    <AnimatedEmoji emoji={cat.emoji} size={13} />
                  </span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            7. GROUPED TRANSACTION LIST (REAL DATA & REAL CATEGORY ICONS)
           ══════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-3.5 pt-1">
          {groupedDisplayTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 gap-3 bg-white dark:bg-[#1C1E23] border border-black/[0.03] dark:border-white/[0.06] rounded-[32px] text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#E85024] flex items-center justify-center shadow-2xs">
                <FilterX className="w-6 h-6" />
              </div>
              <div className="max-w-xs">
                <p className="font-bold text-sm text-[#18181B] dark:text-slate-100">
                  {hasActiveFilters ? "Tidak Ada Transaksi Ditemukan" : "Belum Ada Transaksi"}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                  {hasActiveFilters
                    ? "Ubah kata kunci atau reset filter Anda."
                    : `Belum ada catatan pada bulan ${MONTHS[currentMonth]?.label} ${currentYear}. Mulai catat transaksi sekarang.`}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllFilters}
                    className="rounded-full text-xs font-bold text-[#E85024] border-[#E85024]/40 cursor-pointer"
                  >
                    Reset Filter
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsAddOpen(true)}
                    className="rounded-full bg-[#E85024] hover:bg-[#d44319] text-white text-xs font-bold shadow-md cursor-pointer gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Catat Transaksi</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            groupedDisplayTransactions.map((group, groupIdx) => (
              <div key={groupIdx} className="flex flex-col gap-1.5">
                {/* Group Header Row */}
                <div className="flex items-center justify-between text-xs px-1.5 py-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E85024]" />
                    <span>{group.groupLabel}</span>
                  </div>
                  <span className={cn(
                    "font-extrabold tabular-nums",
                    group.netAmount >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-stone-700 dark:text-slate-300"
                  )}>
                    Net: {group.netAmount >= 0 ? "+" : ""}{formatCurrency(group.netAmount, false)}
                  </span>
                </div>

                {/* Items Container Card */}
                <div className="bg-white dark:bg-[#1C1E23] rounded-[28px] sm:rounded-[32px] p-2 border border-black/[0.03] dark:border-white/[0.06] shadow-xs divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                  {group.items.map((item) => {
                    const isIncome = item.type === "income";
                    const isTransfer = item.type === "transfer";
                    const catMeta = availableCategories.bySlug[item.category] || {
                      name: isTransfer ? "Transfer" : item.category,
                      emoji: isTransfer ? "🔄" : isIncome ? "💰" : "🏷️",
                      color: isTransfer ? "#6366f1" : isIncome ? "#10b981" : "#E85024",
                    };
                    const bankAccount = BANK_MAP[item.bank_account_id];

                    return (
                      <div
                        key={item.id}
                        onClick={() => setEditingTransaction(item)}
                        className={cn(
                          "p-3 sm:p-3.5 flex items-center justify-between gap-3 rounded-2xl hover:bg-stone-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer select-none active:scale-[0.99]",
                          selectedIds.has(item.id) && "bg-orange-50/50 dark:bg-orange-950/20 ring-1 ring-[#E85024]"
                        )}
                      >
                        {/* Left: Checkbox + Category Animated Emoji Squircle + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(item.id);
                            }}
                            className="text-stone-300 hover:text-[#E85024] cursor-pointer p-0.5 transition-colors shrink-0"
                            aria-label="Pilih transaksi"
                          >
                            {selectedIds.has(item.id) ? (
                              <CheckSquare className="w-4 h-4 text-[#E85024]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          {/* Category Icon Squircle using the exact category emoji & accent color */}
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border border-black/[0.02] dark:border-white/[0.04]"
                            style={{
                              backgroundColor: `${catMeta.color || (isIncome ? "#10b981" : isTransfer ? "#6366f1" : "#E85024")}18`,
                            }}
                          >
                            {isTransfer ? (
                              <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.2]" />
                            ) : (
                              <AnimatedEmoji emoji={catMeta.emoji} size={20} />
                            )}
                          </div>

                          {/* Info Teks */}
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate leading-tight">
                                {item.name}
                              </h4>
                              {isTransfer && (
                                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                  Transfer
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-400 dark:text-slate-400 font-medium truncate mt-0.5">
                              {bankAccount?.name || "Dompet"} • {catMeta.name}
                              {item.notes ? ` • ${item.notes}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Right: Real Nominal & Category Subtext */}
                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "text-xs sm:text-sm font-black tabular-nums tracking-tight",
                              isIncome
                                ? "text-emerald-700 dark:text-emerald-400"
                                : isTransfer
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "text-[#18181B] dark:text-slate-100"
                            )}
                          >
                            {isIncome ? "+" : isTransfer ? "⇄ " : "−"}
                            {formatCurrency(item.amount, false)}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-slate-500 font-medium mt-0.5">
                            {catMeta.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════
            8. REUSABLE PAGINATION
           ══════════════════════════════════════════════════════════ */}
        {filteredAndSorted.length > 0 && (
          <section className="pt-2 px-1">
            <AppPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              totalItems={filteredAndSorted.length}
              pageSize={PAGE_SIZE}
              showSummary={true}
            />
          </section>
        )}

      </div>

      {/* ── BULK ACTION BAR ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1A1A]/95 dark:bg-slate-900/95 backdrop-blur-md text-white border border-white/10 dark:border-slate-700 rounded-full px-5 py-3 flex items-center gap-4 shadow-2xl min-w-[320px]"
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
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-[#1C1E23] rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto border-t border-black/[0.06] dark:border-white/[0.08] shadow-2xl flex flex-col gap-4 max-w-lg mx-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#E85024]" />
                  <h3 className="font-extrabold text-base text-[#18181B] dark:text-slate-100">Filter Transaksi</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-600 dark:text-slate-300 hover:bg-stone-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tipe Transaksi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tipe Transaksi</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "all", label: "Semua" },
                    { id: "income", label: "Masuk" },
                    { id: "expense", label: "Keluar" },
                    { id: "transfer", label: "Transfer" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleFilterChange(setTypeFilter, t.id)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        typeFilter === t.id
                          ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-stone-900 shadow-xs"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rekening / Dompet */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Rekening Bank / Dompet</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange(setBankFilter, "all")}
                    className={cn(
                      "p-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer border",
                      bankFilter === "all"
                        ? "border-[#E85024] bg-orange-50/50 dark:bg-orange-950/20 text-[#E85024]"
                        : "border-black/[0.04] dark:border-white/[0.06] bg-stone-50/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300"
                    )}
                  >
                    Semua Rekening
                  </button>
                  {bankAccounts.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleFilterChange(setBankFilter, b.id)}
                      className={cn(
                        "p-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer border flex items-center gap-2",
                        bankFilter === b.id
                          ? "border-[#E85024] bg-orange-50/50 dark:bg-orange-950/20 text-[#E85024]"
                          : "border-black/[0.04] dark:border-white/[0.06] bg-stone-50/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300"
                      )}
                    >
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori Transaksi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kategori</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => handleFilterChange(setCategoryFilter, "all")}
                    className={cn(
                      "py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center",
                      categoryFilter === "all"
                        ? "border-[#E85024] bg-orange-50/50 dark:bg-orange-950/20 text-[#E85024]"
                        : "border-black/[0.04] dark:border-white/[0.06] bg-stone-50/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300"
                    )}
                  >
                    Semua
                  </button>
                  {[...availableCategories.expense, ...availableCategories.income].map((c) => (
                    <button
                      key={`${c.type}-${c.slug}`}
                      type="button"
                      onClick={() => handleFilterChange(setCategoryFilter, c.slug)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 justify-center",
                        categoryFilter === c.slug
                          ? "border-[#E85024] bg-orange-50/50 dark:bg-orange-950/20 text-[#E85024]"
                          : "border-black/[0.04] dark:border-white/[0.06] bg-stone-50/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300"
                      )}
                    >
                      <AnimatedEmoji emoji={c.emoji} size={14} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Urutkan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Urutkan Berdasarkan</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "date_desc", label: "Terbaru" },
                    { id: "date_asc", label: "Terlama" },
                    { id: "amount_desc", label: "Nominal Terbesar" },
                    { id: "amount_asc", label: "Nominal Terkecil" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleFilterChange(setSortBy, s.id)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        sortBy === s.id
                          ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-stone-900 shadow-xs"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-4 pt-2 pb-4">
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

      {/* ── EDIT TRANSACTION MODAL ── */}
      <EditTransactionDialog
        open={editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
        onDelete={handleDelete}
      />

      {/* ── ADD TRANSACTION MODAL ── */}
      <TransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />
    </div>
  );
}
