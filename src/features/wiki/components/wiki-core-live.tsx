"use client";

import * as React from "react";
import type { WikiPageStatus } from "@prisma/client";
import { BookOpen, ChevronDown, FilePlus2, Link2, Save, Trash2, UsersRound } from "lucide-react";
import {
  createWikiPageAction,
  deleteWikiPageAction,
  markWikiPageReadAction,
  updateWikiPageAction
} from "@/actions/wiki";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WikiUser = {
  id: string;
  name: string;
  email: string;
};

type WikiPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: WikiPageStatus;
  authorId: string;
  parentId: string | null;
  updatedAt: string;
  author: WikiUser;
  reads: Array<{
    id: string;
    readAt: string;
    user: WikiUser;
  }>;
  histories: Array<{
    id: string;
    createdAt: string;
    author: WikiUser;
  }>;
};

const statusLabels: Record<WikiPageStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликована",
  ARCHIVED: "Архив"
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getChildren(pages: WikiPage[], parentId: string | null) {
  return pages.filter((page) => page.parentId === parentId);
}

export function WikiCoreLive({
  pages,
  currentUserId,
  isAdmin
}: {
  pages: WikiPage[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const articleRef = React.useRef<HTMLElement>(null);
  const [activePageId, setActivePageId] = React.useState(pages[0]?.id ?? "");
  const [expandedIds, setExpandedIds] = React.useState<string[]>(() => pages.filter((page) => !page.parentId).map((page) => page.id));
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [status, setStatus] = React.useState<WikiPageStatus>("DRAFT");
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<WikiPageStatus>("DRAFT");
  const [smartLink, setSmartLink] = React.useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const canEditActivePage = Boolean(activePage && (isAdmin || activePage.authorId === currentUserId));

  React.useEffect(() => {
    if (!activePage) return;
    setEditTitle(activePage.title);
    setEditContent(activePage.content);
    setEditStatus(activePage.status);
  }, [activePage]);

  React.useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      if (!selectedText || !range || !articleRef.current?.contains(range.commonAncestorContainer)) {
        setSmartLink(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setSmartLink({
        text: selectedText,
        top: rect.top + window.scrollY - 56,
        left: rect.left + window.scrollX + rect.width / 2
      });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  function toggleExpanded(pageId: string) {
    setExpandedIds((items) =>
      items.includes(pageId) ? items.filter((item) => item !== pageId) : [...items, pageId]
    );
  }

  function createPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const page = await createWikiPageAction({
        title,
        content,
        parentId,
        status
      });
      setActivePageId(page.id);
      setTitle("");
      setContent("");
      setParentId("");
      setStatus("DRAFT");
      window.location.reload();
    });
  }

  function savePage() {
    if (!activePage) return;

    startTransition(async () => {
      await updateWikiPageAction({
        pageId: activePage.id,
        title: editTitle,
        content: editContent,
        status: editStatus
      });
      window.location.reload();
    });
  }

  function markRead() {
    if (!activePage) return;

    startTransition(async () => {
      await markWikiPageReadAction(activePage.id);
      window.location.reload();
    });
  }

  function deletePage() {
    if (!activePage) return;
    if (!window.confirm("Удалить статью? Дочерние статьи тоже будут удалены.")) return;

    startTransition(async () => {
      await deleteWikiPageAction(activePage.id);
      window.location.reload();
    });
  }

  function renderTree(parentNodeId: string | null, level = 0): React.ReactNode {
    return getChildren(pages, parentNodeId).map((page) => {
      const children = getChildren(pages, page.id);
      const isOpen = expandedIds.includes(page.id);
      const isActive = activePage?.id === page.id;

      return (
        <section key={page.id} className={cn("rounded-default bg-white p-3 shadow-card", level > 0 && "ml-4")}>
          <button
            type="button"
            onClick={() => {
              setActivePageId(page.id);
              if (children.length > 0) toggleExpanded(page.id);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-default px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive ? "bg-primary text-white" : "hover:bg-neos-accentSoft"
            )}
          >
            <span className="flex items-center gap-2 text-sm font-black">
              <BookOpen className={cn("size-5", isActive ? "text-white" : "text-primary")} aria-hidden="true" />
              {page.title}
            </span>
            {children.length > 0 ? (
              <ChevronDown
                className={cn("size-5 transition-transform duration-300", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            ) : null}
          </button>

          {children.length > 0 ? (
            <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden pt-3">{renderTree(page.id, level + 1)}</div>
            </div>
          ) : null}
        </section>
      );
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-default bg-neos-accentSoft p-4">
        <p className="text-sm font-black text-primary">Что такое База знаний?</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Это справочник компании: инструкции, регламенты, FAQ, база знаний. Статьи лежат в PostgreSQL,
          у каждой есть автор, статус, история изменений и список сотрудников, которые её прочитали.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-default bg-neos-accentSoft p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Дерево знаний</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Разделы можно вкладывать друг в друга.</p>
          </div>

          <form onSubmit={createPage} className="space-y-3 rounded-default bg-white p-3 shadow-card">
            <div className="flex items-center gap-2 text-primary">
              <FilePlus2 className="size-5" aria-hidden="true" />
              <p className="text-sm font-black">Новая статья</p>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название"
              className="h-11 w-full rounded-default bg-neos-accentSoft px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Текст статьи"
              className="min-h-24 w-full rounded-default bg-neos-accentSoft px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className="h-11 w-full rounded-default bg-neos-accentSoft px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Корневой раздел</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>{page.title}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as WikiPageStatus)}
              className="h-11 w-full rounded-default bg-neos-accentSoft px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликована</option>
              <option value="ARCHIVED">Архив</option>
            </select>
            <Button type="submit" className="w-full" disabled={isPending || !title.trim() || !content.trim()}>
              Создать
            </Button>
          </form>

          <div className="space-y-3">
            {pages.length > 0 ? renderTree(null) : (
              <div className="rounded-default bg-white p-4 text-sm font-bold text-muted-foreground shadow-card">
                Пока нет статей. Создай первую, брат.
              </div>
            )}
          </div>
        </aside>

        <article
          ref={articleRef}
          className="relative min-h-[680px] rounded-default bg-white px-6 py-8 shadow-card ring-1 ring-border sm:px-10 lg:px-14"
        >
          {activePage ? (
            <div className="mx-auto max-w-[820px]">
              <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">/{activePage.slug}</p>
                    <Badge tone={activePage.status === "PUBLISHED" ? "green" : "amber"}>{statusLabels[activePage.status]}</Badge>
                  </div>
                  <h3 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-tight text-foreground">{activePage.title}</h3>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-muted-foreground">
                    <span>Автор: {activePage.author.name}</span>
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span>Обновлено: {new Date(activePage.updatedAt).toLocaleString("ru-RU")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="soft" size="sm" onClick={markRead} disabled={isPending}>
                    Прочитал
                  </Button>
                  {canEditActivePage ? (
                    <Button type="button" variant="ghost" size="icon" onClick={deletePage} aria-label="Удалить статью">
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-default bg-neos-accentSoft p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Чистый лист</p>
                <div className="mt-4 whitespace-pre-line text-lg font-medium leading-9 text-foreground">{activePage.content}</div>
              </div>

              {canEditActivePage ? (
                <section className="mt-8 rounded-default bg-neos-accentSoft p-4">
                  <p className="text-sm font-black text-primary">Редактирование</p>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="h-11 rounded-default bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      className="min-h-40 rounded-default bg-white px-3 py-3 text-sm font-semibold leading-6 outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value as WikiPageStatus)}
                        className="h-11 rounded-default bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="DRAFT">Черновик</option>
                        <option value="PUBLISHED">Опубликована</option>
                        <option value="ARCHIVED">Архив</option>
                      </select>
                      <Button type="button" className="gap-2" onClick={savePage} disabled={isPending || !editTitle.trim() || !editContent.trim()}>
                        <Save className="size-4" aria-hidden="true" />
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </section>
              ) : null}

              <footer className="mt-8 grid gap-4 lg:grid-cols-2">
                <section className="rounded-default bg-neos-accentSoft p-5">
                  <div className="mb-4 flex items-center gap-2 text-primary">
                    <UsersRound className="size-5" aria-hidden="true" />
                    <p className="text-sm font-black">Кто прочитал</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex -space-x-3">
                      {activePage.reads.map((read) => (
                        <div
                          key={read.id}
                          title={read.user.name}
                          className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-black text-primary shadow-card ring-2 ring-neos-accentSoft"
                        >
                          {getInitials(read.user.name)}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">
                      {activePage.reads.length} сотрудников изучили статью
                    </p>
                  </div>
                </section>

                <section className="rounded-default bg-neos-accentSoft p-5">
                  <p className="text-sm font-black text-primary">История изменений</p>
                  <div className="mt-3 space-y-2">
                    {activePage.histories.length > 0 ? activePage.histories.slice(0, 5).map((history) => (
                      <div key={history.id} className="rounded-default bg-white p-3 text-xs font-bold text-muted-foreground">
                        {history.author.name} · {new Date(history.createdAt).toLocaleString("ru-RU")}
                      </div>
                    )) : (
                      <p className="text-sm font-bold text-muted-foreground">Пока изменений нет</p>
                    )}
                  </div>
                </section>
              </footer>
            </div>
          ) : (
            <div className="flex min-h-[500px] items-center justify-center text-center text-sm font-bold text-muted-foreground">
              Создай первую статью в справочнике
            </div>
          )}
        </article>
      </div>

      {smartLink ? (
        <div
          className="fixed z-[60] -translate-x-1/2 rounded-default bg-white p-2 shadow-float ring-1 ring-border"
          style={{ top: smartLink.top, left: smartLink.left }}
        >
          <Button type="button" size="sm" className="gap-2" onClick={() => setSmartLink(null)}>
            <Link2 className="size-4" aria-hidden="true" />
            Создать ссылку на другую статью
          </Button>
          <p className="mt-2 max-w-[260px] truncate px-2 text-xs font-bold text-muted-foreground">
            Выделено: {smartLink.text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
