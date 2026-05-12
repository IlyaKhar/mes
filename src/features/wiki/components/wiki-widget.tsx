"use client";

import * as React from "react";
import { BookOpen, ChevronDown, Link2, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWikiStore } from "@/features/wiki/store";
import { cn } from "@/lib/utils";

export function WikiWidget() {
  const articleRef = React.useRef<HTMLElement>(null);
  const [smartLink, setSmartLink] = React.useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const {
    activePageId,
    expandedNodeIds,
    pages,
    setActivePageId,
    toggleNode,
    tree
  } = useWikiStore();
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];

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

  return (
    <Card id="wiki" className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>База знаний</CardTitle>
          <CardDescription>Чистое чтение, дерево знаний и умные ссылки</CardDescription>
        </div>
        <Badge tone="green">{pages.length} статьи</Badge>
      </CardHeader>

      <CardContent className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-default bg-neos-accentSoft p-4">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Дерево знаний</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Папки раскрываются плавно, без визуального шума.</p>
          </div>

          <div className="space-y-3">
            {tree.map((node) => {
              const isOpen = expandedNodeIds.includes(node.id);

              return (
                <section key={node.id} className="rounded-default bg-white p-3 shadow-card">
                  <button
                    type="button"
                    onClick={() => toggleNode(node.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-default px-2 py-2 text-left transition hover:bg-neos-accentSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex items-center gap-2 text-sm font-black">
                      <BookOpen className="size-5 text-primary" aria-hidden="true" />
                      {node.title}
                    </span>
                    <ChevronDown
                      className={cn("size-5 text-primary transition-transform duration-300", isOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2 pt-3">
                        {node.children?.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => child.pageId && setActivePageId(child.pageId)}
                            className={cn(
                              "w-full rounded-default px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              child.pageId === activePage.id
                                ? "bg-primary text-white shadow-card"
                                : "bg-neos-accentSoft text-foreground hover:text-primary"
                            )}
                          >
                            {child.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </aside>

        <article
          ref={articleRef}
          className="relative min-h-[680px] rounded-default bg-white px-6 py-8 shadow-card ring-1 ring-border sm:px-10 lg:px-14"
        >
          <div className="mx-auto max-w-[760px]">
            <div className="mb-10">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">{activePage.eyebrow}</p>
              <h3 className="mt-4 text-4xl font-black leading-[1.12] tracking-tight text-foreground">
                {activePage.title}
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-muted-foreground">
                <span>{activePage.updatedAt}</span>
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{activePage.readTime}</span>
              </div>
            </div>

            <p className="text-xl font-semibold leading-[1.85] text-foreground">{activePage.lead}</p>

            <div className="mt-10 space-y-9">
              {activePage.sections.map((section) => (
                <section key={section.id}>
                  <h4 className="text-2xl font-black leading-tight text-foreground">{section.title}</h4>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </div>

            <footer className="mt-12 rounded-default bg-neos-accentSoft p-5">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <UsersRound className="size-5" aria-hidden="true" />
                <p className="text-sm font-black">Кто прочитал</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex -space-x-3">
                  {activePage.readers.map((reader) => (
                    <div
                      key={reader.id}
                      title={reader.name}
                      className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-black text-primary shadow-card ring-2 ring-neos-accentSoft"
                    >
                      {reader.initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {activePage.readers.length} сотрудников уже изучили статью
                </p>
              </div>
            </footer>
          </div>
        </article>
      </CardContent>

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
    </Card>
  );
}
