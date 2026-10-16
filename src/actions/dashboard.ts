"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, storeRequests, equipmentRequests, mutationLogs, purchaseRequests } from "@/db/schema";
import { getCentralStockCard, type CentralStockCardItem, type DateFilter, type ActivePRInfo } from "./mutations";
import { getStockStatus, type StockLevel } from "@/lib/utils";
import { requireUser } from "@/lib/authz";

export type LowStockItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  current_stock_central: number;
  min_stock_central: number;
  status: StockLevel;
  active_pr?: ActivePRInfo | null;
};

export type DashboardStats = {
  totalItems: number;
  criticalCount: number;
  needPRCount: number;
  activePRCount: number;
  pendingRequests: number;
  pendingEquipmentRequests: number;
  totalMutationsThisMonth: number;
  warehouseHealthPercent: number;
  safeCount: number;
  monitorCount: number;
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

export async function getDashboardStats(filters?: DateFilter): Promise<DashboardStats> {
  await requireUser();
  const [centralCardItems, requests, equipment, activePRs] = await Promise.all([
    getCentralStockCard(filters),
    db.select().from(storeRequests).all(),
    db.select().from(equipmentRequests).all(),
    db.select().from(purchaseRequests).where(eq(purchaseRequests.status, "PENDING")).all(),
  ]);

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
  const needPRCount = criticalBannerItems.length;
  const activePRCount = activePRs.length;
  const safeCount = centralCardItems.filter((i) => i.status === "AMAN").length;
  const monitorCount = centralCardItems.filter((i) => i.status === "WARNING").length;

  const totalItemsCount = Math.max(1, centralCardItems.length);
  const warehouseHealthPercent = Math.round((safeCount / totalItemsCount) * 100);

  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;

  const pendingEquipmentRequests = equipment.filter(
    (t) => t.status === "PENDING" || t.status === "APPROVED" || t.status === "ORDERED"
  ).length;

  // 10 item prioritas untuk visualisasi grafik
  const chartData = centralCardItems
    .slice()
    .sort((a, b) => a.sisa_stok_realtime - b.sisa_stok_realtime)
    .slice(0, 10)
    .map((p) => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + "..." : p.name,
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
      active_pr: p.active_pr,
    }))
    .sort((a, b) => a.current_stock_central - b.current_stock_central);

  const recentMutations = allLogsWithProds.slice(0, 7).map(({ log, prod }) => {
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
    criticalCount: criticalBannerItems.length,
    needPRCount,
    activePRCount,
    pendingRequests,
    pendingEquipmentRequests,
    totalMutationsThisMonth: mutationsThisMonth.length,
    warehouseHealthPercent,
    safeCount,
    monitorCount,
    chartData,
    lowStock,
    criticalBannerItems,
    recentMutations,
  };
}
