"use client";

import * as React from "react";
import { getPusherClient } from "@/lib/realtime/pusher-client";

export type RealtimeMessage = {
  id: string;
  body: string;
  kind: string;
  chatId: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export function useChatRealtime(
  chatId: string,
  onMessage: (message: RealtimeMessage) => void
) {
  React.useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return undefined;

    const channel = pusher.subscribe(`chat-${chatId}`);
    channel.bind("message:new", onMessage);

    return () => {
      channel.unbind("message:new", onMessage);
      pusher.unsubscribe(`chat-${chatId}`);
    };
  }, [chatId, onMessage]);
}
