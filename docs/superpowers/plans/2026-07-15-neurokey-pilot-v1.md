# NeuRoKey Пилот v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Веб-тренажёр NeuRoKey для детей 11–14 лет: 3 трёхслойных упражнения, rule-based адаптивность, детский + родительский интерфейсы, подписка ЮKassa с 3-дневным триалом.

**Architecture:** Монолит Next.js 15 (App Router): UI + API-роуты в одном репозитории. SQLite через Prisma. Ядро (подбор сессии, начисление очков, статусы подписки) — чистые функции в `src/lib/`, покрытые unit-тестами. UI-экраны потребляют API-роуты.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma + SQLite, NextAuth (credentials), ЮKassa REST API, Vitest, Playwright.

## Global Constraints

- Спека: `docs/superpowers/specs/2026-07-15-neurokey-pilot-design.md` — источник истины.
- Язык интерфейса: русский. Код, идентификаторы, коммиты — английский.
- Цвета: primary `#6366F1`, secondary `#06B6D4`. Шрифт Inter. Детский UI: текст ≥18px, touch targets ≥44px.
- Никаких красных крестов/штрафов при ошибке ребёнка — только подсказка и повтор.
- Сессия = 3 упражнения. Типы: `comic`, `data`, `robot`. Уровни: 1–3.
- Когнитивные шкалы: `attention`, `memory`, `logic`, `control` (0–100).
- Подписка: статусы `trial | active | past_due | expired | canceled`; триал 3 дня (конфиг в БД `Config.trialDays`); тариф 299 ₽/мес; free tier после триала = 1 упражнение в день.
- TDD: каждая задача начинается с падающего теста. Коммит после каждой задачи.

---

### Task 1: Скаффолд проекта + схема БД

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env`, `.gitignore`
- Create: `prisma/schema.prisma`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces: Prisma Client с моделями `Parent, Child, Subscription, Exercise, Session, SessionResult, Achievement, Config`; хелпер `db` из `src/lib/db.ts`.

- [ ] **Step 1: Инициализировать проект**

```bash
npx create-next-app@latest neurokey-pilot --typescript --tailwind --app --src-dir --no-eslint --use-npm
cd neurokey-pilot
npm i prisma @prisma/client next-auth@beta bcryptjs zod
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths @types/bcryptjs playwright @playwright/test
npx shadcn@latest init -d
npx shadcn@latest add button card progress badge input dialog
```

Проект создаётся в подпапке `neurokey-pilot/` внутри репозитория NeuRoKey.

- [ ] **Step 2: Написать схему Prisma**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // file:./dev.db
}

model Parent {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  children     Child[]
  subscription Subscription?
}

model Child {
  id           String        @id @default(cuid())
  parentId     String
  parent       Parent        @relation(fields: [parentId], references: [id])
  name         String
  age          Int
  pin          String        // 4 digits
  mascotLevel  Int           @default(1)
  streak       Int           @default(0)
  lastSessionAt DateTime?
  sessions     Session[]
  achievements Achievement[]
}

model Subscription {
  id              String    @id @default(cuid())
  parentId        String    @unique
  parent          Parent    @relation(fields: [parentId], references: [id])
  status          String    @default("trial") // trial|active|past_due|expired|canceled
  trialEndsAt     DateTime
  paymentMethodId String?
  nextBillingAt   DateTime?
  updatedAt       DateTime  @updatedAt
}

model Exercise {
  id          String          @id @default(cuid())
  type        String          // comic|data|robot
  level       Int             // 1..3
  contentJson String          // JSON payload, structure per type
  results     SessionResult[]
}

model Session {
  id            String          @id @default(cuid())
  childId       String
  child         Child           @relation(fields: [childId], references: [id])
  startedAt     DateTime        @default(now())
  finishedAt    DateTime?
  feedbackEmoji String?         // love|good|meh|bad
  results       SessionResult[]
}

model SessionResult {
  id          String   @id @default(cuid())
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id])
  exerciseId  String
  exercise    Exercise @relation(fields: [exerciseId], references: [id])
  accuracy    Float    // 0..1
  durationSec Int
  scoresJson  String   // {"attention":n,"memory":n,"logic":n,"control":n}
}

model Achievement {
  id       String   @id @default(cuid())
  childId  String
  child    Child    @relation(fields: [childId], references: [id])
  badgeKey String   // streak3|streak7|firstSession|level2|level3|sessions10
  earnedAt DateTime @default(now())

  @@unique([childId, badgeKey])
}

model Config {
  key   String @id
  value String
}
```

- [ ] **Step 3: Создать `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 4: Написать падающий тест схемы**

`tests/unit/schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("schema", () => {
  it("creates parent with trial subscription and child", async () => {
    const parent = await db.parent.create({
      data: {
        email: `t${Date.now()}@test.ru`,
        passwordHash: "x",
        subscription: {
          create: { trialEndsAt: new Date(Date.now() + 3 * 864e5) },
        },
        children: { create: { name: "Маша", age: 12, pin: "1234" } },
      },
      include: { subscription: true, children: true },
    });
    expect(parent.subscription?.status).toBe("trial");
    expect(parent.children[0].mascotLevel).toBe(1);
  });
});
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 5: Прогнать миграцию и тест**

```bash
npx prisma migrate dev --name init
npx vitest run tests/unit/schema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js app with Prisma schema"
```

---

### Task 2: Сиды контента упражнений (90 записей)

**Files:**
- Create: `prisma/seed.ts`, `src/content/comics.ts`, `src/content/dataTasks.ts`, `src/content/robotTasks.ts`, `src/lib/exercise-types.ts`
- Test: `tests/unit/seed-content.test.ts`

