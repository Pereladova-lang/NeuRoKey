# NeuRoKey marketing site — visual redesign

Status: approved for planning
Date: 2026-09-14
Repo affected: `neurokey-site` (separate repo, deployed to Vercel at neurokey-site.vercel.app)

## Problem

The marketing site (`neurokey-site`) is functionally complete and live — homepage, gated
sign-up CTA, `/for-investors` — but has no visual design beyond browser defaults: no header,
no footer, no button/card styling, narrow 640px text column, single font weight/size scale.
It reads as a plain document, not a website. The founder confirmed the content and gated-CTA
mechanics are correct and should not change — this is a visual/layout redesign only.

## Scope

- Add design tokens (extended color scale, spacing, radius, shadow) to
  `src/styles/global.css`.
- Add a site header (logo/name + anchor nav to sections) and footer (copyright + repeated
  privacy/consent links), currently absent.
- Restyle every homepage section (`Hero`, `HowItWorks`, `ScienceTrust`, `Screenshots`,
  `Pricing`, `PrivacySection`, `Faq`) and the gated CTA form/button with cards, grids, and
  inline SVG icons for `HowItWorks`.
- Convert FAQ to a native `<details>/<summary>` accordion (already `<details>`-based; style it,
  no JS change).
- Widen the page container (~1100px) while keeping a narrower text measure inside
  paragraph-heavy sections for readability.
- Apply the same header/footer/token system to `/for-investors` so it doesn't look
  inconsistent with the redesigned homepage, without redesigning its content layout in
  detail (out of scope — noindexed, low-traffic page; gets the shared header/footer/tokens
  only).

**Explicitly out of scope:**
- No content/copy changes (`src/content/site-copy.ts` untouched).
- No changes to `src/lib/gated-cta.ts`, `src/lib/analytics.ts`, `src/lib/email.ts` — pure
  logic is untouched.
- No new build tooling (no Tailwind, no component framework) — hand-written CSS only, to
  keep the existing minimal Astro + Vitest + Playwright setup unchanged.
- No new image assets (product screenshots) — `Screenshots.astro` keeps its placeholder
  copy, just gets a styled placeholder frame instead of bare text.
- No changes to env vars, Vercel config, or deployment.

## Design

### Design tokens (`src/styles/global.css`)

Extend the existing 3-color/1-font token set into a small system:

```css
:root {
  color-scheme: light;
  --color-bg: #ffffff;
  --color-bg-alt: #f5f6fb;       /* alternating section background */
  --color-text: #1a1a2e;
  --color-text-muted: #5a5f7a;
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5; /* hover/active state */
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
  --measure-width: 640px; /* narrow column for dense text (FAQ, science-trust paragraphs) */
}
```

