import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { equipmentRequests } from "@/db/schema";
import { PageHeader } from "@/components/ui/PageHeader";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { EquipmentList } from "@/components/equipment/EquipmentList";
import { getCurrentUser } from "@/actions/auth";
import type { Role } from "@/lib/utils";

export const metadata = { title: "Pengadaan Equipment - Stokify" };

export default async function EquipmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  const role: Role = user.role;

  const requests = await db
    .select()
    .from(equipmentRequests)
    .orderBy(desc(equipmentRequests.created_at))
    .all();

  return (
    <>
      <PageHeader
        title="Pengajuan Pengadaan Equipment"
        subtitle={
          role === "ADMIN_PUSAT"
            ? "Tinjauan persetujuan pengadaan alat baru dan perbaikan equipment toko cabang."
            : `Ajukan permohonan pembelian peralatan baru ke Pusat untuk ${user?.store_name || "Toko Cabang"}.`
        }
      />
      <div className="space-y-6">
        {role === "STAF_TOKO" && (
          <EquipmentForm
            role={role}
            defaultStoreName={user?.store_name}
          />
        )}
        <EquipmentList requests={requests} role={role} />
      </div>
    </>
  );
}
