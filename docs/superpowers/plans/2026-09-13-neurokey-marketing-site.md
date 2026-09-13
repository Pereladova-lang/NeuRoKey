# NeuRoKey Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a new, separate static marketing site for NeuRoKey — a parent-facing
landing page with a gated CTA (email capture, not direct registration) and a not-yet-published
`/for-investors` page — per `ideaweb.md` (repo root of `NeuRoKey`) as revised after llm-council
review.

**Architecture:** Astro (static output) in a brand-new repository `neurokey-site`, fully
decoupled from `neurokey-pilot`'s Next.js codebase. Pure business logic (email validation, the
gated-CTA state machine, analytics event helpers) lives in framework-free TypeScript modules
under `src/lib/`, unit-tested with Vitest without a browser. Page composition and DOM behavior
are verified with Playwright against the built site, mirroring how `neurokey-pilot` separates
pure `src/lib/` logic from UI. Deployed to Vercel.

**Tech Stack:** Astro 4 (TypeScript, static output), Vitest (unit), Playwright (e2e/integration),
Formspree (lead-capture form backend, no custom API), Plausible (analytics), Vercel (hosting).

## Global Constraints

- Site is static — no server, no database, no custom API route of its own (`ideaweb.md` §
  Технические решения / Non-Functional Requirements).
- Russian-only copy for this iteration (`ideaweb.md` § Аудитория, Appendix).
- Parent landing page CTA must NOT link directly to `neurokey-pilot` registration — it must go
  through an email-capture step first (`ideaweb.md` § "Ограничение потока (gated CTA)").
  Admission mechanism is automatic, not manually reviewed (founder decision, see conversation):
  after a successful email submission the visitor is immediately shown the real pilot
  registration link — there is no waiting period or manual approval queue for this volume (100+).
- `/for-investors` must not be linked from `/` and must not be indexed by search engines
  (`ideaweb.md` § "Разделение аудиторий").
- Every page must render correctly at ~400px width (mobile-first parent audience).
- No new project dependency may be added without a corresponding task in this plan.
- The pilot's actual production registration URL is not yet known — use the configurable
  `PUBLIC_PILOT_REGISTER_URL` environment variable everywhere instead of a hardcoded URL
  (open question, tracked in `ideaweb.md` § Open Questions). The real pilot registration page
  today lives at `/parent` on whatever host `neurokey-pilot` is deployed to (confirmed by
  reading `neurokey-pilot/src/app/(parent)/parent/page.tsx`).

---

## File Structure

```
neurokey-site/                        (new repo, sibling to NeuRoKey/)
  package.json
  astro.config.mjs
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  .env.example
  .gitignore
  README.md
  src/
    lib/
      email.ts              # pure: validateEmail()
      gated-cta.ts          # pure: submitGatedCta() state machine, no DOM
      analytics.ts          # pure: trackEvent() wrapper around window.plausible
    content/
      site-copy.ts          # typed content: hero, sections, FAQ, pricing, investor copy
    layouts/
      BaseLayout.astro      # <html lang="ru">, meta, global CSS import
    components/
      Hero.astro
      HowItWorks.astro
      ScienceTrust.astro
      Screenshots.astro
      Pricing.astro
      PrivacySection.astro
      Faq.astro
      GatedCtaForm.astro    # island: wires DOM <form> to lib/gated-cta.ts
      InvestorSections.astro
    pages/
      index.astro           # parent landing page
      for-investors.astro   # investor page, noindex, unlinked
    styles/
      global.css
  public/
    robots.txt               # Disallow: /for-investors
  tests/
    unit/
      email.test.ts
      gated-cta.test.ts
      site-copy.test.ts
    e2e/
      homepage.spec.ts
      gated-cta.spec.ts
      for-investors.spec.ts
```

---

### Task 1: Repository scaffold

**Files:**
- Create: `neurokey-site/package.json`
- Create: `neurokey-site/astro.config.mjs`
- Create: `neurokey-site/tsconfig.json`
- Create: `neurokey-site/.gitignore`
- Create: `neurokey-site/src/pages/index.astro` (placeholder)
- Create: `neurokey-site/README.md`

**Interfaces:**
- Produces: a buildable Astro project at `C:\Users\kpere\my-projects\neurokey-site` with
  `npm run build` and `npm run dev` scripts, pushed to a new GitHub repo
  `Pereladova-lang/neurokey-site` on branch `main`.

- [ ] **Step 1: Create the local project directory and confirm the GitHub repo creation with the user**

Before running `gh repo create`, tell the user exactly what will happen (a new public/private
repo `Pereladova-lang/neurokey-site` will be created and pushed to) and get explicit
confirmation — creating a repo and pushing is a visible, hard-to-reverse action.

```bash
mkdir "C:\Users\kpere\my-projects\neurokey-site"
cd "C:\Users\kpere\my-projects\neurokey-site"
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "neurokey-site",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^4.16.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "@playwright/test": "^1.48.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```javascript
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://neurokey-site.vercel.app",
  output: "static",
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/**/*", "tests/**/*"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
.env
.env.local
test-results/
playwright-report/
```

- [ ] **Step 6: Write a placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="ru">
  <head><title>NeuRoKey</title></head>
  <body><h1>NeuRoKey</h1></body>
</html>
```

