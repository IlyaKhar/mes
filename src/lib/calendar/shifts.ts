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
  /** Как в Date.getTimezoneOffset(): разница UTC и локального времени в минутах */
  timezoneOffsetMinutes?: number;
};

function toLocalMs(utcMs: number, timezoneOffsetMinutes: number) {
  return utcMs - timezoneOffsetMinutes * 60 * 1000;
}

function fromLocalParts(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezoneOffsetMinutes: number
) {
  return new Date(
    Date.UTC(year, month, day, hours, minutes) + timezoneOffsetMinutes * 60 * 1000
  );
}

function getLocalParts(date: Date, timezoneOffsetMinutes: number) {
  const localMs = toLocalMs(date.getTime(), timezoneOffsetMinutes);
  const local = new Date(localMs);

  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    dayOfWeek: local.getUTCDay()
  };
}

function startOfLocalDay(date: Date, timezoneOffsetMinutes: number) {
  const parts = getLocalParts(date, timezoneOffsetMinutes);
  return fromLocalParts(parts.year, parts.month, parts.day, 0, 0, timezoneOffsetMinutes);
}

function addLocalDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addLocalMonths(date: Date, months: number, timezoneOffsetMinutes: number) {
  const parts = getLocalParts(date, timezoneOffsetMinutes);
  return fromLocalParts(parts.year, parts.month + months, parts.day, 0, 0, timezoneOffsetMinutes);
}

function applyLocalTime(day: Date, time: string, timezoneOffsetMinutes: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const parts = getLocalParts(day, timezoneOffsetMinutes);
  return fromLocalParts(parts.year, parts.month, parts.day, hours, minutes, timezoneOffsetMinutes);
}

function getDayDiff(left: Date, right: Date, timezoneOffsetMinutes: number) {
  const msInDay = 24 * 60 * 60 * 1000;
  const leftStart = startOfLocalDay(left, timezoneOffsetMinutes).getTime();
  const rightStart = startOfLocalDay(right, timezoneOffsetMinutes).getTime();

  return Math.floor((leftStart - rightStart) / msInDay);
}

function isFiveTwoWorkday(dayOfWeek: number) {
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

function isTwoTwoWorkday(
  date: Date,
  shiftStartedAt: Date | null | undefined,
  timezoneOffsetMinutes: number
) {
  const anchor = shiftStartedAt ?? new Date("2026-01-01T00:00:00.000Z");
  const dayDiff = getDayDiff(date, anchor, timezoneOffsetMinutes);
  const cycleDay = ((dayDiff % 4) + 4) % 4;

  return cycleDay === 0 || cycleDay === 1;
}

function isWorkday(
  date: Date,
  pattern: ShiftPattern,
  shiftStartedAt: Date | null | undefined,
  timezoneOffsetMinutes: number
) {
  const { dayOfWeek } = getLocalParts(date, timezoneOffsetMinutes);

  if (pattern === "TWO_TWO") {
    return isTwoTwoWorkday(date, shiftStartedAt, timezoneOffsetMinutes);
  }

  return isFiveTwoWorkday(dayOfWeek);
}

export function intervalsOverlap(
  left: { startsAt: Date; endsAt: Date },
  right: { startsAt: Date; endsAt: Date }
) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function isWithinWorkIntervals(
  startsAt: Date,
  endsAt: Date,
  intervals: WorkInterval[]
) {
  return intervals.some(
    (interval) => startsAt >= interval.startsAt && endsAt <= interval.endsAt
  );
}

export function generateWorkIntervals(input: GenerateWorkIntervalsInput): WorkInterval[] {
  const timezoneOffsetMinutes = input.timezoneOffsetMinutes ?? 0;
  const intervals: WorkInterval[] = [];
  const start = startOfLocalDay(input.from, timezoneOffsetMinutes);
  const end = addLocalMonths(start, input.monthsAhead ?? 1, timezoneOffsetMinutes);

  for (let cursor = start; cursor < end; cursor = addLocalDays(cursor, 1)) {
    if (!isWorkday(cursor, input.pattern, input.shiftStartedAt, timezoneOffsetMinutes)) {
      continue;
    }

    intervals.push({
      startsAt: applyLocalTime(cursor, input.workdayStartsAt, timezoneOffsetMinutes),
      endsAt: applyLocalTime(cursor, input.workdayEndsAt, timezoneOffsetMinutes),
      pattern: input.pattern
    });
  }

  return intervals;
}
