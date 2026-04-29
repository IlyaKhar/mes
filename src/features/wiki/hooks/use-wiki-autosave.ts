"use client";

import * as React from "react";
import { updateWikiPage } from "@/actions/wiki";

const autosaveIntervalMs = 30_000;

export function useWikiAutosave(input: {
  pageId: string;
  title?: string;
  content: string;
  enabled?: boolean;
}) {
  const latestInput = React.useRef(input);

  React.useEffect(() => {
    latestInput.current = input;
  }, [input]);

  React.useEffect(() => {
    if (input.enabled === false) return undefined;

    const intervalId = window.setInterval(() => {
      const payload = latestInput.current;

      if (!payload.content.trim()) return;

      void updateWikiPage({
        pageId: payload.pageId,
        title: payload.title,
        content: payload.content
      });
    }, autosaveIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [input.enabled]);
}
