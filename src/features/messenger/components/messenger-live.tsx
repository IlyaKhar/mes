"use client";

import * as React from "react";
import { Plus, Search, Send, Trash2, UsersRound } from "lucide-react";
import {
  addChatParticipantsAction,
  createDirectChatAction,
  createGroupChatAction,
  deleteChatAction,
  deleteMessageAction,
  searchMessengerUsersAction,
  sendMessage
} from "@/actions/messenger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MessengerUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  department?: string;
};

type MessengerMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: MessengerUser;
};

type MessengerChat = {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  creatorId: string | null;
  messages: MessengerMessage[];
  participants: Array<{
    user: MessengerUser;
  }>;
};

export function MessengerLive({
  chats,
  currentUserId
}: {
  chats: MessengerChat[];
  currentUserId: string;
}) {
  const [activeChatId, setActiveChatId] = React.useState(chats[0]?.id ?? "");
  const [message, setMessage] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupTitle, setGroupTitle] = React.useState("");
  const [foundUsers, setFoundUsers] = React.useState<MessengerUser[]>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<MessengerUser[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];

  function runUserSearch() {
    startTransition(async () => {
      setFoundUsers(await searchMessengerUsersAction(searchQuery));
    });
  }

  function toggleSelectedUser(user: MessengerUser) {
    setSelectedUsers((items) =>
      items.some((item) => item.id === user.id)
        ? items.filter((item) => item.id !== user.id)
        : [...items, user]
    );
  }

  function createDirectChat(userId: string) {
    startTransition(async () => {
      const chat = await createDirectChatAction(userId);
      setActiveChatId(chat.id);
      window.location.reload();
    });
  }

  function createGroupChat() {
    startTransition(async () => {
      const chat = await createGroupChatAction({
        title: groupTitle,
        participantIds: selectedUsers.map((user) => user.id)
      });
      setActiveChatId(chat.id);
      window.location.reload();
    });
  }

  function addParticipants() {
    if (!activeChat) return;

    startTransition(async () => {
      await addChatParticipantsAction({
        chatId: activeChat.id,
        participantIds: selectedUsers.map((user) => user.id)
      });
      window.location.reload();
    });
  }

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeChat || !message.trim()) return;

    startTransition(async () => {
      await sendMessage({
        chatId: activeChat.id,
        body: message.trim()
      });
      setMessage("");
      window.location.reload();
    });
  }

  function deleteActiveChat() {
    if (!activeChat) return;
    if (!window.confirm("Удалить чат вместе со всеми сообщениями?")) return;

    startTransition(async () => {
      await deleteChatAction(activeChat.id);
      window.location.reload();
    });
  }

  function deleteMessage(messageId: string) {
    if (!window.confirm("Удалить сообщение?")) return;

    startTransition(async () => {
      await deleteMessageAction(messageId);
      window.location.reload();
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_1fr_320px]">
      <aside className="rounded-default bg-neos-accentSoft p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-black text-primary">Мои чаты</p>
          <Badge tone="blue">{chats.length}</Badge>
        </div>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => setActiveChatId(chat.id)}
              className={cn(
                "w-full rounded-default p-4 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                chat.id === activeChatId ? "bg-primary text-white shadow-card" : "bg-white shadow-card"
              )}
            >
              <p className="font-black">{chat.title}</p>
              <p className={cn("mt-1", chat.id === activeChatId ? "text-white/75" : "text-muted-foreground")}>
                {chat.isPrivate ? "Личный чат" : `${chat.participants.length} участников`}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[560px] flex-col rounded-default bg-white shadow-card ring-1 ring-border">
        {activeChat ? (
          <>
            <header className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">{activeChat.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeChat.participants.map((item) => item.user.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={activeChat.isPrivate ? "blue" : "violet"}>
                    {activeChat.isPrivate ? "личный" : "группа"}
                  </Badge>
                  {activeChat.creatorId === currentUserId ? (
                    <Button
                      type="button"
                      variant="soft"
                      size="icon"
                      onClick={deleteActiveChat}
                      disabled={isPending}
                      aria-label="Удалить чат"
                    >
                      <Trash2 className="size-5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {activeChat.messages.map((item) => {
                const isMine = item.user.id === currentUserId;

                return (
                  <article key={item.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[72%] rounded-default p-4 shadow-card", isMine ? "bg-primary text-white" : "bg-neos-accentSoft")}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={cn("text-xs font-black", isMine ? "text-white/80" : "text-primary")}>{item.user.name}</p>
                        {(isMine || activeChat.creatorId === currentUserId) ? (
                          <button
                            type="button"
                            onClick={() => deleteMessage(item.id)}
                            className={cn(
                              "rounded-full p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isMine ? "text-white/75 hover:bg-white/15" : "text-primary hover:bg-white"
                            )}
                            aria-label="Удалить сообщение"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                      <p className={cn("mt-2 text-sm leading-6", isMine ? "text-white/90" : "text-muted-foreground")}>{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <form onSubmit={submitMessage} className="flex gap-3 border-t border-border p-5">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Написать сообщение"
                className="h-12 flex-1 rounded-default bg-neos-accentSoft px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="icon" disabled={isPending || !message.trim()}>
                <Send className="size-5" aria-hidden="true" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm font-bold text-muted-foreground">
            Создай первый чат справа
          </div>
        )}
      </section>

      <aside className="space-y-4 rounded-default bg-neos-accentSoft p-4">
        <div>
          <p className="mb-3 text-sm font-black text-primary">Найти участника</p>
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="ID, email или имя"
              className="h-11 min-w-0 flex-1 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="button" size="icon" onClick={runUserSearch} disabled={isPending}>
              <Search className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {foundUsers.map((user) => (
            <div key={user.id} className="rounded-default bg-white p-3 shadow-card">
              <p className="text-sm font-black">{user.name}</p>
              <p className="truncate text-xs font-semibold text-muted-foreground">{user.email}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-primary">ID: {user.id}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" onClick={() => createDirectChat(user.id)}>
                  Написать
                </Button>
                <Button type="button" size="sm" variant="soft" onClick={() => toggleSelectedUser(user)}>
                  {selectedUsers.some((item) => item.id === user.id) ? "Убрать" : "В группу"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-default bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <UsersRound className="size-5" aria-hidden="true" />
            <p className="text-sm font-black">Создать группу</p>
          </div>
          <input
            value={groupTitle}
            onChange={(event) => setGroupTitle(event.target.value)}
            placeholder="Название группы"
            className="h-11 w-full rounded-default bg-neos-accentSoft px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-3 text-xs font-bold text-muted-foreground">
            Выбрано: {selectedUsers.map((user) => user.name).join(", ") || "никого"}
          </p>
          <div className="mt-3 grid gap-2">
            <Button type="button" className="gap-2" onClick={createGroupChat} disabled={isPending || !groupTitle.trim() || selectedUsers.length === 0}>
              <Plus className="size-4" aria-hidden="true" />
              Создать группу
            </Button>
            <Button type="button" variant="soft" onClick={addParticipants} disabled={isPending || !activeChat || selectedUsers.length === 0}>
              Добавить в текущий чат
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
