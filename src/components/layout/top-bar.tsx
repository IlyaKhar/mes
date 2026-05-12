"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import { CommandCenter } from "@/components/command-center";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useActiveNavigation } from "@/components/layout/use-active-navigation";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { data: session } = useSession();
  const activeItem = useActiveNavigation();
  const ActiveIcon = activeItem.icon;
  const userName = session?.user?.name ?? "Пользователь OKES";
  const isAdmin = session?.user?.role === "ADMIN";
  const userRole = isAdmin ? "Администратор" : "Сотрудник";
  const roleHint = isAdmin
    ? "Видит данные всех отделов, может управлять пользователями и ролями"
    : "Работает с данными своего отдела";
  const RoleIcon = isAdmin ? ShieldCheck : UserRound;

  return (
    <header className="safe-pt sticky top-0 z-20 flex min-h-16 flex-col items-stretch gap-3 bg-white/86 px-4 py-3 backdrop-blur-xl sm:px-6 lg:min-h-20 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8 lg:py-4">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />

        <div className="min-w-0 flex-1">
          <div className="mb-1 hidden flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground sm:flex">
            <span>OKES</span>
            <ChevronRight className="size-4 text-primary" aria-hidden="true" />
            <span className="text-primary">{activeItem.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden size-11 shrink-0 items-center justify-center rounded-default bg-neos-accentSoft text-primary sm:flex">
              <ActiveIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
                {activeItem.title}
              </h1>
              <p className="mt-0.5 line-clamp-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {activeItem.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <CommandCenter />
          <Button
            variant="soft"
            size="icon"
            aria-label="Открыть уведомления"
            className="shrink-0"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="hidden w-full flex-wrap items-center gap-3 lg:flex lg:w-auto">
        <CommandCenter />
        <Button variant="soft" size="icon" aria-label="Открыть уведомления">
          <Bell className="size-5" aria-hidden="true" />
        </Button>
        <div
          className="flex items-center gap-3 rounded-default bg-white px-4 py-2 shadow-card ring-1 ring-border"
          title={roleHint}
        >
          <div className="flex size-10 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
            <RoleIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{userName}</p>
            <p className="text-xs font-medium text-muted-foreground">{userRole}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
