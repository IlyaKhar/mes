"use client";

import * as React from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  CheckSquare,
  FilePlus2,
  FolderOpen,
  HelpCircle,
  MessageSquareText,
  PenLine,
  Plus,
  Search,
  Send,
  Sparkles,
  UploadCloud,
  Workflow
} from "lucide-react";
import { commandCenterAction, type CommandCenterResult } from "@/actions/command-center";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const moduleCommands = [
  {
    label: "Messenger",
    description: "Чаты, треды, голосовые и ИИ-саммари",
    href: "/#messenger",
    icon: MessageSquareText,
    keywords: "мессенджер чат сообщение тред голосовые ai summary"
  },
  {
    label: "Service Flow",
    description: "Заявки, SLA, категории IT HR Снабжение",
    href: "/#helpdesk",
    icon: HelpCircle,
    keywords: "helpdesk service flow заявка sla поддержка категория"
  },
  {
    label: "Task Orbit",
    description: "Канбан, workload и Pomodoro Focus Mode",
    href: "/#tasks",
    icon: CheckSquare,
    keywords: "задачи task orbit канбан workload pomodoro focus"
  },
  {
    label: "SyncNode",
    description: "Календарь, смены, офис и удаленка",
    href: "/#calendar",
    icon: CalendarDays,
    keywords: "календарь syncnode офис удаленка 2через2 встреча"
  },
  {
    label: "CloudSpace",
    description: "Файлы, версии, QR и ссылки",
    href: "/#drive",
    icon: FolderOpen,
    keywords: "диск cloudspace файл pdf doc img загрузить поделиться qr"
  },
  {
    label: "WikiCore",
    description: "База знаний, дерево статей и smart linking",
    href: "/#wiki",
    icon: Workflow,
    keywords: "вики wikicore статья знания smart linking"
  }
];

const quickActions = [
  {
    label: "> создать задачу",
    description: "Открыть Task Orbit и подготовить новую карточку",
    href: "/#tasks",
    icon: Plus,
    result: "Команда: создать задачу"
  },
  {
    label: "> написать сообщение",
    description: "Перейти в Messenger и начать диалог",
    href: "/#messenger",
    icon: Send,
    result: "Команда: написать сообщение"
  },
  {
    label: "> загрузить файл",
    description: "Открыть CloudSpace для загрузки документа",
    href: "/#drive",
    icon: UploadCloud,
    result: "Команда: загрузить файл"
  },
  {
    label: "> создать заявку",
    description: "Добавить обращение в Service Flow",
    href: "/#helpdesk",
    icon: HelpCircle,
    result: "Команда: создать заявку"
  },
  {
    label: "> создать статью",
    description: "Открыть WikiCore и завести материал базы знаний",
    href: "/#wiki",
    icon: PenLine,
    result: "Команда: создать статью"
  },
  {
    label: "> запланировать встречу",
    description: "Перейти в SyncNode и проверить свободный слот",
    href: "/#calendar",
    icon: CalendarDays,
    result: "Команда: запланировать встречу"
  }
];

const entityCommands = [
  {
    label: "Инцидентная комната",
    description: "Messenger: активный чат по биллингу и SLA",
    href: "/#messenger",
    icon: MessageSquareText,
    keywords: "биллинг sla чат тред"
  },
  {
    label: "HD-1042 Проверить доступы к биллингу",
    description: "Service Flow: критичная заявка",
    href: "/#helpdesk",
    icon: HelpCircle,
    keywords: "заявка доступы биллинг критичный"
  },
  {
    label: "Подготовить релиз биллинга",
    description: "Task Orbit: задача в работе",
    href: "/#tasks",
    icon: CheckSquare,
    keywords: "задача релиз биллинг pomodoro"
  },
  {
    label: "Синк по биллингу",
    description: "SyncNode: встреча сегодня в офисе",
    href: "/#calendar",
    icon: CalendarDays,
    keywords: "встреча календарь офис биллинг"
  },
  {
    label: "Регламент SLA.pdf",
    description: "CloudSpace: PDF с историей версий",
    href: "/#drive",
    icon: FilePlus2,
    keywords: "pdf файл регламент sla qr"
  },
  {
    label: "SLA и эскалации",
    description: "WikiCore: статья базы знаний",
    href: "/#wiki",
    icon: Workflow,
    keywords: "вики статья sla эскалации smart link"
  }
];

