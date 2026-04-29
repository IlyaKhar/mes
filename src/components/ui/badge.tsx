import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "blue" | "green" | "amber" | "red" | "violet" | "cyan";
};

const toneClassName: Record<NonNullable<BadgeProps["tone"]>, string> = {
  blue: "bg-neos-accentSoft text-primary",
  green: "bg-emerald-50 text-neos-success",
  amber: "bg-amber-50 text-neos-warning",
  red: "bg-red-50 text-neos-danger",
  violet: "bg-violet-50 text-neos-violet",
  cyan: "bg-cyan-50 text-neos-cyan"
};

export function Badge({ className, tone = "blue", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        toneClassName[tone],
        className
      )}
      {...props}
    />
  );
}
