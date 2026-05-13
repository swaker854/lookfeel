# E2E Test Authoring Roadmap: AI-Augmented Playwright Suite

This roadmap provides a step-by-step guide to building a modern, workflow-first Playwright regression E2E suite for Angular and Bootstrap applications.

It follows a breadth-first strategy:

- secure core business value across the application first
- cover critical routes and successful workflows before expanding deeper
- keep E2E focused on workflow wiring rather than validation permutations

All regression tests in this roadmap are workflow-based. Test cases should represent complete user journeys or meaningful business workflows, not isolated UI interactions. Page Objects and component-level locators exist only to support workflow tests; they are not the primary test deliverable.

---

## Core Principle

Use AI at authoring time for discovery, DOM verification, and workflow scaffolding.

Use deterministic Playwright at runtime for certification.

> No runtime AI dependencies are used in this roadmap in order to maximize speed, determinism, and CI stability.

This roadmap assumes the architecture principle:

> AI discovers and assists.  
> Playwright certifies and gates.

---

## Scope & Boundaries

This roadmap is specifically for deterministic E2E workflow authoring.

What belongs here:
- golden-path workflow coverage
- critical integration wiring
- navigation success verification
- visible UI success verification
- network success verification
- batch verification of composite workflow outcomes
- identification of key workflow states that should seed visual regression coverage

What does not belong here:
- exhaustive field-permutation coverage
- deep validation-state matrices
- pure service or data-transformation edge cases
- component-isolated interaction logic
- one-test-per-field or one-test-per-widget expansion

Those concerns should be handled by unit, component, or visual testing at the appropriate layer.

Visual note:
- E2E workflows help identify meaningful screenshot states
- E2E workflow owners maintain any workflow-level companion visual specs so functional and visual cases stay in sync
- the visual regression layer selectively runs those visual specs and governs baselines, masking, and diff review

---

# Phase 1: Project Initialization

## Goal

Map business intent and define the workflow rules of engagement.

---

## 1.1 Grounding with `CLAUDE.md`

Create a `CLAUDE.md` file in the root to standardize AI output across the team.

```md
# Project Context: Playwright Regression

- Stack: Angular, Bootstrap, Playwright, TypeScript
- Locator Strategy: prioritize `page.getByRole()`, `page.getByLabel()`, and `page.getByTestId()`
- Constraint: avoid brittle CSS selectors or deep DOM nesting
- Verification: always use Playwright MCP tools to verify selectors against the live DOM before saving code
- Scope: workflow-first E2E tests, not one-test-per-component coverage
- Project Structure:
  - POMs: `tests/page-objects/`
  - Functional workflow specs: `tests/e2e/`
  - Visual workflow companion specs: `tests/e2e/visual/`
  - Visual baseline snapshots: `tests/e2e/visual/snapshots/`
```

---

## 1.2 Automated Workflow Discovery

Run this prompt in Claude Code to generate the initial `WORKFLOWS.md` file:

> "Scan the codebase, routes, services, and major components. Generate a `WORKFLOWS.md` file listing detected user journeys. Identify a set of P0 golden-path workflows that collectively visit the most important business routes and screens at least once. Focus on successful completion of tasks such as successful login, successful save, successful approval, or successful export. Ignore edge cases, validation errors, and complex field permutations for now. Categorize by business value: Critical, Support, and Admin. For the top workflows, include a proposed navigation, UI, and network success definition."

---

## 1.3 Human Refinement

Review `WORKFLOWS.md`:

- delete trivial or duplicate paths
- rename technical routes into business-language workflow names
- prioritize workflows:
  - `P0` = must pass nightly
  - `P1` = important feature flows
  - `P2` = lower-risk flows
- remove workflows that test only single-field mechanics or low-value UI behavior

---

# Phase 2: Building Workflow Support Objects

Page Objects are reusable support structures for workflows. They should not encourage one-test-per-component coverage unless a component is itself part of a business-critical workflow.

