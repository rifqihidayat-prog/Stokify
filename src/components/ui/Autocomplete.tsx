"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutocompleteItem {
  id: string;
  sku?: string | null;
  name: string;
  unit: string;
  current_stock?: number;
  is_orderable?: boolean;
  booked_stock?: number;
  booked_details?: string;
}

interface AutocompleteProps {
  items: AutocompleteItem[];
  value: string; // item id
  onChange: (itemId: string, item?: AutocompleteItem) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  disableZeroStock?: boolean; // if true, item with stock <= 0 cannot be selected
  error?: string;
}

export function Autocomplete({
  items,
  value,
  onChange,
  placeholder = "Ketik kode SKU atau nama barang...",
  label,
  required = false,
  disabled = false,
  disableZeroStock = false,
  error,
}: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((i) => i.id === value);

  // Synchronize query display when value changes externally
  useEffect(() => {
    if (selectedItem) {
      setQuery(`${selectedItem.sku ? `[${selectedItem.sku}] ` : ""}${selectedItem.name}`);
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedItem]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query text to current selected item if not changed
        if (selectedItem) {
          setQuery(`${selectedItem.sku ? `[${selectedItem.sku}] ` : ""}${selectedItem.name}`);
        } else {
          setQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedItem]);

  // Filter items based on user typing
  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchName = item.name.toLowerCase().includes(q);
    const matchSku = item.sku ? item.sku.toLowerCase().includes(q) : false;
    return matchName || matchSku;
  });

  const handleSelect = (item: AutocompleteItem) => {
    if (disableZeroStock && (item.current_stock ?? 0) <= 0) return;
    onChange(item.id, item);
    setQuery(`${item.sku ? `[${item.sku}] ` : ""}${item.name}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        handleSelect(filteredItems[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full rounded-xl border border-zinc-800 bg-[#15181E] py-2.5 pl-9 pr-9 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner transition-all",
            "focus:border-amber-500/60 focus:bg-[#181B22] focus:outline-none focus:ring-2 focus:ring-amber-500/20",
            disabled && "cursor-not-allowed opacity-50 bg-zinc-900",
            error && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20"
          )}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
            title="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}

      {/* Recommendations Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-700/80 bg-[#181B22] p-1.5 shadow-2xl backdrop-blur-md">
          {filteredItems.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-400">
              Tidak ada barang yang cocok dengan &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = item.id === value;
              const isHighlighted = idx === highlightedIndex;
              const isZero = (item.current_stock ?? 0) <= 0;
              const isItemDisabled = disableZeroStock && isZero;

              return (
                <div
                  key={item.id}
                  onClick={() => !isItemDisabled && handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                    isHighlighted && "bg-zinc-800/80 text-zinc-100",
                    isSelected && "bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30",
                    isItemDisabled && "cursor-not-allowed opacity-45 bg-zinc-900/40 text-zinc-500"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.sku && (
                        <span className="font-mono text-xs font-bold text-sky-400">
                          [{item.sku}]
                        </span>
                      )}
                      <span className="truncate font-medium text-zinc-100">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span>Satuan: {item.unit}</span>
                      {item.current_stock !== undefined && (
                        <>
                          <span>•</span>
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              item.current_stock <= 0
                                ? "text-rose-400"
                                : item.current_stock <= 15
                                ? "text-amber-400"
                                : "text-emerald-400"
                            )}
                          >
                            Stok Pusat: {item.current_stock} {item.unit}
                          </span>
                        </>
                      )}
                      {item.booked_stock !== undefined && item.booked_stock > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[11px]">
                            Ter-booked: {item.booked_stock} {item.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isItemDisabled ? (
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                        [STOK KOSONG PUSAT]
                      </span>
                    ) : isSelected ? (
                      <Check className="h-4 w-4 text-amber-400" />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
