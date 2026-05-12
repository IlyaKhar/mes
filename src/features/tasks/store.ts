import { create } from "zustand";

type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeInitials: string;
  assigneeTaskCount: number;
  priority: "Низкий" | "Средний" | "Высокий" | "Критичный";
  workload: number;
  status: "План" | "В работе" | "Проверка";
  estimate: string;
};

type TasksState = {
  focusedTaskId: string | null;
  tasks: Task[];
  focusTask: (taskId: string) => void;
  closeFocusMode: () => void;
};

export const useTasksStore = create<TasksState>((set) => ({
  focusedTaskId: null,
  tasks: [
    {
      id: "task-1",
      title: "Сверить роли доступа",
      description: "Проверить роли биллинга перед релизным окном и закрыть риск по SLA.",
      assignee: "Анна",
      assigneeInitials: "АО",
      assigneeTaskCount: 3,
      priority: "Высокий",
      workload: 72,
      status: "План",
      estimate: "45 мин"
    },
    {
      id: "task-2",
      title: "Подготовить релиз биллинга",
      description: "Собрать финальный чеклист, подтвердить зависимости и передать статус руководителю.",
      assignee: "Илья",
      assigneeInitials: "ИК",
      assigneeTaskCount: 6,
      priority: "Критичный",
      workload: 91,
      status: "В работе",
      estimate: "2 ч"
    },
    {
      id: "task-3",
      title: "Проверить сценарии поддержки",
      description: "Прогнать основные сценарии первой линии и сверить ответы с новой базой знаний.",
      assignee: "Мария",
      assigneeInitials: "МС",
      assigneeTaskCount: 2,
      priority: "Средний",
      workload: 48,
      status: "Проверка",
      estimate: "1 ч"
    },
    {
      id: "task-4",
      title: "Обновить карту эскалаций",
      description: "Добавить новые маршруты для IT и снабжения, чтобы заявки не зависали без владельца.",
      assignee: "Анна",
      assigneeInitials: "АО",
      assigneeTaskCount: 3,
      priority: "Средний",
      workload: 64,
      status: "В работе",
      estimate: "30 мин"
    },
    {
      id: "task-5",
      title: "Согласовать демо для совета",
      description: "Подготовить сценарий демонстрации OKES и убрать лишние технические детали.",
      assignee: "Елена",
      assigneeInitials: "ЕП",
      assigneeTaskCount: 1,
      priority: "Низкий",
      workload: 35,
      status: "План",
      estimate: "50 мин"
    }
  ],
  focusTask: (taskId) => set({ focusedTaskId: taskId }),
  closeFocusMode: () => set({ focusedTaskId: null })
}));
