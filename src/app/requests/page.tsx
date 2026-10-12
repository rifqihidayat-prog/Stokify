import { redirect } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestList } from "@/components/requests/RequestList";
import { getStoreRequests } from "@/actions/requests";
import { getCurrentUser } from "@/actions/auth";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Permintaan Toko & Picking List - Stokify" };

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const role: Role = user.role;

  const [allProducts, requests] = await Promise.all([
    db.select().from(products).all(),
    getStoreRequests(),
  ]);

  return (
    <>
      <PageHeader
        title="Permintaan Toko & Surat Jalan"
        subtitle={
          role === "ADMIN_PUSAT"
            ? "Persetujuan, penyiapan picking list gudang pusat, dan pengiriman Surat Jalan (SJ)."
            : `Pengajuan multi-item kebutuhan logistik untuk ${user?.store_name || "Toko Cabang"}.`
        }
      />
      <div className="space-y-6">
        {role === "STAF_TOKO" && (
          <RequestForm
            products={allProducts}
            role={role}
            defaultStoreName={user?.store_name}
          />
        )}
        <RequestList requests={requests} role={role} />
      </div>
    </>
  );
}
