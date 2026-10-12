# STOKIFY — SYSTEM & CODEBASE KNOWLEDGE BASE FOR LLMs

Dokumen ini dirancang khusus sebagai panduan representatif, presisi, dan komprehensif bagi Large Language Model (LLM) atau AI coding assistant untuk memahami, menganalisis, serta mengembangkan codebase **Stokify**.

---

## 1. Executive Summary & Domain Problem

**Stokify** adalah sistem manajemen inventaris rantai pasok terintegrasi antara **Gudang Pusat (Central Warehouse)** dan **Toko-toko Cabang (Branch Stores)** yang berfokus pada 3 pilar:

1. **Monitoring & Manajemen Stok Pusat (Central Warehouse Stock)**:
   - Memantau ketersediaan stok fisik barang habis pakai (*daily consumables*) dan peralatan (*equipment*) di gudang pusat.
   - Deteksi dini level stok: **AMAN**, **WARNING**, dan **KRITIS** ($\le 80\%$ dari minimum stok) untuk memicu restock vendor.
2. **Pengajuan Stok Toko (Branch Store Restock Requests)**:
   - Menangani alur permintaan restock barang consumable dari toko cabang ke gudang pusat.
   - Dilengkapi *safety guard*: Toko cabang dilarang request jika stok pusat kosong ($0$) atau jika kuantitas melebihi stok yang tersedia di pusat.
   - Deduksi otomatis stok pusat via transaksi database saat disetujui Admin Pusat.
3. **Pengajuan Pengadaan / Pembelian Equipment (Store Equipment Purchase Requests)**:
   - **Bukan sistem pelaporan servis/perbaikan teknis**, melainkan **alur pengajuan pembelian/pengadaan peralatan baru** dari toko cabang ke kantor pusat.
   - Mendukung dua alasan kebutuhan utama:
     - `DAMAGED_REPLACEMENT`: Penggantian unit baru karena alat lama rusak / aus / tidak layak pakai.
     - `NEW_PROCUREMENT`: Pengadaan alat baru karena toko cabang belum memiliki fasilitas/alat tersebut.
   - Pelacakan alur pengadaan: `PENDING` $\to$ `APPROVED` $\to$ `ORDERED` (Sedang Dipesan/Dibeli) $\to$ `COMPLETED` (Diterima Toko).

### Aktor Sistem (Role)
Role berasal dari akun yang login (tabel `users`). Lihat **Keamanan** di bawah untuk sesi & otorisasi:
- **`ADMIN_PUSAT` (Gudang / Kantor Pusat)**:
  - Mengelola master data stok pusat (update jumlah stok aktual dan minimum stok aman di `/inventory`).
  - Me-review pengajuan stok barang toko (`APPROVE` atau `REJECT`).
  - Mengirimkan barang pengajuan restock (`SHIPPED`).
  - Me-review pengajuan pembelian equipment (`APPROVED` atau `REJECTED`).
  - Menandai proses pembelian/pemesanan equipment (`ORDERED`).
- **`STAF_TOKO` (Cabang Toko, default: "Toko Cabang Surabaya")**:
  - Mengajukan kebutuhan restock barang daily consumable yang tersedia di pusat.
  - Mengonfirmasi penerimaan barang kiriman stok (`RECEIVED`).
  - Mengajukan pembelian alat/equipment baru dengan rincian unit, alasan (rusak/belum punya), dan foto pendukung.
  - Mengonfirmasi penerimaan alat baru setelah dipesan oleh pusat (`COMPLETED`).
  - Terbatas: Tidak diizinkan mengubah master stok fisik gudang pusat secara langsung.

---

## 2. Tech Stack & Dependencies

