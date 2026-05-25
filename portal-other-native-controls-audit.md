# Portal Other Native Controls Audit

Created: May 18, 2026

## Purpose

Track browser-native form controls in `web/projects/portal/src/app` that may create shell-consistency or behavior problems beyond the already-audited checkbox, radio, and select cases.

This note is intentionally practical.
It is meant to identify which native controls actually matter in the current portal codebase, so we can prioritize review work instead of speculating about every possible HTML input type.

## Summary

The main native-control follow-up areas in `portal` are:

1. `input[type="number"]`
2. `input[type="file"]`
3. native date/time-family inputs
4. `input[type="range"]`

Lower-priority or currently irrelevant native controls either appear very rarely or do not appear at all.

## Strategy Decision

For the native controls covered by this note, the default approach should be:

- keep native behavior where it is structurally acceptable
- define shared policy before allowing more local one-off fixes
- introduce shared wrappers only where native chrome is consistently fighting the shell
- replace native controls only when browser-owned behavior or chrome is structurally insufficient

This note does **not** reopen the select or checkbox/radio decisions.

Those are already covered by:

- [portal-select-strategy-spec.md](E:\home\dev\github\stylebi\docs\portal-select-strategy-spec.md)
- [portal-plain-checkbox-audit.md](E:\home\dev\github\stylebi\docs\portal-plain-checkbox-audit.md)

The purpose here is to define the shared approach for the remaining native-control families.

## Inventory

Audit counts observed in `web/projects/portal/src/app` HTML templates:

- `input[type="file"]`: **6**
- `input[type="number"]`: **109**
- `input[type="date"]`: **2**
- `input[type="time"]`: **1**
- `input[type="datetime-local"]`: **2**
- `input[type="month"]`: **0**
- `input[type="week"]`: **0**
- `input[type="range"]`: **2**
- `input[type="color"]`: **0**
- `input[type="search"]`: **1**
- `<details>`: **0**
- `<summary>`: **0**

## Priority Assessment

### 1. Number Inputs

**Priority: High**

This is the largest remaining native-control category by far.

Typical risks:

- browser spinner behavior
- inconsistent alignment or width in dense forms
- browser-specific input chrome
- accidental mismatch with shell spacing and height

High-use files include:

- [web/projects/portal/src/app/graph/dialog/chart-plot-options-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\graph\dialog\chart-plot-options-pane.component.html:1)
- [web/projects/portal/src/app/composer/dialog/vs/viewsheet-print-layout-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\composer\dialog\vs\viewsheet-print-layout-dialog.component.html:1)
- [web/projects/portal/src/app/vsobjects/dialog/size-position-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\dialog\size-position-pane.component.html:1)
- [web/projects/portal/src/app/portal/schedule/schedule-task-editor/conditions/task-condition-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\conditions\task-condition-pane.component.html:1)

Recommendation:

- review whether the current shell input styling is sufficient for numeric fields
- decide whether spinners should be consistently shown or suppressed in ordinary shell forms
- document a shared policy before more local numeric-input fixes accumulate

### Number Input Strategy

Default direction:

- keep number inputs native
- avoid local per-screen spinner and alignment hacks unless there is an urgent bug
- define one shared portal policy for spinner visibility, width, alignment, and dense-form usage

Recommended shared policy questions:

- should browser spinner controls be shown by default in ordinary shell forms?
- should dense property panes suppress spinners consistently?
- should number inputs follow the same width and alignment rules across dialog/editor contexts?

Preferred outcome:

- a shared styling/policy layer for number inputs
- no custom number-input component by default

### 2. File Inputs

**Priority: High**

The count is small, but native file inputs are among the most visually inconsistent browser controls.

Typical risks:

- browser-owned button/label styling
- poor shell visual integration
- inconsistent text overflow and file-name display

Current files:

- [web/projects/portal/src/app/vs-wizard/gui/wizard-pane/vs-wizard-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vs-wizard\gui\wizard-pane\vs-wizard-pane.component.html:1)
- [web/projects/portal/src/app/vsobjects/viewer-app.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\viewer-app.component.html:1)
- [web/projects/portal/src/app/widget/image-editor/image-preview-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\image-editor\image-preview-pane.component.html:1)
- [web/projects/portal/src/app/binding/editor/chart/aesthetic/static-shape-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\binding\editor\chart\aesthetic\static-shape-pane.component.html:1)
- [web/projects/portal/src/app/composer/dialog/ws/import-csv-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\composer\dialog\ws\import-csv-dialog.component.html:1)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/driver-wizard/driver-wizard.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\driver-wizard\driver-wizard.component.html:1)

