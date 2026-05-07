"use server";

import { revalidatePath } from "next/cache";
import { createTicket } from "@/actions/helpdesk";
import { createTaskAction } from "@/actions/tasks";
import { createWikiPageAction } from "@/actions/wiki";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type CommandCenterResult = {
  id: string;
  type: "user" | "task" | "wiki" | "ticket" | "command";
  title: string;
  description: string;
  href: string;
};

export type CommandCenterResponse =
  | {
      mode: "search";
      results: CommandCenterResult[];
    }
  | {
      mode: "command";
      result: CommandCenterResult;
    };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function parseQuickCommand(query: string) {
  const [command = "", ...rest] = query.slice(1).trim().split(/\s+/);
  const payload = rest.join(" ").trim();

  return {
    command: command.toLowerCase(),
    payload
  };
}

async function runQuickCommand(query: string): Promise<CommandCenterResponse> {
  const { command, payload } = parseQuickCommand(query);

  if (!payload) {
    throw new Error("После команды нужно указать название сущности");
  }

  if (command === "task" || command === "задача") {
    const task = await createTaskAction({
      title: payload,
      description: "Создано через Command Center"
    });

    return {
      mode: "command",
      result: {
        id: task.id,
        type: "command",
        title: `Создана задача: ${task.title}`,
        description: "Task Orbit",
        href: "/tasks"
      }
    };
  }

  if (command === "ticket" || command === "заявка") {
    const ticket = await createTicket({
      title: payload,
      description: "Создано через Command Center",
      priority: "MEDIUM"
    });

    return {
      mode: "command",
      result: {
        id: ticket.id,
        type: "command",
        title: `Создана заявка: ${ticket.title}`,
        description: `Service Flow · #${ticket.number}`,
        href: "/helpdesk"
      }
    };
  }

  if (command === "wiki" || command === "статья") {
    const page = await createWikiPageAction({
      title: payload,
      slug: `${slugify(payload)}-${Date.now()}`,
      content: ""
    });

    return {
      mode: "command",
      result: {
        id: page.id,
        type: "command",
        title: `Создана статья: ${page.title}`,
        description: "WikiCore",
        href: "/wiki"
      }
    };
  }

  throw new Error(`Команда >${command} пока не поддерживается`);
}

export async function commandCenterAction(query: string): Promise<CommandCenterResponse> {
  const user = await requireSession();
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return { mode: "search", results: [] };
  if (normalizedQuery.startsWith(">")) return runQuickCommand(normalizedQuery);

  const [users, tasks, wikiPages, tickets] = await Promise.all([
    db.user.findMany({
      where: {
        department: user.department,
        OR: [
          { name: { contains: normalizedQuery, mode: "insensitive" } },
          { email: { contains: normalizedQuery, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    }),
    db.task.findMany({
      where: {
        OR: [
          { creator: { department: user.department } },
          { assignee: { department: user.department } }
        ],
        title: { contains: normalizedQuery, mode: "insensitive" }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        assignee: {
          select: {
            name: true
          }
        }
      }
    }),
    db.wikiPage.findMany({
      where: {
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { content: { contains: normalizedQuery, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true
      }
    }),
    db.ticket.findMany({
      where: {
        department: user.department,
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" } },
          { description: { contains: normalizedQuery, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true
      }
    })
  ]);

  const results: CommandCenterResult[] = [
    ...users.map((item) => ({
      id: item.id,
      type: "user" as const,
      title: item.name,
      description: `${item.email} · ${item.role}`,
      href: "/messenger"
    })),
    ...tasks.map((item) => ({
      id: item.id,
      type: "task" as const,
      title: item.title,
      description: `Task Orbit · ${item.status}${item.assignee ? ` · ${item.assignee.name}` : ""}`,
      href: "/tasks"
    })),
    ...wikiPages.map((item) => ({
      id: item.id,
      type: "wiki" as const,
      title: item.title,
      description: `WikiCore · ${item.status}`,
      href: "/wiki"
    })),
    ...tickets.map((item) => ({
      id: item.id,
      type: "ticket" as const,
      title: `#${item.number} ${item.title}`,
      description: `Service Flow · ${item.status} · ${item.priority}`,
      href: "/helpdesk"
    }))
  ];

  revalidatePath("/");
  return {
    mode: "search",
    results
  };
}
