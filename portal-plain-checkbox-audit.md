# Portal Plain Checkbox Audit

Created: May 16, 2026

## Purpose

Track places in `web/projects/portal/src` where native checkboxes bypass the shared shell checkbox styling because they do not use `form-check-input`.

This note is intentionally biased toward a **full fix** approach rather than a quick global color patch. The goal is to come back later and convert or restyle these deliberately, category by category.

## Current State

- Shared shell checkbox styling is class-driven in [web/projects/portal/src/scss/_bootstrap-override.scss](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:269).
- Native checkboxes without `form-check-input` fall back to browser styling.
- Audit result: **41 plain checkbox usages** found in `portal` HTML templates at the time of this audit.
- We explicitly chose **not** to add a universal `input[type="checkbox"]` fallback because that would blur the distinction between true fixes and custom widget behavior, and could make regressions harder for QA to spot.
- Shared shell radio styling also uses the same `form-check-input` path in [web/projects/portal/src/scss/_bootstrap-override.scss](E:\home\dev\github\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:269).
- Follow-up audit result: **13 plain radio usages** were found in `portal` HTML templates that bypass that shared path.

## Strategy Decision

Checkboxes should continue to use the existing shared shell styling model rather than a new custom checkbox system.

The default direction is:

- keep native checkbox behavior
- use the shared `form-check-input` styling path wherever the control is an ordinary form or list checkbox
- avoid a universal `input[type="checkbox"]` fallback
- avoid a shared custom checkbox component unless a widget has behavior that truly requires one

Radios should follow the same policy:

- keep native radio behavior
- use the shared `form-check-input` styling path for ordinary radio groups
- avoid a universal `input[type="radio"]` fallback
- avoid a shared custom radio component unless a widget has behavior that truly requires one

This differs from the select strategy discussion and from the broader follow-up note for other native controls.

For select controls, native behavior has structural limits around open-state styling and richer dropdown behavior.
For checkboxes and radios, the main problem is much narrower: a finite set of controls are simply bypassing the existing shared class-based shell styling.

## Recommended Default Pattern

For ordinary portal checkboxes and radios, prefer the existing shared Bootstrap-aligned shell pattern:

- `form-check`
- `form-check-input`
- `form-check-label`

That path already picks up the shared shell checkbox styling in [_bootstrap-override.scss](E:\home\dev\github\stylebi\web\projects\portal\src\scss\_bootstrap-override.scss:269).

## When Custom Checkbox Treatment Is Allowed

Use a custom or local checkbox treatment only when at least one of these is true:

- the control lives inside a specialized widget with bespoke rendering or interaction
- the checkbox is embedded inside a tree, browser, or dense custom row where the standard shell markup does not fit cleanly
- the widget requires behavior beyond a normal checkbox, such as custom selection visuals or nonstandard layout ownership

If none of those conditions apply, the control should be moved onto the shared `form-check-input` path rather than locally restyled.

The same rule should be applied to radios.

## Recommended Strategy

Use a staged cleanup instead of a single universal selector:

1. Convert straightforward omissions to `form-check-input`.
2. Review table/list bulk-selection checkboxes for spacing and alignment after conversion.
3. Review custom tree/browser/widget checkboxes separately, because they may need local markup or SCSS changes rather than a class drop-in.
4. Only consider a broader fallback if we later decide the remaining custom controls are too expensive to normalize individually.

## Why We Should Not Add A Universal Fallback

A global rule such as `input[type="checkbox"]` would seem cheaper in the short term, but it has important downsides:

- it would hide which controls are truly using the shared shell path versus falling into it accidentally
- it would make bespoke widget behavior harder to reason about
- it would increase regression risk in tree, table, and custom-editor contexts
- it would reduce the signal value of future audits and code review

The current finite backlog is small enough that intentional cleanup is the better maintenance tradeoff.

## Categories

### 1. Straightforward Form Or Dialog Omissions

These look like normal checkboxes that likely just missed `form-check-input`. They should be the safest starting point.

- [web/projects/portal/src/app/binding/editor/chart/color-mapping-dialog.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\binding\editor\chart\color-mapping-dialog.component.html:38)
- [web/projects/portal/src/app/binding/editor/chart/aesthetic/categorical-color-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\binding\editor\chart\aesthetic\categorical-color-pane.component.html:21)
- [web/projects/portal/src/app/binding/editor/chart/aesthetic/categorical-color-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\binding\editor\chart\aesthetic\categorical-color-pane.component.html:64)
- [web/projects/portal/src/app/portal/dialog/analyze-mv/create-mv-view/create-mv-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\dialog\analyze-mv\create-mv-view\create-mv-pane.component.html:24)
- [web/projects/portal/src/app/portal/dialog/analyze-mv/create-mv-view/create-mv-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\dialog\analyze-mv\create-mv-view\create-mv-pane.component.html:35)
- [web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\dialog\vpm-condition-dialog\vpm-condition-pane\vpm-condition-pane.component.html:30)
- [web/projects/portal/src/app/portal/schedule/schedule-task-editor/conditions/task-condition-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\conditions\task-condition-pane.component.html:147)
- [web/projects/portal/src/app/widget/dialog/getting-started-dialog/getting-started-dialog.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\dialog\getting-started-dialog\getting-started-dialog.component.html:74)
- [web/projects/portal/src/app/widget/presenter/presenter-property-dialog.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\presenter\presenter-property-dialog.component.html:30)

