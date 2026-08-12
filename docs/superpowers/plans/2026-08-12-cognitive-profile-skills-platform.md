# Cognitive Profile Engine и платформенное ядро — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Выделить переиспользуемое ядро пилота (`engine.ts`) в отдельный npm-пакет `packages/neurokey-core` и добавить в него два новых модуля — `CognitiveProfile` (возрасто-агностичный когнитивный профиль) и `Skill` (формат авторской методики нейроадаптации с атрибуцией и научными источниками) — так, чтобы будущие приложения на платформе могли подключать это ядро, не завися от контента и UI пилота.

**Architecture:** npm workspaces внутри существующего монорепо: `neurokey-pilot` и новый `packages/neurokey-core` становятся сестринскими workspace-пакетами под общим корневым `package.json`. `neurokey-core` не имеет билд-шага — экспортирует TypeScript напрямую (`main`/`types` указывают на `src/index.ts`), Next.js транспилирует его через `transpilePackages`, Vitest — через `vite-tsconfig-paths`. Всё в `neurokey-core` — чистые функции без побочных эффектов и без зависимости от Prisma/БД, тестируются юнит-тестами без базы (как сегодня `engine.ts`).

**Tech Stack:** TypeScript, npm workspaces, Vitest. Next.js 16 (App Router) на стороне потребителя (`neurokey-pilot`). Без новых внешних зависимостей.

## Global Constraints

- Спека: `docs/superpowers/specs/2026-08-12-cognitive-profile-skills-platform-design.md` — источник истины.
- Код, идентификаторы, комментарии, коммиты — английский. Комментарии — только там, где неочевидна причина (WHY), не что делает код.
- `packages/neurokey-core` не содержит контента и UI — только методику и правила (engine, cognitive-profile, skill). Контент (`ComicContent`, `DataContent`, `RobotContent`) остаётся в `neurokey-pilot/src/lib/exercise-types.ts`.
- Никаких формулировок медицинской диагностики в коде, комментариях, тестовых данных (`attention`/`memory`/`logic`/`control` — когнитивные шкалы, не клинические показатели).
- `Contributor.sharePercent` — учётное поле, не источник прав; в коде и тестах не подразумевается, что оно само по себе присваивает права.
- Реестр когнитивных шкал (`ScaleId`) остаётся открытым `string`, не enum — пилот использует только `attention | memory | logic | control`, но код не должен захардкоживать это ограничение внутри `neurokey-core`.
- TDD: каждая задача начинается с падающего теста. Коммит после каждой задачи.
- Существующий тест-сьют пилота (`npx vitest run` из `neurokey-pilot/`) должен проходить целиком после каждой задачи — это регресс-проверка, что перенос ядра не сломал пилот.

---

### Task 1: npm workspace + скелет пакета `@neurokey/core`

**Files:**
- Create: `package.json` (корень репозитория)
- Create: `packages/neurokey-core/package.json`
- Create: `packages/neurokey-core/tsconfig.json`
- Create: `packages/neurokey-core/vitest.config.ts`
- Create: `packages/neurokey-core/src/index.ts` (пустой экспорт-заглушка)
- Modify: `neurokey-pilot/package.json` (добавить зависимость на `@neurokey/core`)
- Modify: `neurokey-pilot/next.config.ts` (добавить `transpilePackages`)
- Modify: `neurokey-pilot/tsconfig.json` (добавить path alias)
- Delete: `neurokey-pilot/package-lock.json` (заменяется корневым лок-файлом workspace)

**Interfaces:**
- Produces: workspace-пакет `@neurokey/core`, импортируемый из `neurokey-pilot` как `@neurokey/core`. На этом шаге пакет ничего не экспортирует кроме пустого модуля — используется только для проверки, что связка резолвится.

- [ ] **Step 1: Создать корневой `package.json` с workspaces**

`package.json` (в корне репозитория, рядом с `neurokey-pilot/`):

```json
{
  "name": "neurokey-monorepo",
  "private": true,
  "workspaces": [
    "neurokey-pilot",
    "packages/*"
  ]
}
```

