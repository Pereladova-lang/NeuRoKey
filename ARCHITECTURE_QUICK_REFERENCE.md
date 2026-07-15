# Web App Architecture — Quick Reference Cheat Sheet

## 1. НАВИГАЦИЯ

### Sidebar Navigation (Рекомендуется для сложных приложений)
```
✓ Slack, Figma, Notion, Linear используют этот паттерн
✓ Поддерживает неограниченное количество features
✓ Всегда видимый контекст
✓ Масштабируется с ростом

Desktop:  Полный sidebar с labels + иконками
Tablet:   Icon-only sidebar
Mobile:   Hamburger меню или drawer
```

### Top Navigation (Для маркетинг-сайтов)
```
✓ GitHub, Stripe marketing используют этот паттерн
✓ Максимизирует область контента
✓ Простой для small feature sets
✗ Скрывает функции в dropdown'ах
```

### Command Palette (Для power users)
```
✓ Linear, VS Code web используют Cmd+K
✓ Fast для keyboard users
✓ Масштабируется бесконечно
✗ Steep learning curve
```

---

## 2. КОМПОНЕНТЫ

### Обязательные UI элементы (11 основных):

| # | Компонент | Для чего | Пример |
|---|-----------|----------|--------|
| 1 | Cards | Дискретные информационные блоки | Dashboard tiles |
| 2 | Data Tables | Сравнение multiple data points | CRM lists |
| 3 | Modals | Focused interactions | Forms, confirmations |
| 4 | Sidebar Nav | Main navigation | Feature categories |
| 5 | Tabs | Content categories | Settings sections |
| 6 | Progressive Disclosure | Show detail on demand | Accordions |
| 7 | Search & Filter | Find в datasets | Command palette |
| 8 | Notifications | System feedback | Toasts (4-5 sec) |
| 9 | Skeleton Screens | Loading state | Dashboards |
| 10 | Empty States | No data | First-time UX |
| 11 | AI UI Patterns | Generative features | Streaming text |

### Иерархия кнопок:
```
Primary (Blue, #0B63DC)     → Main CTA
Secondary (Outlined)        → Alternative action  
Tertiary (Text-only)        → Less important
Destructive (Red, #EF4444)  → Delete/risky action
```

---

## 3. LAYOUT & GRID

### 12-Column Grid System:
```
Columns:       12
Gutter:        24px (1.5rem) — space between columns
Outer margin:  16px (mobile) to 64px (desktop)
Max width:     1200px
```

### Responsive Breakpoints:
```
Mobile:    0–640px   (4 col grid, hamburger nav)
Tablet:    641–1024px   (8 col grid, icon sidebar)
Desktop:   1025px+   (12 col grid, full sidebar)
```

### Layout Patterns:

**Card Grid** (Dashboard, gallery)
```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 1.5rem;
```

**Split Screen** (Editor + preview)
```css
grid-template-columns: 60% 40%;
gap: 2rem;
```

**F-Pattern** (Reading heavy, multiple sections)
```
Scan top-left → top-right → down → repeat
Place CTAs in natural eye flow
```

**Z-Pattern** (Single goal, landing pages)
```
Top-left → top-right → bottom-left → bottom-right
Diagonal eye movement guides attention
```

---

## 4. SPACING (8px Base Unit)

### Spacing Scale:
```
4px   (0.25rem) — Tight icon/badge spacing
8px   (0.5rem)  — Icon+text, form fields
16px  (1rem)    — Component padding, lists
24px  (1.5rem)  — Section gaps, card margins ← Most common
32px  (2rem)    — Large sections
48px  (3rem)    — Between major sections
64px  (4rem)    — Page-level, hero sections
```

### Component Spacing:
```
Page padding:          2rem (desktop) / 1rem (mobile)
Section gap:           1.5rem (between cards)
Card padding:          1.5rem
Form field gap:        1rem
Header to content:     1.5rem
Heading to paragraph:  1rem
Paragraph to paragraph: 1.5rem
```

