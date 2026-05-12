"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare, Home, HelpCircle, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Обзор", icon: Home },
  { href: "/messenger", label: "Чаты", icon: MessageSquareText },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/helpdesk", label: "Заявки", icon: HelpCircle },
  { href: "/calendar", label: "События", icon: CalendarDays }
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Быстрая навигация"
      className="safe-pb fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 px-2 pt-1.5 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-default px-1 transition active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn("size-5", isActive && "drop-shadow-[0_0_8px_rgba(26,61,99,0.25)]")}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-bold leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
