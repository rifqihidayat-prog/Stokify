import { redirect } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { getUsers } from "@/actions/users";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsersHub } from "@/components/users/UsersHub";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Kelola Pengguna & Hak Akses — Stokify",
  description: "Manajemen akun staf toko dan admin gudang pusat Stokify.",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Jika akun adalah staf toko, batasi akses
  if (currentUser.role !== "ADMIN_PUSAT") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 mb-4 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">
          Akses Terbatas: Admin Pusat
        </h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Halaman pengelolaan akun pengguna dan kredensial login hanya dapat diakses oleh{" "}
          <strong className="text-amber-400">Admin Gudang Pusat</strong>. Akun Anda saat ini terdaftar sebagai{" "}
          <span className="text-sky-300 font-semibold">Staf Toko ({currentUser.store_name})</span>.
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allUsers = await getUsers();

  return (
    <>
      <PageHeader
        title="Kelola Pengguna & Hak Akses"
        subtitle="Atur akun staf toko cabang, admin gudang pusat, penugasan lokasi, dan kata sandi login."
      />

      <UsersHub initialUsers={allUsers} currentUserId={currentUser.id} />
    </>
  );
}
