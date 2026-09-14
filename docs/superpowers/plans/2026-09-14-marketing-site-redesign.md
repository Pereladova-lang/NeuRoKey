# План реализации: визуальный редизайн сайта NeuRoKey

> **Для агентов-исполнителей:** ОБЯЗАТЕЛЬНЫЙ ПОДСКИЛЛ: используйте superpowers:subagent-driven-development (рекомендуется) или superpowers:executing-plans для выполнения плана по задачам. Шаги отмечаются чекбоксами (`- [ ]`).

**Цель:** Сделать сайт `neurokey-site` визуально похожим на настоящий сайт (шапка, подвал, карточки, иконки, читаемая сетка), не меняя тексты и логику формы подписки.

**Архитектура:** Добавляем систему дизайн-токенов и переиспользуемых CSS-классов (`.container`, `.card`, `.btn`, `.section-alt`) в `global.css`, затем последовательно оборачиваем существующую разметку каждого Astro-компонента в эти классы. Добавляем два новых компонента (`SiteHeader.astro`, `SiteFooter.astro`), подключаем их один раз в `BaseLayout.astro`.

**Технологии:** Astro 4, обычный CSS (без Tailwind и сторонних UI-библиотек), рукописные inline SVG-иконки, Vitest для юнит-тестов, Playwright для e2e.

## Общие ограничения (из спеки)

- Тексты в `src/content/site-copy.ts` не меняются.
- `src/lib/gated-cta.ts`, `src/lib/analytics.ts`, `src/lib/email.ts` не меняются.
- Никаких новых зависимостей сборки (Tailwind, компонентные фреймворки) — только рукописный CSS.
- Никаких новых картинок/скриншотов — у `Screenshots.astro` остаётся текстовая заглушка, просто с другим оформлением рамки.
- Переменные окружения, `vercel.json`, деплой — не трогаем.
- Существующие `data-section` атрибуты и их порядок на `/` (7 штук) и `/for-investors` (4 штуки) должны остаться без изменений — на них завязаны текущие e2e-тесты.
- Минимальная высота интерактивных элементов (кнопки, поля ввода) — 44px (существующее ограничение дизайна из `neurokey-pilot`, применяем и здесь).
- Все существующие тесты (`npm test`, `npm run test:e2e`) должны продолжать проходить после каждой задачи.
- Каждый коммит — с трейлером `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## Структура файлов

Новые файлы:
- `src/components/SiteHeader.astro` — шапка сайта (логотип + навигация)
- `src/components/SiteFooter.astro` — подвал сайта
- `src/lib/pilot-links.ts` — общая логика построения абсолютных ссылок на `/consent` и `/privacy` пилота (используется и шапкой/подвалом, и `PrivacySection.astro`)
- `tests/unit/pilot-links.test.ts`
- `tests/e2e/design-tokens.spec.ts`
- `tests/e2e/navigation.spec.ts`

Изменяемые файлы:
- `src/styles/global.css` — токены и утилитарные классы
- `src/layouts/BaseLayout.astro` — подключение шапки/подвала, проп `showNav`
- `src/components/PrivacySection.astro` — переход на `pilot-links.ts`, новая вёрстка
- `src/components/Hero.astro`, `GatedCtaForm.astro` — двухколоночная вёрстка, стили кнопки/поля
- `src/components/HowItWorks.astro` — карточки + SVG-иконки, добавление `id="how-it-works"`
- `src/components/ScienceTrust.astro` — карточки 4 когнитивных шкал
- `src/components/Screenshots.astro` — оформленная рамка-заглушка
- `src/components/Pricing.astro` — карточки тарифов, добавление `id="pricing"`
- `src/components/Faq.astro` — стилизованный аккордеон, добавление `id="faq"`
- `src/components/InvestorSections.astro`, `src/pages/for-investors.astro` — общий контейнер/карточки, `showNav={false}`
- `tests/e2e/homepage.spec.ts` — тест навигации (можно добавить в этот файл вместо отдельного `navigation.spec.ts` — решаем в Задаче 3)

---

### Задача 1: Дизайн-токены и утилитарные CSS-классы

**Файлы:**
- Изменить: `src/styles/global.css`
- Тест: `tests/e2e/design-tokens.spec.ts` (новый)

**Интерфейсы:**
- Производит: CSS custom properties на `:root` (`--color-bg-alt`, `--color-text-muted`, `--color-primary-dark`, `--color-border`, `--radius-sm`, `--radius-md`, `--shadow-card`, `--space-1..5`, `--container-width`, `--measure-width`) и классы `.container`, `.section-alt`, `.btn`, `.btn-primary`, `.card` — все последующие задачи используют эти имена как есть.

- [ ] **Шаг 1: Написать падающий тест**

```typescript
// tests/e2e/design-tokens.spec.ts
import { test, expect } from "@playwright/test";