- **Framework**: [Next.js 15.5.24](https://nextjs.org/) (App Router, React 19 Server Components, Server Actions).
- **Runtime & Language**: Node.js / TypeScript 5.7 (Strict mode, ES2022).
- **UI & Styling**:
  - [Tailwind CSS 3.4](https://tailwindcss.com/) dengan plugin PostCSS & Autoprefixer.
  - [Lucide React](https://lucide.dev/) (Icon pack).
  - `clsx` & `tailwind-merge` (`src/lib/utils.ts -> cn()`).
- **Data Visualization**:
  - [Recharts 3.10](https://recharts.org/) (Responsive Bar Chart komparasi stok aktual vs min-stock).
- **Database & ORM**:
  - **ORM**: [Drizzle ORM 0.45](https://orm.drizzle.team/) + `drizzle-kit 0.31`.
  - **Database Driver**: `@libsql/client 0.17` (SQLite lokal & Turso Cloud).
  - **Dialect**: SQLite / LibSQL.
  - **Database Mode**: Local file-based `stokify.db` (zero configuration) atau remote Turso via environment variable `DATABASE_URL`.
- **Form & State Management**:
  - React 19 native hooks: `useActionState`, `useTransition`, `useState`.
  - Server Actions (`"use server"`) dengan revalidasi path Next.js (`revalidatePath`).

---

## 3. Directory & File Blueprint

```text
Stokify/
├── .env.example              # Template konfigurasi environment (opsional Turso)
├── .env.local                # Local environment (DATABASE_URL file:./stokify.db)
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── next.config.ts            # Konfigurasi Next.js
├── package.json              # Dependency deklarasi & npm scripts
├── stokify.db                # SQLite database binary (local-first)
├── tsconfig.json             # Konfigurasi TypeScript path aliases (@/* -> ./src/*)
└── src/
    ├── actions/              # Next.js Server Actions (Business Logic layer)
    │   ├── dashboard.ts      # Pengambilan metrik ringkasan & data grafik
    │   ├── equipment.ts      # Pengajuan pembelian equipment & update status pengadaan
    │   ├── repairs.ts        # Re-export / backward-compatibility wrapper ke equipment.ts
    │   ├── requests.ts       # Pengajuan restock, approval, deduksi stok otomatis, tracking
    │   ├── auth.ts           # Login (password ter-hash), logout, getCurrentUser dari sesi bertanda tangan
    │   ├── users.ts          # CRUD akun pengguna (Admin Pusat)
    │   ├── sync.ts           # Sinkronisasi master produk dari Google Sheet (Admin Pusat)
    │   ├── stock.ts          # Update stok aktual & ambang batas min stok pusat
    │   └── types.ts          # Standard Action Result format { ok: boolean, message: string }
    ├── app/                  # Next.js App Router (Page routes & layouts)
    │   ├── globals.css       # Tailwind base, antialiased, scrollbar styling
    │   ├── layout.tsx        # Root layout, membaca user login, AppShell provider
    │   ├── page.tsx          # Route '/' -> Dashboard statistik & grafik stok
    │   ├── equipment/
    │   │   └── page.tsx      # Route '/equipment' -> Pengajuan Pengadaan Equipment
    │   ├── inventory/
    │   │   └── page.tsx      # Route '/inventory' -> Manajemen Stok Pusat (Admin Only)
    │   ├── repairs/
    │   │   └── page.tsx      # Route '/repairs' -> Redirect ke /equipment
    │   └── requests/
    │       └── page.tsx      # Route '/requests' -> Form & Tracking Pengajuan Restock
    ├── components/           # Reusable UI & Feature components
    │   ├── charts/
    │   │   └── StockChart.tsx      # Recharts BarChart komparasi Stok vs Min. Stok
    │   ├── dashboard/
    │   │   └── LowStockTable.tsx   # Tabel peringatan item stok kritis/warning
    │   ├── equipment/
    │   │   ├── EquipmentForm.tsx   # Form pengajuan pembelian equipment (pilihan alasan rusak/baru)
    │   │   └── EquipmentList.tsx   # Daftar kartu status pengadaan equipment & tombol aksi
    │   ├── inventory/
    │   │   └── InventoryTable.tsx  # Tabel stok pusat + Modal pop-up update stok
    │   ├── layout/
    │   │   ├── AppShell.tsx        # Shell responsive wrapper (Sidebar + TopBar + BottomNav)
    │   │   ├── BottomNav.tsx       # Bottom navigation bar untuk mobile (< 1024px)
    │   │   ├── RoleSwitcher.tsx    # Toggle switch role Admin Pusat vs Staf Toko
    │   │   ├── Sidebar.tsx         # Collapsible desktop sidebar (>= 1024px)
    │   │   └── TopBar.tsx          # Mobile top app bar dengan quick role switcher
    │   ├── repairs/                # Backward compatibility wrappers
    │   │   ├── RepairForm.tsx      # Re-export EquipmentForm
    │   │   └── TicketList.tsx      # Re-export EquipmentList
    │   ├── requests/
    │   │   ├── RequestForm.tsx     # Form pengajuan stok dengan visual selector & guards
    │   │   └── RequestList.tsx     # Tabel pengajuan stok dengan status pipeline
    │   └── ui/               # Atomic Design UI library
    │       ├── Badge.tsx           # Base badge
    │       ├── Button.tsx          # Button varian (primary, secondary, danger, success, outline)
    │       ├── Card.tsx            # Card wrapper dengan title & subtitle
    │       ├── Form.tsx            # Input, Label, Textarea terstandardisasi
    │       ├── Modal.tsx           # Accessible modal dialog
    │       ├── PageHeader.tsx      # Header judul & deskripsi halaman
    │       ├── StatCard.tsx        # Kartu statistik ringkasan dashboard
    │       ├── StatusBadge.tsx     # Status badge khusus stok, request, equipment reason & status
    │       └── Toast.tsx           # Toast notifikasi sukses/error
    ├── db/                   # Database configuration & schema
    │   ├── index.ts          # Inisialisasi LibSQL client & instance Drizzle DB
    │   ├── schema.ts         # Tabel database: users, products, storeRequests, equipmentRequests
    │   └── seed.ts           # Script pengisian data master & dummy testing
    └── lib/                  # Utilities
        └── utils.ts          # Helper class merging cn(), kalkulator getStockStatus, default constants
```

---

## 4. Database Schema & Data Dictionary

Schema didefinisikan di `src/db/schema.ts`.

### 4.1. Enums / Static Value Sets

```typescript
export const roleEnum = ["ADMIN_PUSAT", "STAF_TOKO"] as const;
export const productCategoryEnum = ["DAILY_CONSUMABLE", "EQUIPMENT"] as const;
export const requestStatusEnum = ["PENDING", "APPROVED", "SHIPPED", "RECEIVED", "REJECTED"] as const;
export const equipmentUrgencyEnum = ["LOW", "MEDIUM", "HIGH"] as const;
export const equipmentReasonEnum = ["DAMAGED_REPLACEMENT", "NEW_PROCUREMENT"] as const;
export const equipmentStatusEnum = ["PENDING", "APPROVED", "ORDERED", "COMPLETED", "REJECTED"] as const;
```

### 4.2. Tables Detail

#### Table: `users`
| Kolom | Tipe Data SQLite | Drizzle Type | Nullable | Keterangan |
|---|---|---|---|---|
| `id` | `TEXT` | `text().primaryKey()` | NO | UUID v4 |
| `name` | `TEXT` | `text().notNull()` | NO | Nama pengguna |
| `role` | `TEXT` | `text({ enum: roleEnum }).notNull()` | NO | `'ADMIN_PUSAT'` atau `'STAF_TOKO'` |
| `store_name` | `TEXT` | `text().notNull()` | NO | Nama cabang toko / warehouse |

#### Table: `products`
Master data barang consumable maupun peralatan gudang pusat (dapat disinkronkan dari Google Sheets).
| Kolom | Tipe Data SQLite | Drizzle Type | Nullable | Keterangan |
|---|---|---|---|---|
| `id` | `TEXT` | `text().primaryKey()` | NO | UUID v4 |
| `sku` | `TEXT` | `text()` | YES | Kode SKU barang dari Google Sheets (cth: "0001") |
| `name` | `TEXT` | `text().notNull()` | NO | Nama barang (cth: "Struk Thermal 80mm") |
| `category` | `TEXT` | `text({ enum: productCategoryEnum }).notNull()` | NO | `'DAILY_CONSUMABLE'` atau `'EQUIPMENT'` |
| `unit` | `TEXT` | `text().notNull()` | NO | Satuan unit (cth: "Roll", "Pcs", "Botol", "Drigen") |
| `min_stock_central` | `INTEGER` | `integer().notNull()` | NO | Ambang batas aman stok pusat |
| `current_stock_central` | `INTEGER` | `integer().notNull()` | NO | Jumlah stok fisik aktual saat ini di gudang pusat |
| `is_orderable` | `INTEGER` | `integer({ mode: "boolean" }).notNull().default(true)` | NO | Status apakah item boleh dipesan oleh toko cabang |


#### Table: `store_requests`
Permintaan restock barang daily consumable dari toko ke pusat.
| Kolom | Tipe Data SQLite | Drizzle Type | Nullable | Keterangan |
|---|---|---|---|---|
| `id` | `TEXT` | `text().primaryKey()` | NO | UUID v4 |
| `store_name` | `TEXT` | `text().notNull()` | NO | Nama toko pemohon |
| `product_id` | `TEXT` | `text().references(() => products.id).notNull()` | NO | Relasi Foreign Key ke `products.id` |
| `quantity_requested` | `INTEGER` | `integer().notNull()` | NO | Jumlah barang diminta |
| `status` | `TEXT` | `text({ enum: requestStatusEnum }).notNull().default("PENDING")` | NO | Status alur restock |
| `notes` | `TEXT` | `text()` | YES | Keterangan / alasan |
| `created_at` | `INTEGER` | `integer({ mode: "timestamp" }).notNull().defaultNow()` | NO | Waktu permohonan |

#### Table: `equipment_requests`
Pengajuan permohonan pembelian/pengadaan peralatan toko ke kantor pusat.
| Kolom | Tipe Data SQLite | Drizzle Type | Nullable | Keterangan |
|---|---|---|---|---|
| `id` | `TEXT` | `text().primaryKey()` | NO | UUID v4 |
| `store_name` | `TEXT` | `text().notNull()` | NO | Nama toko yang mengajukan |
| `equipment_name` | `TEXT` | `text().notNull()` | NO | Nama alat/peralatan (cth: "Barcode Scanner Wireless") |
| `reason` | `TEXT` | `text({ enum: equipmentReasonEnum }).notNull()` | NO | `'DAMAGED_REPLACEMENT'` atau `'NEW_PROCUREMENT'` |
| `quantity` | `INTEGER` | `integer().notNull().default(1)` | NO | Jumlah unit yang diajukan untuk dibeli |
| `description` | `TEXT` | `text().notNull()` | NO | Rincian kebutuhan, kondisi rusak, atau spesifikasi |
| `image_url` | `TEXT` | `text()` | YES | Path simulasi foto bukti rusak / referensi |
| `urgency` | `TEXT` | `text({ enum: equipmentUrgencyEnum }).notNull().default("MEDIUM")` | NO | `'LOW'`, `'MEDIUM'`, atau `'HIGH'` |
| `status` | `TEXT` | `text({ enum: equipmentStatusEnum }).notNull().default("PENDING")` | NO | Status alur pembelian |
| `created_at` | `INTEGER` | `integer({ mode: "timestamp" }).notNull().defaultNow()` | NO | Waktu pengajuan |

---

## 5. Core Business Logic & State Machines

### 5.1. Logika Status Stok Pusat (`getStockStatus`)
```typescript
export function getStockStatus(current: number, min: number): "KRITIS" | "WARNING" | "AMAN" {
  if (current <= Math.ceil(min * 0.8)) return "KRITIS";
  if (current <= min) return "WARNING";
  return "AMAN";
}
```
- **`KRITIS`**: $current \le 80\% \times min$. Muncul badge `Perlu Restock Vendor`.
- **`WARNING`**: $80\% \times min < current \le min$.
- **`AMAN`**: $current > min$.

### 5.2. Alur Status Restock Toko (`store_requests`)
```
               [Staf Toko] Buat Request
                          │
                          ▼
                     ┌─────────┐
                     │ PENDING │
                     └────┬────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    [Admin Pusat] Tolak         [Admin Pusat] Setujui
    ┌──────────┐                ┌──────────┐
    │ REJECTED │                │ APPROVED │
    └──────────┘                └────┬─────┘
                                     │ (Stok Pusat OTOMATIS berkurang via DB Transaction)
                                     ▼
                                [Admin Pusat] Kirim Barang
                                ┌─────────┐
                                │ SHIPPED │
                                └────┬────┘
                                     │
                                     ▼
                                [Staf Toko] Konfirmasi Barang Diterima
                                ┌──────────┐
                                │ RECEIVED │
                                └──────────┘
```

### 5.3. Alur Pengajuan Pembelian Equipment (`equipment_requests`)
```
    [Staf Toko] Ajukan Pembelian Equipment
    - Alasan: DAMAGED_REPLACEMENT atau NEW_PROCUREMENT
    - Kuantitas unit & Urgensi (LOW / MEDIUM / HIGH)
                          │
                          ▼
                     ┌─────────┐
                     │ PENDING │ (Menunggu Review Pusat)
                     └────┬────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    [Admin Pusat] Tolak         [Admin Pusat] Setujui Pengadaan
    ┌──────────┐                ┌──────────┐
    │ REJECTED │                │ APPROVED │
    └──────────┘                └────┬─────┘
                                     │
                                     ▼
                                [Admin Pusat] Proses Pembelian / Beli ke Vendor
                                ┌─────────┐
                                │ ORDERED │
                                └────┬────┘
                                     │
                                     ▼
                                [Staf Toko] Konfirmasi Barang Diterima Toko
                                ┌───────────┐
                                │ COMPLETED │
                                └───────────┘
```

---

## 6. Server Actions & API Contracts

Semua Server Action bertipe `Promise<ActionResult>`:
```typescript
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };
```

### 6.1. Equipment Actions (`src/actions/equipment.ts`)
- **`createEquipmentRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult>`**:
  - Menerima `store_name`, `equipment_name`, `reason`, `quantity`, `description`, `urgency`, dan file foto `image`.
  - Validasi: `quantity >= 1`, panjang deskripsi $\ge 5$ karakter, enum reason valid.
  - Menyimpan data dengan status awal `PENDING`.
- **`updateEquipmentRequestStatus(requestId: string, status: string): Promise<ActionResult>`**:
  - Memperbarui status alur: `APPROVED`, `ORDERED`, `COMPLETED`, `REJECTED`.
  - Revalidasi otomatis path: `"/equipment"`, `"/repairs"`, `"/"`.

### 6.2. Google Sheets Synchronization Actions (`src/actions/sync.ts`)
- **`syncProductsFromGoogleSheet(sheetId?: string): Promise<ActionResult>`**:
  - Mengambil data CSV live dari endpoint Google Sheets export (`/export?format=csv`).
  - Mem-parsing kolom `SKU`, `Nama Barang`, `Satuan 1`, dan `Status` ("Bisa Dipesan Toko" vs "Tidak Bisa Dipesan Toko").
  - Menjaga integritas data: stok fisik dan minimum stok yang sudah diinput Admin Pusat di database **tidak akan hilang/ter-reset**.
  - Meng-upsert barang baru dan memperbarui status `is_orderable`.
  - Memanggil revalidasi halaman `/inventory`, `/requests`, dan `/`.

### 6.3. Requests Actions (`src/actions/requests.ts`)
- **`createStoreRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult>`**: Validasi stok $> 0$ dan kuantitas $\le$ stok pusat.
- **`approveStoreRequest(requestId: string): Promise<ActionResult>`**: Atomic deduction stok produk dalam `db.transaction()`.
- **`rejectStoreRequest(requestId: string): Promise<ActionResult>`**: Mengubah status request menjadi `REJECTED`.
- **`updateRequestStatus(requestId: string, status: string): Promise<ActionResult>`**: Transisi `SHIPPED` dan `RECEIVED`.
- **`deleteStoreRequest(requestId: string): Promise<ActionResult>`**: Admin Pusat menghapus riwayat pengajuan stok dari database. Revalidasi path `"/requests"` dan `"/"`.


### 6.4. Stock Actions (`src/actions/stock.ts`)
- **`updateCentralStock(productId: string, newStock: number, newMinStock: number): Promise<ActionResult>`**:
  - Validasi integer $\ge 0$.
  - Revalidasi path: `"/inventory"`, `"/requests"`, `"/"`.
- **`deleteCentralProduct(productId: string): Promise<ActionResult>`**:
  - Menghapus item dari master stok pusat (`products`).
  - Dilengkapi proteksi error jika ada foreign key constraint riwayat pengajuan toko.
  - Revalidasi path: `"/inventory"`, `"/requests"`, `"/"`.

### 6.5. Keamanan (Sesi & Otorisasi)
- **Sesi**: cookie `stokify_session` berisi `{uid, exp}` bertanda tangan HMAC-SHA256 (`src/lib/session.ts`, kunci dari env `SESSION_SECRET`). Middleware memverifikasi tanda tangan; `getCurrentUser()` membaca ulang user dari database.
- **Password**: disimpan sebagai hash scrypt (`src/lib/password.ts`), minimal 8 karakter. Password plaintext lama otomatis di-hash saat login berhasil. Login dikunci 15 menit setelah 10 kali gagal per username.
- **Otorisasi wajib di server**: setiap server action memanggil `authorize()` / `requireUser()` dari `src/lib/authz.ts`. Jangan mengandalkan penyembunyian tombol di UI. Aksi pusat (approve/reject, inflow supplier, surat jalan, adjustment pusat, rollback, ubah/hapus master, sync sheet, kelola user) hanya `ADMIN_PUSAT`.
- **Scope toko**: untuk `STAF_TOKO`, nama toko selalu diambil dari akunnya (`resolveStoreName`), bukan dari input client. Konfirmasi `RECEIVED` / `COMPLETED` hanya untuk toko sendiri.
- **Foto lampiran**: disimpan di `DATA_DIR/uploads/<uuid>.<ext>` (JPG/PNG/WEBP/GIF, maks 8 MB, dicek dari isi file) dan disajikan oleh `src/app/uploads/[file]/route.ts` hanya untuk user yang login.
- **Bootstrap DB**: `src/instrumentation.ts` → `src/db/bootstrap.ts` membuat tabel bila belum ada dan admin pertama dari `INITIAL_ADMIN_PASSWORD` bila tabel `users` kosong. Tidak menghapus data.

### 6.6. Dashboard Actions (`src/actions/dashboard.ts`)
- **`getDashboardStats(): Promise<DashboardStats>`**:
  - Menghitung agregasi `totalItems`, `criticalCount`, `pendingRequests`, `pendingEquipmentRequests`, `chartData`, dan daftar `lowStock`.

---

## 7. Development Commands

```bash
# Development Server
npm run dev

# Sinkronisasi Skema ke SQLite / Turso
npm run db:push

# Seeding Data DEMO (HANYA lokal; menghapus semua tabel; ditolak bila NODE_ENV=production
# atau bila database sudah berisi user). Password akun demo: "password".
npm run db:seed
# Paksa reset database lokal ke data demo
npm run db:reset-demo

# Drizzle Studio GUI
npm run db:studio

# Production Build & Start
npm run build
npm run start
```

### Deployment (Docker / Dokploy)
- `Dockerfile` membangun output `standalone`. Data (SQLite + uploads) ada di volume `/app/data`.
- Env wajib: `SESSION_SECRET` (min 32 karakter), `INITIAL_ADMIN_PASSWORD` (hanya dipakai saat users kosong). Default di image: `DATABASE_URL=file:/app/data/stokify.db`, `DATA_DIR=/app/data`.
- **Jangan** isi secret di `.env` — file itu ikut ter-commit ke repo.

