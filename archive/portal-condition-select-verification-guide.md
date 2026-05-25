# Portal Condition Select Verification Guide

Created: May 20, 2026

## Purpose

This note explains how to find and verify the condition-area selects that were converted to the shared `custom-select` in portal.

It is focused on the current `web/projects/portal/src/app/widget/condition` sweep.

## Best Place To Test

The most practical place to verify these controls is the Composer worksheet `Condition` dialog.

Recommended path:

1. Open a worksheet assembly in Composer.
2. Open its `Condition` dialog.
3. Start on the `Conditions` tab.
4. Leave `Advanced Conditions` unchecked unless a step below explicitly says otherwise.

This dialog hosts the shared `condition-pane` and `condition-editor`, so several converted controls can be exercised from one screen.

## Important Non-Goals

These controls in the main condition row are still native and are not part of the converted set:

- the `is` / `is not` dropdown
- the main operator dropdown such as `equal to`, `top`, or `bottom`

If those still look native, that is expected.

## Converted Controls

### 1. Boolean Value Selector

What changed:

- the `True / False` selector in `boolean-value-editor`

How to find it:

1. In the Composer `Condition` dialog, stay on the simple `Conditions` view.
2. Pick a boolean field.
3. Choose the `equal to` operator.
4. Look at the value editor.

What you should see:

- a shared `custom-select` for `False` and `True`

Code reference:

- [boolean-value-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/boolean-value-editor.component.html:18)

### 2. Date Range Selector

What changed:

- the date-range selector in `date-in-value-editor`

How to find it:

1. In the Composer `Condition` dialog, stay on the simple `Conditions` view.
2. Pick a date or timestamp field.
3. Change the operator to `Date In`.
4. Look at the value editor.

What you should see:

- a shared `custom-select` listing date ranges

Code reference:

- [date-in-value-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/date-in-value-editor.component.html:18)

### 3. Variable Name Picker

What changed:

- the `Variable Name` picker in `variable-editor`

How to find it:

1. In the Composer `Condition` dialog, pick a field that supports a regular value comparison.
2. Use an operator such as `equal to` or `one of`.
3. In the value editor, click the value-type button at the far right.
4. Switch the value type to `Variable`.

What you should see:

- a text input plus a shared `custom-select` picker for available variables

Notes:

- if no variables are available, the picker may not render as a useful dropdown

Code reference:

- [variable-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/variable-editor.component.html:20)

### 4. Session Data Selector

What changed:

- the session-data selector in `session-data-editor`

How to find it:

1. In the Composer `Condition` dialog, stay on the `Conditions` tab.
2. Pick a string field.
3. Use the `equal to` or `one of` operator.
4. In the value editor, click the value-type button at the far right.
5. Switch the value type to `Session Data`.

What you should see:

- a shared `custom-select` for session-data choices

Important restrictions:

- `Session Data` only appears for string fields
- `Session Data` only appears for `equal to` or `one of`
- it is not available in every condition provider path

Code reference:

- [session-data-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/session-data-editor.component.html:18)

### 5. Top N / Bottom N Aggregate Field Selector

What changed:

- the nested `calculationOf` dropdown inside `top-n-editor`

What did not change:

- the main operator dropdown used to choose `Top N` or `Bottom N` is still native

How to find it:

1. In the Composer `Condition` dialog, stay on the simple `Conditions` view.
2. Pick a field that allows the `Top N` or `Bottom N` operator.
3. Change the operator to `Top N` or `Bottom N`.
4. Look below the `N` editor for the text `calculationOf`.

What you should see when it is available:

- a shared `custom-select` after `calculationOf`

Important restrictions:

- this nested dropdown only appears when the selected field is treated as a group field
- aggregate fields must also be available in the current condition context
- a plain measure like `Discount` may show the `Top N` editor but still hide `calculationOf`

Code references:

- [top-n-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/top-n-editor.component.html:23)
- [top-n-editor.component.ts](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/top-n-editor.component.ts:69)

### 6. Subquery Dialog Selectors

What changed:

- the `Subquery` dropdown
- the `In column` dropdown
- the `Subquery column` dropdown
- the `Current table column` dropdown

How to find it:

1. In the Composer `Condition` dialog, pick a field that supports a normal comparison operator.
2. Use an operator such as `equal to` or `one of`.
3. In the value editor, click the value-type button at the far right.
4. Switch the value type to `Subquery`.
5. Open the subquery editor.

What you should see:

- four shared `custom-select` controls in the subquery flow

Notes:

- subquery value type is not offered for every operator
- `Date In` does not expose the subquery value type

Code reference:

- [subquery-dialog.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/subquery-dialog.component.html:28)

## Quick Verification Checklist

Use this checklist when doing a fast sweep:

- Boolean field + `equal to` -> updated `True / False` selector
- Date field + `Date In` -> updated date-range selector
- String field + value type `Variable` -> updated variable picker
- String field + value type `Session Data` -> updated session-data selector
- Eligible field + operator `Top N` or `Bottom N` -> updated nested `calculationOf` selector when visible
- Supported field + value type `Subquery` -> updated subquery dialog selectors

## Common Confusion Points

- Seeing a native `is` dropdown is expected.
- Seeing a native operator dropdown is expected.
- Seeing `Top N` without `calculationOf` can still be correct.
- Not every field and operator combination exposes every converted selector.
- `Session Data` and `Subquery` are reached through the value-type button, not from the main operator dropdown.

## Related Files

- [portal-select-strategy-spec.md](/E:/home/dev/github/stylebi/docs/portal-select-strategy-spec.md:1)
- [condition-item-pane.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/condition-item-pane.component.html:18)
- [condition-editor.component.html](/E:/home/dev/github/stylebi/web/projects/portal/src/app/widget/condition/condition-editor.component.html:18)