## Goal

Create a live-verified Page Object library that supports deterministic workflows.

---

## 2.1 Live-Verified POMs

For each major workflow surface, instruct Claude to:

### Analyze Code

Read relevant `.html` and `.ts` files to identify:

- important controls
- workflow entry points
- conditional branches
- relevant network calls

### Verify DOM

Use Playwright MCP to:

- open the page
- inspect the accessibility tree
- verify labels, roles, and interactability

### Generate POM

Create a class where every locator is verified against the live app before it is accepted.

### Verification Step

Claude should verify that each locator is:

- visible
- interactable
- not obscured by overlays or modal backdrops
- semantically stable enough for long-term Playwright use

---

# Phase 3: Workflow Authoring and "3-Point Success"

## Goal

Write deterministic Playwright workflows that define success across three technical layers.

---

## 3.1 The Success Definition Template

For every workflow, Claude should generate a `Success Profile` for human approval.

### Navigation Success

The final expected route or URL is reached.

Example:

```text
/orders/confirm
```

### UI Success

The expected user-visible success signal appears.

Example:

```text
Success alert contains the Order ID
```

### Network Success

The expected backend success response is observed.

Example:

```text
POST /api/orders returns 201 Created
```

---

## 3.2 Batch and Verify Rule

For E2E workflow authoring, prefer one meaningful browser pass through the task over many small browser tests.

Workflow pattern:
1. Open the workflow once.
2. Complete the meaningful set of inputs in one session.
3. Submit or commit once.
4. Verify the composite result across navigation, UI, and network layers.

Concrete example for a 10-field dialog:

1. Open the dialog one time.
2. Fill the meaningful set of fields in one session.
3. Click `Save` or `Submit` once.
4. Verify the final route, visible success state, and network success response.
5. Verify the saved composite result rather than writing one browser test per field.

What this proves:

- the workflow wiring works
- the browser integration works
- the end result of the combined inputs is accepted by the system

What this does not try to prove:

- every invalid input variant
- every edge-case permutation
- every field-specific validation branch in isolation

Do not create:
- one E2E test per field
- one E2E test per validation permutation
- deep logic matrices at the browser layer

Those belong in component or unit testing.

---

## 3.3 Authoring Prompt

Use prompts like:

> "Using the `OrderPage` POM, write the `Create New Order` workflow. Assert all three success points from the approved Success Profile. Write one deterministic Playwright test that completes the primary task using valid data. Ignore edge-case validations and complex field permutations. Verify the final API success response and the visible user confirmation."

---

## 3.4 Expected Output Shape

Each generated workflow should produce:

- one deterministic Playwright `.spec.ts` test for the golden path
- stable selectors and assertions verified against the live DOM
- reusable helper or fixture `.ts` files when setup is shared
- a human-reviewed Success Profile covering navigation, UI, and network verification
- optional shared flow helper `.ts` files when both functional and visual specs need the same setup

Naming convention:
- functional workflow: `workflow-name.spec.ts`
- visual workflow companion: `workflow-name.image.spec.ts`
- shared setup helper: `workflow-name.flow.ts`

### Shared Flow Helper Pattern

Do not make `workflow-name.image.spec.ts` import and execute the functional spec directly.

Instead, both specs should reuse the same workflow setup helper.

Example:

```ts
// order-create.flow.ts
export async function reachOrderCreateFilledState(page) {
  await page.goto('/orders/new');
  await page.getByLabel('Customer').fill('Acme');
  await page.getByRole('button', { name: 'Next' }).click();
}
```

```ts
// order-create.spec.ts
import { reachOrderCreateFilledState } from './order-create.flow';

test('create order workflow', async ({ page }) => {
  await reachOrderCreateFilledState(page);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/confirm/);
});
```

```ts
// order-create.image.spec.ts
import { reachOrderCreateFilledState } from './order-create.flow';

test('order create filled state visual', async ({ page }) => {
  await reachOrderCreateFilledState(page);
  await expect(page).toHaveScreenshot();
});
```

