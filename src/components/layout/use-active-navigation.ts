"use client";

import { usePathname } from "next/navigation";
import { adminNavigationItem, navigationItems } from "@/components/layout/navigation-config";

export function useActiveNavigation() {
  const pathname = usePathname() ?? "/";

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminNavigationItem;
  }

  const matched = navigationItems.find((item) => {
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return matched ?? navigationItems[0];
}
