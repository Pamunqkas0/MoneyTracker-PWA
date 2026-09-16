"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import { AddAccountDialog } from "@/components/dashboard/bank-accounts";
import type { BankAccountRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";
import type { FinancialSummary } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

interface LeftColumnBentoProps {
  summary: FinancialSummary;
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
  onAddAccountClick?: () => void;
}

// ── THEME RESOLVER PER BANK / E-WALLET ─────────────────────────────────
function getBankCardTheme(name: string = "", bankName: string = "") {
  const query = `${name} ${bankName}`.toLowerCase();

  // 1. Blu by BCA Digital
  if (query.includes("blu")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#00B4F0] via-[#009CD7] to-[#007EA7]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <circle cx="150" cy="150" r="100" stroke="white" strokeWidth="2" opacity="0.15" />
          <circle cx="150" cy="150" r="70" stroke="white" strokeWidth="2" opacity="0.2" />
          <circle cx="150" cy="150" r="40" stroke="white" strokeWidth="2" opacity="0.25" />
          <circle cx="150" cy="150" r="15" fill="white" opacity="0.2" />
          <circle cx="60" cy="120" r="8" fill="white" opacity="0.15" />
          <circle cx="110" cy="50" r="12" fill="white" opacity="0.15" />
        </svg>
      ),
    };
  }

  // 2. SeaBank
  if (query.includes("seabank") || query.includes("sea bank")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#FF7A50] via-[#FF5722] to-[#D83B0A]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" />
          </svg>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <path d="M0 160 C50 120, 100 200, 200 130 L200 200 L0 200 Z" fill="white" opacity="0.12" />
          <path d="M0 130 C70 80, 120 180, 200 100 L200 200 L0 200 Z" fill="white" opacity="0.1" />
          <path d="M0 90 C80 50, 130 140, 200 60 L200 200 L0 200 Z" fill="white" opacity="0.08" />
        </svg>
      ),
    };
  }

  // 3. Shopee / ShopeePay
  if (query.includes("shopee")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#FF5722] via-[#EE4D2D] to-[#BF2609]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 1L15 8L22 9L17 14L18 21L12 17.5L6 21L7 14L2 9L9 8L12 1Z" />
          </svg>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <rect x="90" y="90" width="80" height="80" rx="20" transform="rotate(45 130 130)" fill="white" opacity="0.12" />
          <rect x="110" y="110" width="40" height="40" rx="10" transform="rotate(45 130 130)" fill="white" opacity="0.15" />
          <circle cx="50" cy="150" r="18" fill="white" opacity="0.1" />
          <circle cx="160" cy="40" r="14" fill="white" opacity="0.1" />
        </svg>
      ),
    };
  }

  // 4. BCA
  if (query.includes("bca")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#0066B3] via-[#004E8C] to-[#003366]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-lg bg-amber-400/90 text-amber-950 flex items-center justify-center shadow-xs border border-amber-200">
          <div className="w-4 h-3 rounded-[3px] border border-amber-900/60 flex flex-col justify-between p-0.5">
            <div className="h-[1px] bg-amber-900/60 w-full" />
            <div className="h-[1px] bg-amber-900/60 w-full" />
          </div>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <path d="M30 200 C80 140, 120 170, 200 110" stroke="white" strokeWidth="18" opacity="0.12" />
          <path d="M70 200 C110 150, 150 170, 200 140" stroke="white" strokeWidth="12" opacity="0.1" />
          <circle cx="160" cy="160" r="70" stroke="white" strokeWidth="2" opacity="0.15" />
        </svg>
      ),
    };
  }

  // 5. Bank Jago
  if (query.includes("jago")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#FFD25A] via-[#FFBE1A] to-[#F5A600]",
      textColor: "text-[#18181B]",
      subTextColor: "text-stone-900/80",
      badgeBg: "bg-black/10 text-stone-900 border-black/10",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-[#1A1A1A] shadow-2xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" />
          </svg>
        </div>
      ),
      patternSvg: (
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="16" fill="#1A1A1A" opacity="0.8" />
          <path d="M100 100 L115 15 L85 15 Z" fill="#1A1A1A" opacity="0.75" />
          <path d="M100 100 L185 85 L185 115 Z" fill="#1A1A1A" opacity="0.75" />
          <path d="M100 100 L85 185 L115 185 Z" fill="#1A1A1A" opacity="0.75" />
          <path d="M100 100 L15 115 L15 85 Z" fill="#1A1A1A" opacity="0.75" />
          <path d="M100 100 L160 40 L140 20 Z" fill="#1A1A1A" opacity="0.55" />
          <path d="M100 100 L160 160 L140 180 Z" fill="#1A1A1A" opacity="0.55" />
          <path d="M100 100 L40 160 L20 140 Z" fill="#1A1A1A" opacity="0.55" />
          <path d="M100 100 L40 40 L60 20 Z" fill="#1A1A1A" opacity="0.55" />
        </svg>
      ),
    };
  }

  // 6. Mandiri
  if (query.includes("mandiri") || query.includes("livin")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#0D3680] via-[#082663] to-[#04173F]",
      textColor: "text-white",
      subTextColor: "text-amber-200/90",
      badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/30",
      emblem: (
        <div className="w-7 h-7 rounded-lg bg-amber-400/90 text-amber-950 flex items-center justify-center shadow-xs border border-amber-200">
          <div className="w-4 h-3 rounded-[3px] border border-amber-900/60 flex flex-col justify-between p-0.5">
            <div className="h-[1px] bg-amber-900/60 w-full" />
            <div className="h-[1px] bg-amber-900/60 w-full" />
          </div>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <path d="M20 180 C80 100, 140 120, 200 50" stroke="#FFC107" strokeWidth="14" opacity="0.2" />
          <path d="M60 200 C110 130, 160 140, 200 90" stroke="#FFC107" strokeWidth="8" opacity="0.15" />
          <circle cx="160" cy="160" r="60" stroke="white" strokeWidth="2" opacity="0.1" />
        </svg>
      ),
    };
  }

  // 7. GoPay
  if (query.includes("gopay") || query.includes("goto")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#00C22B] via-[#00AA13] to-[#007D0E]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs">
          <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <circle cx="160" cy="160" r="110" stroke="white" strokeWidth="2.5" opacity="0.12" />
          <circle cx="160" cy="160" r="80" stroke="white" strokeWidth="2.5" opacity="0.16" />
          <circle cx="160" cy="160" r="50" stroke="white" strokeWidth="2.5" opacity="0.2" />
          <circle cx="160" cy="160" r="20" fill="white" opacity="0.25" />
        </svg>
      ),
    };
  }

  // 8. DANA
  if (query.includes("dana")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#1195F5] via-[#108EE9] to-[#0A6EC2]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <path d="M0 150 C60 100, 100 180, 200 120" stroke="white" strokeWidth="16" opacity="0.12" />
          <path d="M0 110 C70 70, 120 140, 200 80" stroke="white" strokeWidth="10" opacity="0.1" />
          <circle cx="150" cy="150" r="60" stroke="white" strokeWidth="2" opacity="0.1" />
        </svg>
      ),
    };
  }

  // 9. Tunai / Cash
  if (query.includes("cash") || query.includes("tunai")) {
    return {
      bgStyle: "bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857]",
      textColor: "text-white",
      subTextColor: "text-white/85",
      badgeBg: "bg-white/20 text-white border-white/20",
      emblem: (
        <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white shadow-2xs backdrop-blur-xs font-bold text-xs">
          Rp
        </div>
      ),
      patternSvg: (
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <rect x="70" y="70" width="100" height="70" rx="10" stroke="white" strokeWidth="2" opacity="0.2" />
          <circle cx="120" cy="105" r="20" stroke="white" strokeWidth="2" opacity="0.2" />
          <path d="M0 160 C50 130, 100 180, 200 140" stroke="white" strokeWidth="8" opacity="0.15" />
        </svg>
      ),
    };
  }

  // Default fallback (Kuning Pastel Elegan)
  return {
    bgStyle: "bg-[#FAD170]",
    textColor: "text-[#18181B]",
    subTextColor: "text-stone-900",
    badgeBg: "bg-black/10 text-stone-900 border-black/10",
    emblem: (
      <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-[#1A1A1A] shadow-2xs">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" />
        </svg>
      </div>
    ),
    patternSvg: (
      <svg width="170" height="170" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="16" fill="#1A1A1A" opacity="0.85" />
        <path d="M100 100 L115 15 L85 15 Z" fill="#1A1A1A" opacity="0.8" />
        <path d="M100 100 L185 85 L185 115 Z" fill="#1A1A1A" opacity="0.8" />
        <path d="M100 100 L85 185 L115 185 Z" fill="#1A1A1A" opacity="0.8" />
        <path d="M100 100 L15 115 L15 85 Z" fill="#1A1A1A" opacity="0.8" />
        <path d="M100 100 L160 40 L140 20 Z" fill="#1A1A1A" opacity="0.6" />
        <path d="M100 100 L160 160 L140 180 Z" fill="#1A1A1A" opacity="0.6" />
        <path d="M100 100 L40 160 L20 140 Z" fill="#1A1A1A" opacity="0.6" />
        <path d="M100 100 L40 40 L60 20 Z" fill="#1A1A1A" opacity="0.6" />
      </svg>
    ),
  };
}