export function CommandCenter() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [backendResults, setBackendResults] = React.useState<CommandCenterResult[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const [lastAction, setLastAction] = React.useState("Готов к команде");

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runNavigationCommand = React.useCallback((href: string, result?: string) => {
    window.location.href = href;
    if (result) setLastAction(result);
    setOpen(false);
  }, []);

  const runBackendCommand = React.useCallback((value = query) => {
    startTransition(async () => {
      try {
        const response = await commandCenterAction(value);

        if (response.mode === "command") {
          runNavigationCommand(response.result.href, response.result.title);
          setQuery("");
          setBackendResults([]);
          return;
        }

        setBackendResults(response.results);
      } catch (error) {
        setLastAction(error instanceof Error ? error.message : "Команду не удалось выполнить");
      }
    });
  }, [query, runNavigationCommand]);

  React.useEffect(() => {
    if (!open) return undefined;

    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.startsWith(">")) {
      setBackendResults([]);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => runBackendCommand(trimmedQuery), 300);

    return () => window.clearTimeout(timeoutId);
  }, [open, query, runBackendCommand]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" className="w-full justify-start bg-white shadow-card ring-1 ring-border sm:w-[320px]">
          <Search className="mr-3 size-4 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground">Поиск или команда</span>
          <kbd className="ml-auto rounded-md bg-neos-accentSoft px-2 py-1 text-xs font-black text-primary">
            ⌘K
          </kbd>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-white/70 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 rounded-default bg-white p-3 shadow-float ring-1 ring-border focus-visible:outline-none sm:w-[640px]">
          <Dialog.Title className="sr-only">Центр команд</Dialog.Title>
          <Command className="overflow-hidden rounded-default bg-white">
            <div className="flex items-center gap-3 rounded-default bg-neos-accentSoft px-4">
              <Search className="size-5 text-primary" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && query.trim().startsWith(">")) {
                    event.preventDefault();
                    runBackendCommand();
                  }
                }}
                placeholder="Ищи модуль, файл, заявку или команду"
                className="h-14 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                Ничего не найдено. Попробуй другую команду.
              </Command.Empty>

              <Command.Group heading="Модули" className="px-2 py-3 text-xs font-black uppercase text-muted-foreground">
                {moduleCommands.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.description} ${item.keywords}`}
                      onSelect={() => runNavigationCommand(item.href, `Открыт модуль: ${item.label}`)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-default px-3 py-3 text-sm font-bold outline-none transition active:scale-[0.99]",
                        "aria-selected:bg-neos-accentSoft aria-selected:text-primary"
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span>
                        <span className="block">{item.label}</span>
                        <span className="block text-xs font-semibold text-muted-foreground">{item.description}</span>
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Быстрые действия" className="px-2 py-3 text-xs font-black uppercase text-muted-foreground">
                {quickActions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Command.Item
                      key={item.label}
                      value={`${item.label} ${item.description}`}
                      onSelect={() => runNavigationCommand(item.href, item.result)}
                      className="flex cursor-pointer items-center gap-3 rounded-default px-3 py-3 text-sm font-bold outline-none transition active:scale-[0.99] aria-selected:bg-neos-accentSoft aria-selected:text-primary"
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span>
                        <span className="block">{item.label}</span>
                        <span className="block text-xs font-semibold text-muted-foreground">{item.description}</span>
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Сущности" className="px-2 py-3 text-xs font-black uppercase text-muted-foreground">
                {entityCommands.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Command.Item
                      key={item.label}
                      value={`${item.label} ${item.description} ${item.keywords}`}
                      onSelect={() => runNavigationCommand(item.href, `Найдено: ${item.label}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-default px-3 py-3 text-sm font-bold outline-none transition active:scale-[0.99] aria-selected:bg-neos-accentSoft aria-selected:text-primary"
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span>
                        <span className="block">{item.label}</span>
                        <span className="block text-xs font-semibold text-muted-foreground">{item.description}</span>
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              {query.trim().startsWith(">") ? (
                <Command.Group heading="Выполнить команду" className="px-2 py-3 text-xs font-black uppercase text-muted-foreground">
                  <Command.Item
                    value={query}
                    onSelect={() => runBackendCommand()}
                    className="flex cursor-pointer items-center gap-3 rounded-default px-3 py-3 text-sm font-bold outline-none transition active:scale-[0.99] aria-selected:bg-neos-accentSoft aria-selected:text-primary"
                  >
                    <Sparkles className="size-5" aria-hidden="true" />
                    <span>
                      <span className="block">{query || ">task Купить кофе"}</span>
                      <span className="block text-xs font-semibold text-muted-foreground">
                        Enter создаст сущность через Server Action
                      </span>
                    </span>
                  </Command.Item>
                </Command.Group>
              ) : null}

              {backendResults.length > 0 ? (
                <Command.Group heading="Результаты из базы" className="px-2 py-3 text-xs font-black uppercase text-muted-foreground">
                  {backendResults.map((item) => (
                    <Command.Item
                      key={`${item.type}-${item.id}`}
                      value={`${item.title} ${item.description}`}
                      onSelect={() => runNavigationCommand(item.href, `Найдено: ${item.title}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-default px-3 py-3 text-sm font-bold outline-none transition active:scale-[0.99] aria-selected:bg-neos-accentSoft aria-selected:text-primary"
                    >
                      <Search className="size-5" aria-hidden="true" />
                      <span>
                        <span className="block">{item.title}</span>
                        <span className="block text-xs font-semibold text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
            <div className="rounded-default bg-neos-accentSoft px-4 py-3 text-sm font-bold text-primary">
              <Sparkles className="mr-2 inline size-4" aria-hidden="true" />
              {isPending ? "Работаю с базой..." : lastAction}
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
