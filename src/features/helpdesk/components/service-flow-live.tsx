"use client";

import * as React from "react";
import type { Department, Priority, TicketStatus } from "@prisma/client";
import { CheckCircle2, SendHorizonal, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  assignTicketOwnerAction,
  createTicketAction,
  deleteTicketAction,
  updateTicketStatusAction
} from "@/actions/helpdesk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HelpdeskUser = {
  id: string;
  name: string;
  email: string;
};

type HelpdeskTicket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  department: Department;
  slaDueAt: string;
  isEscalated: boolean;
  creatorId: string;
  supportAgentId: string | null;
  creator: HelpdeskUser;
  supportAgent: HelpdeskUser | null;
  tasks: Array<{ id: string }>;
};

const departmentLabels: Record<Department, string> = {
  IT: "IT",
  HR: "HR",
  PROCUREMENT: "Снабжение",
  OPERATIONS: "Операции"
};

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидает",
  RESOLVED: "Решена",
  CLOSED: "Закрыта"
};

function getPriorityTone(priority: Priority) {
  if (priority === "CRITICAL") return "red";
  if (priority === "HIGH") return "amber";
  if (priority === "MEDIUM") return "blue";
  return "green";
}

function getSlaState(slaDueAt: string, isEscalated: boolean) {
  const now = Date.now();
  const deadline = new Date(slaDueAt).getTime();
  const hoursLeft = Math.floor((deadline - now) / 1000 / 60 / 60);

  if (isEscalated || hoursLeft <= 0) {
    return {
      label: "SLA сорван",
      percent: 100,
      className: "bg-neos-danger animate-pulse shadow-[0_0_18px_rgba(239,68,68,0.45)]"
    };
  }

  if (hoursLeft <= 4) {
    return {
      label: `Осталось ${hoursLeft} ч`,
      percent: 82,
      className: "bg-neos-warning animate-pulse shadow-[0_0_18px_rgba(245,158,11,0.42)]"
    };
  }

  return {
    label: `Осталось ${hoursLeft} ч`,
    percent: 48,
    className: "bg-primary"
  };
}