test("design tokens are defined on :root", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      primaryDark: style.getPropertyValue("--color-primary-dark").trim(),
      bgAlt: style.getPropertyValue("--color-bg-alt").trim(),
      radiusMd: style.getPropertyValue("--radius-md").trim(),
      containerWidth: style.getPropertyValue("--container-width").trim(),
    };
  });
  expect(tokens.primaryDark).toBe("#4f46e5");
  expect(tokens.bgAlt).toBe("#f5f6fb");
  expect(tokens.radiusMd).toBe("16px");
  expect(tokens.containerWidth).toBe("1100px");
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Запуск: `npx playwright test tests/e2e/design-tokens.spec.ts`
Ожидается: FAIL — `--color-primary-dark` и другие новые токены ещё не определены (пустая строка вместо `#4f46e5`).

- [ ] **Шаг 3: Добавить токены и утилитарные классы в CSS**

Новое содержимое `src/styles/global.css`:

```css
:root {
  color-scheme: light;
  --color-bg: #ffffff;
  --color-bg-alt: #f5f6fb;
  --color-text: #1a1a2e;
  --color-text-muted: #5a5f7a;
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-secondary: #06b6d4;
  --color-border: #e2e4f0;
  --font-body: "Inter", system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 16px;
  --shadow-card: 0 2px 12px rgba(26, 26, 46, 0.06);

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2.5rem;
  --space-5: 4rem;

  --container-width: 1100px;
  --measure-width: 640px;
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

section {
  padding: var(--space-3);
}

.container {
  max-width: var(--container-width);
  margin: 0 auto;
  padding-inline: var(--space-3);
}

.measure {
  max-width: var(--measure-width);
  margin: 0 auto;
}

.section-alt {
  background: var(--color-bg-alt);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary-dark);
  outline-offset: 2px;
}

.card {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-3);
}
```

Обрати внимание: старое правило `section { padding: 1.5rem; max-width: 640px; margin: 0 auto; }` заменяется на `section { padding: var(--space-3); }` — ширину и центрирование теперь каждый раздел задаёт сам через `.container` (в следующих задачах), а не общее правило `section` (иначе разделы не смогут стать шире 640px).

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Запуск: `npx playwright test tests/e2e/design-tokens.spec.ts`
Ожидается: PASS

- [ ] **Шаг 5: Запустить полный набор тестов на регрессию**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят (включая `responsive.spec.ts` — секции стали `padding: var(--space-3)` без `max-width`, но контента внутри пока не изменилось, горизонтального скролла быть не должно).

- [ ] **Шаг 6: Закоммитить**

```bash
git add src/styles/global.css tests/e2e/design-tokens.spec.ts
git commit -m "$(cat <<'EOF'
feat: add design tokens and shared utility classes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 2: `pilot-links.ts` и обновление `PrivacySection.astro`

**Файлы:**
- Создать: `src/lib/pilot-links.ts`
- Создать: `tests/unit/pilot-links.test.ts`
- Изменить: `src/components/PrivacySection.astro`

**Интерфейсы:**
- Потребляет: `import.meta.env.PUBLIC_PILOT_BASE_URL`, `privacyCopy.consentLinkPath` / `privacyCopy.privacyLinkPath` из `@/content/site-copy` (уже существуют).
- Производит: `pilotConsentUrl(baseUrl: string): string`, `pilotPrivacyUrl(baseUrl: string): string` — используются в Задаче 3 подвалом сайта.

- [ ] **Шаг 1: Написать падающий юнит-тест**

```typescript
// tests/unit/pilot-links.test.ts
import { describe, it, expect } from "vitest";
import { pilotConsentUrl, pilotPrivacyUrl } from "@/lib/pilot-links";

