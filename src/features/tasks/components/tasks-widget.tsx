"use client";

import { Clock3, Flame, TimerReset, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasksStore } from "@/features/tasks/store";
import { cn } from "@/lib/utils";

const columns = ["План", "В работе", "Проверка"] as const;

function getPriorityHeight(priority: string) {
  if (priority === "Критичный") return "h-full";
  if (priority === "Высокий") return "h-4/5";
  if (priority === "Средний") return "h-3/5";
  return "h-2/5";
}

function getWorkloadDotClassName(taskCount: number) {
  if (taskCount >= 6) return "bg-primary shadow-[0_0_18px_rgba(26,61,99,0.7)]";
  if (taskCount >= 3) return "bg-primary/75 shadow-[0_0_12px_rgba(26,61,99,0.42)]";
  return "bg-primary/35";
}

function getPriorityTone(priority: string) {
  if (priority === "Критичный") return "red";
  if (priority === "Высокий") return "amber";
  if (priority === "Средний") return "blue";
  return "green";
}

export function TasksWidget() {
  const { closeFocusMode, focusedTaskId, focusTask, tasks } = useTasksStore();
  const focusedTask = tasks.find((task) => task.id === focusedTaskId);

  return (
    <>
      <Card
        id="tasks"
        className={cn(
          "min-h-[560px] transition duration-500",
          focusedTask && "scale-[0.985] blur-sm"
        )}
      >
        <CardHeader>
          <div>
            <CardTitle>Задачи</CardTitle>
            <CardDescription>Канбан, приоритеты и загрузка исполнителей</CardDescription>
          </div>
          <Badge tone="violet">{tasks.length} активных</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column);

            return (
              <section key={column} className="rounded-default bg-neos-accentSoft p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black text-primary">{column}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary shadow-card">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {columnTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => focusTask(task.id)}
                      className="group relative w-full rounded-default bg-white p-4 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span
                        className={cn(
                          "absolute bottom-4 left-0 top-4 w-1.5 rounded-r-full bg-primary transition-all",
                          getPriorityHeight(task.priority)
                        )}
                        aria-hidden="true"
                      />
                      <div className="pl-3">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-foreground">{task.title}</p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                              {task.description}
                            </p>
                          </div>
                          <Badge tone={getPriorityTone(task.priority)}>{task.priority}</Badge>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex size-11 items-center justify-center rounded-full bg-neos-accentSoft text-sm font-black text-primary">
                              {task.assigneeInitials}
                              <span
                                className={cn(
                                  "absolute -right-0.5 -top-0.5 size-3.5 rounded-full ring-2 ring-white",
                                  getWorkloadDotClassName(task.assigneeTaskCount)
                                )}
                                aria-label={`У исполнителя ${task.assigneeTaskCount} задач`}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-black">{task.assignee}</p>
                              <p className="text-xs font-bold text-muted-foreground">
                                {task.assigneeTaskCount} задач · {task.workload}% загрузки
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-black text-primary">
                            <Clock3 className="size-4" aria-hidden="true" />
                            {task.estimate}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </CardContent>
      </Card>

      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-white/58 p-6 backdrop-blur-2xl transition-all duration-500",
          focusedTask ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!focusedTask}
      >
        {focusedTask ? (
          <article className="relative w-full max-w-[720px] overflow-hidden rounded-default bg-white p-8 shadow-float ring-1 ring-border">
            <div className="absolute inset-x-12 top-0 h-1 rounded-b-full bg-primary shadow-[0_0_34px_rgba(26,61,99,0.85)]" />
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone={getPriorityTone(focusedTask.priority)}>{focusedTask.priority}</Badge>
                  <span className="text-sm font-black text-primary">{focusedTask.status}</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-foreground">{focusedTask.title}</h3>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  {focusedTask.description}
                </p>
              </div>
              <Button type="button" variant="soft" size="icon" onClick={closeFocusMode} aria-label="Закрыть фокус">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="rounded-default bg-neos-accentSoft p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Исполнитель</p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative flex size-16 items-center justify-center rounded-full bg-white text-lg font-black text-primary shadow-card">
                    {focusedTask.assigneeInitials}
                    <span
                      className={cn(
                        "absolute -right-1 top-1 size-5 rounded-full ring-4 ring-neos-accentSoft",
                        getWorkloadDotClassName(focusedTask.assigneeTaskCount)
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-black">{focusedTask.assignee}</p>
                    <p className="text-sm font-bold text-muted-foreground">
                      {focusedTask.assigneeTaskCount} задач в орбите · {focusedTask.workload}% загрузки
                    </p>
                  </div>
                </div>
                <div className="mt-6 rounded-default bg-white p-4 shadow-card">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Flame className="size-5" aria-hidden="true" />
                    <p className="text-sm font-black">Фокус-сессия</p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Убери лишнее, закрой один конкретный результат и возвращайся в поток задач.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-default bg-primary p-6 text-white shadow-[0_0_60px_rgba(26,61,99,0.42)]">
                <TimerReset className="mb-4 size-10 text-white/80" aria-hidden="true" />
                <p className="text-sm font-black uppercase tracking-[0.24em] text-white/70">Pomodoro</p>
                <p className="mt-3 text-6xl font-black tracking-tight drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]">
                  25:00
                </p>
                <p className="mt-4 text-center text-sm font-semibold leading-6 text-white/75">
                  Неоновый таймер готов к старту фокусной работы
                </p>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );
}
