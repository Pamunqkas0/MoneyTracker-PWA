"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type TactileIconVariant = "lime" | "peach" | "yellow" | "blue" | "cyan" | "white" | "dark";
export type TactileIconShape = "squircle" | "circle";
export type TactileIconSize = "sm" | "md" | "lg" | "xl";

interface TactileIconBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TactileIconVariant;
  shape?: TactileIconShape;
  size?: TactileIconSize;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<TactileIconVariant, string> = {
  lime: "bg-[#D8F5A2] dark:bg-[#1B380A] text-[#166534] dark:text-[#D6F49E] border-[#C2E884]/60 dark:border-emerald-700/40",
  peach: "bg-[#FDD5C1] dark:bg-[#3B221A] text-[#E85024] dark:text-[#FAD5C8] border-[#F7BC9E]/60 dark:border-rose-700/40",
  yellow: "bg-[#FAD170] dark:bg-[#3D2E0A] text-[#854D0E] dark:text-[#FEF08A] border-[#E8BF53]/60 dark:border-amber-700/40",
  blue: "bg-[#E0E6FD] dark:bg-[#1E2342] text-[#3730A3] dark:text-[#DDE3FA] border-[#C5D0F8]/60 dark:border-indigo-700/40",
  cyan: "bg-[#DAEFEA] dark:bg-[#132E35] text-[#155E75] dark:text-[#86D9E6] border-[#B9E0D7]/60 dark:border-cyan-700/40",
  white: "bg-white dark:bg-[#1F2937] text-[#18181B] dark:text-white border-black/[0.05] dark:border-white/[0.08]",
  dark: "bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] border-white/10 dark:border-black/10",
};

const SIZE_STYLES: Record<TactileIconSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
};

export function TactileIconBadge({
  variant = "lime",
  shape = "squircle",
  size = "lg",
  children,
  className,
  ...props
}: TactileIconBadgeProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center border select-none",
        shape === "squircle" ? "rounded-2xl" : "rounded-full",
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        "shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-[inset_0_1.5px_0.5px_rgba(255,255,255,0.75),inset_0_-1.5px_1px_rgba(0,0,0,0.08)]",
        "dark:before:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">{children}</span>
    </div>
  );
}
