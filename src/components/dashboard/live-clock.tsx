"use client";

import * as React from "react";
import { Clock3 } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = React.useState<string>(() =>
    new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 rounded-default bg-neos-accentSoft px-3 py-1.5 font-mono text-sm font-bold text-primary">
      <Clock3 className="size-4" aria-hidden="true" />
      <span suppressHydrationWarning className="tabular-nums">
        {time}
      </span>
    </span>
  );
}
