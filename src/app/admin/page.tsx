import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserDepartmentSelect } from "@/components/admin/user-department-select";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { setUserBannedAction } from "@/actions/admin";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  actionLogTypeLabels,
  roleDescriptions,
  roleLabels
} from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/");

  const [users, activeTasks, openTickets, logs] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "desc" } }),
    db.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    db.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    db.actionLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, email: true } } }
    })
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-default bg-white p-6 shadow-card ring-1 ring-border">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Админ-панель</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Панель управления OKES</h1>
        <p className="mt-3 text-sm text-muted-foreground">Пользователи, системные метрики и журнал действий.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-default bg-neos-accentSoft p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{roleLabels.ADMIN}</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{roleDescriptions.ADMIN}</p>
        </article>
        <article className="rounded-default bg-white p-5 ring-1 ring-border/70">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{roleLabels.USER}</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{roleDescriptions.USER}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Пользователи</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-bold tabular-nums text-foreground">{users.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Активные задачи</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-bold tabular-nums text-foreground">{activeTasks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Открытые заявки</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-bold tabular-nums text-foreground">{openTickets}</p></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>Выберите роль и отдел в списке — изменения сохраняются сразу</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-hidden rounded-default shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neos-accentSoft text-xs font-black uppercase text-primary">
                <tr>
                  <th className="px-4 py-3">Пользователь</th>
                  <th className="px-4 py-3">Роль</th>
                  <th className="px-4 py-3">Отдел</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className={index % 2 ? "bg-neos-accentSoft" : "bg-white"}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <UserRoleSelect
                        userId={user.id}
                        value={user.role}
                        disabled={session.id === user.id && user.role === "ADMIN"}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <UserDepartmentSelect userId={user.id} value={user.department} />
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={user.isBanned ? "red" : "green"}>
                        {user.isBanned ? "Заблокирован" : "Активен"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <form action={setUserBannedAction.bind(null, { userId: user.id, isBanned: !user.isBanned })}>
                        <button
                          type="submit"
                          className="text-xs font-bold text-primary underline-offset-2 hover:underline"
                        >
                          {user.isBanned ? "Разблокировать" : "Заблокировать"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded-default bg-white p-4 shadow-card ring-1 ring-border/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge tone={user.isBanned ? "red" : "green"}>
                    {user.isBanned ? "Заблокирован" : "Активен"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Роль
                    </span>
                    <UserRoleSelect
                      userId={user.id}
                      value={user.role}
                      disabled={session.id === user.id && user.role === "ADMIN"}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Отдел
                    </span>
                    <UserDepartmentSelect userId={user.id} value={user.department} />
                  </label>
                </div>
                <form
                  action={setUserBannedAction.bind(null, { userId: user.id, isBanned: !user.isBanned })}
                  className="mt-3"
                >
                  <button
                    type="submit"
                    className="min-h-[36px] px-1 text-xs font-bold text-primary underline-offset-2 active:underline"
                  >
                    {user.isBanned ? "Разблокировать" : "Заблокировать"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Журнал действий</CardTitle>
            <CardDescription>Кто зашёл, что изменил, что создал</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока пусто. Действия пользователей появятся здесь.</p>
          ) : (
            logs.map((log) => (
              <article key={log.id} className="rounded-default bg-neos-accentSoft p-4">
                <p className="text-sm font-bold text-foreground">
                  {actionLogTypeLabels[log.type]} · {log.entity}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.actor?.name ?? "Система"} · {log.createdAt.toLocaleString("ru-RU")}
                </p>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