- [ ] **Step 2: Создать скелет пакета `packages/neurokey-core`**

`packages/neurokey-core/package.json`:

```json
{
  "name": "@neurokey/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^4.1.10"
  }
}
```

`packages/neurokey-core/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

`packages/neurokey-core/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

`packages/neurokey-core/src/index.ts`:

```ts
export const CORE_PACKAGE_PLACEHOLDER = true;
```

(Этот экспорт временный — удаляется в Task 2, когда в `index.ts` появляются реальные реэкспорты.)

- [ ] **Step 3: Подключить пакет к `neurokey-pilot`**

В `neurokey-pilot/package.json`, в секцию `dependencies`, добавить:

```json
    "@neurokey/core": "*",
```

В `neurokey-pilot/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@neurokey/core"],
};

export default nextConfig;
```

В `neurokey-pilot/tsconfig.json`, в `compilerOptions.paths`, добавить рядом с существующим `"@/*"`:

```json
    "paths": {
      "@/*": ["./src/*"],
      "@neurokey/core": ["../packages/neurokey-core/src/index.ts"]
    }
```

- [ ] **Step 4: Перейти на единый корневой лок-файл**

```bash
rm neurokey-pilot/package-lock.json
npm install
```

Выполняется из корня репозитория. Команда создаст корневой `package-lock.json` и `node_modules` (с симлинком `node_modules/@neurokey/core` на `packages/neurokey-core`).

- [ ] **Step 5: Проверить, что пилот всё ещё собирается и тестируется из своей папки**

```bash
cd neurokey-pilot
npx vitest run
npm run build
```

Expected: тесты проходят как раньше (мы ещё ничего не переносили), билд проходит без ошибок резолва `@neurokey/core` (пакет пока пустой, но должен резолвиться).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json packages/neurokey-core neurokey-pilot/package.json neurokey-pilot/next.config.ts neurokey-pilot/tsconfig.json
git add neurokey-pilot/package-lock.json  # stages the deletion
git commit -m "chore: set up npm workspace and @neurokey/core package skeleton"
```

---

### Task 2: Перенести `engine.ts` и `CognitiveScores` в `@neurokey/core`

**Files:**
- Create: `packages/neurokey-core/src/exercise-types.ts`
- Create: `packages/neurokey-core/src/engine.ts` (перенесённое содержимое `neurokey-pilot/src/lib/engine.ts`)
- Create: `packages/neurokey-core/tests/engine.test.ts` (перенесённое содержимое `neurokey-pilot/tests/unit/engine.test.ts`)
- Modify: `packages/neurokey-core/src/index.ts`
- Delete: `neurokey-pilot/src/lib/engine.ts`
- Delete: `neurokey-pilot/tests/unit/engine.test.ts`
- Modify: `neurokey-pilot/src/lib/exercise-types.ts` (убрать `CognitiveScores`)
- Modify: `neurokey-pilot/src/lib/parent-stats.ts`
- Modify: `neurokey-pilot/src/lib/session-service.ts`
- Modify: `neurokey-pilot/src/lib/type-labels.ts`
- Modify: `neurokey-pilot/src/app/api/session/start/route.ts`
- Modify: `neurokey-pilot/src/app/api/session/[id]/finish/route.ts`
- Modify: `neurokey-pilot/src/app/api/session/[id]/submit/route.ts`

**Interfaces:**
- Consumes: ничего нового (чистый перенос существующего кода).
- Produces: `@neurokey/core` экспортирует `ExerciseType`, `nextLevel`, `pickSessionTypes`, `computeScores`, `nextStreak`, `earnedBadges`, `aggregateWeek`, `CognitiveScores` — те же сигнатуры, что были у `neurokey-pilot/src/lib/engine.ts`. Все последующие задачи (`neurokey-pilot`, Task 3, Task 4) полагаются на эти имена и типы без изменений.

- [ ] **Step 1: Создать `exercise-types.ts` в пакете (только `CognitiveScores`)**

`packages/neurokey-core/src/exercise-types.ts`:

```ts
export type CognitiveScores = {
  attention: number;
  memory: number;
  logic: number;
  control: number;
};
```

- [ ] **Step 2: Перенести `engine.ts` в пакет**

`packages/neurokey-core/src/engine.ts` — идентичное содержимое `neurokey-pilot/src/lib/engine.ts`, с изменённым первым импортом:

```ts
import type { CognitiveScores } from "./exercise-types";

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

