import { NextResponse } from "next/server";
import { escalateExpiredTickets } from "@/lib/jobs/escalate-expired-tickets";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (cronSecret && requestSecret !== cronSecret) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 401 });
  }

  const result = await escalateExpiredTickets();

  return NextResponse.json({
    escalated: result.count
  });
}