Shared utility classes added to `global.css` (used across components):
- `.container` — `max-width: var(--container-width); margin: 0 auto; padding-inline: var(--space-3);`
- `.section-alt` — applies `--color-bg-alt` background, for visually alternating sections.
- `.btn` / `.btn-primary` — padding, `border-radius: var(--radius-sm)`, background
  `--color-primary`, `color: #fff`, hover → `--color-primary-dark`, focus-visible outline for
  accessibility, `min-height: 44px` (existing child-facing touch-target constraint from the
  main app's design constraints applies to any interactive control here too).
- `.card` — `background: var(--color-bg); border-radius: var(--radius-md); box-shadow:
  var(--shadow-card); padding: var(--space-3);`

`section` keeps acting as the layout primitive but sections now opt into `.container` (and
optionally `.section-alt`) rather than the current blanket 640px max-width — so each
component controls its own width instead of every section being forced narrow.

### Header (new: `src/components/SiteHeader.astro`)

- Rendered once, inside `BaseLayout.astro` (not per-page), so both `/` and `/for-investors`
  get it automatically.
- Left: "NeuRoKey" wordmark (text, no logo image — no new asset). Links to `/`.
- Right (homepage only — see below): anchor nav linking to `#how-it-works`, `#pricing`,
  `#faq` (adds matching `id` attributes to those sections; doesn't touch their existing
  `data-section` attributes, which e2e tests key off of).
- On `/for-investors`, nav links are omitted (that page has different sections); header shows
  just the wordmark.
- `BaseLayout` gains an optional `showNav` prop (default `true`) so `for-investors.astro` can
  pass `showNav={false}` — avoids hardcoding page-specific behavior into a shared header
  component via a magic path check.

### Footer (new: `src/components/SiteFooter.astro`)

- Rendered once, inside `BaseLayout.astro`, after `<slot />`.
- Copyright line ("© 2026 NeuRoKey") + the same consent/privacy links already built in
  `PrivacySection.astro`. To avoid duplicating the `pilotBaseUrl` + path concatenation logic,
  extract a tiny helper `src/lib/pilot-links.ts` exporting `pilotConsentUrl()` /
  `pilotPrivacyUrl()` (reads `PUBLIC_PILOT_BASE_URL` + the path constants from
  `site-copy.ts`), used by both `PrivacySection.astro` and `SiteFooter.astro`.

### Section-by-section visual treatment

- **Hero** — two-column layout on wide viewports (headline+subheadline left, gated CTA form
  as a `.card` on the right), stacking to one column under ~800px. Background: subtle
  gradient using `--color-primary`/`--color-secondary` at low opacity, not a solid block —
  keeps body text readable without needing separate light/dark text handling.
- **HowItWorks** — 3 steps as `.card` items in a `grid` (`repeat(auto-fit, minmax(220px,
  1fr))`, so it's 3-across wide and stacks narrow automatically — no separate media query
  needed for the reflow itself, only for verifying no horizontal scroll per the existing
  responsive e2e test). Each card gets one inline SVG icon (open app / exercise / unlock —
  simple stroke icons in `--color-primary`, hand-authored `<svg>`, no icon library
  dependency).
- **ScienceTrust** — the 4 cognitive scales (attention/memory/logic/control) mentioned in the
  copy get pulled into a 4-up small `.card` grid of labels (not a new data source — these are
  the same 4 names already in the design-constraints doc, added as static markup labels
  alongside the existing paragraph copy, not replacing it).
- **Screenshots** — styled as a bordered placeholder frame (`.card`, dashed border,
  centered placeholder text) instead of bare paragraph text.
- **Pricing** — 2 plan cards side by side (`.card` + `.btn-primary`-styled visual weight on
  price), stacking on narrow viewports.
- **PrivacySection** — icon (shield, inline SVG) + text + the two links styled as underlined
  inline links (not chips — chips implied a button-like affordance these aren't).
- **Faq** — existing `<details>/<summary>` styled: bordered `.card`-like rows, custom
  disclosure arrow via CSS, no JS change.
- **GatedCtaForm** — input + button restyled (`.btn-primary` on the submit button, bordered
  input with focus state), success/error message (`data-gated-cta-result`) styled as an inline
  banner (green-tinted for success, red-tinted for error) rather than bare text.
- **InvestorSections** (`/for-investors`) — gets `.container` + `.card` treatment for
  consistency (so it doesn't look broken next to the redesigned homepage) but keeps its
  current single-column section order; not a full redesign pass.

### Responsive behavior

Existing `tests/e2e/responsive.spec.ts` asserts no horizontal scroll at 400×800 on both `/`
and `/for-investors` — this must keep passing. Grids use `auto-fit`/`minmax` so they reflow
without bespoke breakpoints; the two-column Hero and Pricing layouts get one explicit
`max-width` media query (`@media (max-width: 800px)`) to force single-column stacking, since
flex/grid alone won't naturally stack a fixed two-column hero.

### Testing impact

- No unit test changes — `src/lib/*` untouched except the new `pilot-links.ts` helper, which
  gets its own unit test (pure function, same pattern as existing `src/lib/` modules) covering
  both URL outputs.
- Existing e2e tests keep passing unchanged: `data-section` attributes, their order/count,
  hero text content, and the `href` patterns on consent/privacy links are all preserved
  exactly — only wrapping markup/classes change around them.
- `responsive.spec.ts` must keep passing as-is (no test changes needed, but it's the
  regression gate for the new grid/card layouts).
- One new e2e assertion: the header nav is present and its anchor links resolve to sections
  that exist on the page (`tests/e2e/homepage.spec.ts` gets one more test, or a new
  `tests/e2e/navigation.spec.ts`).

## Open questions

None — content, mechanics, hosting, and env vars are all already settled; this spec covers
only the visual layer.
