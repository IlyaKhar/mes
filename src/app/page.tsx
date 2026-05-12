import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardBriefing } from "@/components/dashboard/dashboard-briefing";
import { DashboardSkeleton, MetricsWidget } from "@/components/dashboard/db-widgets";
import { navigationItems } from "@/components/layout/navigation-config";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireSession();
  const moduleItems = navigationItems.filter((item) => item.id !== "dashboard");

  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton title="Брифинг" />}>
        <DashboardBriefing />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="Метрики" />}>
        <MetricsWidget />
      </Suspense>

      <section aria-label="Модули OKEI" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {moduleItems.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.id}
              href={module.href}
              className="group block rounded-default bg-white p-5 shadow-card ring-1 ring-border/80 transition-colors hover:ring-primary/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{module.title}</p>
                  <p className="text-sm text-muted-foreground">{module.label}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all group-hover:gap-3">
                Перейти
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
