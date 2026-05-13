# Portal + Visualization Dark Mode Roadmap

## Purpose

This document is the execution companion to [portal-visualization-dark-mode-spec.md](E:\home\dev\github\lookfeel\specs\portal-visualization-dark-mode-spec.md).

Use it for:

- implementation sequencing
- audit findings
- file-level target refinement
- exception tracking
- QA coverage tracking

This roadmap should be updated as audit work produces concrete results.

## Relationship To The Spec

The spec defines:

- scope
- principles
- responsibilities
- token and exception model

This roadmap defines:

- execution order
- evolving findings
- concrete targets
- phase outputs

## Starting Assumptions

- shell implementation lands first
- portal shell and visualization are the only dark-mode scope in this project
- Composer and EM remain deferred
- unsupported third-party surfaces may be accepted as phase-1 light islands

## Audit Summary

### Current status

- shell token layer: audited
- shared shell light-only helpers: audited
- visualization hardcoded light surfaces: audited
- shared first-party widget adoption: audited
- third-party exception list: audited
- QA surface matrix: audited

### Cross-Phase Findings

#### Shared shell findings

- The runtime shell token layer is already a strong starting point in [_variables.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_variables.scss:1).
- Core shell surfaces, text, borders, dialog, input, toolbar, tab, button, hover, selected, and overlay roles are already expressed through `--inet-*` variables rather than only raw component colors.
- This means shell dark mode can primarily be implemented as a root-level token override rather than a second full selector system.
- The biggest shared-shell cleanup work is in [_themeable.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_themeable.scss:1), which still contains legacy utility classes and direct light-oriented assumptions.
- High-value shared-shell cleanup targets include:
  - `.bg-lighten1` and `.bg-lighten2` using fixed white rgba overlays
  - `.bg-darken2` using a fixed black rgba overlay instead of a named token
  - `.bg-white1` through `.bg-white4` and `.bg-white-inet`, which preserve light-theme naming and light-surface assumptions
  - `.bd-outer-indicator` and `.bd-inner-indicator`, which still rely on direct light SCSS palette values instead of runtime token roles
  - `.hover-bg-white-border`, which hardcodes `background: white` and `border: 1px solid black`
  - `.selection-box`, which still derives from a light off-white rgba treatment
- Shared shell usage of those helpers still appears in important areas such as Composer-adjacent gutters and search box backgrounds, which means dark-mode cleanup should remove the semantic dependence on “white” helpers even where the actual values currently map through shell aliases.
- [_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:1) is in better shape overall and already consumes tokens for forms, dialogs, cards, nav tabs, dropdowns, inputs, tables, date picker surfaces, and button variants.
- `_bootstrap-override.scss` still needs dark-mode validation, but the audit did not uncover the same kind of hardcoded white/black cluster seen in `_themeable.scss`.
- Shared-shell risk is therefore not lack of tokenization in Bootstrap overrides. The risk is leftover legacy helpers and overlay semantics in `_themeable.scss`.
- Primary execution link: see `Phase 2` for shared-shell cleanup implications.

#### Visualization findings

- The visualization layer has a meaningful number of widget-local light assumptions in `vsobjects`, especially around overlays, widget-local controls, borders, and viewer-adjacent surfaces.
- The main problem is not absence of a theming architecture. The main problem is that many visualization widgets still use local hardcoded values instead of a visualization token contract.
- High-priority first-party visualization hotspots include:
  - [vs-chart.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\chart\vs-chart.component.scss:1)
  - [vs-crosstab.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\table\vs-crosstab.component.scss:1)
  - [viewer-app.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\viewer-app.component.scss:1)
  - [vs-table-cell.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\table\vs-table-cell.component.scss:1)
  - [vs-text-input.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\text-input\vs-text-input.component.scss:1)
  - [vs-combo-box.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\combo-box\vs-combo-box.component.scss:1)
- `vs-chart.component.scss` is a good example of the cleanup shape required:
  - range input controls use `#ddd`, `#d3d3d3`, `#ff8d41`, white outlines, and white translucent backgrounds
  - drill and comparison tips use `color: black` on translucent white backgrounds
  - hover affordances such as `.move-down` use `background: white`