Удалить `neurokey-pilot/src/lib/engine.ts`.

- [ ] **Step 3: Перенести тест `engine.test.ts` в пакет**

`packages/neurokey-core/tests/engine.test.ts` — идентичное содержимое `neurokey-pilot/tests/unit/engine.test.ts`, с изменённым импортом:

```ts
import { describe, it, expect } from "vitest";
import { nextLevel, pickSessionTypes, computeScores, nextStreak, earnedBadges } from "../src/engine";
```

(остальное содержимое файла — без изменений; полный список тестов уже существует в `neurokey-pilot/tests/unit/engine.test.ts` и переносится как есть).

Удалить `neurokey-pilot/tests/unit/engine.test.ts`.

- [ ] **Step 4: Запустить тесты пакета**

```bash
cd packages/neurokey-core
npx vitest run
```

Expected: все перенесённые тесты `engine.test.ts` проходят.

- [ ] **Step 5: Обновить `index.ts` пакета**

`packages/neurokey-core/src/index.ts`:

```ts
export type { CognitiveScores } from "./exercise-types";
export type { ExerciseType } from "./engine";
export {
  nextLevel,
  pickSessionTypes,
  computeScores,
  nextStreak,
  earnedBadges,
  aggregateWeek,
} from "./engine";
```

- [ ] **Step 6: Убрать `CognitiveScores` из пилота, обновить импорты в 6 файлах**

`neurokey-pilot/src/lib/exercise-types.ts` — убрать блок `CognitiveScores` (первые 6 строк), оставить:

```ts
export type ComicContent = {
  title: string;
  panels: { image: string; speech: string | null }[]; // null = скрытая реплика
  hiddenPanelIndex: number;
  options: string[]; // 3 варианта реплики
  correctIndex: number;
};

export type DataContent = {
  title: string;
  chart: { labels: string[]; values: number[]; yLabel: string };
  questions: { text: string; options: string[]; correctIndex: number }[]; // 2-3 вопроса
};

export type RobotContent = {
  title: string;
  grid: string[]; // строки поля: "." пусто, "#" ловушка, "S" старт, "F" финиш
  energyLimit: number; // макс. число команд
  commands: ("up" | "down" | "left" | "right")[]; // доступные
};
```

Заменить импорт в каждом из следующих файлов (старая строка → новая строка):

`neurokey-pilot/src/lib/parent-stats.ts`:
```
- import { aggregateWeek } from "@/lib/engine";
+ import { aggregateWeek } from "@neurokey/core";
```

`neurokey-pilot/src/lib/session-service.ts`:
```
- import { nextLevel, type ExerciseType } from "@/lib/engine";
+ import { nextLevel, type ExerciseType } from "@neurokey/core";
```

`neurokey-pilot/src/lib/type-labels.ts`:
```
- import type { ExerciseType } from "@/lib/engine";
+ import type { ExerciseType } from "@neurokey/core";
```

`neurokey-pilot/src/app/api/session/start/route.ts`:
```
- import { pickSessionTypes, type ExerciseType } from "@/lib/engine";
+ import { pickSessionTypes, type ExerciseType } from "@neurokey/core";
```

`neurokey-pilot/src/app/api/session/[id]/finish/route.ts`:
```
- import { nextStreak, earnedBadges, type ExerciseType } from "@/lib/engine";
+ import { nextStreak, earnedBadges, type ExerciseType } from "@neurokey/core";
```

`neurokey-pilot/src/app/api/session/[id]/submit/route.ts`:
```
- import { computeScores, type ExerciseType } from "@/lib/engine";
+ import { computeScores, type ExerciseType } from "@neurokey/core";
```

