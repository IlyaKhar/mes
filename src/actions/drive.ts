"use server";

import type { FileKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeFromSupabaseStorage, uploadToSupabaseStorage } from "@/lib/storage/supabase-storage";

function getFileKind(file: File): FileKind {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (
    file.type.includes("word") ||
    file.name.toLowerCase().endsWith(".doc") ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    return "DOC";
  }
  if (file.type.startsWith("image/")) return "IMAGE";

  return "OTHER";
}

export async function createFileAction(input: {
  name: string;
  kind: FileKind;
  mimeType: string;
  size: number;
  url: string;
  previewUrl?: string;
  parentId?: string;
}) {
  const user = await requireSession();
  if (!input.name.trim()) throw new Error("Название файла обязательно");

  const file = await db.file.create({
    data: {
      name: input.name.trim(),
      kind: input.kind,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url,
      previewUrl: input.previewUrl,
      parentId: input.parentId || undefined,
      ownerId: user.id,
      versions: {
        create: {
          authorId: user.id,
          note: "Файл создан",
          version: 1
        }
      }
    }
  });

  revalidatePath("/");
  return file;
}

export async function createFileShareLinkAction(fileId: string) {
  const user = await requireSession();
  await db.file.findFirstOrThrow({
    where: {
      id: fileId,
      OR: [{ ownerId: user.id }, ...(user.role === "ADMIN" ? [{}] : [])]
    },
    select: { id: true }
  });

  const file = await db.file.update({
    where: { id: fileId },
    data: {
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/drive/${fileId}`
    }
  });

  revalidatePath("/");
  return file;
}

export async function uploadFile(formData: FormData) {
  const user = await requireSession();
  const file = formData.get("file");
  const parentId = formData.get("parentId");

  if (!(file instanceof File)) {
    throw new Error("Файл не найден");
  }

  const storagePath = `drive/${user.id}/${Date.now()}-${file.name.replace(/[^\wа-яА-ЯёЁ.\- ]+/g, "_")}`;
  await uploadToSupabaseStorage({
    path: storagePath,
    body: await file.arrayBuffer(),
    contentType: file.type || "application/octet-stream"
  });

  const driveFile = await db.file.create({
    data: {
      name: file.name,
      kind: getFileKind(file),
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: storagePath,
      ownerId: user.id,
      parentId: typeof parentId === "string" && parentId.length > 0 ? parentId : undefined,
      versions: {
        create: {
          authorId: user.id,
          note: "Файл загружен в Supabase Storage",
          version: 1
        }
      }
    },
    include: {
      versions: true
    }
  });

  revalidatePath("/");
  return driveFile;
}

export async function addFileVersionAction(input: {
  fileId: string;
  note: string;
}) {
  const user = await requireSession();
  const file = await db.file.findFirstOrThrow({
    where: {
      id: input.fileId,
      OR: [{ ownerId: user.id }, ...(user.role === "ADMIN" ? [{}] : [])]
    },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });
  const latestVersion = file.versions[0]?.version ?? 0;

  const version = await db.fileVersion.create({
    data: {
      fileId: input.fileId,
      authorId: user.id,
      note: input.note.trim() || "Версия обновлена",
      version: latestVersion + 1
    }
  });

  await db.file.update({
    where: { id: input.fileId },
    data: { updatedAt: new Date() }
  });

  revalidatePath("/");
  return version;
}

export async function deleteFileAction(fileId: string) {
  const user = await requireSession();
  const file = await db.file.findUniqueOrThrow({
    where: { id: fileId },
    select: { ownerId: true, url: true }
  });

  if (file.ownerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить файл может владелец или администратор");
  }

  await db.file.delete({
    where: { id: fileId }
  });
  await removeFromSupabaseStorage(file.url);

  revalidatePath("/");
}
