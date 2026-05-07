import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setUserBannedAction, updateUserDepartmentAction, updateUserRoleAction } from "@/actions/admin";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

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
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Панель управления NEOS</h1>
        <p className="mt-3 text-sm text-muted-foreground">Пользователи, системные метрики и журнал действий.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Пользователи</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-black tabular-nums">{users.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Активные задачи</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-black tabular-nums">{activeTasks}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Открытые тикеты</CardTitle></CardHeader>
          <CardContent><p className="font-mono text-4xl font-black tabular-nums">{openTickets}</p></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>Бан, роль и отдел</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-default shadow-card">
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
                      <p className="font-black">{user.name}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <form action={updateUserRoleAction.bind(null, { userId: user.id, role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
                        <button className="font-black text-primary">{user.role}</button>
                      </form>
                    </td>
                    <td className="px-4 py-4">
                      <form action={updateUserDepartmentAction.bind(null, { userId: user.id, department: user.department === "IT" ? "OPERATIONS" : "IT" })}>
                        <button className="font-black text-primary">{user.department}</button>
                      </form>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={user.isBanned ? "red" : "green"}>{user.isBanned ? "Забанен" : "Активен"}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <form action={setUserBannedAction.bind(null, { userId: user.id, isBanned: !user.isBanned })}>
                        <button className="font-black text-primary">{user.isBanned ? "Разбанить" : "Забанить"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Логи действий</CardTitle>
            <CardDescription>Кто зашел, что изменил, что создал</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="rounded-default bg-neos-accentSoft p-4">
              <p className="text-sm font-black">{log.type} · {log.entity}</p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                {log.actor?.name ?? "Система"} · {log.createdAt.toLocaleString("ru-RU")}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