Все остальные файлы, импортирующие `@/lib/exercise-types` (`SessionRunner.tsx`, `ComicExercise.tsx`, `DataExercise.tsx`, `RobotExercise.tsx`, `content/comics.ts`, `content/dataTasks.ts`, `content/robotTasks.ts`, тесты `seed-content.test.ts`, `robot-exercise.test.tsx`, `e2e/child-session.spec.ts`) импортируют только `ComicContent`/`DataContent`/`RobotContent` — эти типы остались в `neurokey-pilot/src/lib/exercise-types.ts` без изменений, менять эти файлы не требуется.

- [ ] **Step 7: Запустить полный тест-сьют пилота**

```bash
cd neurokey-pilot
npx vitest run
npm run build
```

Expected: все тесты проходят, билд успешен, ошибок резолва `@/lib/engine` (модуль удалён) быть не должно — если появляются, значит остался незамеченный импорт из списка выше.

- [ ] **Step 8: Commit**

```bash
git add packages/neurokey-core neurokey-pilot
git commit -m "refactor: move engine.ts and CognitiveScores into @neurokey/core"
```

---

### Task 3: `CognitiveProfile` и `AssessmentEngine`

**Files:**
- Create: `packages/neurokey-core/src/cognitive-profile.ts`
- Create: `packages/neurokey-core/tests/cognitive-profile.test.ts`
- Modify: `packages/neurokey-core/src/index.ts`

**Interfaces:**
- Consumes: ничего из предыдущих задач напрямую (независимый модуль).
- Produces: `ScaleId`, `ScaleSnapshot`, `CognitiveProfile`, `SignalSourceKind`, `SignalReading`, `SignalSource`, `computeBaseline(userId: string, sources: SignalSource[], now: Date): CognitiveProfile`, `updateProfile(profile: CognitiveProfile, sources: SignalSource[], now: Date): CognitiveProfile`, `scaleTrend(profile: CognitiveProfile, scaleId: ScaleId): number`. Task 4 использует `ScaleId`.

- [ ] **Step 1: Написать падающие тесты**

`packages/neurokey-core/tests/cognitive-profile.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeBaseline, updateProfile, scaleTrend } from "../src/cognitive-profile";
import type { SignalSource, CognitiveProfile } from "../src/cognitive-profile";

describe("computeBaseline", () => {
  it("averages readings per scale across sources", () => {
    const sources: SignalSource[] = [
      {
        kind: "in-app-interaction",
        readings: [
          { scaleId: "attention", value: 60 },
          { scaleId: "memory", value: 40 },
        ],
      },
      { kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] },
    ];
    const profile = computeBaseline("child-1", sources, new Date("2026-08-10T10:00:00Z"));
    expect(profile.userId).toBe("child-1");
    expect(profile.scales.attention).toBe(70);
    expect(profile.scales.memory).toBe(40);
    expect(profile.baselineCompletedAt).toEqual(new Date("2026-08-10T10:00:00Z"));
    expect(profile.lastAssessedAt).toEqual(new Date("2026-08-10T10:00:00Z"));
    expect(profile.history).toHaveLength(1);
  });

  it("produces an empty scales object with no readings", () => {
    const profile = computeBaseline("child-1", [], new Date("2026-08-10T10:00:00Z"));
    expect(profile.scales).toEqual({});
  });
});

describe("updateProfile", () => {
  it("blends new readings into the existing scale value", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"), // Monday
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] }],
      new Date("2026-08-04T10:00:00Z"), // Tuesday, same week
    );
    expect(updated.scales.attention).toBe(70);
    expect(updated.history).toHaveLength(1);
    expect(updated.lastAssessedAt).toEqual(new Date("2026-08-04T10:00:00Z"));
  });

  it("adds a scale that wasn't present before", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"),
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "memory", value: 50 }] }],
      new Date("2026-08-04T10:00:00Z"),
    );
    expect(updated.scales.memory).toBe(50);
    expect(updated.scales.attention).toBe(60);
  });

  it("appends a new week snapshot when the week changes", () => {
    const baseline = computeBaseline(
      "child-1",
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 60 }] }],
      new Date("2026-08-03T10:00:00Z"), // Monday
    );
    const updated = updateProfile(
      baseline,
      [{ kind: "in-app-interaction", readings: [{ scaleId: "attention", value: 80 }] }],
      new Date("2026-08-10T10:00:00Z"), // next Monday
    );
    expect(updated.history).toHaveLength(2);
  });
});

describe("scaleTrend", () => {
  const baseProfile: CognitiveProfile = {
    userId: "child-1",
    scales: { attention: 70 },
    baselineCompletedAt: new Date("2026-08-03T10:00:00Z"),
    lastAssessedAt: new Date("2026-08-10T10:00:00Z"),
    history: [
      { weekStart: new Date("2026-08-03T00:00:00Z"), scales: { attention: 60 } },
      { weekStart: new Date("2026-08-10T00:00:00Z"), scales: { attention: 70 } },
    ],
  };

  it("returns the delta between the two most recent weeks", () => {
    expect(scaleTrend(baseProfile, "attention")).toBe(10);
  });

  it("returns 0 with fewer than two snapshots", () => {
    const profile: CognitiveProfile = { ...baseProfile, history: [baseProfile.history[0]] };
    expect(scaleTrend(profile, "attention")).toBe(0);
  });

  it("returns 0 for a scale with no data in the snapshots", () => {
    expect(scaleTrend(baseProfile, "memory")).toBe(0);
  });
});
```

