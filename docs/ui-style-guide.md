# Task Trail — UI / Style Guide

This document defines the UI conventions for **Task Trail**. It is written to be **project-specific** and reflects the current implementation:

- **shadcn-style UI primitives** live in `components/ui/*`
- **Semantic design tokens** (CSS variables) are defined in `app/globals.css`
- **Tailwind CSS** is the primary styling mechanism
- **Dark mode** is implemented by toggling a `.dark` class on the root element and relying on semantic tokens

> Goal: keep the UI consistent, themeable, and easy to iterate on without introducing new dependencies or one-off styling patterns.

---

## 1) High-level principles

### 1.1 shadcn-first rule (mandatory)
**Use the primitives in `components/ui` first** (Button, Card, Input, Textarea, Badge, Separator, Label, …) before building custom elements.

**Why**
- Primitives already encode consistent typography, radius, borders, focus rings, and token usage.
- They are designed to work in both light/dark modes using the same tokens.

**Do**
- Compose UI using `components/ui/*` and extend via `className`.
- Use variant systems already present (e.g., `Button` uses `cva` variants).

**Don’t**
- Rebuild basic controls with raw `<button>` / `<input>` styling unless there is a clear gap.
- Hardcode colors that bypass semantic tokens.

### 1.2 Semantic tokens over raw colors (mandatory)
Prefer token-based Tailwind classes that map to CSS variables:

- Backgrounds: `bg-background`, `bg-card`, `bg-muted`, …
- Text: `text-foreground`, `text-muted-foreground`, …
- Borders/rings: `border-border`, `ring-ring`

Tokens are defined in:
- `app/globals.css` (`:root` and `.dark` sections)
- token mapping is wired via `@theme inline` (e.g., `--color-background: var(--background)`)

**Exception**
- Decorative gradients (used in the app) may use explicit Tailwind color utilities (e.g., sky/cyan/emerald), but keep them **decorative**, not foundational for readability/contrast.

### 1.3 Tailwind conventions (project standard)
- Prefer **utility-first** composition and keep class strings readable:
  - layout → spacing → typography → color → states (hover/focus/disabled)
- Use `cn()` from `lib/utils.ts` when combining classes conditionally.
- Use `cva` (as in `components/ui/button.tsx`) for variantable primitives. For feature components, variants are optional; don’t over-abstract.

---

## 2) Layout anatomy (canonical)

Task Trail’s UI is conceptually composed of four regions:

1. **Sidebar**
2. **TopActions**
3. **Content**
4. **FloatingInput**

Even if some regions are not extracted into standalone components, treat them as stable layout “slots”.

### 2.1 Sidebar (left rail)
**Purpose**
- Primary navigation and brand anchor.
- Supports collapsed/expanded states.

**Implementation reference**
- `components/Sidebar.tsx`

**Current behavior**
- Sticky left rail: `sticky top-0 h-screen`
- Width transitions between collapsed and expanded (e.g., `w-20` ↔ `w-64`)
- Uses token-based styling for background/border/text:
  - `border-border`, `bg-background`, `text-muted-foreground`, `text-foreground`

**Style rules**
- Background should be token-based (`bg-background` or `bg-card`) unless purely decorative.
- Navigation items should be `Button variant="ghost"` to stay consistent with hover/focus behavior.
- Collapsed mode must remain usable (icons + tooltips).

### 2.2 TopActions (top-right controls)
**Purpose**
- Global actions that affect the whole workspace view (not the task list itself).

**Implementation reference**
- `components/TopActions.tsx`
  - View toggle (List / Board)
  - Theme toggle (Light / Dark)

**Placement rules**
- Pin to top-right within the main column, above content scrolling.
- Avoid shifting content width when TopActions changes; it should float above the content region.

**Visual rules**
- Use small, “pill” containers:
  - `rounded-full border border-border bg-background/95 shadow-sm backdrop-blur`
- Use `Button variant="ghost" size="sm"` for icon-only toggles.
- Tooltips should be high-contrast and theme-safe:
  - `bg-foreground text-background`

