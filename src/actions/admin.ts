"use server";

import type { Department, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const user = await requireSession();

  if (user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return user;
}

type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function setUserBannedAction(input: { userId: string; isBanned: boolean }) {
  const actor = await requireAdmin();

  const user = await db.user.update({
    where: { id: input.userId },
    data: { isBanned: input.isBanned }
  });

  await db.actionLog.create({
    data: {
      actorId: actor.id,
      type: "BAN",
      entity: "User",
      entityId: user.id,
      metadata: { isBanned: input.isBanned }
    }
  });

  revalidatePath("/admin");
}

export async function updateUserRoleAction(input: {
  userId: string;
  role: Role;
}): Promise<AdminActionResult> {
  try {
    const actor = await requireAdmin();

    if (actor.id === input.userId && input.role !== "ADMIN") {
      return { ok: false, error: "Нельзя снять с себя роль администратора" };
    }

    const target = await db.user.findUnique({
      where: { id: input.userId },
      select: { role: true }
    });

    if (!target) {
      return { ok: false, error: "Пользователь не найден" };
    }

    if (target.role === "ADMIN" && input.role !== "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN", isBanned: false } });

      if (adminCount <= 1) {
        return { ok: false, error: "Нельзя убрать последнего администратора" };
      }
    }

    const user = await db.user.update({
      where: { id: input.userId },
      data: { role: input.role }
    });

    await db.actionLog.create({
      data: {
        actorId: actor.id,
        type: "ROLE_CHANGE",
        entity: "User",
        entityId: user.id,
        metadata: { role: input.role }
      }
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("updateUserRoleAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось обновить роль"
    };
  }
}

export async function updateUserDepartmentAction(input: {
  userId: string;
  department: Department;
}): Promise<AdminActionResult> {
  try {
    const actor = await requireAdmin();

    const user = await db.user.update({
      where: { id: input.userId },
      data: { department: input.department }
    });

    await db.actionLog.create({
      data: {
        actorId: actor.id,
        type: "UPDATE",
        entity: "User",
        entityId: user.id,
        metadata: { department: input.department }
      }
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    console.error("updateUserDepartmentAction failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось обновить отдел"
    };
  }
}