- [ ] **Step 2: Запустить тесты, убедиться, что падают**

```bash
cd packages/neurokey-core
npx vitest run tests/cognitive-profile.test.ts
```

Expected: FAIL — `Cannot find module '../src/cognitive-profile'`.

- [ ] **Step 3: Реализовать `cognitive-profile.ts`**

`packages/neurokey-core/src/cognitive-profile.ts`:

```ts
export type ScaleId = string;

export interface ScaleSnapshot {
  weekStart: Date;
  scales: Record<ScaleId, number>;
}

export interface CognitiveProfile {
  userId: string;
  scales: Record<ScaleId, number>;
  history: ScaleSnapshot[];
  baselineCompletedAt: Date | null;
  lastAssessedAt: Date;
}

export type SignalSourceKind = "in-app-interaction" | "device-screen-time" | "visual-channel";

export interface SignalReading {
  scaleId: ScaleId;
  value: number; // 0-100
}

export interface SignalSource {
  kind: SignalSourceKind;
  readings: SignalReading[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diffFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffFromMonday);
  return d;
}

function averageReadings(sources: SignalSource[]): Record<ScaleId, number> {
  const sums = new Map<ScaleId, number>();
  const counts = new Map<ScaleId, number>();
  for (const source of sources) {
    for (const reading of source.readings) {
      sums.set(reading.scaleId, (sums.get(reading.scaleId) ?? 0) + reading.value);
      counts.set(reading.scaleId, (counts.get(reading.scaleId) ?? 0) + 1);
    }
  }
  const result: Record<ScaleId, number> = {};
  for (const [scaleId, sum] of sums) {
    result[scaleId] = Math.round(sum / (counts.get(scaleId) ?? 1));
  }
  return result;
}

export function computeBaseline(userId: string, sources: SignalSource[], now: Date): CognitiveProfile {
  const scales = averageReadings(sources);
  return {
    userId,
    scales,
    history: [{ weekStart: startOfWeek(now), scales }],
    baselineCompletedAt: now,
    lastAssessedAt: now,
  };
}

export function updateProfile(profile: CognitiveProfile, sources: SignalSource[], now: Date): CognitiveProfile {
  const incoming = averageReadings(sources);
  const scales: Record<ScaleId, number> = { ...profile.scales };
  for (const [scaleId, value] of Object.entries(incoming)) {
    const previous = scales[scaleId];
    scales[scaleId] = previous === undefined ? value : Math.round((previous + value) / 2);
  }

  const week = startOfWeek(now);
  const history = [...profile.history];
  const idx = history.findIndex((snapshot) => snapshot.weekStart.getTime() === week.getTime());
  if (idx >= 0) {
    history[idx] = { weekStart: week, scales };
  } else {
    history.push({ weekStart: week, scales });
  }

  return { ...profile, scales, history, lastAssessedAt: now };
}

export function scaleTrend(profile: CognitiveProfile, scaleId: ScaleId): number {
  const sorted = [...profile.history].sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  if (sorted.length < 2) return 0;
  const current = sorted[sorted.length - 1].scales[scaleId] ?? 0;
  const previous = sorted[sorted.length - 2].scales[scaleId] ?? 0;
  return current - previous;
}
```

