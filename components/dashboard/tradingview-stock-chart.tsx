"use client";

import React, { useState, useEffect } from "react";
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
  height = 240,
}: TradingViewStockChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const cleanSymbol = symbol.replace("IDX:", "");

  const widgetConfig = {
    symbols: [[cleanSymbol, `${symbol}|1D`]],
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

  const iframeSrc = `https://s.tradingview.com/embed-widget/symbol-overview/?locale=id#${encodeURIComponent(
    JSON.stringify(widgetConfig)
  )}`;

  // Key unik untuk me-reset iframe secara bersih saat saham / theme / chart type berganti
  const iframeKey = `${symbol}-${chartType}-${isDark ? "dark" : "light"}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-surface-muted/30 dark:bg-slate-900/40 border border-black/[0.04] dark:border-slate-800"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {(!mounted || loading) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[2px] transition-opacity">
          <Loader2 className="w-4 h-4 animate-spin text-[#E85024]" />
          <span className="text-[10px] font-medium text-stone-500 dark:text-slate-400">
            Memuat grafik {cleanSymbol}...
          </span>
        </div>
      )}

      {mounted && (
        <iframe
          key={iframeKey}
          title={`TradingView Chart ${symbol}`}
          src={iframeSrc}
          className="w-full h-full border-0 block"
          style={{ width: "100%", height: "100%" }}
          onLoad={() => setLoading(false)}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}
    </div>
  );
}
