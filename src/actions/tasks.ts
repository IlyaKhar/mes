"use server";

import type { Priority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

const boardStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const satisfies TaskStatus[];
type BoardTaskStatus = (typeof boardStatuses)[number];

function assertBoardStatus(status: TaskStatus): asserts status is BoardTaskStatus {
  if (!boardStatuses.includes(status as BoardTaskStatus)) {
    throw new Error("Недопустимый статус для Kanban-доски");
  }
}

export async function createTaskAction(input: {
  title: string;
  description?: string;
  assigneeId?: string;
  ticketId?: string;
  priority?: Priority;
  dueAt?: Date;
}) {
  const user = await requireSession();
  if (!input.title.trim()) throw new Error("Название задачи обязательно");

  const task = await db.task.create({
    data: {
      title: input.title.trim(),
      description: input.description,
      assigneeId: input.assigneeId || undefined,
      ticketId: input.ticketId || undefined,
      priority: input.priority ?? "MEDIUM",
      dueAt: input.dueAt,
      creatorId: user.id
    }
  });

  revalidatePath("/");
  return task;
}

export async function updateTaskStatusAction(input: {
  taskId: string;
  status: TaskStatus;
}) {
  await requireSession();
  assertBoardStatus(input.status);

  const task = await db.task.update({
    where: { id: input.taskId },
    data: { status: input.status }
  });

  revalidatePath("/");
  return task;
}

export const updateTaskStatus = updateTaskStatusAction;

export async function deleteTaskAction(taskId: string) {
  const user = await requireSession();
  const task = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      id: true,
      creatorId: true,
      assigneeId: true
    }
  });

  if (task.creatorId !== user.id && task.assigneeId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить задачу может создатель, исполнитель или администратор");
  }

  await db.task.delete({
    where: { id: taskId }
  });

  revalidatePath("/");
}

export async function startTimer(input: { taskId: string }) {
  const user = await requireSession();

  await db.task.findFirstOrThrow({
    where: {
      id: input.taskId,
      OR: [{ assigneeId: user.id }, { creatorId: user.id }]
    },
    select: { id: true }
  });

  return {
    taskId: input.taskId,
    userId: user.id,
    startedAt: new Date().toISOString()
  };
}

export async function stopTimer(input: {
  taskId: string;
  startedAt: string;
  stoppedAt?: string;
}) {
  const user = await requireSession();
  const startedAt = new Date(input.startedAt);
  const stoppedAt = input.stoppedAt ? new Date(input.stoppedAt) : new Date();
  const durationSeconds = Math.max(0, Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000));

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(stoppedAt.getTime())) {
    throw new Error("Некорректное время таймера");
  }

  await db.task.findFirstOrThrow({
    where: {
      id: input.taskId,
      OR: [{ assigneeId: user.id }, { creatorId: user.id }]
    },
    select: { id: true }
  });

  const timeLog = await db.timeLog.create({
    data: {
      taskId: input.taskId,
      userId: user.id,
      startedAt,
      stoppedAt,
      durationSeconds
    }
  });

  revalidatePath("/");
  return timeLog;
}