- [ ] **Step 4: Запустить тесты, убедиться, что проходят**

```bash
cd packages/neurokey-core
npx vitest run tests/cognitive-profile.test.ts
```

Expected: PASS, все кейсы.

- [ ] **Step 5: Реэкспортировать из `index.ts`**

Добавить в `packages/neurokey-core/src/index.ts`:

```ts
export type {
  ScaleId,
  ScaleSnapshot,
  CognitiveProfile,
  SignalSourceKind,
  SignalReading,
  SignalSource,
} from "./cognitive-profile";
export { computeBaseline, updateProfile, scaleTrend } from "./cognitive-profile";
```

- [ ] **Step 6: Commit**

```bash
git add packages/neurokey-core
git commit -m "feat: add CognitiveProfile and AssessmentEngine to @neurokey/core"
```

---

### Task 4: `Skill` — формат авторской методики

**Files:**
- Create: `packages/neurokey-core/src/skill.ts`
- Create: `packages/neurokey-core/tests/skill.test.ts`
- Modify: `packages/neurokey-core/src/index.ts`

**Interfaces:**
- Consumes: `ScaleId` из `./cognitive-profile` (Task 3), `ExerciseType` из `./engine` (Task 2).
- Produces: `Contributor`, `Reference`, `SkillTriggerSignalType`, `SkillTrigger`, `SkillExerciseParams`, `Skill`, `TriggerContext`, `matchesTrigger(skill: Skill, context: TriggerContext): boolean`, `selectSkill(skills: Skill[], context: TriggerContext): Skill | null`, `nextSkillVersion(currentVersion: string): string`, `reviseSkill(skill: Skill, changes: Partial<Pick<Skill, "trigger" | "targetScales" | "exerciseParams">>, now: Date): Skill`.

- [ ] **Step 1: Написать падающие тесты**