export function ServiceFlowLive({
  tickets,
  users,
  currentUserId,
  currentDepartment,
  isAdmin
}: {
  tickets: HelpdeskTicket[];
  users: HelpdeskUser[];
  currentUserId: string;
  currentDepartment: Department;
  isAdmin: boolean;
}) {
  const [activeDepartment, setActiveDepartment] = React.useState<Department | "ALL">("ALL");
  const [activeStatus, setActiveStatus] = React.useState<TicketStatus | "ALL">("ALL");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");
  const [department, setDepartment] = React.useState<Department>(currentDepartment);
  const [isFlying, setIsFlying] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const visibleTickets = tickets.filter((ticket) => {
    const departmentMatched = activeDepartment === "ALL" || ticket.department === activeDepartment;
    const statusMatched = activeStatus === "ALL" || ticket.status === activeStatus;
    return departmentMatched && statusMatched;
  });

  function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim() || isFlying) return;

    setIsFlying(true);
    startTransition(async () => {
      await createTicketAction({
        title,
        description,
        priority,
        department: isAdmin ? department : currentDepartment
      });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      window.setTimeout(() => {
        setIsFlying(false);
        window.location.reload();
      }, 360);
    });
  }

  function updateStatus(ticketId: string, status: TicketStatus) {
    startTransition(async () => {
      await updateTicketStatusAction({ ticketId, status });
      window.location.reload();
    });
  }

  function assignAgent(ticketId: string, supportAgentId: string) {
    startTransition(async () => {
      await assignTicketOwnerAction({ ticketId, supportAgentId: supportAgentId || null });
      window.location.reload();
    });
  }

  function deleteTicket(ticketId: string) {
    if (!window.confirm("Удалить заявку? Связанные задачи останутся, но отвяжутся от заявки.")) return;

    startTransition(async () => {
      await deleteTicketAction(ticketId);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-default bg-neos-accentSoft p-4">
        <p className="text-sm font-black text-primary">Что такое Service Flow?</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Это очередь внутренних заявок: доступы, закупки, поломки, биллинг, HR-вопросы. У каждой заявки есть SLA-дедлайн,
          приоритет, отдел, ответственный агент и статус. Если срок прошел, заявка становится эскалированной.
        </p>
      </div>

      <form
        onSubmit={createTicket}
        className={cn(
          "grid gap-3 rounded-default bg-neos-accentSoft p-4 transition-all duration-500 xl:grid-cols-[1fr_1fr_160px_180px_auto]",
          isFlying && "translate-x-16 -translate-y-10 scale-75 opacity-0 rotate-6"
        )}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Что случилось?"
          className="h-11 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Описание проблемы"
          className="h-11 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
        />
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
        {isAdmin ? (
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value as Department)}
            className="h-11 rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(departmentLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        ) : null}
        <Button type="submit" className="gap-2" disabled={isPending || !title.trim() || !description.trim()}>
          <SendHorizonal className="size-4" aria-hidden="true" />
          Создать заявку
        </Button>
      </form>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex size-10 items-center justify-center rounded-full bg-neos-accentSoft text-primary">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </div>
          <Button type="button" variant={activeDepartment === "ALL" ? "default" : "soft"} size="sm" onClick={() => setActiveDepartment("ALL")}>
            Все отделы
          </Button>
          {Object.entries(departmentLabels).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={activeDepartment === value ? "default" : "soft"}
              size="sm"
              onClick={() => setActiveDepartment(value as Department)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={activeStatus === "ALL" ? "default" : "soft"} size="sm" onClick={() => setActiveStatus("ALL")}>
            Все статусы
          </Button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={activeStatus === value ? "default" : "soft"}
              size="sm"
              onClick={() => setActiveStatus(value as TicketStatus)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-default bg-white shadow-card">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <thead className="bg-white text-xs font-black uppercase tracking-[0.12em] text-primary">
            <tr>
              <th className="px-5 py-4">Заявка</th>
              <th className="px-5 py-4">Отдел</th>
              <th className="px-5 py-4">Агент</th>
              <th className="px-5 py-4">Статус</th>
              <th className="px-5 py-4">SLA</th>
              <th className="px-5 py-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket, index) => {
              const sla = getSlaState(ticket.slaDueAt, ticket.isEscalated);
              const canDelete = isAdmin || ticket.creatorId === currentUserId || ticket.supportAgentId === currentUserId;

              return (
                <tr
                  key={ticket.id}
                  className={cn("transition hover:bg-neos-accentSoft/70", index % 2 === 1 ? "bg-neos-accentSoft" : "bg-white")}
                >
                  <td className="px-5 py-5 align-top">
                    <div className="max-w-[360px]">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black">#{ticket.number}</p>
                        <Badge tone={getPriorityTone(ticket.priority)}>{ticket.priority}</Badge>
                        {ticket.isEscalated ? <Badge tone="red">Эскалация</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm font-black text-foreground">{ticket.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-muted-foreground">{ticket.description}</p>
                      <p className="mt-2 text-xs font-bold text-primary">Задач привязано: {ticket.tasks.length}</p>
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <Badge tone={ticket.department === "IT" ? "blue" : ticket.department === "HR" ? "violet" : "cyan"}>
                      {departmentLabels[ticket.department]}
                    </Badge>
                    <p className="mt-2 text-xs font-bold text-muted-foreground">Автор: {ticket.creator.name}</p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <select
                      value={ticket.supportAgentId ?? ""}
                      onChange={(event) => assignAgent(ticket.id, event.target.value)}
                      className="h-10 rounded-default bg-neos-accentSoft px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Не назначен</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <div className="flex items-center gap-2 text-sm font-black text-foreground">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      {statusLabels[ticket.status]}
                    </div>
                    <select
                      value={ticket.status}
                      onChange={(event) => updateStatus(ticket.id, event.target.value as TicketStatus)}
                      className="mt-3 h-10 rounded-default bg-neos-accentSoft px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <p className="text-sm font-black">{sla.label}</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      Дедлайн: {new Date(ticket.slaDueAt).toLocaleString("ru-RU")}
                    </p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-neos-accentSoft">
                      <div className={cn("h-full rounded-full transition-all", sla.className)} style={{ width: `${sla.percent}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-5 align-top">
                    {canDelete ? (
                      <Button type="button" variant="ghost" size="icon" onClick={() => deleteTicket(ticket.id)} aria-label="Удалить заявку">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