Recommended approach:

- Add `form-check-input`.
- Verify spacing around labels and inline alignment.
- Confirm focus/checked states still read well in each dialog.

### 2. Table And List Selection Checkboxes

These are still likely fixable with shared shell checkbox styling, but they often sit inside dense table/list rows and may need follow-up spacing tweaks.

- [web/projects/portal/src/app/portal/data/asset-item-list-view/asset-item-list-view.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\asset-item-list-view\asset-item-list-view.component.html:21)
- [web/projects/portal/src/app/portal/data/asset-item-list-view/asset-item-list-view.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\asset-item-list-view\asset-item-list-view.component.html:54)
- [web/projects/portal/src/app/portal/data/asset-item-list-view/asset-item-list-view.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\asset-item-list-view\asset-item-list-view.component.html:102)
- [web/projects/portal/src/app/portal/data/data-folder-browser/data-folder-list-view/data-folder-list-view.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\data-folder-list-view\data-folder-list-view.component.html:21)
- [web/projects/portal/src/app/portal/data/data-folder-browser/data-folder-list-view/data-folder-list-view.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\data-folder-list-view\data-folder-list-view.component.html:81)
- [web/projects/portal/src/app/portal/schedule/schedule-task-editor/actions/action-accordian/action-accordion.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\actions\action-accordian\action-accordion.component.html:650)
- [web/projects/portal/src/app/portal/schedule/schedule-task-editor/actions/action-accordian/action-accordion.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-editor\actions\action-accordian\action-accordion.component.html:661)
- [web/projects/portal/src/app/portal/schedule/schedule-task-list/move-task-dialog/task-folder-browser/task-folder-browser.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\schedule\schedule-task-list\move-task-dialog\task-folder-browser\task-folder-browser.component.html:53)

Recommended approach:

- Convert to `form-check-input`.
- Re-check row density, header alignment, and hit area.
- Expect a small SCSS pass in each list if native checkbox metrics were previously assumed.

Note:

- The main schedule task list page checkbox issue was already fixed separately during this thread and is not part of the remaining backlog here.

### 3. Data Browser And Tree Selection Controls

These are the most likely to need local treatment. Many already use custom classes or live inside selection/tree widgets with bespoke layout and selection behavior.

- [web/projects/portal/src/app/portal/data/data-datasource-browser/data-source-browser/data-sources-browser.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\data-source-browser\data-sources-browser.component.html:49)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/data-source-browser/data-sources-browser.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\data-source-browser\data-sources-browser.component.html:69)
- [web/projects/portal/src/app/portal/data/data-folder-browser/files-browser/files-browser.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\files-browser\files-browser.component.html:49)
- [web/projects/portal/src/app/portal/data/data-folder-browser/files-browser/files-browser.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-folder-browser\files-browser\files-browser.component.html:69)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:295)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:307)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:316)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:372)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:389)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/datasources-database.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\datasources-database.component.html:447)
- [web/projects/portal/src/app/widget/tree/tree-node.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\tree\tree-node.component.html:64)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-dialog/physical-table-tree/physical-table-tree-node/physical-table-tree-node.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\logical-model\attribute-dialog\physical-table-tree\physical-table-tree-node\physical-table-tree-node.component.html:29)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/physical-model-table-tree/physical-model-table-tree-node/physical-model-table-tree-node.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\physical-model-table-tree\physical-model-table-tree-node\physical-model-table-tree-node.component.html:35)

Recommended approach:

- Do not blindly add `form-check-input` everywhere in this category.
- Review each component’s SCSS first.
- Decide case-by-case whether to:
  - add `form-check-input`,
  - create a local shell-aligned checkbox variant,
  - or keep a custom checkbox pattern if the widget needs it.

### 4. Custom Widget-Style Checkboxes

These live inside specialized widgets and likely need local review rather than a generic markup swap.

- [web/projects/portal/src/app/vsobjects/objects/check-box/vs-check-box.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\vsobjects\objects\check-box\vs-check-box.component.html:102)
- [web/projects/portal/src/app/widget/tabular/tabular-column-definition-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\tabular\tabular-column-definition-editor.component.html:88)
- [web/projects/portal/src/app/widget/tabular/tabular-list-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\widget\tabular\tabular-list-editor.component.html:20)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/driver-wizard/driver-wizard.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\driver-wizard\driver-wizard.component.html:74)
- [web/projects/portal/src/app/portal/dialog/auto-join-tables-dialog/auto-join-tables-dialog.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\dialog\auto-join-tables-dialog\auto-join-tables-dialog.component.html:64)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/physical-model-edit-table/physical-table-joins/edit-join-dialog/edit-join-dialog.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\physical-model-edit-table\physical-table-joins\edit-join-dialog\edit-join-dialog.component.html:138)

