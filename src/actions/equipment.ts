"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { equipmentRequests } from "@/db/schema";
import { fail, ok, type ActionResult } from "./types";

const URGENCIES = ["LOW", "MEDIUM", "HIGH"] as const;
const REASONS = ["DAMAGED_REPLACEMENT", "NEW_PROCUREMENT"] as const;
const STATUSES = ["PENDING", "APPROVED", "ORDERED", "COMPLETED", "REJECTED"] as const;

/**
 * Membuat pengajuan pembelian / pengadaan equipment baru untuk toko.
 * Alasan: Penggantian karena rusak atau pengadaan baru karena belum punya.
 */
export async function createEquipmentRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const storeName = String(formData.get("store_name") ?? "").trim();
  const equipmentName = String(formData.get("equipment_name") ?? "").trim();
  const reason = String(formData.get("reason") ?? "DAMAGED_REPLACEMENT");
  const quantity = Number(formData.get("quantity") ?? 1);
  const description = String(formData.get("description") ?? "").trim();
  const urgency = String(formData.get("urgency") ?? "MEDIUM");
  const image = formData.get("image");

  if (!storeName) return fail("Nama toko wajib diisi.");
  if (!equipmentName) return fail("Nama equipment/alat wajib diisi.");
  if (!REASONS.includes(reason as (typeof REASONS)[number]))
    return fail("Alasan pengadaan tidak valid.");
  if (!Number.isInteger(quantity) || quantity <= 0)
    return fail("Jumlah unit harus berupa angka bulat positif minimal 1.");
  if (description.length < 5)
    return fail("Rincian kebutuhan / alasan pengadaan terlalu singkat (minimal 5 karakter).");
  if (!URGENCIES.includes(urgency as (typeof URGENCIES)[number]))
    return fail("Level urgensi tidak valid.");

  let imageUrl: string | null = null;
  if (image instanceof File && image.name) {
    imageUrl = `/uploads/${encodeURIComponent(image.name)}`;
  }

  await db.insert(equipmentRequests).values({
    id: randomUUID(),
    store_name: storeName,
    equipment_name: equipmentName,
    reason: reason as (typeof REASONS)[number],
    quantity,
    description,
    image_url: imageUrl,
    urgency: urgency as (typeof URGENCIES)[number],
    status: "PENDING",
    created_at: new Date(),
  });

  revalidatePath("/equipment");
  revalidatePath("/repairs");
  revalidatePath("/");
  return ok(`Pengajuan pengadaan "${equipmentName}" (${quantity} unit) berhasil dikirim ke Pusat.`);
}

/**
 * Memperbarui status pengajuan equipment:
 * PENDING -> APPROVED / REJECTED
 * APPROVED -> ORDERED (Sedang proses pembelian)
 * ORDERED -> COMPLETED (Barang telah tiba / diterima toko)
 */
export async function updateEquipmentRequestStatus(
  requestId: string,
  status: string
): Promise<ActionResult> {
  if (!STATUSES.includes(status as (typeof STATUSES)[number]))
    return fail("Status tidak valid.");

  const request = await db
    .select()
    .from(equipmentRequests)
    .where(eq(equipmentRequests.id, requestId))
    .get();

  if (!request) return fail("Pengajuan tidak ditemukan.");

  await db
    .update(equipmentRequests)
    .set({ status: status as (typeof STATUSES)[number] })
    .where(eq(equipmentRequests.id, requestId));

  revalidatePath("/equipment");
  revalidatePath("/repairs");
  revalidatePath("/");
  return ok(`Status pengadaan diperbarui menjadi "${status}".`);
}
