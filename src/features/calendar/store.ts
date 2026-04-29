import { create } from "zustand";

export type CalendarMode = "Офис" | "Удаленка" | "2через2";

type CalendarEvent = {
  id: string;
  day: number;
  title: string;
  startsAt: string;
  endsAt: string;
  mode: CalendarMode;
};

type OfficeEmployee = {
  id: string;
  name: string;
  initials: string;
  role: string;
};

type CalendarState = {
  activeMode: CalendarMode;
  events: CalendarEvent[];
  officeToday: OfficeEmployee[];
  selectedDay: number;
  selectedStartsAt: string;
  selectedEndsAt: string;
  setActiveMode: (mode: CalendarMode) => void;
  setSelectedDay: (day: number) => void;
  setSelectedStartsAt: (time: string) => void;
  setSelectedEndsAt: (time: string) => void;
};

export const useCalendarStore = create<CalendarState>((set) => ({
  activeMode: "Офис",
  selectedDay: 27,
  selectedStartsAt: "11:00",
  selectedEndsAt: "11:30",
  officeToday: [
    { id: "employee-1", name: "Анна Орлова", initials: "АО", role: "Операции" },
    { id: "employee-2", name: "Илья Ким", initials: "ИК", role: "Интеграции" },
    { id: "employee-3", name: "Мария Соколова", initials: "МС", role: "Поддержка" },
    { id: "employee-4", name: "Олег Грин", initials: "ОГ", role: "SLA" }
  ],
  events: [
    {
      id: "event-1",
      day: 27,
      title: "Синк по биллингу",
      startsAt: "11:00",
      endsAt: "11:30",
      mode: "Офис"
    },
    {
      id: "event-2",
      day: 28,
      title: "Демо для совета",
      startsAt: "15:00",
      endsAt: "16:00",
      mode: "Офис"
    },
    {
      id: "event-3",
      day: 29,
      title: "Удаленный разбор SLA",
      startsAt: "12:00",
      endsAt: "13:00",
      mode: "Удаленка"
    },
    {
      id: "event-4",
      day: 30,
      title: "Смена поддержки 2/2",
      startsAt: "09:00",
      endsAt: "21:00",
      mode: "2через2"
    }
  ],
  setActiveMode: (mode) => set({ activeMode: mode }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedStartsAt: (time) => set({ selectedStartsAt: time }),
  setSelectedEndsAt: (time) => set({ selectedEndsAt: time })
}));