describe("pilot-links", () => {
  it("builds an absolute consent URL from a base URL", () => {
    expect(pilotConsentUrl("https://neurokey-pilot-production.up.railway.app")).toBe(
      "https://neurokey-pilot-production.up.railway.app/consent"
    );
  });

  it("builds an absolute privacy URL from a base URL", () => {
    expect(pilotPrivacyUrl("https://neurokey-pilot-production.up.railway.app")).toBe(
      "https://neurokey-pilot-production.up.railway.app/privacy"
    );
  });
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Запуск: `npx vitest run tests/unit/pilot-links.test.ts`
Ожидается: FAIL — модуль `@/lib/pilot-links` не найден.

- [ ] **Шаг 3: Написать реализацию**

```typescript
// src/lib/pilot-links.ts
import { privacyCopy } from "@/content/site-copy";

export function pilotConsentUrl(baseUrl: string): string {
  return `${baseUrl}${privacyCopy.consentLinkPath}`;
}

export function pilotPrivacyUrl(baseUrl: string): string {
  return `${baseUrl}${privacyCopy.privacyLinkPath}`;
}
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Запуск: `npx vitest run tests/unit/pilot-links.test.ts`
Ожидается: PASS

- [ ] **Шаг 5: Обновить `PrivacySection.astro`, использовать новый хелпер и новую вёрстку**

```astro
---
import { privacyCopy } from "@/content/site-copy";
import { pilotConsentUrl, pilotPrivacyUrl } from "@/lib/pilot-links";

const pilotBaseUrl = import.meta.env.PUBLIC_PILOT_BASE_URL;
const consentUrl = pilotConsentUrl(pilotBaseUrl);
const privacyUrl = pilotPrivacyUrl(pilotBaseUrl);
---
<section data-section="privacy" class="section-alt">
  <div class="container measure">
    <h2>Безопасность данных ребёнка</h2>
    <p>{privacyCopy.paragraph}</p>
    <p>
      <a href={consentUrl}>Согласие на обработку данных</a>
      {" · "}
      <a href={privacyUrl}>Политика конфиденциальности</a>
    </p>
  </div>
</section>
```

- [ ] **Шаг 6: Прогнать существующий e2e-тест приватности, убедиться, что он всё ещё проходит**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "privacy section links"`
Ожидается: PASS (ссылки и их `href`-паттерн не изменились, изменилась только окружающая разметка)

- [ ] **Шаг 7: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят

- [ ] **Шаг 8: Закоммитить**

```bash
git add src/lib/pilot-links.ts tests/unit/pilot-links.test.ts src/components/PrivacySection.astro
git commit -m "$(cat <<'EOF'
refactor: extract pilot-links helper, restyle privacy section

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 3: Шапка и подвал сайта

**Файлы:**
- Создать: `src/components/SiteHeader.astro`
- Создать: `src/components/SiteFooter.astro`
- Изменить: `src/layouts/BaseLayout.astro`
- Изменить: `src/pages/for-investors.astro`
- Изменить: `src/components/HowItWorks.astro` (добавить `id="how-it-works"`)
- Изменить: `src/components/Pricing.astro` (добавить `id="pricing"`)
- Изменить: `src/components/Faq.astro` (добавить `id="faq"`)
- Изменить: `tests/e2e/homepage.spec.ts` (добавить тест навигации)

**Интерфейсы:**
- Потребляет: `pilotConsentUrl`, `pilotPrivacyUrl` из `@/lib/pilot-links` (Задача 2); `import.meta.env.PUBLIC_PILOT_BASE_URL`.
- Производит: `BaseLayout` проп `showNav?: boolean` (по умолчанию `true`); `id` атрибуты `how-it-works`, `pricing`, `faq` на соответствующих `<section>` — используются якорной навигацией.

- [ ] **Шаг 1: Написать падающий e2e-тест навигации**

Добавить в конец `tests/e2e/homepage.spec.ts`:

```typescript
test("homepage has a header with anchor navigation to key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toContainText("NeuRoKey");
  await expect(page.locator('header a[href="#how-it-works"]')).toHaveCount(1);
  await expect(page.locator('header a[href="#pricing"]')).toHaveCount(1);
  await expect(page.locator('header a[href="#faq"]')).toHaveCount(1);
  await expect(page.locator("#how-it-works")).toHaveAttribute("data-section", "how-it-works");
  await expect(page.locator("#pricing")).toHaveAttribute("data-section", "pricing");
  await expect(page.locator("#faq")).toHaveAttribute("data-section", "faq");
});

test("homepage has a footer with consent and privacy links", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.locator('a[href$="/consent"]')).toHaveCount(1);
  await expect(footer.locator('a[href$="/privacy"]')).toHaveCount(1);
});

test("for-investors header has no section anchor navigation", async ({ page }) => {
  await page.goto("/for-investors");
  await expect(page.locator("header")).toContainText("NeuRoKey");
  await expect(page.locator('header a[href="#how-it-works"]')).toHaveCount(0);
});
```

- [ ] **Шаг 2: Запустить тесты и убедиться, что они падают**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts`
Ожидается: FAIL — элементов `header`, `footer` пока не существует.

- [ ] **Шаг 3: Создать `SiteHeader.astro`**

