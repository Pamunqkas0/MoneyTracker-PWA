"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import type { BankAccountRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";
import type { FinancialSummary } from "@/lib/types";

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
  // State mata uang aktif (default USD)
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "GBP" | "EUR" | "CAD">("USD");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");

  const totalBalance = summary?.totalBalance ?? 1222.0;

  // Preset Currency List dengan bendera SVG yang presisi
  const currencies = [
    {
      code: "USD" as const,
      balance: totalBalance > 0 ? totalBalance.toFixed(1) : "1,222.0",
      fullName: "US Dollar",
      symbol: "$",
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
      code: "GBP" as const,
      balance: "021.0",
      fullName: "British Pound",
      symbol: "£",
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
      code: "EUR" as const,
      balance: "1201.02",
      fullName: "Euro",
      symbol: "€",
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
      code: "CAD" as const,
      balance: "3820.78",
      fullName: "Canadian Dollar",
      symbol: "C$",
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
  ];

  const activeCurrencyData = currencies.find((c) => c.code === selectedCurrency) || currencies[0];

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

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ═════════ 1. TOP SECTION: CURRENCY LIST & HERO CARD ═════════ */}
      <div className="grid grid-cols-12 gap-3 p-2.5 sm:p-3 rounded-[32px] bg-white border border-black/[0.03] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        {/* Sisi Kiri: Mini List Mata Uang (5 Kolom) */}
        <div className="col-span-5 sm:col-span-4 lg:col-span-5 flex flex-col justify-between gap-1.5 p-1 rounded-2xl">
          {currencies.map((curr) => {
            const isActive = selectedCurrency === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => setSelectedCurrency(curr.code)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-2xl transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? "bg-[#1A1A1A] text-white shadow-sm scale-[1.02]"
                    : "bg-transparent text-stone-700 hover:bg-stone-200/50"
                }`}
              >
                {curr.flag}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span
                    className={`text-[10px] font-bold tracking-tight ${
                      isActive ? "text-stone-300" : "text-stone-500"
                    }`}
                  >
                    {curr.code}
                  </span>
                  <span
                    className={`text-xs font-black truncate tabular-nums ${
                      isActive ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {curr.balance}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sisi Kanan: Hero Card Saldo (Pastel Kuning SavOr - 7 Kolom) */}
        <div className="col-span-7 sm:col-span-8 lg:col-span-7 relative rounded-[28px] bg-[#FAD170] text-[#18181B] p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-xs border border-black/[0.03] min-h-[175px]">
          {/* Decorative Windmill / Geometric Watermark di sudut kanan bawah */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-60 translate-x-3 translate-y-3">
            <svg width="140" height="140" viewBox="0 0 200 200" fill="none">
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

          {/* Top Row: Mini Flag / Currency Label + Watermark Symbol */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {activeCurrencyData.flag}
              <span className="text-[11px] font-bold text-stone-800 tracking-wider">
                {activeCurrencyData.code}
              </span>
            </div>

            {/* Small decorative emblem top-right */}
            <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-[#1A1A1A]">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" />
              </svg>
            </div>
          </div>

          {/* Center: Main Balance */}
          <div className="relative z-10 my-auto">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1A1A1A] tracking-tight tabular-nums block">
              {activeCurrencyData.symbol}
              {activeCurrencyData.code === "USD"
                ? totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })
                : activeCurrencyData.balance}
            </span>
          </div>

          {/* Bottom Row: Masked card number & Expiry badge */}
          <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-stone-800">
              <span className="text-base leading-none">•</span>
              <span>8899</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-black/10 text-[10px] font-bold font-mono text-stone-800 tracking-wider">
              10/28
            </span>
          </div>
        </div>
      </div>

      {/* ═════════ 2. QUICK ACTION BUTTONS (4 Tombol: Transfer, Receive, Convert, Bills) ═════════ */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
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
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border border-black/[0.04] shadow-xs hover:bg-stone-50 hover:border-black/[0.08] hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-95 group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-muted flex items-center justify-center mb-1 text-stone-700 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold text-stone-700 group-hover:text-stone-900 leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═════════ 3. MY PORTFOLIO / ACCOUNT BREAKDOWN SECTION ═════════ */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-bold text-[#18181B] tracking-tight">My Portfolio</h2>
          <button
            onClick={() => onAddAccountClick?.()}
            className="text-[11px] font-semibold text-stone-500 hover:text-brand-orange transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <span>Manage</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* 2 Side-by-side Pastel Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Pastel Green (Lime Soft) */}
          <div className="rounded-[24px] bg-[#D8F5A2] text-[#18181B] p-3.5 sm:p-4 flex flex-col justify-between min-h-[135px] border border-black/[0.03] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-stone-800 tracking-tight">
                $2300,99
              </span>
              <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-stone-900">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-base sm:text-lg font-black text-stone-900 tracking-tight tabular-nums">
                $582.00
              </div>
              <div className="flex items-center justify-between mt-1 gap-1">
                <span className="text-[10px] font-bold text-emerald-800">
                  24h +12,23%
                </span>
                {/* Mini Badges (EUR, USD, CAD) */}
                <div className="flex items-center -space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                    €
                  </span>
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                    $
                  </span>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[7px] font-bold flex items-center justify-center border border-white">
                    C$
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pastel Peach (Soft Peach) */}
          <div className="rounded-[24px] bg-[#FDD5C1] text-[#18181B] p-3.5 sm:p-4 flex flex-col justify-between min-h-[135px] border border-black/[0.03] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-stone-800 tracking-tight">
                $434.00
              </span>
              <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-stone-900">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-base sm:text-lg font-black text-stone-900 tracking-tight tabular-nums">
                $1,210.00
              </div>
              <div className="flex items-center justify-between mt-1 gap-1">
                <span className="text-[10px] font-bold text-emerald-800">
                  24h +12,23%
                </span>
                {/* Mini Badges (Crypto: Bitcoin, Tether, etc.) */}
                <div className="flex items-center -space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                    ₿
                  </span>
                  <span className="w-4 h-4 rounded-full bg-teal-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                    ₮
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: + Add portfolio / Add bank account */}
        <button
          onClick={() => (onAddAccountClick ? onAddAccountClick() : setDialogOpen(true))}
          className="w-full py-4 rounded-[24px] border-2 border-dashed border-stone-200/90 bg-white/40 hover:bg-white hover:border-brand-orange/60 transition-all duration-200 flex items-center justify-center gap-2 text-stone-600 hover:text-brand-orange cursor-pointer group shadow-2xs"
        >
          <div className="w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-stone-700 group-hover:bg-brand-orange group-hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold tracking-tight">Add portfolio</span>
        </button>
      </div>

      {/* Transaction Dialog untuk Action Transfer/Receive */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />
    </div>
  );
}
