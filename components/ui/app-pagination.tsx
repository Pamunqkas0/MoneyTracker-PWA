"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  totalItems?: number;
  pageSize?: number;
  showSummary?: boolean;
  className?: string;
}

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  totalItems,
  pageSize,
  showSummary = false,
  className,
}: AppPaginationProps) {
  // Generate page numbers with smart ellipsis
  const paginationRange = useMemo(() => {
    // Total page numbers to show = siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount * 2 + 5;

    // Case 1: If total pages is less than page numbers we want to show
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No left dots to show, but right dots to be shown
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    // Case 3: No right dots to show, but left dots to be shown
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    // Case 4: Both left and right dots to be shown
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages, siblingCount, currentPage]);

  if (totalPages <= 1 && !showSummary) return null;

  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 w-full select-none py-1",
        !showSummary && "justify-center",
        className
      )}
    >
      {/* Optional Summary (Left) */}
      {showSummary && totalItems !== undefined && startItem !== undefined && endItem !== undefined && (
        <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
          Menampilkan <span className="font-bold text-[#18181B] dark:text-slate-200">{startItem}–{endItem}</span> dari{" "}
          <span className="font-bold text-[#18181B] dark:text-slate-200">{totalItems}</span> data
        </p>
      )}

      {/* Pagination Controls Pill Container */}
      {totalPages > 1 && (
        <nav
          aria-label="Navigasi Halaman"
          className="flex items-center gap-1.5 sm:gap-2 bg-white/80 dark:bg-[#1C1E23]/80 backdrop-blur-xs p-1 sm:p-1.5 rounded-full border border-black/[0.04] dark:border-white/[0.06] shadow-2xs"
        >
          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 text-stone-700 dark:text-slate-300 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.4]" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {paginationRange.map((pageNumber, idx) => {
              if (pageNumber === "...") {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="w-7 h-8 sm:h-9 flex items-center justify-center text-stone-400 dark:text-slate-500 font-bold text-xs sm:text-sm tracking-widest select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = pageNumber === currentPage;

              return (
                <button
                  key={`page-${pageNumber}`}
                  type="button"
                  onClick={() => onPageChange(pageNumber as number)}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer shrink-0",
                    isCurrent
                      ? "bg-[#1A1A1A] dark:bg-white text-white dark:text-stone-900 shadow-xs"
                      : "text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/80"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-100/90 dark:bg-slate-800 text-stone-700 dark:text-slate-300 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Halaman selanjutnya"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.4]" />
          </button>
        </nav>
      )}
    </div>
  );
}
