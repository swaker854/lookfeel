# Stage 2 — Inline Binding Editor (Option B)

## Status
Deferred to Stage 2. Stage 1 ships **Option A** (modal takeover routed through v3 chrome) — see `composer-binding-editor-v3.html`.

## What "inline" means
Today the chart / table / crosstab / selection editors are **full-screen takeovers** of the viewsheet canvas. The user enters via "Edit" on a widget, sees a dedicated screen (data tree + binding shelves + live preview), and clicks Done to return.

Option B replaces that takeover with an **inline editor**:
- The widget stays on the canvas, visually selected
- The right inspector widens (≈ 480px) and houses the **binding shelves** (X / Y / Color / Size / Shape / Detail / Tooltip / Geographic)
- The **data tree** docks as a second left-panel tab (or a wider left panel — TBD)
- The chart preview updates **live on the canvas** — no separate preview pane
- "Edit" becomes "Edit bindings" and is a chevron, not a takeover trigger

## Why we want it (eventually)
- Matches how Tableau Web, Looker Studio, and Power BI Service now work — the canvas is always the preview
- Removes the modal context switch — users see how their bindings affect the surrounding layout in real time
- Lets multi-widget selections compare bindings side-by-side (future)

## Why it's not Stage 1
The current Angular binding panes (`vs-chart-editor`, `vs-table-editor`, etc.) are **monolithic components** that own their own layout. Splitting them into:
1. A reusable "shelves" widget that fits the inspector width
2. A reusable "data tree" widget that fits a sidebar tab
3. A "live preview" hook that fires on every shelf change without the current Apply/Cancel buffering

…is a multi-sprint refactor. Stage 1's job is to validate the new shell — not to rewrite the binding engine.

## Open questions for Stage 2 design
1. **Width** — Does 480px hold the shelf UI without horizontal scroll? Or do we need a "popout" arrow that expands the inspector to 640px temporarily?
2. **Data tree placement** — second left-panel tab, dedicated rail icon, or always-visible accordion at top of inspector?
3. **Apply model** — keep today's Apply/Cancel buffer, or commit on every shelf drop? (Live commit is the modern pattern but harder to undo cleanly.)
4. **Crosstab vs. chart vs. table** — do all four binding surfaces converge on one shelf layout, or do they each get their own inspector skin?
5. **Narrow viewports** — when the viewport is < 1280px, does the inline editor fall back to Option A (takeover)? Probably yes.

## Validation plan
Before Stage 2 commits to inline:
- Mock the chart binding inspector at 480px and at 640px popout — verify all shelves fit
- Mock the data tree as both a left-panel tab and an inspector accordion — pick one
- Walk a real chart edit flow with the design team and the team that owns `vs-chart-editor` — confirm the refactor is bounded
