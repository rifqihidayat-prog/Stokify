import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "slate" | "red" | "amber" | "green" | "emerald" | "blue" | "violet";

const TONES: Record<Tone, { box: string; icon: string }> = {
  slate: {
    box: "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300",
    icon: "text-zinc-300",
  },
  red: {
    box: "bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm shadow-rose-950/40",
    icon: "text-rose-400",
  },
  amber: {
    box: "bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-sm shadow-amber-950/40",
    icon: "text-amber-400",
  },
  green: {
    box: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-sm shadow-emerald-950/40",
    icon: "text-emerald-400",
  },
  emerald: {
    box: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-sm shadow-emerald-950/40",
    icon: "text-emerald-400",
  },
  blue: {
    box: "bg-sky-500/10 border border-sky-500/25 text-sky-400 shadow-sm shadow-sky-950/40",
    icon: "text-sky-400",
  },
  violet: {
    box: "bg-purple-500/10 border border-purple-500/25 text-purple-400 shadow-sm shadow-purple-950/40",
    icon: "text-purple-400",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  tone = "slate",
  sub,
  children,
}: {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  const toneStyle = TONES[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#121620] p-5 shadow-elevated-card transition-all duration-200 hover:border-white/[0.12] hover:bg-[#151a26]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {title}
          </p>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
            {value}
          </div>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105",
            toneStyle.box
          )}
        >
          <Icon className={cn("h-5 w-5", toneStyle.icon)} />
        </span>
      </div>
      {sub && <p className="mt-2.5 text-xs text-zinc-400">{sub}</p>}
      {children}
    </div>
  );
}

