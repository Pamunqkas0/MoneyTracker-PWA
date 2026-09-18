"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── 1. ROOT MODAL ─────────────────────────────────────────── */
interface BentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  showHandle?: boolean;
}

const MAX_WIDTHS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
};

export function BentoModal({
  open,
  onOpenChange,
  children,
  className,
  maxWidth = "lg",
  showHandle = true,
}: BentoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={true}
        showHandle={false}
        className={cn(
          "p-0 overflow-hidden rounded-t-[32px] sm:rounded-[36px] bg-white dark:bg-[#15171C] border border-black/[0.04] dark:border-white/[0.08] shadow-2xl w-full mx-auto max-h-[92svh] sm:max-h-[88vh] flex flex-col text-[#18181B] dark:text-stone-100 transition-all duration-300",
          MAX_WIDTHS[maxWidth],
          className
        )}
      >
        {/* Grab Handle Bar (Mobile Drag Indicator) */}
        {showHandle && (
          <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full" />
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ── 2. MODAL HEADER ───────────────────────────────────────── */
interface BentoModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string; // e.g. "bg-[#FDD5C1]/70 text-[#E85024]"
  onClose?: () => void;
  className?: string;
}

export function BentoModalHeader({
  title,
  subtitle,
  icon,
  iconBgColor = "bg-[#FDD5C1]/70 text-[#E85024]",
  onClose,
  className,
}: BentoModalHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 sm:px-6 pt-3 sm:pt-4 pb-2 shrink-0", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-2xs shrink-0",
              iconBgColor
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-[#18181B] dark:text-white truncate">
            {title}
          </DialogTitle>
          {subtitle && (
            <DialogDescription className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate mt-0.5">
              {subtitle}
            </DialogDescription>
          )}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 ml-2"
          aria-label="Tutup modal"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}
    </div>
  );
}

/* ── 3. MODAL BANNER (SCAN STRUK / AI CALLOUT) ─────────────── */
interface BentoModalBannerProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onClick?: () => void;
  className?: string;
}

export function BentoModalBanner({
  title,
  subtitle,
  badgeText = "✨ AI",
  icon,
  actionText = "Foto →",
  onClick,
  className,
}: BentoModalBannerProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "mx-5 sm:mx-6 rounded-2xl p-3 bg-gradient-to-r from-orange-50/80 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/70 dark:border-orange-900/40 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer select-none",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#E85024] text-white flex items-center justify-center shadow-xs shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-[#18181B] dark:text-white truncate">{title}</span>
            {badgeText && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-orange-100 dark:bg-orange-900/60 text-[#E85024] dark:text-orange-300">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {actionText && (
        <span className="text-xs font-bold text-[#E85024] dark:text-orange-400 shrink-0 whitespace-nowrap">
          {actionText}
        </span>
      )}
    </div>
  );
}

/* ── 4. SEGMENTED PILL TABS ─────────────────────────────────── */
export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface BentoSegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  className?: string;
}

export function BentoSegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: BentoSegmentedTabsProps<T>) {
  return (
    <div className={cn("mx-5 sm:mx-6 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-full flex items-center gap-1 shadow-inner border border-black/[0.02] dark:border-white/[0.04]", className)}>
      {tabs.map((t) => {
        const isActive = activeTab === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer select-none",
              isActive
                ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            )}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── 5. MODAL BODY (SCROLLABLE) ────────────────────────────── */
export function BentoModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-y-auto custom-scrollbar px-5 sm:px-6 py-3 flex flex-col gap-4 flex-1 min-h-0", className)}>
      {children}
    </div>
  );
}

/* ── 6. MODAL FOOTER (FLOATING PRIMARY BUTTON) ─────────────── */
export function BentoModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 sm:p-5 pt-3 bg-white/95 dark:bg-[#15171C]/95 backdrop-blur-xs border-t border-black/[0.03] dark:border-white/[0.04] shrink-0", className)}>
      {children}
    </div>
  );
}
