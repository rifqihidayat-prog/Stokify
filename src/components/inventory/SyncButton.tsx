"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { syncProductsFromGoogleSheet } from "@/actions/sync";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export function SyncButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" }>({
    message: "",
    type: "success",
  });

  const handleSync = () => {
    startTransition(async () => {
      const res = await syncProductsFromGoogleSheet();
      setToast({ message: res.message, type: res.ok ? "success" : "error" });
      router.refresh();
    });
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} />
      <Button
        variant="secondary"
        onClick={handleSync}
        disabled={pending}
        className="text-xs sm:text-sm bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 border border-zinc-700/80"
        title="Ambil update katalog produk dari Google Sheets"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        ) : (
          <RefreshCw className="h-4 w-4 text-emerald-400" />
        )}
        <span>{pending ? "Menyinkronkan..." : "Sinkronkan Google Sheets"}</span>
      </Button>
    </>
  );
}

