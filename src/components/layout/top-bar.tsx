"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronRight, ShieldCheck } from "lucide-react";
import { CommandCenter } from "@/components/command-center";
import { useActiveNavigation } from "@/components/layout/use-active-navigation";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { data: session } = useSession();
  const activeItem = useActiveNavigation();
  const ActiveIcon = activeItem.icon;
  const userName = session?.user?.name ?? "Пользователь OKEI";
  const userRole = session?.user?.role === "ADMIN" ? "Администратор" : "Пользователь";

  return (
    <header className="sticky top-0 z-20 flex min-h-20 flex-col items-start justify-between gap-4 bg-white/86 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:px-8">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          <span>OKEI</span>
          <ChevronRight className="size-4 text-primary" aria-hidden="true" />
          <span className="text-primary">{activeItem.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
            <ActiveIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{activeItem.title}</h1>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-muted-foreground">{activeItem.description}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
        <CommandCenter />
        <Button variant="soft" size="icon" aria-label="Открыть уведомления">
          <Bell className="size-5" aria-hidden="true" />
        </Button>
        <div className="flex items-center gap-3 rounded-default bg-white px-4 py-2 shadow-card ring-1 ring-border">
          <div className="flex size-10 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-black">{userName}</p>
            <p className="text-xs font-semibold text-muted-foreground">{userRole}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