Recommended approach:

- Inspect component SCSS and interaction behavior first.
- Treat each as a mini design task, not a simple missing-class fix.

### 5. Logical Model / SQL Editor Controls

These appear more like plain form controls, but they live in denser authoring surfaces where spacing should be checked carefully after conversion.

- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/logical-model-attribute-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\logical-model\attribute-editor\logical-model-attribute-editor.component.html:109)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/logical-model-attribute-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\logical-model\attribute-editor\logical-model-attribute-editor.component.html:118)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/expression-attribute-editor/logical-model-expression-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\logical-model\expression-attribute-editor\logical-model-expression-editor.component.html:38)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/expression-attribute-editor/logical-model-expression-editor.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-physical-model\logical-model\expression-attribute-editor\logical-model-expression-editor.component.html:44)
- [web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-query/query-sql/free-form-sql-pane.component.html](E:\home\dev\github\stylebi-visual_BI_tool\stylebi\web\projects\portal\src\app\portal\data\data-datasource-browser\datasources-database\database-query\query-sql\free-form-sql-pane.component.html:22)

Recommended approach:

- Likely good candidates for `form-check-input`.
- Verify they still fit the tighter authoring layouts after conversion.

## Radio Follow-Up Audit

### Current Radio Inventory

- total native radio inputs observed in `portal` templates during the audit: **206**
- plain radios bypassing shared shell styling: **13**

This is small enough to treat as a finite cleanup backlog rather than as a justification for a new radio-control system.

### Radio Strategy

Treat radios the same way as checkboxes unless a widget truly needs custom behavior:

- ordinary form/dialog radios should use `form-check-input`
- dense or custom widget radios should be reviewed case by case
- no blanket `input[type="radio"]` fallback
- no shared custom radio component by default

### Radio Categories

#### 1. Straightforward Form Or Dialog Omissions

These are good candidates to move directly onto the shared shell radio path:

- [web/projects/portal/src/app/composer/dialog/vs/layout-option-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\composer\dialog\vs\layout-option-dialog.component.html:34)
- [web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\portal\dialog\vpm-condition-dialog\vpm-condition-pane\vpm-condition-pane.component.html:39)
- [web/projects/portal/src/app/vsobjects/dialog/range-slider-data-pane.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\dialog\range-slider-data-pane.component.html:23)
- [web/projects/portal/src/app/widget/schedule/simple-schedule-dialog.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\schedule\simple-schedule-dialog.component.html:325)

Recommended approach:

- add `form-check-input`
- verify spacing, alignment, and selected/focus states
- confirm group labels still read well in dense dialog layouts

#### 2. Shared Schedule Or Editor Controls Needing Layout Review

These likely still belong on the shared radio path, but should be reviewed because they sit inside reused editor layouts:

- [web/projects/portal/src/app/widget/schedule/start-time-editor.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\schedule\start-time-editor.component.html:23)

Recommended approach:

- move onto `form-check-input` if feasible
- verify spacing and rhythm in the shared editor layout after conversion

#### 3. Custom Widget-Style Radios

These should be treated as local design tasks rather than simple missing-class fixes:

- [web/projects/portal/src/app/widget/format/rotation-radio-group.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\widget\format\rotation-radio-group.component.html:20)
- [web/projects/portal/src/app/vsobjects/objects/radio-button/vs-radio-button.component.html](E:\home\dev\github\stylebi\web\projects\portal\src\app\vsobjects\objects\radio-button\vs-radio-button.component.html:101)

Recommended approach:

- inspect component SCSS and interaction behavior first
- preserve custom rendering if the widget meaning depends on it
- only align to the shared radio path if the control is effectively a normal radio group in disguise

## Suggested Future Work Order

### Phase 1

Tackle the safest, most visible omissions first:

- straightforward dialog/form omissions
- table/list selection checkboxes
- straightforward dialog/form radios

### Phase 2

Review dense authoring surfaces:

- logical model editors
- SQL editor controls
- schedule action accordion leftovers
- shared schedule/editor radio layouts

### Phase 3

Review custom selection widgets:

- files/data-source browsers
- tree node selection
- vs checkbox widget
- vs radio widget
- tabular editors
- join/auto-join custom controls

## Future Guardrails

To keep this backlog from growing again:

- prefer `form-check-input` for all new ordinary checkbox markup
- prefer `form-check-input` for all new ordinary radio markup
- treat new plain checkbox additions as review items unless they are part of a deliberate custom widget pattern
- treat new plain radio additions as review items unless they are part of a deliberate custom widget pattern
- when a checkbox needs local treatment, document why the shared shell pattern is not sufficient
- when a radio needs local treatment, document why the shared shell pattern is not sufficient

## Notes

- This audit is based on HTML template usage only.
- It does not cover Angular Material checkboxes, third-party controls, or cases already using `form-check-input`.
- It also does not attempt to normalize radios yet, though some plain radios were observed and may warrant a similar follow-up audit later.
