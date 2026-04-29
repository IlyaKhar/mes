"use server";

import type { WikiPageStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

function getSlugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    || `page-${Date.now()}`;
}

function getLineDiff(previousContent: string, nextContent: string) {
  const previousLines = previousContent.split("\n");
  const nextLines = nextContent.split("\n");
  const previousSet = new Set(previousLines);
  const nextSet = new Set(nextLines);

  return {
    added: nextLines.filter((line) => !previousSet.has(line)),
    removed: previousLines.filter((line) => !nextSet.has(line)),
    changedLength: nextContent.length - previousContent.length
  };
}

export async function createWikiPageAction(input: {
  title: string;
  slug?: string;
  content: string;
  parentId?: string;
  status?: WikiPageStatus;
}) {
  const user = await requireSession();
  if (!input.title.trim()) throw new Error("Название статьи обязательно");
  if (!input.content.trim()) throw new Error("Контент статьи обязателен");
  const slugBase = input.slug?.trim() || getSlugFromTitle(input.title);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const page = await db.wikiPage.create({
    data: {
      title: input.title.trim(),
      slug,
      content: input.content.trim(),
      parentId: input.parentId || undefined,
      status: input.status ?? "DRAFT",
      authorId: user.id
    }
  });

  revalidatePath("/");
  return page;
}

export async function markWikiPageReadAction(pageId: string) {
  const user = await requireSession();

  const read = await db.wikiPageRead.upsert({
    where: {
      pageId_userId: {
        pageId,
        userId: user.id
      }
    },
    create: {
      pageId,
      userId: user.id
    },
    update: {
      readAt: new Date()
    }
  });

  revalidatePath("/");
  return read;
}

export async function updateWikiPage(input: {
  pageId: string;
  title?: string;
  content: string;
  status?: WikiPageStatus;
}) {
  const user = await requireSession();
  const currentPage = await db.wikiPage.findUniqueOrThrow({
    where: { id: input.pageId },
    select: {
      authorId: true,
      title: true,
      content: true,
      status: true
    }
  });
  if (currentPage.authorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Редактировать статью может автор или администратор");
  }
  const nextTitle = input.title ?? currentPage.title;
  const nextStatus = input.status ?? currentPage.status;
  const diff = {
    title:
      currentPage.title === nextTitle
        ? null
        : {
            before: currentPage.title,
            after: nextTitle
          },
    status:
      currentPage.status === nextStatus
        ? null
        : {
            before: currentPage.status,
            after: nextStatus
          },
    content: getLineDiff(currentPage.content, input.content)
  };

  const page = await db.$transaction(async (tx) => {
    const updatedPage = await tx.wikiPage.update({
      where: { id: input.pageId },
      data: {
        title: nextTitle,
        content: input.content,
        status: nextStatus
      }
    });

    await tx.wikiHistory.create({
      data: {
        pageId: input.pageId,
        authorId: user.id,
        diff
      }
    });

    return updatedPage;
  });

  revalidatePath("/");
  return page;
}

export const updateWikiPageAction = updateWikiPage;

export async function deleteWikiPageAction(pageId: string) {
  const user = await requireSession();
  const page = await db.wikiPage.findUniqueOrThrow({
    where: { id: pageId },
    select: { authorId: true }
  });

  if (page.authorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить статью может автор или администратор");
  }

  await db.wikiPage.delete({
    where: { id: pageId }
  });

  revalidatePath("/");
}
