import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card key={module.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-default bg-neos-accentSoft text-primary">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.label}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
                <Link
                  href={module.href}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary transition hover:gap-3"
                >
                  Перейти
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
