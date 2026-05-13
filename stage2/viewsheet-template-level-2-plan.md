# Viewsheet Template Plan

## Summary

This document captures the current decision for adding business-oriented viewsheet templates to StyleBI.

In general product language, users may say "dashboard", but in this feature we are specifically talking about reusable `viewsheet` templates.

The selected direction is **Level 2: guided template field mapping**.

## Product Goal

Provide a set of starter viewsheet templates for business areas such as:

- Sales
- Marketing
- Operations
- Finance
- Customer Support

The goal is to help users start from a strong example and adapt it to their own data without manually rebuilding the viewsheet from scratch.

## Decision

We will not try to make templates automatically work against arbitrary customer schemas on first release.

Instead, the product will:

1. Let the user choose a viewsheet template.
2. Create a personal copy of the template and its dependent assets as needed.
3. Launch a guided adaptation flow.
4. Ask the user to map their own fields to template-defined semantic slots.
5. Apply the mappings in bulk to the copied worksheet/viewsheet bindings.
6. Open the copied viewsheet in the editor for final refinement.

This is the chosen **Level 2** approach.

## Why Level 2

Level 2 gives a much better experience than a raw duplicate, but avoids the complexity of fully automatic schema inference.

It is a good middle ground because it:

- feels guided rather than manual
- is more practical than "copy and fix everything yourself"
- avoids the risk of unreliable automatic guessing
- fits the current codebase better than a fully intelligent remap system

## User Experience

### Template Selection

The user starts from a template gallery or picker and chooses a template such as:

- Sales Pipeline
- Revenue Overview
- Marketing Funnel
- Campaign Performance
- Operations KPI Board

Each template should show:

- name
- category
- short description
- thumbnail or preview image
- expected fields

### Copy Step

After selection, the system creates a user-owned copy of:

- the viewsheet template
- any dependent worksheet required by the template
- any supporting assets that should be user-editable

### Adapt Template Flow

Immediately after copy, the user is taken into an adaptation wizard instead of a blank or broken editor state.

The wizard should ask the user to:

1. Choose the datasource, model, or worksheet context.
2. Map their own fields to required template slots.
3. Review optional mappings.
4. Confirm the result.
5. Open the copied viewsheet in the editor.

### Example

A sales template may require:

- `date`
- `revenue`
- `region`
- `sales_rep`
- `pipeline_stage`

The user maps their own fields such as:

- `order_date -> date`
- `net_sales -> revenue`
- `territory -> region`
- `owner_name -> sales_rep`
- `opportunity_stage -> pipeline_stage`

After mapping, the copied asset is updated so charts, tables, and KPIs use the user-selected fields.

## Template Metadata

Each template should carry metadata beyond the viewsheet itself.

Suggested metadata:

- `id`
- `name`
- `category`
- `description`
- `thumbnail`
- `tags`
- `templateAssetId`
- `dependentAssetIds`
- `requiredSlots`
- `optionalSlots`
- `version`

### Required Slot Shape

Each required slot should define the semantic purpose of a field, not just a hardcoded source column.

Suggested fields per slot:

- `slotId`
- `label`
- `description`
- `dataType`
- `aggregation`
- `required`
- `allowedRoles`
- `sampleBinding`

Example:

```json
{
  "slotId": "revenue",
  "label": "Revenue",
  "description": "Primary sales amount measure",
  "dataType": "number",
  "aggregation": "sum",
  "required": true,
  "allowedRoles": ["measure"],
  "sampleBinding": "Orders.Total"
}
```

## Authoring Expectations for Templates

Templates should be intentionally designed for rebinding.

That means:

- keep dependency chains as simple as possible
- avoid deeply hardcoded field names
- centralize calculations where possible
- prefer a small, stable set of semantic slots
- avoid unnecessary one-off logic tied only to sample data

Templates that are too tightly coupled to example schemas will be hard to adapt cleanly.

## Functional Scope for Version 1

Version 1 should include:

- curated template set by business area
- template gallery or picker
- copy template into user space
- guided field mapping flow
- bulk application of mappings
- open copied viewsheet in editor

Version 1 should not require:

- full automatic schema understanding
- AI-only mapping logic
- perfect migration of arbitrary complex examples
- zero-touch conversion from any example to any datasource

## Implementation Shape

### Frontend

Frontend work will likely include:

- template picker UI
- template metadata model
- adaptation wizard UI
- field slot mapping UI
- post-copy open-in-editor flow

Likely integration points:

- portal create flows
- composer launch flow
- viewsheet creation entry points

### Backend

Backend work will likely include:

- API to list available templates
- API to create a copy of a template into user space
- API to return required and optional mapping slots
- API to apply field mappings to copied assets
- logic to clone dependent worksheet/viewsheet assets safely

### Asset Packaging

Templates should be shippable as packaged assets, similar to existing example content.

This is useful because the repository already supports asset import/export packaging, and the product already ships example assets in archive form.

## Data Binding Strategy

The core behavior of Level 2 is:

1. Template defines semantic slots.
2. User maps their schema to those slots.
3. System rewrites copied bindings in the duplicated assets.

This is better than requiring the user to manually repair many charts one by one.

The system should support:

- required field mappings
- optional field mappings
- validation for incompatible field types
- warnings for unresolved optional content

## Error Handling

The adaptation flow should fail gracefully.

If a mapping is missing or invalid:

- explain which slot is unresolved
- explain expected type or role
- allow skipping optional slots
- block completion only for required slots

If a template contains assets that cannot be fully rebound:

- surface a review screen
- identify affected objects
- still allow opening in editor when reasonable

## Recommended Rollout

### Phase 1

- Ship curated template pack.
- Support template selection and copying.
- Support guided mapping for a limited number of well-authored templates.

### Phase 2

- Add better mapping suggestions.
- Add thumbnails, search, and category browsing.
- Improve validation and preview before commit.

### Phase 3

- Add smarter auto-suggestions based on field names and types.
- Expand template library.
- Consider assisted remapping for more complex templates.

## Non-Goals for Initial Release

The first release should not try to solve:

- arbitrary schema inference
- full automatic semantic understanding
- universal rebinding of highly customized example assets
- fully invisible adaptation with no user input

## Recommendation

Proceed with Level 2 as the initial product design.

It provides a strong template experience with reasonable implementation cost and aligns with the current product architecture better than a fully automatic solution.

The key to success will be:

- good template curation
- template metadata with semantic slots
- a clear mapping wizard
- deliberate template authoring for reusability
