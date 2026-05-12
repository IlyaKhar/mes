import type {
  ActionLogType,
  Department,
  EventMode,
  FileKind,
  Priority,
  Role,
  ShiftPattern,
  TaskStatus,
  TicketStatus,
  WikiPageStatus
} from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Администратор",
  USER: "Сотрудник"
};

export const roleDescriptions: Record<Role, string> = {
  ADMIN: "Видит данные всех отделов, управляет пользователями, ролями и блокировками.",
  USER: "Работает с данными своего отдела: задачи, заявки, события и файлы."
};

export const departmentLabels: Record<Department, string> = {
  IT: "ИТ-отдел",
  HR: "Кадры",
  PROCUREMENT: "Снабжение",
  OPERATIONS: "Операционный отдел"
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  DONE: "Готово"
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  CRITICAL: "Критичный"
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Открыта",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидает",
  RESOLVED: "Решена",
  CLOSED: "Закрыта"
};

export const fileKindLabels: Record<FileKind, string> = {
  PDF: "PDF",
  DOC: "Документ",
  IMAGE: "Изображение",
  OTHER: "Файл"
};

export const wikiPageStatusLabels: Record<WikiPageStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликована",
  ARCHIVED: "В архиве"
};

export const eventModeLabels: Record<EventMode, string> = {
  OFFICE: "В офисе",
  REMOTE: "Удалённо",
  TWO_TWO: "Смена 2/2"
};

export const shiftPatternLabels: Record<ShiftPattern, string> = {
  FIVE_TWO: "5/2 (будни)",
  TWO_TWO: "2/2 (сменный)"
};

export const actionLogTypeLabels: Record<ActionLogType, string> = {
  LOGIN: "Вход",
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
  BAN: "Блокировка",
  ROLE_CHANGE: "Смена роли"
};
