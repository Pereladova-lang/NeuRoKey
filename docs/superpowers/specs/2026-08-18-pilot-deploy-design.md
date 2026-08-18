# Деплой neurokey-pilot: дизайн

Дата: 2026-08-18

## 1. Контекст

`neurokey-pilot/` (Next.js 15 + Prisma + SQLite dev) — единственный буildable код в
репозитории. Весь TDD-план v1 (`docs/superpowers/plans/2026-07-15-neurokey-pilot-v1.md`)
закрыт: unit + integration тесты (vitest) и e2e happy path (Playwright) проходят,
README описывает dev-запуск. Прод-деплоя ещё не было.

Продуктовая спека (`docs/superpowers/specs/2026-07-15-neurokey-pilot-design.md`, п.6)
называла два варианта — VPS или Vercel — без решения. Этот документ фиксирует
фактический выбор и план для первого прод-деплоя пилота.

## 2. Масштаб и требования

- Публичный пилот с открытой регистрацией, ожидаются сотни пользователей.
- Не требуется реальный биллинг на старте — платежи остаются замоканы
  (`BILLING_MOCK=1`), боевые ключи Robokassa подключаются отдельной задачей позже.
- Домен: авто-домен от провайдера на старте, кастомный домен — будущая задача.

## 3. Провайдер: Railway

Выбран Railway вместо VPS/Vercel:

- В этой среде уже подключён Railway MCP (прямой деплой/логи/переменные из чата) —
  меньше ручного DevOps по сравнению с VPS (nginx/TLS/бэкапы вручную).
- В отличие от Vercel, Railway даёт persistent-процесс, а не serverless-функции — проще
  для Next.js API routes с NextAuth cookies и синхронным Robokassa webhook, без риска
  холодных стартов на детских сессиях.
- Managed Postgres как плагин в том же проекте, без отдельной внешней БД (Neon/Vercel
  Postgres).

Один Railway-проект, два сервиса:

- `neurokey-pilot` — Next.js app (Nixpacks: `npm run build` → `npm run start`)
- `postgres` — managed Postgres plugin, `DATABASE_URL` авто-прокидывается в
  `neurokey-pilot`

## 4. Миграция схемы: SQLite → Postgres

`prisma/schema.prisma`: `datasource.provider` меняется `sqlite` → `postgresql`. Это
меняет и локальную разработку, т.к. Prisma не поддерживает разные провайдеры для
dev/prod в одной схеме без отдельного механизма (`schema.prisma` глобален для проекта).

- Существующие SQLite-миграции в `prisma/migrations/` несовместимы с Postgres.
  Генерируется новая baseline-миграция (`prisma migrate dev --name init_postgres`)
  против чистой Postgres-БД, заменяющая историю миграций.
- Локальная разработка переходит на Postgres через Docker Compose
  (`docker-compose.yml` с сервисом `postgres:16`, `DATABASE_URL` в `.env.example`
  указывает на `localhost`).
- README и `.env.example` обновляются: `docker compose up -d` вместо просто
  `file:./dev.db`.
- Все существующие unit/integration/e2e тесты прогоняются локально против Postgres
  перед тем, как считать миграцию завершённой (в рамках плана деплоя, не отдельной
  задачей) — цель: убедиться, что ничего не сломалось при смене провайдера (типы
  данных, дефолты, специфичные для SQLite выражения в схеме/сидах, если есть).

## 5. Переменные окружения (сервис `neurokey-pilot` в Railway)

- `DATABASE_URL` — авто из сервиса `postgres`
- `AUTH_SECRET` — сгенерировать (`openssl rand -base64 32`), задать вручную в Railway
- `BILLING_MOCK=1`
- `ROBOKASSA_MERCHANT_LOGIN`, `ROBOKASSA_PASSWORD`, `ROBOKASSA_IS_TEST` — заглушки/пусто;
  подключение боевых ключей — отдельная будущая задача, вне этого плана

## 6. CI/CD

- Railway подключается к GitHub-репозиторию: push в `main` триггерит авто-билд и
  авто-деплой сервиса `neurokey-pilot`.
- Добавляется GitHub Actions workflow (`.github/workflows/ci.yml`), запускающий на
  push/PR в `main`: `npm run lint && npx vitest run` внутри `neurokey-pilot/`. Это не
  блокирует Railway-деплой (Railway деплоит независимо от статуса Action), но даёт
  видимый зелёный/красный статус для каждого коммита.
- Playwright e2e не входит в CI-гейт (требует build+start, медленный) — остаётся
  ручным/pre-merge шагом, как сейчас.

## 7. Первый деплой и сидирование

1. Создать Railway-проект, добавить сервис `postgres`.
2. Подключить GitHub-репозиторий к сервису `neurokey-pilot`, задать env-переменные
   из §5.
3. Первый деплой (авто по push либо вручную через Railway MCP/CLI для проверки).
4. Прогнать миграции на прод-БД (`railway run npx prisma migrate deploy`).
5. Засеять 90 упражнений один раз: `railway run npx prisma db seed`.
6. Проверить домен `*.up.railway.app` — регистрация родителя → детский вход → сессия →
   стрик (тот же happy path, что в Playwright e2e, но руками в проде).

## 8. Вне рамок этого плана

- Кастомный домен.
- Боевые ключи Robokassa и отключение `BILLING_MOCK`.
- Автоскейлинг, мониторинг/алерты, бэкапы Postgres сверх дефолтов Railway.
- Возврат к SQLite для dev — сознательно отказываемся, Postgres становится единственной
  БД проекта (dev и prod).
