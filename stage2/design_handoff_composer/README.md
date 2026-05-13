# Handoff: StyleBI Composer redesign (v3, Option B)

## Overview

This bundle contains the visual redesign of **StyleBI Composer** — the authoring application where users build Worksheets (data) and Dashboards (Viewsheets). The redesign keeps every existing function and code-level concept from the current Angular Composer at `stylebi/web/projects/portal/src/app/composer/`, but reorganizes the shell around a modern component-canvas pattern (Webflow / Framer era).

## About the design files

The files in this bundle are **design references created in HTML + React 18 + Babel-standalone** — runnable prototypes showing intended look and behavior, **not production code to copy verbatim**.

The task is to **recreate these designs inside the existing StyleBI Angular codebase**, reusing established patterns: Angular components, NgBootstrap modals, the existing `ComposerToolbarComponent`, `ComposerMainComponent`, `SidebarTab` enum, action services, and the existing dialog inventory. Do **not** introduce React or rewrite Composer from scratch.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and interaction patterns are decided. Pixel values, hex codes, font sizes, and panel widths in the JSX files are the spec.

## The primary prototype to study

**`composer.html`** is the canonical, interactive Composer redesign. Open it in a modern browser (no build step required — Babel-standalone compiles JSX in place). Everything else in this bundle is supporting reference.

What you can do in `composer.html`:

- **Click between the chart and the two tables** on the canvas → the right-panel Bindings tab swaps between the chart summary view and the table inline editor (Option B in action).
- **Open the chart editor** three ways: click "Open chart editor" in the right panel, click "Edit chart" on the floating selection toolbar, or double-click the chart on canvas. The editor slides in as an overlay with a dimmed scrim leaving the composer visible behind it.
- **Tweaks panel** (toolbar button) — cycle through 5 stages (No tabs / Empty worksheet / Empty dashboard / Widget placed, no bindings / Populated reference), toggle docked vs. overlay panels, switch chart-toolbar style, toggle rail + status bar, edit empty-state copy.
- **Top bar** — App-switcher dropdown (top-left "Composer ▾"), kebab File/View/Help menu, "New…" popover on the + tab, Save modal, Preview/Run (context-aware: dashboards/styles → Preview, worksheets/scripts → Run), "Ask AI" pill opens the assistant side panel.
- **Left rail** — toggle Assets / Toolbox / Components / Inspector / Assistant panels.
- **Right panel** — Bindings tab routing: `kind: 'chart'` → summary + "Open chart editor" CTA · `kind: 'table'` → inline editable shelf · everything else → default shelf.
- **Dialog patterns** — column-header click on the populated table → Sort popover (Bucket 3a). "Import CSV" on the Assets panel header → side sheet wizard (Bucket 2). Save button in top bar → compact modal (Bucket 3b).

## Decisions already made

These are settled — don't relitigate:

1. **Option B for the binding editor** (`specs/composer-v3-decision-brief.md`). Simple widgets (Table, Crosstab, Selection List, gauges, form widgets) get an inline editable Bindings shelf in the right panel. Chart and other complex types keep a full-screen takeover, accessed via a summary card + "Open chart editor" CTA. The editor slides in as an **overlay** leaving composer chrome visible (variant b), not a full-window replacement.
2. **Dashboard, not Viewsheet** as the user-facing term. "Viewsheet" stays in code and APIs.
3. **Composer is its own browser tab.** Opens fresh chrome (not embedded inside Portal). Designed so it *could* be embedded later if needed.
4. **No left rail destination switcher.** The rail toggles panels (Assets · Toolbox · Components · Inspector · Assistant), not destinations.
5. **AI assistant is a chatbot, not a generator.** Surfaced as a persistent "Ask AI" pill + side panel. No "Generate" CTAs in empty states.
6. **Comments removed.** Not a StyleBI feature.
7. **Floating panels with docked-mode toggle.** Default = overlay. `View ▸ Dock side panels` flips to push-canvas mode.
8. **Primary verb is context-aware.** Dashboard / Table Style tabs → **Preview** (eye icon). Worksheet / Script tabs → **Run** (play icon).
9. **No Publish.** Save is the only commit verb. Preview/Run is read-only.
10. **Active rail state = icon color shift only.** No vertical stripe.
11. **Empty-state pattern follows path count**, not "3 cards always." Composer uses 3 cards because it has 3 distinct starter paths.

