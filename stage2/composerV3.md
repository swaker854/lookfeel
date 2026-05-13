# Composer v3 — Design Brief & Implementation Decision

**Status:** Design exploration complete; team needs to make two architectural decisions before implementation can be sized.
**Prototype:** `composer.html` (v3) · prior variants: `composer-v1.html`, `composer-v2.html`
**Audience:** Composer team (design + engineering)

---

## 1. What v3 is

A reimagining of the Composer authoring shell using the **Webflow / Framer-era component-canvas pattern**, restyled in StyleBI's existing palette and grounded in the real `SidebarTab` vocabulary.

It is the third of three explorations:

| Variant | Theme | What it tests |
|---|---|---|
| v1 | Modern restyle of today's Composer | Familiar layout, fresh chrome |
| v2 | Figma-inspired shell | Single 44px chrome strip, floating panels |
| **v3** | **Webflow / Framer authoring pattern** | **Always-visible Components outline, typed-shelf Bindings, floating selection toolbar, AI-prompt empty state** |

v3 is intentionally not "Figma-style" — Figma is one of many modern authoring tools. The peer set is Webflow, Framer, Penpot, Builder.io, Plasmic, Spline, Rive. Common patterns lifted into v3:

- **Left panel splits vertically.** Top half = catalogues (Assets / Toolbox). Bottom half = Components outline, always visible.
- **Right panel inspector with Bindings as the default tab** when an object is selected (Power BI / Tableau muscle memory in a Figma shell).
- **Typed shelves** for Dimensions / Measures / Filters, drawn as pills with role/aggregation inline.
- **Floating selection toolbar** above the selected widget — Change type · Bindings · Format.
- **Empty viewsheet state** = three starter cards (Drag a widget · Connect data · Template) + AI prompt input.
- **Insertion is drag-from-Toolbox**, matching real StyleBI. No hero floating insert bar.

Every panel maps to an existing StyleBI surface — no Figma vocabulary leaks into the product. See "Real mapping" below.

---

## 2. Real-code mapping (what v3 reuses vs. introduces)

| v3 surface | Maps to in `web/projects/portal/src/app/composer/` |
|---|---|
| Left top — Assets tab | `gui/asset-tree-pane/` (unchanged internals) |
| Left top — Toolbox tab | `gui/toolbox/composer-toolbox-pane.component` (unchanged internals) |
| Left bottom — Components | `gui/components-pane/` (unchanged internals; just moved out of tab) |
| Right — Format tab | `vsobjects/format/vs-formats-pane.component` (moved from sidebar to right panel) |
| Right — Bindings tab | **`gui/composer-main.component.html` line 272: `<vs-binding-pane>`** — currently a full-screen takeover. See decision below. |
| Right — Script tab | per-assembly script (today: opened via separate script editor) |
| Top bar | `gui/toolbar/composer-toolbar.component` + sheet-tab strip (merge) |
| Selection toolbar | **New component**, anchors to `focusedSheet` selection bounding box |
| Empty state | **New** — replaces blank viewsheet grid |
| AI prompt | Plumbs into existing `aiAssistantPermission` already passed to binding pane / wizard |

---

## 3. The two decisions the team needs to make

### Decision A — How does Bindings live in the right panel?

This is **the single architectural choice** that determines whether v3 is a ~3 week or ~6+ week project.

**Background:** Today, `vs-binding-pane` is not a docked panel — it's a full-screen takeover triggered by `focusedViewsheet.bindingEditMode`. Editing a chart's bindings replaces the entire viewsheet body with the binding editor. v3 assumes Bindings is a tab in the right inspector. Bridging that gap can be done three ways:

#### Option A — "Bindings summary, edit-in-place stays full-screen"
- Right-panel **Bindings tab is read-only**: shows current Dimensions / Measures / Filters as typed chips with an "Edit" button.
- The existing full-screen `vs-binding-pane` stays as-is and opens when you click Edit.
- **Cost: cheapest** (~1 week of right-panel work)
- **Trade-off:** loses the "always-edit-from-the-inspector" feel that defines v3. Closer to v1's modal flow.

