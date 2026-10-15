import { redirect } from "next/navigation";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { InventoryHub } from "@/components/inventory/InventoryHub";
import { getCentralStockCard, getStoreStockCards } from "@/actions/mutations";
import { getCurrentUser } from "@/actions/auth";
import { autoSyncIfStale } from "@/actions/sync";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Stok & Inventaris Logistik - Stokify" };

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const role: Role = user.role;

  // Lakukan auto-sync jika master data Google Sheets sudah lebih dari 2 menit belum diperbarui
  await autoSyncIfStale();

  // Dynamic No-Beginning-Stock calculations:
  // Admin Pusat melihat stok pusat & seluruh toko.
  // Staf Toko HANYA melihat stok tokonya sendiri (tidak melihat stok pusat atau toko lain).
  const [centralItems, storeGroups, allProducts] = await Promise.all([
    role === "ADMIN_PUSAT" ? getCentralStockCard() : Promise.resolve([]),
    getStoreStockCards(),
    db.select().from(products).all(),
  ]);

  const autocompleteProducts = allProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    current_stock: role === "ADMIN_PUSAT" ? p.current_stock_central : undefined,
    is_orderable: p.is_orderable,
  }));

  return (
    <>
      <PageHeader
        title={
          role === "ADMIN_PUSAT"
            ? "Manajemen Stok Pusat & Multi-Store"
            : `Stok Toko - ${user.store_name}`
        }
        subtitle={
          role === "ADMIN_PUSAT"
            ? "Monitoring saldo realtime berbasis mutasi transaksi ledger (No-Beginning-Stock Model)."
            : `Monitoring saldo fisik realtime untuk ${user.store_name}.`
        }
      />

      <InventoryHub
        centralItems={centralItems}
        storeGroups={storeGroups}
        autocompleteProducts={autocompleteProducts}
        role={role}
        user={user}
      />
    </>
  );
}