**Interfaces:**
- Produces: типы контента и 10×3 вариантов на каждый тип.

```ts
// src/lib/exercise-types.ts
export type CognitiveScores = { attention: number; memory: number; logic: number; control: number };

export type ComicContent = {
  title: string;
  panels: { image: string; speech: string | null }[]; // null = скрытая реплика
  hiddenPanelIndex: number;
  options: string[];       // 3 варианта реплики
  correctIndex: number;
};

export type DataContent = {
  title: string;
  chart: { labels: string[]; values: number[]; yLabel: string };
  questions: { text: string; options: string[]; correctIndex: number }[]; // 2-3 вопроса
};

export type RobotContent = {
  title: string;
  grid: string[];          // строки поля: "." пусто, "#" ловушка, "S" старт, "F" финиш
  energyLimit: number;     // макс. число команд
  commands: ("up" | "down" | "left" | "right")[]; // доступные
};
```

- [ ] **Step 1: Написать падающий тест на объём и валидность сидов**

`tests/unit/seed-content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { comics } from "@/content/comics";
import { dataTasks } from "@/content/dataTasks";
import { robotTasks } from "@/content/robotTasks";

describe("seed content", () => {
  it("has 10 variants per level per type", () => {
    for (const pool of [comics, dataTasks, robotTasks]) {
      for (const level of [1, 2, 3] as const) {
        expect(pool.filter((x) => x.level === level)).toHaveLength(10);
      }
    }
  });
  it("comic correctIndex is valid", () => {
    for (const c of comics) {
      expect(c.content.correctIndex).toBeGreaterThanOrEqual(0);
      expect(c.content.correctIndex).toBeLessThan(c.content.options.length);
    }
  });
  it("robot grids contain start and finish", () => {
    for (const r of robotTasks) {
      const s = r.content.grid.join("");
      expect(s).toContain("S");
      expect(s).toContain("F");
    }
  });
});
```

- [ ] **Step 2: Написать контент**

Каждый файл экспортирует `{ level: 1|2|3; content: <Type>Content }[]` — по 30 записей. Контент рукописный, на русском, возраст 11–14. Уровень отличается: комикс — длина и тонкость логической связи; данные — сложность графика и вопросы-ловушки («нельзя заключить»); робот — размер поля (5×5 / 6×6 / 7×7), число ловушек и запас энергии. Изображения панелей комикса — эмодзи-сцены в тексте (`image: "🏫🌧️"`), без файлов картинок в v1.

Пример записи (`src/content/comics.ts`, полный пул пишется по этому образцу):

```ts
import type { ComicContent } from "@/lib/exercise-types";

export const comics: { level: 1 | 2 | 3; content: ComicContent }[] = [
  {
    level: 1,
    content: {
      title: "Пропавший рюкзак",
      panels: [
        { image: "🏫", speech: "Кто-то взял мой рюкзак!" },
        { image: "🧒", speech: "Я видел Диму у шкафчиков." },
        { image: "🎒", speech: null },
        { image: "😅", speech: "Точно! Спасибо!" },
      ],
      hiddenPanelIndex: 2,
      options: [
        "Дима: «Это не я, но твой рюкзак висит в спортзале — ты забыл его после физры».",
        "Дима: «Я не знаю, о чём ты».",
        "Дима: «Купи новый рюкзак».",
      ],
      correctIndex: 0,
    },
  },
  // ... ещё 29 записей
];
```

- [ ] **Step 3: Написать `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import { comics } from "../src/content/comics";
import { dataTasks } from "../src/content/dataTasks";
import { robotTasks } from "../src/content/robotTasks";

const db = new PrismaClient();

async function main() {
  await db.exercise.deleteMany();
  const rows = [
    ...comics.map((c) => ({ type: "comic", level: c.level, contentJson: JSON.stringify(c.content) })),
    ...dataTasks.map((c) => ({ type: "data", level: c.level, contentJson: JSON.stringify(c.content) })),
    ...robotTasks.map((c) => ({ type: "robot", level: c.level, contentJson: JSON.stringify(c.content) })),
  ];
  await db.exercise.createMany({ data: rows });
  await db.config.upsert({
    where: { key: "trialDays" },
    update: {},
    create: { key: "trialDays", value: "3" },
  });
  console.log(`Seeded ${rows.length} exercises`);
}
main().finally(() => db.$disconnect());
```

В `package.json`: `"prisma": { "seed": "npx tsx prisma/seed.ts" }` (добавить dev-зависимость `tsx`).

- [ ] **Step 4: Прогнать тесты и сид**

```bash
npx vitest run tests/unit/seed-content.test.ts   # PASS
npx prisma db seed                               # Seeded 90 exercises
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add 90 hand-authored exercise variants and seed script"
```

---

### Task 3: Ядро — подбор сессии и начисление очков

**Files:**
- Create: `src/lib/engine.ts`
- Test: `tests/unit/engine.test.ts`

**Interfaces:**
- Produces:

