"use server";

import type { EventMode } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotifications } from "@/lib/notifications";

function formatTimeRange(startsAt: Date, endsAt: Date) {
  return `${startsAt.toLocaleString("ru-RU")} - ${endsAt.toLocaleString("ru-RU")}`;
}

export type CreateEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export async function createEventAction(input: {
  title: string;
  description?: string;
  startsAt: Date | string;
  endsAt: Date | string;
  mode?: EventMode;
  participantIds?: string[];
}): Promise<CreateEventResult> {
  try {
    const user = await requireSession();
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const participantIds = Array.from(new Set([user.id, ...(input.participantIds ?? [])]));

    if (!input.title.trim()) {
      return { ok: false, error: "Название события обязательно" };
    }
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      return { ok: false, error: "Некорректное время события" };
    }

    const existingEvent = await db.event.findFirst({
      where: {
        OR: [
          { creatorId: { in: participantIds } },
          { participants: { some: { userId: { in: participantIds } } } }
        ],
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      },
      select: {
        title: true,
        startsAt: true,
        endsAt: true,
        participants: {
          select: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (existingEvent) {
      const participantNames = existingEvent.participants.map((item) => item.user.name).join(", ");
      return {
        ok: false,
        error: `Конфликт с событием «${existingEvent.title}» (${formatTimeRange(existingEvent.startsAt, existingEvent.endsAt)}). Участники: ${participantNames || "создатель"}`
      };
    }

    const event = await db.event.create({
      data: {
        title: input.title.trim(),
        description: input.description,
        startsAt,
        endsAt,
        mode: input.mode ?? "OFFICE",
        creatorId: user.id,
        participants: {
          create: participantIds.map((userId) => ({ userId }))
        }
      }
    });

    try {
      const formattedStart = startsAt.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      });

      await createNotifications(
        participantIds
          .filter((id) => id !== user.id)
          .map((recipientId) => ({
            recipientId,
            actorId: user.id,
            type: "EVENT_INVITE",
            title: `Приглашение: ${event.title}`,
            body: formattedStart,
            href: "/calendar"
          }))
      );
    } catch (error) {
      console.warn("Event notification skipped:", error);
    }

    revalidatePath("/");
    revalidatePath("/calendar");
    return { ok: true, eventId: event.id };
  } catch (error) {
    console.error("createEventAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось создать событие"
    };
  }
}

export async function deleteEventAction(eventId: string) {
  const user = await requireSession();
  const event = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    select: { creatorId: true }
  });

  if (event.creatorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить событие может создатель или администратор");
  }

  await db.event.delete({
    where: { id: eventId }
  });

  revalidatePath("/");
}
