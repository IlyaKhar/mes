import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type CreateNotificationInput = {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  if (input.actorId && input.actorId === input.recipientId) return null;

  return db.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href
    }
  });
}

export async function createNotifications(items: CreateNotificationInput[]) {
  const filtered = items.filter((item) => item.actorId !== item.recipientId);
  if (filtered.length === 0) return { count: 0 };

  const data: Prisma.NotificationCreateManyInput[] = filtered.map((item) => ({
    recipientId: item.recipientId,
    actorId: item.actorId ?? null,
    type: item.type,
    title: item.title,
    body: item.body,
    href: item.href
  }));

  return db.notification.createMany({ data });
}
