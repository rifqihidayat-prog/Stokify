import { redirect } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getDashboardStats } from "@/actions/dashboard";
import { getPickingList } from "@/actions/requests";
import { getCurrentUser } from "@/actions/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardHub } from "@/components/dashboard/DashboardHub";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Dashboard Logistik - Stokify" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const role: Role = user.role;

  const [stats, pickingItems, allProducts] = await Promise.all([
    getDashboardStats(),
    getPickingList(),
    db.select().from(products).all(),
  ]);

  const autocompleteProducts = allProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    current_stock: p.current_stock_central,
    is_orderable: p.is_orderable,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard Logistik & Operasional"
        subtitle={
          role === "ADMIN_PUSAT"
            ? `Pusat komando monitoring stok real-time, penerimaan supplier, surat jalan, dan audit opname cabang. (Masuk sebagai ${user?.name || "Admin"})`
            : `Portal operasional toko: pengajuan kebutuhan barang ke pusat, input closing, dan opname fisik untuk ${user?.store_name || "Toko Cabang"}.`
        }
      />

      <DashboardHub
        stats={stats}
        pickingItems={pickingItems}
        autocompleteProducts={autocompleteProducts}
        role={role}
        user={user ?? undefined}
      />
    </>
  );
}
