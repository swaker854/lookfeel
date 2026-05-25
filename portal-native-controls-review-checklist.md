# Portal Native Controls Review Checklist

Created: May 18, 2026

## Purpose

Provide a short, reusable review checklist for browser-native controls in `web/projects/portal/src`.

Use this checklist when:

- auditing existing native controls
- reviewing PRs that add or modify native controls
- deciding whether a control should remain native, gain a shared wrapper, or move to a richer shared component

This checklist is intentionally cross-cutting.
It does not replace the control-specific strategy notes:

- [portal-select-strategy-spec.md](E:\home\dev\github\stylebi\docs\portal-select-strategy-spec.md)
- [portal-plain-checkbox-audit.md](E:\home\dev\github\stylebi\docs\portal-plain-checkbox-audit.md)
- [portal-other-native-controls-audit.md](E:\home\dev\github\stylebi\docs\portal-other-native-controls-audit.md)

## Core Decision

For any native control under review, ask:

1. Is native behavior structurally acceptable here?
2. If yes, can the control follow an existing shared shell path?
3. If not, does it need a shared wrapper or a richer shared component?

Avoid jumping straight from “looks off” to “replace native control.”

## Visual Review

Check:

- shell sizing matches nearby controls
- spacing and alignment work in dense forms and dialogs
- border, radius, and background match the shell surface model
- hover, focus, disabled, and invalid states feel consistent with adjacent controls
- browser-owned affordances do not visually fight the shell

Watch for:

- native arrows, picker buttons, spinners, or file buttons that look disconnected from the shell
- misaligned controls inside floating-label layouts
- local utility classes compensating for inconsistent native chrome

## Behavior Review

Check:

- keyboard interaction is acceptable and predictable
- focus order and focus ring behavior are correct
- open/close or picker behavior is acceptable if the control has a browser-owned popup
- disabled and readonly behavior are semantically and visually correct
- validation and error display work with the existing form pattern

Watch for:

- controls that visually look closed/open incorrectly
- browser behavior that cannot be reconciled with the intended product interaction
- repeated local event hacks around native behavior

## Accessibility Review

Check:

- labels are correctly associated
- grouped checkboxes/radios use sensible structure
- help text and validation feedback are correctly referenced
- hit area is large enough for checkbox/radio/toggle-like controls
- keyboard-only use remains viable

Watch for:

- missing labels
- placeholder-only identification
- custom wrappers that hide native semantics without replacing them properly

## Browser-Owned Chrome Review

Check whether the control exposes browser-specific subcontrols such as:

- select arrows
- number spinners
- date/time picker affordances
- file input buttons
- search clear buttons

Ask:

- is this chrome acceptable as-is?
- should it be normalized through a shared shell wrapper?
- is the browser-owned behavior structurally insufficient for product needs?

## Layout Context Review

Review the control in context:

- normal dialog forms
- dense authoring/property panes
- tables or inline editors
- list/tree/browser rows
- mobile or narrow layouts where relevant

Watch for:

- controls that are fine in ordinary forms but break in dense editors
- controls whose native width assumptions collapse in flex layouts

## Consistency Review

Ask:

- is there already a shared pattern in the repo for this control family?
- is this screen inventing a local variant of something the shell already owns?
- are repeated local fixes appearing across multiple files?

If the answer to the last question is yes, stop adding one-off fixes and move the issue into shared strategy work.

## Decision Outcomes

Use one of these outcomes after review:

### 1. Keep Native As-Is

Use when:

- native behavior is acceptable
- shell styling already works
- no repeated local drift is emerging

### 2. Keep Native, Move To Shared Shell Path

Use when:

- the control is ordinary
- a shared class or markup path already exists
- the current issue is mainly missing markup consistency

Examples:

- checkbox/radio missing `form-check-input`
- ordinary select needing the approved shared native shell treatment

### 3. Keep Native, Add Shared Wrapper Or Policy

Use when:

- native behavior is acceptable
- browser-owned chrome needs normalization
- repeated local fixes are starting to appear

Examples:

- file inputs
- number input spinner policy
- date/time-family wrapper decisions

### 4. Replace With Shared Richer Control

Use when:

- native behavior is structurally insufficient
- shell consistency or UX requirements cannot be met cleanly with native behavior
- the need is broad enough to justify shared work instead of local exceptions

Examples:

- richer select/combobox scenarios

## PR Review Guardrails

When reviewing new code:

- prefer existing shared native-control patterns first
- flag new one-off styling around native controls unless clearly justified
- ask whether the issue belongs in shared strategy rather than local SCSS
- document exceptions when a custom treatment is necessary

## Quick Checklist

Before approving a native-control change, confirm:

- visual shell consistency is acceptable
- behavior is acceptable
- accessibility is acceptable
- the control follows an existing shared path where possible
- the change does not create another one-off pattern we will have to unwind later
