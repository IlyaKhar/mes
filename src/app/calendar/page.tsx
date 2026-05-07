import { Suspense } from "react";
import { CalendarDbWidget, DashboardSkeleton } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="SyncNode" />}>
      <CalendarDbWidget />
    </Suspense>
  );
}