### 2.3 Content (main scrollable workspace)
**Purpose**
- The primary working area: list view or kanban view.

**Implementation reference**
- `app/page.tsx` main column container:
  - Outer container: `flex-1 min-h-0`
  - Scroll region: `overflow-y-auto`
  - Content width constraint: `mx-auto w-full max-w-6xl px-6`

**Spacing rules**
- Keep a consistent max width: `max-w-6xl`
- Use `gap-6` for major vertical rhythm
- Use `gap-3` / `gap-4` for sub-sections

**Scrolling rules**
- Only the Content region should scroll (not the whole page), while Sidebar and FloatingInput remain anchored.

### 2.4 FloatingInput (bottom composer)
**Purpose**
- Primary input for creating tasks (and command-mode entry).
- Must remain reachable and visually prominent.

**Implementation reference**
- `components/ChatInput.tsx` (rendered sticky in `app/page.tsx`)
- Sticky wrapper example: `className="sticky bottom-4"`

**Visual rules**
- Use `Card` as the base container and layer decoration behind it (gradient glow is currently used).
- Input container should use rounded, “friendly” geometry:
  - e.g., `rounded-3xl`
- Primary CTA (send) can be decorative (gradient) but must still:
  - Respect disabled state
  - Maintain contrast in both themes

**Interaction rules**
- Enter submits, Shift+Enter adds a newline (already implemented).
- Autocomplete menu should be theme-safe:
  - `border-border bg-card text-foreground`

---

## 3) Theming & dark mode (mandatory)

### 3.1 How dark mode works (current architecture)
- Dark mode is controlled by toggling `.dark` on `document.documentElement`.
- Semantic tokens in `app/globals.css` switch values inside `.dark { ... }`.
- Components must rely on token-based classes so they automatically theme.

**Key implication**
If you hardcode colors (e.g., `bg-white`, `text-black`) you will break dark mode.

### 3.2 Token-first theming rules
**Do**
- `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`

**Don’t**
- `bg-white` / `text-black` for structural UI
- Hardcoded hex colors for UI foundations (except decorative gradients)

### 3.3 When `dark:` utilities are allowed
Prefer token-based classes so you usually do **not** need `dark:*`.

Allowed cases:
- A purely decorative effect that needs theme tuning (rare)
- A one-off visual that cannot be expressed through existing tokens

If you find yourself using many `dark:` overrides, it’s a sign you should switch to tokens instead.

---

## 4) Tailwind usage patterns

### 4.1 Class ordering (recommended)
Keep class strings scannable:

1. **Layout**: `flex`, `grid`, `sticky`, `absolute`, `w-*`, `h-*`, `min-h-0`
2. **Spacing**: `p-*`, `px-*`, `gap-*`, `space-y-*`
3. **Typography**: `text-*`, `font-*`, `tracking-*`, `uppercase`
4. **Color/tokens**: `bg-*`, `text-*`, `border-*`, `ring-*`
5. **Effects**: `shadow-*`, `backdrop-blur`, `transition-*`
6. **State**: `hover:*`, `focus-visible:*`, `disabled:*`

### 4.2 Use `cn()` for conditional classes
- `cn()` is defined in `lib/utils.ts` and merges Tailwind classes safely.
- Prefer `cn()` over manual string concatenation for conditions.

### 4.3 Prefer “semantic primitives” for controls
- Buttons: `components/ui/button.tsx` (variants: `default`, `secondary`, `outline`, `ghost`)
- Inputs/Textareas: `components/ui/input.tsx`, `components/ui/textarea.tsx`
- Layout containers: `components/ui/card.tsx`

When you need a new UI pattern, build it by composing these first.

---

## 5) Component organization & naming

### 5.1 Folder roles
- `components/ui/*`
  - **Primitive** UI building blocks (shadcn-style)
  - Should be reusable and mostly stateless
  - Should use tokens for background/text/border/ring
