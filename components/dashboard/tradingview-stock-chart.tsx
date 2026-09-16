"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

interface TradingViewStockChartProps {
  symbol: string; // e.g. "IDX:BBCA"
  chartType?: "area" | "candlesticks";
  height?: number | string;
}

export function TradingViewStockChart({
  symbol = "IDX:BBCA",
  chartType = "area",
  height = 220,
}: TradingViewStockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    container.appendChild(widgetContainer);

    const isDark = resolvedTheme === "dark";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;

    const widgetConfig = {
      symbols: [[symbol.replace("IDX:", ""), `${symbol}|1D`]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "id",
      colorTheme: isDark ? "dark" : "light",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: true,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, sans-serif",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: chartType === "candlesticks" ? "candlesticks" : "area",
      headerFontSize: "small",
      lineColor: "#E85024",
      bottomColor: isDark ? "rgba(232, 80, 36, 0.02)" : "rgba(232, 80, 36, 0)",
      topColor: isDark ? "rgba(232, 80, 36, 0.22)" : "rgba(232, 80, 36, 0.32)",
      isTransparent: true,
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      dateRanges: [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "all|1M",
      ],
    };

    script.innerHTML = JSON.stringify(widgetConfig);
    script.onload = () => {
      setLoading(false);
    };

    // Fallback timer to hide loader if script doesn't trigger onload immediately
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    container.appendChild(script);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [symbol, resolvedTheme, chartType]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-surface-muted/30 dark:bg-slate-900/40 border border-black/[0.04] dark:border-slate-800"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] transition-opacity">
          <Loader2 className="w-4 h-4 animate-spin text-[#E85024]" />
          <span className="text-[10px] font-medium text-stone-500 dark:text-slate-400">
            Memuat grafik IDX...
          </span>
        </div>
      )}
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  );
}
