import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

async function main() {
  await prisma.actionLog.deleteMany();
  await prisma.wikiHistory.deleteMany();
  await prisma.wikiPageRead.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.fileVersion.deleteMany();
  await prisma.file.deleteMany();
  await prisma.task.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Neos12345!", 10);

  const [admin, anna, ilya, maria, oleg] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Администратор NEOS",
        email: "admin@neos.local",
        passwordHash,
        role: "ADMIN",
        department: "IT",
        avatarUrl: "/avatars/admin.png",
        shiftPattern: "FIVE_TWO"
      }
    }),
    prisma.user.create({
      data: {
        name: "Анна Орлова",
        email: "anna@neos.local",
        passwordHash,
        role: "USER",
        department: "OPERATIONS",
        avatarUrl: "/avatars/anna.png",
        shiftPattern: "FIVE_TWO"
      }
    }),
    prisma.user.create({
      data: {
        name: "Илья Ким",
        email: "ilya@neos.local",
        passwordHash,
        role: "USER",
        department: "IT",
        avatarUrl: "/avatars/ilya.png",
        shiftPattern: "TWO_TWO",
        shiftStartedAt: new Date("2026-01-01T00:00:00.000Z")
      }
    }),
    prisma.user.create({
      data: {
        name: "Мария Соколова",
        email: "maria@neos.local",
        passwordHash,
        role: "USER",
        department: "HR",
        avatarUrl: "/avatars/maria.png",
        shiftPattern: "FIVE_TWO"
      }
    }),
    prisma.user.create({
      data: {
        name: "Олег Грин",
        email: "oleg@neos.local",
        passwordHash,
        role: "USER",
        department: "PROCUREMENT",
        avatarUrl: "/avatars/oleg.png",
        shiftPattern: "TWO_TWO",
        shiftStartedAt: new Date("2026-01-02T00:00:00.000Z")
      }
    })
  ]);

  const chat = await prisma.chat.create({
    data: {
      title: "Инцидентная комната",
      description: "Биллинг, SLA и релизное окно",
      aiSummary: "Закрыть доступы до 14:00 и не выпускать релиз без подтверждения интеграции.",
      creatorId: admin.id,
      participants: {
        create: [
          { userId: admin.id },
          { userId: anna.id },
          { userId: ilya.id },
          { userId: maria.id }
        ]
      },
      messages: {
        create: [
          {
            body: "Команда поддержки подтвердила окно внедрения.",
            userId: maria.id
          },
          {
            body: "Беру доступы на себя. До 13:30 дам подтверждение.",
            userId: anna.id
          }
        ]
      }
    }
  });

  const parentMessage = await prisma.message.create({
    data: {
      chatId: chat.id,
      userId: ilya.id,
      body: "Нужен финальный ответ по SLA до 14:00.",
      kind: "VOICE",
      transcript: "Нужен финальный ответ по SLA до 14:00. Если владелец не подтвердит доступы, релиз лучше удержать."
    }
  });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      userId: anna.id,
      parentId: parentMessage.id,
      body: "Согласна, без доступа к ролям не выпускаем."
    }
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: "Проверить доступы к биллингу",
      description: "Перед релизом нужно сверить роли и подтвердить владельца.",
      priority: "CRITICAL",
      department: "IT",
      slaDueAt: addHours(1),
      creatorId: anna.id,
      supportAgentId: ilya.id
    }
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Сверить роли доступа",
        description: "Проверить роли биллинга перед релизным окном.",
        status: "TODO",
        priority: "HIGH",
        creatorId: admin.id,
        assigneeId: anna.id,
        ticketId: ticket.id,
        dueAt: addHours(6)
      },
      {
        title: "Подготовить релиз биллинга",
        description: "Собрать финальный чеклист и подтвердить зависимости.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        creatorId: admin.id,
        assigneeId: ilya.id,
        dueAt: addHours(8)
      },
      {
        title: "Обновить карту эскалаций",
        description: "Добавить новые маршруты для IT и снабжения.",
        status: "DONE",
        priority: "MEDIUM",
        creatorId: anna.id,
        assigneeId: maria.id
      }
    ]
  });

  const event = await prisma.event.create({
    data: {
      title: "Синк по биллингу",
      description: "Проверка готовности релиза и SLA-рисков.",
      startsAt: addHours(2),
      endsAt: addHours(3),
      mode: "OFFICE",
      creatorId: admin.id,
      participants: {
        create: [{ userId: anna.id }, { userId: ilya.id }, { userId: maria.id }]
      }
    }
  });

  const file = await prisma.file.create({
    data: {
      name: "Регламент SLA.pdf",
      kind: "PDF",
      mimeType: "application/pdf",
      size: 2457600,
      url: "https://example.com/neos/reglament-sla.pdf",
      ownerId: maria.id,
      versions: {
        create: {
          authorId: maria.id,
          version: 1,
          note: "Первичная загрузка регламента"
        }
      }
    }
  });

  const wiki = await prisma.wikiPage.create({
    data: {
      title: "SLA и эскалации",
      slug: "sla-escalations",
      content:
        "Критичная заявка получает владельца сразу. Если до дедлайна осталось меньше 25% времени, запускается ранняя эскалация.",
      status: "PUBLISHED",
      authorId: admin.id,
      reads: {
        create: [{ userId: anna.id }, { userId: ilya.id }, { userId: maria.id }]
      },
      histories: {
        create: {
          authorId: admin.id,
          diff: {
            created: true,
            title: "SLA и эскалации"
          }
        }
      }
    }
  });

  await prisma.actionLog.createMany({
    data: [
      {
        actorId: admin.id,
        type: "CREATE",
        entity: "Event",
        entityId: event.id,
        metadata: { title: event.title }
      },
      {
        actorId: maria.id,
        type: "CREATE",
        entity: "File",
        entityId: file.id,
        metadata: { name: file.name }
      },
      {
        actorId: admin.id,
        type: "CREATE",
        entity: "WikiPage",
        entityId: wiki.id,
        metadata: { title: wiki.title }
      }
    ]
  });

  console.log("NEOS seed completed");
  console.log("Admin: admin@neos.local / Neos12345!");
  console.log("User: anna@neos.local / Neos12345!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
