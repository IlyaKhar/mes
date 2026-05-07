import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSpaceLive } from "@/features/drive/components/cloud-space-live";
import { MessengerLive } from "@/features/messenger/components/messenger-live";
import { ServiceFlowLive } from "@/features/helpdesk/components/service-flow-live";
import { SyncNodeLive } from "@/features/calendar/components/sync-node-live";
import { TaskOrbitLive } from "@/features/tasks/components/task-orbit-live";
import { WikiCoreLive } from "@/features/wiki/components/wiki-core-live";
import { generateWorkIntervals } from "@/lib/calendar/shifts";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export function DashboardSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Загружаем реальные данные из базы</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-12 animate-pulse rounded-default bg-neos-accentSoft" />
        <div className="h-12 animate-pulse rounded-default bg-neos-accentSoft" />
        <div className="h-12 animate-pulse rounded-default bg-neos-accentSoft" />
      </CardContent>
    </Card>
  );
}

export async function MetricsWidget() {
  const [messages, tasks, tickets, files] = await Promise.all([
    db.message.count(),
    db.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    db.file.count()
  ]);

  const metrics = [
    { label: "Сообщений", value: messages, hint: "в корпоративных чатах" },
    { label: "Активных задач", value: tasks, hint: "по всей системе" },
    { label: "Открытых заявок", value: tickets, hint: "ожидают реакции" },
    { label: "Файлов", value: files, hint: "в CloudSpace" }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые метрики">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-default bg-white p-5 shadow-card ring-1 ring-border">
          <p className="text-sm font-bold text-muted-foreground">{metric.label}</p>
          <p className="mt-3 font-mono text-3xl font-bold tracking-tight tabular-nums text-foreground">{metric.value}</p>
          <p className="mt-2 text-sm font-black text-primary">{metric.hint}</p>
        </article>
      ))}
    </section>
  );
}

export async function MessengerDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const chats = await db.chat.findMany({
    where: {
      participants: {
        some: {
          userId: user.id
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      },
      messages: {
        take: 40,
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });
  const serializedChats = chats.map((chat) => ({
    ...chat,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messages: chat.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    }))
  }));

  return (
    <Card id="messenger">
      <CardHeader>
        <div>
          <CardTitle>Messenger</CardTitle>
          <CardDescription>Реальные чаты и последние сообщения</CardDescription>
        </div>
        <Badge tone="blue">{chats.length} чата</Badge>
      </CardHeader>
      <CardContent>
        <MessengerLive chats={serializedChats} currentUserId={user.id} />
      </CardContent>
    </Card>
  );
}

export async function HelpDeskDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const [tickets, users] = await Promise.all([
    db.ticket.findMany({
      where: user.role === "ADMIN" ? undefined : { department: user.department },
      orderBy: [{ isEscalated: "desc" }, { slaDueAt: "asc" }],
      include: {
        creator: { select: { id: true, name: true, email: true } },
        supportAgent: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true } }
      }
    }),
    db.user.findMany({
      where: user.role === "ADMIN" ? { isBanned: false } : { department: user.department, isBanned: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    })
  ]);
  const serializedTickets = tickets.map((ticket) => ({
    ...ticket,
    slaDueAt: ticket.slaDueAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString()
  }));

  return (
    <Card id="helpdesk">
      <CardHeader>
        <div>
          <CardTitle>Service Flow</CardTitle>
          <CardDescription>Заявки отдела из PostgreSQL</CardDescription>
        </div>
        <Badge tone="red">{tickets.filter((ticket) => ticket.isEscalated).length} эскалаций</Badge>
      </CardHeader>
      <CardContent>
        <ServiceFlowLive
          tickets={serializedTickets}
          users={users}
          currentUserId={user.id}
          currentDepartment={user.department}
          isAdmin={user.role === "ADMIN"}
        />
      </CardContent>
    </Card>
  );
}

export async function TasksDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const [tasks, users, tickets] = await Promise.all([
    db.task.findMany({
      where:
        user.role === "ADMIN"
          ? undefined
          : {
              OR: [
                { creator: { department: user.department } },
                { assignee: { department: user.department } }
              ]
            },
      orderBy: { updatedAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, number: true, title: true } },
        timeLogs: { select: { durationSeconds: true } }
      }
    }),
    db.user.findMany({
      where: user.role === "ADMIN" ? { isBanned: false } : { department: user.department, isBanned: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    }),
    db.ticket.findMany({
      where: user.role === "ADMIN" ? undefined : { department: user.department },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, number: true, title: true }
    })
  ]);
  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueAt: task.dueAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  }));

  return (
    <Card id="tasks">
      <CardHeader>
        <div>
          <CardTitle>Task Orbit</CardTitle>
          <CardDescription>Задачи отдела с реальными статусами</CardDescription>
        </div>
        <Badge tone="violet">{tasks.length} задач</Badge>
      </CardHeader>
      <CardContent>
        <TaskOrbitLive
          tasks={serializedTasks}
          users={users}
          tickets={tickets}
          currentUserId={user.id}
          isAdmin={user.role === "ADMIN"}
        />
      </CardContent>
    </Card>
  );
}

