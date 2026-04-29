"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[70vh] px-4 py-10">
      <section className="mx-auto max-w-xl rounded-default bg-white p-8 text-center shadow-float ring-1 ring-border">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">NEOS</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">База временно недоступна</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Мы не смогли загрузить данные. Проверь PostgreSQL, `DATABASE_URL` и миграции.
        </p>
        <p className="mt-4 rounded-default bg-neos-accentSoft p-3 text-xs font-bold text-primary">
          {error.message}
        </p>
        <Button className="mt-6" onClick={reset}>
          Повторить
        </Button>
      </section>
    </main>
  );
}