- `vs-crosstab.component.scss` repeats the same overlay pattern with black text on translucent white tip backgrounds and white hover surfaces.
- `viewer-app.component.scss` contains a smaller but important viewer-level light assumption in `.mobile-dropdown { background: white; }`, which suggests viewer chrome still needs a visualization-aware surface token.
- `vs-table-cell.component.scss` still uses a white sort-chip hover treatment with dark blue text and a black border, which means dense table interactions are not yet aligned to shared visualization state tokens.
- `vs-text-input.component.scss` and `vs-combo-box.component.scss` both keep widget-local date and dropdown surfaces on `background: white`, so visualization inputs currently bypass any shared dark surface contract.
- `vs-combo-box.component.scss` also defines a local dropdown container with `#ccc` border, white surface, `rgba(0,0,0,0.2)` shadow, and gray hover/selected fills, which is effectively a parallel light-only menu style.
- The visualization scan also found light assumptions in selection, chart, combo-box, table, bookmark, annotation, range-slider, and mobile-toolbar files, which indicates this is a distributed cleanup rather than one isolated widget problem.
- The scan pattern is consistent: overlays, tips, inline controls, and local dropdowns are more likely to be hardcoded than the base viewer frame, so the visualization token contract should explicitly cover overlay surfaces, control surfaces, hover, selected, and muted text roles.
- Some newer portal-adjacent data browser surfaces already use token-shaped CSS with light fallbacks rather than fully hardcoded light colors.
- Good examples are:
  - [asset-description.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\asset-description\asset-description.component.scss:1)
  - [database-data-model-browser.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-data-model-browser\database-data-model-browser.component.scss:1)
- Those files still fall back to light values such as `#fff`, `#fffdfa`, `#f8f5ef`, and `#d9d4c8`, but they are structurally easier to migrate because they already express intent via CSS variables.
- Primary execution links: see `Phase 3` for token-contract implications and `Phase 4` for adoption priorities.

#### Third-party findings

- Bootstrap and ng-bootstrap are the dominant third-party UI surfaces in the portal and visualization scope, not Angular Material.
- Bootstrap/ng-bootstrap usage is widespread in portal shell and visualization-adjacent modules through:
  - [portal-app.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\portal-app.module.ts:1)
  - [vs-object.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\vs-object.module.ts:1)
  - [date-type-editor.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\date-type-editor\date-type-editor.module.ts:1)
- The audit result for Bootstrap/ng-bootstrap is `theme` rather than `light-island`:
  - shared shell overrides already target Bootstrap-shaped surfaces in [_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:1)
  - sampled ng-bootstrap integrations such as [timepicker.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\date-type-editor\timepicker.component.scss:1), [actions-contextmenu.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\fixed-dropdown\actions-contextmenu.component.scss:1), and [notifications.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\notifications\notifications.component.scss:1) mostly rely on structure, spacing, and our own shell classes rather than opaque vendor-only colors
  - risk remains in our local light overrides around those widgets, not in the libraries themselves
- Angular CDK appears in visualization through `ScrollingModule` in [vs-object.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\vs-object.module.ts:1), but it is effectively infrastructure rather than a themed visual surface.
- Angular CDK should therefore be treated as `theme` by inheritance from first-party tokens, not as a separate exception source.
- CKEditor 5 is a real third-party dark-mode risk in visualization-owned rich-text dialogs:
  - the shared wrapper is a thin pass-through over `@ckeditor/ckeditor5-angular` in [ckeditor-wrapper.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\shared\ckeditor-wrapper\ckeditor-wrapper.module.ts:1)
  - the shared wrapper host sets `color: black` in [ckeditor-wrapper.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\shared\ckeditor-wrapper\ckeditor-wrapper.component.scss:1)
  - the visualization rich-text dialog forces a white editor background and black text in [rich-text-dialog.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\dialog\rich-text-dialog\rich-text-dialog.component.scss:1) and [rich-text-dialog.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\dialog\rich-text-dialog\rich-text-dialog.component.ts:1)
