# StyleBI Portal — Top Header Alignment Handoff

This folder is a self-contained handoff pack. Read it in this order:

1. **`HANDOFF.md`** — the prompt, scope, acceptance criteria, what to touch and what not to.
2. **`DECISIONS.md`** — the design audit. Why this change exists, what was considered and rejected, what "Composer alignment" actually means.
3. **`portal.jsx` + `portal.html`** — current production code (v1). Starting point.
4. **`portal-v3.jsx` + `portal-v3.html`** — target. Same file as v1 except for `TopHeader`, `iconBtn`, and a new `TOP_BAR_H` constant. **This diff is the design contract.**
5. **`tweaks-panel.jsx`** — required to run the harness locally. Provides the `useTweaks` hook the portal files import.

## Running the harness

Open either HTML file in a browser. Both expect React 18 + Babel standalone (CDN, already in the `<head>`). No build step.

To A/B: open both files in adjacent tabs and toggle. The Tweaks panel (toolbar toggle in the design env, or always-on locally) flips `hasEMAccess` / `isSaaS` / `isDesigner` / `securityEnabled` so you can verify the four edge cases listed in `HANDOFF.md`.

## What you're implementing

The visible diff between `portal.jsx` and `portal-v3.jsx`. That's it. Five concrete numeric changes plus one copy change on the Ask AI button's `aria-label` and `title`. Everything else in the file — colors, logic, components, state — stays identical.

If you find yourself editing anything outside of `TopHeader`, the `iconBtn` style object, or adding the `TOP_BAR_H` constant, stop and re-read `HANDOFF.md`.