### Typography Spacing:
```
Line length:  65 characters max (measure property)
Line height:  1.5–1.6 (body text) / 1.2–1.3 (headings)
Letter space: Only for uppercase labels/captions
```

---

## 5. RESPONSIVE DESIGN

### Mobile-First Approach:
```
1. Design at 320px (smallest phone)
2. Single column, simplified nav
3. Stack components vertically
4. Use relative units (rem, %)
5. Add @media (min-width: ...) for larger screens
6. Test on real devices
```

### Modern Techniques (2026):

**Container Queries** (Component-level responsiveness)
```css
@container (max-width: 400px) {
  .card { display: flex; flex-direction: column; }
}
@container (min-width: 401px) {
  .card { display: grid; grid-template-columns: 1fr 1fr; }
}
```

**Fluid Typography** (No media queries needed)
```css
h1 { font-size: clamp(1.5rem, 5vw, 3rem); }
/* Min: 24px, scales with viewport, max: 48px */
```

**Aspect Ratio** (Prevents layout shift)
```css
img { aspect-ratio: 16 / 9; object-fit: cover; }
```

**Touch Targets**
```
Minimum size:    44×44px (AA) / 48×48px (AAA)
Gap between:     8px (AA) / 12px (AAA)
```

---

## 6. UI PATTERNS

### Buttons:
```
Size:     40–48px height (touch-friendly)
Padding:  12px horizontal, 8–12px vertical
Focus:    Visible focus ring (2px, 2px offset)
Contrast: 4.5:1 text contrast (WCAG AA)
```

### Forms:
```
Label placement:  ABOVE input (not inside)
Input height:     44–48px
Error messages:   Below field, specific ("Email must contain @")
Validation:       Real-time (green checkmark when valid)
Helper text:      Subtle gray, below label
```

### Modals:
```
Width:     Max 600px (readable text line)
Padding:   24px (desktop) / 16px (mobile)
Backdrop:  Semi-transparent dark (not transparent)
Focus:     Trap within modal, Esc to close
Header:    Include close button (X or text)
```

### Notifications (Toasts):
```
Duration:    4–5 seconds (auto-dismiss)
Position:    Top-right OR bottom-left (not center)
Types:       Success (green) | Warning (yellow) | Error (red) | Info (blue)
Stack max:   3 toasts (older auto-dismiss)
Actions:     Include Undo button for destructive
```

### Data Tables:
```
Column width:   Minimum 80px, more for text
Row height:     40px (desktop) / 48px (mobile)
Header:         Sticky when scrolling
Sorting:        Clickable column headers
Selection:      Checkboxes on left, bulk actions above
Pagination:     Show 10, 25, 50 options
```

### Empty States:
```
Content:  Icon + headline + description + CTA
Tone:     Friendly ("Ready to get started?")
Size:     Centered, 400px max-width, breathing space
CTA:      Clear next step ("Create first project")
```

---

## 7. ACCESSIBILITY CHECKLIST

### Visual:
- [ ] 4.5:1 contrast ratio for text (WCAG AA)
- [ ] 3:1 for large text (18px+) and UI elements
- [ ] Focus indicators visible (2px ring)
- [ ] Don't rely on color alone (use icons/text)
- [ ] Sufficient touch target size (44×48px)

### Semantic:
- [ ] Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- [ ] Headings in order (h1 → h2 → h3)
- [ ] Form labels linked to inputs (`for` attribute)
- [ ] Error messages associated with fields
- [ ] Images have alt text

### Interactive:
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Focus visible on all interactive elements
- [ ] Modals have focus trap (Tab stays within)
- [ ] Keyboard shortcuts labeled
- [ ] Autocomplete has accessible suggestions

### Motion:
- [ ] Respect `prefers-reduced-motion`
- [ ] No auto-playing videos/animations
- [ ] Provide pause controls

---

## 8. PERFORMANCE OPTIMIZATION

