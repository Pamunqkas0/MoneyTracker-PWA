"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  PiggyBank,
  Plus,
  BarChart3,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    id: "savings",
    label: "Savings",
    href: "/dashboard/budget",
    icon: PiggyBank,
  },
  {
    id: "add",
    label: "Add",
    href: "#",
    icon: Plus,
  },
  {
    id: "stats",
    label: "Stats",
    href: "/dashboard/transactions",
    icon: BarChart3,
  },
  {
    id: "profile",
    label: "More",
    href: "/dashboard/profile",
    icon: LayoutGrid,
  },
];

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  const getIsActive = (item: NavItem) => {
    if (item.id === "home") return pathname === "/dashboard";
    if (item.id === "savings") return pathname.startsWith("/dashboard/budget");
    if (item.id === "add") return false;
    if (item.id === "stats") return pathname.startsWith("/dashboard/transactions");
    if (item.id === "profile") return pathname.startsWith("/dashboard/profile");
    return false;
  };

  const handleAddClick = () => {
    triggerHaptic("medium");
    onAddClick?.();
  };

  return (
    <div className="fixed bottom-safe-nav left-1/2 -translate-x-1/2 z-50 flex lg:hidden pointer-events-none w-full justify-center px-4">
      <nav
        aria-label="Mobile Floating Navigation"
        className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[30px] sm:rounded-full p-2 sm:p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-black/[0.07] dark:border-slate-800 flex items-center justify-between gap-1.5 w-full max-w-[410px] transition-colors"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;

          if (item.id === "add") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={handleAddClick}
                className="relative flex items-center justify-center cursor-pointer transition-transform active:scale-90 select-none w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E85024] hover:bg-[#d44319] text-white shadow-lg shadow-orange-500/25 mx-1 shrink-0"
                aria-label="Tambah Transaksi"
                title="Tambah Transaksi"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                if (!isActive) triggerHaptic("light");
              }}
              className="relative flex items-center justify-center cursor-pointer transition-transform active:scale-95 select-none"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <motion.div
                  layoutId="savor-bottom-nav-active"
                  className="bg-[#1A1A1A] text-white dark:bg-white dark:text-slate-950 px-4 sm:px-4.5 py-2.5 sm:py-2.5 rounded-[22px] sm:rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FAD170] dark:text-[#E85024] stroke-[2.4]" />
                  <span className="text-white dark:text-slate-950 text-xs sm:text-sm font-black tracking-tight leading-none">
                    {item.label}
                  </span>
                </motion.div>
              ) : (
                <div className="p-3 sm:p-3.5 rounded-[22px] sm:rounded-full text-stone-600 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-slate-800/80 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
