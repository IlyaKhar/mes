import { Suspense } from "react";
import { DashboardSkeleton, WikiDbWidget } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WikiPage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="WikiCore" />}>
      <WikiDbWidget />
    </Suspense>
  );
}
