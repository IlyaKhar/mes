import { Suspense } from "react";
import { DashboardSkeleton, HelpDeskDbWidget } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HelpdeskPage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="Service Flow" />}>
      <HelpDeskDbWidget />
    </Suspense>
  );
}
