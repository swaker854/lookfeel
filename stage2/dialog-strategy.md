# Composer Dialog Strategy — 4-Bucket Model

## Why this exists

Today's StyleBI Composer has ~50 dialogs in `web/projects/portal/src/app/composer/dialog/`:

- ~25 viewsheet object property dialogs (chart, table, gauge, calendar, every input control, every shape)
- ~20 worksheet dialogs (aggregate, condition, embedded-table, grouping, import-csv, reorder-columns, sort-column, tabular-query, variable-assembly, worksheet-property)
- Plus save dialogs, screen-size, device-layout, query-plan

Treating all of them as "modal dialog" is the path of least resistance and the reason today's Composer feels like 50 little popups. The redesign should route them through **four surface patterns** instead.

---

## Bucket 1 — Object property dialogs → Right-panel inspector

**Applies to:** every `<*-property-dialog>` whose only job is editing the currently-selected object's properties (gauge, calendar, checkbox, combobox, image, line, oval, rect, slider, selection-list, selection-tree, selection-container, spinner, submit, tab, text, textinput, group-container, table-layout, etc.)

**Pattern:** No modal. Selecting the object exposes its properties in the right inspector. The General / Format / Script tabs already mirror today's `<general-pane>` / `<format-pane>` / `<script-pane>` sub-components.

**Why:** High-frequency, low-decision. Live edits beat a Cancel/Apply round-trip. The Angular code is already factored into reusable sub-panes — porting them into the inspector is mostly mechanical.

**Risk:** Today's dialogs gate Apply on validation. Inline editing requires an undo story and a "revert object" affordance. **Behaviour change, not just visual.**

---

## Bucket 2 — Multi-step wizards → Side sheet (60% width)

**Applies to:**
- `import-csv-dialog` (file → mapping → preview → commit)
- `tabular-query-dialog` (source → query builder → output)
- `viewsheet-device-layout-dialog` (pick breakpoint → adjust per device)
- `variable-assembly-dialog`

**Pattern:** Slide-in panel from the right covering ~60% of viewport. Canvas dimly visible underneath. Step indicator at top, Back / Next / Cancel at bottom. Dismiss via `Esc` or explicit Cancel.

**Why:** A 480px modal is the wrong container for a 5-step flow — no canvas context, cramped. A full takeover is overkill for one-off setup. Side sheet keeps the workflow context visible.

---

## Bucket 3 — Quick one-shot actions → Popover or compact modal

**Applies to:**
- `sort-column-dialog`, `column-type-dialog`, `delete-cell-dialog`, `insert-cell-dialog`, `concatenation-type-dialog`, `reorder-columns-dialog`, `show-hide-columns-dialog`
- `save-viewsheet-dialog`, `save-worksheet-dialog`
- `screen-size-dialog`

**Pattern:**
- **Anchored popover** when triggered from a specific element (right-click column header → Sort): 280–360px wide, no overlay scrim, appears next to the trigger, dismiss on click-outside.
- **Compact centre modal** when global (Save): 420px wide, simple form, primary action right-justified.

**Why:** Short and transactional. Doesn't deserve a full-bleed modal.

---

## Bucket 4 — Complex authored content → Routable side sheet

**Applies to:**
- `assembly-condition-dialog` / `grouping-condition-dialog` / `mv-condition-pane` (rule builders)
- `worksheet-property-dialog` (multi-tab sheet-level settings)
- `query-plan-dialog`

**Pattern:** Same chrome as Bucket 2 (side sheet), but routable — has a real URL, browser back navigates, sharable to a teammate. Matches how we routed the chart editor.

**Why:** These are dense mini-apps people spend minutes inside. Routability is the difference between "modal I had to dismiss" and "place I can link a colleague to."

---

## Bucket 5 — Chart properties (special case)

**Applies to:** `chart-property-dialog` only.

**Pattern:** Full-screen binding editor (already mocked in `composer-binding-editor-v3.html`).

**Why:** Chart is the only object whose property editor is genuinely large enough — dimensions / measures / aesthetics / format / script across 4+ tabs — to merit takeover. All other widgets compress comfortably into the right inspector.

---

## Mapping summary

| Bucket | Pattern | Mocked in |
|---|---|---|
| 1. Object properties | Right inspector | `composer-v3.html` (existing) |
| 2. Wizards | Side sheet | `composer-dialogs-v3.html` (Import CSV demo) |
| 3. Quick actions — anchored | Popover | `composer-dialogs-v3.html` (Sort Column demo) |
| 3. Quick actions — global | Compact modal | `composer-dialogs-v3.html` (Save demo) |
| 4. Routable mini-apps | Side sheet with URL | Deferred (same chrome as Bucket 2 + history.pushState) |
| 5. Chart properties | Full-screen editor | `composer-binding-editor-v3.html` (existing) |

---

## Open questions

1. **Undo / revert** for inline-inspector edits — needed before any property dialog can be retired. Snapshot per selection? Object-level revert button in the inspector header?
2. **Calendar / selection-container** have "Advanced" panes packed dense. Disclosure inside the inspector, or escape hatch to a side sheet?
3. **Conditional validation** — many dialogs gate Apply on cross-field validation. How does that surface inline? Per-field inline errors + a section-level error summary?
4. **Confirm-on-destructive** — `delete-cell-dialog` etc. — should these stay as small confirm modals, or become inline "Undo" toasts?
5. **Right-click → Properties** keyboard equivalent — Enter on selection now opens the chart editor; what opens the inspector for non-chart widgets?

---

## Implementation phasing

**Phase A — Inspector parity (Bucket 1 + 5)**
Already designed. Just needs the property panes ported one-by-one.

**Phase B — Side sheet pattern (Bucket 2)**
New chrome component. Mock once, reuse for all wizards. Start with Import CSV (most universally understood).

**Phase C — Popover pattern (Bucket 3)**
Reuse existing context menu chrome. Compact modal is the smallest of the lift.

**Phase D — Routable mini-apps (Bucket 4)**
Side sheet from B + history integration. Deferred until B is shipped.
