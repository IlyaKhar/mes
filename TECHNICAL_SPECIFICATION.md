# Техническое задание: 

> Корпоративная экосистема нового поколения для среднего и крупного бизнеса.
> Единый рабочий контур: коммуникации, заявки, задачи, календарь, файлы, база знаний.

---

## Оглавление

1. [Контекст и предпосылки](#1-контекст-и-предпосылки)
2. [Цели проекта](#2-цели-проекта)
3. [Целевая аудитория и роли](#3-целевая-аудитория-и-роли)
4. [Глоссарий](#4-глоссарий)
5. [Технологический стек](#5-технологический-стек)
6. [Общая архитектура](#6-общая-архитектура)
7. [Модель данных](#7-модель-данных)
8. [Авторизация и безопасность](#8-авторизация-и-безопасность)
9. [Функциональные требования по модулям](#9-функциональные-требования-по-модулям)
   - 9.1. [Главная — Брифинг](#91-главная--брифинг)
   - 9.2. [Messenger](#92-messenger)
   - 9.3. [Service Flow (HelpDesk)](#93-service-flow-helpdesk)
   - 9.4. [Task Orbit](#94-task-orbit)
   - 9.5. [SyncNode (Календарь)](#95-syncnode-календарь)
   - 9.6. [CloudSpace (Диск)](#96-cloudspace-диск)
   - 9.7. [WikiCore](#97-wikicore)
   - 9.8. [Command Center (Cmd+K)](#98-command-center-cmdk)
   - 9.9. [Админ-панель](#99-админ-панель)
10. [API и Server Actions](#10-api-и-server-actions)
11. [Фоновые задачи и cron](#11-фоновые-задачи-и-cron)
12. [Дизайн-система](#12-дизайн-система)
13. [Нефункциональные требования](#13-нефункциональные-требования)
14. [Развёртывание](#14-развёртывание)
15. [Тестирование и приёмка](#15-тестирование-и-приёмка)
16. [Roadmap и нереализованные пожелания](#16-roadmap-и-нереализованные-пожелания)
17. [Приложения](#17-приложения)

---

## 1. Контекст и предпосылки

Современные компании используют 8–15 разрозненных сервисов: Slack/Telegram для общения, Jira для задач, ServiceNow для заявок, Google Drive для файлов, Confluence для базы знаний, Google Calendar для событий. Каждый из них — отдельная подписка, отдельная авторизация, отдельная база пользователей. Сотрудник проводит до 30 % рабочего дня в переключениях между интерфейсами и поисках информации.

**NEOS** — это попытка собрать все шесть базовых рабочих процессов в единое приложение под единой авторизацией, единым визуальным языком и единой базой данных, чтобы:

- информация не дублировалась между системами,
- сущности из разных модулей связывались напрямую (задача ↔ заявка ↔ событие ↔ статья),
- администратор видел полную картину компании в одной панели,
- сотрудник работал в одном контексте без переключений.

Проект решает прикладную задачу класса **Internal Operations Platform** (Внутренняя операционная платформа) и архитектурно похож на коммерческие решения Linear, Notion, ClickUp, но с ориентацией на корпоративный стек российских компаний (отделы, смены 2/2, эскалации SLA, ответственные за заявки).

---

## 2. Цели проекта

### 2.1. Бизнес-цели

| Цель | Метрика | Как достигается |
|---|---|---|
| Снизить кол-во используемых SaaS | −5 подписок | Внутренний продукт заменяет Slack, Jira, ServiceNow, Drive, Confluence, Calendar |
| Сократить время на переключение контекста | −30 % | Единый интерфейс, Command Center, связи между модулями |
| Повысить прозрачность работы команды | +100 % | Workload heatmap, поток активности, журнал действий |
| Соблюдение SLA по заявкам | ≥ 95 % | Авторасчёт дедлайнов, эскалация просроченных, отчёт по агентам |

### 2.2. Технические цели

- **Time to first byte ≤ 800 мс** на главной (Vercel Edge + Server Components).
- **First Load JS ≤ 140 КБ** на любой странице.
- **Lighthouse Performance ≥ 90** на десктопе, ≥ 80 на мобильном.
- **Полная типобезопасность**: TypeScript + Prisma + typedRoutes Next.js.
- **Stateless backend**: всё состояние в Postgres, что позволяет горизонтально масштабироваться.

---

## 3. Целевая аудитория и роли

### 3.1. Роли

| Роль | Назначение | Доступы |
|---|---|---|
| **USER** | Рядовой сотрудник | Видит данные своего отдела, может создавать сущности, редактировать свои |
| **ADMIN** | Системный администратор | Видит всю компанию, управляет пользователями, ролями, отделами; доступ к `/admin` |

### 3.2. Отделы (Department)

`IT`, `HR`, `OPERATIONS`, `FINANCE`, `SUPPLY` — закрытый список. Каждая сущность (задача, заявка, событие) принадлежит конкретному отделу через создателя/исполнителя. Фильтрация на уровне Server Components: обычный юзер физически не получит данные чужого отдела.

### 3.3. Сценарии использования

- **Сотрудник отдела IT** в начале дня открывает брифинг → видит свои 3 задачи, 1 эскалацию, встречу в 14:00. Через Cmd+K создаёт `>task Подготовить отчёт`, идёт в Messenger обсудить тикет с коллегой, по треду уточняет детали.
- **Агент поддержки HR** заходит в Service Flow → видит 5 заявок отдела, фильтрует по приоритету `HIGH`, берёт на себя самую старую, меняет статус на `IN_PROGRESS`. Авто-индикатор SLA показывает, что осталось 2 часа.
- **Руководитель** заходит на главную → видит, что в офисе сегодня 12 из 27 сотрудников, активных задач 47, эскалаций 3. Идёт в WikiCore читать обновлённый регламент.
- **Администратор** в `/admin` видит, что у юзера протекла подписка отдела → меняет ему роль, банит уволенного, читает action log.

---

## 4. Глоссарий

| Термин | Определение |
|---|---|
| **Брифинг** | Главная страница с персональной агендой и метриками дня |
| **Service Flow** | Модуль заявок (тикетов) с SLA |
| **Task Orbit** | Канбан-задачник с таймером Pomodoro |
| **SyncNode** | Календарь с поддержкой смен и проверкой пересечений |
| **CloudSpace** | Файловое хранилище с версионированием и шарингом |
| **WikiCore** | База знаний с автосохранением и историей правок |
| **Command Center** | Глобальный поиск и быстрые команды (Cmd+K) |
| **SLA** | Service Level Agreement, дедлайн ответа/решения |
| **Эскалация** | Автоматическая пометка тикета как просроченного |
| **Workload** | Текущая загрузка сотрудника = кол-во активных задач |
| **Shift Pattern** | Паттерн смены: 5/2 или 2/2 |
| **Collision** | Конфликт времени события с другим событием/сменой |

---

## 5. Технологический стек

### 5.1. Frontend

| Технология | Версия | Назначение |
|---|---|---|
| Next.js | 14.2.x | App Router, Server Components, Server Actions, Route Handlers |
| TypeScript | 5.x | Строгая типизация |
| Tailwind CSS | 3.4.x | Стилизация |
| Shadcn/ui | — | Базовые компоненты (Button, Card, Dialog, Badge) |
| Radix UI | 1.x | Headless-примитивы (Dialog, Dropdown) |
| Lucide React | 0.x | Иконки |
| Geist Sans | 1.x | Гуманистический шрифт UI |
| JetBrains Mono | — | Моноширинный для чисел/таймстемпов |
| cmdk | 1.x | Command palette |
| next-auth | 4.x | Авторизация |
| Zustand | 4.x | Локальное состояние client-компонентов |

### 5.2. Backend

| Технология | Версия | Назначение |
|---|---|---|
| Prisma | 6.x | ORM, миграции, тип-генерация |
| PostgreSQL | 15+ | Основная БД |
| Supabase Postgres | — | Managed Postgres (pgbouncer на 6543, direct на 5432) |
| Supabase Storage | — | Бинарное хранилище для файлов CloudSpace |
| bcryptjs | 2.x | Хэширование паролей |
| Node.js | 20.x | Рантайм Server Actions и Route Handlers |

### 5.3. DevOps

| Технология | Назначение |
|---|---|
| Vercel | Хостинг + Edge Network + cron |
| GitHub | Репозиторий + CI |
| ESLint + Prettier | Линтинг |
| TypeScript Project References | Типизация на сборке |

---

## 6. Общая архитектура

### 6.1. Слои приложения

```
┌─────────────────────────────────────────────────────────┐
│                  Vercel Edge / CDN                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│           Next.js 14 (App Router, RSC)                   │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Server Components│  │ Client Components│             │
│  │ (data fetching)  │  │ (interactivity)  │             │
│  └────────┬─────────┘  └──────────────────┘             │
│           │                                              │
│  ┌────────▼─────────┐  ┌──────────────────┐             │
│  │  Server Actions  │  │  Route Handlers  │             │
│  │  (mutations)     │  │  (REST endpoints)│             │
│  └────────┬─────────┘  └──────────────────┘             │
└───────────┼─────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────┐
│              Prisma Client (singleton)                   │
└───────────┬─────────────────────────────────────────────┘
            │
┌───────────▼──────────┐    ┌──────────────────────┐
│  Supabase Postgres   │    │  Supabase Storage    │
│  (все сущности)      │    │  (binary, CloudSpace)│
└──────────────────────┘    └──────────────────────┘
```

### 6.2. Структура папок

```
src/
├── app/
│   ├── (приватные роуты)/      # / /messenger /helpdesk /tasks /calendar /drive /wiki
│   ├── admin/
│   ├── login/
│   ├── api/                    # Route Handlers
│   │   ├── auth/[...nextauth]/
│   │   ├── calendar/work-days/
│   │   ├── cron/escalate-tickets/
│   │   ├── drive/files/[fileId]/download/
│   │   ├── tasks/workload/
│   │   ├── tickets/
│   │   └── transcribe/
│   ├── layout.tsx              # Корневой layout
│   ├── globals.css
│   └── error.tsx               # Глобальный error boundary
├── actions/                    # Server Actions, разделены по модулям
│   ├── admin.ts
│   ├── calendar.ts
│   ├── command-center.ts
│   ├── drive.ts
│   ├── helpdesk.ts
│   ├── messenger.ts
│   ├── tasks.ts
│   └── wiki.ts
├── components/
│   ├── command-center.tsx      # Cmd+K палитра
│   ├── dashboard/              # Виджеты главной
│   │   ├── dashboard-briefing.tsx
│   │   ├── db-widgets.tsx
│   │   └── live-clock.tsx
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   ├── navigation-config.ts
│   │   └── use-active-navigation.ts
│   ├── providers.tsx
│   └── ui/                     # Shadcn-style base
├── features/                   # Module-specific UI
│   ├── calendar/
│   ├── drive/
│   ├── helpdesk/
│   ├── messenger/
│   ├── tasks/
│   └── wiki/
└── lib/
    ├── auth.ts                 # getSessionUser, requireSession
    ├── auth-options.ts         # NextAuth config
    ├── calendar/shifts.ts      # Алгоритмы смен
    ├── db.ts                   # Prisma Client singleton
    ├── storage/
    │   └── supabase-storage.ts # Обёртки Supabase Storage
    └── utils.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts                     # Тестовые данные

theme.config.ts                 # NEOS-палитра, радиусы, тени
tailwind.config.ts              # Tailwind с theme.config
middleware.ts                   # Глобальный auth-middleware
```

### 6.3. Принципы

- **Server-first**: данные подтягиваются в Server Components, mutations через Server Actions. Client-компоненты — только там, где нужна интерактивность.
- **Type safety end-to-end**: Prisma генерирует типы, NextAuth расширяет `Session.user`, TypedRoutes валидирует пути.
- **Single source of truth**: всё состояние — в Postgres. Никаких локальных сторов с захардкоженными моками в проде.
- **Feature folders**: каждый модуль изолирован в `src/features/<module>/`, что упрощает рефакторинг.
- **Defensive auth**: четыре уровня защиты — middleware, серверная проверка на странице, проверка в Server Action, фильтр по department в Prisma-запросе.

---

## 7. Модель данных

### 7.1. Список сущностей

| Сущность | Назначение |
|---|---|
| `User` | Сотрудник + аутентификация |
| `Account`, `Session`, `VerificationToken` | Таблицы NextAuth |
| `Chat` | Контейнер чата (личный или групповой) |
| `ChatParticipant` | Связь Many-to-Many `User ↔ Chat` |
| `Message` | Сообщение в чате (+ parentId для тредов) |
| `Ticket` | Заявка HelpDesk |
| `Task` | Задача Task Orbit |
| `TimeLog` | Сессия таймера Pomodoro |
| `Event` | Календарное событие |
| `EventParticipant` | Связь Many-to-Many `User ↔ Event` |
| `File` | Метаданные файла CloudSpace |
| `FileVersion` | Версия файла |
| `WikiPage` | Статья базы знаний |
| `WikiHistory` | Версия статьи |
| `WikiPageRead` | Кто прочитал статью |
| `ActionLog` | Журнал действий администратора |

### 7.2. Перечисления (Enums)

```
Role:            USER | ADMIN
Department:      IT | HR | OPERATIONS | FINANCE | SUPPLY
ShiftPattern:    FIVE_TWO | TWO_TWO
TicketStatus:    OPEN | IN_PROGRESS | WAITING | RESOLVED | CLOSED
TicketPriority:  LOW | MEDIUM | HIGH | CRITICAL
TicketCategory:  IT_SUPPORT | HR | SUPPLY | FINANCE | OTHER
TaskStatus:      TODO | IN_PROGRESS | DONE
Priority:        LOW | MEDIUM | HIGH | CRITICAL
FileKind:        PDF | DOC | IMAGE | OTHER
WikiPageStatus:  DRAFT | PUBLISHED | ARCHIVED
EventMode:       OFFICE | REMOTE | TWO_TWO
```

### 7.3. Ключевые связи

```
User 1───* Message
User 1───* Task        (creator)
User *───* Task        (assignee)
Ticket 1───* Task      (опциональная привязка)
User 1───* Ticket      (creator)
User 1───* Ticket      (supportAgent)
User *───* Chat        (через ChatParticipant)
Chat 1───* Message
Message 1───* Message  (parentId, треды)
User *───* Event       (через EventParticipant)
User 1───* File        (owner)
File 1───* FileVersion
WikiPage 1───* WikiHistory
WikiPage *───* User    (через WikiPageRead)
```

### 7.4. Индексы

- `Message.chatId`, `Message.createdAt` — выборка истории чата.
- `Ticket.department`, `Ticket.status`, `Ticket.slaDueAt` — фильтрация и SLA-сортировка.
- `Task.assigneeId`, `Task.status` — Канбан и Workload.
- `Event.startsAt` — выборка по месяцу.
- `File.ownerId` — фильтр по департаменту через owner.

---

## 8. Авторизация и безопасность

### 8.1. NextAuth конфигурация

- **Provider**: Credentials (email + пароль).
- **Стратегия сессии**: JWT.
- **Колбэки**: `jwt` обогащает токен `id`, `role`, `department`; `session` прокидывает их в `session.user`.
- **Пароли**: хэширование `bcryptjs` с salt rounds = 10.

### 8.2. Четырёхуровневая защита

1. **Middleware** (`middleware.ts`) — проверяет `getToken()` на всех путях кроме `/login` и `/api/auth`, `/api/cron`. Без токена → редирект на `/login`. Запрос к `/admin` без `role=ADMIN` → редирект на `/`.
2. **Server Component** на каждой странице вызывает `await requireSession()` — если в БД юзер не найден или забанен, кидает на `/login`. Закрывает кейс «протухшая кука осталась в браузере».
3. **Server Action** перед мутацией вызывает `requireSession()` и дополнительно проверяет, что юзер имеет право на конкретное действие (например, удалить можно только свою задачу или будучи админом).
4. **Prisma `where`-фильтр** по `department` для всех выборок — обычный юзер не получит данные чужого отдела даже при подмене параметров запроса.

### 8.3. Защита cron-эндпоинта

`/api/cron/escalate-tickets` принимает только запросы с заголовком `Authorization: Bearer <CRON_SECRET>`. Для Vercel Cron используется встроенный механизм передачи секрета.

### 8.4. Защита Storage

Bucket Supabase `neos-files` приватный. Загрузка идёт через `SUPABASE_SERVICE_ROLE_KEY` (только на сервере). Скачивание — через Route Handler `/api/drive/files/[fileId]/download`, который проверяет права юзера и возвращает Blob.

### 8.5. Защита от утечек

- `.env` в `.gitignore`.
- Все секреты только в переменных окружения Vercel.
- В production `error.tsx` не показывает stack trace.
- В Server Components не передаются на клиент: пароли, sensitive поля, `content` (бинарь файла).

---

## 9. Функциональные требования по модулям

### 9.1. Главная — Брифинг

**URL**: `/`

**Цель**: Персональная агенда + общий пульс компании за один экран.

**Компоненты экрана**:

1. **Hero-брифинг** (`DashboardBriefing` Server Component):
   - Контекстуальное приветствие: «Доброе утро/день/вечер/ночи, {имя}».
   - Динамический подзаголовок: если есть ближайшая встреча — её название и обратный отсчёт; если есть задачи — их количество; иначе — приглашение прибраться в Wiki.
   - **Тикающие часы** (`LiveClock` Client Component) с обновлением раз в секунду, `tabular-nums` для стабильной ширины.
   - Роль и отдел текущего юзера.
2. **3 KPI-плитки** (цветной градиент):
   - **Мои задачи** — `Task.count` где `assigneeId = me AND status IN (TODO, IN_PROGRESS)`. Клик → `/tasks`.
   - **Эскалации** — `Ticket.count` где `isEscalated = true AND (creator = me OR agent = me)`. Клик → `/helpdesk`.
   - **События сегодня** — `Event.count` где `участник = me AND startsAt ∈ [сегодня)`. Клик → `/calendar`.
3. **Карточка «Ближайшее событие»**:
   - `Event.findFirst` где `startsAt >= now AND участник = me`.
   - Название, обратный отсчёт, дата и время, стопка инициалов первых 4 участников.
4. **Поток активности** (вертикальный список, до 6 элементов):
   - Объединяет последние 4 записи из `Ticket`, `Task`, `File`, `Message`.
   - Сортировка по `updatedAt`/`createdAt`.
   - Каждая строка: иконка модуля, заголовок, описание, относительное время.
5. **Полоса «В офисе сегодня»**:
   - Перебирает всех неуволенных юзеров, для каждого вызывает `generateWorkIntervals` (паттерн смены + рабочие часы).
   - Если на сегодня есть интервал — юзер «в офисе».
   - Отрисовка: до 8 инициалов + счётчик.
6. **Метрики компании** (`MetricsWidget`):
   - Сообщений, активных задач, открытых тикетов, файлов.
7. **Сетка модулей**: 6 кликабельных карточек на `/messenger`, `/helpdesk`, `/tasks`, `/calendar`, `/drive`, `/wiki`.

**Производительность**: 9 параллельных Prisma-запросов через `Promise.all`. Цель — TTFB ≤ 800 мс.

---

### 9.2. Messenger

**URL**: `/messenger`

**Цель**: Корпоративный мессенджер с поддержкой групп, тредов и AI-саммари.

**Функционал**:

| Сценарий | Действие | Server Action |
|---|---|---|
| Создать личный чат | Поиск юзера по email/имени → создать чат с двумя участниками | `createDirectChat({ targetUserId })` |
| Создать группу | Указать название + участников | `createGroupChat({ title, participantIds })` |
| Добавить участника | Кнопка в шапке группового чата | `addChatParticipant({ chatId, userId })` |
| Отправить сообщение | Поле ввода + Enter | `sendMessage({ chatId, body, parentId? })` |
| Ответить в треде | Кликнуть на сообщение → справа панель | `sendMessage({ parentId })` |
| Удалить сообщение | Контекстное действие на своём сообщении | `deleteMessage({ messageId })` |
| Удалить чат | Только админ или последний участник | `deleteChat({ chatId })` |

**UI**:

- Двухколоночный layout: список чатов слева (260px), активный диалог справа.
- Сообщения сгруппированы по дням.
- Аватары участников = инициалы на цветной плашке (детерминистический цвет по `userId`).
- Треды: при клике на сообщение справа выезжает панель с `backdrop-blur`.
- Иконка статуса «прочитано» (заготовка).
- Поле ввода поддерживает Enter (отправить) и Shift+Enter (новая строка).

**AI-саммари**:

- Поле `Chat.aiSummary` — заготовка под автогенерацию.
- Отображается в верхней части чата стильным блоком в `accentSoft`.

**Голосовые сообщения**:

- Заготовка с волновой графикой (SVG-каркас) и кнопкой «Текст».
- Route Handler `/api/transcribe` — mock OpenAI Whisper с задержкой 1.5 с.

**Realtime**:

- В первой версии — без WebSocket, обновление через `revalidatePath("/messenger")`.
- Будущая интеграция — Pusher или Supabase Realtime (опционально).

---

### 9.3. Service Flow (HelpDesk)

**URL**: `/helpdesk`

**Цель**: Учёт заявок с SLA, эскалациями и назначением агентов.

**Функционал**:

| Сценарий | Действие |
|---|---|
| Создать заявку | Форма: title, description, priority, category. `createTicket` |
| Автоматический SLA | Сервер рассчитывает `slaDueAt`: CRITICAL+1ч, HIGH+4ч, MEDIUM+24ч, LOW+48ч |
| Назначить агента | Дропдаун в строке таблицы. `assignTicketOwnerAction` |
| Сменить статус | OPEN → IN_PROGRESS → WAITING → RESOLVED → CLOSED. `updateTicketStatusAction` |
| Удалить | Только автор или админ. `deleteTicketAction` |
| Фильтр по категории | Чипсы IT / HR / Снабжение / Финансы / Прочее |
| Фильтр по статусу | Чипсы статусов |
| Просмотр своего отдела | Обычный юзер видит только тикеты своего департамента |
| Эскалация | Cron раз в минуту проставляет `isEscalated=true` для просроченных |

**SLA-индикатор**:

- Тонкая линия под заголовком заявки.
- Цвет:
  - Зелёный, если осталось > 50 % времени.
  - Жёлтый, если 20–50 %.
  - Красный + анимация `pulse`, если < 20 % или истекло.
- Анимация эскалированных строк: лёгкое подёргивание + `bg-red-50`.

**Таблица**:

- Чередование фонов строк (`F0F4FF` / `surface`) без сплошных границ.
- Колонки: №, Заголовок (с SLA-линией), Категория, Приоритет, Статус, Создатель, Агент, Действия.
- Сортировка по умолчанию: эскалированные сверху, далее по `slaDueAt`.

**Анимация создания**:

- При успехе форма «улетает» вверх (CSS transform) и появляется toast.

---

### 9.4. Task Orbit

**URL**: `/tasks`

**Цель**: Канбан-задачник с таймером Pomodoro и визуализацией загрузки.

**Функционал**:

| Сценарий | Действие |
|---|---|
| Создать задачу | Форма: title, description, priority, assignee, ticket (опц.) |
| Сменить статус | Кнопки TODO → IN_PROGRESS → DONE |
| Назначить исполнителя | Дропдаун в карточке |
| Привязать к тикету | Дропдаун из открытых тикетов отдела |
| Запустить таймер | Кнопка Play — создаёт `TimeLog` с `startedAt=now` |
| Остановить таймер | Кнопка Pause — апдейтит `endedAt` и `durationSeconds` |
| Удалить | Автор, исполнитель или админ |
| Фильтр | «Мои», «Отдел», «Все» |

**Канбан**:

- 3 колонки: TODO, IN_PROGRESS, DONE.
- Карточка задачи: цветная полоска приоритета слева, заголовок, описание (line-clamp), исполнитель (аватар), тикет (бейдж #номер), таймер.
- Soft shadow + hover-lift.

**Workload Heatmap** (`/api/tasks/workload`):

- GET с `?department=IT` возвращает `[{ userId, name, activeTasks, intensity }]`.
- `intensity` 0–1, рассчитывается как `activeTasks / max(activeTasks по отделу)`.
- Используется в правом сайдбаре для отрисовки кружка возле аватара исполнителя: чем интенсивнее цвет, тем больше загружен.

**Focus Mode** (опциональная фича, UI готов):

- Клик на карточку → фон всего приложения уходит в `blur`, в центре карточка + крупный Pomodoro-таймер.
- Тёмная подложка с лёгким `radial-gradient`.

---

### 9.5. SyncNode (Календарь)

**URL**: `/calendar`

**Цель**: Производственный календарь с поддержкой смен и проверкой пересечений.

**Функционал**:

| Сценарий | Действие |
|---|---|
| Создать событие | Форма: title, description, дата, время с/до, mode, участники |
| Multi-select участников | Чекбоксы со всеми юзерами отдела (или всех — для админа) |
| Проверка коллизий | Server-side проверка перед сохранением. При конфликте — `throw` с описанием |
| Сменить статус | Через `updateEvent` |
| Удалить | Только создатель или админ |
| Просмотр недели/месяца | Месячная сетка (7×6) |
| Смены 5/2 | Будни — рабочие, выходные подсвечены `accentSoft` |
| Смены 2/2 | Цикл 2 рабочих / 2 выходных, опорная дата `shiftStartedAt` |
| Кто в офисе сегодня | Виджет с инициалами поверх сетки |

**Алгоритм генерации рабочих интервалов** (`generateWorkIntervals`):

```
input: from, monthsAhead, pattern, shiftStartedAt, workdayStartsAt, workdayEndsAt
output: WorkInterval[]

для каждого дня в [from, from + monthsAhead]:
    если pattern = FIVE_TWO:
        рабочий, если день недели не сб и не вс
    если pattern = TWO_TWO:
        cycleDay = (день - shiftStartedAt) mod 4
        рабочий, если cycleDay ∈ {0, 1}
    если рабочий:
        добавить интервал [день + workdayStartsAt, день + workdayEndsAt]
```

**Проверка коллизий**:

```
для каждого участника:
    1. Проверить пересечение [startsAt, endsAt] с любым его существующим Event
    2. Если mode = OFFICE: проверить, что [startsAt, endsAt] попадает в WorkInterval участника
    3. Если есть пересечение → throw Error с описанием
```

**Event Collision UI**:

- Если форма ловит конфликт на клиенте (быстрая проверка) — ячейка с конфликтным днём вибрирует (CSS `animation: neos-shake 0.4s`), кнопка «Сохранить» disabled.
- Если конфликт пришёл с сервера — toast с описанием.

**API**:

- `/api/calendar/work-days?userId=...&month=...` — рабочие дни юзера на месяц.

---

### 9.6. CloudSpace (Диск)

**URL**: `/drive`

**Цель**: Файлообменник с версионированием, шарингом и QR-кодами.

**Функционал**:

| Сценарий | Действие |
|---|---|
| Загрузить файл | Drag-and-drop или input. `uploadFile` |
| Скачать | Кнопка → `/api/drive/files/[fileId]/download` |
| Создать версию | Загрузить файл с тем же именем → `addFileVersionAction` |
| Поделиться | Модалка с QR-кодом + short-link. `createFileShareLinkAction` |
| Удалить | Только владелец или админ. `deleteFileAction` + `removeFromSupabaseStorage` |
| Просмотр версий | Боковая панель с автором, датой, размером каждой версии |

**Drag-and-drop**:

- Большая зона с `border-dashed border-2`.
- При `dragenter` подсветка `bg-primary/5 ring-2 ring-primary shadow-[0_0_42px_rgba(26,61,99,0.42)]` (neon-эффект).
- Поддержка нескольких файлов одновременно.

**Хранение**:

- **Метаданные** (name, size, mimeType, kind, url, ownerId, createdAt) в Postgres.
- **Бинарь** в Supabase Storage, bucket `neos-files`, путь `<userId>/<uuid>.<ext>`.
- В `File.url` хранится `storagePath`, не публичный URL — скачивание всегда через защищённый Route Handler.

**Цветовая дифференциация**:

- `PDF` → `bg-neos-accentSoft text-primary`
- `DOC` → `bg-primary/15 text-primary`
- `IMAGE` → `bg-primary/25 text-primary`
- `OTHER` → `bg-cyan-50 text-neos-cyan`

**QR-код**:

- Библиотека: `qrcode.react` (или генерация SVG inline).
- Модалка: shadcn Dialog + QR + копируемая ссылка + кнопка «Скачать QR».

---

### 9.7. WikiCore

**URL**: `/wiki`

**Цель**: Корпоративная база знаний с версиями и прочтениями.

**Функционал**:

| Сценарий | Действие |
|---|---|
| Создать статью | Форма: title, content. Slug генерируется автоматически из title |
| Редактировать | Inline-edit + автосохранение каждые 30 с |
| Поменять статус | DRAFT → PUBLISHED → ARCHIVED |
| Просмотреть | Любой юзер видит PUBLISHED + свои DRAFT; админ — всё |
| Отметить прочитанным | Кнопка «Прочитано» создаёт `WikiPageRead` |
| Посмотреть кто прочитал | Блок внизу с аватарами читателей |
| История правок | Боковая панель с версиями (автор + дата) |
| Удалить | Только автор или админ |

**Дерево статей**:

- Слева accordion-меню (раскрытие/сжатие папок).
- Связь parent-child через `parentId`.
- Глубина до 3 уровней.

**Smart Linking**:

- При выделении текста в редакторе появляется мини-панель «Создать ссылку на статью».
- Каркас UI готов; интеграция с поиском статей — следующая итерация.

**Версионирование**:

- При `updateWikiPage` создаётся `WikiHistory` со снапшотом `content` + автор + timestamp.
- Diff на клиенте — упрощённый (line-by-line).

**Типографика**:

- Контент-зона эмулирует «чистый лист бумаги»: `max-width: 720px`, `line-height: 1.65`, заголовки 32/24/20px.

---

### 9.8. Command Center (Cmd+K)

**Цель**: Глобальный поиск и быстрое создание сущностей с клавиатуры.

**Открытие**: `Cmd+K` (Mac) / `Ctrl+K` (Win) или клик по плашке в TopBar.

**Группы результатов**:

1. **Модули** — статичный список 6 модулей + админка.
2. **Быстрые действия** — `> создать задачу`, `> написать сообщение`, `> загрузить файл`, `> создать заявку`, `> создать статью`, `> запланировать встречу`.
3. **Сущности** — заглушки-примеры из реальных модулей.
4. **Результаты из базы** — динамические, через Server Action `commandCenterAction`.
5. **Выполнить команду** — если ввод начинается с `>` и распознан.

**Команды**:

| Префикс | Действие |
|---|---|
| `>task <название>` | Создаёт задачу с дефолтным `MEDIUM` приоритетом |
| `>ticket <название>` | Создаёт тикет MEDIUM, OTHER-категория |
| `>wiki <название>` | Создаёт статью со slug = `<title>-<timestamp>` |

**Server Action `commandCenterAction`**:

- Принимает `query: string`.
- Если начинается с `>` — парсит и вызывает соответствующий create-action.
- Иначе — параллельный поиск по 4 таблицам: User, Task, WikiPage, Ticket. Фильтр по department для USER.
- Возвращает `{ mode: "search" | "command", results }`.

---

### 9.9. Админ-панель

**URL**: `/admin`

**Доступ**: только `role=ADMIN` (middleware + страница).

**Функционал**:

| Сценарий | Действие |
|---|---|
| Список пользователей | Таблица: имя, email, роль, отдел, статус |
| Сменить роль | Клик по бейджу `USER` → `ADMIN`. `updateUserRoleAction` |
| Сменить отдел | Цикл по департаментам. `updateUserDepartmentAction` |
| Забанить / разбанить | Кнопка в строке. `setUserBannedAction` |
| Метрики | Пользователей, активных задач, открытых тикетов |
| Action Log | Последние 12 записей из `ActionLog` (тип, сущность, актор, время) |

**Action Log** (расширяемая система):

- Каждое action-вызов пишет в `ActionLog` через хелпер `logAction({ type, entity, actorId, payload })`.
- Типы: `CREATE`, `UPDATE`, `DELETE`, `BAN`, `LOGIN`, `LOGOUT`.

---

## 10. API и Server Actions

### 10.1. Server Actions (`src/actions/`)

| Файл | Actions |
|---|---|
| `admin.ts` | `updateUserRoleAction`, `updateUserDepartmentAction`, `setUserBannedAction` |
| `messenger.ts` | `createDirectChat`, `createGroupChat`, `addChatParticipant`, `sendMessage`, `deleteMessage`, `deleteChat` |
| `helpdesk.ts` | `createTicket`, `assignTicketOwnerAction`, `updateTicketStatusAction`, `deleteTicketAction` |
| `tasks.ts` | `createTaskAction`, `updateTaskStatusAction`, `startTimerAction`, `stopTimerAction`, `deleteTaskAction` |
| `calendar.ts` | `createEventAction`, `updateEventAction`, `deleteEventAction` |
| `drive.ts` | `uploadFile`, `addFileVersionAction`, `createFileShareLinkAction`, `deleteFileAction` |
| `wiki.ts` | `createWikiPageAction`, `updateWikiPage`, `markWikiPageReadAction`, `deleteWikiPageAction` |
| `command-center.ts` | `commandCenterAction` |

### 10.2. Route Handlers (`src/app/api/`)

| Endpoint | Method | Описание |
|---|---|---|
| `/api/auth/[...nextauth]` | * | NextAuth endpoints |
| `/api/calendar/work-days?userId&month` | GET | Рабочие дни юзера |
| `/api/cron/escalate-tickets` | POST | Cron-эскалация (защищён `CRON_SECRET`) |
| `/api/drive/files/[fileId]/download` | GET | Скачивание файла (Blob) |
| `/api/tasks/workload?department` | GET | Heatmap нагрузки |
| `/api/tickets?status&priority&category` | GET | Фильтры тикетов (для возможной внешней интеграции) |
| `/api/transcribe` | POST | Mock-транскрипция аудио |

### 10.3. Контракты Server Actions

Все Server Actions:

- Объявлены через `"use server"`.
- Принимают типизированный input (object с явными полями).
- Возвращают `Promise<{ ok: true, data } | { ok: false, error }>` либо бросают `Error` для глобального обработчика.
- В начале выполняют `await requireSession()`.
- В конце вызывают `revalidatePath("/<module>")`.

---

## 11. Фоновые задачи и cron

### 11.1. Эскалация тикетов

**Endpoint**: `POST /api/cron/escalate-tickets`

**Триггер**: Vercel Cron Job, расписание `*/1 * * * *` (раз в минуту).

**Логика**:

```
1. Найти Ticket где slaDueAt < now AND isEscalated = false AND status NOT IN (RESOLVED, CLOSED)
2. Для каждого:
   - isEscalated = true
   - залогировать в ActionLog (тип ESCALATE)
3. Опционально — отправить уведомление в Messenger в чат отдела
```

### 11.2. Конфиг

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/escalate-tickets",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

---

## 12. Дизайн-система

### 12.1. Палитра

| Токен | HEX | Назначение |
|---|---|---|
| `background` | `#F6F3EC` | Основной фон (тёплый кремовый) |
| `surface` | `#FFFFFF` | Карточки, модалки |
| `surface-muted` | `#FBF9F4` | Подложки секций |
| `accent` | `#1A3D63` | Primary — кнопки, ссылки, активные состояния |
| `accent-soft` | `#E8EEF5` | Фон бейджей, активный фон строк |
| `accent-deep` | `#0F2640` | Hover-состояния, вторичные подписи |
| `divider` | `#E7E2D6` | Разделители |
| `ink` | `#252A35` | Основной текст (графит) |
| `ink-soft` | `#3A4150` | Заголовки H2/H3 |
| `muted` | `#6B6F7A` | Серый вторичный |
| `success` | `#12B981` | Положительные действия |
| `warning` | `#FFB627` | Предупреждения, янтарь |
| `danger` | `#E11D48` | Удаление, эскалации |

### 12.2. Типографика

- **UI шрифт**: Geist Sans (varies 100–900).
- **Моноширинный**: JetBrains Mono (для чисел, таймстемпов, ID).
- **Масштаб**:
  - H1: 36px / `font-semibold` / tracking-tight
  - H2: 24px / `font-semibold`
  - H3: 18px / `font-semibold`
  - Body: 14px / `font-medium`
  - Caption: 12px / `font-bold uppercase tracking-[0.2em]`
- **OpenType features Geist**: `ss01, ss02, cv01, cv11` — фирменные вариации.
- **Числа**: всегда `font-mono tabular-nums` чтобы не прыгали по ширине.

### 12.3. Скругления и тени

- Базовый радиус: **16px** (карточки, модалки).
- Кнопки: **12px**.
- Pill (бейджи): **999px**.
- Тени:
  - `card`: `0 12px 40px rgba(14, 17, 22, 0.06)`
  - `float`: `0 24px 80px rgba(14, 17, 22, 0.10)`

### 12.4. Spacing

- Сетка кратна **4 / 8 px**.
- Padding карточек: `p-5` (20px) или `p-6` (24px).
- Gap между секциями: `space-y-6` (24px).

### 12.5. Микро-интеракции

- Кнопки: `active:scale-[0.98]` при нажатии.
- Карточки: `hover:-translate-y-1 hover:shadow-float` при наведении.
- KPI-плитки: `hover:-translate-y-0.5`.
- SLA-индикатор: `animate-pulse` при критическом времени.
- Конфликт времени: `animation: neos-shake 0.4s`.

### 12.6. Иконки

- Источник: `lucide-react`, размер по умолчанию `size-5` (20px).
- В моно-плашках: `size-4` (16px).
- Цвет: `stroke="currentColor"`, наследует от родителя.

---

## 13. Нефункциональные требования

### 13.1. Производительность

- **TTFB** ≤ 800 мс на главной (с холодным стартом Vercel) .
- **First Load JS** ≤ 140 КБ.
- **Lighthouse Performance** ≥ 90 (desktop) / ≥ 80 (mobile).
- **Core Web Vitals**: LCP ≤ 2.5 s, FID ≤ 100 ms, CLS ≤ 0.1.
- Параллелизация Prisma-запросов через `Promise.all`.
- Server Components by default; Client — только где нужна интерактивность.

### 13.2. Безопасность

- HTTPS only (Vercel).
- bcrypt для паролей.
- JWT с `httpOnly + secure + sameSite=lax` куки.
- CSRF: NextAuth встроенная защита.
- SQL Injection: Prisma параметризованные запросы.
- XSS: React автоматический escape + `dangerouslySetInnerHTML` нигде не используется.
- Rate limiting (планируется через Vercel Edge Middleware).

### 13.3. Доступность (WCAG 2.1 AA)

- Контраст текст/фон ≥ 4.5:1 (графит #252A35 на #F6F3EC = 11.2:1).
- Все интерактивные элементы доступны с клавиатуры.
- `aria-label` для иконочных кнопок.
- Семантические HTML: `<main>`, `<nav>`, `<aside>`, `<article>`, `<section>`.
- Focus states: `focus-visible:ring-2 focus-visible:ring-primary`.
- Touch targets ≥ 44×44 px.
- `suppressHydrationWarning` для динамического времени (часы).

### 13.4. Адаптивность

- **Mobile first**.
- Брейкпоинты:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px (показывается Sidebar)
  - `xl`: 1280px
- На мобильном: Sidebar скрыт, навигация через TopBar + Command Center.

### 13.5. Локализация

- Все строки UI — на русском.
- Даты: `toLocaleDateString("ru-RU")`, `toLocaleTimeString("ru-RU")`.
- Готовность к i18n (next-intl) — текст не хардкоден в JSX логике, но без выноса в JSON в первой версии.

---

## 14. Развёртывание

### 14.1. Окружения

| Env | URL | БД | Назначение |
|---|---|---|---|
| **Production** | `https://mes-delta.vercel.app` | Supabase prod | Боевая |
| **Preview** | автоматически на PR | Supabase prod (один) | Тестирование изменений |
| **Local** | `http://localhost:3000` | Supabase или локальный pg | Разработка |

### 14.2. Переменные окружения

```bash
# База
DATABASE_URL=postgresql://...?pgbouncer=true&sslmode=require&connection_limit=1
DIRECT_URL=postgresql://...?sslmode=require    # порт 5432 для миграций

# Auth
NEXTAUTH_SECRET=<32+ символов случайной строки>
NEXTAUTH_URL=https://mes-delta.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_STORAGE_BUCKET=neos-files

# Cron
CRON_SECRET=<32+ символов>

# Frontend
NEXT_PUBLIC_APP_URL=https://mes-delta.vercel.app
```

### 14.3. Шаги деплоя

```bash
# 1. Локально
npm install
cp .env.example .env  # заполнить
npx prisma generate
npx prisma migrate deploy    # порт 5432
npx prisma db seed           # тестовые данные
npm run dev

# 2. Production (Vercel)
git push origin main         # авто-деплой
# Vercel UI: Settings → Environment Variables → добавить все переменные
# После накатывания миграций — Redeploy
```

### 14.4. Миграции

- Создание: `npx prisma migrate dev --name <название>`.
- Накат на prod: `npx prisma migrate deploy` (с `DIRECT_URL`).
- Откат: ручной — `prisma migrate resolve --rolled-back <migration>`.

---

## 15. Тестирование и приёмка

### 15.1. Smoke-тест после деплоя

1. Открыть `https://mes-delta.vercel.app` → должен быть редирект на `/login`.
2. Войти как `admin@neos.local` / `Neos12345!`.
3. Главная: видны брифинг, метрики, карточки модулей.
4. Перейти в каждый из 6 модулей — данные подгружаются.
5. Создать тестовую задачу через Cmd+K → `>task Smoke test`. Перейти в Task Orbit — задача есть.
6. Выйти. Открыть `/` напрямую — должен быть редирект на `/login`.

### 15.2. Чек-лист функциональной приёмки

**Авторизация**:
- [ ] Логин валидным юзером — успех
- [ ] Логин невалидным — ошибка с понятным текстом
- [ ] Логин забаненным — ошибка
- [ ] Доступ к `/admin` обычным юзером — редирект на `/`
- [ ] Выход — кука удалена, доступ закрыт

**Messenger**:
- [ ] Создание личного чата
- [ ] Создание группы
- [ ] Добавление участника
- [ ] Отправка сообщения
- [ ] Ответ в треде
- [ ] Удаление сообщения

**Service Flow**:
- [ ] Создание тикета с авторасчётом SLA
- [ ] Назначение агента
- [ ] Смена статуса
- [ ] Эскалация (после истечения SLA)
- [ ] Удаление

**Task Orbit**:
- [ ] Создание задачи
- [ ] Перемещение по статусам
- [ ] Старт/стоп таймера → создаётся TimeLog
- [ ] Привязка к тикету
- [ ] Удаление

**SyncNode**:
- [ ] Создание события
- [ ] Коллизия с другим событием → ошибка
- [ ] Коллизия со сменой → ошибка
- [ ] Удаление

**CloudSpace**:
- [ ] Загрузка файла → метаданные в БД, бинарь в Storage
- [ ] Скачивание
- [ ] Создание версии
- [ ] Шаринг + QR
- [ ] Удаление (метаданные + Storage)

**WikiCore**:
- [ ] Создание статьи + auto-slug
- [ ] Редактирование + версия в WikiHistory
- [ ] Отметка прочитанной
- [ ] Удаление

**Командный центр**:
- [ ] Cmd+K открывает палитру
- [ ] Поиск находит юзеров и сущности
- [ ] `>task Test` создаёт задачу

**Админ**:
- [ ] Изменение роли
- [ ] Бан юзера
- [ ] Action Log пишет события

### 15.3. Нагрузочное тестирование (опционально)

- Инструмент: k6 или Artillery.
- Цель: 100 RPS на главную, 50 RPS на модули — без ошибок.

---

## 16. Roadmap и нереализованные пожелания

### 16.1. v1.1 (ближайшее)

- [ ] **Realtime в Messenger** через Supabase Realtime или Pusher
- [ ] **Push-уведомления** в браузере на эскалации и упоминания
- [ ] **Email-нотификации** на создание тикета на отдел
- [ ] **Темная тема** (toggle в TopBar)
- [ ] **Профиль пользователя** (`/profile`) — смена аватара, пароля, паттерна смены
- [ ] **Excel-экспорт** тикетов и задач

### 16.2. v1.2

- [ ] **AI-саммари** чатов и Wiki через OpenAI API
- [ ] **Транскрипция голосовых** через реальный Whisper
- [ ] **Smart linking в Wiki** с автокомплитом по статьям
- [ ] **Workload heatmap визуализация** в Tasks-сайдбаре
- [ ] **Drag-and-drop Kanban** в Task Orbit
- [ ] **Focus Mode** с Pomodoro-аналитикой
- [ ] **Inline-комментарии** в Wiki

### 16.3. v2.0

- [ ] **Мобильное приложение** (React Native)
- [ ] **API для интеграций** (REST + Webhook)
- [ ] **Roles & Permissions** с гранулярными правами
- [ ] **Multi-tenancy** — поддержка нескольких компаний
- [ ] **SSO** (Google, Microsoft Entra)
- [ ] **Аудит-журнал** для compliance (ISO 27001)

---

## 17. Приложения

### 17.1. Тестовые учётные записи (seed)

| Email | Пароль | Роль | Отдел |
|---|---|---|---|
| `admin@neos.local` | `Neos12345!` | ADMIN | IT |
| `ivan@neos.local` | `Neos12345!` | USER | IT |
| `maria@neos.local` | `Neos12345!` | USER | HR |
| `petr@neos.local` | `Neos12345!` | USER | OPERATIONS |

### 17.2. Полезные команды

```bash
# Разработка
npm run dev                          # dev-сервер
npm run build                        # production build
npm run lint                         # ESLint

# Prisma
npx prisma studio                    # UI для БД
npx prisma generate                  # перегенерировать клиент
npx prisma migrate dev --name x      # новая миграция
npx prisma migrate deploy            # применить миграции на prod
npx prisma db seed                   # засеять тестовые данные
npx prisma db push                   # быстрый push без миграций (dev)

# Git
git add -A && git commit -m "..."
git push origin main                 # авто-деплой Vercel
```

### 17.3. Структура `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 17.4. Список основных зависимостей

```json
{
  "next": "14.2.x",
  "react": "18.x",
  "typescript": "5.x",
  "@prisma/client": "6.x",
  "prisma": "6.x",
  "next-auth": "4.x",
  "tailwindcss": "3.4.x",
  "geist": "1.x",
  "lucide-react": "0.x",
  "@radix-ui/react-dialog": "1.x",
  "cmdk": "1.x",
  "bcryptjs": "2.x",
  "@supabase/supabase-js": "2.x",
  "zustand": "4.x"
}
```

---

## Контакты

- **Репозиторий**: https://github.com/IlyaKhar/mes
- **Production**: https://mes-delta.vercel.app
- **Документ**: `TECHNICAL_SPECIFICATION.md` в корне репозитория

---

*Документ актуален на дату последнего коммита в `main`. Любые изменения функционала обязаны сопровождаться обновлением соответствующего раздела ТЗ.*
