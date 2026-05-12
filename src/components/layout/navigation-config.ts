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
    title: "Операционный центр",
    description: "Метрики компании и быстрый доступ ко всем модулям",
    href: "/",
    icon: Home
  },
  {
    id: "messenger",
    label: "Мессенджер",
    title: "Мессенджер",
    description: "Чаты, группы и обсуждения команды",
    href: "/messenger",
    icon: MessageSquareText
  },
  {
    id: "helpdesk",
    label: "Поддержка",
    title: "Поддержка",
    description: "Заявки с дедлайнами и эскалацией",
    href: "/helpdesk",
    icon: HelpCircle
  },
  {
    id: "tasks",
    label: "Задачи",
    title: "Задачи",
    description: "Канбан, исполнители и таймеры",
    href: "/tasks",
    icon: CheckSquare
  },
  {
    id: "calendar",
    label: "Календарь",
    title: "Календарь",
    description: "События, смены и проверка пересечений",
    href: "/calendar",
    icon: CalendarDays
  },
  {
    id: "drive",
    label: "Диск",
    title: "Диск",
    description: "Файлы с версиями и общим доступом",
    href: "/drive",
    icon: FolderOpen
  },
  {
    id: "wiki",
    label: "База знаний",
    title: "База знаний",
    description: "Статьи, регламенты и история правок",
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
