import type { TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";

const activeTicketStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING"];

export async function escalateExpiredTickets() {
  const now = new Date();

  return db.ticket.updateMany({
    where: {
      isEscalated: false,
      status: {
        in: activeTicketStatuses
      },
      slaDueAt: {
        lt: now
      }
    },
    data: {
      isEscalated: true
    }
  });
}
