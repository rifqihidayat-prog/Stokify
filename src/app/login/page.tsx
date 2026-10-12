import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login Autentikasi — Stokify OPS Hub",
  description: "Masuk ke Sistem Manajemen Stok & Logistik Stokify",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#090A0D] px-4 py-12 overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-sky-500/5 blur-[100px]" />

      <LoginForm />
    </div>
  );
}
