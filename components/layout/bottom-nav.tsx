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
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-between w-full bg-[#F7F4EE]/92 dark:bg-[#0b0f1a]/92 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.08] pt-1.5 pb-[max(10px,env(safe-area-inset-bottom,0px))] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors"
    >
      <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;

          if (item.id === "add") {
            return (
              <div key={item.id} className="flex flex-col items-center justify-center">
                <motion.button
                  type="button"
                  onClick={handleAddClick}
                  whileTap={{ scale: 0.88, rotate: 45 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative flex flex-col items-center justify-center -mt-5 cursor-pointer select-none group"
                  aria-label="Tambah Transaksi"
                  title="Tambah Transaksi"
                >
                  <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-[#E85024] to-[#f97316] text-white shadow-lg shadow-orange-500/35 flex items-center justify-center transition-shadow border-[2.5px] border-[#F7F4EE] dark:border-[#0b0f1a] group-hover:shadow-orange-500/50">
                    <Plus className="w-5 h-5 stroke-[3] transition-transform duration-200" />
                  </div>
                  <span className="text-[9.5px] font-bold text-stone-500 dark:text-slate-400 mt-0.5 tracking-tight">
                    Add
                  </span>
                </motion.button>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                if (!isActive) triggerHaptic("light");
              }}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none group"
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="relative flex flex-col items-center justify-center w-full"
              >
                {/* Compact Animated sliding background pill */}
                <div className="relative flex items-center justify-center w-10 h-7 rounded-full">
                  {isActive && (
                    <motion.div
                      layoutId="savor-dock-active-pill"
                      className="absolute inset-0 bg-[#E85024]/12 dark:bg-[#E85024]/20 rounded-full border border-[#E85024]/20"
                      transition={{
                        type: "spring",
                        stiffness: 480,
                        damping: 32,
                      }}
                    />
                  )}

                  {/* Animated bouncing icon */}
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.15, 1] : 1,
                      y: isActive ? [0, -1.5, 0] : 0,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className={cn(
                      "relative z-10 transition-colors",
                      isActive
                        ? "text-[#E85024] dark:text-[#E85024]"
                        : "text-stone-500 dark:text-slate-400 group-hover:text-stone-900 dark:group-hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform",
                        isActive ? "stroke-[2.5]" : "stroke-[2]"
                      )}
                    />
                  </motion.div>
                </div>

                {/* Tab Label */}
                <motion.span
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "text-[10px] tracking-tight transition-colors leading-tight mt-0.5",
                    isActive
                      ? "font-black text-[#E85024] dark:text-[#E85024]"
                      : "font-medium text-stone-500 dark:text-slate-400 group-hover:text-stone-800 dark:group-hover:text-slate-200"
                  )}
                >
                  {item.label}
                </motion.span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