- CKEditor-powered annotation editing should currently be classified as `adapt` at best and may need a temporary `light-island` treatment in phase 1 unless the wrapper gets a dedicated dark token pass.
- CodeMirror is present in the portal codebase through [codemirror.module.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\codemirror\codemirror.module.ts:1), but the audit did not identify it as a primary portal-shell or viewer dark-mode blocker in the scoped portal + visualization flows.
- CodeMirror should be tracked as a deferred or secondary `adapt` surface rather than a phase-1 blocker for the portal + visualization dark-mode project.
- Angular Material is installed and used in the broader portal application, but this audit did not find it acting as a primary visualization-owned surface in the viewer and `vsobjects` path.
- Angular Material should therefore be treated as a lower-priority shared-shell validation concern rather than as a first-pass visualization exception driver.
- Primary execution link: see `Phase 5` for exception handling and fallback treatment.

#### Recommended exceptions

- [table-style-pane.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\table-style\table-style-pane.component.scss:1) should be treated as an initial `light-island` candidate because its preview image intentionally sits on white to preserve the appearance of light-authored table styles with transparency.
- CKEditor-backed rich-text annotation editing should be considered a second `light-island` candidate if phase-1 dark-mode work does not add a proper editor token bridge, because the current wrapper and visualization integration explicitly assume black text on white.
- Similar preview and editor surfaces should be reviewed under the same rule: if the surface is intentionally previewing light-authored output, prefer a contained light island over brittle forced recoloring in phase 1.
- Primary execution link: see `Phase 5` for exception containment and cleanup boundaries.

#### QA surface matrix

- `portal shell`
  - top navigation, home icon, repository chrome, tab strips, and shell toolbars
  - dialogs opened through ng-bootstrap, including standard message, confirmation, and session-expiration flows
  - shared forms, dropdowns, floating labels, validation, disabled states, and notifications
- `viewer frame`
  - [viewer-root.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\viewer\viewer-root.component.ts:1) load path, loading splash removal, and embedded viewer entry
  - [viewer-app.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\viewer-app.component.scss:1) toolbar, mobile toolbar, bookmark dropdown, format pane, and mobile dropdown chrome
- `visualization high-frequency widgets`
  - [vs-chart.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\chart\vs-chart.component.scss:1) including plot controls, slider chrome, overlays, tips, and comparison/drill affordances
  - [vs-crosstab.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\table\vs-crosstab.component.scss:1), [vs-table-cell.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\table\vs-table-cell.component.scss:1), and adjacent table surfaces for hover, sort, active, pinned, and inline-edit behavior
  - selection, slider, range-slider, combo-box, and text-input widgets, with special attention to local dropdowns, member lists, and date-picker surfaces
- `visualization states`
  - hover, selected, focused, disabled, empty, loading, and error states across viewer widgets
  - overlay readability for tooltips, drill tips, annotation affordances, and context menus
- `exceptions and containment`
  - table-style preview light-island behavior
  - CKEditor annotation editor behavior if left as a temporary light island
  - containment quality of any remaining third-party light interiors inside dark shell or dialog framing
- Primary execution link: see `Phase 6` for QA and hardening coverage.

## Primary Code Targets

| File / area | Main responsibility | Audit notes |
|---|---|---|
| [web/projects/portal/src/scss/_variables.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_variables.scss:1) | dark token override layer | strong baseline; already exposes shell surface, text, border, input, dialog, toolbar, table, button, selected, and overlay tokens |
| [web/projects/portal/src/scss/_themeable.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_themeable.scss:1) | shared shell cleanup | primary shared-shell risk area; contains legacy white-named helpers, white/black hardcodes, and overlay semantics that should be renamed or remapped |
| [web/projects/portal/src/scss/_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:1) | Bootstrap-shaped control validation | largely tokenized already; should mainly need dark-token validation rather than structural rewrite |
| [web/projects/portal/src/global.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\global.scss:1) | theme activation hook only | no detailed shell styling currently; good candidate for a minimal root theme hook only |
| `web/projects/portal/src/app/vsobjects/**` | visualization adoption | distributed hotspot; many widget-local light backgrounds, pale borders, and black-on-white overlay treatments |
| `web/projects/portal/src/app/widget/**` | shared first-party widget adoption | mixed; some widgets are already neutral, while others still contain white-backed editors, picker panes, and preview surfaces |

