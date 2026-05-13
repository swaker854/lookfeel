# Portal ↔ Composer Alignment Audit

**Date:** 2026-05-11
**Trigger:** Composer v3 design introduces shell-level patterns (top bar, app
switcher, AI prompt, color/identity tokens) that the Portal also expresses
differently. This audit lists every cross-app surface where the two apps could
diverge, and recommends a sync action per surface.

> Scope: shell only. Authoring-only patterns (typed binding shelves, frame
> model, floating selection toolbar, vertical-split left panel) are NOT in
> scope — they don't apply to a viewer/manager app.

---

## TL;DR

| Surface | Verdict |
|---|---|
| App-switcher pill | **Must match exactly.** Single biggest cross-app element. |
| Top-bar height & layout | **Should converge** on Composer v3's 44px three-zone strip. Portal currently uses more chrome. |
| Brand tokens (`accent` / `info` / `ink` ramp / chrome surfaces) | **Already aligned**, hold the line — no drift in either direction without explicit decision. |
| Identity colors (per-destination support families) | **Portal-owned.** Composer doesn't have destinations, so no conflict. |
| Saved / dirty chip | **Add to Portal** where editing surfaces exist (pinboard, schedule editors). |
| AI assistant surface (empty-state prompt) | **Should be uniform** if the company wants AI to feel like one product. |
| Share button + avatar cluster | **Align placement and styling.** Publish is Composer-only. |
| Hover / focus / hairline / surface tier rules | **Already aligned**, monitor. |
| Icon component vocabulary | **Already aligned** (same `<Icon>` component contract). |
| Font stack (Inter) | **Already aligned.** |
| Empty-state card pattern | **Portal should adopt** — Portal has more empty destinations than Composer. |
| Left-rail vs. no-rail | **Diverge.** Portal needs the destination rail; Composer is single-purpose. Confirmed correct divergence. |
| Floating selection toolbar | **Composer-only.** Portal has no per-object selection. |
| File-tabs in top bar | **Composer-only.** Portal navigates by destination. |

---

## Surface-by-surface

### 1. App-switcher pill — **MUST MATCH**

**Composer v3 today:** Top-left pill — logo (18px), "Composer" label (600 weight, 12px), chevron-down. Inside a 28px-tall pill, 8px horizontal padding. Opens dropdown for Portal / Composer / EM.

**Portal today:** From `portal.jsx` glossary: uses `AppSwitcherMenu` / `onSwitchApp`. Visible at the top, similar but in a different layout container.

**Risk:** This is the single element a user sees in BOTH apps within seconds of switching. If the pixel size, label weight, or dropdown contents differ, it feels like two products.

**Action:** Lift the Composer v3 implementation as the canonical one. Update Portal to match. Same height, same label weight, same dropdown order, same hover background.

---

### 2. Top-bar height & three-zone layout — **SHOULD CONVERGE**

**Composer v3:** Single 44px strip, three zones (left/center/right):
- Left: app switcher + menu
- Center: open document tabs
- Right: Saved chip · undo/redo · Preview · Share · Publish · avatar

**Portal:** Has its own header (height TBD from a deeper read — appears taller, with a side rail starting beneath it). Doesn't have document tabs because Portal navigates by destination.

**Action:** Portal adopts the 44px height and three-zone layout. Center zone becomes a **breadcrumb** (Workspace › Sales › Q4 Review) instead of file tabs. Right cluster aligns: Search · Help · avatar (no Share/Publish at the shell level — those move per-dashboard).

This compresses Portal's chrome and gives back vertical space. Cosmetic win, real estate win.

---

### 3. Brand tokens — **HOLD THE LINE**

Both apps reference the same palette. Composer's `var(--primary)` (`#E58A2A`) === Portal's `C.accent`. Same with `info`, `info-soft`, `ink` ramp, hairline, border, chrome surface.

**Action:** Pin these as **shared tokens** in `specs/shell-palette-spec.md`. Any change to a *shared* token requires sign-off in BOTH projects. CLAUDE.md already says "don't back-port without explicit decision" — formalize this as: shared-token changes need explicit dual-project decision; app-specific token changes don't.

**Specifically pin:**
- `--primary` (StyleBI orange) — never diverge
- `--ink` ramp (4 stops) — never diverge
- `--surface` / `--chrome` / `--canvas` — never diverge
- `--border` / `--hairline` — never diverge
- Identity color names (`secondary` / `third` / `fourth` / `info` / `success` / `warning` / `danger`) — never diverge in *name*; values are Portal's call

---

### 4. Identity colors (per-destination) — **PORTAL-OWNED**

Portal maps a color to each destination (Workspace=orange, Dashboards=violet, Data=teal, Schedule=mustard, Pinboard=rose). Composer doesn't have destinations.

**No conflict.** Composer just uses `--primary` (orange) for its single identity. Document this divergence as **intentional**.

---

### 5. Saved / dirty chip — **ADD TO PORTAL**

Composer v3 has a small chip in the top-right: green dot + "Saved" (or "Unsaved"). Sits next to undo/redo.