### Images:
```
✓ Use srcset for responsive images
✓ Lazy load images (loading="lazy")
✓ Compress with WebP fallback
✓ Use aspect-ratio to prevent shift
✓ Optimize for mobile (small file size)
```

### Code:
```
✓ Code split (lazy load routes)
✓ Tree shake unused code
✓ Minify CSS/JS
✓ Use production build
✓ Cache static assets
```

### Data:
```
✓ Skeleton screens during loading
✓ Lazy load tables (pagination/infinite scroll)
✓ Real-time search (autocomplete)
✓ Pagination for large datasets
✓ Debounce search/filter inputs
```

---

## 9. COLOR PALETTE (Recommended for NeuRoKey)

### Semantic Colors:
```
Primary accent:    #0B63DC (Blue) — CTAs, highlights
Secondary accent:  #5FB876 (Green) — Success
Error:             #EF4444 (Red) — Destructive
Warning:           #F59E0B (Amber) — Caution
Info:              #3B82F6 (Light Blue) — Information

Background:        #F8FAFB (Light) / #0F1419 (Dark)
Surface:           #FFFFFF (Light) / #1A1F2E (Dark)
Text primary:      #1A2332 (Light) / #F0F2F7 (Dark)
Text secondary:    #475569 (Light) / #CBD5E1 (Dark)
Border:            #E1E6EB (Light) / #2D3748 (Dark)
```

### Data Visualization:
```
Use scientific palettes: Viridis, Plasma, or Inferno
Not just random colors — ensure colorblind accessible
```

---

## 10. FOR NeuRoKey SPECIFICALLY

### Recommended Setup:

**Navigation:**
```
Sidebar (6-8 sections):
  • Dashboard
  • Research
  • Data
  • Tools
  • Team
  • Settings
  
Top bar: Search + Notifications + User menu
```

**Layout Strategy:**
```
Dashboard:      Card grid (3 col desktop, 1-2 mobile)
Research view:  Split screen (left filters, right table/viz)
Collaboration:  Comment threads, version history
Settings:       Left nav + right form panel
```

**Core Components:**
```
✓ Data visualizations (charts, heatmaps)
✓ Research browser (filterable table)
✓ Project cards (status, collaborators)
✓ Timeline/versioning
✓ Collaboration UI (comments, @mentions)
✓ Forms (parameters, study setup)
✓ Modals (create, invite, export)
```

**Tech Stack:**
```
Frontend:    React/Next.js 15 (App Router)
Styling:     Tailwind CSS
UI Library:  shadcn/ui or Radix
Data viz:    Recharts, D3.js, or Plotly.js
Backend:     Node.js + PostgreSQL
```

**Design System Tokens:**
```
Font body:        System stack (-apple-system, Segoe UI)
Font display:     Georgia or Inter Bold
Spacing base:     8px (0.5rem)
Border radius:    8px (components) / 12px (cards)
Max width:        1200px
Grid columns:     12
```

---

## QUICK DECISION TREE

```
Is your app complex with many features?
  YES → Use Sidebar Navigation + Top Bar
  NO  → Use Top Navigation or Command Palette

Are users mostly on mobile?
  YES → Mobile-first design, bottom nav for 3-4 items
  NO  → Desktop-first okay, but still test mobile

Need to display lots of data?
  YES → Data tables + filters + pagination
  NO  → Cards or list items

Need real-time collaboration?
  YES → Implement comment threads, activity log
  NO  → Simple CRUD operations

Is accessibility required? (Legal/Compliance)
  YES → WCAG AA minimum (4.5:1 contrast, 44×48px targets)
  NO  → Still recommended (better UX for all)

Heavy loading / API delays?
  YES → Use skeleton screens + lazy loading
  NO  → Standard loading spinners okay
```

---

**Last updated:** July 2026  
**Basis:** Analysis of Figma, Notion, Linear, Slack, Stripe, and 100+ successful SaaS apps  
**Standards:** WCAG 2.1, Google Core Web Vitals, Material Design 3, Figma Design Systems