## Phase 0: Audit And Guardrails

### Goal

Freeze the phase-1 scope and identify the highest-risk light-mode assumptions before dark-mode edits begin.

### Tasks

- confirm root theme activation mechanism
- audit shared shell SCSS for remaining light-only helpers and direct colors
- audit visualization and widget SCSS for hardcoded light values
- classify third-party surfaces into `theme`, `adapt`, and `light-island`
- define the initial QA surface list for portal shell and visualization

### Outputs

- approved phase-1 scope
- dark-mode target file list
- initial exception list
- audit summary folded into this roadmap

### Phase-specific implications

- The current portal entrypoints do not yet expose a dark-theme activation hook.
- [global.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\global.scss:1) currently imports variables, Bootstrap, shared assets, and shell imports, but does not define a root dark selector.
- [app.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\app.component.ts:1) and [viewer-root.component.ts](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\viewer\viewer-root.component.ts:1) add runtime body classes for platform and load behavior, but not for theme selection.
- Phase 1 should therefore introduce one explicit root hook such as `body[data-theme="dark"]` or `.theme-dark` and keep theme activation centralized there instead of scattering local component switches.

## Phase 1: Dark Token Foundation

### Goal

Create the root dark-theme token layer before changing component adoption.

### Primary file

- [web/projects/portal/src/scss/_variables.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_variables.scss:1)

### Planned outputs

- stable dark token contract for shell surfaces
- initial visualization token contract stub

### Phase-specific implications

- `_variables.scss` already gives dark mode a viable shell token contract.
- Dark-theme work here should focus on adding a root override block for existing tokens before introducing new variables.
- Existing overlay tokens are a good base, but white-based helper overlays in `_themeable.scss` should be reconciled against them.

## Phase 2: Shared Shell Adoption Cleanup

### Goal

Ensure the shared shell layer actually respects the dark token system.

### Primary files

- [web/projects/portal/src/scss/_themeable.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_themeable.scss:1)
- [web/projects/portal/src/scss/_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:1)

### Planned outputs

- portal shell shared SCSS is dark-ready
- remaining shared light-only helpers are either migrated or intentionally retained

### Phase-specific implications

- `_themeable.scss` is the main shared-shell cleanup file.
- Legacy utility naming such as `.bg-white*` is itself a design smell for dark mode even when values currently route through aliased shell colors.
- Direct hardcoded values still present in shared shell helpers:
  - `background-color: white`
  - `background: white`
  - `border: 1px solid black`
  - `rgba(255, 255, 255, 0.2)`
  - `rgba(255, 255, 255, 0.3)`
  - `rgba(0, 0, 0, 0.15)`
- `_bootstrap-override.scss` mostly validates the token approach rather than blocking it.
- This phase applies the shared-shell findings summarized above and should remove legacy light semantics without inventing a parallel dark selector system.

## Phase 3: Visualization Token Contract

### Goal

Create a small, explicit token layer for visualization-owned surfaces.

### Planned outputs

- stable visualization dark token contract
- mapping from old light-only widget assumptions to visualization token roles

### Phase-specific implications

- Visualization needs its own dark token contract rather than relying only on shell aliases.
- Current widget patterns suggest explicit roles are needed for:
  - widget surface
  - widget control surface
  - widget border
  - widget overlay surface
  - widget overlay text
  - muted visualization text
  - visualization-specific hover and selected states
- Newer token-shaped portal data surfaces should be aligned to the same contract to avoid parallel dark-surface systems.
- This phase operationalizes the cross-phase visualization findings by turning recurring white-overlay and local-dropdown patterns into explicit visualization-owned dark roles.