```ts
export type ExerciseType = "comic" | "data" | "robot";

// Уровень для типа: >80% точности 3 раза подряд на уровне → +1; <50% → −1. Диапазон 1..3.
export function nextLevel(history: { level: number; accuracy: number }[], current: number): number;

// Ротация: тип первого упражнения вчерашней сессии не ставится первым сегодня.
export function pickSessionTypes(lastFirstType: ExerciseType | null): [ExerciseType, ExerciseType, ExerciseType];

// Очки по шкалам за результат: базовые веса типа × точность × множитель уровня.
export function computeScores(type: ExerciseType, level: number, accuracy: number): CognitiveScores;

// Агрегация шкал ребёнка за период в проценты 0..100 и дельту к прошлой неделе.
export function aggregateWeek(results: { scoresJson: string; createdAt: Date }[], now: Date):
  { current: CognitiveScores; delta: CognitiveScores };

// Стрик: +1 если последняя сессия была вчера, сброс в 1 если раньше, без изменений если сегодня уже была.
export function nextStreak(lastSessionAt: Date | null, streak: number, now: Date): number;

// Бейджи, заработанные после сессии.
export function earnedBadges(input: { totalSessions: number; streak: number; maxLevel: number }): string[];
```

Веса типов (фиксируем): `comic → {attention:1, memory:2, logic:3, control:1}`, `data → {attention:2, memory:1, logic:3, control:2}`, `robot → {attention:2, memory:2, logic:2, control:3}`. Очки = вес × точность × уровень.

- [ ] **Step 1: Написать падающие тесты**

`tests/unit/engine.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { nextLevel, pickSessionTypes, computeScores, nextStreak, earnedBadges } from "@/lib/engine";

describe("nextLevel", () => {
  const hi = { level: 2, accuracy: 0.9 };
  const lo = { level: 2, accuracy: 0.4 };
  it("levels up after three >80% in a row at current level", () =>
    expect(nextLevel([hi, hi, hi], 2)).toBe(3));
  it("does not level up after two", () => expect(nextLevel([hi, hi], 2)).toBe(2));
  it("levels down on <50%", () => expect(nextLevel([lo], 2)).toBe(1));
  it("clamps at 3 and 1", () => {
    expect(nextLevel([{ level: 3, accuracy: 1 }, { level: 3, accuracy: 1 }, { level: 3, accuracy: 1 }], 3)).toBe(3);
    expect(nextLevel([{ level: 1, accuracy: 0.1 }], 1)).toBe(1);
  });
});

describe("pickSessionTypes", () => {
  it("returns all three types once", () =>
    expect([...pickSessionTypes(null)].sort()).toEqual(["comic", "data", "robot"]));
  it("does not start with yesterday's first type", () =>
    expect(pickSessionTypes("comic")[0]).not.toBe("comic"));
});

describe("computeScores", () => {
  it("scales with accuracy and level", () => {
    const s = computeScores("robot", 2, 0.5);
    expect(s.control).toBe(3);   // 3 * 0.5 * 2
    expect(s.logic).toBe(2);     // 2 * 0.5 * 2
  });
});

describe("nextStreak", () => {
  const now = new Date("2026-07-15T10:00:00Z");
  it("increments when last session was yesterday", () =>
    expect(nextStreak(new Date("2026-07-14T18:00:00Z"), 4, now)).toBe(5));
  it("resets to 1 after a gap", () =>
    expect(nextStreak(new Date("2026-07-10T18:00:00Z"), 4, now)).toBe(1));
  it("keeps value if already today", () =>
    expect(nextStreak(new Date("2026-07-15T08:00:00Z"), 4, now)).toBe(4));
  it("starts at 1 for first session", () => expect(nextStreak(null, 0, now)).toBe(1));
});

describe("earnedBadges", () => {
  it("awards firstSession and streak badges", () => {
    expect(earnedBadges({ totalSessions: 1, streak: 1, maxLevel: 1 })).toContain("firstSession");
    expect(earnedBadges({ totalSessions: 5, streak: 3, maxLevel: 2 })).toEqual(
      expect.arrayContaining(["streak3", "level2"]),
    );
  });
});
```

- [ ] **Step 2: Прогнать — убедиться, что падают** (`engine.ts` не существует).

- [ ] **Step 3: Реализовать `src/lib/engine.ts`**

