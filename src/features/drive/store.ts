import { create } from "zustand";

type DriveFile = {
  id: string;
  name: string;
  type: "PDF" | "DOC" | "IMG";
  size: string;
  owner: string;
  updatedAt: string;
  shareUrl: string;
  versions: Array<{
    id: string;
    author: string;
    action: string;
    time: string;
  }>;
};

type DriveState = {
  activeFileId: string;
  files: DriveFile[];
  setActiveFileId: (fileId: string) => void;
};

export const useDriveStore = create<DriveState>((set) => ({
  activeFileId: "file-1",
  files: [
    {
      id: "file-1",
      name: "Регламент SLA.pdf",
      type: "PDF",
      size: "2.4 МБ",
      owner: "Мария",
      updatedAt: "10:42",
      shareUrl: "https://neos.local/drive/reglament-sla",
      versions: [
        { id: "v1-3", author: "Мария", action: "обновила раздел эскалаций", time: "сегодня, 10:42" },
        { id: "v1-2", author: "Олег", action: "добавил SLA для критичных заявок", time: "вчера, 18:10" },
        { id: "v1-1", author: "Анна", action: "создала файл", time: "22 апреля, 09:30" }
      ]
    },
    {
      id: "file-2",
      name: "Коммерческое предложение.docx",
      type: "DOC",
      size: "1.1 МБ",
      owner: "Елена",
      updatedAt: "09:18",
      shareUrl: "https://neos.local/drive/commercial-offer",
      versions: [
        { id: "v2-2", author: "Елена", action: "обновила условия поставки", time: "сегодня, 09:18" },
        { id: "v2-1", author: "Денис", action: "создал черновик", time: "вчера, 15:44" }
      ]
    },
    {
      id: "file-3",
      name: "Схема интеграции.png",
      type: "IMG",
      size: "840 КБ",
      owner: "Илья",
      updatedAt: "Вчера",
      shareUrl: "https://neos.local/drive/integration-map",
      versions: [
        { id: "v3-3", author: "Илья", action: "заменил превью схемы", time: "вчера, 12:20" },
        { id: "v3-2", author: "Павел", action: "добавил новый контур API", time: "21 апреля, 17:02" },
        { id: "v3-1", author: "Илья", action: "загрузил изображение", time: "19 апреля, 11:14" }
      ]
    }
  ],
  setActiveFileId: (fileId) => set({ activeFileId: fileId })
}));
