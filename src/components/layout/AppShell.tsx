"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/actions/auth";

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#090A0D]">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <TopBar user={user} />
      <main
        className={cn(
          "pb-24 pt-16 transition-[padding] duration-300 lg:pt-0 lg:pb-8",
          collapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
