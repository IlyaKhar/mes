import type { ShiftPattern } from "@prisma/client";

export type WorkInterval = {
  startsAt: Date;
  endsAt: Date;
  pattern: ShiftPattern;
};

type GenerateWorkIntervalsInput = {
  from: Date;
  monthsAhead?: number;
  pattern: ShiftPattern;
  shiftStartedAt?: Date | null;
  workdayStartsAt: string;
  workdayEndsAt: string;
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);

  return result;
}

function applyTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);

  return result;
}

function getDayDiff(left: Date, right: Date) {
  const msInDay = 24 * 60 * 60 * 1000;

  return Math.floor((startOfDay(left).getTime() - startOfDay(right).getTime()) / msInDay);
}

function isFiveTwoWorkday(date: Date) {
  const day = date.getDay();

  return day !== 0 && day !== 6;
}

function isTwoTwoWorkday(date: Date, shiftStartedAt?: Date | null) {
  const anchor = shiftStartedAt ?? new Date("2026-01-01T00:00:00.000Z");
  const dayDiff = getDayDiff(date, anchor);
  const cycleDay = ((dayDiff % 4) + 4) % 4;

  return cycleDay === 0 || cycleDay === 1;
}

function isWorkday(date: Date, pattern: ShiftPattern, shiftStartedAt?: Date | null) {
  if (pattern === "TWO_TWO") return isTwoTwoWorkday(date, shiftStartedAt);

  return isFiveTwoWorkday(date);
}

export function intervalsOverlap(left: { startsAt: Date; endsAt: Date }, right: { startsAt: Date; endsAt: Date }) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function generateWorkIntervals(input: GenerateWorkIntervalsInput): WorkInterval[] {
  const intervals: WorkInterval[] = [];
  const start = startOfDay(input.from);
  const end = addMonths(start, input.monthsAhead ?? 1);

  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
    if (!isWorkday(cursor, input.pattern, input.shiftStartedAt)) continue;

    intervals.push({
      startsAt: applyTime(cursor, input.workdayStartsAt),
      endsAt: applyTime(cursor, input.workdayEndsAt),
      pattern: input.pattern
    });
  }

  return intervals;
}
