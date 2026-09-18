import React from "react";
import {
  Coins,
  Briefcase,
  TrendingUp,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Gamepad2,
  HeartPulse,
  Package,
  Coffee,
  GraduationCap,
  Heart,
  Sparkles,
  ShieldCheck,
  PiggyBank,
  Repeat,
  CreditCard,
  Tv,
  Film,
  Layers,
  Banknote,
  Smartphone,
  Flame,
} from "lucide-react";

export interface CategoryIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  darkBg: string;
  color: string;
  darkColor: string;
  badgeBg?: string;
  badgeText?: string;
}

export const CATEGORY_ICON_MAP: Record<string, CategoryIconConfig> = {
  salary: {
    icon: Coins,
    bg: "bg-[#FEF08A]/80",
    darkBg: "dark:bg-amber-950/60",
    color: "text-amber-800",
    darkColor: "dark:text-amber-300",
  },
  freelance: {
    icon: Briefcase,
    bg: "bg-[#E0E6FD]/80",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  investment: {
    icon: TrendingUp,
    bg: "bg-[#FEF08A]/80",
    darkBg: "dark:bg-amber-950/60",
    color: "text-amber-800",
    darkColor: "dark:text-amber-300",
  },
  crypto: {
    icon: TrendingUp,
    bg: "bg-[#FEF08A]/80",
    darkBg: "dark:bg-amber-950/60",
    color: "text-amber-800",
    darkColor: "dark:text-amber-300",
  },
  food: {
    icon: Utensils,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-[#E85024]",
    darkColor: "dark:text-rose-300",
  },
  groceries: {
    icon: ShoppingBag,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-[#E85024]",
    darkColor: "dark:text-rose-300",
  },
  shopping: {
    icon: ShoppingBag,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-[#E85024]",
    darkColor: "dark:text-rose-300",
  },
  transport: {
    icon: Car,
    bg: "bg-stone-100",
    darkBg: "dark:bg-slate-800",
    color: "text-stone-700",
    darkColor: "dark:text-slate-300",
  },
  bills: {
    icon: Zap,
    bg: "bg-[#FEF08A]/80",
    darkBg: "dark:bg-amber-950/60",
    color: "text-amber-800",
    darkColor: "dark:text-amber-300",
  },
  entertainment: {
    icon: Gamepad2,
    bg: "bg-[#E0E6FD]",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  subscription: {
    icon: CreditCard,
    bg: "bg-[#E0E6FD]",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  streaming: {
    icon: Tv,
    bg: "bg-[#E0E6FD]",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  health: {
    icon: HeartPulse,
    bg: "bg-[#DAEFEA]",
    darkBg: "dark:bg-teal-950/60",
    color: "text-teal-800",
    darkColor: "dark:text-teal-300",
  },
  coffee: {
    icon: Coffee,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-[#E85024]",
    darkColor: "dark:text-rose-300",
  },
  education: {
    icon: GraduationCap,
    bg: "bg-[#E0E6FD]",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  charity: {
    icon: Heart,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-[#E85024]",
    darkColor: "dark:text-rose-300",
  },
  selfcare: {
    icon: Sparkles,
    bg: "bg-[#DAEFEA]",
    darkBg: "dark:bg-teal-950/60",
    color: "text-teal-800",
    darkColor: "dark:text-teal-300",
  },
  emergency: {
    icon: ShieldCheck,
    bg: "bg-[#FFE2D9]",
    darkBg: "dark:bg-rose-950/60",
    color: "text-rose-800",
    darkColor: "dark:text-rose-300",
  },
  saving: {
    icon: PiggyBank,
    bg: "bg-[#D8F5A2]",
    darkBg: "dark:bg-emerald-950/60",
    color: "text-emerald-900",
    darkColor: "dark:text-emerald-300",
  },
  transfer: {
    icon: Repeat,
    bg: "bg-[#E0E6FD]",
    darkBg: "dark:bg-indigo-950/60",
    color: "text-indigo-800",
    darkColor: "dark:text-indigo-300",
  },
  other: {
    icon: Package,
    bg: "bg-stone-100",
    darkBg: "dark:bg-slate-800",
    color: "text-stone-700",
    darkColor: "dark:text-slate-300",
  },
};

export function getCategoryVectorIcon(slug: string, type?: string): CategoryIconConfig {
  const normalized = (slug || "").toLowerCase();
  
  if (CATEGORY_ICON_MAP[normalized]) {
    return CATEGORY_ICON_MAP[normalized];
  }

  // Keyword matchers for custom names
  if (normalized.includes("gaji") || normalized.includes("payroll") || normalized.includes("salary")) {
    return CATEGORY_ICON_MAP.salary;
  }
  if (normalized.includes("kopi") || normalized.includes("cafe") || normalized.includes("coffee")) {
    return CATEGORY_ICON_MAP.coffee;
  }
  if (normalized.includes("belanja") || normalized.includes("supermarket") || normalized.includes("grocer") || normalized.includes("shop")) {
    return CATEGORY_ICON_MAP.groceries;
  }
  if (normalized.includes("listrik") || normalized.includes("tagihan") || normalized.includes("bill") || normalized.includes("pln") || normalized.includes("pdam") || normalized.includes("utilit")) {
    return CATEGORY_ICON_MAP.bills;
  }
  if (normalized.includes("ojek") || normalized.includes("gojek") || normalized.includes("grab") || normalized.includes("transp") || normalized.includes("mobil") || normalized.includes("bensin")) {
    return CATEGORY_ICON_MAP.transport;
  }
  if (normalized.includes("kripto") || normalized.includes("crypto") || normalized.includes("invest") || normalized.includes("saham") || normalized.includes("yield")) {
    return CATEGORY_ICON_MAP.investment;
  }
  if (normalized.includes("langganan") || normalized.includes("sub") || normalized.includes("apple") || normalized.includes("netflix") || normalized.includes("card")) {
    return CATEGORY_ICON_MAP.subscription;
  }
  if (normalized.includes("makan") || normalized.includes("food") || normalized.includes("resto")) {
    return CATEGORY_ICON_MAP.food;
  }
  if (normalized.includes("transfer")) {
    return CATEGORY_ICON_MAP.transfer;
  }

  if (type === "income") {
    return {
      icon: Coins,
      bg: "bg-[#D8F5A2]/80",
      darkBg: "dark:bg-emerald-950/60",
      color: "text-emerald-900",
      darkColor: "dark:text-emerald-300",
    };
  }

  return CATEGORY_ICON_MAP.other;
}