#### Option B — "Compact inspector for simple widgets, full-screen for complex"  ⭐ Recommended
- Right-panel Bindings **is fully editable** for Tables, Crosstabs, Selection Lists, and other widgets with simple binding shapes (a handful of columns).
- For **Charts** (where the binding tree is genuinely deep — markers, color, detail, legend, axis bindings) the right panel shows a summary + "Open full editor" button → existing `vs-binding-pane`.
- Builds a *new* `<compact-binding-shelf>` component that reuses `composer-binding-tree`'s services but renders a slim layout.
- **Cost: medium** (~2 weeks for the compact shelf, +1 wk for the wiring)
- **Trade-off:** two patterns to maintain. But matches real product complexity: ~80% of widget edits don't need the full editor.

#### Option C — "Fully dock the binding editor"
- The full-screen `vs-binding-pane` is rewritten to live inside the 280px right panel for every widget type.
- Eliminates the takeover mode entirely.
- **Cost: highest** (~4–6 weeks; internal layout of binding pane assumes full-body width and will not fit without restructuring)
- **Trade-off:** the cleanest mental model, but the existing chart-binding tree was designed for breathing room. Squeezing it into 280px likely degrades chart authoring.

### Decision B — Floating panels or flush splits?

v3 currently draws the left and right panels as **floating cards inset 8px from the window edge with shadows** — the Figma aesthetic. The current Composer uses `<split-pane>` with draggable gutters.

#### Option B1 — Keep flush splits (recommended)
- Restyle the existing `split-pane` gutters to be thinner / cleaner.
- Preserves the user's ability to drag panel widths.
- Webflow, Framer, Plasmic — all the v3 reference apps — actually use flush splits, not floating panels. "Floating" is a Figma-specific choice.
- **Cost: low**

#### Option B2 — Floating panels
- Remove `split-pane`; render panels as absolute-positioned overlays on the canvas.
- Loses drag-to-resize unless re-implemented separately.
- Visually more dramatic, but adds work and removes a feature.
- **Cost: medium**

---

## 4. Estimated effort summary

Assuming one experienced Angular dev working with Claude Code in the real `stylebi/` repo:

| Combo | Total estimate |
|---|---|
| **Option A + B1** (cheapest) | **2–3 weeks** |
| **Option B + B1** ⭐ (recommended) | **3–5 weeks** |
| **Option B + B2** | 4–6 weeks |
| **Option C + B1** | 6–8 weeks |
| **Option C + B2** | 7–9 weeks |

Phase breakdown for the recommended combo (Option B + B1):

| Phase | Days |
|---|---|
| Shell rewrite — top bar + file tabs merge | 3–4 |
| Left panel — split container, plug in existing 3 panes | 2–3 |
| Right panel — Bindings / Format / Script tab container | 2–3 |
| Compact binding shelf (Tables / Crosstabs / Selection / Form widgets) | 5–8 |
| Floating selection toolbar | 2–3 |
| Empty state cards + AI prompt (stub or real) | 1–2 |
| Style pass + design polish | 3–5 |
| **Total** | **~18–28 working days** |

---

## 5. What stays out of scope (deliberate cuts)

- **Frame model / dot-grid canvas world.** v3 draws the viewsheet as a card on a textured background. Implementing this means `viewsheet-pane` learns about an outer "world" coordinate space. High cost, low payoff vs. the rest. Recommend dropping.
- **Hero floating insert bar.** v2's center-bottom toolbar. v3 already demoted this to a small bottom-right chip with canvas modes.
- **Annotation pin on canvas.** Real product feature, but v3 doesn't add anything to how it's drawn — just shows it.

---

## 6. Handoff workflow once decisions are made

1. **Team decides Option A / B / C and B1 / B2.**
2. **Designer (this project) produces `specs/composer-v3-handoff.md`** — file-level change list, new-component prop/event shapes, token table, references to the HTML prototype for each surface.
3. **Claude Code executes against `stylebi/`** using the handoff doc + prototype as the visual source of truth.
4. **Designer loops in** during implementation for visual nitpicks (cheaper to iterate in the prototype first).

---

## 7. Open questions before implementation

- Does the team want Composer's chrome to also flow back into the Portal redesign, or are the two apps allowed to diverge here? (Current spec says divergence is allowed; confirm.)
- Is the AI prompt in the empty state a stubbed UI (just renders, doesn't do anything yet) or do we want it wired to the existing AI assistant on day one?
- Script tab in the right panel — is per-assembly script editing actually a frequent enough action to earn a dedicated tab, or should it stay in the existing dialog?
- Comments / annotations — surface them as a real layer in v3 implementation, or defer?

---

*Last updated: v3 prototype live at `composer.html`. Variants v1 (`composer-v1.html`) and v2 (`composer-v2.html`) preserved for comparison.*
