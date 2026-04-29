"use client";

import * as React from "react";
import { Bot, MessageSquareText, Mic2, Send, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessengerStore } from "@/features/messenger/store";
import { cn } from "@/lib/utils";

type VoiceMessageProps = {
  waveform?: number[];
  transcript?: string;
};

function VoiceMessage({ waveform = [], transcript }: VoiceMessageProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = React.useState(false);

  return (
    <div>
      <div className="flex items-center gap-3 rounded-default bg-white/70 p-3 ring-1 ring-border">
        <div className="flex size-10 items-center justify-center rounded-default bg-primary text-white">
          <Mic2 className="size-5" aria-hidden="true" />
        </div>
        <div className="flex h-12 flex-1 items-center gap-1" aria-label="Волновой график голосового сообщения">
          {waveform.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1.5 rounded-full bg-primary/80"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setIsTranscriptOpen((value) => !value);
          }}
        >
          Текст
        </Button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isTranscriptOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <p className="overflow-hidden rounded-default bg-neos-accentSoft px-4 text-sm leading-6 text-muted-foreground">
          <span className="block py-3">{transcript}</span>
        </p>
      </div>
    </div>
  );
}

export function MessengerWidget() {
  const {
    activeChatId,
    activeThreadMessageId,
    chats,
    closeThread,
    messages,
    openThread,
    setActiveChatId,
    summaries,
    threadReplies
  } = useMessengerStore();
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];
  const activeMessages = messages.filter((message) => message.chatId === activeChat.id);
  const activeThreadMessage = messages.find((message) => message.id === activeThreadMessageId);
  const replies = activeThreadMessageId ? threadReplies[activeThreadMessageId] ?? [] : [];

  return (
    <Card id="messenger" className="relative min-h-[680px] overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Мессенджер</CardTitle>
          <CardDescription>Чаты, треды, голосовые сообщения и ИИ-сводка</CardDescription>
        </div>
        <Badge tone="blue">{activeMessages.length} сообщений</Badge>
      </CardHeader>

      <CardContent className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-default bg-neos-accentSoft p-3">
          <div className="mb-3 px-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Диалоги</p>
            <p className="mt-1 text-sm text-muted-foreground">Рабочие комнаты команды</p>
          </div>
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => setActiveChatId(chat.id)}
                className={cn(
                  "w-full rounded-default p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  chat.id === activeChat.id ? "bg-primary text-white shadow-card" : "bg-white text-foreground shadow-card"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{chat.title}</p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        chat.id === activeChat.id ? "text-white/72" : "text-muted-foreground"
                      )}
                    >
                      {chat.description}
                    </p>
                  </div>
                  <span className="text-xs font-black">{chat.lastMessageAt}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black",
                      chat.id === activeChat.id ? "bg-white/16 text-white" : "bg-neos-accentSoft text-primary"
                    )}
                  >
                    {chat.status}
                  </span>
                  {chat.unreadCount > 0 ? (
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-xs font-black",
                        chat.id === activeChat.id ? "bg-white text-primary" : "bg-primary text-white"
                      )}
                    >
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[540px] flex-col rounded-default bg-white shadow-card ring-1 ring-border">
          <header className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-lg font-black">{activeChat.title}</p>
              <p className="text-sm font-semibold text-muted-foreground">{activeChat.description}</p>
            </div>
            <Badge tone="green">{activeChat.status}</Badge>
          </header>

          <div className="mx-5 rounded-default bg-primary p-5 text-white shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5" aria-hidden="true" />
              <p className="text-sm font-black uppercase tracking-[0.16em] text-white/70">ИИ-саммари</p>
            </div>
            <p className="text-base font-semibold leading-7">{summaries[activeChat.id]}</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {activeMessages.map((message) => {
              const isMine = message.role === "me";
              const isAi = message.role === "ai";

              return (
                <div
                  key={message.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openThread(message.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openThread(message.id);
                    }
                  }}
                  className={cn(
                    "group flex w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isMine ? "justify-end" : "justify-start"
                  )}
                >
                  <article
                    className={cn(
                      "max-w-[78%] rounded-default p-4 shadow-card ring-1 ring-border transition group-hover:-translate-y-0.5",
                      isMine && "bg-primary text-white",
                      isAi && "bg-neos-accentSoft text-foreground",
                      !isMine && !isAi && "bg-white"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {isAi ? (
                          <Bot className="size-4 text-primary" aria-hidden="true" />
                        ) : (
                          <MessageSquareText
                            className={cn("size-4", isMine ? "text-white" : "text-primary")}
                            aria-hidden="true"
                          />
                        )}
                        <p className="text-sm font-black">{message.author}</p>
                      </div>
                      <span className={cn("text-xs font-bold", isMine ? "text-white/70" : "text-muted-foreground")}>
                        {message.time}
                      </span>
                    </div>
                    {message.kind === "voice" ? (
                      <VoiceMessage waveform={message.waveform} transcript={message.transcript} />
                    ) : (
                      <p className={cn("text-sm leading-6", isMine ? "text-white/86" : "text-muted-foreground")}>
                        {message.text}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <span className={cn("text-xs font-black", isMine ? "text-white/72" : "text-primary")}>
                        {message.threadCount > 0
                          ? `${message.threadCount} ответа в треде`
                          : "Открыть тред"}
                      </span>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          <footer className="flex items-center gap-3 p-5">
            <div className="flex h-12 flex-1 items-center rounded-default bg-neos-accentSoft px-4 text-sm font-semibold text-muted-foreground">
              Напишите сообщение или перетащите файл
            </div>
            <Button size="icon" aria-label="Отправить сообщение">
              <Send className="size-5" aria-hidden="true" />
            </Button>
          </footer>
        </section>
      </CardContent>

      <aside
        className={cn(
          "absolute inset-y-0 right-0 z-20 w-full max-w-sm bg-white/82 p-5 shadow-float backdrop-blur-2xl transition-transform duration-300",
          activeThreadMessage ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!activeThreadMessage}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black">Обсуждение</p>
            <p className="text-sm text-muted-foreground">Контекст выбранного сообщения</p>
          </div>
          <Button type="button" variant="soft" size="icon" onClick={closeThread} aria-label="Закрыть тред">
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        {activeThreadMessage ? (
          <div className="space-y-4">
            <article className="rounded-default bg-primary p-4 text-white shadow-card">
              <p className="text-sm font-black">{activeThreadMessage.author}</p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                {activeThreadMessage.text ?? activeThreadMessage.transcript}
              </p>
            </article>

            <div className="space-y-3">
              {replies.map((reply) => (
                <article key={reply.id} className="rounded-default bg-white p-4 shadow-card ring-1 ring-border">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-black">{reply.author}</p>
                    <span className="text-xs font-bold text-muted-foreground">{reply.time}</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{reply.text}</p>
                </article>
              ))}
              {replies.length === 0 ? (
                <div className="rounded-default bg-neos-accentSoft p-4 text-sm font-semibold text-muted-foreground">
                  В этом треде пока нет ответов. Можно зафиксировать решение первым сообщением.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </Card>
  );
}
