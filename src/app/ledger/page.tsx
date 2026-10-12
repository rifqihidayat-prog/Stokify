import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LedgerHub } from "@/components/ledger/LedgerHub";
import { getMutationLedger, getAuditAdjustments } from "@/actions/mutations";
import { getCurrentUser } from "@/actions/auth";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Buku Kas Mutasi & Ledger - Stokify" };

export default async function LedgerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const role: Role = user.role;

  // Fetch verified ledger logs (Descending) & audit logs
  const [ledgerData, auditData] = await Promise.all([
    getMutationLedger({}, 1, 20),
    getAuditAdjustments({}, 1, 20),
  ]);

  return (
    <>
      <PageHeader
        title="Buku Kas Mutasi & Audit Log Ledger"
        subtitle="Rekam jejak transaksi logistik terverifikasi (Inflow Vendor, Surat Jalan, Closing Toko, Adjustment Opname)."
      />

      <LedgerHub
        ledgerData={ledgerData}
        auditData={auditData}
        role={role}
      />
    </>
  );
}