```astro
---
interface Props {
  showNav?: boolean;
}
const { showNav = true } = Astro.props;
---
<header class="site-header">
  <div class="container site-header__inner">
    <a href="/" class="site-header__wordmark">NeuRoKey</a>
    {showNav && (
      <nav class="site-header__nav">
        <a href="#how-it-works">Как это работает</a>
        <a href="#pricing">Цены</a>
        <a href="#faq">Вопросы</a>
      </nav>
    )}
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--color-border);
  }
  .site-header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .site-header__wordmark {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-text);
    text-decoration: none;
  }
  .site-header__nav {
    display: flex;
    gap: var(--space-3);
  }
  .site-header__nav a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 600;
  }
  .site-header__nav a:hover {
    color: var(--color-primary);
  }
</style>
```

- [ ] **Шаг 4: Создать `SiteFooter.astro`**

```astro
---
import { pilotConsentUrl, pilotPrivacyUrl } from "@/lib/pilot-links";

const pilotBaseUrl = import.meta.env.PUBLIC_PILOT_BASE_URL;
const consentUrl = pilotConsentUrl(pilotBaseUrl);
const privacyUrl = pilotPrivacyUrl(pilotBaseUrl);
---
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p>© 2026 NeuRoKey</p>
    <p>
      <a href={consentUrl}>Согласие на обработку данных</a>
      {" · "}
      <a href={privacyUrl}>Политика конфиденциальности</a>
    </p>
  </div>
</footer>

<style>
  .site-footer {
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-5);
  }
  .site-footer__inner {
    padding-block: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
  .site-footer__inner a {
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Шаг 5: Подключить шапку и подвал в `BaseLayout.astro`**

```astro
---
import "../styles/global.css";
import SiteHeader from "../components/SiteHeader.astro";
import SiteFooter from "../components/SiteFooter.astro";

interface Props {
  title: string;
  description: string;
  noindex?: boolean;
  showNav?: boolean;
}

const { title, description, noindex = false, showNav = true } = Astro.props;
---
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    {import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN && (
      <script
        defer
        data-domain={import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN}
        src="https://plausible.io/js/script.js"
      ></script>
    )}
  </head>
  <body>
    <SiteHeader showNav={showNav} />
    <slot />
    <SiteFooter />
  </body>
</html>
```

- [ ] **Шаг 6: Передать `showNav={false}` из `for-investors.astro`**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import InvestorSections from "@/components/InvestorSections.astro";
---
<BaseLayout
  title="NeuRoKey для инвесторов и партнёров"
  description="Статус пилота, дорожная карта и как связаться с командой NeuRoKey."
  noindex
  showNav={false}
>
  <InvestorSections />
</BaseLayout>
```

- [ ] **Шаг 7: Добавить `id` на нужные секции**

В `src/components/HowItWorks.astro` заменить `<section data-section="how-it-works">` на:
```astro
<section data-section="how-it-works" id="how-it-works">
```

В `src/components/Pricing.astro` заменить `<section data-section="pricing">` на:
```astro
<section data-section="pricing" id="pricing">
```

В `src/components/Faq.astro` заменить `<section data-section="faq">` на:
```astro
<section data-section="faq" id="faq">
```

- [ ] **Шаг 8: Запустить тесты и убедиться, что они проходят**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts`
Ожидается: PASS

- [ ] **Шаг 9: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят (включая `for-investors.spec.ts` — там по-прежнему нет ссылки `a[href="/for-investors"]` на главной, а `noindex` не изменился)

- [ ] **Шаг 10: Закоммитить**

```bash
git add src/components/SiteHeader.astro src/components/SiteFooter.astro \
  src/layouts/BaseLayout.astro src/pages/for-investors.astro \
  src/components/HowItWorks.astro src/components/Pricing.astro src/components/Faq.astro \
  tests/e2e/homepage.spec.ts
git commit -m "$(cat <<'EOF'
feat: add site header and footer with anchor navigation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 4: Hero и GatedCtaForm — двухколоночная вёрстка и стили кнопки/поля

**Файлы:**
- Изменить: `src/components/Hero.astro`
- Изменить: `src/components/GatedCtaForm.astro`
- Изменить: `tests/e2e/gated-cta.spec.ts` (добавить проверку стилизации)

**Интерфейсы:**
- Потребляет: классы `.container`, `.card`, `.btn`, `.btn-primary` из Задачи 1.
- Не меняет: `data-gated-cta`, `data-gated-cta-result`, `data-gated-cta-error`, `data-register-link` — эти атрибуты используются в `src/lib` и в существующих e2e-тестах, менять нельзя.

