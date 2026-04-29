"use client";

import * as React from "react";
import type { Priority, TaskStatus } from "@prisma/client";
import { Clock3, Plus, TimerReset, Trash2 } from "lucide-react";
import {
  createTaskAction,
  deleteTaskAction,
  startTimer,
  stopTimer,
  updateTaskStatus
} from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskUser = {
  id: string;
  name: string;
  email: string;
};

type TaskTicket = {
  id: string;
  number: number;
  title: string;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  creatorId: string;
  assigneeId: string | null;
  ticketId: string | null;
  assignee: TaskUser | null;
  creator: TaskUser;
  ticket: TaskTicket | null;
  timeLogs: Array<{
    durationSeconds: number;
  }>;
};

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: "TODO", label: "К выполнению" },
  { status: "IN_PROGRESS", label: "В работе" },
  { status: "DONE", label: "Готово" }
];

function getPriorityTone(priority: Priority) {
  if (priority === "CRITICAL") return "red";
  if (priority === "HIGH") return "amber";
  if (priority === "MEDIUM") return "blue";
  return "green";
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours} ч ${minutes} мин`;
  return `${minutes} мин`;
}

export function TaskOrbitLive({
  tasks,
  users,
  tickets,
  currentUserId,
  isAdmin
}: {
  tasks: TaskItem[];
  users: TaskUser[];
  tickets: TaskTicket[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [ticketId, setTicketId] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");
  const [filter, setFilter] = React.useState<"department" | "mine" | "all">("department");
  const [activeTimers, setActiveTimers] = React.useState<Record<string, string>>({});
  const [isPending, startTransition] = React.useTransition();
  const visibleTasks = tasks.filter((task) => {
    if (filter === "mine") return task.assigneeId === currentUserId || task.creatorId === currentUserId;
    if (filter === "all") return isAdmin;
    return true;
  });

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      await createTaskAction({
        title,
        description,
        assigneeId,
        ticketId,
        priority
      });
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setTicketId("");
      setPriority("MEDIUM");
      window.location.reload();
    });
  }

  function moveTask(taskId: string, status: TaskStatus) {
    startTransition(async () => {
      await updateTaskStatus({ taskId, status });
      window.location.reload();
    });
  }

  function removeTask(taskId: string) {
    if (!window.confirm("Удалить задачу?")) return;

    startTransition(async () => {
      await deleteTaskAction(taskId);
      window.location.reload();
    });
  }

  function startTaskTimer(taskId: string) {
    startTransition(async () => {
      const timer = await startTimer({ taskId });
      setActiveTimers((items) => ({ ...items, [taskId]: timer.startedAt }));
    });
  }

  function stopTaskTimer(taskId: string) {
    const startedAt = activeTimers[taskId];
    if (!startedAt) return;

    startTransition(async () => {
      await stopTimer({ taskId, startedAt });
      setActiveTimers((items) => {
        const nextItems = { ...items };
        delete nextItems[taskId];
        return nextItems;
      });
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createTask} className="grid gap-3 rounded-default bg-neos-accentSoft p-4 lg:grid-cols-[1fr_1fr_180px_180px_160px_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название задачи"
          className="h-11 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Описание"
          className="h-11 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          className="h-11 rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Исполнитель</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        <select
          value={ticketId}
          onChange={(event) => setTicketId(event.target.value)}
          className="h-11 rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Без заявки</option>
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>#{ticket.number} {ticket.title}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority)}
          className="h-11 rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <Button type="submit" className="gap-2" disabled={isPending || !title.trim()}>
          <Plus className="size-4" aria-hidden="true" />
          Создать
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={filter === "department" ? "default" : "soft"} size="sm" onClick={() => setFilter("department")}>
          Отдел
        </Button>
        <Button type="button" variant={filter === "mine" ? "default" : "soft"} size="sm" onClick={() => setFilter("mine")}>
          Мои
        </Button>
        {isAdmin ? (
          <Button type="button" variant={filter === "all" ? "default" : "soft"} size="sm" onClick={() => setFilter("all")}>
            Все
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = visibleTasks.filter((task) => task.status === column.status);

          return (
            <section key={column.status} className="rounded-default bg-neos-accentSoft p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-primary">{column.label}</p>
                <Badge tone="blue">{columnTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const totalSeconds = task.timeLogs.reduce((sum, item) => sum + item.durationSeconds, 0);
                  const canDelete = isAdmin || task.creatorId === currentUserId || task.assigneeId === currentUserId;
                  const isTimerActive = Boolean(activeTimers[task.id]);

                  return (
                    <article key={task.id} className="rounded-default bg-white p-4 shadow-card">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">{task.title}</p>
                          {task.description ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                          ) : null}
                        </div>
                        <Badge tone={getPriorityTone(task.priority)}>{task.priority}</Badge>
                      </div>

                      <div className="space-y-1 text-xs font-bold text-muted-foreground">
                        <p>Исполнитель: {task.assignee?.name ?? "не назначен"}</p>
                        <p>Создал: {task.creator.name}</p>
                        <p>Заявка: {task.ticket ? `#${task.ticket.number} ${task.ticket.title}` : "нет"}</p>
                        <p className="flex items-center gap-1 text-primary">
                          <Clock3 className="size-4" aria-hidden="true" />
                          Учтено: {formatDuration(totalSeconds)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {columns.filter((item) => item.status !== task.status).map((item) => (
                          <Button key={item.status} type="button" size="sm" variant="soft" onClick={() => moveTask(task.id, item.status)}>
                            {item.label}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant={isTimerActive ? "default" : "soft"}
                          onClick={() => (isTimerActive ? stopTaskTimer(task.id) : startTaskTimer(task.id))}
                          className="gap-1"
                        >
                          <TimerReset className="size-4" aria-hidden="true" />
                          {isTimerActive ? "Стоп" : "Старт"}
                        </Button>
                        {canDelete ? (
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeTask(task.id)} aria-label="Удалить задачу">
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
