"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  CreditCard,
  PieChart,
  BarChart3,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    id: "transactions",
    label: "Activity",
    href: "/dashboard/transactions",
    icon: CreditCard,
  },
  {
    id: "budget",
    label: "Budget",
    href: "/dashboard/budget",
    icon: PieChart,
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
    if (item.id === "transactions") return pathname.startsWith("/dashboard/transactions");
    if (item.id === "budget") return pathname.startsWith("/dashboard/budget");
    if (item.id === "profile") return pathname.startsWith("/dashboard/profile");
    return false;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex lg:hidden pointer-events-none">
      <nav
        aria-label="Mobile Floating Navigation"
        className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-2xl border border-black/[0.06] flex items-center justify-between gap-1 max-w-sm"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex items-center justify-center cursor-pointer transition-transform active:scale-95 select-none"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <motion.div
                  layoutId="savor-bottom-nav-active"
                  className="bg-[#1A1A1A] text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                >
                  <Icon className="w-3.5 h-3.5 text-[#FAD170] stroke-[2.2]" />
                  <span className="text-white text-xs font-bold leading-none">{item.label}</span>
                </motion.div>
              ) : (
                <div className="p-2.5 rounded-full text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

