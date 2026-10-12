"use client";

import React from "react";
import { Calendar, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const YEARS = [2024, 2025, 2026, 2027];

interface DatePeriodFilterProps {
  selectedMonth?: number; // 1-12 or undefined
  selectedYear?: number; // 2024-2027 or undefined
  onChange: (month?: number, year?: number) => void;
  className?: string;
}

export function DatePeriodFilter({
  selectedMonth,
  selectedYear,
  onChange,
  className,
}: DatePeriodFilterProps) {
  const isFiltered = selectedMonth !== undefined || selectedYear !== undefined;

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
    onChange(val, selectedYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
    onChange(selectedMonth, val);
  };

  const handleReset = () => {
    onChange(undefined, undefined);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl border border-zinc-800/90 bg-[#15181E] p-2 sm:p-2.5",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-zinc-400 pl-1 text-xs font-semibold uppercase tracking-wider">
        <Calendar className="h-4 w-4 text-amber-400" />
        <span className="hidden sm:inline">Periode:</span>
      </div>

      {/* Dropdown Bulan */}
      <select
        value={selectedMonth ?? ""}
        onChange={handleMonthChange}
        className="rounded-lg border border-zinc-700/80 bg-[#1B1F27] px-3 py-1.5 text-xs sm:text-sm text-zinc-100 font-medium transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">Semua Bulan</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Dropdown Tahun */}
      <select
        value={selectedYear ?? ""}
        onChange={handleYearChange}
        className="rounded-lg border border-zinc-700/80 bg-[#1B1F27] px-3 py-1.5 text-xs sm:text-sm text-zinc-100 font-medium transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">Semua Tahun</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Tombol Reset Filter */}
      {isFiltered && (
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          title="Reset filter periode"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
