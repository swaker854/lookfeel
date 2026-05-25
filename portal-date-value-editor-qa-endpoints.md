# Portal Date Value Editor QA Endpoints

This document records the concrete UI endpoints that can render `date-value-editor` so QA can verify layout and behavior consistently after changes.

## Scope

Primary component:

- `web/projects/portal/src/app/widget/date-type-editor/date-value-editor.component.ts`

Nested usage to also cover:

- `web/projects/portal/src/app/widget/date-type-editor/time-instant-value-editor.component.html`

## QA Matrix

Use this matrix for each endpoint below where it is applicable.

| Check | Notes |
| --- | --- |
| Empty value | Open the picker with no initial date |
| Prefilled value | Open the picker with an existing date |
| Disabled state | Verify spacing, icon alignment, and focus styles |
| Validation state | Verify error text does not overlap calendar/input |
| Narrow width | Check modal/dialog or pane at smaller width |
| Zoomed UI | Check at higher browser zoom |
| Long month labels | Verify header/select layout remains stable |
| Popup open | Verify calendar popup placement and clipping |
| TIME_INSTANT variant | Verify nested date editor inside time instant layouts |

## Endpoint Inventory

| Priority | Screen | Entry Path | Dialog Or Region | Usage | Files |
| --- | --- | --- | --- | --- | --- |
| P1 | Schedule Task Editor | Portal -> Schedule -> New Task or Edit task -> Action tab -> Parameters -> Add/Edit | Add Parameter dialog | Direct `DATE` usage | `web/projects/portal/src/app/portal/schedule/schedule-task-list/schedule-task-list.component.html`, `web/projects/portal/src/app/portal/schedule/schedule-task-editor/schedule-task-editor.component.html`, `web/projects/portal/src/app/portal/schedule/schedule-task-editor/parameter-table/parameter-table.component.html`, `web/projects/portal/src/app/portal/schedule/schedule-task-editor/add-parameter-dialog/add-parameter-dialog.component.html` |
| P1 | Worksheet Composer Variable | Composer toolbar -> Variable | Variable Properties | Direct `DATE` usage | `web/projects/portal/src/app/composer/gui/toolbar/composer-toolbar.component.html`, `web/projects/portal/src/app/composer/dialog/ws/variable-assembly-dialog.component.html`, `web/projects/portal/src/app/widget/dialog/variable-list-dialog/variable-value-editor/variable-value-editor.component.html` |
| P1 | Logical Model Attribute Auto Drill | Portal -> Data -> Database -> Logical Model Attribute Editor -> Edit Auto Drill -> Add/Edit Parameter | Auto Drill / Parameter dialog | Direct `DATE` usage | `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/logical-model-attribute-editor.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/data-auto-drill-dialog.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/parameter-dialog/parameter-dialog.component.html` |
| P1 | Database Query Field Auto Drill | Portal -> Data -> Database Query -> Query Field Pane -> Edit Auto Drill -> Add/Edit Parameter | Auto Drill / Parameter dialog | Direct `DATE` usage | `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-query/query-main/query-field-pane/query-fields-pane.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/data-auto-drill-dialog.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/parameter-dialog/parameter-dialog.component.html` |
| P1 | XMLA Auto Drill | Portal -> Data -> XMLA datasource -> select dimension member -> Edit Auto Drill -> Add/Edit Parameter | Auto Drill / Parameter dialog | Direct `DATE` usage | `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-xmla/datasources-xmla.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/data-auto-drill-dialog.component.html`, `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/parameter-dialog/parameter-dialog.component.html` |
| P1 | VPM Conditions | Portal -> Data -> Database VPM -> Conditions -> Add Condition or select condition -> Edit Clause | VPM Condition dialog | Direct `DATE` usage | `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-vpm/vpm-conditions/vpm-conditions.component.html`, `web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-item-pane/vpm-condition-editor/vpm-condition-editor.component.html`, `web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-item-pane/vpm-condition-editor/vpm-value-editor/vpm-value-editor.component.html` |
| P1 | SQL Query Condition Editor | SQL Query dialog -> open condition editor -> create/edit clause with date field/value | VPM Condition dialog | Direct `DATE` usage | `web/projects/portal/src/app/widget/dialog/sql-query-dialog/simple-query-pane.component.html`, `web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-item-pane/vpm-condition-editor/vpm-value-editor/vpm-value-editor.component.html` |
| P1 | Viewsheet Viewer Parameter Prompt | Open a viewsheet that prompts for parameters and includes a date variable | Enter Parameters dialog | Direct `DATE` usage through variable value editor | `web/projects/portal/src/app/vsobjects/viewer-app.component.html`, `web/projects/portal/src/app/widget/dialog/variable-input-dialog/variable-input-dialog.component.html`, `web/projects/portal/src/app/widget/dialog/variable-list-dialog/variable-value-editor/variable-value-editor.component.html` |
| P1 | Worksheet Editor Parameter Prompt | Open a worksheet that prompts for parameters and includes a date variable | Enter Parameters dialog | Direct `DATE` usage through variable value editor | `web/projects/portal/src/app/composer/gui/ws/editor/ws-pane.component.html`, `web/projects/portal/src/app/widget/dialog/variable-input-dialog/variable-input-dialog.component.html`, `web/projects/portal/src/app/widget/dialog/variable-list-dialog/variable-value-editor/variable-value-editor.component.html` |
| P1 | Viewsheet Editor Parameter Prompt | Open a viewsheet in composer that prompts for parameters and includes a date variable | Enter Parameters dialog | Direct `DATE` usage through variable value editor | `web/projects/portal/src/app/composer/gui/vs/editor/viewsheet-pane.component.html`, `web/projects/portal/src/app/widget/dialog/variable-input-dialog/variable-input-dialog.component.html`, `web/projects/portal/src/app/widget/dialog/variable-list-dialog/variable-value-editor/variable-value-editor.component.html` |
| P2 | Composer Toolbar Parameter Prompt | Use toolbar action that opens parameter collection for current worksheet/viewsheet with a date variable | Enter Parameters dialog | Direct `DATE` usage through variable value editor | `web/projects/portal/src/app/composer/gui/toolbar/composer-toolbar.component.html`, `web/projects/portal/src/app/widget/dialog/variable-input-dialog/variable-input-dialog.component.html` |
| P2 | Asset Tree Parameter Prompt | Open an asset from the repository tree that prompts for parameters and includes a date variable | Enter Parameters dialog | Direct `DATE` usage through variable value editor | `web/projects/portal/src/app/widget/asset-tree/asset-tree.component.html`, `web/projects/portal/src/app/widget/dialog/variable-input-dialog/variable-input-dialog.component.html` |
| P2 | Tabular Query Dialog | Composer -> open Tabular Query dialog -> interact with a `DATE` cell or `DATE` parameter cell | Tabular view | Direct `DATE` and parameter-driven `DATE` usage | `web/projects/portal/src/app/composer/dialog/ws/tabular-query-dialog.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-view.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-date-editor.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-query-parameter-editor.component.html` |
| P2 | Datasource Tabular Editor | Portal -> Data -> Datasource editor -> interact with a `DATE` cell or `DATE` parameter cell | Tabular view | Direct `DATE` and parameter-driven `DATE` usage | `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-datasource/datasources-datasource-editor/datasources-datasource-editor.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-view.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-date-editor.component.html`, `web/projects/portal/src/app/widget/tabular/tabular-query-parameter-editor.component.html` |
| P2 | Worksheet Advanced Conditions - Pre-aggregate | Open worksheet advanced conditions -> Pre-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/advanced-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet Advanced Conditions - Post-aggregate | Open worksheet advanced conditions -> Post-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/advanced-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet Advanced Conditions - Ranking | Open worksheet advanced conditions -> Ranking Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/advanced-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet MV Conditions - Append Pre-aggregate | Open MV condition pane -> Append Records Matching Pre-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/mv-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet MV Conditions - Append Post-aggregate | Open MV condition pane -> Append Records Matching Post-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/mv-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet MV Conditions - Delete Pre-aggregate | Open MV condition pane -> Delete Records Matching Pre-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/mv-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | Worksheet MV Conditions - Delete Post-aggregate | Open MV condition pane -> Delete Records Matching Post-aggregate Conditions -> Edit | Condition dialog | Direct `DATE` usage through condition value editor | `web/projects/portal/src/app/composer/dialog/ws/mv-condition-pane.component.html`, `web/projects/portal/src/app/widget/condition/condition-list.component.html`, `web/projects/portal/src/app/widget/condition/condition-editor.component.html`, `web/projects/portal/src/app/widget/condition/value-editor.component.html` |
| P2 | TIME_INSTANT layouts | Visit any endpoint above that uses `TIME_INSTANT` instead of `DATE` | Nested time instant editor | Nested `date-value-editor` usage | `web/projects/portal/src/app/widget/date-type-editor/time-instant-value-editor.component.html` |

