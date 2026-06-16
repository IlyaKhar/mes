"use client";

import type { Role } from "@prisma/client";
import * as React from "react";
import { updateUserRoleAction } from "@/actions/admin";
import { roleLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const roles: Role[] = ["USER", "ADMIN"];

type UserRoleSelectProps = {
  userId: string;
  value: Role;
  disabled?: boolean;
  className?: string;
};

export function UserRoleSelect({ userId, value, disabled, className }: UserRoleSelectProps) {
  const [role, setRole] = React.useState(value);
  const [error, setError] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setRole(value);
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as Role;
    if (nextRole === role) return;

    const previousRole = role;
    setRole(nextRole);
    setError("");

    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: nextRole });

      if (!result.ok) {
        setRole(previousRole);
        setError(result.error);
      }
    });
  }

  return (
    <div className={cn("space-y-1", className)}>
      <select
        value={role}
        onChange={handleChange}
        disabled={disabled || isPending}
        aria-label="Роль пользователя"
        className="h-9 min-w-[9.5rem] rounded-full bg-neos-accentSoft px-3 text-xs font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {roleLabels[item]}
          </option>
        ))}
      </select>
      {error ? <p className="text-[11px] font-semibold text-neos-danger">{error}</p> : null}
    </div>
  );
}
