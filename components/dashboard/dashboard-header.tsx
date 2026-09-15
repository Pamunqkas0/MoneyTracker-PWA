"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  PiggyBank,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  Info,
  Wifi,
  WifiOff,
  Menu,
  X,
} from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { TransactionDialog } from "@/components/layout/transaction-dialog";
import type { BankAccountRow, TransactionRow } from "@/lib/supabase/types";
import type { AvailableTransactionCategories } from "@/lib/supabase/queries";

interface DashboardHeaderProps {
  bankAccounts: BankAccountRow[];
  availableCategories: AvailableTransactionCategories;
  recentNotifications?: TransactionRow[];
}

export function DashboardHeader({
  bankAccounts,
  availableCategories,
  recentNotifications = [],
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setIsOnline(navigator.onLine);

    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    if (isNotifOpen || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen, isProfileOpen]);

  const openAddDialog = (type: "income" | "expense" = "expense") => {
    setDefaultType(type);
    setDialogOpen(true);
  };

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard" && false, // We'll keep Savings as the active primary dashboard tab matching reference
    },
    {
      label: "Savings",
      href: "/dashboard",
      icon: PiggyBank,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Statistic",
      href: "/dashboard/transactions",
      icon: BarChart3,
      isActive: pathname.startsWith("/dashboard/transactions"),
    },
    {
      label: "Analytics",
      href: "/dashboard/budget",
      icon: TrendingUp,
      isActive: pathname.startsWith("/dashboard/budget"),
    },
    {
      label: "More",
      href: "/dashboard/profile",
      icon: LayoutGrid,
      isActive: pathname.startsWith("/dashboard/profile"),
    },
  ];

  return (
    <>
      <header className="w-full flex items-center justify-between gap-3 sm:gap-6 py-1 select-none">
        {/* ═════════ 1. Logo & Brand (Sisi Kiri) ═════════ */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group transition-transform active:scale-95 shrink-0"
        >
          {/* SavOr Piggy Icon */}
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#E85024] shadow-sm shadow-brand-orange/20 text-white transition-all group-hover:shadow-md group-hover:scale-105">
            {/* Piggy silhouette SVG with coin */}
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Coin */}
              <circle cx="12" cy="4.5" r="2.5" fill="#FAD170" />
              <circle cx="12" cy="4.5" r="1.5" stroke="#1A1A1A" strokeWidth="0.6" fill="none" />
              {/* Pig body */}
              <path d="M19 10.5c-.2-1.5-1.2-2.8-2.6-3.4-.6-.2-1.2-.3-1.9-.3-.5 0-1 .1-1.5.3-.6-.8-1.5-1.3-2.5-1.5-.4-.1-.8-.1-1.2 0-2.1.4-3.8 2-4.2 4.1-.3.2-.6.5-.8.9l-1.3 2.1c-.2.3-.1.7.2.9.2.1.4.1.6 0l.9-.6c.1 1.2.6 2.3 1.5 3.1v2.5c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-1.2c.6.1 1.2.2 1.8.2.7 0 1.4-.1 2.1-.3v1.3c0 .6.4 1 1 1h1.5c.6 0 1-.4 1-1v-2.3c1.5-1.1 2.4-2.8 2.4-4.7 0-.7-.1-1.3-.4-1.9zm-9.5 2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
            </svg>
          </div>

          {/* SavOr Typography */}
          <div className="flex items-center">
            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
              Sav<span className="text-brand-orange">O</span>r
            </span>
          </div>
        </Link>

        {/* ═════════ 2. Pill Navigation Menu (Bagian Tengah - Khusus Desktop) ═════════ */}
        <nav
          aria-label="Desktop Top Navigation"
          className="hidden lg:flex items-center gap-1 rounded-full bg-surface-muted/70 dark:bg-slate-800/80 p-1.5 border border-black/[0.04] dark:border-slate-700/60 backdrop-blur-sm shadow-xs"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrentlyActive = item.isActive;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isCurrentlyActive
                    ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-slate-900 shadow-xs font-bold"
                    : "text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrentlyActive ? "text-pastel-yellow dark:text-brand-orange" : "text-stone-500 dark:text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ═════════ 2B. Mobile Greeting Center (Khusus Mobile) ═════════ */}
        <div className="flex lg:hidden items-center justify-center flex-1 min-w-0 px-2">
          <p className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-slate-100 truncate">
            Hello, Pamungkas 👋
          </p>
        </div>

        {/* ═════════ 3. User Controls & Notifications (Sisi Kanan) ═════════ */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Add Button (+) - Desktop Only */}
          <button
            onClick={() => openAddDialog("expense")}
            title="Tambah Transaksi Cepat"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-stone-700 dark:text-slate-200 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-brand-orange dark:hover:text-brand-orange hover:border-brand-orange/40 transition-all active:scale-95 cursor-pointer"
            aria-label="Tambah Transaksi"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Info / Status Button - Desktop Only */}
          <div className="relative group hidden sm:block">
            <button
              title={isMounted && !isOnline ? "Status: Offline" : "Status: Online"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-stone-600 dark:text-slate-300 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              aria-label="Status Jaringan"
            >
              {isMounted && !isOnline ? (
                <WifiOff className="h-4 w-4 text-rose-500" />
              ) : (
                <Info className="h-4 w-4 text-stone-600 dark:text-slate-300" />
              )}
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <span className="text-[10px] whitespace-nowrap font-medium px-2 py-1 rounded-md bg-stone-900 dark:bg-slate-800 text-white shadow-md border border-black/10 dark:border-slate-700">
                {isMounted && !isOnline ? "Koneksi Offline" : "Sistem Normal & Online"}
              </span>
            </div>
          </div>

          {/* Notification Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              aria-label="Notifikasi"
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-stone-600 dark:text-slate-300 shadow-xs hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-stone-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {recentNotifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-orange ring-2 ring-white dark:ring-slate-800" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-80 origin-top sm:origin-top-right rounded-3xl border border-black/[0.06] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl backdrop-blur-xl z-50"
                >
                  <div className="mb-3 flex items-center justify-between pb-2 border-b border-stone-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-900 dark:text-slate-100">Notifikasi Aktivitas</h3>
                      <span className="text-[10px] font-semibold text-brand-orange bg-pastel-peach/60 dark:bg-brand-orange/20 px-2 py-0.5 rounded-full">
                        24 Jam
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-500 dark:text-slate-400 bg-surface-muted dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {recentNotifications.length} Baru
                    </span>
                  </div>

                  <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-1">
                    {recentNotifications.length === 0 ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-stone-400 dark:text-slate-500">
                        <Bell className="h-7 w-7 opacity-30" />
                        <span className="text-xs font-medium">Belum ada aktivitas baru.</span>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => {
                        const isIncome = notif.type === "income";
                        const Icon = isIncome ? TrendingUp : TrendingDown;
                        return (
                          <div
                            key={notif.id}
                            className="group flex items-start gap-3 rounded-2xl border border-stone-100 dark:border-slate-800 bg-surface-muted/40 dark:bg-slate-800/50 p-2.5 transition-all hover:bg-surface-muted dark:hover:bg-slate-800"
                          >
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                                isIncome
                                  ? "bg-pastel-green dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                                  : "bg-pastel-peach dark:bg-rose-950/80 text-brand-orange dark:text-rose-300"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-stone-900 dark:text-slate-100">
                                {notif.name}
                              </p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span
                                  className={`text-xs font-extrabold ${
                                    isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-stone-900 dark:text-slate-200"
                                  }`}
                                >
                                  {isIncome ? "+" : "-"}
                                  {formatCurrency(notif.amount)}
                                </span>
                                <span className="text-[9px] text-stone-400 dark:text-slate-500">
                                  {formatDistanceToNow(new Date(notif.created_at), {
                                    addSuffix: true,
                                    locale: id,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar with Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="User profile menu"
              className="relative flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-tr from-amber-200 via-emerald-300 to-teal-400 p-[2px] shadow-xs">
                <div className="h-full w-full rounded-full bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  <span className="bg-gradient-to-br from-pastel-peach to-pastel-yellow text-stone-900 w-full h-full flex items-center justify-center font-black">
                    P
                  </span>
                </div>
              </div>
              {/* Online Indicator Dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2.5 w-56 origin-top-right rounded-3xl border border-black/[0.06] dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50"
                >
                  <div className="px-3 py-2.5 border-b border-stone-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-stone-900 dark:text-slate-100">Pamungkas</p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">user@moneytracker.app</p>
                  </div>

                  <div className="py-1 flex flex-col gap-0.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-stone-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
                      Profil & Pengaturan
                    </Link>
                    <Link
                      href="/dashboard/budget"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-stone-700 dark:text-slate-200 hover:bg-surface-muted dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white transition-colors"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-stone-500 dark:text-slate-400" />
                      Target Anggaran
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-stone-100 dark:border-slate-800">
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                        Keluar Akun
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Modal Dialog Tambah Transaksi */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={defaultType}
        bankAccounts={bankAccounts}
        availableCategories={availableCategories}
      />
    </>
  );
}

