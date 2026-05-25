# Portal Select Strategy Spec

Created: May 18, 2026

## Related Docs

- Verification guide for the current condition-area custom-select sweep:
  [portal-condition-select-verification-guide.md](/E:/home/dev/github/stylebi/docs/portal-condition-select-verification-guide.md:1)

## Purpose

Define a maintainable strategy for select-style form controls in `web/projects/portal/src`.

This spec exists because the current repo is split between:

- widespread native `<select>` usage
- shared dropdown/popover primitives that are not true form-select replacements
- local one-off overrides when native select behavior or icon state is not expressive enough

The goal is to stop solving select problems screen by screen and instead establish one shared direction.

## Current State

At the time of this note:

- native `<select>` appears about `201` times under `web/projects/portal/src/app`
- many of those are ordinary dialog and form selects in `schedule`, `composer`, and `vsobjects`
- browser arrows are suppressed globally in [web/projects/portal/src/scss/internal/_html-override.scss](E:\home\dev\github\stylebi\web\projects\portal\src\scss\internal\_html-override.scss:28)
- a replacement arrow is drawn with CSS background gradients on native selects
- shared dropdown primitives exist, but they are menu/popover infrastructure rather than a reusable form-select system:
  - [web/projects/portal/src/app/widget/fixed-dropdown/fixed-dropdown.directive.ts](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\fixed-dropdown\fixed-dropdown.directive.ts:1)
  - [web/projects/portal/src/app/widget/dropdown-view/dropdown-view.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\dropdown-view\dropdown-view.component.html:1)
- the strongest precedent for a custom field control is [web/projects/portal/src/app/widget/condition/condition-field-combo.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\condition\condition-field-combo.component.html:1), which already owns open state, search, and a richer dropdown surface

## Problem Statement

The current native-select approach is good enough for basic value picking, but it breaks down when we need:

- a reliable open versus closed icon state
- richer visual treatment than browser-native behavior exposes
- consistent shell-aligned dropdown chrome
- search or typeahead inside the picker
- richer option content than plain text
- reusable behavior without local SCSS patches

Because browser-native `<select>` does not give a dependable cross-browser open-state hook, some UX requirements cannot be solved cleanly with CSS alone.

## Goals

- define one shared strategy for select controls in portal
- reduce local select-specific overrides
- preserve shell consistency for common form fields
- give the product a clear path for richer select UX where native controls are not enough
- keep migration risk lower than a repo-wide rewrite

## Non-Goals

- replacing every existing `<select>` in one project
- forcing rich custom dropdown behavior onto simple, low-risk form fields
- redesigning all existing pickers in this spec
- solving unrelated checkbox, radio, or menu-button styling here

## Recommendation

Adopt a two-tier strategy instead of a single universal replacement:

1. `NativeSelectShell`
2. `CustomSelectComponent`

This keeps the default path simple and low risk, while still giving the app a real answer for cases where native select is structurally insufficient.

## Tier 1: NativeSelectShell

### When to use it

Use `NativeSelectShell` for straightforward selects that only need:

- single selection
- plain text options
- normal disabled, invalid, and label states
- shell-consistent spacing, icon placement, and surface styling

Examples:

- time zone selects
- locale selects
- short settings dialogs
- simple option pickers in forms

### What it should provide

- shared wrapper markup around native `<select>`
- shell-consistent caret placement
- consistent sizing, padding, focus, invalid, and disabled states
- compatibility with existing `form-floating` usage
- no local SCSS required for ordinary screens

### What it should not promise

- true open-state awareness
- searchable option lists
- rich option rows
- custom keyboard model beyond native browser behavior

### Implementation shape

Preferred first version:

- a small shared component, for example `select-field`
- or, if a component is too heavy for the first pass, a shared wrapper class plus directive pattern

The component path is preferred because it creates a clear migration target and avoids “shared-ish” class conventions that drift over time.

### Proposed API

Minimal first-pass API:

- `@Input() options`
- `@Input() value`
- `@Output() valueChange`
- `@Input() disabled`
- `@Input() placeholder`
- `@Input() id`
- `@Input() ariaLabel`
- `@Input() invalid`
- `@Input() size` such as `sm | md`
- `@Input() className` only if truly needed

The rendered control should still use a real native `<select>` internally.

## Tier 2: CustomSelectComponent

### When to use it

Use `CustomSelectComponent` only when one of these is required:

- visible open versus closed state is important
- searchable or filterable options
- tree or grouped content
- embedded icons, metadata, or richer rows
- explicit dropdown open/close control
- keyboard behavior beyond native select
- cross-screen consistency that native select cannot provide

Examples:

- schedule monthly/weekly patterns if design wants explicit stateful chrome
- field pickers with search or hierarchical data
- complex authoring dialogs with richer labels
- places that already behave more like combobox/listbox than like native selects

### What it should provide

- explicit open state
- shell-owned caret/icon behavior
- shared dropdown pane styling
- keyboard navigation
- focus management
- selection announcements and reasonable accessibility semantics
- optional search/filter mode when the use case needs it

### Technical base

This component should reuse existing dropdown infrastructure where practical:

- [fixed-dropdown.directive.ts](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\fixed-dropdown\fixed-dropdown.directive.ts:1)
- shared dropdown-pane styling
- patterns already used in [condition-field-combo.component.ts](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\condition\condition-field-combo.component.ts:1)

