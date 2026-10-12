import { cn } from "@/lib/utils";

export function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <div
        className={cn(
          "flex max-w-md items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md",
          type === "success"
            ? "bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 shadow-emerald-950/50"
            : "bg-rose-950/90 border border-rose-500/50 text-rose-100 shadow-rose-950/50"
        )}
        role="status"
      >
        {message}
      </div>
    </div>
  );

}
