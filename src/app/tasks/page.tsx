import { Suspense } from "react";
import { DashboardSkeleton, TasksDbWidget } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="Task Orbit" />}>
      <TasksDbWidget />
    </Suspense>
  );
}