export async function CalendarDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [events, users] = await Promise.all([
    db.event.findMany({
      where: {
        startsAt: { gte: monthStart, lt: monthEnd },
        ...(user.role === "ADMIN"
          ? {}
          : {
              participants: {
                some: {
                  user: { department: user.department }
                }
              }
            })
      },
      orderBy: { startsAt: "asc" },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    }),
    db.user.findMany({
      where: user.role === "ADMIN" ? { isBanned: false } : { department: user.department, isBanned: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        shiftPattern: true,
        shiftStartedAt: true,
        workdayStartsAt: true,
        workdayEndsAt: true
      }
    })
  ]);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const officeToday = users.filter((calendarUser) =>
    generateWorkIntervals({
      from: todayStart,
      monthsAhead: 1,
      pattern: calendarUser.shiftPattern,
      shiftStartedAt: calendarUser.shiftStartedAt,
      workdayStartsAt: calendarUser.workdayStartsAt,
      workdayEndsAt: calendarUser.workdayEndsAt
    }).some((interval) => interval.startsAt.toDateString() === todayStart.toDateString())
  );
  const serializedEvents = events.map((event) => ({
    ...event,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  }));
  const serializedUsers = users.map((calendarUser) => ({
    id: calendarUser.id,
    name: calendarUser.name,
    email: calendarUser.email,
    shiftPattern: calendarUser.shiftPattern,
    workdayStartsAt: calendarUser.workdayStartsAt,
    workdayEndsAt: calendarUser.workdayEndsAt
  }));
  const serializedOfficeToday = officeToday.map((calendarUser) => ({
    id: calendarUser.id,
    name: calendarUser.name,
    email: calendarUser.email
  }));

  return (
    <Card id="calendar">
      <CardHeader>
        <div>
          <CardTitle>SyncNode</CardTitle>
          <CardDescription>События и участники из базы</CardDescription>
        </div>
        <Badge tone="cyan">{events.length} событий</Badge>
      </CardHeader>
      <CardContent>
        <SyncNodeLive
          events={serializedEvents}
          users={serializedUsers}
          officeToday={serializedOfficeToday}
          currentUserId={user.id}
          monthStart={monthStart.toISOString()}
          isAdmin={user.role === "ADMIN"}
        />
      </CardContent>
    </Card>
  );
}

export async function DriveDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const files = await db.file.findMany({
    where: user.role === "ADMIN" ? undefined : { owner: { department: user.department } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      kind: true,
      mimeType: true,
      size: true,
      url: true,
      previewUrl: true,
      shareUrl: true,
      ownerId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
      versions: {
        orderBy: { version: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
  const serializedFiles = files.map((file) => ({
    ...file,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    versions: file.versions.map((version) => ({
      ...version,
      createdAt: version.createdAt.toISOString()
    }))
  }));

  return (
    <Card id="drive">
      <CardHeader>
        <div>
          <CardTitle>CloudSpace</CardTitle>
          <CardDescription>Файлы и владельцы из PostgreSQL</CardDescription>
        </div>
        <Badge tone="blue">{files.length} файлов</Badge>
      </CardHeader>
      <CardContent>
        <CloudSpaceLive
          files={serializedFiles}
          currentUserId={user.id}
          isAdmin={user.role === "ADMIN"}
        />
      </CardContent>
    </Card>
  );
}

export async function WikiDbWidget() {
  const user = await getSessionUser();
  if (!user) return null;

  const pages = await db.wikiPage.findMany({
    where: user.role === "ADMIN"
      ? undefined
      : {
          OR: [
            { status: "PUBLISHED" },
            { authorId: user.id }
          ]
        },
    orderBy: [{ parentId: "asc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, email: true } },
      reads: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      histories: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: { select: { id: true, name: true, email: true } }
        }
      }
    }
  });
  const serializedPages = pages.map((page) => ({
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    reads: page.reads.map((read) => ({
      ...read,
      readAt: read.readAt.toISOString()
    })),
    histories: page.histories.map((history) => ({
      ...history,
      createdAt: history.createdAt.toISOString()
    }))
  }));

  return (
    <Card id="wiki">
      <CardHeader>
        <div>
          <CardTitle>WikiCore</CardTitle>
          <CardDescription>Статьи, авторы и прочтения из базы</CardDescription>
        </div>
        <Badge tone="green">{pages.length} статей</Badge>
      </CardHeader>
      <CardContent>
        <WikiCoreLive
          pages={serializedPages}
          currentUserId={user.id}
          isAdmin={user.role === "ADMIN"}
        />
      </CardContent>
    </Card>
  );
}
