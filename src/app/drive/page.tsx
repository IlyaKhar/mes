import { Suspense } from "react";
import { DashboardSkeleton, DriveDbWidget } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DrivePage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="CloudSpace" />}>
      <DriveDbWidget />
    </Suspense>
  );
}
