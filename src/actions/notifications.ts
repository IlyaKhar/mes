"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

export async function getMyNotifications(limit = 20): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const user = await requireSession();

  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: { select: { id: true, name: true } } }
    }),
    db.notification.count({
      where: { recipientId: user.id, isRead: false }
    })
  ]);

  return {
    unreadCount,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      href: item.href,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor
    }))
  };
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await requireSession();

  await db.notification.updateMany({
    where: { id: notificationId, recipientId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });

  revalidatePath("/");
  return { ok: true };
}

export async function markAllNotificationsAsRead() {
  const user = await requireSession();

  await db.notification.updateMany({
    where: { recipientId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteNotification(notificationId: string) {
  const user = await requireSession();

  await db.notification.deleteMany({
    where: { id: notificationId, recipientId: user.id }
  });

  revalidatePath("/");
  return { ok: true };
}