- `components/*`
  - **Feature** components (app-specific UI)
  - Can consume context/state
  - Can compose multiple primitives

### 5.2 Naming conventions
- React components: `PascalCase.tsx`
- Default export is acceptable and currently used (e.g., `Sidebar`, `ChatInput`)
- Keep filenames aligned with the primary exported component.

### 5.3 Props vs context
- Prefer **props for reusable UI**.
- Feature-level components may read from context (e.g., `TaskTrailShell` + TaskTrail context pattern), but avoid letting low-level UI primitives depend on app context.

### 5.4 “Region components” (conceptual naming)
Even if not implemented as separate files, refer to these regions consistently in PRs and discussions:
- `Sidebar`
- `TopActions`
- `Content`
- `FloatingInput`

This avoids ambiguity when reviewing layout changes.

---

## 6) Do / Don’t examples (project-specific)

### 6.1 Token usage
**Do**
- Use token-based backgrounds and text for containers:
  - `bg-background`, `bg-card`, `text-foreground`, `border-border`

**Don’t**
- Use fixed colors for base surfaces:
  - `bg-white`, `text-black`, `border-gray-200`

### 6.2 Focus rings & accessibility
**Do**
- Preserve focus-visible rings from primitives (Buttons/Inputs already include them).
- Ensure interactive elements remain keyboard reachable.

**Don’t**
- Remove focus rings without replacing them.
- Use low-contrast text on token backgrounds (especially in dark mode).

### 6.3 Decorative gradients
**Do**
- Use gradients as accents (e.g., small brand mark, glow behind input, primary CTA highlight).
- Keep actual readable text and surfaces token-based.

**Don’t**
- Use gradients as the only mechanism to create contrast for text-heavy areas.

---

## 7) Deprecated / removed UI components (do not use)

The following components were **removed** from the active UI flow:

- `components/ChecklistSection.tsx`
- `components/TabsView.tsx`
- `components/StatusSettings.tsx`

**Rule**
- Do not reintroduce these components in new features.
- Prefer the current composition used in `app/page.tsx`:
  - List view: `TodoList` + related components
  - Board view: `KanbanBoard`
  - Input: `ChatInput`
  - Global shell/context: `TaskTrailShell`

---

## 8) Checklist for new UI changes (required for PRs)

Use this checklist whenever you add/modify UI.

### Layout & structure
- [ ] Changes fit into the existing layout regions: Sidebar / TopActions / Content / FloatingInput
- [ ] Content scrolling behavior remains correct (only the Content region scrolls)
- [ ] Width constraints remain consistent (`max-w-6xl` in main content)

### Theming & tokens
- [ ] No hardcoded base surface colors (no `bg-white`, `text-black`, etc.)
- [ ] Uses semantic tokens (`bg-background`, `text-foreground`, `border-border`, `ring-ring`)
- [ ] Verified in both light and dark mode

### shadcn-first / primitives
- [ ] Uses `components/ui/*` primitives where applicable
- [ ] Variants match existing primitive patterns (e.g., `Button` variants)

### Tailwind hygiene
- [ ] Class strings are readable and follow ordering conventions
- [ ] Conditional classes use `cn()`

### Interaction & accessibility
- [ ] Keyboard navigation works (Tab order makes sense)
- [ ] Focus-visible ring is preserved on interactive elements
- [ ] Disabled/loading states are visible and theme-safe

### Deprecations
- [ ] Does not introduce new usage of deprecated components:
  - ChecklistSection
  - TabsView
  - StatusSettings

---

## 9) Quick reference (where to look)

- **Tokens / theme**: `app/globals.css`
- **cn() helper**: `lib/utils.ts`
- **Primitives**: `components/ui/*`
- **Layout composition**: `app/page.tsx`
- **Sidebar**: `components/Sidebar.tsx`
- **Top actions**: `components/TopActions.tsx`
- **Task header / tabs**: `components/TaskHeader.tsx`
- **Floating input**: `components/ChatInput.tsx`
