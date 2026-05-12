"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { adminNavigationItem, navigationItems } from "@/components/layout/navigation-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const userName = session?.user?.name ?? "Пользователь OKES";
  const userRole = isAdmin ? "Администратор" : "Сотрудник";
  const RoleIcon = isAdmin ? ShieldCheck : UserRound;

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = isAdmin ? [...navigationItems, adminNavigationItem] : navigationItems;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="soft"
          size="icon"
          aria-label="Открыть меню"
          className="lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col bg-background shadow-float focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden"
        >
          <Dialog.Title className="sr-only">Главное меню OKES</Dialog.Title>

          <div className="safe-pt flex items-center justify-between px-4 py-4">
            <Link
              href="/"
              aria-label="OKES — на главную"
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.png"
                alt="OKES"
                width={120}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Закрыть меню">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mx-4 mb-2 flex items-center gap-3 rounded-default bg-white p-3 shadow-card ring-1 ring-border">
            <div className="flex size-10 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
              <RoleIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{userName}</p>
              <p className="text-xs font-medium text-muted-foreground">{userRole}</p>
            </div>
          </div>

          <nav aria-label="Главная навигация" className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-[48px] items-center gap-3 rounded-default px-4 text-sm font-bold transition active:scale-[0.99]",
                        isActive
                          ? "bg-primary text-white shadow-card"
                          : "text-foreground hover:bg-neos-accentSoft hover:text-primary"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5",
                          isActive ? "text-white" : "text-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="safe-pb border-t border-border/70 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Выйти
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
