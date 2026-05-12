import { create } from "zustand";

type WikiNode = {
  id: string;
  title: string;
  pageId?: string;
  children?: WikiNode[];
};

type WikiReader = {
  id: string;
  name: string;
  initials: string;
};

type WikiPage = {
  id: string;
  title: string;
  eyebrow: string;
  updatedAt: string;
  readTime: string;
  lead: string;
  sections: Array<{
    id: string;
    title: string;
    body: string;
  }>;
  readers: WikiReader[];
};

type WikiState = {
  activePageId: string;
  expandedNodeIds: string[];
  pages: WikiPage[];
  tree: WikiNode[];
  setActivePageId: (pageId: string) => void;
  toggleNode: (nodeId: string) => void;
};

export const useWikiStore = create<WikiState>((set) => ({
  activePageId: "sla-escalations",
  expandedNodeIds: ["wiki-1", "wiki-2"],
  pages: [
    {
      id: "sla-escalations",
      title: "SLA и эскалации",
      eyebrow: "Операционные процессы",
      updatedAt: "обновлено сегодня в 10:40",
      readTime: "6 минут чтения",
      lead:
        "Эта статья фиксирует единый порядок реакции на заявки, где сроки критичны для бизнеса. Главный принцип: владелец SLA назначается сразу, а эскалация запускается до наступления дедлайна.",
      sections: [
        {
          id: "section-1",
          title: "Когда заявка считается критичной",
          body:
            "Критичной считается заявка, которая блокирует продажи, биллинг, производственную смену или доступ сотрудников к ключевым системам. Для таких заявок команда поддержки обязана подтвердить владельца в течение первых 15 минут."
        },
        {
          id: "section-2",
          title: "Правило ранней эскалации",
          body:
            "Если до дедлайна осталось меньше 25% времени, заявка переводится в режим наблюдения. Руководитель направления получает короткий контекст, текущий риск и следующий конкретный шаг."
        },
        {
          id: "section-3",
          title: "Фиксация решения",
          body:
            "После решения ответственный добавляет комментарий с причиной, результатом и ссылкой на связанную задачу. Это снижает повторные обращения и помогает базе знаний оставаться живой."
        }
      ],
      readers: [
        { id: "reader-1", name: "Анна Орлова", initials: "АО" },
        { id: "reader-2", name: "Илья Ким", initials: "ИК" },
        { id: "reader-3", name: "Мария Соколова", initials: "МС" },
        { id: "reader-4", name: "Олег Грин", initials: "ОГ" },
        { id: "reader-5", name: "Елена Павлова", initials: "ЕП" }
      ]
    },
    {
      id: "release-policy",
      title: "Регламент релизов",
      eyebrow: "Операционные процессы",
      updatedAt: "обновлено вчера в 18:10",
      readTime: "4 минуты чтения",
      lead:
        "Регламент описывает безопасный путь изменений от подготовки до подтверждения после релиза.",
      sections: [
        {
          id: "section-1",
          title: "Релизное окно",
          body:
            "Каждый релиз получает владельца, чеклист и окно обратного отката. Без подтвержденного владельца релиз не стартует."
        },
        {
          id: "section-2",
          title: "Коммуникация",
          body:
            "Команда заранее публикует краткое описание изменений, список рисков и канал для быстрых вопросов."
        }
      ],
      readers: [
        { id: "reader-1", name: "Анна Орлова", initials: "АО" },
        { id: "reader-6", name: "Павел Нестеров", initials: "ПН" }
      ]
    },
    {
      id: "integrations",
      title: "Интеграции",
      eyebrow: "Техническая база",
      updatedAt: "обновлено 22 апреля",
      readTime: "8 минут чтения",
      lead:
        "Каталог интеграций показывает, какие сервисы связаны с OKEI и кто отвечает за стабильность обмена данными.",
      sections: [
        {
          id: "section-1",
          title: "Критичные потоки",
          body:
            "Биллинг, учет заявок и корпоративный справочник считаются критичными потоками. Для них включается расширенный мониторинг."
        }
      ],
      readers: [
        { id: "reader-2", name: "Илья Ким", initials: "ИК" },
        { id: "reader-7", name: "Денис Волков", initials: "ДВ" }
      ]
    }
  ],
  tree: [
    {
      id: "wiki-1",
      title: "Операционные процессы",
      children: [
        { id: "wiki-1-1", title: "SLA и эскалации", pageId: "sla-escalations" },
        { id: "wiki-1-2", title: "Регламент релизов", pageId: "release-policy" }
      ]
    },
    {
      id: "wiki-2",
      title: "Техническая база",
      children: [
        { id: "wiki-2-1", title: "Интеграции", pageId: "integrations" },
        { id: "wiki-2-2", title: "Доступы и роли", pageId: "sla-escalations" }
      ]
    }
  ],
  setActivePageId: (pageId) => set({ activePageId: pageId }),
  toggleNode: (nodeId) =>
    set((state) => ({
      expandedNodeIds: state.expandedNodeIds.includes(nodeId)
        ? state.expandedNodeIds.filter((id) => id !== nodeId)
        : [...state.expandedNodeIds, nodeId]
    }))
}));
