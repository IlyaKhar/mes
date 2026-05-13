import type { TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { createNotifications } from "@/lib/notifications";

const activeTicketStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING"];

export async function escalateExpiredTickets() {
  const now = new Date();

  const expired = await db.ticket.findMany({
    where: {
      isEscalated: false,
      status: { in: activeTicketStatuses },
      slaDueAt: { lt: now }
    },
    select: {
      id: true,
      number: true,
      title: true,
      creatorId: true,
      supportAgentId: true
    }
  });

  if (expired.length === 0) return { count: 0 };

  const result = await db.ticket.updateMany({
    where: { id: { in: expired.map((ticket) => ticket.id) } },
    data: { isEscalated: true }
  });

  const items = expired.flatMap((ticket) => {
    const recipients = new Set<string>([ticket.creatorId]);
    if (ticket.supportAgentId) recipients.add(ticket.supportAgentId);

    return Array.from(recipients).map((recipientId) => ({
      recipientId,
      type: "TICKET_ESCALATED" as const,
      title: `SLA нарушен: заявка #${ticket.number}`,
      body: ticket.title,
      href: "/helpdesk"
    }));
  });

  try {
    await createNotifications(items);
  } catch (error) {
    console.warn("Escalation notifications skipped:", error);
  }

  return result;
}
