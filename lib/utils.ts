import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, compact = false): string {
  // Gunakan format manual agar server (Node.js) dan browser menghasilkan
  // string yang IDENTIK — mencegah React hydration mismatch.
  // Intl.NumberFormat("id-ID") menghasilkan spasi berbeda antar runtime.
  if (compact && amount >= 1_000_000_000) {
    return (amount < 0 ? "-Rp " : "Rp ") + (Math.abs(amount) / 1_000_000_000).toFixed(1).replace(".", ",") + " M";
  }
  if (compact && amount >= 1_000_000) {
    return (amount < 0 ? "-Rp " : "Rp ") + (Math.abs(amount) / 1_000_000).toFixed(1).replace(".", ",") + " Jt";
  }
  if (compact && amount >= 1_000) {
    return (amount < 0 ? "-Rp " : "Rp ") + (Math.abs(amount) / 1_000).toFixed(0) + " Rb";
  }
  // Format penuh: pisahkan ribuan dengan titik, ganti koma desimal
  const parts = Math.abs(Math.round(amount)).toString().split("");
  const thousands: string[] = [];
  parts.reverse().forEach((d, i) => {
    if (i > 0 && i % 3 === 0) thousands.push(".");
    thousands.push(d);
  });
  const formatted = thousands.reverse().join("");
  return (amount < 0 ? "-Rp " : "Rp ") + formatted;
}


export function formatDate(dateStr: string, fmt = "dd MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: id });
  } catch {
    return dateStr;
  }
}

export function daysUntil(dateStr: string): number {
  try {
    const target = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(target, today);
  } catch {
    return 0;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export function getTrendColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-rose-500";
  return "text-slate-400";
}

export function getTrendBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
}
