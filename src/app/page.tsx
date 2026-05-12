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
    <div className="space-y-4 sm:space-y-6">
      <Suspense fallback={<DashboardSkeleton title="Брифинг" />}>
        <DashboardBriefing />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton title="Метрики" />}>
        <MetricsWidget />
      </Suspense>

      <section aria-label="Модули OKEI" className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {moduleItems.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.id}
              href={module.href}
              className="group block rounded-default bg-white p-4 shadow-card ring-1 ring-border/80 transition-colors active:scale-[0.99] hover:ring-primary/50 sm:p-5"
            >
              <div className="mb-3 flex items-center gap-3 sm:mb-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-default bg-neos-accentSoft text-primary sm:size-12">
                  <Icon className="size-5 sm:size-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">{module.title}</p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{module.label}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all group-hover:gap-3 sm:mt-4">
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
