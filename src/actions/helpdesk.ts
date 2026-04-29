"use server";

import type { Department, Priority, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

const priorityDeadlineHours: Record<Priority, number> = {
  CRITICAL: 1,
  HIGH: 4,
  MEDIUM: 24,
  LOW: 48
};

function getTicketDeadline(priority: Priority) {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + priorityDeadlineHours[priority]);

  return deadline;
}

export async function createTicket(input: {
  title: string;
  description: string;
  priority: Priority;
  department?: Department;
}) {
  const user = await requireSession();
  const department = input.department ?? (user.department as Department);
  if (!input.title.trim()) throw new Error("Название заявки обязательно");
  if (!input.description.trim()) throw new Error("Описание заявки обязательно");

  const ticket = await db.ticket.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      department,
      slaDueAt: getTicketDeadline(input.priority),
      creatorId: user.id
    }
  });

  revalidatePath("/");
  return ticket;
}

export const createTicketAction = createTicket;

export async function assignTicketOwnerAction(input: {
  ticketId: string;
  supportAgentId: string | null;
}) {
  await requireSession();

  const ticket = await db.ticket.update({
    where: { id: input.ticketId },
    data: { supportAgentId: input.supportAgentId || null }
  });

  revalidatePath("/");
  return ticket;
}

export async function updateTicketStatusAction(input: {
  ticketId: string;
  status: TicketStatus;
}) {
  await requireSession();

  const ticket = await db.ticket.update({
    where: { id: input.ticketId },
    data: { status: input.status }
  });

  revalidatePath("/");
  return ticket;
}

export async function deleteTicketAction(ticketId: string) {
  const user = await requireSession();
  const ticket = await db.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    select: {
      creatorId: true,
      supportAgentId: true
    }
  });

  if (ticket.creatorId !== user.id && ticket.supportAgentId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить заявку может создатель, агент поддержки или администратор");
  }

  await db.ticket.delete({
    where: { id: ticketId }
  });

  revalidatePath("/");
}
