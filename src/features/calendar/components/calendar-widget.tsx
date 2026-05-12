"use client";

import { Building2, CalendarDays, Laptop, Save, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CalendarMode, useCalendarStore } from "@/features/calendar/store";
import { cn } from "@/lib/utils";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const modes: Array<{ label: CalendarMode; icon: typeof Building2 }> = [
  { label: "Офис", icon: Building2 },
  { label: "Удаленка", icon: Laptop },
  { label: "2через2", icon: Shuffle }
];
const holidays = [12, 27];
const monthDays = Array.from({ length: 35 }, (_, index) => {
  const day = index - 1;

  return day > 0 && day <= 30 ? day : null;
});

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isWeekend(day: number) {
  const gridIndex = monthDays.findIndex((item) => item === day);
  const weekDayIndex = gridIndex % 7;

  return weekDayIndex === 5 || weekDayIndex === 6;
}

function getModeClassName(mode: CalendarMode) {
  if (mode === "Удаленка") return "bg-cyan-50 text-neos-cyan";
  if (mode === "2через2") return "bg-violet-50 text-neos-violet";
  return "bg-neos-accentSoft text-primary";
}

export function CalendarWidget() {
  const {
    activeMode,
    events,
    officeToday,
    selectedDay,
    selectedEndsAt,
    selectedStartsAt,
    setActiveMode,
    setSelectedDay,
    setSelectedEndsAt,
    setSelectedStartsAt
  } = useCalendarStore();
  const selectedStart = timeToMinutes(selectedStartsAt);
  const selectedEnd = timeToMinutes(selectedEndsAt);
  const activeEvents = events.filter((event) => event.mode === activeMode);
  const hasCollision = activeEvents.some((event) => {
    if (event.day !== selectedDay) return false;

    const eventStart = timeToMinutes(event.startsAt);
    const eventEnd = timeToMinutes(event.endsAt);

    return selectedStart < eventEnd && selectedEnd > eventStart;
  });

  return (
    <Card id="calendar" className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Календарь</CardTitle>
          <CardDescription>Месяц, смены, офисная загрузка и защита от пересечений</CardDescription>
        </div>
        <Badge tone="cyan">Апрель 2026</Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="rounded-default bg-primary p-5 text-white shadow-card">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
                Кто в офисе сегодня
              </p>
              <p className="mt-2 text-lg font-black">Команда на площадке, готовая к быстрым решениям</p>
            </div>
            <CalendarDays className="size-8 text-white/70" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap gap-3">
            {officeToday.map((employee) => (
              <div key={employee.id} className="flex items-center gap-3 rounded-default bg-white/14 px-3 py-2 backdrop-blur">
                <div className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-black text-primary">
                  {employee.initials}
                </div>
                <div>
                  <p className="text-sm font-black">{employee.name}</p>
                  <p className="text-xs font-semibold text-white/70">{employee.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {modes.map((mode) => {
                const Icon = mode.icon;

                return (
                  <button
                    key={mode.label}
                    type="button"
                    onClick={() => setActiveMode(mode.label)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      activeMode === mode.label
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
                  <div key={day} className="px-2 py-3">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="min-h-[120px] bg-white" />;

                  const dayEvents = activeEvents.filter((event) => event.day === day);
                  const isSpecialDay = isWeekend(day) || holidays.includes(day);
                  const isSelectedCollision = day === selectedDay && hasCollision;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "min-h-[120px] p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isSpecialDay
                          ? "bg-[linear-gradient(135deg,#F0F4FF_0%,#F0F4FF_55%,#FFFFFF_55%,#FFFFFF_100%)] bg-[length:12px_12px]"
                          : "bg-white",
                        day === selectedDay && "ring-2 ring-inset ring-primary",
                        isSelectedCollision && "[animation:neos-shake_0.34s_ease-in-out_2]"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-black text-foreground">{day}</span>
                        {holidays.includes(day) ? <Badge tone="blue">праздник</Badge> : null}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div key={event.id} className={cn("rounded-default px-3 py-2", getModeClassName(event.mode))}>
                            <p className="truncate text-xs font-black">{event.title}</p>
                            <p className="mt-1 text-xs font-bold opacity-75">
                              {event.startsAt}-{event.endsAt}
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
            <h3 className="mt-2 text-lg font-black">Проверка пересечений</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Выберите день и время. Если слот занят в текущем режиме, Календарь заблокирует сохранение.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black">День месяца</span>
                <select
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-default bg-white px-4 text-sm font-bold outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {day} апреля
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-black">Начало</span>
                  <input
                    type="time"
                    value={selectedStartsAt}
                    onChange={(event) => setSelectedStartsAt(event.target.value)}
                    className="mt-2 h-11 w-full rounded-default bg-white px-3 text-sm font-bold outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-black">Конец</span>
                  <input
                    type="time"
                    value={selectedEndsAt}
                    onChange={(event) => setSelectedEndsAt(event.target.value)}
                    className="mt-2 h-11 w-full rounded-default bg-white px-3 text-sm font-bold outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>

              <div
                className={cn(
                  "rounded-default p-4 text-sm font-bold",
                  hasCollision ? "bg-red-50 text-neos-danger" : "bg-white text-primary"
                )}
              >
                {hasCollision
                  ? "Слот уже занят. Сохранение отключено, ячейка вибрирует."
                  : "Слот свободен. Можно сохранять встречу."}
              </div>

              <Button type="button" className="w-full gap-2" disabled={hasCollision || selectedStart >= selectedEnd}>
                <Save className="size-4" aria-hidden="true" />
                Сохранить встречу
              </Button>
            </div>
          </aside>
        </section>
      </CardContent>
    </Card>
  );
}
