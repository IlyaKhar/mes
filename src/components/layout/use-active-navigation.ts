"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { adminNavigationItem, navigationItems, type NavigationItemId } from "@/components/layout/navigation-config";

function getHashId() {
  return window.location.hash.replace("#", "");
}

export function useActiveNavigation() {
  const pathname = usePathname();
  const [activeId, setActiveId] = React.useState<NavigationItemId>(navigationItems[0].id);

  React.useEffect(() => {
    if (pathname !== "/") {
      setActiveId(pathname === "/admin" ? adminNavigationItem.id : navigationItems[0].id);
      return undefined;
    }

    function syncActiveSection() {
      const hashId = getHashId();
      const hashItem = navigationItems.find((item) => item.id === hashId);

      if (hashItem) {
        setActiveId(hashItem.id);
        return;
      }

      const currentItem = navigationItems.reduce((closestItem, item) => {
        const element = document.getElementById(item.id);
        if (!element) return closestItem;

        const distance = Math.abs(element.getBoundingClientRect().top - 96);
        if (!closestItem) return { item, distance };

        return distance < closestItem.distance ? { item, distance } : closestItem;
      }, null as null | { item: (typeof navigationItems)[number]; distance: number });

      setActiveId(currentItem?.item.id ?? navigationItems[0].id);
    }

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    window.addEventListener("scroll", syncActiveSection, { passive: true });

    return () => {
      window.removeEventListener("hashchange", syncActiveSection);
      window.removeEventListener("scroll", syncActiveSection);
    };
  }, [pathname]);

  if (pathname === "/admin") return adminNavigationItem;

  return navigationItems.find((item) => item.id === activeId) ?? navigationItems[0];
}