Portal has editing surfaces too: pinboard editor, schedule editor, viewsheet property dialogs. They each have their own (probably inconsistent) save UI today.

**Action:** Lift the Composer chip into shared component. Both apps use it wherever a save state is meaningful.

---

### 6. AI assistant surface — **NEEDS A POLICY**

Composer v3's empty-state shows an AI prompt ("Describe what to build"). Composer code has `aiAssistantPermission` plumbed through binding-pane and wizard.

Portal doesn't surface AI in the shell today.

**Decision needed:** Is AI a Composer-only feature, or a product-wide capability?
- If **product-wide:** Portal needs an AI surface too (suggestions on empty Dashboards, "find me a dashboard about X" in search, AI-suggested schedules). Sync prompt styling.
- If **Composer-only:** Drop the AI surface from cross-app discussion entirely. But this would feel uneven to users who use both apps.

**Recommendation:** Treat as product-wide. Add at minimum an AI-search affordance to the Portal search.

---

### 7. Share button + avatar — **ALIGN**

Composer v3: Share (ghost button) + Publish (primary button) + avatar (28px circle).
Portal: Has Share equivalent, no Publish concept at the shell level.

**Action:**
- Avatar: same component, same size, same dropdown contents.
- Share: same component. Composer adds Publish on top.

---

### 8. Hover / focus / hairline / surface tier — **MONITOR**

Both apps reference the same rules from `shell-palette-spec.md`. No drift observed. Keep as a periodic check item, not an active fix.

---

### 9. Icon vocabulary — **ALIGNED**

Both apps use an `<Icon name="..." size={N} color={...}/>` contract. Names overlap (`doc`, `data`, `folder`, `search`, `plus`, `chevron-d`, `close`, `more`, `lock`).

**Action:** Pin the Icon contract in `specs/`. New icons added in one project should be added to the other's vocabulary file so naming stays consistent. (Composer added `crosstab`, `selection-list`, `range-slider`, `gauge`, `freehand-table` — Portal may not need them, but the *names* are now reserved.)

---

### 10. Empty-state card pattern — **PORTAL ADOPTS**

Composer v3 introduces 3-card empty state for a new viewsheet:
- Drag a widget · Connect data · From a template
- Plus an AI prompt below

Portal has multiple empty destinations today (no dashboards yet, no schedules, no pinboards, no data sources) — each treated ad hoc.

**Action:** Lift the 3-card pattern + AI prompt as a reusable empty-state component. Apply across Portal's empty destinations.

---

### 11. Left rail — **CORRECT DIVERGENCE**

Portal has a left rail (Workspace / Dashboards / Data / Schedule / Pinboard).
Composer has no left rail — it's single-purpose, no destinations to switch.

**Confirmed intentional.** Document in shared spec so future contributors don't try to "fix" it.

---

### 12. File tabs in top bar — **COMPOSER-ONLY**

Composer needs document tabs because it can have multiple viewsheets/worksheets/scripts open. Portal doesn't have multi-document state in the same way.

**Confirmed intentional.** Composer's center zone uses file tabs; Portal's uses a breadcrumb.

---

### 13. Floating selection toolbar — **COMPOSER-ONLY**

No equivalent need in Portal.

---

### 14. Per-app token overrides

The CLAUDE.md flags `composer-palette-spec.md` as having Composer-specific overrides. Re-verify these are *additions*, not *redefinitions* of shared tokens:

- Composer-specific tokens (e.g. canvas dot-grid color, frame shadow): OK to be Composer-only.
- Shared tokens (`--primary`, `--ink`, surfaces): MUST not be redefined locally — must reference the shared spec.

**Action:** Add a lint pass / review checklist when changing palette specs to flag accidental redefinitions of shared tokens.

---

## Sync policy proposal

Right now CLAUDE.md says "don't back-port Composer decisions to Portal without explicit decision." That blocks shipping. Replace with a tiered policy:

| Change scope | Sync rule |
|---|---|
| **Shared token** (primary, ink, surface) | Requires explicit dual-project sign-off. Update both apps in the same change. |
| **Shared component contract** (Icon, app-switcher, avatar, saved-chip, share button) | Update shared spec first, then both apps. |
| **Shell pattern** (top bar layout, empty state) | Document in shared spec. Each app adopts on its own schedule. |
| **App-specific surface** (Composer canvas, Portal rail) | No sync needed. Each app owns its own decisions. |

---

## Recommended next steps

1. **Make the AI policy decision** (product-wide vs. Composer-only). Without this, the AI prompt question stays open.
2. **Pin shared tokens** in `specs/shell-palette-spec.md` with a "do not diverge" annotation.
3. **Lift 4 shared components** into a shared spec: app-switcher pill, avatar, saved-chip, share button.
4. **Plan Portal top-bar v2** — adopt Composer v3's 44px three-zone strip with breadcrumb instead of file tabs. Estimated effort: 3–5 days for a competent Angular dev.
5. **Lift empty-state card pattern** as a reusable shared component for Portal's many empty destinations.

If decisions 1 + 2 are made, items 3–5 can be parallel small projects rather than a big Portal redesign.
