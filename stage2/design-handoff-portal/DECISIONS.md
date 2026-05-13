# DECISIONS — Portal ↔ Composer shell alignment

Read this if `HANDOFF.md` left any "why" question open.

## Context in one paragraph

StyleBI has two sibling apps inside one shell: **Dashboard Portal** (viewer + designer-of-dashboards) and **Composer** (authoring tool for dashboards, datasets, widgets). The shell is meant to feel like one product. Composer's chrome has moved faster in recent iterations; Portal's top header was last touched a generation ago. This handoff catches Portal's top header up — only the top header. Nothing below the 44px strip changes.

## What "alignment" means in this project

Alignment means **shared shell vocabulary** — same bar height, same control sizing, same pill style, same token names, same surface tiers. It does **not** mean copying Composer's authoring-specific patterns. Composer is a canvas tool with file tabs, an inspector, a floating zoom cluster, and an empty-state pattern built around "drag a widget · connect data · pick template." None of those translate to a viewer.

## What we considered and rejected (do not reintroduce)

| Pattern from Composer | Why we're not bringing it over |
|---|---|
| **3-cards empty state ("drag widget · connect data · template")** | Composer-specific. Portal already has well-tested empty states for each destination (numbered onboarding for system-empty, template gallery for empty Dashboards, source-picker for empty Data, pattern gallery for empty Schedule). Don't replace them. |
| **AI-as-generator surfaces** (any "describe what to build", "suggest a dashboard", "create with AI" copy) | StyleBI's AI is **lookup + Q&A**, not an agent. The Ask AI button's tooltip and aria-label now enforce this framing at the entry point. If the panel internals contain generator-style copy, that is a separate ticket — flag it, don't fix it here. |
| **File-tabs in the center zone** | Portal has no multi-document state. Center stays empty. |
| **Floating bottom-right cluster (zoom + canvas modes)** | Composer-only — Portal has no infinite canvas. The closest analog is per-dashboard `Refresh / Maximize / Filters` which already exists. |
| **Typed-shelf bindings, components outline, format inspector** | Authoring affordances. Not applicable. |
| **Larger rail-density changes** | Rail is Portal's primary nav. Tightening it was on the table; we deferred. Out of scope for this commit. |

## What we considered and accepted (= what's in this commit)

| # | Change | Why |
|---|---|---|
| 1 | Top bar 56 → 44 px | Pure parity. Cross-app eye doesn't expect a chunkier Portal header. Recovers ~12 px of vertical canvas. |
| 2 | App-switcher pill pixel-matched | Most visible cross-app element. Any difference reads as "different product." |
| 3 | Right-cluster compact (28px controls, 12.5px labels, 6px radii) | Composer's chrome runs dense; Portal's runs chunky. The discord is what makes the current top header feel "off." Pick a lane. |
| 4 | `iconBtn` 32 → 28 | Consistent with #3. |
| 5 | Ask AI aria/title framed as "find / answer" | Kickoff is explicit: AI ≠ agent. Enforced at the entry point so it can't drift. |

## Palette authority — read carefully

**Portal's color tokens are authoritative for the whole shell.** That includes:

- The 4-tier neutral scale (`canvas` `#F8F7F4` → `bg/surfaceMuted` `#F1EFEA` → `surface` `#FFFFFF`, with `hover` `#ECE9E2` and borders `#D9D5CC` / `#C8C2B7`).
- Primary copper family: `#E58A2A` / `#C96F12` / `#F6E2C8` / `#FDF5ED`.
- Support families with identity meaning: violet `#7455A8` (Dashboards), plum `#B54B6E` (Pinboard), teal `#1D8A86` (Data), mustard `#B7791F` (Schedule).
- Semantic families: success / warning / danger / info.

If Composer's chrome currently uses different values for any of these, **Composer is the divergent one**, not Portal. Do not "harmonize" by editing Portal's tokens to match Composer. File a separate ticket against Composer to pull it back to these values.

## Why we abandoned earlier attempts (so you don't repeat them)

Two earlier passes (portal-v2 attempts, since deleted) tried a bigger restructure: importing Composer's 3-cards empty state into Portal's Dashboards destination, rewriting the rail, and broadening the AI surface area. Both were abandoned because:

1. They violated the "preserve current empty states" rule (Portal's empty states are well-tested and well-suited to a viewer).
2. They drifted toward AI-as-agent framing.
3. They mixed chrome alignment (the actual goal) with content reorganization (not the goal).

The v3 change you're implementing is **deliberately narrow** for those reasons. Resist the urge to expand it.

## When to come back for more

After this lands, the next reasonable items in this alignment track are:

- Pull `composer-palette-spec.md` into the shared `shell-palette-spec.md` so the two apps can't diverge silently again.
- Audit rail density (40 → 34 globally, or split: 40 at root / 32 in dashboard view).
- Add a thin breadcrumb in the now-empty center zone of the 44px bar — or commit to leaving center empty for a quieter top bar.
- Refine three v2 token values that are slightly off (primary saturation, plum warmth, `borderStrong` separation from `border`).

None of those are in this commit.