export function LeftColumnBento({
  summary,
  bankAccounts,
  availableCategories,
  onAddAccountClick,
}: LeftColumnBentoProps) {
  const totalBalance = summary?.totalBalance ?? 1222.0;

  // Preset Currency List dengan bendera SVG yang presisi
  const defaultCurrencies = useMemo(
    () => [
      {
        id: "curr-usd",
        name: "USD",
        bankName: "US Dollar",
        balanceDisplay: totalBalance > 0 ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "1,222.0",
        rawBalance: totalBalance > 0 ? totalBalance : 1222.0,
        currencySymbol: "$",
        accountNumber: "8899",
        expiry: "10/28",
        flag: (
          <svg className="w-5 h-5 rounded-full shrink-0 shadow-2xs" viewBox="0 0 32 32">
            <clipPath id="us-round"><circle cx="16" cy="16" r="16" /></clipPath>
            <g clipPath="url(#us-round)">
              <rect width="32" height="32" fill="#B22234" />
              <path d="M0 4.9h32v2.5H0zM0 9.8h32v2.5H0zM0 14.8h32v2.5H0zM0 19.7h32v2.5H0zM0 24.6h32v2.5H0zM0 29.5h32v2.5H0z" fill="#FFFFFF" />
              <rect width="14" height="15" fill="#3C3B6E" />
              <circle cx="4" cy="4" r="1" fill="#fff" />
              <circle cx="10" cy="4" r="1" fill="#fff" />
              <circle cx="7" cy="7.5" r="1" fill="#fff" />
              <circle cx="4" cy="11" r="1" fill="#fff" />
              <circle cx="10" cy="11" r="1" fill="#fff" />
            </g>
          </svg>
        ),
      },
      {
        id: "curr-gbp",
        name: "GBP",
        bankName: "British Pound",
        balanceDisplay: "021.0",
        rawBalance: 21.0,
        currencySymbol: "£",
        accountNumber: "4421",
        expiry: "09/27",
        flag: (
          <svg className="w-5 h-5 rounded-full shrink-0 shadow-2xs" viewBox="0 0 32 32">
            <clipPath id="gb-round"><circle cx="16" cy="16" r="16" /></clipPath>
            <g clipPath="url(#gb-round)">
              <rect width="32" height="32" fill="#012169" />
              <path d="M0 0l32 32m0-32L0 32" stroke="#fff" strokeWidth="4.5" />
              <path d="M0 0l32 32m0-32L0 32" stroke="#C8102E" strokeWidth="2.2" />
              <path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="7" />
              <path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="4.2" />
            </g>
          </svg>
        ),
      },
      {
        id: "curr-eur",
        name: "EUR",
        bankName: "Euro",
        balanceDisplay: "1201.02",
        rawBalance: 1201.02,
        currencySymbol: "€",
        accountNumber: "3319",
        expiry: "11/29",
        flag: (
          <svg className="w-5 h-5 rounded-full shrink-0 shadow-2xs" viewBox="0 0 32 32">
            <clipPath id="eu-round"><circle cx="16" cy="16" r="16" /></clipPath>
            <g clipPath="url(#eu-round)">
              <rect width="32" height="32" fill="#003399" />
              <circle cx="16" cy="6" r="1.2" fill="#FFCC00" />
              <circle cx="16" cy="26" r="1.2" fill="#FFCC00" />
              <circle cx="6" cy="16" r="1.2" fill="#FFCC00" />
              <circle cx="26" cy="16" r="1.2" fill="#FFCC00" />
              <circle cx="9" cy="9" r="1.2" fill="#FFCC00" />
              <circle cx="23" cy="9" r="1.2" fill="#FFCC00" />
              <circle cx="9" cy="23" r="1.2" fill="#FFCC00" />
              <circle cx="23" cy="23" r="1.2" fill="#FFCC00" />
            </g>
          </svg>
        ),
      },
    ],
    [totalBalance]
  );

  // Gabungkan user bank accounts
  const unifiedAccounts = useMemo(() => {
    if (!bankAccounts || bankAccounts.length === 0) {
      return defaultCurrencies;
    }

    return bankAccounts.map((acc) => {
      const isImg = acc.logo?.startsWith("/");
      const last4 = acc.account_number ? acc.account_number.slice(-4) : "8899";
      return {
        id: acc.id,
        name: acc.name,
        bankName: acc.bank_name || acc.name,
        balanceDisplay: formatCurrency(acc.balance, true),
        rawBalance: acc.balance,
        currencySymbol: "Rp",
        accountNumber: last4,
        expiry: "10/28",
        flag: isImg ? (
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
            <img src={acc.logo} alt={acc.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          <span className="text-base leading-none shrink-0">{acc.logo || "🏦"}</span>
        ),
      };
    });
  }, [bankAccounts, defaultCurrencies]);

  // Selected account state
  const [selectedId, setSelectedId] = useState<string>(() => unifiedAccounts[0]?.id || "curr-usd");
  const activeAccount = unifiedAccounts.find((item) => item.id === selectedId) || unifiedAccounts[0];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");

  const router = useRouter();

  // Active theme calculation
  const cardTheme = useMemo(() => {
    return getBankCardTheme(activeAccount.name, activeAccount.bankName);
  }, [activeAccount]);

  const handleAction = (type: "transfer" | "receive" | "budget" | "bills") => {
    if (type === "transfer") {
      setDialogType("expense");
      setDialogOpen(true);
    } else if (type === "receive") {
      setDialogType("income");
      setDialogOpen(true);
    } else if (type === "budget" || type === "bills") {
      router.push("/dashboard/budget");
    }
  };

  const handleOpenAddAccount = () => {
    if (onAddAccountClick) {
      onAddAccountClick();
    } else {
      setAddAccountOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ═════════ 1. TOP HORIZONTAL BANK/CURRENCY SWITCHER (Scrollable Row) ═════════ */}
      <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {unifiedAccounts.map((item) => {
          const isActive = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "rounded-2xl px-3.5 py-2 flex items-center gap-2 shrink-0 shadow-xs cursor-pointer transition-all duration-200 select-none",
                isActive
                  ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-950 scale-[1.02]"
                  : "bg-white dark:bg-slate-800/90 text-[#18181B] dark:text-slate-100 border border-black/[0.04] dark:border-slate-700/60 hover:bg-stone-50 dark:hover:bg-slate-800"
              )}
            >
              {item.flag}
              <div className="flex flex-col text-left leading-tight">
                <span
                  className={cn(
                    "text-[10px] font-bold tracking-tight",
                    isActive ? "text-stone-300 dark:text-slate-600" : "text-stone-500 dark:text-slate-400"
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={cn(
                    "text-xs font-black tabular-nums",
                    isActive ? "text-white dark:text-slate-950" : "text-stone-900 dark:text-slate-100"
                  )}
                >
                  {item.balanceDisplay}
                </span>
              </div>
            </button>
          );
        })}

        {/* Plus (+) Button to Add New Bank Account */}
        <button
          type="button"
          onClick={handleOpenAddAccount}
          className="rounded-2xl px-3 py-2 bg-white dark:bg-slate-800/90 text-stone-600 dark:text-slate-300 border border-dashed border-stone-300 dark:border-slate-700 hover:border-black/30 dark:hover:border-slate-500 hover:bg-stone-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shrink-0 shadow-2xs transition-all cursor-pointer"
          title="Tambah Rekening Baru"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-bold">Add</span>
        </button>
      </div>

      {/* ═════════ 2. DYNAMIC HERO BALANCE CARD (Per-Bank Variation) ═════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAccount.id}
          initial={{ opacity: 0.8, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.8, scale: 0.985 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "w-full relative rounded-[28px] sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-sm border border-black/[0.04] min-h-[190px] transition-colors duration-300",
            cardTheme.bgStyle,
            cardTheme.textColor
          )}
        >
          {/* Decorative Bank Specific Pattern / Watermark di sudut kanan bawah */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 translate-x-3 translate-y-3">
            {cardTheme.patternSvg}
          </div>

          {/* Baris Atas: Logo Bank/Bendera + Label "Balance" vs Watermark Emblem Kanan Atas */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeAccount.flag}
              <span className={cn("text-xs font-bold tracking-wider", cardTheme.subTextColor)}>
                {activeAccount.name} Balance
              </span>
            </div>

            {/* Emblem Kanan Atas */}
            {cardTheme.emblem}
          </div>

          {/* Nominal Saldo: Besar dan Tebal */}
          <div className="relative z-10 my-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums block">
              {activeAccount.currencySymbol === "Rp"
                ? formatCurrency(activeAccount.rawBalance)
                : `${activeAccount.currencySymbol}${activeAccount.balanceDisplay}`}
            </span>
          </div>

          {/* Baris Bawah: Masked Account Number & Expiry Badge */}
          <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
            <div className={cn("flex items-center gap-1 text-xs font-mono font-bold", cardTheme.subTextColor)}>
              <span className="text-base leading-none">•</span>
              <span>{activeAccount.accountNumber}</span>
            </div>
            <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider border shadow-2xs", cardTheme.badgeBg)}>
              {activeAccount.expiry}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ═════════ 3. SLIDE PAGINATION DOTS (Interaktif & Sinkron) ═════════ */}
      <div className="flex items-center justify-center gap-1.5 my-1">
        {unifiedAccounts.map((item) => {
          const isActive = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                isActive
                  ? "w-6 bg-[#1A1A1A] dark:bg-white"
                  : "w-1.5 bg-stone-300 dark:bg-slate-700 hover:bg-stone-400"
              )}
              title={item.name}
            />
          );
        })}
      </div>

      {/* ═════════ 4. QUICK ACTION 4-GRID BUTTONS (Transfer, Receive, Budget, Bills) ═════════ */}
      <div className="grid grid-cols-4 gap-2.5 my-1">
        {[
          { label: "Transfer", id: "transfer" as const, icon: ArrowRightLeft },
          { label: "Receive", id: "receive" as const, icon: ArrowDownLeft },
          { label: "Budget", id: "budget" as const, icon: PiggyBank },
          { label: "Bills", id: "bills" as const, icon: Receipt },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleAction(item.id)}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border border-black/[0.03] dark:border-slate-700/60 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-stone-800 dark:text-slate-200 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-surface-muted dark:bg-slate-700/80 flex items-center justify-center text-stone-700 dark:text-slate-200 group-hover:bg-[#1A1A1A] dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold leading-none text-stone-700 dark:text-slate-300 group-hover:text-stone-900 dark:group-hover:text-white">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═════════ 5. WALLET STATUS & PASTEL GREEN CARD (Full Width) ═════════ */}
      <div className="flex flex-col gap-2.5 mt-1">
        {/* Header Baris: Wallet status vs See all */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#18181B] dark:text-slate-100 tracking-tight">Wallet status</h2>
          <button
            type="button"
            onClick={handleOpenAddAccount}
            className="text-xs font-bold text-[#E85024] hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>

        {/* Kartu Hijau Pastel (bg-[#D8F5A2] Full Width) */}
        <div
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-3xl bg-[#D8F5A2] text-[#18181B] p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer border border-black/[0.03]"
        >
          {/* Pojok Atas: Badge Total Kiri vs Tombol Bulat Panah Kanan */}
          <div className="flex items-center justify-between relative z-10">
            <span className="px-2.5 py-1 rounded-full bg-white/80 text-[10px] font-bold text-stone-800 tracking-tight shadow-2xs">
              {bankAccounts && bankAccounts.length > 0
                ? `${bankAccounts.length} Rekening Aktif`
                : "Total Saldo"}
            </span>
            <div className="w-9 h-9 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-stone-800 font-bold transition-transform group-hover:scale-105">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Pojok Bawah: Saldo Tebal + % Pertumbuhan di Kiri vs Logo Rekening di Kanan */}
          <div className="flex items-end justify-between relative z-10 mt-3">
            <div>
              <div className="text-xl font-black text-[#18181B] tracking-tight tabular-nums">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                {summary?.balanceGrowth !== undefined && summary.balanceGrowth !== 0
                  ? `Pertumbuhan ${summary.balanceGrowth > 0 ? "+" : ""}${summary.balanceGrowth.toFixed(1)}%`
                  : "Total Saldo Bersih"}
              </p>
            </div>

            {/* Deretan Logo Bank/Dompet yang Terhubung */}
            <div className="flex items-center -space-x-1.5 pb-0.5">
              {bankAccounts && bankAccounts.length > 0 ? (
                bankAccounts.slice(0, 3).map((acc, idx) => (
                  <div
                    key={acc.id || idx}
                    className="w-6 h-6 rounded-full bg-white border-2 border-white shadow-xs flex items-center justify-center overflow-hidden text-[10px]"
                    title={acc.name}
                  >
                    {acc.logo?.startsWith("/") ? (
                      <img src={acc.logo} alt={acc.name} className="w-full h-full object-contain" />
                    ) : (
                      <span>{acc.logo || "🏦"}</span>
                    )}
                  </div>
                ))
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  Rp
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Dialog untuk Action Transfer/Receive */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />

      {/* Add Bank Account Dialog */}
      <AddAccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
      />
    </div>
  );
}
