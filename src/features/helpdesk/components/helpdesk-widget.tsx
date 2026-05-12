"use client";

import * as React from "react";
import { CheckCircle2, SendHorizonal, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHelpDeskStore } from "@/features/helpdesk/store";
import { cn } from "@/lib/utils";

const categories = ["Все", "IT", "HR", "Снабжение"] as const;

type CategoryFilter = (typeof categories)[number];

function getSlaIndicatorClassName(value: number) {
  if (value <= 24) return "bg-neos-danger animate-pulse shadow-[0_0_18px_rgba(239,68,68,0.45)]";
  if (value <= 45) return "bg-neos-warning animate-pulse shadow-[0_0_18px_rgba(245,158,11,0.42)]";
  return "bg-primary";
}

function getPriorityTone(priority: string) {
  if (priority === "Критичный") return "red";
  if (priority === "Высокий") return "amber";
  if (priority === "Средний") return "blue";
  return "green";
}

export function HelpDeskWidget() {
  const { addTicket, tickets } = useHelpDeskStore();
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>("Все");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<Exclude<CategoryFilter, "Все">>("IT");
  const [isFlying, setIsFlying] = React.useState(false);
  const filteredTickets =
    activeCategory === "Все"
      ? tickets
      : tickets.filter((ticket) => ticket.category === activeCategory);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isFlying) return;

    setIsFlying(true);

    window.setTimeout(() => {
      addTicket({ title: title.trim(), category });
      setTitle("");
      setIsFlying(false);
    }, 520);
  }

  return (
    <Card id="helpdesk" className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Поддержка</CardTitle>
          <CardDescription>Чистая очередь заявок, категории и живой SLA</CardDescription>
        </div>
        <Badge tone="red">
          {tickets.filter((ticket) => ticket.slaLeftPercent <= 24).length} горит
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2" aria-label="Фильтр по категориям">
            <div className="mr-1 flex size-10 items-center justify-center rounded-full bg-neos-accentSoft text-primary">
              <SlidersHorizontal className="size-5" aria-hidden="true" />
            </div>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveCategory(item)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeCategory === item
                    ? "bg-primary text-white shadow-card"
                    : "bg-neos-accentSoft text-primary hover:bg-primary hover:text-white"
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex flex-col gap-3 rounded-default bg-neos-accentSoft p-3 transition-all duration-500 sm:flex-row sm:items-center",
              isFlying && "translate-x-16 -translate-y-10 scale-75 opacity-0 rotate-6"
            )}
          >
            <label className="sr-only" htmlFor="ticket-title">
              Название заявки
            </label>
            <input
              id="ticket-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Новая заявка"
              className="h-11 min-w-0 rounded-default bg-white px-4 text-sm font-semibold outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary sm:w-[260px]"
            />
            <label className="sr-only" htmlFor="ticket-category">
              Категория заявки
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Exclude<CategoryFilter, "Все">)}
              className="h-11 rounded-default bg-white px-4 text-sm font-black outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
            >
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Снабжение">Снабжение</option>
            </select>
            <Button type="submit" className="gap-2">
              <SendHorizonal className="size-4" aria-hidden="true" />
              Отправить
            </Button>
          </form>
        </div>

        <div className="overflow-hidden rounded-default bg-white shadow-card">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead className="bg-white text-xs font-black uppercase tracking-[0.12em] text-primary">
              <tr>
                <th className="px-5 py-4">Заявка</th>
                <th className="px-5 py-4">Категория</th>
                <th className="px-5 py-4">Владелец</th>
                <th className="px-5 py-4">Статус</th>
                <th className="px-5 py-4">SLA</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  className={cn("transition hover:bg-neos-accentSoft/70", index % 2 === 1 ? "bg-neos-accentSoft" : "bg-white")}
                >
                  <td className="px-5 py-5">
                    <div className="max-w-[440px]">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black">{ticket.id}</p>
                        <Badge tone={getPriorityTone(ticket.priority)}>{ticket.priority}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-black text-foreground">{ticket.title}</p>
                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/80">
                        <div
                          className={cn("h-full rounded-full transition-all", getSlaIndicatorClassName(ticket.slaLeftPercent))}
                          style={{ width: `${ticket.slaLeftPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <Badge tone={ticket.category === "IT" ? "blue" : ticket.category === "HR" ? "violet" : "cyan"}>
                      {ticket.category}
                    </Badge>
                  </td>
                  <td className="px-5 py-5 text-sm font-bold">{ticket.owner}</td>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2 text-sm font-black text-foreground">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      {ticket.status}
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <p className="text-sm font-black">{ticket.slaLeftPercent}% времени</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">Дедлайн: {ticket.deadline}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
