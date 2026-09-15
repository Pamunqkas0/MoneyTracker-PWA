"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  RefreshCw,
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
      {
        id: "curr-cad",
        name: "CAD",
        balanceDisplay: "3820.78",
        rawBalance: 3820.78,
        currencySymbol: "C$",
        accountNumber: "9102",
        expiry: "04/28",
        flag: (
          <svg className="w-5 h-5 rounded-full shrink-0 shadow-2xs" viewBox="0 0 32 32">
            <clipPath id="ca-round"><circle cx="16" cy="16" r="16" /></clipPath>
            <g clipPath="url(#ca-round)">
              <rect width="32" height="32" fill="#FF0000" />
              <rect x="8" width="16" height="32" fill="#FFFFFF" />
              <path
                d="M16 9l1.5 3.5 2.5-.8-1.2 2.5 3 1.2-3.2 2 1 3.5-3.6-1.5-.5 3.5-.5-3.5-3.6 1.5 1-3.5-3.2-2 3-1.2-1.2-2.5 2.5.8z"
                fill="#FF0000"
              />
            </g>
          </svg>
        ),
      },
    ],
    [totalBalance]
  );

  // Gabungkan user bank accounts dengan currency presets
  const unifiedAccounts = useMemo(() => {
    if (!bankAccounts || bankAccounts.length === 0) {
      return defaultCurrencies;
    }

    const bankItems = bankAccounts.map((acc) => {
      const isImg = acc.logo?.startsWith("/");
      const last4 = acc.account_number ? acc.account_number.slice(-4) : "8899";
      return {
        id: acc.id,
        name: acc.name,
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

    return [...bankItems, ...defaultCurrencies];
  }, [bankAccounts, defaultCurrencies]);

  // Selected account state
  const [selectedId, setSelectedId] = useState<string>(() => unifiedAccounts[0]?.id || "curr-usd");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");

  const activeAccount = unifiedAccounts.find((item) => item.id === selectedId) || unifiedAccounts[0];

  const handleAction = (type: "transfer" | "receive" | "convert" | "bills") => {
    if (type === "transfer") {
      setDialogType("expense");
      setDialogOpen(true);
    } else if (type === "receive") {
      setDialogType("income");
      setDialogOpen(true);
    } else if (type === "bills") {
      setDialogType("expense");
      setDialogOpen(true);
    } else {
      setDialogType("expense");
      setDialogOpen(true);
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

      {/* ═════════ 2. HERO BALANCE CARD (Pastel Kuning Full Width) ═════════ */}
      <div className="w-full relative rounded-[28px] sm:rounded-3xl bg-[#FAD170] text-[#18181B] p-5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-sm border border-black/[0.03] dark:border-amber-400/20 min-h-[190px]">
        {/* Decorative Windmill / Geometric Watermark di sudut kanan bawah */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 translate-x-4 translate-y-4">
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
        </div>

        {/* Baris Atas: Logo Bank/Bendera + Label "Balance" vs Watermark Emblem di Kanan Atas */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeAccount.flag}
            <span className="text-xs font-bold text-stone-900 tracking-wider">
              {activeAccount.name} Balance
            </span>
          </div>

          {/* Small decorative emblem top-right */}
          <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-[#1A1A1A] shadow-2xs">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" />
            </svg>
          </div>
        </div>

        {/* Nominal Saldo: Besar dan Tebal */}
        <div className="relative z-10 my-3">
          <span className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight tabular-nums block">
            {activeAccount.currencySymbol !== "Rp" && activeAccount.currencySymbol}
            {activeAccount.balanceDisplay}
          </span>
        </div>

        {/* Baris Bawah: Masked Account Number & Expiry Badge */}
        <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-stone-900">
            <span className="text-base leading-none">•</span>
            <span>{activeAccount.accountNumber}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-black/10 text-[11px] font-bold font-mono text-stone-900 tracking-wider">
            {activeAccount.expiry}
          </span>
        </div>
      </div>

      {/* ═════════ 3. SLIDE PAGINATION DOTS (Di Bawah Kartu Kuning) ═════════ */}
      <div className="flex items-center justify-center gap-1.5 my-1">
        <span className="w-6 h-1 rounded-full bg-[#1A1A1A] dark:bg-slate-100" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-slate-700" />
      </div>

      {/* ═════════ 4. QUICK ACTION 4-GRID BUTTONS (Transfer, Receive, Convert, Bills) ═════════ */}
      <div className="grid grid-cols-4 gap-2.5 my-1">
        {[
          { label: "Transfer", id: "transfer" as const, icon: ArrowRightLeft },
          { label: "Receive", id: "receive" as const, icon: ArrowDownLeft },
          { label: "Convert", id: "convert" as const, icon: RefreshCw },
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
              ${totalBalance > 0 ? (totalBalance * 1.88).toFixed(2) : "2309,99"}
            </span>
            <div className="w-9 h-9 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-stone-800 font-bold transition-transform group-hover:scale-105">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Pojok Bawah: Saldo Tebal + % Gain di Kiri vs 3 Koin Bertumpuk di Kanan */}
          <div className="flex items-end justify-between relative z-10 mt-3">
            <div>
              <div className="text-xl font-black text-[#18181B] tracking-tight tabular-nums">
                ${totalBalance > 0 ? (totalBalance * 0.48).toFixed(2) : "582.00"}
              </div>
              <p className="text-[11px] font-bold text-stone-700 mt-0.5">
                24h +12,23%
              </p>
            </div>

            {/* Deretan 3 Koin Bertumpuk (Stacked Pills: Oranye €, Biru $, Hijau C$) */}
            <div className="flex items-center -space-x-1.5 pb-0.5">
              <span className="w-5 h-5 rounded-full bg-[#E85024] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                €
              </span>
              <span className="w-5 h-5 rounded-full bg-[#3B4CCA] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                $
              </span>
              <span className="w-5 h-5 rounded-full bg-[#2E7D32] text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                C$
              </span>
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

