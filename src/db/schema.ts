import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const roleEnum = ["ADMIN_PUSAT", "STAF_TOKO"] as const;
export const productCategoryEnum = ["DAILY_CONSUMABLE", "EQUIPMENT", "PACKAGING", "OFFICE_SUPPLY"] as const;
export const requestStatusEnum = [
  "PENDING",
  "APPROVED",
  "SHIPPED",
  "RECEIVED",
  "REJECTED",
] as const;
export const equipmentUrgencyEnum = ["LOW", "MEDIUM", "HIGH"] as const;
export const equipmentReasonEnum = ["DAMAGED_REPLACEMENT", "NEW_PROCUREMENT"] as const;
export const equipmentStatusEnum = [
  "PENDING",
  "APPROVED",
  "ORDERED",
  "COMPLETED",
  "REJECTED",
] as const;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role", { enum: roleEnum }).notNull(),
  store_name: text("store_name").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku"), // Item Code
  name: text("name").notNull(), // Item Name
  category: text("category", { enum: productCategoryEnum }).notNull().default("DAILY_CONSUMABLE"),
  item_type: text("item_type").notNull().default("CONSUMABLE"),
  unit: text("unit").notNull(), // Pcs, Roll, Box, Pack, Botol
  min_stock_central: integer("min_stock_central").notNull().default(10),
  min_stock_store: integer("min_stock_store").notNull().default(5),
  current_stock_central: integer("current_stock_central").notNull().default(0),
  is_orderable: integer("is_orderable", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const storeStocks = sqliteTable("store_stocks", {
  id: text("id").primaryKey(),
  store_name: text("store_name").notNull(),
  item_id: text("item_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  current_stock: integer("current_stock").notNull().default(0),
  updated_at: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const mutationLogs = sqliteTable("mutation_logs", {
  id: text("id").primaryKey(),
  reference_no: text("reference_no").notNull(), // IN-SUPPLIER-..., SJ-..., REQ-..., CLOSING-..., ADJ-PUSAT-..., ADJ-TOKO-...
  transaction_date: integer("transaction_date", { mode: "timestamp" }).notNull().defaultNow(),
  sender_location: text("sender_location").notNull(), // 'SUPPLIER: Vendor XYZ', 'GUDANG PUSAT', 'Toko Cabang Surabaya'
  receiver_location: text("receiver_location").notNull(), // 'GUDANG PUSAT', 'Toko Cabang Surabaya', 'CLOSING'
  item_id: text("item_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  qty: integer("qty").notNull(),
  notes: text("notes"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().defaultNow(),
});

export const storeRequests = sqliteTable("store_requests", {
  id: text("id").primaryKey(),
  reference_no: text("reference_no"), // REQ-YYYYMMDD-XXXX
  store_name: text("store_name").notNull(),
  product_id: text("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  quantity_requested: integer("quantity_requested").notNull(),
  status: text("status", { enum: requestStatusEnum })
    .notNull()
    .default("PENDING"),
  notes: text("notes"),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
});

export const equipmentRequests = sqliteTable("equipment_requests", {
  id: text("id").primaryKey(),
  store_name: text("store_name").notNull(),
  equipment_name: text("equipment_name").notNull(),
  reason: text("reason", { enum: equipmentReasonEnum }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  description: text("description").notNull(),
  image_url: text("image_url"),
  urgency: text("urgency", { enum: equipmentUrgencyEnum })
    .notNull()
    .default("MEDIUM"),
  status: text("status", { enum: equipmentStatusEnum })
    .notNull()
    .default("PENDING"),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
});

export const purchaseRequestStatusEnum = ["PENDING", "COMPLETED", "CANCELLED"] as const;

export const purchaseRequests = sqliteTable("purchase_requests", {
  id: text("id").primaryKey(),
  pr_number: text("pr_number").notNull().unique(),
  product_id: text("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  supplier_name: text("supplier_name"),
  notes: text("notes"),
  status: text("status", { enum: purchaseRequestStatusEnum })
    .notNull()
    .default("PENDING"),
  created_by: text("created_by").notNull(),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .defaultNow(),
  completed_at: integer("completed_at", { mode: "timestamp" }),
});

export type Product = typeof products.$inferSelect;
export type StoreStock = typeof storeStocks.$inferSelect;
export type MutationLog = typeof mutationLogs.$inferSelect;
export type StoreRequest = typeof storeRequests.$inferSelect;
export type EquipmentRequest = typeof equipmentRequests.$inferSelect;
export type RepairTicket = EquipmentRequest;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type NewPurchaseRequest = typeof purchaseRequests.$inferInsert;