## What's in the bundle

### Prototype files

| File | Purpose |
|---|---|
| `composer.html` + `composer-app-v3.jsx` + `composer-icons-v1.jsx` + `tweaks-panel.jsx` | **The canonical interactive prototype.** Everything wired up including Option B binding editor overlay. |
| `composer-binding-editor-v3.html` + `composer-binding-editor-v3.jsx` | Standalone full-screen variant of the binding editor (the legacy modal-takeover layout). Reference only — `composer.html` has its own embedded overlay version. |
| `composer-dialogs-v3.html` + `composer-dialogs-v3.jsx` | Gallery demo of the four dialog patterns (right inspector · modal · side sheet · wizard). Reference for the dialog-strategy spec. |
| `composer-option-b.html` + `composer-option-b.jsx` | Static three-frame comparison (Table inline · Chart summary · Chart full editor) used to settle the Option B decision. |

### Specs (read these first)

| File | Purpose |
|---|---|
| `specs/composer-v3-decision-brief.md` | **Start here.** Decision A locked to Option B. Real-code mapping table. Effort estimate (3-5 weeks for Option B + flush splits). |
| `specs/composer-design-spec.md` | Top-level Composer design rationale. |
| `specs/composer-palette-spec.md` | Color tokens. Source of truth for hex values. |
| `specs/composer-implementation-roadmap.md` | Original roadmap. |
| `specs/portal-composer-alignment-audit.md` | Which redesign elements are shell-level (must sync with Portal) vs. Composer-specific. |
| `specs/dialog-strategy.md` | **Important.** Four-bucket dialog model + which existing StyleBI dialogs map to which bucket. |
| `specs/binding-editor-inline-inspector.md` | Option C (fully inline) deferred to Stage 2. Reserved here for future reference. |
| `specs/shell-design-spec.md`, `specs/shell-palette-spec.md`, `specs/theme-strategy-overview.md` | Shared shell foundation that Composer and Portal both consume. |

## Shell anatomy

### Top bar (44px)

`[Composer ▾] [⋯] | [file tabs] [+] | [Save] [Preview/Run] [Ask AI] [Avatar]`

- **Composer ▾** opens app-switcher (Portal · Composer · EM)
- **⋯** kebab opens File / View / Help menu. View menu contains "Dock side panels" toggle
- **+** opens "New Worksheet" / "New Dashboard" popover
- **Save** maps to `onSaveViewsheet` / `onSaveWorksheet`
- **Preview / Run** — context-aware. Dashboard/Table Style → Preview (eye). Worksheet/Script → Run (play)
- **Ask AI** — persistent pill, opens assistant side panel

### Activity rail (44px, left)

`[Assets] [Toolbox] [Components] · [Inspector] · [Assistant]`

Maps to the real `SidebarTab` enum (Assets = ASSET_TREE, etc.).

### Left panel (256px)

Tabs: Assets · Toolbox · Components. Active tab content fills the panel.

### Right panel — Inspector (304px)

Tabs: **Bindings · Format · Script** (Bindings is default when widget selected).

**Bindings tab routing (Option B):**
- `kind: 'chart'` → `ChartBindingsSummary` — Source · Open chart editor CTA · Chart type chip · read-only shelf summary (X axis / Y axis / Color / Detail / Filters)
- `kind: 'table'` → `TableBindingsProps` — Source · editable Columns shelf · Filters · Sort
- Everything else → default `BindingsProps` shelf

### Floating selection toolbar

Anchored above selected widget. For charts: `[Edit chart (filled)] [Column ▾] [Format] [⋯]`. For tables: peer-verb layout. The "Edit chart" primary CTA opens the binding editor overlay.

### Binding editor overlay (Option B, variant b)

Slides in from the right (~78% width, min 920px). Dimmed scrim behind. Composer chrome remains visible. Click scrim, "Back to Composer" chip, Cancel, or Done to dismiss.

Layout: header (back chip + Cancel + Done) → title bar → 2-column body (left: data picker / right: shelves + preview).

### Status bar (26px, bottom)

`[Console] · [Bound data] · [save state] · spacer · [grid toggle] [snap toggle] · [zoom controls]`

### Canvas modes

