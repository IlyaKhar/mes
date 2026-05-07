import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton, MetricsWidget } from "@/components/dashboard/db-widgets";
import { navigationItems } from "@/components/layout/navigation-config";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireSession();
  const moduleItems = navigationItems.filter((item) => item.id !== "dashboard");

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-default bg-primary p-8 text-white shadow-float">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-white/70">Пульс компании</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">
            Привет, {user.name.split(" ")[0]}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
            Это операционный центр NEOS. Метрики снизу собраны из PostgreSQL, модули в меню — отдельные страницы с боевой логикой.
          </p>
        </div>
      </section>

      <Suspense fallback={<DashboardSkeleton title="Метрики" />}>
        <MetricsWidget />
      </Suspense>

      <section aria-label="Модули NEOS" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
