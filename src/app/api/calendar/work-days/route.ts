import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateWorkIntervals } from "@/lib/calendar/shifts";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from") as string) : new Date();
  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      shiftPattern: true,
      shiftStartedAt: true,
      workdayStartsAt: true,
      workdayEndsAt: true
    }
  });
  const workDays = generateWorkIntervals({
    from,
    monthsAhead: 1,
    pattern: user.shiftPattern,
    shiftStartedAt: user.shiftStartedAt,
    workdayStartsAt: user.workdayStartsAt,
    workdayEndsAt: user.workdayEndsAt
  }).map((interval) => ({
    startsAt: interval.startsAt.toISOString(),
    endsAt: interval.endsAt.toISOString(),
    pattern: interval.pattern
  }));

  return NextResponse.json({ workDays });
}
