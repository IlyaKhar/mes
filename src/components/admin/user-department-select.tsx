"use client";

import type { Department } from "@prisma/client";
import * as React from "react";
import { updateUserDepartmentAction } from "@/actions/admin";
import { departmentLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const departments: Department[] = ["IT", "HR", "PROCUREMENT", "OPERATIONS"];

type UserDepartmentSelectProps = {
  userId: string;
  value: Department;
  disabled?: boolean;
  className?: string;
};

export function UserDepartmentSelect({
  userId,
  value,
  disabled,
  className
}: UserDepartmentSelectProps) {
  const [department, setDepartment] = React.useState(value);
  const [error, setError] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setDepartment(value);
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextDepartment = event.target.value as Department;
    if (nextDepartment === department) return;

    const previousDepartment = department;
    setDepartment(nextDepartment);
    setError("");

    startTransition(async () => {
      const result = await updateUserDepartmentAction({ userId, department: nextDepartment });

      if (!result.ok) {
        setDepartment(previousDepartment);
        setError(result.error);
      }
    });
  }

  return (
    <div className={cn("space-y-1", className)}>
      <select
        value={department}
        onChange={handleChange}
        disabled={disabled || isPending}
        aria-label="Отдел пользователя"
        className="h-9 min-w-[9.5rem] rounded-full bg-neos-accentSoft px-3 text-xs font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        {departments.map((item) => (
          <option key={item} value={item}>
            {departmentLabels[item]}
          </option>
        ))}
      </select>
      {error ? <p className="text-[11px] font-semibold text-neos-danger">{error}</p> : null}
    </div>
  );
}
