import { Suspense } from "react";
import { DashboardSkeleton, MessengerDbWidget } from "@/components/dashboard/db-widgets";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MessengerPage() {
  await requireSession();

  return (
    <Suspense fallback={<DashboardSkeleton title="Messenger" />}>
      <MessengerDbWidget />
    </Suspense>
  );
}
