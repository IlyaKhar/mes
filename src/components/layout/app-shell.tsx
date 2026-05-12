"use client";

import { usePathname } from "next/navigation";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />
      <div className="min-h-[100dvh] lg:pl-[260px]">
        <TopBar />
        <main className="px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <BottomTabBar />
    </div>
  );
}