- [ ] **Step 7: Write `README.md`**

```markdown
# neurokey-site

Marketing site for NeuRoKey — parent-facing landing page + `/for-investors`. Static Astro
site, decoupled from `neurokey-pilot`. See `ideaweb.md` in the `NeuRoKey` monorepo for the
full spec.

## Commands

\`\`\`bash
npm install
npm run dev       # http://localhost:4321
npm run build
npm test          # unit tests (Vitest)
npm run test:e2e  # integration tests (Playwright, run against a built preview server)
\`\`\`

## Environment variables

See `.env.example`.
```

- [ ] **Step 8: Install dependencies and verify the build**

```bash
npm install
npm run build
```

Expected: build succeeds, `dist/index.html` exists.

- [ ] **Step 9: Create the GitHub repo and push (only after user confirms)**

```bash
gh repo create Pereladova-lang/neurokey-site --private --source=. --remote=origin
git add -A
git commit -m "chore: scaffold Astro marketing site project"
git push -u origin main
```

---

### Task 2: `validateEmail` — pure email validation

**Files:**
- Create: `neurokey-site/src/lib/email.ts`
- Test: `neurokey-site/tests/unit/email.test.ts`
- Create: `neurokey-site/vitest.config.ts`

**Interfaces:**
- Produces: `validateEmail(value: string): { valid: true } | { valid: false; reason: string }`
  — consumed by Task 6 (`gated-cta.ts`).

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 2: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { validateEmail } from "@/lib/email";