Bottom-right floating cluster on canvas: Select · Snap to Grid · Annotation. Maps to `composer-toolbar`'s snap-to-grid / snap-to-objects toggles + the existing `ANNOTATION_ASSET` flow.

## Components inventory (existing Angular → redesigned)

| Existing | Maps to |
|---|---|
| `ComposerToolbarComponent` | Top bar |
| `ComposerMainComponent` (split-pane) | Activity rail + left panel + canvas + right inspector |
| `AssetTreeComponent` | LeftPanel "Assets" tab |
| `ComposerToolboxPaneComponent` | LeftPanel "Toolbox" tab |
| `ComponentsPaneComponent` | LeftPanel "Components" tab (always-visible outline) |
| `VSBindingPane` | Binding editor overlay (chart) + reused services for `TableBindingsProps` inline shelf |
| `vs-formats-pane` | RightPanel "Format" tab |
| Script editor | RightPanel "Script" tab |
| `ComposerEmptyEditor` | NoTabsHints (cold-start canvas content) |
| `<save-viewsheet-dialog>` | Save modal (Bucket 3b) |
| `<import-csv-dialog>` | Side sheet (Bucket 2) |
| Most `<*-property-dialog>` | RightPanel "Bindings" + "Format" tabs (Bucket A) |
| `sort-column-dialog` / table column right-click | Anchored popover (Bucket 3a) |

## Design tokens

```
--primary:        #E58A2A   (StyleBI orange)
--primary-tint:   #FDF5ED
--primary-soft:   #F6E2C8
--primary-text:   #4A2500

--ink:            #1F1F1B
--ink-default:    #35342F
--ink-muted:      #6A685F
--ink-subtle:     #99958C

--chrome:         #FAF8F4
--canvas:         #F8F7F4
--bg:             #F1EFEA
--surface:        #FFFFFF
--surface-muted:  #F1EFEA

--border:         #D9D5CC
--border-strong:  #C8C2B7
--hairline:       #E8E4DB

--c-context-bg:   #FEF8EE
--c-selected-bg:  #DDF1F5
--info:           #3E7FC4
--info-soft:      #E4EFFA

--font-sans:      'Inter', system-ui, sans-serif
--font-mono:      'JetBrains Mono', ui-monospace, monospace
```

Type scale: 10 (caption) · 11 · 12 (body) · 13 (small heading) · 14/16/20 (headings).
Spacing: 2 / 4 / 6 / 8 / 12 / 16 / 24.
Radii: 4 (chrome) · 6 (cards) · 8 (panels) · 999 (pills).

## Suggested implementation order

1. **Shell first** — top bar, activity rail, status bar, panel scaffolding. Route existing components into the new slots.
2. **Right panel consolidation** — collapse the 6 `SidebarTab` tabs into Bindings / Format / Script. Format pane just moves; Bindings tab is new and routes by widget kind.
3. **`TableBindingsProps` inline shelf** — new compact-shelf component reusing `composer-binding-tree` services. The smallest Option B deliverable.
4. **Binding editor overlay** — wrap existing `VSBindingPane` in a slide-in container with back-chip. The chart path stays functionally identical, only its chrome changes.
5. **Floating selection toolbar** — replaces today's right-click-only verbs with a visible primary action.
6. **Dialog migration** — Bucket A property dialogs into right panel; Side sheet + Wizard patterns as shared Angular components.
7. **Ask AI panel** — defer until chatbot backend is ready.

## Out of scope

- Real-time collaboration / multiplayer cursors (Stage 2+)
- Option C "fully inline binding editor" (deferred — see `specs/binding-editor-inline-inspector.md`)
- AI generation features (assistant is chat-only)
- Portal redesign (sibling project, separate handoff in `lookfeel/`)

## Open questions

1. **Side-panel docking persistence** — per-user (server) or per-device (localStorage)?
2. **Canvas zoom** — not currently in StyleBI. Status-bar slot reserved; implementation could defer.
3. **Dialog migration phasing** — which property dialogs to convert first? Suggestion in `specs/dialog-strategy.md`.
4. **`emptyWidget` stage** — what's the right CTA when a chart is placed but unbound? Currently "Auto-suggest" + "Open bindings" — needs product sign-off.

## How to view locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/composer.html
```

Or open the `.html` files directly — they're self-contained.
