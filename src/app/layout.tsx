import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/actions/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Stokify — Logistics Ops Edition",
    template: "%s · Stokify",
  },
  description:
    "Sistem Manajemen Stok Multi-Store & Pusat Warehouse Logistik Real-Time.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans bg-[#090A0D] text-zinc-100 antialiased`}>
        {user ? <AppShell user={user}>{children}</AppShell> : children}
      </body>
    </html>
  );
}
