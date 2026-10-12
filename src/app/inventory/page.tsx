import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { InventoryHub } from "@/components/inventory/InventoryHub";
import { getCentralStockCard, getStoreStockCards } from "@/actions/mutations";
import { getCurrentUser } from "@/actions/auth";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Stok & Inventaris Logistik - Stokify" };

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const role: Role = user?.role ?? "ADMIN_PUSAT";

  // Dynamic No-Beginning-Stock calculations
  const [centralItems, storeGroups, allProducts] = await Promise.all([
    getCentralStockCard(),
    getStoreStockCards(),
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
        title="Manajemen Stok Pusat & Multi-Store"
        subtitle="Monitoring saldo realtime berbasis mutasi transaksi ledger (No-Beginning-Stock Model)."
      />

      <InventoryHub
        centralItems={centralItems}
        storeGroups={storeGroups}
        autocompleteProducts={autocompleteProducts}
        role={role}
      />
    </>
  );
}
