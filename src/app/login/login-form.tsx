"use client";

import * as React from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams?.get("next") ?? "/";
  const nextPath = (rawNext.startsWith("/") ? rawNext : "/") as Route;
  const [email, setEmail] = React.useState("admin@neos.local");
  const [password, setPassword] = React.useState("Neos12345!");
  const [error, setError] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Неверный email, пароль или пользователь заблокирован");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo.png"
            alt="OKES"
            width={140}
            height={140}
            className="size-32 object-contain"
            priority
          />
          <p className="text-sm font-semibold text-muted-foreground">Вход в корпоративную экосистему</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-default bg-white p-6 shadow-float ring-1 ring-border">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-black">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="mt-2 h-12 w-full rounded-default bg-neos-accentSoft px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black">Пароль</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 h-12 w-full rounded-default bg-neos-accentSoft px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-default bg-red-50 p-3 text-sm font-bold text-neos-danger">{error}</p> : null}

          <Button type="submit" className="mt-6 w-full" disabled={isPending}>
            {isPending ? "Входим..." : "Войти"}
          </Button>
        </form>
      </section>
    </main>
  );
}