`packages/neurokey-core/tests/skill.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { matchesTrigger, selectSkill, nextSkillVersion, reviseSkill } from "../src/skill";
import type { Skill } from "../src/skill";

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "post-shorts-attention",
    version: "1.0",
    name: "Compensation after short-form video",
    trigger: { signalType: "duration", minDurationMinutes: 20 },
    targetScales: ["attention"],
    exerciseParams: { typeWeights: { data: 2 }, difficultyAdjustment: 0 },
    authorship: [
      { name: "Author Name", qualification: "neuropsychologist", role: "methodologist", sharePercent: 100 },
    ],
    citations: [],
    createdAt: new Date("2026-08-01T00:00:00Z"),
    effectiveFrom: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

describe("matchesTrigger", () => {
  it("matches a duration trigger when the threshold is reached", () => {
    const skill = makeSkill();
    expect(matchesTrigger(skill, { durationMinutes: 25 })).toBe(true);
    expect(matchesTrigger(skill, { durationMinutes: 10 })).toBe(false);
  });

  it("matches a contentType trigger by membership", () => {
    const skill = makeSkill({ trigger: { signalType: "contentType", contentTypes: ["shorts", "tiktok"] } });
    expect(matchesTrigger(skill, { contentType: "tiktok" })).toBe(true);
    expect(matchesTrigger(skill, { contentType: "reading" })).toBe(false);
  });

  it("requires both conditions for a combined trigger", () => {
    const skill = makeSkill({
      trigger: { signalType: "combined", minDurationMinutes: 20, contentTypes: ["tiktok"] },
    });
    expect(matchesTrigger(skill, { durationMinutes: 25, contentType: "tiktok" })).toBe(true);
    expect(matchesTrigger(skill, { durationMinutes: 25, contentType: "reading" })).toBe(false);
    expect(matchesTrigger(skill, { durationMinutes: 5, contentType: "tiktok" })).toBe(false);
  });
});

describe("selectSkill", () => {
  it("returns the first matching skill in list order", () => {
    const skills = [
      makeSkill({ id: "a", trigger: { signalType: "duration", minDurationMinutes: 60 } }),
      makeSkill({ id: "b", trigger: { signalType: "duration", minDurationMinutes: 10 } }),
    ];
    expect(selectSkill(skills, { durationMinutes: 30 })?.id).toBe("b");
  });

  it("returns null when nothing matches", () => {
    const skills = [makeSkill({ trigger: { signalType: "duration", minDurationMinutes: 60 } })];
    expect(selectSkill(skills, { durationMinutes: 10 })).toBeNull();
  });
});

describe("nextSkillVersion", () => {
  it("increments the minor version", () => {
    expect(nextSkillVersion("1.0")).toBe("1.1");
    expect(nextSkillVersion("1.9")).toBe("1.10");
  });
});

describe("reviseSkill", () => {
  it("bumps the version and effectiveFrom while preserving authorship and id", () => {
    const skill = makeSkill();
    const revised = reviseSkill(
      skill,
      { targetScales: ["attention", "control"] },
      new Date("2026-09-01T00:00:00Z"),
    );
    expect(revised.version).toBe("1.1");
    expect(revised.targetScales).toEqual(["attention", "control"]);
    expect(revised.effectiveFrom).toEqual(new Date("2026-09-01T00:00:00Z"));
    expect(revised.authorship).toEqual(skill.authorship);
    expect(revised.id).toBe(skill.id);
    expect(revised.createdAt).toEqual(skill.createdAt);
  });
});
```

- [ ] **Step 2: Запустить тесты, убедиться, что падают**

```bash
cd packages/neurokey-core
npx vitest run tests/skill.test.ts
```

Expected: FAIL — `Cannot find module '../src/skill'`.

- [ ] **Step 3: Реализовать `skill.ts`**

`packages/neurokey-core/src/skill.ts`:

```ts
import type { ScaleId } from "./cognitive-profile";
import type { ExerciseType } from "./engine";

export interface Contributor {
  name: string;
  qualification: string;
  role: "methodologist" | "consultant" | "technical-partner" | "investor-partner";
  sharePercent: number;
}

export interface Reference {
  citation: string;
  url?: string;
}

export type SkillTriggerSignalType = "duration" | "contentType" | "combined";

export interface SkillTrigger {
  signalType: SkillTriggerSignalType;
  minDurationMinutes?: number;
  contentTypes?: string[];
}

export interface SkillExerciseParams {
  typeWeights: Partial<Record<ExerciseType, number>>;
  difficultyAdjustment: number;
}

export interface Skill {
  id: string;
  version: string;
  name: string;
  trigger: SkillTrigger;
  targetScales: ScaleId[];
  exerciseParams: SkillExerciseParams;
  authorship: Contributor[];
  citations: Reference[];
  createdAt: Date;
  effectiveFrom: Date;
}

export interface TriggerContext {
  durationMinutes?: number;
  contentType?: string;
}

function matchesDuration(trigger: SkillTrigger, context: TriggerContext): boolean {
  return (
    trigger.minDurationMinutes !== undefined &&
    context.durationMinutes !== undefined &&
    context.durationMinutes >= trigger.minDurationMinutes
  );
}

function matchesContentType(trigger: SkillTrigger, context: TriggerContext): boolean {
  return (
    trigger.contentTypes !== undefined &&
    context.contentType !== undefined &&
    trigger.contentTypes.includes(context.contentType)
  );
}

export function matchesTrigger(skill: Skill, context: TriggerContext): boolean {
  const { signalType } = skill.trigger;
  if (signalType === "duration") return matchesDuration(skill.trigger, context);
  if (signalType === "contentType") return matchesContentType(skill.trigger, context);
  return matchesDuration(skill.trigger, context) && matchesContentType(skill.trigger, context);
}

export function selectSkill(skills: Skill[], context: TriggerContext): Skill | null {
  return skills.find((skill) => matchesTrigger(skill, context)) ?? null;
}

export function nextSkillVersion(currentVersion: string): string {
  const [major, minor] = currentVersion.split(".").map(Number);
  return `${major}.${minor + 1}`;
}

export function reviseSkill(
  skill: Skill,
  changes: Partial<Pick<Skill, "trigger" | "targetScales" | "exerciseParams">>,
  now: Date,
): Skill {
  return {
    ...skill,
    ...changes,
    version: nextSkillVersion(skill.version),
    effectiveFrom: now,
  };
}
```