## Notes By Reuse Area

### Variable value editor reuse

These screens share the same `variable-value-editor`, so layout issues may reproduce similarly across them:

- Worksheet Composer Variable Properties
- Viewsheet Viewer Enter Parameters
- Worksheet Editor Enter Parameters
- Viewsheet Editor Enter Parameters
- Composer Toolbar Parameter Prompt
- Asset Tree Parameter Prompt

Shared file:

- `web/projects/portal/src/app/widget/dialog/variable-list-dialog/variable-value-editor/variable-value-editor.component.html`

### Condition editor reuse

These screens share the same condition editor stack, so layout issues may reproduce similarly across them:

- Worksheet Advanced Conditions
- Worksheet MV Conditions

Shared files:

- `web/projects/portal/src/app/widget/condition/condition-list.component.html`
- `web/projects/portal/src/app/widget/condition/condition-editor.component.html`
- `web/projects/portal/src/app/widget/condition/value-editor.component.html`

### VPM condition reuse

These screens share the VPM condition editor stack:

- VPM Conditions
- SQL Query Condition Editor

Shared files:

- `web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-item-pane/vpm-condition-editor/vpm-condition-editor.component.html`
- `web/projects/portal/src/app/portal/dialog/vpm-condition-dialog/vpm-condition-pane/vpm-condition-item-pane/vpm-condition-editor/vpm-value-editor/vpm-value-editor.component.html`

### Auto Drill parameter reuse

These screens share the same Auto Drill parameter dialog:

- Logical Model Attribute Auto Drill
- Database Query Field Auto Drill
- XMLA Auto Drill

Shared files:

- `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/data-auto-drill-dialog.component.html`
- `web/projects/portal/src/app/portal/data/data-datasource-browser/datasources-database/database-physical-model/logical-model/attribute-editor/auto-drill-dialog/parameter-dialog/parameter-dialog.component.html`

### Tabular reuse

These screens share the same tabular editor stack:

- Tabular Query Dialog
- Datasource Tabular Editor

Shared files:

- `web/projects/portal/src/app/widget/tabular/tabular-view.component.html`
- `web/projects/portal/src/app/widget/tabular/tabular-date-editor.component.html`
- `web/projects/portal/src/app/widget/tabular/tabular-query-parameter-editor.component.html`