describe("validateEmail", () => {
  it("accepts a well-formed email", () => {
    expect(validateEmail("parent@example.com")).toEqual({ valid: true });
  });

  it("rejects an empty string", () => {
    expect(validateEmail("")).toEqual({ valid: false, reason: "empty" });
  });

  it("rejects a string with no @", () => {
    expect(validateEmail("not-an-email")).toEqual({ valid: false, reason: "format" });
  });

  it("rejects a string with no domain", () => {
    expect(validateEmail("parent@")).toEqual({ valid: false, reason: "format" });
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateEmail("  parent@example.com  ")).toEqual({ valid: true });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- email.test.ts`
Expected: FAIL — `Cannot find module '@/lib/email'`

- [ ] **Step 4: Write minimal implementation**

```typescript
export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: "empty" | "format" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(rawValue: string): EmailValidationResult {
  const value = rawValue.trim();
  if (value.length === 0) return { valid: false, reason: "empty" };
  if (!EMAIL_PATTERN.test(value)) return { valid: false, reason: "format" };
  return { valid: true };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- email.test.ts`
Expected: PASS (5/5)

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts tests/unit/email.test.ts vitest.config.ts
git commit -m "feat: add pure email validation for the gated CTA form"
```

---

### Task 3: `site-copy.ts` — typed content module

**Files:**
- Create: `neurokey-site/src/content/site-copy.ts`
- Test: `neurokey-site/tests/unit/site-copy.test.ts`

**Interfaces:**
- Produces: exported constants `heroCopy`, `howItWorksCopy`, `scienceTrustCopy`,
  `pricingCopy`, `faqCopy: FaqItem[]`, `privacyCopy`, `investorCopy` — consumed by the Astro
  components in Tasks 5 and 8.
- `FaqItem = { question: string; answer: string }`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import {
  heroCopy,
  howItWorksCopy,
  scienceTrustCopy,
  pricingCopy,
  faqCopy,
  privacyCopy,
  investorCopy,
} from "@/content/site-copy";

describe("site-copy", () => {
  it("hero explains the mechanic in plain language a tired parent understands", () => {
    expect(heroCopy.headline.length).toBeGreaterThan(0);
    expect(heroCopy.subheadline.length).toBeGreaterThan(0);
    // Council (Outsider) requirement: no internal jargon like "гейт"/"гейтинг" in the hero.
    expect(heroCopy.headline.toLowerCase()).not.toContain("гейт");
    expect(heroCopy.subheadline.toLowerCase()).not.toContain("гейт");
  });

  it("has non-empty how-it-works steps", () => {
    expect(howItWorksCopy.steps.length).toBeGreaterThanOrEqual(3);
    for (const step of howItWorksCopy.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty science/trust rationale", () => {
    expect(scienceTrustCopy.paragraphs.length).toBeGreaterThan(0);
  });

  it("has at least one pricing plan", () => {
    expect(pricingCopy.plans.length).toBeGreaterThan(0);
  });

  it("has at least 4 FAQ entries, each with a question and answer", () => {
    expect(faqCopy.length).toBeGreaterThanOrEqual(4);
    for (const item of faqCopy) {
      expect(item.question.length).toBeGreaterThan(0);
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });

  it("privacy copy links to the pilot's consent and privacy pages, not just prose", () => {
    expect(privacyCopy.consentLinkPath).toBe("/consent");
    expect(privacyCopy.privacyLinkPath).toBe("/privacy");
    expect(privacyCopy.paragraph.length).toBeGreaterThan(0);
  });

  it("investor copy has a placeholder-marked metrics section", () => {
    expect(investorCopy.metrics.isPlaceholder).toBe(true);
    expect(investorCopy.metrics.placeholderText.length).toBeGreaterThan(0);
    expect(investorCopy.roadmap.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- site-copy.test.ts`
Expected: FAIL — `Cannot find module '@/content/site-copy'`

- [ ] **Step 3: Write minimal implementation**

```typescript
export const heroCopy = {
  headline: "Сначала мозг размялся — потом можно смотреть любимое видео",
  subheadline:
    "Ребёнок хочет YouTube, TikTok или игру — сначала он проходит короткое упражнение " +
    "на внимание и логику (3–5 минут), а потом получает доступ, как обычно.",
};

export const howItWorksCopy = {
  steps: [
    {
      title: "Ребёнок открывает любимое приложение",
      description:
        "YouTube, TikTok или игра остаются доступны — ничего не блокируется навсегда.",
    },
    {
      title: "Сначала — короткое упражнение",
      description:
        "Комикс, задачка с данными или управление роботом — 3–5 минут, подстраивается " +
        "под уровень ребёнка.",
    },
    {
      title: "Доступ открывается автоматически",
      description: "Без штрафов за ошибку — только подсказка и повторная попытка.",
    },
  ],
};

export const scienceTrustCopy = {
  paragraphs: [
    "Упражнения тренируют внимание, память, логику и самоконтроль — четыре когнитивные " +
      "шкалы, которые считаются по итогам каждой недели.",
    "Уровень сложности подстраивается индивидуально: ниже 50% точности — уровень " +
      "снижается, три сессии подряд выше 80% — повышается.",
  ],
};

export const pricingCopy = {
  plans: [
    {
      name: "Пробный период",
      price: "Бесплатно",
      description: "3 дня полного доступа, без карты.",
    },
    {
      name: "Подписка",
      price: "уточняется",
      description: "После пробного периода — безлимитный доступ ко всем упражнениям.",
    },
  ],
};

export const faqCopy = [
  {
    question: "Нужно ли устанавливать отдельное приложение ребёнку?",
    answer: "Нет, всё работает через браузер на том же устройстве.",
  },
  {
    question: "Что будет, если ребёнок ответит неправильно?",
    answer: "Ничего страшного — только подсказка и повторная попытка, без штрафов.",
  },
  {
    question: "Какие данные вы храните о ребёнке?",
    answer:
      "Только то, что нужно для адаптации сложности упражнений. Подробности — в разделе " +
      "о безопасности данных ниже.",
  },
  {
    question: "Можно ли отменить подписку в любой момент?",
    answer: "Да, отмена доступна в личном кабинете родителя в любое время.",
  },
];

export const privacyCopy = {
  paragraph:
    "Мы запрашиваем явное согласие родителя на обработку данных ребёнка при регистрации " +
    "и не передаём эти данные третьим лицам.",
  consentLinkPath: "/consent",
  privacyLinkPath: "/privacy",
};

export const investorCopy = {
  problemSolution: {
    problem:
      "Дети 11–14 лет проводят часы в высокодофаминовом контенте без какой-либо " +
      "когнитивной нагрузки взамен.",
    solution:
      "NeuRoKey встраивает короткую адаптивную тренировку перед доступом к этому " +
      "контенту — без блокировок, только полезная пауза.",
  },
  roadmap: [
    "Сейчас: пилот для когорты 11–14 лет, набор первых семей.",
    "Далее: расширение на когорты 7–10 и 15–18 лет.",
    "Монетизация: подписка через Robokassa.",
  ],
  metrics: {
    isPlaceholder: true,
    placeholderText: "Данные появятся после первых результатов пилота.",
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- site-copy.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Commit**

```bash
git add src/content/site-copy.ts tests/unit/site-copy.test.ts
git commit -m "feat: add typed site copy content module"
```

---

### Task 4: `gated-cta.ts` — pure submission state machine

**Files:**
- Create: `neurokey-site/src/lib/gated-cta.ts`
- Test: `neurokey-site/tests/unit/gated-cta.test.ts`

**Interfaces:**
- Consumes: `validateEmail` from `@/lib/email` (Task 2).
- Produces:
  ```typescript
  export type GatedCtaResult =
    | { status: "invalid"; reason: "empty" | "format" }
    | { status: "success"; registerUrl: string }
    | { status: "network-error" };

  export async function submitGatedCta(
    email: string,
    opts: { formspreeEndpoint: string; registerUrl: string; fetchImpl?: typeof fetch }
  ): Promise<GatedCtaResult>;
  ```
  Consumed by the `GatedCtaForm.astro` island in Task 6.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { submitGatedCta } from "@/lib/gated-cta";

describe("submitGatedCta", () => {
  const opts = {
    formspreeEndpoint: "https://formspree.io/f/test123",
    registerUrl: "https://pilot.example.com/parent",
  };

  it("rejects an invalid email without making a network call", async () => {
    const fetchImpl = vi.fn();
    const result = await submitGatedCta("not-an-email", { ...opts, fetchImpl });
    expect(result).toEqual({ status: "invalid", reason: "format" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the email to Formspree and returns the register URL on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true } as Response);
    const result = await submitGatedCta("parent@example.com", { ...opts, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(
      opts.formspreeEndpoint,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Accept: "application/json" }),
      })
    );
    expect(result).toEqual({ status: "success", registerUrl: opts.registerUrl });
  });

  it("returns network-error when the Formspree request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);
    const result = await submitGatedCta("parent@example.com", { ...opts, fetchImpl });
    expect(result).toEqual({ status: "network-error" });
  });

  it("returns network-error when fetch throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await submitGatedCta("parent@example.com", { ...opts, fetchImpl });
    expect(result).toEqual({ status: "network-error" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- gated-cta.test.ts`
Expected: FAIL — `Cannot find module '@/lib/gated-cta'`

- [ ] **Step 3: Write minimal implementation**

```typescript
import { validateEmail } from "@/lib/email";

export type GatedCtaResult =
  | { status: "invalid"; reason: "empty" | "format" }
  | { status: "success"; registerUrl: string }
  | { status: "network-error" };

export async function submitGatedCta(
  email: string,
  opts: { formspreeEndpoint: string; registerUrl: string; fetchImpl?: typeof fetch }
): Promise<GatedCtaResult> {
  const validation = validateEmail(email);
  if (!validation.valid) {
    return { status: "invalid", reason: validation.reason };
  }

  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const response = await doFetch(opts.formspreeEndpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (!response.ok) return { status: "network-error" };
    return { status: "success", registerUrl: opts.registerUrl };
  } catch {
    return { status: "network-error" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- gated-cta.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/lib/gated-cta.ts tests/unit/gated-cta.test.ts
git commit -m "feat: add pure gated-CTA submission state machine"
```

---

### Task 5: `analytics.ts` — pure event tracking wrapper

**Files:**
- Create: `neurokey-site/src/lib/analytics.ts`
- Test: `neurokey-site/tests/unit/analytics.test.ts`

**Interfaces:**
- Produces: `trackEvent(name: string, props?: Record<string, string>): void` — consumed by
  `GatedCtaForm.astro` (Task 6) and `Hero.astro` CTA click handler (Task 7).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { trackEvent } from "@/lib/analytics";

describe("trackEvent", () => {
  beforeEach(() => {
    // @ts-expect-error test double
    delete globalThis.window;
  });

  it("does not throw when window.plausible is unavailable", () => {
    // @ts-expect-error test double
    globalThis.window = {};
    expect(() => trackEvent("cta_click")).not.toThrow();
  });

  it("calls window.plausible with the event name and props when available", () => {
    const plausible = vi.fn();
    // @ts-expect-error test double
    globalThis.window = { plausible };
    trackEvent("cta_click", { location: "hero" });
    expect(plausible).toHaveBeenCalledWith("cta_click", { props: { location: "hero" } });
  });

  it("does nothing when window is undefined (server-side)", () => {
    expect(() => trackEvent("cta_click")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- analytics.test.ts`
Expected: FAIL — `Cannot find module '@/lib/analytics'`

- [ ] **Step 3: Write minimal implementation**

```typescript
type Plausible = (eventName: string, options?: { props: Record<string, string> }) => void;

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function trackEvent(name: string, props?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  plausible(name, props ? { props } : undefined);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- analytics.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts tests/unit/analytics.test.ts
git commit -m "feat: add pure analytics event tracking wrapper"
```

---

### Task 6: `BaseLayout.astro` + Playwright harness

**Files:**
- Create: `neurokey-site/src/layouts/BaseLayout.astro`
- Create: `neurokey-site/src/styles/global.css`
- Create: `neurokey-site/playwright.config.ts`
- Test: `neurokey-site/tests/e2e/homepage.spec.ts` (first assertion only — title/lang)
- Modify: `neurokey-site/src/pages/index.astro` (use the layout)

**Interfaces:**
- Produces: `BaseLayout.astro` accepting props `{ title: string; description: string;
  noindex?: boolean }`, rendering `<html lang="ru">`, a `<meta name="description">`, an
  optional `<meta name="robots" content="noindex">` when `noindex` is true, and a
  `<slot />` for page content. Consumed by `index.astro` (this task) and `for-investors.astro`
  (Task 8).

- [ ] **Step 1: Write `playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run build && npm run preview -- --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:4321" },
});
```

- [ ] **Step 2: Write the failing test**

```typescript
import { test, expect } from "@playwright/test";

test("homepage has a Russian lang attribute and a descriptive title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page).toHaveTitle(/NeuRoKey/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx playwright install --with-deps chromium && npm run test:e2e -- homepage.spec.ts`
Expected: FAIL (title does not match / page has no real layout yet)

- [ ] **Step 4: Write `src/styles/global.css`**

```css
:root {
  color-scheme: light;
  --color-bg: #ffffff;
  --color-text: #1a1a2e;
  --color-primary: #6366f1;
  --color-secondary: #06b6d4;
  --font-body: "Inter", system-ui, sans-serif;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  line-height: 1.5;
}

img { max-width: 100%; }
```

- [ ] **Step 5: Write `src/layouts/BaseLayout.astro`**

```astro
---
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  noindex?: boolean;
}

const { title, description, noindex = false } = Astro.props;
---
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 6: Update `src/pages/index.astro` to use the layout**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
---
<BaseLayout
  title="NeuRoKey — тренировка внимания перед любимым контентом"
  description="Короткое адаптивное упражнение перед доступом к YouTube, TikTok и играм для детей 11-14 лет."
>
  <h1>NeuRoKey</h1>
</BaseLayout>
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:e2e -- homepage.spec.ts`
Expected: PASS (1/1)

- [ ] **Step 8: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css src/pages/index.astro \
  playwright.config.ts tests/e2e/homepage.spec.ts
git commit -m "feat: add base layout with Russian lang, meta, and noindex support"
```

---

### Task 7: Homepage sections (Hero, HowItWorks, ScienceTrust, Screenshots, Pricing, PrivacySection, Faq)

**Files:**
- Create: `neurokey-site/src/components/Hero.astro`
- Create: `neurokey-site/src/components/HowItWorks.astro`
- Create: `neurokey-site/src/components/ScienceTrust.astro`
- Create: `neurokey-site/src/components/Screenshots.astro`
- Create: `neurokey-site/src/components/Pricing.astro`
- Create: `neurokey-site/src/components/PrivacySection.astro`
- Create: `neurokey-site/src/components/Faq.astro`
- Modify: `neurokey-site/src/pages/index.astro`
- Modify: `neurokey-site/tests/e2e/homepage.spec.ts`

**Interfaces:**
- Consumes: `heroCopy`, `howItWorksCopy`, `scienceTrustCopy`, `pricingCopy`, `faqCopy`,
  `privacyCopy` from `@/content/site-copy` (Task 3).
- Produces: each component renders under a `<section data-section="...">` wrapper (values:
  `hero`, `how-it-works`, `science-trust`, `screenshots`, `pricing`, `privacy`, `faq`) so
  Playwright/tests can assert presence and ordering. Consumed by `index.astro` and by Task 9's
  robots/no-link test.

- [ ] **Step 1: Write the failing test (extend `homepage.spec.ts`)**

```typescript
test("homepage renders all required sections in order, without pilot jargon in the hero", async ({
  page,
}) => {
  await page.goto("/");
  const sections = page.locator("[data-section]");
  await expect(sections).toHaveCount(7);
  await expect(sections.nth(0)).toHaveAttribute("data-section", "hero");
  await expect(sections.nth(1)).toHaveAttribute("data-section", "how-it-works");
  await expect(sections.nth(2)).toHaveAttribute("data-section", "science-trust");
  await expect(sections.nth(3)).toHaveAttribute("data-section", "screenshots");
  await expect(sections.nth(4)).toHaveAttribute("data-section", "pricing");
  await expect(sections.nth(5)).toHaveAttribute("data-section", "privacy");
  await expect(sections.nth(6)).toHaveAttribute("data-section", "faq");

  const heroText = await page.locator('[data-section="hero"]').innerText();
  expect(heroText.toLowerCase()).not.toContain("гейт");
});

test("the privacy section links to the pilot's consent and privacy pages", async ({ page }) => {
  await page.goto("/");
  const privacySection = page.locator('[data-section="privacy"]');
  await expect(privacySection.locator('a[href="/consent"]')).toHaveCount(1);
  await expect(privacySection.locator('a[href="/privacy"]')).toHaveCount(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- homepage.spec.ts`
Expected: FAIL — only 1 `[data-section]` element exists (none yet, actually 0)

- [ ] **Step 3: Write the components**

```astro
<!-- src/components/Hero.astro -->
---
import { heroCopy } from "@/content/site-copy";
---
<section data-section="hero">
  <h1>{heroCopy.headline}</h1>
  <p>{heroCopy.subheadline}</p>
</section>
```

```astro
<!-- src/components/HowItWorks.astro -->
---
import { howItWorksCopy } from "@/content/site-copy";
---
<section data-section="how-it-works">
  <h2>Как это работает</h2>
  <ol>
    {howItWorksCopy.steps.map((step) => (
      <li>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </li>
    ))}
  </ol>
</section>
```

```astro
<!-- src/components/ScienceTrust.astro -->
---
import { scienceTrustCopy } from "@/content/site-copy";
---
<section data-section="science-trust">
  <h2>Научное обоснование</h2>
  {scienceTrustCopy.paragraphs.map((paragraph) => <p>{paragraph}</p>)}
</section>
```

```astro
<!-- src/components/Screenshots.astro -->
---
---
<section data-section="screenshots">
  <h2>Как выглядят упражнения</h2>
  <p>Скриншоты из приложения появятся здесь после первых сессий пилота.</p>
</section>
```

```astro
<!-- src/components/Pricing.astro -->
---
import { pricingCopy } from "@/content/site-copy";
---
<section data-section="pricing">
  <h2>Цены</h2>
  {pricingCopy.plans.map((plan) => (
    <div>
      <h3>{plan.name}</h3>
      <p>{plan.price}</p>
      <p>{plan.description}</p>
    </div>
  ))}
</section>
```

```astro
<!-- src/components/PrivacySection.astro -->
---
import { privacyCopy } from "@/content/site-copy";
---
<section data-section="privacy">
  <h2>Безопасность данных ребёнка</h2>
  <p>{privacyCopy.paragraph}</p>
  <a href={privacyCopy.consentLinkPath}>Согласие на обработку данных</a>
  <a href={privacyCopy.privacyLinkPath}>Политика конфиденциальности</a>
</section>
```

```astro
<!-- src/components/Faq.astro -->
---
import { faqCopy } from "@/content/site-copy";
---
<section data-section="faq">
  <h2>Частые вопросы</h2>
  {faqCopy.map((item) => (
    <details>
      <summary>{item.question}</summary>
      <p>{item.answer}</p>
    </details>
  ))}
</section>
```

- [ ] **Step 4: Assemble them in `src/pages/index.astro`**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Hero from "@/components/Hero.astro";
import HowItWorks from "@/components/HowItWorks.astro";
import ScienceTrust from "@/components/ScienceTrust.astro";
import Screenshots from "@/components/Screenshots.astro";
import Pricing from "@/components/Pricing.astro";
import PrivacySection from "@/components/PrivacySection.astro";
import Faq from "@/components/Faq.astro";
---
<BaseLayout
  title="NeuRoKey — тренировка внимания перед любимым контентом"
  description="Короткое адаптивное упражнение перед доступом к YouTube, TikTok и играм для детей 11-14 лет."
>
  <Hero />
  <HowItWorks />
  <ScienceTrust />
  <Screenshots />
  <Pricing />
  <PrivacySection />
  <Faq />
</BaseLayout>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:e2e -- homepage.spec.ts`
Expected: PASS (3/3)

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.astro src/components/HowItWorks.astro \
  src/components/ScienceTrust.astro src/components/Screenshots.astro \
  src/components/Pricing.astro src/components/PrivacySection.astro src/components/Faq.astro \
  src/pages/index.astro tests/e2e/homepage.spec.ts
git commit -m "feat: assemble homepage sections from typed content"
```

---

### Task 8: `GatedCtaForm.astro` — the gated CTA island

**Files:**
- Create: `neurokey-site/src/components/GatedCtaForm.astro`
- Modify: `neurokey-site/src/pages/index.astro`
- Create: `neurokey-site/.env.example`
- Test: `neurokey-site/tests/e2e/gated-cta.spec.ts`

**Interfaces:**
- Consumes: `submitGatedCta` from `@/lib/gated-cta` (Task 4), `trackEvent` from
  `@/lib/analytics` (Task 5).
- Reads env vars `PUBLIC_FORMSPREE_ENDPOINT` and `PUBLIC_PILOT_REGISTER_URL` (Astro exposes
  `import.meta.env.PUBLIC_*` to client code automatically).
- Produces: a `<form data-gated-cta>` with an `<input type="email" name="email">`, a submit
  button, and a `<div data-gated-cta-result>` that shows either an error message or a
  `<a data-register-link>` pointing at `PUBLIC_PILOT_REGISTER_URL` after a successful submit.
  Placed at the top of `Hero.astro` (replacing any earlier direct link) and repeated at the
  bottom of `index.astro`, per `ideaweb.md` § User Journey ("Повторный CTA внизу страницы").

- [ ] **Step 1: Write `.env.example`**

```bash
# Formspree form endpoint for the gated-CTA email capture (see https://formspree.io)
PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/REPLACE_ME

# The real neurokey-pilot parent registration URL. Today this is `/parent` on whatever host
# neurokey-pilot is deployed to — see neurokey-pilot/src/app/(parent)/parent/page.tsx.
# Open question in ideaweb.md: confirm the production URL before launch.
PUBLIC_PILOT_REGISTER_URL=https://REPLACE_ME.example.com/parent

# Plausible analytics domain (leave empty to disable analytics entirely)
PUBLIC_PLAUSIBLE_DOMAIN=
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/e2e/gated-cta.spec.ts
import { test, expect } from "@playwright/test";

test("submitting a valid email reveals the real pilot registration link", async ({ page }) => {
  await page.route("**/formspree.io/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );

  await page.goto("/");
  const form = page.locator("[data-gated-cta]").first();
  await form.locator('input[type="email"]').fill("parent@example.com");
  await form.locator('button[type="submit"]').click();

  const link = form.locator("[data-register-link]");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /.+/);
});

test("submitting an invalid email shows an error and makes no network call", async ({ page }) => {
  let requestMade = false;
  await page.route("**/formspree.io/**", (route) => {
    requestMade = true;
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/");
  const form = page.locator("[data-gated-cta]").first();
  await form.locator('input[type="email"]').fill("not-an-email");
  await form.locator('button[type="submit"]').click();

  await expect(form.locator("[data-gated-cta-error]")).toBeVisible();
  expect(requestMade).toBe(false);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:e2e -- gated-cta.spec.ts`
Expected: FAIL — no `[data-gated-cta]` element exists yet

- [ ] **Step 4: Write `src/components/GatedCtaForm.astro`**

```astro
---
const formspreeEndpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT;
const registerUrl = import.meta.env.PUBLIC_PILOT_REGISTER_URL;
---
<form data-gated-cta data-formspree-endpoint={formspreeEndpoint} data-register-url={registerUrl}>
  <label>
    Email
    <input type="email" name="email" required />
  </label>
  <button type="submit">Получить доступ к пилоту</button>
  <div data-gated-cta-result></div>
</form>

<script>
  import { submitGatedCta } from "@/lib/gated-cta";
  import { trackEvent } from "@/lib/analytics";

  for (const form of document.querySelectorAll<HTMLFormElement>("[data-gated-cta]")) {
    const resultEl = form.querySelector<HTMLDivElement>("[data-gated-cta-result]")!;
    const formspreeEndpoint = form.dataset.formspreeEndpoint!;
    const registerUrl = form.dataset.registerUrl!;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = (form.querySelector('input[type="email"]') as HTMLInputElement).value;
      const result = await submitGatedCta(email, { formspreeEndpoint, registerUrl });

      if (result.status === "invalid") {
        resultEl.innerHTML =
          '<p data-gated-cta-error>Проверьте, пожалуйста, правильность email.</p>';
        return;
      }
      if (result.status === "network-error") {
        resultEl.innerHTML =
          '<p data-gated-cta-error>Не получилось отправить, попробуйте ещё раз.</p>';
        return;
      }
      trackEvent("gated_cta_success");
      resultEl.innerHTML =
        `<a data-register-link href="${result.registerUrl}">Перейти к регистрации →</a>`;
    });
  }
</script>
```

- [ ] **Step 5: Use it in `Hero.astro` and at the bottom of `index.astro`**

```astro
<!-- src/components/Hero.astro -->
---
import { heroCopy } from "@/content/site-copy";
import GatedCtaForm from "@/components/GatedCtaForm.astro";
---
<section data-section="hero">
  <h1>{heroCopy.headline}</h1>
  <p>{heroCopy.subheadline}</p>
  <GatedCtaForm />
</section>
```

```astro
<!-- src/pages/index.astro — add before </BaseLayout> -->
  <Faq />
  <GatedCtaForm />
</BaseLayout>
```

(Also add `import GatedCtaForm from "@/components/GatedCtaForm.astro";` to `index.astro`'s
frontmatter.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:e2e -- gated-cta.spec.ts`
Expected: PASS (2/2)

- [ ] **Step 7: Commit**

```bash
git add src/components/GatedCtaForm.astro src/components/Hero.astro src/pages/index.astro \
  .env.example tests/e2e/gated-cta.spec.ts
git commit -m "feat: add gated-CTA form — email capture before pilot registration"
```

---

### Task 9: `/for-investors` page (unlinked, noindex, sequenced after the gate)

**Files:**
- Create: `neurokey-site/src/components/InvestorSections.astro`
- Create: `neurokey-site/src/pages/for-investors.astro`
- Create: `neurokey-site/public/robots.txt`
- Test: `neurokey-site/tests/e2e/for-investors.spec.ts`

**Interfaces:**
- Consumes: `investorCopy` from `@/content/site-copy` (Task 3), `BaseLayout` (Task 6).
- Produces: `/for-investors` rendered with `noindex` set on `BaseLayout`, plus a contact form
  reusing the same Formspree pattern as `GatedCtaForm` (a separate, simpler mailto-style
  submit is enough here — this form does not gate anything, it just requests the deck).

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Disallow: /for-investors
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/e2e/for-investors.spec.ts
import { test, expect } from "@playwright/test";

test("for-investors page is noindex and not linked from the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href="/for-investors"]')).toHaveCount(0);

  await page.goto("/for-investors");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("robots.txt disallows /for-investors", async ({ request }) => {
  const response = await request.get("/robots.txt");
  const body = await response.text();
  expect(body).toContain("Disallow: /for-investors");
});

test("for-investors renders problem/solution, roadmap, and a placeholder-marked metrics section", async ({
  page,
}) => {
  await page.goto("/for-investors");
  await expect(page.locator('[data-section="investor-problem-solution"]')).toBeVisible();
  await expect(page.locator('[data-section="investor-roadmap"]')).toBeVisible();
  const metrics = page.locator('[data-section="investor-metrics"]');
  await expect(metrics).toBeVisible();
  await expect(metrics).toContainText("Данные появятся");
  await expect(page.locator('[data-section="investor-contact"] form')).toBeVisible();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:e2e -- for-investors.spec.ts`
Expected: FAIL — `/for-investors` does not exist (404)

- [ ] **Step 4: Write `src/components/InvestorSections.astro`**

```astro
---
import { investorCopy } from "@/content/site-copy";
const formspreeEndpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT;
---
<section data-section="investor-problem-solution">
  <h2>Проблема и решение</h2>
  <p>{investorCopy.problemSolution.problem}</p>
  <p>{investorCopy.problemSolution.solution}</p>
</section>

<section data-section="investor-roadmap">
  <h2>Статус пилота и дорожная карта</h2>
  <ul>
    {investorCopy.roadmap.map((item) => <li>{item}</li>)}
  </ul>
</section>

<section data-section="investor-metrics">
  <h2>Метрики и тракция</h2>
  <p>{investorCopy.metrics.placeholderText}</p>
</section>

<section data-section="investor-contact">
  <h2>Запросить презентацию</h2>
  <form action={formspreeEndpoint} method="POST">
    <label>
      Email
      <input type="email" name="email" required />
    </label>
    <label>
      Комментарий
      <textarea name="message"></textarea>
    </label>
    <button type="submit">Запросить деку</button>
  </form>
</section>
```

- [ ] **Step 5: Write `src/pages/for-investors.astro`**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import InvestorSections from "@/components/InvestorSections.astro";
---
<BaseLayout
  title="NeuRoKey для инвесторов и партнёров"
  description="Статус пилота, дорожная карта и как связаться с командой NeuRoKey."
  noindex
>
  <InvestorSections />
</BaseLayout>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:e2e -- for-investors.spec.ts`
Expected: PASS (3/3)

- [ ] **Step 7: Commit**

```bash
git add src/components/InvestorSections.astro src/pages/for-investors.astro public/robots.txt \
  tests/e2e/for-investors.spec.ts
git commit -m "feat: add unlinked, noindexed /for-investors page"
```

---

### Task 10: Vercel deploy config + CI-equivalent local verification

**Files:**
- Create: `neurokey-site/vercel.json`
- Modify: `neurokey-site/README.md`

**Interfaces:**
- Produces: a `vercel.json` declaring the static build output, and a documented list of
  environment variables the Vercel project must have set before the first deploy
  (`PUBLIC_FORMSPREE_ENDPOINT`, `PUBLIC_PILOT_REGISTER_URL`, `PUBLIC_PLAUSIBLE_DOMAIN`).

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

- [ ] **Step 2: Update `README.md` with deploy instructions**

Append to `README.md`:

```markdown
## Deploying to Vercel

1. Confirm with the founder before connecting a new Vercel project or pushing a production
   deploy — this makes the site publicly reachable.
2. `vercel link` (or import the `Pereladova-lang/neurokey-site` repo via the Vercel dashboard).
3. Set environment variables in the Vercel project settings (Production + Preview):
   - `PUBLIC_FORMSPREE_ENDPOINT`
   - `PUBLIC_PILOT_REGISTER_URL`
   - `PUBLIC_PLAUSIBLE_DOMAIN` (optional — leave unset to disable analytics)
4. `vercel deploy` for a preview, `vercel deploy --prod` for production (ask first).
```

- [ ] **Step 3: Run the full test suite one more time as a release gate**

```bash
npm test
npm run test:e2e
npm run build
```

Expected: all unit tests pass, all e2e tests pass, build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: add Vercel deploy config and deployment instructions"
git push
```

- [ ] **Step 5: Confirm with the user before connecting Vercel / deploying**

Creating the Vercel project and doing the first `vercel deploy --prod` makes the site
publicly reachable — confirm with the founder before doing this step, per the plan's
"visible to others" action guidance. Do not run `vercel deploy --prod` autonomously.

---

## Self-Review Notes

- **Spec coverage:** every P0 item in `ideaweb.md` has a task — homepage sections (Task 7),
  gated CTA replacing the direct-registration CTA (Task 8), `/for-investors` with all required
  blocks (Task 9), Formspree-based forms without a custom backend (Tasks 8 & 9), privacy/consent
  linking (Task 7), mobile-safe layout (Task 6's CSS + `<meta viewport>`), analytics wiring
  (Task 5 + Task 8's `trackEvent` call). The council's revisions — gated CTA, `/for-investors`
  unlinked/noindexed and sequenced after the gate, plain-language hero — are covered by Tasks
  6-9 and the Global Constraints section.
- **Deferred by design, not by omission:** real Formspree project IDs, the real
  `PUBLIC_PILOT_REGISTER_URL`, the actual admission review process, and the final brand
  palette/logo are intentionally left as environment variables / follow-up decisions — they are
  the open questions already tracked in `ideaweb.md` § Open Questions, not implementation gaps
  in this plan.
- **Type consistency check:** `GatedCtaResult` (Task 4) is consumed with the same three status
  literals (`"invalid" | "success" | "network-error"`) in Task 8's script; `FaqItem`'s shape
  (`question`, `answer`) matches between Task 3's test and Task 7's `Faq.astro` usage;
  `investorCopy.metrics.isPlaceholder`/`placeholderText` match between Task 3 and Task 9.

