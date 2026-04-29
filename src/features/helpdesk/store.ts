import { create } from "zustand";

type Ticket = {
  id: string;
  title: string;
  owner: string;
  category: "IT" | "HR" | "Снабжение";
  priority: "Низкий" | "Средний" | "Высокий" | "Критичный";
  status: "Новая" | "В работе" | "Ожидает";
  slaLeftPercent: number;
  deadline: string;
};

type HelpDeskState = {
  tickets: Ticket[];
  addTicket: (ticket: Pick<Ticket, "title" | "category">) => void;
};

export const useHelpDeskStore = create<HelpDeskState>((set) => ({
  tickets: [
    {
      id: "HD-1042",
      title: "Проверить доступы к биллингу",
      owner: "Олег",
      category: "IT",
      priority: "Критичный",
      status: "В работе",
      slaLeftPercent: 18,
      deadline: "сегодня, 14:00"
    },
    {
      id: "HD-1038",
      title: "Восстановить выгрузку отчетов",
      owner: "Наталья",
      category: "IT",
      priority: "Высокий",
      status: "Ожидает",
      slaLeftPercent: 44,
      deadline: "сегодня, 18:30"
    },
    {
      id: "HD-1027",
      title: "Настроить новый отдел продаж",
      owner: "Денис",
      category: "HR",
      priority: "Средний",
      status: "Новая",
      slaLeftPercent: 76,
      deadline: "завтра, 11:00"
    },
    {
      id: "HD-1021",
      title: "Согласовать поставку ноутбуков",
      owner: "Алина",
      category: "Снабжение",
      priority: "Низкий",
      status: "В работе",
      slaLeftPercent: 88,
      deadline: "пт, 16:00"
    }
  ],
  addTicket: (ticket) =>
    set((state) => ({
      tickets: [
        {
          id: `HD-${1043 + state.tickets.length}`,
          title: ticket.title,
          owner: "Назначается",
          category: ticket.category,
          priority: "Средний",
          status: "Новая",
          slaLeftPercent: 92,
          deadline: "завтра, 17:00"
        },
        ...state.tickets
      ]
    }))
}));