---

# Phase 4: Workflow-Driven Visual State Identification

## Goal

Identify meaningful workflow states that should feed the visual regression suite and detect layout issues that functional workflow tests will not catch.

---

## 4.1 Identifying Visual Baseline Candidates

Use P0 workflows to identify the most meaningful visual states for ongoing screenshot-based regression coverage.

These states should usually be implemented as companion visual specs maintained by the same workflow owner, then executed selectively by the visual regression layer.

### Companion Visual Spec Pattern

For a high-value workflow state, create two related specs:

- functional workflow spec:
  - `tests/e2e/order-create.spec.ts`
- visual companion spec:
  - `tests/e2e/visual/order-create.image.spec.ts`

Responsibility split:
- `workflow-name.spec.ts` owns functional certification
- `workflow-name.image.spec.ts` owns screenshot-based verification for selected workflow states
- `workflow-name.flow.ts` or equivalent shared helper owns common setup and state-reaching steps

Baseline storage:
- approved baseline images should be stored under `tests/e2e/visual/snapshots/`
- the visual companion spec and its owning feature team maintain those baseline images over time

Maintenance ownership:
- the E2E workflow owner maintains the functional `.spec.ts`
- the same workflow owner maintains the companion `.image.spec.ts` and shared flow helper so behavior stays in sync
- the visual regression layer governs masking rules, viewport policy, selective execution, and baseline review expectations
- humans approve baseline additions and intentional baseline changes

Run model:
- functional `.spec.ts` files run continuously
- `.image.spec.ts` files run selectively, such as nightly, scheduled, or release-candidate runs

Decision rule:
- not every workflow needs a companion visual spec
- create one when the workflow exposes high-value layout states, responsive risk, dense forms, or important presentation surfaces

Recommended states:
- landing states
- filled states
- confirmation or result states
- mobile and desktop layouts for high-value screens

Example:

```ts
await expect(page).toHaveScreenshot({
  mask: [page.locator('.dynamic-id-field')]
});
```

Use masking rules for dynamic content such as:
- dates
- IDs
- timestamps
- nondeterministic counters

---

## 4.2 Visual Regression Execution and Governance

Once meaningful workflow states are identified, the owning feature team should keep maintaining the companion visual spec while the visual regression layer governs how those specs are run and reviewed.

This execution and governance model includes:

- the selected workflow state description
- the companion `.image.spec.ts` file when one is needed
- the shared `*.flow.ts` helper when functional and visual specs share setup
- baseline snapshot images
- masking rules for dynamic content
- viewport expectations for desktop and mobile coverage

The visual regression layer is responsible for:

- periodic screenshot execution
- baseline governance and review process
- masking refinement
- layout-audit routines

---

# Phase 5: Maintenance and Nightly Analysis

## Goal

Use AI to reduce manual debugging effort while keeping runtime execution deterministic.

---

## 5.1 AI Failure Triaging

When a nightly test fails:

### Input

Provide the Playwright trace and relevant error logs to Claude Code.

### Action

Claude uses MCP to inspect the failed area and reproduce the issue on the current build when needed.

### Verdict

Claude should classify the failure as:

- system failure
- logic failure
- layout failure
- DOM change

Example:

> A framework or CSS update changed the rendered structure enough to break a locator or layout expectation.

### Self-Healing

If the failure is a verified DOM change rather than a product defect:

- Claude updates the Page Object or selector helper
- Claude proposes or submits the change for review

---

# Summary of Success Definitions

| Workflow | Navigation Success | UI Success | Network Success | Visual State Candidate |
|---|---|---|---|---|
| Guest Checkout | `/checkout/thank-you` | "Order Confirmed" text | `201 Created` | Full page |
| Profile Update | `/settings/profile` | "Profile Saved" toast | `200 OK` | Header or form region |

---

## Generated for the Engineering Team

**AI-First E2E Authoring Initiative**