## Phase 4: Shared Visualization Adoption

### Goal

Convert the highest-value visualization surfaces to token-driven dark mode before deep one-off cleanup.

### Priority areas

- viewer container and viewer chrome
- chart surfaces
- crosstab and table surfaces
- filter and selection widgets
- shared visualization input widgets

### Planned outputs

- major viewer and visualization flows are dark-ready

### Phase-specific implications

- First-pass priority should center on shared viewer and high-frequency widget families rather than rare specialist widgets.
- Priority hotspots confirmed by audit:
  - charts
  - crosstabs and table cells
  - viewer-level mobile dropdown chrome
  - combo-box and text-input style widgets
  - selection and slider-adjacent controls
- Newer portal data-browser surfaces can likely join late in this phase or early in the widget-cleanup phase because they are already closer to token-driven styling.
- This phase should consume the visualization token contract first, then convert the highest-frequency viewer and widget paths named in the summary.

## Phase 5: Widget Cleanup And Exceptions

### Goal

Handle the remaining long-tail widget issues without destabilizing the main dark-mode system.

### Planned outputs

- final exception list for phase 1
- tracked list of first-party widget cleanup items
- adapter guidance for partially themeable third-party surfaces

### Phase-specific implications

- Shared widget scan shows a mix of outcomes:
  - some files are already close to dark-ready
  - some still contain direct white surfaces or clearly intentional light previews
- Representative widget findings:
  - [dynamic-combo-box.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\dynamic-combo-box\dynamic-combo-box.component.scss:1) is mostly neutral and should require little dark-specific work
  - [auto-complete-text.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\auto-complete\auto-complete-text.component.scss:1) is a likely low-effort adoption target because it contains light assumptions but not a large bespoke surface system
  - [table-style-pane.component.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\table-style\table-style-pane.component.scss:1) includes an explicitly intentional white preview background and is a likely `light-island` or controlled exception candidate
- Visualization exception review should pay special attention to editors, previews, and surfaces whose output is authored for light backgrounds.
- This phase is where the cross-phase third-party findings and exception list turn into concrete keep/adapt/light-island decisions.

## Phase 6: QA And Hardening

### Goal

Validate that dark mode works as a user-facing feature rather than only as a token demo.

### QA focus areas

- portal navigation
- tabs and toolbars
- forms and dropdowns
- dialogs
- viewer page layout
- charts
- tables and crosstabs
- filters and selectors
- hover, selected, disabled, and focus states
- loading, empty, and error states

### Planned outputs

- approved dark-mode pass for portal shell and visualization
- known issue list if anything is intentionally deferred

### Phase-specific implications

- The QA pass should be organized around the matrix above rather than by stylesheet file.
- Highest-risk regression clusters are:
  - viewer toolbar and mobile dropdown chrome
  - chart overlays and slider controls
  - dense table interactions such as sort chips, hover, active cells, and inline editors
  - combo-box, text-input, and date-picker surfaces that currently use local white backgrounds
  - exception containment for table-style previews and any temporary CKEditor light-island treatment
- The QA goal is not only “is it dark” but also:
  - does shell chrome remain coherent across navigation, dialogs, and forms
  - do visualization surfaces remain readable and analytically subordinate to the data
  - do temporary light islands feel intentional and contained rather than broken
- This phase validates the matrix recorded in the summary and should produce the final go/no-go judgment for phase-1 dark mode.

## Recommended Sequencing

1. Phase 0 audit
2. Phase 1 dark token foundation
3. Phase 2 shared shell adoption cleanup
4. Phase 3 visualization token contract
5. Phase 4 shared visualization adoption
6. Phase 5 widget cleanup and exceptions
7. Phase 6 QA and hardening

## Update Rule

As audit work progresses, update this roadmap with:

- concrete file findings
- exception classifications
- confirmed phase blockers
- QA gaps

The spec should stay comparatively stable. This roadmap should absorb the evolving implementation knowledge.
