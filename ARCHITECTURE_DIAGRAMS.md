# Web App Architecture — Visual Diagrams & Templates

## DIAGRAM 1: COMPLETE WEB APP STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         🏢 COMPLETE WEB APP STRUCTURE                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    🔝 TOP BAR / HEADER                           │   │
│  │  Logo │ Product ▼ │ Docs ▼ │ Search 🔍 │ Notifications 🔔 │ 👤  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  │                                                                        │
│  │  ┌──────────────────┬───────────────────────────────────────────┐    │
│  │  │  📁 SIDEBAR      │                                           │    │
│  │  │  🏠 Home         │         🎯 MAIN CONTENT AREA             │    │
│  │  │  📊 Dashboard    │                                           │    │
│  │  │  🔬 Research     │    ┌─────────────────┬─────────────────┐  │    │
│  │  │  📈 Data         │    │   Card 1        │    Card 2       │  │    │
│  │  │  🛠️  Tools       │    │  (Metric: 24%)  │  (Status: OK)   │  │    │
│  │  │  👥 Team         │    ├─────────────────┼─────────────────┤  │    │
│  │  │  ⚙️  Settings    │    │   Card 3        │    Card 4       │  │    │
│  │  │                 │    │ (Recent Activity)│  (Users: 128)   │  │    │
│  │  │                 │    └─────────────────┴─────────────────┘  │    │
│  │  │                 │                                           │    │
│  │  │                 │    ┌──────────────────────────────────┐   │    │
│  │  │                 │    │ 📊 Data Table                    │   │    │
│  │  │                 │    │ ┌──┬──────────┬────┬────────┐   │   │    │
│  │  │                 │    │ │ID│ Project  │Date│ Status │   │   │    │
│  │  │                 │    │ ├──┼──────────┼────┼────────┤   │   │    │
│  │  │                 │    │ │1 │ Study A  │2026│ ✓ Done │   │   │    │
│  │  │                 │    │ │2 │ Study B  │2026│ ▶ Active   │   │    │
│  │  │                 │    │ │3 │ Study C  │2026│ ⏳ Pending  │   │    │
│  │  │                 │    │ └──┴──────────┴────┴────────┘   │   │    │
│  │  │                 │    └──────────────────────────────────┘   │    │
│  │  │                 │                                           │    │
│  │  └──────────────────┴───────────────────────────────────────────┘    │
│  │                                                                        │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    📍 MODAL / DIALOG                             │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │ ❌ Create New Project                                      │ │   │
│  │  ├────────────────────────────────────────────────────────────┤ │   │
│  │  │ 📝 Project Name                                            │ │   │
│  │  │ ┌─────────────────────────────────────────────────────┐    │ │   │
│  │  │ │ Study A - Phase 1                                  │    │ │   │
│  │  │ └─────────────────────────────────────────────────────┘    │ │   │
│  │  │                                                            │ │   │
│  │  │ 🏷️  Tags (multi-select)                                  │ │   │
│  │  │ ☑️ Neuroscience  ☑️ AI  ☐ Research                      │ │   │
│  │  │                                                            │ │   │
│  │  │ 📋 Description                                            │ │   │
│  │  │ ┌─────────────────────────────────────────────────────┐   │ │   │
│  │  │ │ Multi-line text area for project description...    │   │ │   │
│  │  │ └─────────────────────────────────────────────────────┘   │ │   │
│  │  │                                                            │ │   │
│  │  │                      [Cancel]  [Create]                   │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 2: RESPONSIVE LAYOUT CHANGES

### Desktop (1025px+)
```
┌─────────────────────────────────────────────┐
│ 🔝 TOP BAR (Full width)                     │
├────────────┬──────────────────────────────┤
│   Sidebar  │   Content Grid (3 columns)   │
│ (Full)     │   ┌──┬──┬──┐                 │
│            │   │01│02│03│                 │
│            │   ├──┼──┼──┤                 │
│            │   │04│05│06│                 │
│            │   └──┴──┴──┘                 │
│            │                              │
└────────────┴──────────────────────────────┘
```

