"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80 px-4 py-3 bg-[#13161C] rounded-b-2xl",
        className
      )}
    >
      {/* Indikator Info Baris */}
      <div className="text-xs text-zinc-400">
        Menampilkan{" "}
        <span className="font-semibold text-zinc-200">
          {start} - {end}
        </span>{" "}
        dari <span className="font-semibold text-zinc-200">{totalItems}</span> riwayat
      </div>

      {/* Navigasi Tombol Halaman */}
      <div className="flex items-center gap-1">
        {/* Prev Button (Min touch target 44px on mobile) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex min-h-[38px] min-w-[38px] sm:min-h-[34px] sm:min-w-[34px] items-center justify-center rounded-lg border border-zinc-800 bg-[#181B22] text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Numbered Buttons */}
        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs text-zinc-600 select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "flex min-h-[38px] min-w-[38px] sm:min-h-[34px] sm:min-w-[34px] items-center justify-center rounded-lg text-xs font-semibold transition",
                isActive
                  ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                  : "border border-zinc-800 bg-[#181B22] text-zinc-300 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex min-h-[38px] min-w-[38px] sm:min-h-[34px] sm:min-w-[34px] items-center justify-center rounded-lg border border-zinc-800 bg-[#181B22] text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
