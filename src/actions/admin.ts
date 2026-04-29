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

export async function updateUserRoleAction(input: { userId: string; role: Role }) {
  const actor = await requireAdmin();

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
}

export async function updateUserDepartmentAction(input: {
  userId: string;
  department: Department;
}) {
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
}
