import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  action,
  headerAction,
  children,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const topAction = action || headerAction;
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#121620] shadow-elevated-card transition-all">
      {(title || topAction) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 sm:px-6 py-4">
          <div>
            {title && (
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-400">{subtitle}</p>
            )}
          </div>
          {topAction}
        </header>
      )}
      <div className={className}>{children}</div>
    </section>
  );
}