- [ ] **Шаг 1: Написать падающий e2e-тест на стиль кнопки**

Добавить в `tests/e2e/gated-cta.spec.ts`:

```typescript
test("submit button uses the primary button style", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("[data-gated-cta] button[type=submit]").first();
  await expect(button).toHaveClass(/btn-primary/);
  const bg = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(99, 102, 241)");
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Запуск: `npx playwright test tests/e2e/gated-cta.spec.ts -g "primary button style"`
Ожидается: FAIL — у кнопки пока нет класса `btn-primary`.

- [ ] **Шаг 3: Обновить `GatedCtaForm.astro`**

```astro
---
const formspreeEndpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT;
const registerUrl = import.meta.env.PUBLIC_PILOT_REGISTER_URL;

if (!formspreeEndpoint) {
  throw new Error(
    "GatedCtaForm: PUBLIC_FORMSPREE_ENDPOINT is not set — the gated-CTA form cannot be built " +
      "without it. Set it in the environment (see .env.example)."
  );
}
if (!registerUrl) {
  throw new Error(
    "GatedCtaForm: PUBLIC_PILOT_REGISTER_URL is not set — the gated-CTA form cannot be built " +
      "without it. Set it in the environment (see .env.example)."
  );
}
---
<form
  class="gated-cta card"
  data-gated-cta
  data-formspree-endpoint={formspreeEndpoint}
  data-register-url={registerUrl}
  novalidate
>
  <label class="gated-cta__label">
    Email
    <input class="gated-cta__input" type="email" name="email" required />
  </label>
  <button class="btn btn-primary gated-cta__submit" type="submit">
    Получить доступ к пилоту
  </button>
  <div data-gated-cta-result class="gated-cta__result"></div>
</form>

<style>
  .gated-cta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .gated-cta__label {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-weight: 600;
  }
  .gated-cta__input {
    min-height: 44px;
    padding: var(--space-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    font-family: var(--font-body);
  }
  .gated-cta__input:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }
  .gated-cta__submit {
    width: 100%;
  }
  .gated-cta__result :global([data-gated-cta-error]) {
    color: #b42318;
    background: #fef3f2;
    border-radius: var(--radius-sm);
    padding: var(--space-1);
  }
  .gated-cta__result :global([data-register-link]) {
    display: inline-block;
    color: #067647;
    background: #ecfdf3;
    border-radius: var(--radius-sm);
    padding: var(--space-1);
    text-decoration: none;
    font-weight: 600;
  }
</style>

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

Примечание: скрипт (`<script>`) и вся логика внутри него — без изменений, менялась только разметка и добавились стили выше неё.

- [ ] **Шаг 4: Обновить `Hero.astro` под двухколоночную вёрстку**

```astro
---
import { heroCopy } from "@/content/site-copy";
import GatedCtaForm from "@/components/GatedCtaForm.astro";
---
<section data-section="hero" class="hero">
  <div class="container hero__inner">
    <div class="hero__copy">
      <h1>{heroCopy.headline}</h1>
      <p>{heroCopy.subheadline}</p>
    </div>
    <div class="hero__cta">
      <GatedCtaForm />
    </div>
  </div>
</section>

<style>
  .hero {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary) 8%, white),
      color-mix(in srgb, var(--color-secondary) 8%, white)
    );
  }
  .hero__inner {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--space-4);
    align-items: center;
    padding-block: var(--space-5);
  }
  .hero__copy h1 {
    font-size: 2.25rem;
    line-height: 1.2;
  }
  .hero__copy p {
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }
  @media (max-width: 800px) {
    .hero__inner {
      grid-template-columns: 1fr;
      padding-block: var(--space-4);
    }
  }
</style>
```

- [ ] **Шаг 5: Запустить тест и убедиться, что он проходит**

Запуск: `npx playwright test tests/e2e/gated-cta.spec.ts`
Ожидается: PASS (все тесты в файле, включая новый и два существующих про валидный/невалидный email)

- [ ] **Шаг 6: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят, включая `responsive.spec.ts` (двухколоночный Hero складывается в одну колонку через `@media (max-width: 800px)`, при 400px горизонтального скролла быть не должно)

- [ ] **Шаг 7: Закоммитить**

