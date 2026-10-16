import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

const REQUEST_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: {
    label: "Menunggu",
    cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20 border border-amber-500/20",
    dot: "bg-amber-400 animate-subtle-pulse",
  },
  APPROVED: {
    label: "Disetujui",
    cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20 border border-sky-500/20",
    dot: "bg-sky-400",
  },
  SHIPPED: {
    label: "Dikirim",
    cls: "bg-purple-500/10 text-purple-300 ring-purple-500/20 border border-purple-500/20",
    dot: "bg-purple-400",
  },
  RECEIVED: {
    label: "Diterima",
    cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    label: "Ditolak",
    cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20 border border-rose-500/20",
    dot: "bg-rose-400",
  },
};

const REPAIR_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  OPEN: {
    label: "Open",
    cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20 border border-amber-500/20",
    dot: "bg-amber-400 animate-subtle-pulse",
  },
  IN_PROGRESS: {
    label: "Dikerjakan",
    cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20 border border-sky-500/20",
    dot: "bg-sky-400",
  },
  RESOLVED: {
    label: "Selesai",
    cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    label: "Ditolak",
    cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20 border border-rose-500/20",
    dot: "bg-rose-400",
  },
};

const EQUIPMENT_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING: {
    label: "Menunggu Review",
    cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20 border border-amber-500/20",
    dot: "bg-amber-400 animate-subtle-pulse",
  },
  APPROVED: {
    label: "Disetujui",
    cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20 border border-sky-500/20",
    dot: "bg-sky-400",
  },
  ORDERED: {
    label: "Sedang Dipesan",
    cls: "bg-amber-500/15 text-amber-200 ring-amber-500/30 border border-amber-500/30",
    dot: "bg-amber-400",
  },
  COMPLETED: {
    label: "Selesai / Diterima",
    cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    label: "Ditolak",
    cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20 border border-rose-500/20",
    dot: "bg-rose-400",
  },
};

const EQUIPMENT_REASONS: Record<string, { label: string; cls: string; dot: string }> = {
  DAMAGED_REPLACEMENT: {
    label: "Penggantian Rusak",
    cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20 border border-rose-500/20",
    dot: "bg-rose-400",
  },
  NEW_PROCUREMENT: {
    label: "Pengadaan Baru",
    cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20 border border-sky-500/20",
    dot: "bg-sky-400",
  },
};

const STOCK_STATUS: Record<
  string,
  { label: string; cls: string; dot: string; restock?: boolean }
> = {
  KRITIS: {
    label: "Kritis",
    cls: "bg-rose-500/10 text-rose-300 ring-rose-500/25 border border-rose-500/25 font-medium",
    dot: "bg-rose-400 shadow-sm shadow-rose-500/50 animate-subtle-pulse",
    restock: true,
  },
  WARNING: {
    label: "Monitor",
    cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25 border border-amber-500/25 font-medium",
    dot: "bg-amber-400 shadow-sm shadow-amber-500/50",
  },
  AMAN: {
    label: "Aman",
    cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25 border border-emerald-500/25 font-medium",
    dot: "bg-emerald-400 shadow-sm shadow-emerald-500/50",
  },
  PR_CREATED: {
    label: "Sudah Dibuat PR",
    cls: "bg-sky-500/15 text-sky-300 ring-sky-500/25 border border-sky-500/25 font-semibold",
    dot: "bg-sky-400 shadow-sm shadow-sky-500/50",
  },
};

export function RequestStatusBadge({ status }: { status: string }) {
  const cfg = REQUEST_STATUS[status] ?? {
    label: status,
    cls: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    dot: "bg-zinc-400",
  };
  return (
    <Badge className={cfg.cls}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function RepairStatusBadge({ status }: { status: string }) {
  const cfg = REPAIR_STATUS[status] ?? {
    label: status,
    cls: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    dot: "bg-zinc-400",
  };
  return (
    <Badge className={cfg.cls}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function EquipmentStatusBadge({ status }: { status: string }) {
  const cfg = EQUIPMENT_STATUS[status] ?? {
    label: status,
    cls: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    dot: "bg-zinc-400",
  };
  return (
    <Badge className={cfg.cls}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function EquipmentReasonBadge({ reason }: { reason: string }) {
  const cfg = EQUIPMENT_REASONS[reason] ?? {
    label: reason,
    cls: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    dot: "bg-zinc-400",
  };
  return (
    <Badge className={cfg.cls}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function StockStatusBadge({
  status,
  showDot = true,
}: {
  status: string;
  showDot?: boolean;
}) {
  const cfg = STOCK_STATUS[status] ?? {
    label: status,
    cls: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    dot: "bg-zinc-400",
  };
  return (
    <Badge className={cfg.cls}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />}
      <span>{cfg.label}</span>
    </Badge>
  );
}

export function RestockBadge() {
  return (
    <Badge className="bg-rose-500/15 text-rose-300 font-semibold ring-1 ring-rose-500/30 border border-rose-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-subtle-pulse shrink-0" />
      <span>Restock Supplier</span>
    </Badge>
  );
}

