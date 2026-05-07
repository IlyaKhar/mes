"use client";

import Image from "next/image";
import Link from "next/link";
import { navigationItems } from "@/components/layout/navigation-config";
import { useActiveNavigation } from "@/components/layout/use-active-navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const activeItem = useActiveNavigation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] bg-white/78 px-4 py-5 shadow-float backdrop-blur-2xl lg:block">
      <Link
        href="/"
        className="mb-8 flex items-center gap-3 rounded-default bg-white p-3 shadow-card ring-1 ring-border transition hover:shadow-float"
      >
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-default bg-white">
          <Image
            src="/logo.png"
            alt="NEOS"
            width={48}
            height={48}
            className="size-12 object-contain"
            priority
          />
        </div>
        <div>
          <p className="text-lg font-black tracking-tight">NEOS</p>
          <p className="text-xs font-semibold text-muted-foreground">Единый центр компании</p>
        </div>
      </Link>

      <nav aria-label="Главная навигация" className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem.id === item.id;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-default px-4 py-3 text-sm font-bold transition hover:bg-neos-accentSoft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive ? "bg-primary text-white shadow-card hover:bg-primary hover:text-white" : "text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive ? "text-white" : "text-foreground group-hover:text-primary")} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