```bash
git add src/components/Hero.astro src/components/GatedCtaForm.astro tests/e2e/gated-cta.spec.ts
git commit -m "$(cat <<'EOF'
feat: restyle hero and gated CTA form with card layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 5: HowItWorks — карточки и SVG-иконки

**Файлы:**
- Изменить: `src/components/HowItWorks.astro`
- Изменить: `tests/e2e/homepage.spec.ts` (добавить проверку карточек/иконок)

**Интерфейсы:**
- Потребляет: `howItWorksCopy.steps` из `@/content/site-copy` (без изменений, 3 шага), классы `.container`, `.card`.

- [ ] **Шаг 1: Написать падающий e2e-тест**

Добавить в `tests/e2e/homepage.spec.ts`:

```typescript
test("how-it-works renders one card with an icon per step", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('[data-section="how-it-works"]');
  const cards = section.locator(".card");
  await expect(cards).toHaveCount(3);
  const icons = section.locator(".card svg");
  await expect(icons).toHaveCount(3);
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "how-it-works renders"`
Ожидается: FAIL — карточек и `svg` пока нет.

- [ ] **Шаг 3: Обновить `HowItWorks.astro`**

```astro
---
import { howItWorksCopy } from "@/content/site-copy";

const icons = [
  // открыть приложение
  `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="17" r="1"/></svg>`,
  // упражнение
  `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>`,
  // разблокировка
  `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>`,
];
---
<section data-section="how-it-works" id="how-it-works" class="section-alt">
  <div class="container">
    <h2>Как это работает</h2>
    <ol class="how-it-works__list">
      {howItWorksCopy.steps.map((step, i) => (
        <li class="card how-it-works__card">
          <span class="how-it-works__icon" set:html={icons[i]} />
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .how-it-works__list {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3);
    padding: 0;
    margin: var(--space-3) 0 0;
  }
  .how-it-works__card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .how-it-works__icon {
    color: var(--color-primary);
  }
</style>
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "how-it-works renders"`
Ожидается: PASS

- [ ] **Шаг 5: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят

- [ ] **Шаг 6: Закоммитить**

```bash
git add src/components/HowItWorks.astro tests/e2e/homepage.spec.ts
git commit -m "$(cat <<'EOF'
feat: restyle how-it-works section as icon cards

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 6: ScienceTrust — карточки шкал и Screenshots — заглушка-рамка

**Файлы:**
- Изменить: `src/components/ScienceTrust.astro`
- Изменить: `src/components/Screenshots.astro`
- Изменить: `tests/e2e/homepage.spec.ts` (добавить проверки)

**Интерфейсы:**
- Потребляет: `scienceTrustCopy.paragraphs` из `@/content/site-copy` (без изменений). Названия 4 шкал (`Внимание`, `Память`, `Логика`, `Самоконтроль`) — статичные подписи-лейблы, не новый источник данных (совпадают с `attention`/`memory`/`logic`/`control` из `neurokey-pilot`).

- [ ] **Шаг 1: Написать падающий e2e-тест**

Добавить в `tests/e2e/homepage.spec.ts`:

```typescript
test("science-trust shows the 4 cognitive scale labels as cards", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('[data-section="science-trust"]');
  await expect(section.locator(".card")).toHaveCount(4);
  await expect(section).toContainText("Внимание");
  await expect(section).toContainText("Память");
  await expect(section).toContainText("Логика");
  await expect(section).toContainText("Самоконтроль");
});

test("screenshots section is styled as a placeholder frame", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('[data-section="screenshots"] .screenshots__frame');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveCSS("border-style", "dashed");
});
```

- [ ] **Шаг 2: Запустить тесты и убедиться, что они падают**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "science-trust|screenshots"`
Ожидается: FAIL

- [ ] **Шаг 3: Обновить `ScienceTrust.astro`**

```astro
---
import { scienceTrustCopy } from "@/content/site-copy";

const scales = ["Внимание", "Память", "Логика", "Самоконтроль"];
---
<section data-section="science-trust">
  <div class="container">
    <h2>Научное обоснование</h2>
    {scienceTrustCopy.paragraphs.map((paragraph) => <p class="measure">{paragraph}</p>)}
    <ul class="science-trust__scales">
      {scales.map((scale) => (
        <li class="card science-trust__scale">{scale}</li>
      ))}
    </ul>
  </div>
</section>

<style>
  .science-trust__scales {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-2);
    padding: 0;
    margin: var(--space-3) 0 0;
  }
  .science-trust__scale {
    text-align: center;
    font-weight: 600;
    color: var(--color-primary);
  }
</style>
```

- [ ] **Шаг 4: Обновить `Screenshots.astro`**

```astro
---
---
<section data-section="screenshots" class="section-alt">
  <div class="container">
    <h2>Как выглядят упражнения</h2>
    <div class="screenshots__frame">
      <p>Скриншоты из приложения появятся здесь после первых сессий пилота.</p>
    </div>
  </div>
</section>

<style>
  .screenshots__frame {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-5);
    text-align: center;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Шаг 5: Запустить тесты и убедиться, что они проходят**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "science-trust|screenshots"`
Ожидается: PASS

- [ ] **Шаг 6: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят

- [ ] **Шаг 7: Закоммитить**

```bash
git add src/components/ScienceTrust.astro src/components/Screenshots.astro tests/e2e/homepage.spec.ts
git commit -m "$(cat <<'EOF'
feat: restyle science-trust scales and screenshots placeholder

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 7: Pricing — карточки тарифов и Faq — стилизованный аккордеон

**Файлы:**
- Изменить: `src/components/Pricing.astro`
- Изменить: `src/components/Faq.astro`
- Изменить: `tests/e2e/homepage.spec.ts` (добавить проверки)

**Интерфейсы:**
- Потребляет: `pricingCopy.plans`, `faqCopy` из `@/content/site-copy` (без изменений).

- [ ] **Шаг 1: Написать падающий e2e-тест**

Добавить в `tests/e2e/homepage.spec.ts`:

```typescript
test("pricing renders each plan as a card", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('[data-section="pricing"]');
  await expect(section.locator(".card")).toHaveCount(2);
});

test("faq entries render as styled accordion rows", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('[data-section="faq"]');
  const rows = section.locator("details.faq__item");
  await expect(rows).toHaveCount(4);
});
```

- [ ] **Шаг 2: Запустить тесты и убедиться, что они падают**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "pricing renders|faq entries"`
Ожидается: FAIL

- [ ] **Шаг 3: Обновить `Pricing.astro`**

```astro
---
import { pricingCopy } from "@/content/site-copy";
---
<section data-section="pricing" id="pricing">
  <div class="container">
    <h2>Цены</h2>
    <div class="pricing__plans">
      {pricingCopy.plans.map((plan) => (
        <div class="card pricing__plan">
          <h3>{plan.name}</h3>
          <p class="pricing__price">{plan.price}</p>
          <p>{plan.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .pricing__plans {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
  .pricing__price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
  }
</style>
```

- [ ] **Шаг 4: Обновить `Faq.astro`**

```astro
---
import { faqCopy } from "@/content/site-copy";
---
<section data-section="faq" id="faq" class="section-alt">
  <div class="container measure">
    <h2>Частые вопросы</h2>
    {faqCopy.map((item) => (
      <details class="faq__item">
        <summary>{item.question}</summary>
        <p>{item.answer}</p>
      </details>
    ))}
  </div>
</section>

<style>
  .faq__item {
    border-bottom: 1px solid var(--color-border);
    padding-block: var(--space-2);
  }
  .faq__item summary {
    cursor: pointer;
    font-weight: 600;
    list-style: none;
  }
  .faq__item summary::-webkit-details-marker {
    display: none;
  }
  .faq__item summary::before {
    content: "+";
    display: inline-block;
    width: 1em;
    color: var(--color-primary);
  }
  .faq__item[open] summary::before {
    content: "–";
  }
  .faq__item p {
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
</style>
```

- [ ] **Шаг 5: Запустить тесты и убедиться, что они проходят**

Запуск: `npx playwright test tests/e2e/homepage.spec.ts -g "pricing renders|faq entries"`
Ожидается: PASS

- [ ] **Шаг 6: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят

- [ ] **Шаг 7: Закоммитить**

```bash
git add src/components/Pricing.astro src/components/Faq.astro tests/e2e/homepage.spec.ts
git commit -m "$(cat <<'EOF'
feat: restyle pricing cards and faq accordion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 8: InvestorSections — единый контейнер/карточки для `/for-investors`

**Файлы:**
- Изменить: `src/components/InvestorSections.astro`
- Изменить: `tests/e2e/for-investors.spec.ts` (добавить проверку)

**Интерфейсы:**
- Потребляет: `investorCopy` из `@/content/site-copy` (без изменений), `import.meta.env.PUBLIC_FORMSPREE_ENDPOINT` (без изменений), классы `.container`, `.card`, `.btn`, `.btn-primary`.
- Не меняет: 4 `data-section` значения (`investor-problem-solution`, `investor-roadmap`, `investor-metrics`, `investor-contact`) и их порядок.

- [ ] **Шаг 1: Написать падающий e2e-тест**

Добавить в `tests/e2e/for-investors.spec.ts`:

```typescript
test("investor sections use the shared container and card styling", async ({ page }) => {
  await page.goto("/for-investors");
  await expect(page.locator('[data-section="investor-problem-solution"] .container')).toHaveCount(1);
  await expect(page.locator('[data-section="investor-contact"] form.card')).toHaveCount(1);
  const submitButton = page.locator('[data-section="investor-contact"] button[type=submit]');
  await expect(submitButton).toHaveClass(/btn-primary/);
});
```

- [ ] **Шаг 2: Запустить тест и убедиться, что он падает**

Запуск: `npx playwright test tests/e2e/for-investors.spec.ts -g "shared container"`
Ожидается: FAIL

- [ ] **Шаг 3: Обновить `InvestorSections.astro`**

```astro
---
import { investorCopy } from "@/content/site-copy";
const formspreeEndpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT;
---
<section data-section="investor-problem-solution">
  <div class="container measure">
    <h2>Проблема и решение</h2>
    <p>{investorCopy.problemSolution.problem}</p>
    <p>{investorCopy.problemSolution.solution}</p>
  </div>
</section>

<section data-section="investor-roadmap" class="section-alt">
  <div class="container measure">
    <h2>Статус пилота и дорожная карта</h2>
    <ul>
      {investorCopy.roadmap.map((item) => <li>{item}</li>)}
    </ul>
  </div>
</section>

<section data-section="investor-metrics">
  <div class="container measure">
    <h2>Метрики и тракция</h2>
    <p>{investorCopy.metrics.placeholderText}</p>
  </div>
</section>

<section data-section="investor-contact" class="section-alt">
  <div class="container measure">
    <h2>Запросить презентацию</h2>
    <form class="card investor-contact__form" action={formspreeEndpoint} method="POST">
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <label>
        Комментарий
        <textarea name="message"></textarea>
      </label>
      <button class="btn btn-primary" type="submit">Запросить деку</button>
    </form>
  </div>
</section>

<style>
  .investor-contact__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .investor-contact__form input,
  .investor-contact__form textarea {
    min-height: 44px;
    padding: var(--space-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 1rem;
  }
</style>
```

- [ ] **Шаг 4: Запустить тест и убедиться, что он проходит**

Запуск: `npx playwright test tests/e2e/for-investors.spec.ts`
Ожидается: PASS (все тесты в файле)

- [ ] **Шаг 5: Прогнать полный набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все тесты проходят

- [ ] **Шаг 6: Закоммитить**

```bash
git add src/components/InvestorSections.astro tests/e2e/for-investors.spec.ts
git commit -m "$(cat <<'EOF'
feat: restyle investor page with shared container and card styling

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Задача 9: Финальная проверка адаптивности и полный прогон

**Файлы:**
- Тест: `tests/e2e/responsive.spec.ts` (без изменений в этой задаче — используется как регрессионный тест)
- Возможное изменение (только если шаг 2 покажет проблему): точечные `@media` правки в файлах из задач 4–8.

**Интерфейсы:**
- Не вводит новых интерфейсов — финальная регрессионная проверка всего, что сделано в задачах 1–8.

- [ ] **Шаг 1: Прогнать весь набор тестов**

Запуск: `npm test && npm run test:e2e`
Ожидается: все юнит- и e2e-тесты проходят (это база — если что-то красное, останавливаемся и чиним перед следующим шагом).

- [ ] **Шаг 2: Вручную проверить сборку и адаптивность в браузере**

```bash
npm run build && npm run preview
```

Открыть `http://localhost:4321` (или порт, который выведет `preview`) и вручную проверить в инструментах разработчика при ширине экрана 400px, 800px и 1400px:
- на `/` нет горизонтального скролла;
- Hero складывается в одну колонку на узком экране;
- карточки "Как это работает" и "Цены" не наезжают друг на друга;
- шапка и подвал не ломаются (навигация может отсутствовать/переноситься, но не должна вылезать за экран);
- то же самое проверить на `/for-investors`.

Если найдена проблема — исправить конкретное CSS-правило в соответствующем компоненте и повторить `npm run test:e2e` для `responsive.spec.ts`, прежде чем коммитить.

- [ ] **Шаг 3: Закоммитить точечные правки, если они понадобились**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: address responsive layout issues found in manual QA

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Если правок не понадобилось — этот шаг пропускается, коммитить нечего.

- [ ] **Шаг 4: Запушить всё в `origin/main`**

```bash
git push
```

---

## Итог

После выполнения всех 9 задач сайт получит шапку, подвал, карточки, сетки и иконки во всех разделах, двухколоночный Hero, стилизованную форму подписки и аккордеон FAQ — без единого изменения текста или логики. Деплой на Vercel подхватит изменения автоматически при пуше в `main` (если подключён auto-deploy от GitHub — уточнить у founder после завершения плана, требуется ли ручной redeploy).
