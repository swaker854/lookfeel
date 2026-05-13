# HANDOFF — Align StyleBI Portal top header to Composer shell chrome

## What you're doing

Mirror the changes in `portal-v3.jsx` into the real Portal codebase. `portal-v3.jsx` is identical to `portal.jsx` (current production) **except** for the `TopHeader` component, the `iconBtn` style object, and one new constant `TOP_BAR_H`. Treat that diff as the design contract.

## The five in-scope changes

All five must land.

1. **Top bar height 56 → 44 px.** Padding `0 12px` (was `12px 20px`).
2. **App-switcher pill** — 28px height, 12px/600 label, single hairline `1px solid C.border`, hover background = `C.hover`. Gating on `tweaks.hasEMAccess` is unchanged.
3. **Right-cluster compact** — search input 28px tall; Ask AI button, Create button, and Security-off badge all 28px tall with 12.5px labels and 6px border radii. Gap between right-cluster items: 6px.
4. **`iconBtn` style: 32 → 28 px.**
5. **Ask AI button copy at the entry point** — `aria-label` and `title` both read:
   `"Ask AI — find dashboards, answer product questions"`
   Button label text stays `"Ask AI"`. Do **not** modify the AI panel/modal contents in this pass.

## Out of scope — do not touch

- **Color tokens (`C.*` in `portal.jsx`, and `$shell-*` SCSS variables in the real codebase).** The Portal palette is authoritative. If Composer's chrome diverges from these values, that is a Composer fix, not this one.
- Rail, sidebar tree, empty states, AI panel internals, `CreateMenu` contents, `AppSwitcherMenu` contents.
- Routing, state, data fetching, any non-presentational logic.
- The four-tier surface scale, the support family identity mappings (violet=Dashboards, plum=Pinboard, teal=Data, mustard=Schedule), or the SCSS variable structure.

## Edge-case matrix to verify

Use the Tweaks panel (or hand-edit the defaults) to verify the header lays out correctly in all four:

| `hasEMAccess` | `isSaaS` | `isDesigner` | `securityEnabled` | What's visible in the left + right clusters |
|---|---|---|---|---|
| true | false | true | true | App-switcher pill + Ask AI + Create |
| false | false | true | true | No app-switcher + Ask AI + Create |
| true | true | true | true | Org pill + app-switcher + Ask AI + Create |
| true | false | false | false | App-switcher + Security-off badge + Ask AI; no Create |

In all four, the header is 44px tall, controls are 28px tall, and the layout does not wrap below 1024px viewport width.

## Acceptance

- Visual diff of the header at 1440 and 1024 widths matches `portal-v3.html` pixel-for-pixel.
- No regression on the four-row matrix above.
- `aria-label` on the Ask AI button reads exactly as specified.
- Keyboard focus order through the header is unchanged from v1.
- One commit, scoped to the header component file(s). **Zero token edits.** If you touched a color value, revert it.
- Draft PR title: `Portal: align top header to Composer shell (44px)`.
  Include before/after screenshots at 1440 and 1024.

## If you're confused

Read `DECISIONS.md`. It explains why this change exists, what alignment means in this project, and what was considered and rejected (so you don't reinvent any of it).

## File reference

```
HANDOFF.md          ← you are here
DECISIONS.md        ← design rationale + skip list
README.md           ← how to run the harness
portal.jsx          ← v1, the codebase
portal.html         ← v1 harness page
portal-v3.jsx       ← target, the design contract
portal-v3.html      ← target harness page
tweaks-panel.jsx    ← hook + components the portal files import
```