```ts
import type { CognitiveScores } from "@/lib/exercise-types";

export type ExerciseType = "comic" | "data" | "robot";

const TYPE_WEIGHTS: Record<ExerciseType, CognitiveScores> = {
  comic: { attention: 1, memory: 2, logic: 3, control: 1 },
  data: { attention: 2, memory: 1, logic: 3, control: 2 },
  robot: { attention: 2, memory: 2, logic: 2, control: 3 },
};

export function nextLevel(history: { level: number; accuracy: number }[], current: number): number {
  const last = history[history.length - 1];
  if (last && last.accuracy < 0.5) return Math.max(1, current - 1);
  const recent = history.slice(-3);
  if (recent.length === 3 && recent.every((h) => h.level === current && h.accuracy > 0.8))
    return Math.min(3, current + 1);
  return current;
}

export function pickSessionTypes(lastFirstType: ExerciseType | null): [ExerciseType, ExerciseType, ExerciseType] {
  const all: ExerciseType[] = ["comic", "data", "robot"];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  if (lastFirstType && shuffled[0] === lastFirstType) {
    const j = 1 + Math.floor(Math.random() * 2);
    [shuffled[0], shuffled[j]] = [shuffled[j], shuffled[0]];
  }
  return shuffled as [ExerciseType, ExerciseType, ExerciseType];
}

export function computeScores(type: ExerciseType, level: number, accuracy: number): CognitiveScores {
  const w = TYPE_WEIGHTS[type];
  const f = (x: number) => Math.round(x * accuracy * level * 100) / 100;
  return { attention: f(w.attention), memory: f(w.memory), logic: f(w.logic), control: f(w.control) };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function nextStreak(lastSessionAt: Date | null, streak: number, now: Date): number {
  if (!lastSessionAt) return 1;
  if (dayKey(lastSessionAt) === dayKey(now)) return streak;
  const yesterday = new Date(now.getTime() - 864e5);
  return dayKey(lastSessionAt) === dayKey(yesterday) ? streak + 1 : 1;
}

export function earnedBadges(input: { totalSessions: number; streak: number; maxLevel: number }): string[] {
  const out: string[] = [];
  if (input.totalSessions >= 1) out.push("firstSession");
  if (input.totalSessions >= 10) out.push("sessions10");
  if (input.streak >= 3) out.push("streak3");
  if (input.streak >= 7) out.push("streak7");
  if (input.maxLevel >= 2) out.push("level2");
  if (input.maxLevel >= 3) out.push("level3");
  return out;
}

export function aggregateWeek(
  results: { scoresJson: string; createdAt: Date }[],
  now: Date,
): { current: CognitiveScores; delta: CognitiveScores } {
  const week = 7 * 864e5;
  const zero: CognitiveScores = { attention: 0, memory: 0, logic: 0, control: 0 };
  const sum = (rs: typeof results) =>
    rs.reduce((acc, r) => {
      const s = JSON.parse(r.scoresJson) as CognitiveScores;
      return {
        attention: acc.attention + s.attention,
        memory: acc.memory + s.memory,
        logic: acc.logic + s.logic,
        control: acc.control + s.control,
      };
    }, zero);
  // нормировка: 100 = максимум очков за 7 идеальных сессий (3 упр. уровня 3, вес 3)
  const MAX = 7 * 3 * 3 * 3;
  const pct = (s: CognitiveScores): CognitiveScores => ({
    attention: Math.min(100, Math.round((s.attention / MAX) * 100)),
    memory: Math.min(100, Math.round((s.memory / MAX) * 100)),
    logic: Math.min(100, Math.round((s.logic / MAX) * 100)),
    control: Math.min(100, Math.round((s.control / MAX) * 100)),
  });
  const cur = pct(sum(results.filter((r) => now.getTime() - r.createdAt.getTime() < week)));
  const prev = pct(sum(results.filter((r) => {
    const age = now.getTime() - r.createdAt.getTime();
    return age >= week && age < 2 * week;
  })));
  return {
    current: cur,
    delta: {
      attention: cur.attention - prev.attention,
      memory: cur.memory - prev.memory,
      logic: cur.logic - prev.logic,
      control: cur.control - prev.control,
    },
  };
}
```

Примечание: `SessionResult` не имеет `createdAt` в схеме Task 1 — добавить поле `createdAt DateTime @default(now())` в модель `SessionResult` и прогнать `npx prisma migrate dev --name result-createdat` в этом таске.

- [ ] **Step 4: Прогнать тесты** — `npx vitest run tests/unit/engine.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: rule-based engine (levels, rotation, scores, streak, badges)"
```

---

### Task 4: Аутентификация — родитель (NextAuth) и ребёнок (профиль+PIN)

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/register/route.ts`, `src/app/api/child-login/route.ts`, `src/lib/child-session.ts`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: `db` (Task 1).
- Produces:
  - `POST /api/register` `{email, password, childName, childAge, childPin}` → создаёт Parent + Child + Subscription(trial, trialEndsAt = now + Config.trialDays), 200 `{ok:true}`; 409 если email занят.
  - NextAuth credentials-провайдер для родителя (session JWT, `session.user.parentId`).
  - `POST /api/child-login` `{childId, pin}` → ставит httpOnly-cookie `nk_child=<childId>` (подписанную HMAC, секрет `AUTH_SECRET`); 401 при неверном PIN.
  - `getChildId(req): string | null` из `src/lib/child-session.ts` — проверка cookie в детских API.

- [ ] **Step 1: Падающий интеграционный тест**

`tests/integration/auth.test.ts` (вызываем route-handlers напрямую как функции):

```ts
import { describe, it, expect } from "vitest";
import { POST as register } from "@/app/api/register/route";
import { POST as childLogin } from "@/app/api/child-login/route";
import { db } from "@/lib/db";

