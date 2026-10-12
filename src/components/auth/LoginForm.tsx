"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Warehouse,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Store,
  Sparkles,
} from "lucide-react";
import { loginWithCredentials } from "@/actions/auth";

const QUICK_ACCOUNTS = [
  {
    role: "ADMIN_PUSAT",
    username: "admin",
    password: "password",
    label: "Admin Pusat",
    desc: "Akses penuh gudang pusat & picking list",
    icon: Warehouse,
    color: "amber",
  },
  {
    role: "STAF_TOKO",
    username: "toko.surabaya",
    password: "password",
    label: "Toko Surabaya",
    desc: "Permintaan barang & closing harian",
    icon: Store,
    color: "sky",
  },
  {
    role: "STAF_TOKO",
    username: "toko.bandung",
    password: "password",
    label: "Toko Bandung",
    desc: "Permintaan barang & closing harian",
    icon: Store,
    color: "emerald",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const userToSubmit = customUser !== undefined ? customUser : username;
    const passToSubmit = customPass !== undefined ? customPass : password;

    if (!userToSubmit.trim() || !passToSubmit.trim()) {
      setErrorMsg("Harap masukkan username dan password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCredentials(userToSubmit, passToSubmit);
      if (!res.ok) {
        setErrorMsg(res.message);
        setIsLoading(false);
        return;
      }

      // Berhasil login, arahkan ke dashboard
      router.push("/");
      router.refresh();
    } catch {
      setErrorMsg("Gagal melakukan login. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 border border-amber-300/50">
          <Warehouse className="h-7 w-7 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-2">
            Stokify
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/25">
              OPS HUB
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Multi-Store & Central Warehouse Logistics Management
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121620]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Username / ID Pengguna
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <User className="h-4 w-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: admin atau toko.surabaya"
                autoComplete="username"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0A0D14] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-amber-400/50 focus:bg-[#0E121B] focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-amber-500/20 transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              1-Klik Akses Demo Akun
            </p>
          </div>

          <div className="grid gap-2">
            {QUICK_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickLogin(acc.username, acc.password)}
                  disabled={isLoading}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.04] group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        acc.color === "amber"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : acc.color === "sky"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                          {acc.label}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                          {acc.username}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-zinc-400 mt-0.5">
                        {acc.desc}
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-zinc-500 group-hover:text-amber-400 shrink-0 ml-2 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400">
        Default Password: <code className="text-zinc-300 font-mono">password</code> · Stokify Security Subsystem
      </p>
    </div>
  );
}
