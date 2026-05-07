import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarClock,
  CheckSquare,
  Clock3,
  FolderOpen,
  HelpCircle,
  MessageSquareText,
  Users,
  Workflow
} from "lucide-react";
import { generateWorkIntervals } from "@/lib/calendar/shifts";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LiveClock } from "./live-clock";

function getTimeOfDay(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return { greeting: "Доброе утро" };
  if (hour >= 12 && hour < 17) return { greeting: "Добрый день" };
  if (hour >= 17 && hour < 23) return { greeting: "Добрый вечер" };
  return { greeting: "Доброй ночи" };
}

function formatRelative(target: Date) {
  const now = Date.now();
  const diffMs = target.getTime() - now;
  const isPast = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${isPast ? "" : "через "}${minutes} мин${isPast ? " назад" : ""}`;
  if (hours < 24) return `${isPast ? "" : "через "}${hours} ч${isPast ? " назад" : ""}`;
  return `${isPast ? "" : "через "}${days} д${isPast ? " назад" : ""}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FeedItem = {
  id: string;
  type: "message" | "task" | "ticket" | "file" | "event";
  title: string;
  description: string;
  href: Route;
  date: Date;
  actor?: string;
};

export async function DashboardBriefing() {
  const user = await getSessionUser();
  if (!user) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    myOpenTasks,
    myEscalatedTickets,
    myTodayEventsCount,
    nextEvent,
    recentTickets,
    recentTasks,
    recentFiles,
    recentMessages,
    teamUsers
  ] = await Promise.all([
    db.task.count({
      where: { assigneeId: user.id, status: { in: ["TODO", "IN_PROGRESS"] } }
    }),
    db.ticket.count({
      where: {
        isEscalated: true,
        OR: [{ creatorId: user.id }, { supportAgentId: user.id }]
      }
    }),
    db.event.count({
      where: {
        startsAt: { gte: todayStart, lt: tomorrowStart },
        participants: { some: { userId: user.id } }
      }
    }),
    db.event.findFirst({
      where: {
        startsAt: { gte: now },
        participants: { some: { userId: user.id } }
      },
      orderBy: { startsAt: "asc" },
      include: {
        participants: {
          take: 4,
          include: { user: { select: { id: true, name: true } } }
        }
      }
    }),
    db.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { creator: { select: { name: true } } }
    }),
    db.task.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } }
      }
    }),
    db.file.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { owner: { select: { name: true } } }
    }),
    db.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        user: { select: { name: true } },
        chat: { select: { id: true, title: true } }
      }
    }),
    db.user.findMany({
      where: { isBanned: false },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        shiftPattern: true,
        shiftStartedAt: true,
        workdayStartsAt: true,
        workdayEndsAt: true
      }
    })
  ]);

  const officeToday = teamUsers.filter((member) =>
    generateWorkIntervals({
      from: todayStart,
      monthsAhead: 1,
      pattern: member.shiftPattern,
      shiftStartedAt: member.shiftStartedAt,
      workdayStartsAt: member.workdayStartsAt,
      workdayEndsAt: member.workdayEndsAt
    }).some((interval) => interval.startsAt.toDateString() === todayStart.toDateString())
  );

  const feed: FeedItem[] = [
    ...recentTickets.map<FeedItem>((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "ticket",
      title: `#${ticket.number} ${ticket.title}`,
      description: `Service Flow · ${ticket.creator?.name ?? "Система"}`,
      href: "/helpdesk" as Route,
      date: ticket.updatedAt,
      actor: ticket.creator?.name
    })),
    ...recentTasks.map<FeedItem>((task) => ({
      id: `task-${task.id}`,
      type: "task",
      title: task.title,
      description: `Task Orbit · ${task.assignee?.name ?? task.creator?.name ?? "—"}`,
      href: "/tasks" as Route,
      date: task.updatedAt,
      actor: task.assignee?.name ?? task.creator?.name
    })),
    ...recentFiles.map<FeedItem>((file) => ({
      id: `file-${file.id}`,
      type: "file",
      title: file.name,
      description: `CloudSpace · ${file.owner?.name ?? ""}`,
      href: "/drive" as Route,
      date: file.updatedAt,
      actor: file.owner?.name
    })),
    ...recentMessages.map<FeedItem>((message) => ({
      id: `message-${message.id}`,
      type: "message",
      title: message.chat.title ?? "Личный чат",
      description: `Messenger · ${message.user.name}: ${message.body.slice(0, 60)}`,
      href: "/messenger" as Route,
      date: message.createdAt,
      actor: message.user.name
    }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  const { greeting } = getTimeOfDay(now);
  const formattedDate = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const personalKpis: Array<{
    label: string;
    value: number;
    hint: string;
    href: Route;
    tone: string;
  }> = [
    {
      label: "Мои задачи",
      value: myOpenTasks,
      hint: "в работе и в очереди",
      href: "/tasks",
      tone: "from-primary/10 to-primary/5 text-primary"
    },
    {
      label: "Эскалации",
      value: myEscalatedTickets,
      hint: "тикетов требуют реакции",
      href: "/helpdesk",
      tone: "from-rose-500/15 to-rose-500/5 text-rose-600"
    },
    {
      label: "События сегодня",
      value: myTodayEventsCount,
      hint: "встреч в моём расписании",
      href: "/calendar",
      tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600"
    }
  ];

  const feedIcons = {
    ticket: HelpCircle,
    task: CheckSquare,
    file: FolderOpen,
    message: MessageSquareText,
    event: Workflow
  } as const;

  return (
    <section
      aria-label="Персональный брифинг"
      className="relative overflow-hidden rounded-default bg-white p-6 shadow-float ring-1 ring-border"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-primary"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Брифинг · {formattedDate}
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight">
            {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            {nextEvent
              ? `Ближайшая встреча — «${nextEvent.title}» ${formatRelative(nextEvent.startsAt)}.`
              : myOpenTasks > 0
                ? `На тебе ${myOpenTasks} ${myOpenTasks === 1 ? "задача" : "задач"} в работе. Начни день с самого приоритетного.`
                : "Сегодня свободно: можно прибраться в Wiki или закрыть старые задачи."}
          </p>

          <div className="mt-6 flex items-center gap-4 text-sm">
            <LiveClock />
            <span className="text-muted-foreground">·</span>
            <span className="font-bold text-muted-foreground">
              {user.role === "ADMIN" ? "Администратор" : "Сотрудник"} · {user.department}
            </span>
          </div>
        </div>

        <div className="grid gap-3 lg:col-span-5 lg:grid-cols-3">
          {personalKpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`group relative overflow-hidden rounded-default bg-gradient-to-br ${kpi.tone} p-4 transition hover:-translate-y-0.5`}
            >
              <p className="font-mono text-3xl font-black tracking-tight tabular-nums text-foreground">
                {kpi.value}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-wide text-foreground/80">{kpi.label}</p>
              <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground/60">{kpi.hint}</p>
              <ArrowRight
                className="absolute right-3 top-3 size-4 opacity-0 transition group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 lg:grid-cols-12">
        <article className="rounded-default bg-neos-accentSoft p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Ближайшее событие</p>
            <CalendarClock className="size-4 text-primary" aria-hidden="true" />
          </div>
          {nextEvent ? (
            <Link href="/calendar" className="mt-3 block">
              <p className="text-lg font-black tracking-tight">{nextEvent.title}</p>
              <p className="mt-1 font-mono text-sm font-bold tabular-nums text-primary">
                {formatRelative(nextEvent.startsAt)}
              </p>
              <p className="mt-2 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                {nextEvent.startsAt.toLocaleString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "long"
                })}
              </p>
              <div className="mt-4 flex -space-x-2">
                {nextEvent.participants.map((participant) => (
                  <div
                    key={participant.id}
                    title={participant.user.name}
                    className="flex size-8 items-center justify-center rounded-full bg-white text-xs font-black text-primary ring-2 ring-neos-accentSoft"
                  >
                    {getInitials(participant.user.name)}
                  </div>
                ))}
              </div>
            </Link>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-bold text-muted-foreground">Свободный день — встреч нет.</p>
              <Link href="/calendar" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-primary">
                Запланировать
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </article>

        <article className="rounded-default bg-white p-5 ring-1 ring-border lg:col-span-7">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Поток активности</p>
            <Clock3 className="size-4 text-primary" aria-hidden="true" />
          </div>
          {feed.length === 0 ? (
            <p className="mt-4 text-sm font-bold text-muted-foreground">Пока тихо. Создай задачу или заявку.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {feed.map((item) => {
                const Icon = feedIcons[item.type];

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 rounded-default p-2 transition hover:bg-neos-accentSoft"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{item.title}</p>
                        <p className="truncate text-xs font-semibold text-muted-foreground">{item.description}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-muted-foreground">
                        {formatRelative(item.date)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3 rounded-default bg-neos-accentSoft p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
          <Users className="size-4" aria-hidden="true" />
          В офисе сегодня
        </div>
        {officeToday.length === 0 ? (
          <span className="text-sm font-bold text-muted-foreground">Все на удалёнке</span>
        ) : (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="flex -space-x-2">
              {officeToday.slice(0, 8).map((member) => (
                <div
                  key={member.id}
                  title={member.name}
                  className="flex size-9 items-center justify-center rounded-full bg-white text-xs font-black text-primary ring-2 ring-neos-accentSoft"
                >
                  {getInitials(member.name)}
                </div>
              ))}
            </div>
            <span className="font-mono text-sm font-black tabular-nums text-foreground">
              {officeToday.length}
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {officeToday.length === 1 ? "сотрудник на месте" : "сотрудников на месте"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
