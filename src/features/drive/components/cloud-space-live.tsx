"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { FileKind } from "@prisma/client";
import { Download, FileImage, FileText, FileType2, Link2, QrCode, Share2, Trash2, UploadCloud, X } from "lucide-react";
import {
  addFileVersionAction,
  createFileShareLinkAction,
  deleteFileAction,
  uploadFile
} from "@/actions/drive";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DriveUser = {
  id: string;
  name: string;
  email: string;
};

type DriveFile = {
  id: string;
  name: string;
  kind: FileKind;
  mimeType: string;
  size: number;
  url: string;
  previewUrl: string | null;
  shareUrl: string | null;
  ownerId: string;
  updatedAt: string;
  owner: DriveUser;
  versions: Array<{
    id: string;
    note: string;
    version: number;
    createdAt: string;
    author: DriveUser;
  }>;
};

function getFileIcon(kind: FileKind) {
  if (kind === "IMAGE") return FileImage;
  if (kind === "DOC") return FileText;
  return FileType2;
}

function getFileTone(kind: FileKind) {
  if (kind === "PDF") return "bg-neos-accentSoft text-primary shadow-[0_16px_32px_rgba(26,61,99,0.14)]";
  if (kind === "DOC") return "bg-primary/15 text-primary shadow-[0_16px_32px_rgba(26,61,99,0.18)]";
  if (kind === "IMAGE") return "bg-primary/25 text-primary shadow-[0_16px_32px_rgba(26,61,99,0.22)]";
  return "bg-cyan-50 text-neos-cyan shadow-[0_16px_32px_rgba(26,61,99,0.12)]";
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(size / 1024))} КБ`;
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
        <span key={`${isFilled}-${index}`} className={cn("rounded-[4px]", isFilled ? "bg-primary" : "bg-neos-accentSoft")} />
      ))}
    </div>
  );
}

export function CloudSpaceLive({
  files,
  currentUserId,
  isAdmin
}: {
  files: DriveFile[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [activeFileId, setActiveFileId] = React.useState(files[0]?.id ?? "");
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [versionNote, setVersionNote] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];

  function createDbFile(file: File) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const driveFile = await uploadFile(formData);
      setActiveFileId(driveFile.id);
      window.location.reload();
    });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) createDbFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) createDbFile(file);
  }

  function createShareLink() {
    if (!activeFile) return;

    startTransition(async () => {
      await createFileShareLinkAction(activeFile.id);
      window.location.reload();
    });
  }

  function addVersion() {
    if (!activeFile) return;

    startTransition(async () => {
      await addFileVersionAction({
        fileId: activeFile.id,
        note: versionNote
      });
      setVersionNote("");
      window.location.reload();
    });
  }

  function deleteFile() {
    if (!activeFile) return;
    if (!window.confirm("Удалить файл и всю историю версий?")) return;

    startTransition(async () => {
      await deleteFileAction(activeFile.id);
      window.location.reload();
    });
  }

  function downloadFile() {
    if (!activeFile) return;
    window.location.href = `/api/drive/files/${activeFile.id}/download`;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-default bg-neos-accentSoft p-4">
        <p className="text-sm font-black text-primary">Как работает Диск без S3?</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Сейчас это файловый каталог на PostgreSQL: мы сохраняем имя, тип, размер, владельца, ссылку, share-url и версии.
          Сам бинарный файл в облако не отправляется, поэтому S3 и ключи не нужны.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
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
            onDrop={handleDrop}
            className={cn(
              "rounded-default bg-neos-accentSoft p-8 text-center transition-all duration-300",
              isDragActive
                ? "scale-[1.01] shadow-[0_0_42px_rgba(26,61,99,0.42)] ring-2 ring-primary"
                : "shadow-card ring-1 ring-border"
            )}
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-default bg-white text-primary shadow-card">
              <UploadCloud className="size-9" aria-hidden="true" />
            </div>
            <p className="mt-4 text-lg font-black">{isDragActive ? "Отпускай, добавим запись в базу" : "Перетащи файл сюда"}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              PDF, DOC, изображения и любые файлы попадут на Диск как записи PostgreSQL.
            </p>
            <label className="mt-5 inline-flex">
              <input type="file" className="sr-only" onChange={handleInputChange} disabled={isPending} />
              <span className="inline-flex h-11 cursor-pointer items-center rounded-default bg-primary px-5 text-sm font-black text-white shadow-card transition active:scale-[0.97]">
                Выбрать файл
              </span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {files.map((file) => {
              const Icon = getFileIcon(file.kind);

              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "rounded-default bg-white p-4 text-left shadow-card transition hover:-translate-y-1 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    activeFile?.id === file.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("mb-5 flex size-14 items-center justify-center rounded-default", getFileTone(file.kind))}>
                    <Icon className="size-7" aria-hidden="true" />
                  </div>
                  <p className="truncate text-sm font-black">{file.name}</p>
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    {file.kind} · {formatSize(file.size)}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-black text-primary">{file.owner.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {new Date(file.updatedAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-default bg-neos-accentSoft p-4">
          {activeFile ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">История версий</p>
                  <h3 className="mt-2 text-lg font-black">{activeFile.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {activeFile.kind} · {formatSize(activeFile.size)}
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
                          <Dialog.Title className="text-2xl font-semibold text-foreground">Поделиться файлом</Dialog.Title>
                          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                            Генерируем share-url в базе и показываем QR-заглушку для быстрого доступа.
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
                          <Badge tone="blue">{activeFile.kind}</Badge>
                          <p className="mt-3 text-lg font-black">{activeFile.name}</p>
                          <div className="mt-4 flex items-center gap-2 rounded-default bg-neos-accentSoft p-3">
                            <Link2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                            <p className="min-w-0 truncate text-sm font-bold text-muted-foreground">
                              {activeFile.shareUrl ?? "Ссылка ещё не создана"}
                            </p>
                          </div>
                          <Button type="button" className="mt-4 gap-2" onClick={createShareLink} disabled={isPending}>
                            <QrCode className="size-4" aria-hidden="true" />
                            Создать ссылку
                          </Button>
                        </div>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>

              <Button type="button" className="mb-4 w-full gap-2" onClick={downloadFile}>
                <Download className="size-4" aria-hidden="true" />
                Скачать файл
              </Button>

              <div className="mb-4 grid gap-2 rounded-default bg-white p-3 shadow-card">
                <input
                  value={versionNote}
                  onChange={(event) => setVersionNote(event.target.value)}
                  placeholder="Комментарий к новой версии"
                  className="h-11 rounded-default bg-neos-accentSoft px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="button" variant="soft" onClick={addVersion} disabled={isPending}>
                  Добавить версию
                </Button>
              </div>

              <div className="space-y-3">
                {activeFile.versions.map((version, index) => (
                  <article key={version.id} className="relative rounded-default bg-white p-4 shadow-card">
                    <div className="absolute -left-1 top-5 size-3 rounded-full bg-primary shadow-[0_0_14px_rgba(26,61,99,0.7)]" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black">{version.author.name}</p>
                      <Badge tone={index === 0 ? "blue" : "cyan"}>{index === 0 ? "Текущая" : `v${version.version}`}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{version.note}</p>
                    <p className="mt-3 text-xs font-black text-primary">
                      {new Date(version.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </article>
                ))}
              </div>

              {(isAdmin || activeFile.ownerId === currentUserId) ? (
                <Button type="button" variant="ghost" className="mt-4 w-full gap-2" onClick={deleteFile}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Удалить файл
                </Button>
              ) : null}
            </>
          ) : (
            <div className="rounded-default bg-white p-4 text-sm font-bold text-muted-foreground shadow-card">
              Добавь первый файл, и тут появится история версий.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
