"use client";

import React from "react";
import Link from "next/link";
import { Menu, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppTopHeaderProps {
  name?: string;
  username?: string;
  leftHref?: string;
  leftIcon?: "menu" | "back";
  leftAriaLabel?: string;
  rightHref?: string;
  rightAriaLabel?: string;
  className?: string;
}

export function AppTopHeader({
  name = "Fred",
  username = "@freddoe12",
  leftHref = "/dashboard",
  leftIcon = "menu",
  leftAriaLabel = "Kembali ke Dashboard",
  rightHref = "/dashboard/profile",
  rightAriaLabel = "Profil Pengguna",
  className,
}: AppTopHeaderProps) {
  const LeftIconComponent = leftIcon === "back" ? ArrowLeft : Menu;

  return (
    <div className={cn("flex items-center justify-between w-full select-none", className)}>
      {/* ── Sisi Kiri (Menu / Back Button) ── */}
      <Link
        href={leftHref}
        className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C1E23] border border-black/[0.06] dark:border-white/[0.06] shadow-xs flex items-center justify-center text-stone-800 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0"
        aria-label={leftAriaLabel}
      >
        <LeftIconComponent className="w-5 h-5 stroke-[2.2]" />
      </Link>

      {/* ── Bagian Tengah (Greeting & Handle) ── */}
      <div className="flex flex-col items-center text-center px-2 min-w-0">
        <h1 className="text-sm sm:text-base font-bold text-[#18181B] dark:text-slate-100 leading-tight truncate">
          Hello, {name}
        </h1>
        <span className="text-xs text-stone-400 dark:text-slate-400 font-medium leading-tight truncate mt-0.5">
          {username.startsWith("@") ? username : `@${username}`}
        </span>
      </div>

      {/* ── Sisi Kanan (User Profile Button) ── */}
      <Link
        href={rightHref}
        className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C1E23] border border-black/[0.06] dark:border-white/[0.06] shadow-xs flex items-center justify-center text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0"
        aria-label={rightAriaLabel}
      >
        <User className="w-5 h-5 stroke-[2.2]" />
      </Link>
    </div>
  );
}