Recommendation:

- review whether portal should standardize on a shared shell wrapper for file selection
- prefer one shared pattern rather than local file-input restyling in each dialog

### File Input Strategy

Default direction:

- do not rely on raw native file input appearance as the long-term shell pattern
- prefer a shared wrapper pattern for file selection when the control is visible in user-facing UI

Why:

- browser-owned file buttons are visually inconsistent
- file-name display and overflow handling are awkward with raw native controls
- per-dialog restyling tends to drift quickly

Preferred outcome:

- a shared shell wrapper pattern around native file selection
- keep the actual file-selection behavior native
- avoid a fully custom file-picker component unless product requirements expand beyond simple upload selection

### 3. Native Date/Time Inputs

**Priority: Medium**

The count is low, but these controls carry browser-owned picker chrome and can drift from the shell.

Current files:

- `type="date"` and `type="datetime-local"`:
  - [web/projects/portal/src/app/vsobjects/dialog/range-slider-edit-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\dialog\range-slider-edit-dialog.component.html:1)
- `type="time"`:
  - [web/projects/portal/src/app/vsobjects/dialog/input-parameter-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\dialog\input-parameter-dialog.component.html:1)

Recommendation:

- review whether these should remain native
- if the product needs shell-consistent picker affordances, consider replacing them with existing shared date/time editor patterns instead of styling native inputs locally

### Date/Time Input Strategy

Default direction:

- do not add more one-off visual patches to native date/time-family controls
- prefer existing shared date/time editor patterns where the product already has them
- keep native date/time inputs only where their browser-owned picker behavior is acceptable and visually low-risk

Why:

- native date/time-family controls bring browser-owned icons and picker chrome
- they can easily diverge from the shell if treated case by case
- the repo already contains shared date/time editor patterns in other areas

Preferred outcome:

- use native date/time-family inputs sparingly
- when shell consistency matters, standardize on shared date/time editor components rather than local native styling

### 4. Range Inputs

**Priority: Medium**

The count is low, but native slider appearance is highly browser-specific.

Current files:

- [web/projects/portal/src/app/vsobjects/objects/chart/vs-chart.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\objects\chart\vs-chart.component.html:1)

Recommendation:

- review whether the current native slider appearance is acceptable
- if not, standardize a shared slider treatment rather than patching sliders per screen

### Range Input Strategy

Default direction:

- keep range inputs native unless their browser-specific appearance becomes a clear shell problem
- if slider chrome needs redesign, solve it with a shared slider treatment rather than per-screen overrides

Preferred outcome:

- native behavior retained
- one shared visual treatment if the current native appearance is not acceptable

## Lower-Priority Controls

### Search Inputs

**Priority: Low**

Only one native search input was found:

- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasource-selection/datasource-search/datasource-search.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasource-selection\datasource-search\datasource-search.component.html:1)

This likely does not justify shared strategy work unless browser-native search affordances become a visible consistency problem.

## Currently Not A Concern

No usage was found for:

- `input[type="color"]`
- `input[type="month"]`
- `input[type="week"]`
- `<details>`
- `<summary>`

These do not need immediate design-system attention in `portal`.

## Recommended Next Steps

### Phase 1

Review and document shared policy for:

- number inputs
- file inputs

These have the highest combination of frequency and likelihood of shell inconsistency.

### Phase 2

Review low-count but behavior-sensitive controls:

- native date/time-family inputs
- range inputs

### Phase 3

Only create new shared components or wrappers where the native control is proving structurally insufficient.

Do not default to replacing every native control just because it can be themed imperfectly.

## Guardrails

To keep native-control work maintainable:

- avoid new one-off polish for `number`, `file`, native date/time-family, and `range` unless fixing an urgent bug
- prefer shared policy or shared wrapper work over local visual patches
- when a local exception is necessary, document why the shared direction was not sufficient
- treat new visible raw file-input patterns as review items
- treat repeated numeric-input spinner/alignment fixes as a signal that the shared policy is still missing

## Relationship To Other Notes

This note complements:

- [portal-select-strategy-spec.md](E:\home\dev\github\stylebi\docs\portal-select-strategy-spec.md)
- [portal-plain-checkbox-audit.md](E:\home\dev\github\stylebi\docs\portal-plain-checkbox-audit.md)

Those notes cover controls where either:

- the current backlog is a finite cleanup problem, or
- the control already deserves a more explicit shared strategy.
