"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, storeRequests, equipmentRequests, mutationLogs } from "@/db/schema";
import { getCentralStockCard, type CentralStockCardItem, type DateFilter } from "./mutations";
import { getStockStatus, type StockLevel } from "@/lib/utils";
import { requireUser } from "@/lib/authz";

export type DashboardStats = {
  totalItems: number;
  criticalCount: number;
  pendingRequests: number;
  pendingEquipmentRequests: number;
  totalMutationsThisMonth: number;
  chartData: { name: string; current: number; min: number }[];
  lowStock: LowStockItem[];
  criticalBannerItems: CentralStockCardItem[];
  recentMutations: {
    id: string;
    ref: string;
    type: string;
    item: string;
    qty: number;
    unit: string;
    sender: string;
    receiver: string;
    date: Date;
  }[];
};

export type LowStockItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  current_stock_central: number;
  min_stock_central: number;
  status: StockLevel;
};

export async function getDashboardStats(filters?: DateFilter): Promise<DashboardStats> {
  await requireUser();
  const centralCardItems = await getCentralStockCard(filters);
  const requests = await db.select().from(storeRequests).all();
  const equipment = await db.select().from(equipmentRequests).all();

  const now = new Date();
  const currentYear = filters?.year || now.getFullYear();
  const currentMonth = filters?.month || now.getMonth() + 1;

  const allLogsWithProds = await db
    .select({
      log: mutationLogs,
      prod: products,
    })
    .from(mutationLogs)
    .innerJoin(products, eq(mutationLogs.item_id, products.id))
    .orderBy(desc(mutationLogs.transaction_date), desc(mutationLogs.created_at))
    .all();

  const mutationsThisMonth = allLogsWithProds.filter(({ log }) => {
    const d = new Date(log.transaction_date);
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
  });

  const criticalBannerItems = centralCardItems.filter((i) => i.status === "KRITIS");
  const criticalCount = criticalBannerItems.length;

  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;

  const pendingEquipmentRequests = equipment.filter(
    (t) => t.status === "PENDING" || t.status === "APPROVED" || t.status === "ORDERED"
  ).length;

  const chartData = centralCardItems.slice(0, 10).map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
    current: p.sisa_stok_realtime,
    min: p.min_stock_central,
  }));

  const lowStock: LowStockItem[] = centralCardItems
    .filter((p) => p.status !== "AMAN")
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      unit: p.unit,
      current_stock_central: p.sisa_stok_realtime,
      min_stock_central: p.min_stock_central,
      status: p.status,
    }))
    .sort((a, b) => a.current_stock_central / a.min_stock_central - b.current_stock_central / b.min_stock_central);

  const recentMutations = allLogsWithProds.slice(0, 5).map(({ log, prod }) => {
    let type = "MUTASI";
    if (log.reference_no.startsWith("IN-SUPPLIER")) type = "IN-SUPPLIER";
    else if (log.reference_no.startsWith("SJ-")) type = "SURAT JALAN";
    else if (log.reference_no.startsWith("CLOSING")) type = "CLOSING";
    else if (log.reference_no.startsWith("ADJ-TOKO")) type = "ADJ TOKO";
    else if (log.reference_no.startsWith("ADJ-PUSAT")) type = "ADJ PUSAT";

    return {
      id: log.id,
      ref: log.reference_no,
      type,
      item: prod.name,
      qty: log.qty,
      unit: prod.unit,
      sender: log.sender_location,
      receiver: log.receiver_location,
      date: new Date(log.transaction_date),
    };
  });

  return {
    totalItems: centralCardItems.length,
    criticalCount,
    pendingRequests,
    pendingEquipmentRequests,
    totalMutationsThisMonth: mutationsThisMonth.length,
    chartData,
    lowStock,
    criticalBannerItems,
    recentMutations,
  };
}

