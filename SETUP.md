# NEOS: запуск и деплой

## 1. Установка зависимостей

```bash
npm install
```

Если PostgreSQL нужен локально, подними контейнер:

```bash
docker run --name neos-postgres \
  -e POSTGRES_USER=neos \
  -e POSTGRES_PASSWORD=neos \
  -e POSTGRES_DB=neos \
  -p 5432:5432 \
  -d postgres:16
```

## 2. Настройка `.env`

Скопируй пример:

```bash
cp .env.example .env
```

Минимальный локальный `.env`:

```env
DATABASE_URL="postgresql://neos:neos@localhost:5432/neos?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-with-openssl-rand-base64-32"

PUSHER_APP_ID="your_pusher_app_id"
PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

AWS_REGION="eu-central-1"
AWS_S3_BUCKET="your-s3-bucket"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"

CRON_SECRET="change-me-local-secret"
```

Сгенерировать `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 3. Миграции и seed

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

После seed доступны пользователи:

```text
admin@neos.local / Neos12345!
anna@neos.local / Neos12345!
```

Запуск:

```bash
npm run dev
```

Открыть:

```text
http://localhost:3000
```

## 4. Проверка

```bash
npx prisma validate
npm run lint
npm run build
```

Проверка админки:

1. Войди как `admin@neos.local`.
2. Открой `/admin`.
3. Проверь таблицу пользователей, метрики и логи.

Проверка обычного пользователя:

1. Войди как `anna@neos.local`.
2. Попробуй открыть `/admin`.
3. Middleware должен вернуть на главную.

## 5. Деплой на Vercel

1. Создай внешний PostgreSQL: Neon, Supabase, Railway или Vercel Postgres.
2. Скопируй connection string в `DATABASE_URL`.
3. В Vercel Project Settings добавь переменные:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `PUSHER_APP_ID`
   - `PUSHER_SECRET`
   - `NEXT_PUBLIC_PUSHER_KEY`
   - `NEXT_PUBLIC_PUSHER_CLUSTER`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `CRON_SECRET`
4. Перед первым деплоем локально или через CI выполни:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

5. Для cron-эскалации тикетов настрой Vercel Cron на:

```text
/api/cron/escalate-tickets
```

И передавай header:

```text
Authorization: Bearer <CRON_SECRET>
```

## 6. Что важно

- Dashboard больше не использует моковые массивы: данные идут через Prisma.
- Login работает через NextAuth Credentials.
- `/admin` доступен только `ADMIN`.
- Если база недоступна, пользователь увидит красивый error boundary.