const json = (body: unknown) =>
  new Request("http://test", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

describe("registration", () => {
  it("creates parent, child and trial subscription", async () => {
    const email = `p${Date.now()}@test.ru`;
    const res = await register(json({ email, password: "secret123", childName: "Ваня", childAge: 12, childPin: "4321" }));
    expect(res.status).toBe(200);
    const parent = await db.parent.findUnique({ where: { email }, include: { subscription: true, children: true } });
    expect(parent?.subscription?.status).toBe("trial");
    expect(parent?.subscription?.trialEndsAt.getTime()).toBeGreaterThan(Date.now());
    expect(parent?.children[0].name).toBe("Ваня");
  });
  it("rejects duplicate email with 409", async () => {
    const email = `dup${Date.now()}@test.ru`;
    await register(json({ email, password: "secret123", childName: "А", childAge: 11, childPin: "0000" }));
    const res = await register(json({ email, password: "secret123", childName: "Б", childAge: 11, childPin: "0000" }));
    expect(res.status).toBe(409);
  });
});

describe("child login", () => {
  it("sets cookie on correct pin, 401 on wrong", async () => {
    const email = `c${Date.now()}@test.ru`;
    await register(json({ email, password: "secret123", childName: "Оля", childAge: 13, childPin: "7777" }));
    const child = (await db.parent.findUnique({ where: { email }, include: { children: true } }))!.children[0];
    const ok = await childLogin(json({ childId: child.id, pin: "7777" }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toContain("nk_child=");
    const bad = await childLogin(json({ childId: child.id, pin: "0000" }));
    expect(bad.status).toBe(401);
  });
});
```

- [ ] **Step 2: Прогнать — FAIL** (роуты не существуют).

- [ ] **Step 3: Реализовать**

`src/app/api/register/route.ts`:

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  childName: z.string().min(1),
  childAge: z.number().int().min(11).max(14),
  childPin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { email, password, childName, childAge, childPin } = parsed.data;
  if (await db.parent.findUnique({ where: { email } }))
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  const trialDays = Number((await db.config.findUnique({ where: { key: "trialDays" } }))?.value ?? "3");
  await db.parent.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      subscription: { create: { trialEndsAt: new Date(Date.now() + trialDays * 864e5) } },
      children: { create: { name: childName, age: childAge, pin: childPin } },
    },
  });
  return NextResponse.json({ ok: true });
}
```

`src/lib/child-session.ts` — подпись `childId` через `crypto.createHmac("sha256", process.env.AUTH_SECRET!)`, cookie `nk_child=<id>.<sig>; HttpOnly; Path=/; Max-Age=2592000`; `getChildId` проверяет подпись и возвращает id либо null. `src/app/api/child-login/route.ts` сверяет PIN (`db.child.findUnique`) и ставит cookie через `NextResponse.json(...).cookies.set(...)`. NextAuth: credentials-провайдер `authorize` сверяет bcrypt-хеш, `jwt`/`session` колбэки кладут `parentId`.

- [ ] **Step 4: Прогнать тесты** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parent auth (NextAuth) and child profile+PIN login"
```

---

### Task 5: Гейтинг подписки (trial / free tier)

**Files:**
- Create: `src/lib/access.ts`
- Test: `tests/unit/access.test.ts`

**Interfaces:**
- Consumes: модель `Subscription`, `Session` (Task 1).
- Produces:

```ts
export type Access = { allowed: boolean; reason: "ok" | "free_tier_limit" | "expired_soft"; exercisesAllowed: 1 | 3 };
// trial (не истёк) или active/past_due → 3 упражнения.
// trial истёк / expired / canceled → free tier: 1 упражнение, и только если сегодня ещё не было сессии.
export function checkAccess(sub: { status: string; trialEndsAt: Date }, sessionsToday: number, now: Date): Access;
```

- [ ] **Step 1: Падающие тесты**

```ts
import { describe, it, expect } from "vitest";
import { checkAccess } from "@/lib/access";

const now = new Date("2026-07-15T10:00:00Z");
const future = new Date("2026-07-18T10:00:00Z");
const past = new Date("2026-07-10T10:00:00Z");

describe("checkAccess", () => {
  it("trial not expired → full session", () =>
    expect(checkAccess({ status: "trial", trialEndsAt: future }, 5, now)).toEqual({ allowed: true, reason: "ok", exercisesAllowed: 3 }));
  it("active → full", () =>
    expect(checkAccess({ status: "active", trialEndsAt: past }, 0, now).exercisesAllowed).toBe(3));
  it("past_due keeps access (grace)", () =>
    expect(checkAccess({ status: "past_due", trialEndsAt: past }, 0, now).allowed).toBe(true));
  it("expired trial → free tier one per day", () => {
    expect(checkAccess({ status: "trial", trialEndsAt: past }, 0, now)).toEqual({ allowed: true, reason: "ok", exercisesAllowed: 1 });
    expect(checkAccess({ status: "trial", trialEndsAt: past }, 1, now)).toEqual({ allowed: false, reason: "free_tier_limit", exercisesAllowed: 1 });
  });
  it("canceled → free tier", () =>
    expect(checkAccess({ status: "canceled", trialEndsAt: past }, 0, now).exercisesAllowed).toBe(1));
});
```

- [ ] **Step 2: FAIL → Step 3: Реализовать**

```ts
export type Access = { allowed: boolean; reason: "ok" | "free_tier_limit" | "expired_soft"; exercisesAllowed: 1 | 3 };

export function checkAccess(
  sub: { status: string; trialEndsAt: Date },
  sessionsToday: number,
  now: Date,
): Access {
  const fullAccess =
    sub.status === "active" ||
    sub.status === "past_due" ||
    (sub.status === "trial" && sub.trialEndsAt.getTime() > now.getTime());
  if (fullAccess) return { allowed: true, reason: "ok", exercisesAllowed: 3 };
  if (sessionsToday >= 1) return { allowed: false, reason: "free_tier_limit", exercisesAllowed: 1 };
  return { allowed: true, reason: "ok", exercisesAllowed: 1 };
}
```

- [ ] **Step 4: PASS → Step 5: Commit** — `git commit -m "feat: subscription access gating (trial/free tier)"`

---

### Task 6: API сессий

**Files:**
- Create: `src/app/api/session/start/route.ts`, `src/app/api/session/[id]/submit/route.ts`, `src/app/api/session/[id]/finish/route.ts`
- Test: `tests/integration/session-api.test.ts`

**Interfaces:**
- Consumes: `getChildId` (Task 4), `checkAccess` (Task 5), `pickSessionTypes`, `nextLevel`, `computeScores`, `nextStreak`, `earnedBadges` (Task 3).
- Produces:
  - `POST /api/session/start` → `{ sessionId, exercises: {id, type, level, content}[] }` (1 или 3 по access). Выбор упражнения: случайный из пула типа на текущем уровне ребёнка для этого типа (уровень по `nextLevel` от истории результатов этого типа). 403 `{reason:"free_tier_limit"}` при лимите. Незавершённая сессия младше 1 часа возвращается как есть (продолжение), старше — закрывается и создаётся новая.
  - `POST /api/session/:id/submit` `{exerciseId, accuracy, durationSec}` → пишет `SessionResult` со `scoresJson = computeScores(...)`, 200 `{ok:true}`.
  - `POST /api/session/:id/finish` `{feedbackEmoji}` → ставит `finishedAt`, обновляет `streak` (по `nextStreak`), `mascotLevel = 1 + floor(totalSessions/5)` (кэп 5), создаёт новые `Achievement` (upsert по `@@unique`), возвращает `{streak, mascotLevel, newBadges, summary}` где `summary` — человекочитаемые строки «что развивал».

- [ ] **Step 1: Падающий интеграционный тест** — полный цикл: register → child-login (взять cookie) → start (3 упражнения) → 3× submit → finish; проверки: `SessionResult` 3 шт., `streak === 1`, `newBadges` содержит `firstSession`; повторный start в тот же день при `expired`-подписке → 403 (подготовить подписку через `db.subscription.update({status:"canceled"})` и одну сессию). Тест пишется в стиле Task 4 (route-handlers как функции, cookie передаётся в `Request` headers).

- [ ] **Step 2: FAIL → Step 3: Реализовать роуты.** Ключевой фрагмент `start`:

```ts
const childId = getChildId(req);
if (!childId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
const child = await db.child.findUnique({ where: { id: childId }, include: { parent: { include: { subscription: true } } } });
const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
const sessionsToday = await db.session.count({ where: { childId, startedAt: { gte: todayStart }, finishedAt: { not: null } } });
const access = checkAccess(child!.parent.subscription!, sessionsToday, new Date());
if (!access.allowed) return NextResponse.json({ reason: access.reason }, { status: 403 });

const open = await db.session.findFirst({ where: { childId, finishedAt: null }, include: { results: true } });
if (open && Date.now() - open.startedAt.getTime() < 3600_000) return NextResponse.json(await hydrate(open));
if (open) await db.session.update({ where: { id: open.id }, data: { finishedAt: new Date() } });

const lastFirst = await lastFirstExerciseType(childId); // тип первого результата последней завершённой сессии
const types = pickSessionTypes(lastFirst).slice(0, access.exercisesAllowed);
const exercises = await Promise.all(types.map(async (type) => {
  const level = await currentLevelFor(childId, type); // nextLevel(история результатов типа, текущий)
  const pool = await db.exercise.findMany({ where: { type, level } });
  return pool[Math.floor(Math.random() * pool.length)];
}));
const session = await db.session.create({ data: { childId } });
return NextResponse.json({
  sessionId: session.id,
  exercises: exercises.map((e) => ({ id: e.id, type: e.type, level: e.level, content: JSON.parse(e.contentJson) })),
});
```

- [ ] **Step 4: PASS → Step 5: Commit** — `git commit -m "feat: session lifecycle API (start/submit/finish)"`

---

### Task 7: Компонент упражнения «Комикс-детектив»

**Files:**
- Create: `src/components/exercises/ComicExercise.tsx`, `src/components/exercises/types.ts`
- Test: `tests/unit/comic-exercise.test.tsx` (добавить `environment: "jsdom"` для `.test.tsx` в vitest-конфиге, `npm i -D @testing-library/react jsdom`)

**Interfaces:**
- Produces: контракт всех компонентов упражнений —

```ts
// src/components/exercises/types.ts
export type ExerciseResult = { accuracy: number; durationSec: number };
export type ExerciseProps<C> = { content: C; onComplete: (r: ExerciseResult) => void };
```

`ComicExercise` рендерит панели (эмодзи-сцена + реплика), для скрытой — 3 кнопки-варианта. Неверный вариант: кнопка мягко подсвечивается серым, показывается подсказка «Перечитай предыдущую реплику 🙂», попытки не ограничены. `accuracy = 1` с первой попытки, `0.6` со второй, `0.3` с третьей+. По верному ответу — `onComplete`.

- [ ] **Step 1: Падающий тест** — рендер с фикстурой из `comics[0]`, клик по неверному варианту → подсказка видна и `onComplete` не вызван; клик по верному → `onComplete` с `accuracy: 0.6`.
- [ ] **Step 2: FAIL → Step 3: Реализовать** (клиентский компонент, Tailwind; текст ≥18px, кнопки ≥44px высоты, transition 200ms).
- [ ] **Step 4: PASS → Step 5: Commit** — `git commit -m "feat: comic exercise component"`

---

### Task 8: Компонент «Аналитик данных»

**Files:**
- Create: `src/components/exercises/DataExercise.tsx`, `src/components/exercises/BarChart.tsx`
- Test: `tests/unit/data-exercise.test.tsx`

**Interfaces:**
- Consumes: `ExerciseProps<DataContent>` (Task 7).
- Produces: `BarChart` — чистый SVG-бар-чарт без внешних библиотек (`labels`, `values`, `yLabel`; цвет `#6366F1`).

Механика: показывается график, затем вопросы по одному (2–3). Каждый вопрос — 3 варианта. `accuracy` = среднее по вопросам (та же шкала попыток, что в Task 7). После последнего вопроса → `onComplete`.

- [ ] **Step 1: Падающий тест** — фикстура с 2 вопросами: верный ответ на оба с первой попытки → `onComplete({accuracy: 1, ...})`; на втором вопросе первый клик неверный → итог `accuracy = (1 + 0.6) / 2 = 0.8`.
- [ ] **Step 2–4: FAIL → реализация → PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat: data analysis exercise with SVG bar chart"`

---

### Task 9: Компонент «Робо-логика»

**Files:**
- Create: `src/components/exercises/RobotExercise.tsx`, `src/lib/robot-sim.ts`
- Test: `tests/unit/robot-sim.test.ts`, `tests/unit/robot-exercise.test.tsx`

**Interfaces:**
- Consumes: `ExerciseProps<RobotContent>`.
- Produces: `src/lib/robot-sim.ts`:

```ts
export type SimOutcome = "finish" | "trap" | "wall" | "out_of_energy";
// Прогоняет команды по grid. Возвращает исход и путь (для анимации).
export function simulate(grid: string[], commands: ("up"|"down"|"left"|"right")[], energyLimit: number):
  { outcome: SimOutcome; path: { x: number; y: number }[] };
```

UI: сетка-поле, панель команд (кнопки-стрелки добавляют команду в очередь, счётчик энергии убывает), кнопка «Запустить» анимирует робота по `path` (CSS-переход 200ms на клетку). Ловушка/стена/нехватка энергии — робот мигает, реплика маскота «Почти! Попробуй другой маршрут», очередь очищается, попытки не ограничены. `accuracy` по числу запусков: 1 / 0.6 / 0.3 (как в Task 7).

- [ ] **Step 1: Падающие тесты `robot-sim`** — грид `["S..","#.#","..F"]`: путь `right,right,down,down` → `finish`; `down` → `trap`; `up` → `wall`; лимит энергии 2 с командами длиннее → `out_of_energy`.
- [ ] **Step 2–4: FAIL → реализация → PASS** (сначала `robot-sim`, затем компонент).
- [ ] **Step 5: Commit** — `git commit -m "feat: robot logic exercise with simulator"`

---

### Task 10: Детские экраны (вход, главный, сессия, итоги, прогресс)

**Files:**
- Create: `src/app/(child)/child/page.tsx` (выбор профиля + PIN), `src/app/(child)/child/home/page.tsx`, `src/app/(child)/child/session/page.tsx`, `src/app/(child)/child/progress/page.tsx`, `src/components/Mascot.tsx`, `src/lib/mascot-lines.ts`
- Modify: `src/app/layout.tsx` (шрифт Inter, фон)
- Test: `tests/unit/mascot-lines.test.ts`

**Interfaces:**
- Consumes: API Task 6, компоненты Task 7–9.
- Produces: `getMascotLine(context: "greeting" | "sessionDone" | "comeback" | "levelUp" | "trialEnded"): string` — случайная реплика из статичного пула ≥3 на контекст, на русском, дружелюбный тон без вины.

Экран сессии: получает `exercises` от `/api/session/start`, рендерит по одному через маппинг `type → компонент`, после каждого `onComplete` шлёт `/submit`, после последнего — экран итогов: список «Сегодня ты развивал: внимание, логику…» (из типов упражнений, упрощённым языком), выбор эмодзи (😍😊😐😕 → `love|good|meh|bad`) → `/finish` → показ стрика, новых бейджей, реплики маскота. При 403 `free_tier_limit` — мягкий экран: маскот + «На сегодня всё! Новая тренировка — завтра. Попроси родителя продлить полный доступ». Главный экран: маскот с приветствием, стрик 🔥, большая кнопка «Начать сессию», ссылка «Мои успехи». Прогресс: уровень маскота, сетка бейджей (заработанные цветные, остальные серые).

- [ ] **Step 1: Падающий тест `mascot-lines`** — каждый контекст возвращает непустую строку из своего пула; пулы ≥3 реплик.
- [ ] **Step 2–4: FAIL → реализация → PASS.** Ручная проверка: `npm run dev`, пройти полный флоу ребёнком.
- [ ] **Step 5: Commit** — `git commit -m "feat: child screens (login, home, session flow, progress)"`

---

### Task 11: Родительский дашборд

**Files:**
- Create: `src/app/(parent)/parent/page.tsx` (вход/регистрация — форма на `/api/register` + NextAuth signIn), `src/app/(parent)/parent/dashboard/page.tsx`, `src/app/api/parent/stats/route.ts`, `src/components/ScaleBar.tsx`
- Test: `tests/integration/parent-stats.test.ts`

**Interfaces:**
- Consumes: NextAuth session (Task 4), `aggregateWeek` (Task 3).
- Produces: `GET /api/parent/stats` → `{ children: [{ id, name, streak, sessionsThisWeek, scales: {current, delta} }], subscription: { status, trialEndsAt, nextBillingAt } }` (401 без сессии).

Дашборд: карточка ребёнка → 4 строки `ScaleBar` (название шкалы по-русски, полоса %, дельта «↑12%» зелёным / «↓» серым — не красным), сессий за неделю, стрик. Блок подписки: статус («Пробный период до 18 июля» / «Активна, следующее списание …»), кнопка «Управление подпиской» → Task 12.

- [ ] **Step 1: Падающий тест** — сид: родитель + ребёнок + 2 завершённые сессии с результатами; `GET /api/parent/stats` с mock-сессией → `sessionsThisWeek === 2`, шкалы > 0; без сессии → 401.
- [ ] **Step 2–4: FAIL → реализация → PASS.**
- [ ] **Step 5: Commit** — `git commit -m "feat: parent dashboard with weekly cognitive stats"`

---

### Task 12: Подписка ЮKassa

**Files:**
- Create: `src/lib/yookassa.ts`, `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/webhook/route.ts`, `src/app/api/billing/cancel/route.ts`, `src/lib/billing.ts`, `src/app/(parent)/parent/subscription/page.tsx`
- Test: `tests/unit/billing.test.ts`, `tests/integration/billing-webhook.test.ts`

**Interfaces:**
- Consumes: модель `Subscription`; NextAuth session.
- Produces:
  - `src/lib/yookassa.ts` — тонкий клиент: `createPayment({amount, description, savePaymentMethod, returnUrl, metadata})` и `createRecurringPayment({amount, paymentMethodId, metadata})` через `https://api.yookassa.ru/v3/payments` (Basic auth `YOOKASSA_SHOP_ID:YOOKASSA_SECRET`, `Idempotence-Key: crypto.randomUUID()`). В тестах мокается.
  - `src/lib/billing.ts` — чистая логика переходов статусов:

```ts
export type BillingEvent =
  | { type: "payment.succeeded"; paymentMethodId: string }
  | { type: "payment.canceled" }
  | { type: "cancel_requested" }
  | { type: "grace_expired" };
export function nextSubscriptionState(
  current: { status: string; nextBillingAt: Date | null },
  event: BillingEvent,
  now: Date,
): { status: string; paymentMethodId?: string; nextBillingAt?: Date };
// succeeded → active, nextBillingAt = now + 30д, сохранить paymentMethodId
// canceled(платёж) → past_due (nextBillingAt + 3д грейс уже истёк? → expired)
// cancel_requested → canceled ; grace_expired → expired
```

  - `POST /api/billing/checkout` → создаёт платёж 299 ₽ с `save_payment_method: true`, `metadata: {parentId}`, возвращает `{confirmationUrl}` (redirect ЮKassa).
  - `POST /api/billing/webhook` — принимает `payment.succeeded` / `payment.canceled`, находит подписку по `metadata.parentId`, применяет `nextSubscriptionState`, 200 всегда (идемпотентно).
  - `POST /api/billing/cancel` → `cancel_requested`.
  - Fallback-сверка: при `GET /api/parent/stats` (Task 11 — modify) если `status === "past_due"` и `nextBillingAt + 3д < now` → применить `grace_expired`.

- [ ] **Step 1: Падающие unit-тесты `nextSubscriptionState`** — все переходы из спеки: trial+succeeded→active; active+canceled→past_due; past_due+grace_expired→expired; active+cancel_requested→canceled; повторный succeeded в active → active (идемпотентность, обновляется nextBillingAt).
- [ ] **Step 2: FAIL → Step 3: Реализовать `billing.ts`, `yookassa.ts`, роуты.** Секреты — из `.env`: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET`. Без ключей в dev режиме `checkout` возвращает `{confirmationUrl: "/parent/subscription?mock=success"}` и webhook можно дёрнуть вручную — флаг `BILLING_MOCK=1`.
- [ ] **Step 4: Интеграционный тест webhook** — POST с телом `{event: "payment.succeeded", object: {payment_method: {id: "pm_1"}, metadata: {parentId}}}` → статус подписки в БД `active`, `paymentMethodId === "pm_1"`.
- [ ] **Step 5: Страница подписки** — статус, цена 299 ₽/мес, кнопка «Оформить» (→ checkout → redirect), «Отменить подписку» (один клик, confirm-диалог), история: список платежей не храним в v1 — показываем `nextBillingAt`.
- [ ] **Step 6: Прогнать все тесты** — `npx vitest run` → PASS.
- [ ] **Step 7: Commit** — `git commit -m "feat: YooKassa subscription (checkout, webhook, cancel, grace)"`

---

### Task 13: E2E + полиш

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/child-session.spec.ts`
- Modify: детские экраны (доводка стилей)

**Interfaces:**
- Consumes: всё выше.

- [ ] **Step 1: E2E happy-path** (`BILLING_MOCK=1`, seeded DB): регистрация родителя → выход → детский вход (профиль+PIN) → «Начать сессию» → пройти 3 упражнения (фикстурные ответы: в E2E-режиме сид детерминирован через `Config.e2eSeed`) → эмодзи-фидбек → главный экран показывает стрик 🔥1.
- [ ] **Step 2: Прогнать** — `npx playwright test` → PASS.
- [ ] **Step 3: Полиш-чек по Global Constraints** — прогнать руками: детский текст ≥18px, кнопки ≥44px, контраст WCAG AA (проверить палитру на webaim), нет красных индикаторов ошибок ребёнка, переходы 200–300ms.
- [ ] **Step 4: Обновить README** — как запустить: `npm i && npx prisma migrate dev && npx prisma db seed && npm run dev`; env-переменные (`DATABASE_URL`, `AUTH_SECRET`, `YOOKASSA_*`, `BILLING_MOCK`).
- [ ] **Step 5: Финальный прогон всех тестов и commit**

```bash
npx vitest run && npx playwright test
git add -A && git commit -m "feat: e2e happy path, polish pass, README"
```

---

## Самопроверка плана

- **Покрытие спеки:** упражнения ×3 (Tasks 2, 7–9), rule-based адаптивность (3), мотивация/маскот/бейджи (3, 10), подписка+триал+free tier+грейс+fallback-сверка (5, 12, 11), прерванная сессия 1 час (6), детские экраны 6 шт. (10), родительские 3 шт. (11, 12, 4), тесты unit/integration/E2E (везде + 13), дизайн-константы (Global Constraints + 13). Email-рассылок, ИИ, блокировки — нет, как и в спеке.
- **Типы согласованы:** `ExerciseProps`/`ExerciseResult` (7) используются в 8–10; `checkAccess` (5) в 6; `nextSubscriptionState` (12) в 11 (fallback).
