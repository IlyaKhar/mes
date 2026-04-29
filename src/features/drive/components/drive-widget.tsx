"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FileImage, FileText, FileType2, Link2, QrCode, Share2, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDriveStore } from "@/features/drive/store";
import { cn } from "@/lib/utils";

function getFileIcon(type: string) {
  if (type === "IMG") return FileImage;
  if (type === "DOC") return FileText;
  return FileType2;
}

function getFileTone(type: string) {
  if (type === "PDF") return "bg-neos-accentSoft text-primary shadow-[0_16px_32px_rgba(0,87,255,0.14)]";
  if (type === "DOC") return "bg-primary/15 text-primary shadow-[0_16px_32px_rgba(0,87,255,0.18)]";
  return "bg-primary/25 text-primary shadow-[0_16px_32px_rgba(0,87,255,0.22)]";
}

function MiniQrCode() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1,
    1, 0, 1, 0, 0, 1, 1, 0, 1,
    1, 1, 1, 1, 0, 1, 1, 1, 1,
    0, 0, 1, 0, 1, 0, 0, 1, 0,
    1, 0, 0, 1, 1, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 0, 1, 1, 0,
    1, 1, 1, 0, 0, 1, 1, 1, 1,
    1, 0, 1, 1, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 1, 1, 1, 1
  ];

  return (
    <div className="grid size-44 grid-cols-9 gap-1 rounded-default bg-white p-4 shadow-card">
      {cells.map((isFilled, index) => (
        <span
          key={`${isFilled}-${index}`}
          className={cn("rounded-[4px]", isFilled ? "bg-primary" : "bg-neos-accentSoft")}
        />
      ))}
    </div>
  );
}

export function DriveWidget() {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const { activeFileId, files, setActiveFileId } = useDriveStore();
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];

  return (
    <Card id="drive" className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>CloudSpace</CardTitle>
          <CardDescription>Файлы, версии, быстрый шаринг и drag-and-drop</CardDescription>
        </div>
        <Badge tone="blue">{files.length} файла</Badge>
      </CardHeader>

      <CardContent className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            className={cn(
              "rounded-default bg-neos-accentSoft p-8 text-center transition-all duration-300",
              isDragActive
                ? "scale-[1.01] shadow-[0_0_42px_rgba(0,87,255,0.42)] ring-2 ring-primary"
                : "shadow-card ring-1 ring-border"
            )}
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-default bg-white text-primary shadow-card">
              <UploadCloud className="size-9" aria-hidden="true" />
            </div>
            <p className="mt-4 text-lg font-black">
              {isDragActive ? "Отпускай, файл уже почти в облаке" : "Перетащите файлы сюда"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              PDF, DOC и изображения автоматически попадут в общий CloudSpace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);

              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "rounded-default bg-white p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    activeFile.id === file.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("mb-5 flex size-14 items-center justify-center rounded-default", getFileTone(file.type))}>
                    <Icon className="size-7" aria-hidden="true" />
                  </div>
                  <p className="truncate text-sm font-black">{file.name}</p>
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    {file.type} · {file.size}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-black text-primary">{file.owner}</span>
                    <span className="text-xs font-bold text-muted-foreground">{file.updatedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-default bg-neos-accentSoft p-4">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">История версий</p>
              <h3 className="mt-2 text-lg font-black">{activeFile.name}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {activeFile.type} · {activeFile.size}
              </p>
            </div>
            <Dialog.Root open={isShareOpen} onOpenChange={setIsShareOpen}>
              <Dialog.Trigger asChild>
                <Button size="sm" className="gap-2">
                  <Share2 className="size-4" aria-hidden="true" />
                  Поделиться
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-white/72 backdrop-blur-xl" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-default bg-white p-6 shadow-float ring-1 ring-border">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-2xl font-black">Поделиться файлом</Dialog.Title>
                      <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                        QR-код и ссылка для быстрого доступа к выбранному файлу.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close asChild>
                      <Button type="button" variant="soft" size="icon" aria-label="Закрыть окно">
                        <X className="size-5" aria-hidden="true" />
                      </Button>
                    </Dialog.Close>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-[176px_1fr] sm:items-center">
                    <MiniQrCode />
                    <div>
                      <Badge tone="blue">{activeFile.type}</Badge>
                      <p className="mt-3 text-lg font-black">{activeFile.name}</p>
                      <div className="mt-4 flex items-center gap-2 rounded-default bg-neos-accentSoft p-3">
                        <Link2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                        <p className="min-w-0 truncate text-sm font-bold text-muted-foreground">
                          {activeFile.shareUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className="space-y-3">
            {activeFile.versions.map((version, index) => (
              <article key={version.id} className="relative rounded-default bg-white p-4 shadow-card">
                <div className="absolute -left-1 top-5 size-3 rounded-full bg-primary shadow-[0_0_14px_rgba(0,87,255,0.7)]" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">{version.author}</p>
                  <Badge tone={index === 0 ? "blue" : "cyan"}>{index === 0 ? "Текущая" : `v${activeFile.versions.length - index}`}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{version.action}</p>
                <p className="mt-3 text-xs font-black text-primary">{version.time}</p>
              </article>
            ))}
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}
