import type { TicketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as TicketStatus | null;
  const onlyEscalated = searchParams.get("isEscalated") === "true";

  const tickets = await db.ticket.findMany({
    where: {
      department: user.department,
      ...(status ? { status } : {}),
      ...(onlyEscalated ? { isEscalated: true } : {})
    },
    orderBy: [
      { isEscalated: "desc" },
      { slaDueAt: "asc" }
    ],
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      supportAgent: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ tickets });
}
