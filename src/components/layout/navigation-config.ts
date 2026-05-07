import {
  CalendarDays,
  CheckSquare,
  FolderOpen,
  HelpCircle,
  Home,
  MessageSquareText,
  ShieldCheck,
  Workflow
} from "lucide-react";

export const navigationItems = [
  {
    id: "dashboard",
    label: "Обзор",
    title: "Операционный центр NEOS",
    description: "Пульс компании, метрики и быстрый доступ ко всем модулям",
    href: "/",
    icon: Home
  },
  {
    id: "messenger",
    label: "Мессенджер",
    title: "Messenger",
    description: "Чаты, группы, участники и сообщения из базы",
    href: "/messenger",
    icon: MessageSquareText
  },
  {
    id: "helpdesk",
    label: "Поддержка",
    title: "Service Flow",
    description: "Заявки отдела, SLA, эскалации и агенты поддержки",
    href: "/helpdesk",
    icon: HelpCircle
  },
  {
    id: "tasks",
    label: "Задачи",
    title: "Task Orbit",
    description: "Задачи, исполнители, статусы, таймеры и связь с заявками",
    href: "/tasks",
    icon: CheckSquare
  },
  {
    id: "calendar",
    label: "Календарь",
    title: "SyncNode",
    description: "События, участники, смены и проверка пересечений",
    href: "/calendar",
    icon: CalendarDays
  },
  {
    id: "drive",
    label: "Диск",
    title: "CloudSpace",
    description: "Файлы, владельцы, версии, шаринг и скачивание",
    href: "/drive",
    icon: FolderOpen
  },
  {
    id: "wiki",
    label: "Вики",
    title: "WikiCore",
    description: "Справочник, статьи, авторы, прочтения и история изменений",
    href: "/wiki",
    icon: Workflow
  }
] as const;

export const adminNavigationItem = {
  id: "admin",
  label: "Админ",
  title: "Панель управления",
  description: "Пользователи, роли, отделы и журнал действий",
  href: "/admin",
  icon: ShieldCheck
} as const;

export type NavigationItemId = (typeof navigationItems)[number]["id"] | typeof adminNavigationItem.id;
