"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-black/[0.03] shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#DAEFEA] flex items-center justify-center text-teal-900 shadow-2xs shrink-0">
            <Palette className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#18181B]">Tampilan (Tema)</h3>
          </div>
        </div>
        <div className="h-14 bg-surface-muted/60 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const themes = [
    {
      id: "light",
      label: "Terang",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Gelap",
      icon: Moon,
    },
    {
      id: "system",
      label: "Sistem",
      icon: Laptop,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-black/[0.03] shadow-xs flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#DAEFEA] flex items-center justify-center text-teal-900 shadow-2xs shrink-0">
          <Palette className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#18181B]">Tampilan (Tema)</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Sesuaikan mode terang atau gelap sesuai kenyamanan Anda
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {themes.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer",
                isActive
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs scale-[1.02]"
                  : "bg-surface-muted/60 hover:bg-stone-100 text-stone-600 border-stone-200/80 hover:border-stone-300"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#D8F5A2]" : "text-stone-500")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