However, it should not simply copy `condition-field-combo`. That component is specialized for field browsing and carries search/tree/list-specific behavior.

The goal is a smaller general-purpose select component with optional richer modes.

## Decision Rule

Use this rule when deciding between the two tiers:

- if native browser selection behavior is acceptable, use `NativeSelectShell`
- if product requirements depend on dropdown state or richer content, use `CustomSelectComponent`

Do not use local per-screen overrides as the default third option.

## Why Not Replace Everything With Custom Select

A repo-wide custom-select migration would create immediate responsibility for:

- keyboard support
- focus trapping and restoration
- click-outside behavior
- scrolling behavior
- long-list performance
- screen-reader semantics
- regression coverage across dialogs, forms, and dense editors

That cost is justified only where native select is truly insufficient.

## Why Not Stay Fully Native

Staying fully native keeps behavior simple, but it preserves the main maintenance problem:

- shell styling remains partly global CSS illusion
- icon behavior is not stateful
- each exception keeps turning into a local patch

That is the pattern this spec is meant to stop.

## Experiment Notes

A local experiment was tried in the schedule monthly condition area to make native selects show explicit open and closed caret states.

What worked:

- disabling the global native-select background arrow locally made a custom local indicator visible
- a CSS-drawn chevron matched the shell language better than icon-font aliases for this case
- using explicit component state was more reliable than pure `:focus-within` styling for second-click close behavior
- `mousedown` aligned better than `click` with native-select event timing when the browser auto-closed the option list after a selection

What did not work well enough:

- pure CSS focus-based state was not reliable because native selects can keep focus after the popup closes
- local wrapper and event logic quickly turned into a one-off control implementation inside a feature screen
- the experiment solved a narrow visual problem, but it did not justify a local divergence from the broader select strategy

Conclusion:

- these findings support the `NativeSelectShell` plus selective `CustomSelectComponent` strategy
- they are a reason to avoid more local select-state experiments in feature screens before the shared direction is implemented

## Initial Migration Plan

### Phase 1: Shared NativeSelectShell

Build the shared native wrapper first.

Scope:

- shared markup
- shell-consistent caret
- disabled, invalid, hover, and focus behavior
- floating-label compatibility

Do not change interaction model in this phase.

### Phase 2: Convert High-Value Simple Selects

Start with straightforward forms where behavior should remain native:

- [web/projects/portal/src/app/portal/schedule/schedule-task-editor/options/task-options-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\options\task-options-pane.component.html:90)
- schedule time-zone and locale selects in [task-condition-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\conditions\task-condition-pane.component.html:47)
- simple schedule dialog format and frequency forms in [simple-schedule-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\schedule\simple-schedule-dialog.component.html:1)
- common dialog selects in `vsobjects` and `composer`

This phase should remove the need for many local select-spacing and icon tweaks.

### Phase 3: Identify True Custom-Select Candidates

Audit screens that still have select pain after Phase 2.

Likely candidates:

- monthly condition selectors in schedule
- field/reference pickers
- screens already mixing native select with local pseudo-dropdown chrome
- any places needing richer labels, search, or explicit open-state visuals

### Phase 4: Build CustomSelectComponent

Build the richer control only after the candidate set is clear.

Keep the first version narrow:

- single-select only
- plain list mode first
- search optional, not mandatory
- no multi-select in v1

### Phase 5: Migrate Only Where Justified

Move targeted screens onto `CustomSelectComponent`.

Do not migrate simple settings selects just for consistency if `NativeSelectShell` already solves the problem.

## Candidate Hotspots

The following files are good early review targets because they concentrate select usage:

- [task-condition-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\conditions\task-condition-pane.component.html:1)
- [task-options-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\options\task-options-pane.component.html:1)
- [simple-schedule-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\schedule\simple-schedule-dialog.component.html:1)
- [aggregate-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\composer\dialog\ws\aggregate-pane.component.html:1)
- [crosstab-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\composer\dialog\ws\crosstab-pane.component.html:1)
- [vs-format-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\dialog\vs-format-pane.component.html:1)

## Accessibility Notes

If we keep native select:

- browser semantics remain strong by default
- wrapper markup must not break label association or invalid feedback

If we build custom select:

- keyboard navigation must be deliberate
- screen-reader roles and announcements must be tested
- focus return on close must be consistent
- disabled and invalid states must stay equivalent to ordinary form controls

This is one of the strongest reasons not to overuse the custom path.

## Testing Expectations

For `NativeSelectShell`:

- visual review in floating-label dialogs
- disabled, invalid, and focus states
- spacing in dense forms and input groups

For `CustomSelectComponent`:

- unit tests for open/close state
- keyboard navigation tests
- click outside and escape-to-close tests
- regression review in at least one schedule flow and one composer flow

## Open Questions

- Should `NativeSelectShell` be a real Angular component, a directive plus wrapper class, or both?
- Should `CustomSelectComponent` support search in v1, or should search remain a separate richer variant?
- Should grouped options be supported in the shared custom component, or deferred until a real need appears?
- Which module should own these controls: a general `widget/form` area or a more focused select-specific widget area?

## Proposed Next Step

Implement `NativeSelectShell` first and migrate a small schedule slice before designing the richer custom-select API.

That gives the team:

- a shared baseline
- lower migration risk
- better signal on which remaining screens truly justify a custom control
