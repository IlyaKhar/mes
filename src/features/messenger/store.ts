import { create } from "zustand";

type Chat = {
  id: string;
  title: string;
  description: string;
  unreadCount: number;
  lastMessageAt: string;
  status: "Онлайн" | "Фокус" | "Ожидание";
};

type Message = {
  id: string;
  author: string;
  role: "me" | "teammate" | "ai";
  text?: string;
  transcript?: string;
  kind: "text" | "voice" | "system";
  chatId: string;
  time: string;
  threadCount: number;
  waveform?: number[];
};

type ThreadReply = {
  id: string;
  author: string;
  text: string;
  time: string;
};

type MessengerState = {
  activeChatId: string;
  activeThreadMessageId: string | null;
  chats: Chat[];
  messages: Message[];
  threadReplies: Record<string, ThreadReply[]>;
  summaries: Record<string, string>;
  setActiveChatId: (chatId: string) => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;
};

export const useMessengerStore = create<MessengerState>((set) => ({
  activeChatId: "incident-room",
  activeThreadMessageId: null,
  chats: [
    {
      id: "incident-room",
      title: "Инцидентная комната",
      description: "Биллинг, SLA, релиз",
      unreadCount: 4,
      lastMessageAt: "10:42",
      status: "Онлайн"
    },
    {
      id: "product-core",
      title: "Продуктовая команда",
      description: "Роадмап Q2",
      unreadCount: 1,
      lastMessageAt: "09:58",
      status: "Фокус"
    },
    {
      id: "support-line",
      title: "Линия поддержки",
      description: "Дежурство и эскалации",
      unreadCount: 0,
      lastMessageAt: "Вчера",
      status: "Ожидание"
    }
  ],
  summaries: {
    "incident-room":
      "Главный фокус: закрыть две SLA-заявки до 14:00, подтвердить роли доступа и не двигать релиз биллинга без проверки интеграции.",
    "product-core":
      "Команда согласует приоритеты Q2: сначала стабильность ядра, потом новые виджеты аналитики.",
    "support-line":
      "Дежурная смена держит очередь под контролем, критичных блокеров нет."
  },
  messages: [
    {
      id: "msg-1",
      author: "Мария",
      role: "teammate",
      kind: "text",
      chatId: "incident-room",
      text: "Команда поддержки подтвердила окно внедрения.",
      time: "09:42",
      threadCount: 2
    },
    {
      id: "msg-2",
      author: "Илья",
      role: "teammate",
      kind: "voice",
      chatId: "incident-room",
      time: "10:18",
      threadCount: 4,
      waveform: [28, 46, 34, 62, 74, 44, 58, 82, 52, 36, 68, 76, 40, 54, 32, 48],
      transcript:
        "Нужен финальный ответ по SLA до 14:00. Если владелец заявки не подтвердит доступы, релиз биллинга лучше удержать до вечернего окна."
    },
    {
      id: "msg-3",
      author: "OKES",
      role: "ai",
      kind: "system",
      chatId: "incident-room",
      text: "Сформирована короткая сводка для руководителя.",
      time: "10:21",
      threadCount: 1
    },
    {
      id: "msg-4",
      author: "Анна",
      role: "me",
      kind: "text",
      chatId: "incident-room",
      text: "Беру доступы на себя. До 13:30 дам подтверждение в этом треде.",
      time: "10:28",
      threadCount: 0
    },
    {
      id: "msg-5",
      author: "Павел",
      role: "teammate",
      kind: "text",
      chatId: "product-core",
      text: "Предлагаю вынести аналитику после стабилизации ядра.",
      time: "09:58",
      threadCount: 3
    },
    {
      id: "msg-6",
      author: "Смена 2",
      role: "teammate",
      kind: "text",
      chatId: "support-line",
      text: "Очередь чистая, мониторинг без красных событий.",
      time: "Вчера",
      threadCount: 0
    }
  ],
  threadReplies: {
    "msg-1": [
      {
        id: "reply-1",
        author: "Олег",
        text: "Окно подтверждено, но нужен владелец со стороны биллинга.",
        time: "09:48"
      },
      {
        id: "reply-2",
        author: "Мария",
        text: "Владельца добавила, ждем финальный чек.",
        time: "09:53"
      }
    ],
    "msg-2": [
      {
        id: "reply-3",
        author: "Анна",
        text: "Согласна, без доступа к ролям не выпускаем.",
        time: "10:20"
      },
      {
        id: "reply-4",
        author: "Илья",
        text: "Тогда ставлю дедлайн 13:30 и эскалацию на 13:45.",
        time: "10:24"
      }
    ],
    "msg-3": [
      {
        id: "reply-5",
        author: "OKES",
        text: "Сводка обновится после следующего сообщения с решением.",
        time: "10:22"
      }
    ],
    "msg-5": [
      {
        id: "reply-6",
        author: "Елена",
        text: "Поддерживаю. Это снизит риск регрессий на демо.",
        time: "10:01"
      }
    ]
  },
  setActiveChatId: (chatId) =>
    set({
      activeChatId: chatId,
      activeThreadMessageId: null
    }),
  openThread: (messageId) => set({ activeThreadMessageId: messageId }),
  closeThread: () => set({ activeThreadMessageId: null })
}));