### Tablet (641-1024px)
```
┌─────────────────────────────────────┐
│ 🔝 TOP BAR                           │
├─┬─────────────────────────────────┤
│📁│  Content Grid (2 columns)      │
│📊│  ┌──┬──┐                       │
│🔬│  │01│02│                       │
│📈│  ├──┼──┤                       │
│🛠│  │03│04│                       │
│👥│  └──┴──┘                       │
│⚙│  Data Table (scrollable)       │
│  │                                │
└─┴─────────────────────────────────┘
```

### Mobile (0-640px)
```
┌──────────────────┐
│ 🔝 TOP BAR       │
│ ☰ Logo  🔍 👤   │
├──────────────────┤
│                  │
│ Content Stack    │
│ (Single Column)  │
│  ┌────────────┐  │
│  │   Card 1   │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │   Card 2   │  │
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Data Table │  │
│  │ (Scroll X) │  │
│  └────────────┘  │
│                  │
├──────────────────┤
│ 🏠 📊 🔬 📈 ⚙  │ (Bottom nav)
└──────────────────┘
```

---

## DIAGRAM 3: INFORMATION HIERARCHY

```
┌────────────────────────────────────────────────────────────┐
│                   INFORMATION ARCHITECTURE                  │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  LEVEL 1: Main Navigation (Sidebar)                        │
│  ════════════════════════════════════════════════════════  │
│  • Dashboard      ← Most important, always first           │
│  • Research                                                │
│  • Data           ← Core features                          │
│  • Tools                                                   │
│  • Team           ← Collaboration                          │
│  • Settings       ← Least important                        │
│                                                              │
│                                                              │
│  LEVEL 2: Secondary Navigation (Within Section)            │
│  ════════════════════════════════════════════════════════  │
│  Dashboard →  [Tabs] Overview | Analytics | Reports      │
│  Research  →  [Filters] Status | Date | Category          │
│  Data      →  [Tabs] Datasets | Visualizations | Export   │
│                                                              │
│                                                              │
│  LEVEL 3: Tertiary (Filters, Quick Actions)                │
│  ════════════════════════════════════════════════════════  │
│  [Dropdown] Sort ▼  [Search] Filter...  [Advanced] ⚙      │
│                                                              │
│                                                              │
│  ALWAYS AVAILABLE (Top bar)                                │
│  ════════════════════════════════════════════════════════  │
│  🔍 Search  🔔 Notifications  👤 User Menu                 │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 4: SPACING & LAYOUT GRID

```
┌─────────────────────────────────────────────────────────────┐
│                    12-COLUMN GRID SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│ ↕ 64px (Outer Margin)                                       │
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                       │
│ │  │  │  │  │  │  │  │  │  │  │  │  │  ← 12 Columns       │
│ ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤                       │
│ │← 24px Gutter (Gap) between columns →│                     │
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘                       │
│                                                              │
│                                                              │
│  ↕ 48px (Major section spacing)                             │
│  ┌─────────────────────────────────────┐                    │
│  │ H2 Heading                          │                    │
│  │ Typography: font-size: 1.8rem       │                    │
│  │                     ↕ 24px          │                    │
│  │ Paragraph text goes here. Leading   │                    │
│  │ 1.5-1.6 for comfortable reading.    │                    │
│  │ Max line width: 65 characters.      │                    │
│  │                                     │                    │
│  │                     ↕ 16px          │                    │
│  │ • Bullet point 1                    │                    │
│  │ • Bullet point 2   ↕ 8px            │                    │
│  │ • Bullet point 3                    │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│                 ↕ 24px (Card gap)                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │                   │
│  │ │ Card Header │ │  │ │ Card Header │ │ ← 1.5rem padding │
│  │ │  ↕ 16px    │ │  │ │  ↕ 16px    │ │                   │
│  │ │ Card content │ │  │ │ Card content │ │                   │
│  │ │ here        │ │  │ │ here        │ │                   │
│  │ │  ↕ 16px    │ │  │ │  ↕ 16px    │ │                   │
│  │ │ [Button]    │ │  │ │ [Button]    │ │                   │
│  │ └─────────────┘ │  │ └─────────────┘ │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

SPACING SCALE (8px Base):
  4px  = Tight spacing (icons)
  8px  = 0.5rem (form fields)
  16px = 1rem (lists, components)
  24px = 1.5rem ← MOST COMMON
  32px = 2rem (sections)
  48px = 3rem (major sections)
  64px = 4rem (page margins)
