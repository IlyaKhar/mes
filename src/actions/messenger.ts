"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPusherServer } from "@/lib/realtime/pusher-server";

async function assertChatParticipant(chatId: string, userId: string) {
  const participant = await db.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId
      }
    },
    select: { id: true }
  });

  if (!participant) {
    throw new Error("Вы не участник этого чата");
  }
}

export async function sendMessage(input: {
  chatId: string;
  body: string;
  parentId?: string;
  kind?: "TEXT" | "VOICE" | "FILE" | "SYSTEM";
  transcript?: string;
}) {
  const user = await requireSession();
  await assertChatParticipant(input.chatId, user.id);

  const message = await db.message.create({
    data: {
      userId: user.id,
      chatId: input.chatId,
      parentId: input.parentId,
      body: input.body,
      kind: input.kind ?? "TEXT",
      transcript: input.transcript
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  try {
    await getPusherServer()?.trigger(`chat-${input.chatId}`, "message:new", {
      id: message.id,
      body: message.body,
      kind: message.kind,
      chatId: message.chatId,
      userId: message.userId,
      parentId: message.parentId,
      createdAt: message.createdAt.toISOString(),
      user: message.user
    });
  } catch (error) {
    console.warn("Pusher trigger skipped:", error);
  }

  revalidatePath("/");
  return message;
}

export const sendMessageAction = sendMessage;

export async function createChatAction(input: {
  title: string;
  description?: string;
  aiSummary?: string;
  participantIds?: string[];
}) {
  const user = await requireSession();
  const participantIds = Array.from(new Set([user.id, ...(input.participantIds ?? [])]));

  const chat = await db.chat.create({
    data: {
      title: input.title,
      description: input.description,
      aiSummary: input.aiSummary,
      creatorId: user.id,
      isPrivate: participantIds.length <= 2,
      participants: {
        create: participantIds.map((userId) => ({ userId }))
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }
    }
  });

  revalidatePath("/");
  return chat;
}

export async function searchMessengerUsersAction(query: string) {
  const currentUser = await requireSession();
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return [];

  return db.user.findMany({
    where: {
      id: { not: currentUser.id },
      isBanned: false,
      OR: [
        { id: normalizedQuery },
        { email: { contains: normalizedQuery, mode: "insensitive" } },
        { name: { contains: normalizedQuery, mode: "insensitive" } }
      ]
    },
    take: 8,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      department: true
    }
  });
}

export async function createDirectChatAction(participantId: string) {
  const user = await requireSession();
  if (participantId === user.id) throw new Error("Нельзя создать чат с самим собой");

  const participant = await db.user.findFirstOrThrow({
    where: {
      id: participantId,
      isBanned: false
    },
    select: {
      id: true,
      name: true
    }
  });

  const existingChat = await db.chat.findFirst({
    where: {
      isPrivate: true,
      participants: {
        every: {
          userId: {
            in: [user.id, participant.id]
          }
        }
      },
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: participant.id } } }
      ]
    },
    include: {
      participants: true
    }
  });

  if (existingChat?.participants.length === 2) {
    revalidatePath("/");
    return existingChat;
  }

  return createChatAction({
    title: participant.name,
    description: "Личный диалог",
    participantIds: [participant.id]
  });
}

export async function createGroupChatAction(input: {
  title: string;
  participantIds: string[];
}) {
  if (!input.title.trim()) throw new Error("Укажите название группы");
  if (input.participantIds.length === 0) throw new Error("Добавьте хотя бы одного участника");

  return createChatAction({
    title: input.title.trim(),
    description: "Групповой чат",
    participantIds: input.participantIds
  });
}

export async function addChatParticipantsAction(input: {
  chatId: string;
  participantIds: string[];
}) {
  const user = await requireSession();
  await assertChatParticipant(input.chatId, user.id);

  await db.chatParticipant.createMany({
    data: input.participantIds.map((userId) => ({
      chatId: input.chatId,
      userId
    })),
    skipDuplicates: true
  });

  revalidatePath("/");
}

export async function deleteChatAction(chatId: string) {
  const user = await requireSession();
  const chat = await db.chat.findFirstOrThrow({
    where: {
      id: chatId,
      participants: {
        some: {
          userId: user.id
        }
      }
    },
    select: {
      id: true,
      creatorId: true
    }
  });

  if (chat.creatorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Удалить чат может только создатель или администратор");
  }

  await db.chat.delete({
    where: { id: chatId }
  });

  revalidatePath("/");
}

export async function deleteMessageAction(messageId: string) {
  const user = await requireSession();
  const message = await db.message.findFirstOrThrow({
    where: {
      id: messageId,
      chat: {
        participants: {
          some: {
            userId: user.id
          }
        }
      }
    },
    select: {
      id: true,
      userId: true,
      chat: {
        select: {
          creatorId: true
        }
      }
    }
  });

  const canDelete =
    message.userId === user.id ||
    message.chat.creatorId === user.id ||
    user.role === "ADMIN";

  if (!canDelete) {
    throw new Error("Удалить сообщение может автор, создатель чата или администратор");
  }

  await db.message.delete({
    where: { id: messageId }
  });

  revalidatePath("/");
}
