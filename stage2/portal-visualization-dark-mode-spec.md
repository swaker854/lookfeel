# Portal + Visualization Dark Mode Spec

## Purpose

This document defines the next project after shared shell implementation: adding dark mode to the user portal shell and visualization surfaces.

It is intended to answer:

- what the dark-mode project covers
- what must already be true before it starts
- what principles govern the work
- how portal shell and visualization should divide responsibilities
- how unsupported third-party surfaces should be handled in the first pass

This spec is intentionally narrower than a full product-wide dark-mode effort.

It covers:

- portal shell
- portal viewer and visualization-owned surfaces
- shared first-party widget styling used by visualization

It does not cover:

- Composer authoring surfaces
- EM
- full redesign of unsupported third-party tools

## Relationship To Existing Work

This should be treated as the project that follows shell implementation.

The shared shell modernization project should land first because it creates the token discipline and shared selector cleanup that dark mode depends on.

Dark mode should not be started as a parallel redesign track while shell foundations are still unstable.

Use the roadmap companion document for sequencing, audit findings, and execution tracking:

- [portal-visualization-dark-mode-roadmap.md](E:\home\dev\github\lookfeel\specs\portal-visualization-dark-mode-roadmap.md)

## Related Specs

- [shell-design-spec.md](E:\home\dev\github\lookfeel\specs\shell-design-spec.md)
- [shell-implementation-roadmap.md](E:\home\dev\github\lookfeel\specs\shell-implementation-roadmap.md)
- [visualization-design-spec.md](E:\home\dev\github\lookfeel\specs\visualization-design-spec.md)
- [visualization-implementation-roadmap.md](E:\home\dev\github\lookfeel\specs\visualization-implementation-roadmap.md)
- [theme-strategy-overview.md](E:\home\dev\github\lookfeel\specs\theme-strategy-overview.md)

## Project Goal

Deliver a coherent dark mode for the user portal shell and visualization experience without blocking on Composer or EM.

The result should feel intentional and production-ready in the shared portal and viewer experience, while allowing a small number of clearly documented exceptions for unsupported third-party tools.

## Scope

### In scope

- runtime dark theme token layer for portal shell
- dark theme overrides for shared shell selectors
- visualization surface tokens and first-pass adoption
- viewer chrome
- tables, charts, filters, and first-party visualization widgets
- dark-mode QA pass across portal shell and visualization flows

### Out of scope

- Composer authoring-state dark mode
- EM dark mode
- replacing third-party libraries only because they lack dark mode
- pixel-perfect dark treatment for every legacy edge surface in the first pass

## Delivery Model

Use three change types throughout this project:

- `token`
  - define or override runtime `--inet-*` variables for dark mode
- `adoption`
  - update shared and visualization selectors to consume those tokens consistently
- `exception`
  - explicitly document supported light-island surfaces where dark theming is not realistic in phase 1

## Prerequisites

Before starting this project:

1. shared shell implementation should be stable enough that its token names and shared selector patterns are not still moving substantially
2. major shell modernization work in portal should already be adopted in shared SCSS
3. the project should accept a phase-1 exception model for unsupported third-party tools

## Core Principles

### 1. Dark mode is a token project first

Dark mode should primarily be implemented by overriding existing runtime variables, not by writing a second full set of component-specific rules.

### 2. Shell and visualization should share foundations but not collapse into one layer

Visualization should inherit shell text, border, focus, and base surface rules where appropriate, but it should still own widget-specific surfaces and dense interaction states.

### 3. First-party surfaces should become truly dark

Portal shell and visualization-owned surfaces should not be left as hybrid light-first layouts if the product claims dark mode support for this scope.

### 4. Unsupported third-party tools should not block the project

If a third-party surface has no safe dark theming path, treat it as a light island inside a dark shell rather than forcing brittle recoloring.

### 5. Coverage matters more than novelty

The first pass should prioritize broad consistency across the main user flows over deep polish in rare edge cases.

## Theme Activation Strategy

Dark mode should be activated through a root-level selector such as:

- `body[data-theme="dark"]`
- `.theme-dark`

The exact selector can be chosen during implementation, but the project should use one stable root hook that remaps the same runtime variables already consumed by the light theme.

Avoid introducing a parallel theme architecture unless there is a hard platform constraint.

## Primary Code Targets

| File / area | Main responsibility |
|---|---|
| [web/projects/portal/src/scss/_variables.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_variables.scss:1) | define the dark token override layer |
| [web/projects/portal/src/scss/_themeable.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_themeable.scss:1) | remove remaining light-first shared helpers and align shared shell surfaces to tokens |
| [web/projects/portal/src/scss/_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:1) | ensure Bootstrap-shaped controls remain correct in dark mode |
| [web/projects/portal/src/global.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\global.scss:1) | root theme activation only |
| `web/projects/portal/src/app/vsobjects/**` | visualization widget and viewer adoption |
| `web/projects/portal/src/app/widget/**` | shared first-party widget adoption used in portal/visualization |

## Implementation Contract

### Shell contract

The shell dark-mode layer should primarily override the existing token families already used by portal, including:

- text hierarchy
- shell surfaces
- borders
- form and input surfaces
- dialogs
- dropdowns
- tabs
- toolbars
- tables
- focus, hover, selected, and overlay states

### Visualization contract

Visualization should use a small explicit token set for widget-specific dark surfaces rather than relying only on shell aliases.

Visualization-owned dark roles should include at minimum:

- visualization canvas
- widget surface
- widget surface subtle
- widget border
- visualization text
- visualization muted text
- editor/input surface inside widgets
- visualization selection surface
- visualization hover surface

### Shared responsibility boundary

Portal shell should own:

- app chrome
- navigation
- dialogs
- forms
- shared shell controls
- shared panel structure

Visualization should own:

- widget surfaces
- viewer widget chrome
- chart and table local surfaces
- widget-level hover and selected states
- dense data-surface interaction details

## Third-Party Surface Policy

Use these categories:

- `theme`
  - full dark support through documented hooks or owned CSS
- `adapt`
  - dark shell framing plus safe partial styling
- `light-island`
  - intentionally light interior inside a dark container

Phase 1 should prefer a clean `light-island` treatment over brittle forced recoloring.

Global inversion and undocumented hacks should be avoided unless a surface is low risk and non-critical.

## First-Pass Success Criteria

The first project should be considered successful when:

- portal shell is consistently dark across shared chrome
- viewer and major visualization surfaces are consistently dark
- first-party widgets used in core user flows are dark or intentionally adapted
- unsupported third-party surfaces are documented and visually contained
- Composer and EM remain explicitly deferred

## Risk Areas

The highest-risk areas are likely to be:

- visualization widgets with direct light-only SCSS
- embedded editors and third-party controls
- legacy component styles that bypass shared token layers
- screen-level combinations that mix shell, visualization, and older utilities in one view

## Summary

This project should be treated as the next execution phase after shell implementation, not as part of the shell implementation itself.

Its scope is intentionally practical:

- portal shell
- visualization
- first-party widgets used by those surfaces

That keeps the project large enough to deliver a meaningful user-facing dark mode, but bounded enough to avoid pulling Composer and EM into the same effort.