```

---

## DIAGRAM 5: COMPONENT EXAMPLES

### Button Hierarchy
```
┌──────────────────────────────────────────────────────────┐
│                      BUTTON TYPES                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PRIMARY (Blue #0B63DC) — Main Call To Action           │
│  ┌────────────────────────┐                             │
│  │  ✓ Create Project      │  ← 44-48px height          │
│  └────────────────────────┘                             │
│                                                          │
│  SECONDARY (Outlined) — Alternative Action             │
│  ┌────────────────────────┐                             │
│  │  ☐ Cancel             │                              │
│  └────────────────────────┘                             │
│                                                          │
│  TERTIARY (Text-only) — Less Important                 │
│  Learn more    ← Hover underline                        │
│                                                          │
│  DESTRUCTIVE (Red #EF4444) — Delete/Risky              │
│  ┌────────────────────────┐                             │
│  │  ✗ Delete Permanently  │                             │
│  └────────────────────────┘                             │
│                                                          │
│  DISABLED                                               │
│  ┌────────────────────────┐                             │
│  │  ⊘ Unavailable         │  ← Gray, no hover          │
│  └────────────────────────┘                             │
│                                                          │
│  Spacing within button: 8px-12px horizontal padding    │
│                        8-12px vertical padding          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Form Components
```
┌──────────────────────────────────────────────────────────┐
│                    FORM ELEMENTS                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📝 Project Name  ← Label ABOVE (not inside)           │
│  ┌──────────────────────────────┐                       │
│  │ Study A - Phase 1            │  ← 44-48px height   │
│  └──────────────────────────────┘                       │
│  ℹ️  Spaces and special chars allowed  ← Helper text   │
│                 ↕ 16px                                   │
│  ✓ Valid input (green checkmark when complete)         │
│                 ↕ 16px (gap to next field)              │
│                                                          │
│  🏷️  Tags (Optional)                                    │
│  ☑️ Neuroscience  ☑️ AI  ☐ Research  ☐ Data           │
│                 ↕ 16px                                   │
│                                                          │
│  📋 Description                                         │
│  ┌──────────────────────────────┐                       │
│  │ Multi-line text area for...  │  ← 120px min height │
│  │                              │                       │
│  │ Character count: 142/500     │  ← Optional helper  │
│  └──────────────────────────────┘                       │
│                 ↕ 16px                                   │
│                                                          │
│  ❌ Error state (red text below)                        │
│  ┌──────────────────────────────┐                       │
│  │ [invalid input]              │                       │
│  └──────────────────────────────┘                       │
│  ⚠️  Email must contain @ symbol  ← Specific error      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Data Table
```
┌──────────────────────────────────────────────────────────┐
│                    DATA TABLE                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Select All] │ ID↑ │ Project │ Date ↓ │ Status │ Action
│  ═════════════╪═════╪═════════╪════════╪════════╪══════
│  ☑ Row hover  │ 1   │ Study A │ 2026   │ ✓ Done │ …    
│  ☑ (bg color) │ 2   │ Study B │ 2026   │ ⏳ Active │ …  
│  ☐            │ 3   │ Study C │ 2026   │ ▶ Pending │ … 
│  ═════════════╪═════╪═════════╪════════╪════════╪══════
│  Row height: 40-48px  |  Min column width: 80px        │
│  Sticky header        |  Sortable columns (click)       │
│  Pagination: ← | 1 2 3 → | Showing 10 of 50            │
│  Show [10▼] | [25▼] | [50▼] rows per page               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Notification (Toast)
```
┌──────────────────────────────────────────────────────────┐
│              NOTIFICATION / TOAST MESSAGES               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Top-right corner (or bottom-left)                      │
│                         ┌─────────────────────────┐     │
│                         │ ✓ Project created!     │ ✕   │
│                         │ Study A is ready to use.│     │
│                         │   [Undo]                │     │
│                         └─────────────────────────┘     │
│                         Duration: 4-5 seconds          │
│                                                          │
│  Types:                                                 │
│  ✓ Success (Green #5FB876)                              │
│  ⚠️  Warning (Yellow #F59E0B)                             │
│  ✗ Error (Red #EF4444)                                  │
│  ℹ️  Info (Blue #0B63DC)                                 │
│                                                          │
│  Stack limit: 3 toasts max (older auto-dismiss)         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 6: SPLIT-SCREEN LAYOUT (Figma-Style)

```
┌─────────────────────────────────────────────────────────────┐
│                     🔝 TOP BAR                              │
│  Logo │ Search │ Share │ Notifications │ User Menu          │
├─────────────────────────────────────────────────────────────┤
│      │                                 │                     │
│ ┌────┴─────────────────┬──────────────┬┴─────────────┐      │
│ │ Sidebar (Layers)     │    Canvas    │ Inspector   │      │
│ ├──────────────────────┼──────────────┼─────────────┤      │
│ │ 📁 Project           │              │ Properties  │      │
│ │ ├─ Page 1 ✓          │    Click on  │             │      │
│ │ │ ├─ Group A         │    canvas to │ Fill: Blue  │      │
│ │ │ │ ├─ Shape 1       │    select    │ Stroke: 2px │      │
│ │ │ │ ├─ Shape 2       │              │ Opacity: 80%│      │
│ │ │ │ └─ Text "Header" │    ┌──────┐ │             │      │
│ │ │ ├─ Group B         │    │ Item │ │ Position    │      │
│ │ │ │ └─ Image         │    └──────┘ │ X: 240px    │      │
│ │ │ └─ Footer          │              │ Y: 150px    │      │
│ │ └─ Page 2            │              │             │      │
│ │ ├─ ...               │              │ Effects    │      │
│ │                      │              │             │      │
│ │ Search 🔍            │              │ Interactions│      │
│ │ Components │ Assets  │              │             │      │
│ │                      │              │             │      │
│ └──────────────────────┴──────────────┴─────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Left Panel (30%):  Layer hierarchy, organization
Center (40%):      Main canvas, editing area
Right Panel (30%): Properties, effects, interactions

Sticky headers: Top bar always visible when scrolling
Resizable panels: Drag dividers to adjust width
```

---

## DIAGRAM 7: MOBILE NAVIGATION PATTERNS

### Pattern A: Hamburger Menu (Drawer)
```
CLOSED                          OPEN
┌──────────────────┐           ┌─────────────────────┐
│ ☰ Logo    🔍 👤 │           │ ☰ Menu         ✕    │
├──────────────────┤           ├─────────────────────┤
│                  │           │ 🏠 Home             │
│  Content Area    │           │ 📊 Dashboard        │
│                  │           │ 🔬 Research         │
│  [Cards]         │           │ 📈 Data             │
│  [Tables]        │           │ 🛠️  Tools           │
│  [Forms]         │           │ 👥 Team             │
│                  │           │ ⚙️  Settings        │
│                  │           │                     │
│                  │           ├─────────────────────┤
│                  │           │ 📧 Contact Support  │
│                  │           │ ❓ Help             │
│                  │           │ 🚪 Logout           │
│                  │           │                     │
└──────────────────┘           └─────────────────────┘
```

### Pattern B: Bottom Navigation Tab Bar
```
┌──────────────────────┐
│  Content Area        │
│                      │
│  [Main Content]      │
│                      │
│                      │
├──────────────────────┤
│ 🏠│📊│🔬│📈│⚙       │ ← 5 items (48-56px height)
└──────────────────────┘

Best for: < 5 main sections
Touch-friendly: 48-56px tab height
Always visible, immediate access
```

### Pattern C: Collapsing Sidebar to Icon-Only
```
TABLET LANDSCAPE (768px)      TABLET PORTRAIT (640px)
┌────┬──────────────────┐    ┌────┬────────────┐
│ 🏠 │  Content Area    │    │ 🏠 │ Content    │
│ 📊 │                  │    │ 📊 │ (Narrower) │
│ 🔬 │  [Cards, etc]    │    │ 🔬 │            │
│ 📈 │                  │    │ 📈 │ [Stacked]  │
│ ⚙  │                  │    │ ⚙  │            │
└────┴──────────────────┘    └────┴────────────┘
  50px icon-only       →      Switch to hamburger
```

---

## DIAGRAM 8: COLOR ACCESSIBILITY

```
┌──────────────────────────────────────────────────────────┐
│           COLOR & CONTRAST ACCESSIBILITY                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  WCAG AA Standard: 4.5:1 Contrast Ratio (Minimum)       │
│                                                          │
│  ✓ GOOD (4.5:1+)          ✗ BAD (<4.5:1)               │
│  ┌──────────────────┐     ┌──────────────────┐         │
│  │ Black on White   │     │ Gray on Light    │         │
│  │ #000000 on #FFF  │     │ Gray text fails  │         │
│  │ Contrast: 21:1   │     │ Accessibility!  │         │
│  └──────────────────┘     └──────────────────┘         │
│                                                          │
│  Using Color ALONE is not accessible:                  │
│  ❌ "Green = Success, Red = Error"                      │
│  ✓ "✓ Green = Success, ✗ Red = Error"                  │
│                                                          │
│  Test with Colorblind Vision Simulator:                │
│  8% of males are colorblind (red/green)                 │
│  Always test with accessible color tools:              │
│  • Contrast Ratio Checker                              │
│  • Color Blindness Simulator                           │
│  • WCAG Color Contrast Checker                         │
│                                                          │
│  Data Visualization Palettes:                           │
│  ✓ Viridis (scientific, colorblind-safe)               │
│  ✓ Plasma (high-contrast)                               │
│  ✗ Rainbow (not colorblind-safe)                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## DIAGRAM 9: RESPONSIVE TYPOGRAPHY SCALE

```
Desktop Design          Mobile Adaptation
═════════════════════   ═══════════════════

H1: 2.5rem (40px)      H1: clamp(1.5rem, 5vw, 2.5rem)
                       Scales smoothly based on viewport

H2: 1.8rem (28px)      H2: clamp(1.3rem, 4vw, 1.8rem)

H3: 1.3rem (20px)      H3: clamp(1.1rem, 3vw, 1.3rem)

Body: 1rem (16px)      Body: clamp(0.95rem, 2vw, 1rem)

Small: 0.9rem (14px)   Small: clamp(0.85rem, 1.5vw, 0.9rem)

Benefit: No media queries needed!
Fluid typography adapts to any screen size.
```

---

## DIAGRAM 10: MODAL ANATOMY

```
┌──────────────────────────────────────────┐
│            ← Backdrop (Dimmed)           │
│  ┌────────────────────────────────────┐ │
│  │ Title Goes Here              ✕    │ │
│  ├────────────────────────────────────┤ │  ← Focus trap
│  │                                    │ │     (Tab stays
│  │  Main content area                 │ │      inside)
│  │  • Can be form                     │ │
│  │  • Can be text                     │ │
│  │  • Can be anything                 │ │
│  │                                    │ │
│  │  ┌──────────────────────────────┐ │ │
│  │  │ Multi-line textarea example  │ │ │
│  │  │                              │ │ │
│  │  │ Placeholder text...          │ │ │
│  │  └──────────────────────────────┘ │ │
│  │                                    │ │
│  ├────────────────────────────────────┤ │  ← Max width 600px
│  │      [Cancel]      [Confirm]      │ │     Padding: 24px
│  └────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘

Keyboard controls:
• Esc = Close modal
• Tab = Cycle through interactive elements
• Enter = Submit (on button focus)
• Space = Toggle checkboxes

Accessibility:
✓ aria-modal="true"
✓ aria-labelledby="modal-title"
✓ Focus management (focus trap)
✓ Semantic <dialog> element
```

---

## QUICK LAYOUT SELECTOR

```
Choose your layout pattern based on content type:

TYPE                PATTERN              EXAMPLE
──────────────────  ────────────────────  ─────────────────────
Marketing site      Top nav + Hero       Landing page
SaaS dashboard      Sidebar + Cards      Notion, Linear
Editor app          Split screen         Figma, VS Code
Data visualization  Split (filters+viz)  Tableau, Metabase
E-commerce          Mega menu + Grid     Shopify
Admin panel          Sidebar + Table      HubSpot, Stripe
Single task         Z-pattern            Checkout flow
Content heavy       F-pattern            Blog, documentation
```

---

**Last updated:** July 2026  
**For:** NeuRoKey Web Application Architecture Planning
