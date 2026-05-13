"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Bell, BellRing, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} д назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await getMyNotifications(20);
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch (error) {
      console.warn("Не удалось загрузить уведомления:", error);
    }
  }, []);

  React.useEffect(() => {
    void fetchNotifications();
    const id = window.setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchNotifications]);

  React.useEffect(() => {
    if (!open) return undefined;

    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = React.useCallback(async () => {
    setOpen((prev) => !prev);
    if (!open) {
      setIsLoading(true);
      await fetchNotifications();
      setIsLoading(false);
    }
  }, [open, fetchNotifications]);

  const handleItemClick = React.useCallback(
    async (item: NotificationItem) => {
      if (!item.isRead) {
        setItems((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry))
        );
        setUnread((prev) => Math.max(0, prev - 1));
        try {
          await markNotificationAsRead(item.id);
        } catch (error) {
          console.warn(error);
        }
      }
      setOpen(false);
    },
    []
  );

  const handleMarkAll = React.useCallback(async () => {
    setItems((prev) => prev.map((entry) => ({ ...entry, isRead: true })));
    setUnread(0);
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.warn(error);
    }
  }, []);

  const handleDelete = React.useCallback(async (id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
    try {
      await deleteNotification(id);
    } catch (error) {
      console.warn(error);
    }
    void fetchNotifications();
  }, [fetchNotifications]);

  const BellIcon = unread > 0 ? BellRing : Bell;

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="soft"
        size="icon"
        onClick={handleToggle}
        aria-label="Уведомления"
        aria-expanded={open}
        className="relative shrink-0"
      >
        <BellIcon className={cn("size-5", unread > 0 && "text-primary")} aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Список уведомлений"
          className="fixed inset-x-2 top-[68px] z-40 max-h-[calc(100dvh-88px)] overflow-hidden rounded-default bg-white shadow-float ring-1 ring-border sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:max-h-[460px] sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-foreground">Уведомления</p>
              <p className="text-xs text-muted-foreground">
                {unread > 0 ? `Непрочитанных: ${unread}` : "Всё прочитано"}
              </p>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 rounded-full bg-neos-accentSoft px-3 py-1 text-xs font-bold text-primary transition active:scale-95"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Прочитать всё
              </button>
            ) : null}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Загрузка…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Уведомлений пока нет
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {items.map((item) => {
                  const Content = (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          item.isRead ? "bg-transparent" : "bg-primary"
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            item.isRead ? "font-medium text-foreground/80" : "font-bold text-foreground"
                          )}
                        >
                          {item.title}
                        </p>
                        {item.body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                          {item.actor ? ` · ${item.actor.name}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleDelete(item.id);
                        }}
                        aria-label="Удалить уведомление"
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  );

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href as Route}
                          onClick={() => void handleItemClick(item)}
                          className="block transition hover:bg-neos-accentSoft/40 active:scale-[0.998]"
                        >
                          {Content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleItemClick(item)}
                          className="block w-full text-left transition hover:bg-neos-accentSoft/40"
                        >
                          {Content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2">
              <span className="text-[11px] text-muted-foreground">
                Обновляется каждые 30 сек
              </span>
              <Check className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
