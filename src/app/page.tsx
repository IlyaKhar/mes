import { Suspense } from "react";
import {
  CalendarDbWidget,
  DashboardSkeleton,
  DriveDbWidget,
  HelpDeskDbWidget,
  MessengerDbWidget,
  MetricsWidget,
  TasksDbWidget,
  WikiDbWidget
} from "@/components/dashboard/db-widgets";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div id="dashboard" className="space-y-6">
      <section className="overflow-hidden rounded-default bg-primary p-8 text-white shadow-float">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-white/70">Пульс компании</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">
            NEOS работает на реальных данных PostgreSQL
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
            Коммуникации, заявки, задачи, календарь, файлы и знания загружаются через Prisma.
          </p>
        </div>
      </section>

      <Suspense fallback={<DashboardSkeleton title="Метрики" />}>
        <MetricsWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="Messenger" />}>
        <MessengerDbWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="Task Orbit" />}>
        <TasksDbWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="Service Flow" />}>
        <HelpDeskDbWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="SyncNode" />}>
        <CalendarDbWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="CloudSpace" />}>
        <DriveDbWidget />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="WikiCore" />}>
        <WikiDbWidget />
      </Suspense>
    </div>
  );
}
