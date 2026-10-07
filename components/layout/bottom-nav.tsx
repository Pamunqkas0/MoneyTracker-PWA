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
    label: "Budget",
    href: "/dashboard/budget",
    icon: PiggyBank,
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
    if (item.id === "stats") return pathname.startsWith("/dashboard/transactions");
    if (item.id === "profile") return pathname.startsWith("/dashboard/profile");
    return false;
  };

  const handleAddClick = () => {
    triggerHaptic("medium");
    onAddClick?.();
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-5 sm:bottom-6 left-0 right-0 z-50 flex lg:hidden items-center justify-center px-4 pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 max-w-full">
        {/* Navigation Pill Capsule - Clean surface matching card base colors without gray */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]">
          {NAV_ITEMS.map((item) => {
            const isActive = getIsActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (!isActive) triggerHaptic("light");
                }}
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-all duration-300 select-none group",
                  isActive
                    ? "px-3.5 sm:px-4 py-2 sm:py-2.5"
                    : "w-9 h-9 sm:w-10 sm:h-10 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="floating-dock-active-pill"
                    className="absolute inset-0 bg-[#1A1A1A] dark:bg-white rounded-full shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <Icon
                    className={cn(
                      "transition-all duration-200",
                      isActive
                        ? "w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4] text-white dark:text-[#18181B]"
                        : "w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.9] text-stone-400 dark:text-slate-400 group-hover:text-stone-800 dark:group-hover:text-white"
                    )}
                  />
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs sm:text-[13px] font-black text-white dark:text-[#18181B] tracking-tight whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Separate Floating Action Button (+) */}
        <motion.button
          type="button"
          onClick={handleAddClick}
          whileTap={{ scale: 0.88, rotate: 90 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-gradient-to-tr from-[#FF5C28] to-[#E85024] hover:from-[#e84d1a] hover:to-[#d44319] text-white shadow-lg shadow-orange-500/35 hover:shadow-orange-500/50 flex items-center justify-center shrink-0 border border-white/20 active:shadow-md cursor-pointer select-none"
          aria-label="Tambah Transaksi"
          title="Tambah Transaksi"
        >
          <Plus className="w-6 h-6 stroke-[2.8]" />
        </motion.button>
      </div>
    </nav>
  );
}
