"use client";

import * as React from "react";
import type { EventMode, ShiftPattern } from "@prisma/client";
import { Building2, CalendarDays, Laptop, Save, Shuffle, Trash2 } from "lucide-react";
import { createEventAction, deleteEventAction } from "@/actions/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateWorkIntervals } from "@/lib/calendar/shifts";
import { cn } from "@/lib/utils";

type CalendarUser = {
  id: string;
  name: string;
  email: string;
  shiftPattern: ShiftPattern;
  shiftStartedAt: string | null;
  workdayStartsAt: string;
  workdayEndsAt: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  mode: EventMode;
  creatorId: string;
  participants: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

type OfficeUser = {
  id: string;
  name: string;
  email: string;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const modes: Array<{ value: EventMode; label: string; icon: typeof Building2 }> = [
  { value: "OFFICE", label: "Офис", icon: Building2 },
  { value: "REMOTE", label: "Удалёнка", icon: Laptop },
  { value: "TWO_TWO", label: "2/2", icon: Shuffle }
];

function getMonthDays(monthStart: Date) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<number | null> = Array.from({ length: firstWeekDay }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function buildDate(monthStart: Date, day: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(monthStart.getFullYear(), monthStart.getMonth(), day, hours, minutes, 0, 0);
}

function isSameDay(date: Date, monthStart: Date, day: number) {
  return date.getFullYear() === monthStart.getFullYear()
    && date.getMonth() === monthStart.getMonth()
    && date.getDate() === day;
}

function overlaps(left: { startsAt: Date; endsAt: Date }, right: { startsAt: Date; endsAt: Date }) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

function findUnavailableParticipant(
  users: CalendarUser[],
  participantIds: string[],
  currentUserId: string,
  startsAt: Date,
  endsAt: Date,
  timezoneOffsetMinutes: number
) {
  const selectedIds = new Set([currentUserId, ...participantIds]);

  return users.find((calendarUser) => {
    if (!selectedIds.has(calendarUser.id)) return false;

    const workIntervals = generateWorkIntervals({
      from: startsAt,
      monthsAhead: 1,
      pattern: calendarUser.shiftPattern,
      shiftStartedAt: calendarUser.shiftStartedAt ? new Date(calendarUser.shiftStartedAt) : null,
      workdayStartsAt: calendarUser.workdayStartsAt,
      workdayEndsAt: calendarUser.workdayEndsAt,
      timezoneOffsetMinutes
    });

    return !workIntervals.some(
      (interval) => startsAt >= interval.startsAt && endsAt <= interval.endsAt
    );
  });
}

function getModeClassName(mode: EventMode) {
  if (mode === "REMOTE") return "bg-cyan-50 text-neos-cyan";
  if (mode === "TWO_TWO") return "bg-violet-50 text-neos-violet";
  return "bg-neos-accentSoft text-primary";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SyncNodeLive({
  events,
  users,
  officeToday,
  currentUserId,
  monthStart,
  isAdmin
}: {
  events: CalendarEvent[];
  users: CalendarUser[];
  officeToday: OfficeUser[];
  currentUserId: string;
  monthStart: string;
  isAdmin: boolean;
}) {
  const monthDate = React.useMemo(() => new Date(monthStart), [monthStart]);
  const monthDays = React.useMemo(() => getMonthDays(monthDate), [monthDate]);
  const [activeMode, setActiveMode] = React.useState<EventMode>("OFFICE");
  const [selectedDay, setSelectedDay] = React.useState(new Date().getDate());
  const [startsAt, setStartsAt] = React.useState("10:00");
  const [endsAt, setEndsAt] = React.useState("11:00");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [participantIds, setParticipantIds] = React.useState<string[]>([]);
  const [error, setError] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const timezoneOffsetMinutes = new Date().getTimezoneOffset();
  const selectedStart = buildDate(monthDate, selectedDay, startsAt);
  const selectedEnd = buildDate(monthDate, selectedDay, endsAt);
  const selectedUserIds = new Set([currentUserId, ...participantIds]);
  const selectedEvents = events.filter((event) =>
    event.participants.some((participant) => selectedUserIds.has(participant.user.id))
  );
  const collisionEvent = selectedEvents.find((event) =>
    overlaps(
      { startsAt: selectedStart, endsAt: selectedEnd },
      { startsAt: new Date(event.startsAt), endsAt: new Date(event.endsAt) }
    )
  );
  const hasInvalidTime = selectedStart >= selectedEnd;
  const unavailableParticipant = findUnavailableParticipant(
    users,
    participantIds,
    currentUserId,
    selectedStart,
    selectedEnd,
    timezoneOffsetMinutes
  );
  const hasShiftConflict = Boolean(unavailableParticipant);
  const hasCollision = Boolean(collisionEvent) || hasInvalidTime || hasShiftConflict;

  function toggleParticipant(userId: string) {
    setParticipantIds((items) =>
      items.includes(userId) ? items.filter((item) => item !== userId) : [...items, userId]
    );
  }

  function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim() || hasCollision) return;

    startTransition(async () => {
      try {
        const result = await createEventAction({
          title,
          description,
          startsAt: selectedStart.toISOString(),
          endsAt: selectedEnd.toISOString(),
          mode: activeMode,
          participantIds,
          timezoneOffsetMinutes
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setTitle("");
        setDescription("");
        setParticipantIds([]);
        window.location.reload();
      } catch {
        setError("Не удалось создать событие. Попробуйте ещё раз.");
      }
    });
  }

  function removeEvent(eventId: string) {
    if (!window.confirm("Удалить событие?")) return;

    startTransition(async () => {
      await deleteEventAction(eventId);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-default bg-neos-accentSoft p-4">
        <p className="text-sm font-black text-primary">Как работает Календарь?</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Это производственный календарь. Событие хранится в PostgreSQL, к нему привязаны участники.
          Перед сохранением система проверяет, не заняты ли участники в другом событии и попадают ли они в рабочую смену.
        </p>
      </section>

      <section className="rounded-default bg-primary p-5 text-white shadow-card">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Кто в офисе сегодня</p>
            <p className="mt-2 text-lg font-black">Люди, у которых сегодня рабочий офисный слот</p>
          </div>
          <CalendarDays className="size-8 text-white/70" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap gap-3">
          {officeToday.length > 0 ? officeToday.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-default bg-white/15 px-3 py-2 backdrop-blur">
              <div className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-black text-primary">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="text-sm font-black">{user.name}</p>
                <p className="text-xs font-semibold text-white/70">{user.email}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm font-bold text-white/75">Сегодня в офисе никого нет</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {modes.map((mode) => {
              const Icon = mode.icon;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setActiveMode(mode.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    activeMode === mode.value
                      ? "bg-primary text-white shadow-card"
                      : "bg-neos-accentSoft text-primary hover:bg-primary hover:text-white"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-default bg-white shadow-card">
            <div className="grid grid-cols-7 bg-neos-accentSoft text-center text-xs font-black uppercase tracking-[0.16em] text-primary">
              {weekDays.map((day) => (
                <div key={day} className="px-2 py-3">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-[120px] bg-white" />;

                const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                const dayEvents = events.filter((event) => isSameDay(new Date(event.startsAt), monthDate, day));
                const isSelectedCollision = day === selectedDay && hasCollision;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[120px] p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isWeekend
                        ? "bg-[linear-gradient(135deg,#F0F4FF_0%,#F0F4FF_55%,#FFFFFF_55%,#FFFFFF_100%)] bg-[length:12px_12px]"
                        : "bg-white",
                      day === selectedDay && "ring-2 ring-inset ring-primary",
                      isSelectedCollision && "[animation:neos-shake_0.34s_ease-in-out_2]"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-black text-foreground">{day}</span>
                      {isWeekend ? <Badge tone="blue">выходной</Badge> : null}
                    </div>
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div key={event.id} className={cn("rounded-default px-3 py-2", getModeClassName(event.mode))}>
                          <p className="truncate text-xs font-black">{event.title}</p>
                          <p className="mt-1 text-xs font-bold opacity-75">
                            {new Date(event.startsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {new Date(event.endsAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="mt-1 truncate text-[11px] font-bold opacity-70">
                            {event.participants.map((item) => item.user.name).join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="rounded-default bg-neos-accentSoft p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Новая встреча</p>
          <h3 className="mt-2 text-lg font-black">Событие и участники</h3>

          <form onSubmit={createEvent} className="mt-5 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название события"
              className="h-11 w-full rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
              className="min-h-20 w-full rounded-default bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sm font-black">День</span>
                <select
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                >
                  {monthDays.filter((day): day is number => Boolean(day)).map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-black">Старт</span>
                <input
                  type="time"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="mt-2 h-11 w-full rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-black">Финиш</span>
                <input
                  type="time"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className="mt-2 h-11 w-full rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-black">Участники</p>
              <div className="mt-2 grid gap-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleParticipant(user.id)}
                    disabled={user.id === currentUserId}
                    className={cn(
                      "rounded-default px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      user.id === currentUserId || participantIds.includes(user.id)
                        ? "bg-primary text-white"
                        : "bg-white text-foreground hover:bg-primary hover:text-white"
                    )}
                  >
                    {user.name} · {user.shiftPattern === "TWO_TWO" ? "2/2" : "5/2"} · {user.workdayStartsAt}-{user.workdayEndsAt}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("rounded-default p-4 text-sm font-bold", hasCollision || error ? "bg-red-50 text-neos-danger" : "bg-white text-primary")}>
              {error || (hasInvalidTime
                ? "Время указано неправильно."
                : unavailableParticipant
                  ? `${unavailableParticipant.name} не на рабочей смене в этот день (график ${unavailableParticipant.shiftPattern === "TWO_TWO" ? "2/2" : "5/2"}). Выберите будний день или уберите участника.`
                  : collisionEvent
                    ? `Конфликт с событием: ${collisionEvent.title}`
                    : "Слот свободен. Можно сохранять событие.")}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isPending || hasCollision || !title.trim()}>
              <Save className="size-4" aria-hidden="true" />
              Сохранить событие
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-black text-primary">Ближайшие события</p>
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-default bg-white p-3">
                <div>
                  <p className="text-sm font-black">{event.title}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                    {new Date(event.startsAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                {(isAdmin || event.creatorId === currentUserId) ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(event.id)} aria-label="Удалить событие">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