- [ ] **Step 4: Запустить тесты, убедиться, что проходят**

```bash
cd packages/neurokey-core
npx vitest run tests/skill.test.ts
```

Expected: PASS, все кейсы.

- [ ] **Step 5: Реэкспортировать из `index.ts`**

Добавить в `packages/neurokey-core/src/index.ts`:

```ts
export type {
  Contributor,
  Reference,
  SkillTriggerSignalType,
  SkillTrigger,
  SkillExerciseParams,
  Skill,
  TriggerContext,
} from "./skill";
export { matchesTrigger, selectSkill, nextSkillVersion, reviseSkill } from "./skill";
```

- [ ] **Step 6: Commit**

```bash
git add packages/neurokey-core
git commit -m "feat: add Skill format with authorship tracking to @neurokey/core"
```

---

### Task 5: Проверка сквозной сборки пилота на новом ядре

**Files:**
- Create: `neurokey-pilot/tests/unit/core-package.test.ts`

**Interfaces:**
- Consumes: полный публичный API `@neurokey/core` (Task 2–4).
- Produces: ничего нового — это интеграционная проверка, что пилот как потребитель пакета собирается, типизируется и тестируется без ошибок резолва.

- [ ] **Step 1: Написать тест сквозного импорта**

`neurokey-pilot/tests/unit/core-package.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { nextLevel, computeBaseline, selectSkill } from "@neurokey/core";
import type { Skill } from "@neurokey/core";

describe("@neurokey/core package wiring", () => {
  it("exposes the engine API to the pilot app", () => {
    expect(nextLevel([], 2)).toBe(2);
  });

  it("exposes the cognitive profile API to the pilot app", () => {
    const profile = computeBaseline("child-1", [], new Date("2026-08-10T00:00:00Z"));
    expect(profile.userId).toBe("child-1");
  });

  it("exposes the skill API to the pilot app", () => {
    const skills: Skill[] = [];
    expect(selectSkill(skills, {})).toBeNull();
  });
});
```

- [ ] **Step 2: Запустить тест, убедиться, что проходит**

```bash
cd neurokey-pilot
npx vitest run tests/unit/core-package.test.ts
```

Expected: PASS — если тест падает с ошибкой резолва модуля, проверить `tsconfig.json` `paths` и `next.config.ts` `transpilePackages` из Task 1.

- [ ] **Step 3: Прогнать полный тест-сьют и билд пилота**

```bash
cd neurokey-pilot
npx vitest run
npm run build
npm run lint
```

Expected: всё проходит без ошибок — это финальное подтверждение, что перенос ядра и новые модули не сломали существующий пилот.

- [ ] **Step 4: Commit**

```bash
git add neurokey-pilot/tests/unit/core-package.test.ts
git commit -m "test: verify pilot integrates with @neurokey/core end-to-end"
```

---

## Вне рамок этого плана

Как и зафиксировано в спеке: процедурная генерация упражнений из скилла, схема БД для хранения `CognitiveProfile`/`Skill` (Prisma-модели и миграции — отдельный план), UI для прохождения baseline-теста, реальная интеграция `device-screen-time`/`visual-channel` источников сигнала, взрослая/родительская версия профиля.
