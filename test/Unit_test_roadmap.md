# Unit Test Authoring Roadmap: AI-Assisted Vitest and Angular Testing Library

This roadmap provides a step-by-step guide to building a modern, fast, and maintainable unit and component test suite for Angular applications.

It follows a depth-first strategy:

- verify logic and UI state at the lowest-cost layer first
- keep validation and edge-case coverage out of browser-heavy E2E where possible
- adapt the authoring workflow based on component complexity

This roadmap covers two main authoring shapes:

- simple and medium components, where AI-assisted generation can be highly productive
- complex components, where AI can still accelerate work but the test design must be more deliberate

All tests in this roadmap are isolation-first. They should prove logic, validation, local interaction behavior, and component state changes without booting the full application.

---

## Core Principle

Use AI at authoring time for source analysis, rendered-state verification, and scaffold generation.

Use deterministic Vitest and Angular Testing Library at runtime for fast and stable certification.

This roadmap assumes the architecture principle:

> AI discovers and assists.  
> Deterministic test frameworks certify and gate.

In practice:

- Claude and source reading identify dependencies, logic branches, and assertion targets
- Playwright MCP helps inspect real rendered DOM and interaction behavior
- humans refine the output and decide the final test boundaries

---

## StyleBI-Specific Conventions

The following conventions are established for the StyleBI project and take precedence over generic examples in this roadmap.

**Project structure** — Angular projects live under `web/projects/` in the stylebi repo:

| Project | Path | Notes |
|---|---|---|
| Portal + Composer | `web/projects/portal/` | Composer lives at `portal/src/app/composer/`; shared VS objects at `portal/src/app/vsobjects/` |
| Enterprise Manager | `web/projects/em/` | |
| Shared | `web/projects/shared/` | |
| Elements | `web/projects/elements/` | Near-complete coverage |

**Established file naming (from epic-70095):**

| Pattern | When to use |
|---|---|
| `feature.component.tl.spec.ts` | Component/template tests using Angular Testing Library + Material stubs |
| `feature.service.spec.ts` | Pure service or utility logic tests |
| `feature.service.logic.spec.ts` | Logic-only slice of a Tier 3 complex service |
| `feature.service.scene.spec.ts` | Integration/scene slice of a Tier 3 complex service |

**Shared test infrastructure (from epic-70095):**
- `MaterialTestingModule` — central Material module re-export for EM component tests; use in every EM `.tl.spec.ts` instead of listing Material imports manually
- `audit-test-utils.ts` — provides `MatSelectStub` (ControlValueAccessor stub) and `makeErrorServiceMock()` factory

**Service extraction pattern** — HTTP logic must be extracted from components into dedicated services before writing component tests (e.g. `ScheduleTaskEditorDataService` extracted from `ScheduleTaskEditorPageComponent`). The service `spec.ts` owns HTTP logic; the `.tl.spec.ts` owns component template behavior. Use `TimerService` abstraction for any component with `setTimeout`-based behavior.

**Test runner** — migrating from Jest 28 to Vitest. All new specs must be written for Vitest (`vi.fn()`, `vi.spyOn()`, `vi.mock()`). See the epic-70095 test strategy for the migration plan.

---

## Scope & Boundaries

This roadmap is specifically for unit, service, and isolated component test authoring.

What belongs here:

- field validation logic
- conditional UI states
- component interaction behavior in isolation
- form-state transitions
- emitted events and callback wiring at component boundaries
- service and data-transformation logic
- high-variation edge cases and permutations

What does not belong here:

- full multi-page workflow certification
- route-level navigation success
- network integration certification across the live app
- repeated browser-driven golden-path coverage

Those concerns should be handled by E2E or visual regression at the appropriate layer.

Visual note:

- component owners may create optional companion visual specs for high-value component states
- component owners should maintain those visual companions in sync with the functional component spec
- the visual regression layer selectively runs those visual specs and governs baselines, masking, and diff review

---

## Coverage Shapes

Unit and component authoring should distinguish between these common shapes:

- atomic component interaction tests
- isolated validation-state tests
- parent or output contract tests
- service and transformation-function tests

These shapes often coexist for one feature, but they should remain separate in the test suite instead of being collapsed into one oversized browser-style test.

### State-Based Parent Impact

When a child component or dialog produces a resulting object that affects a parent surface, you do not always need a full workflow test to prove the impact.

Recommended pattern:

1. Prove that the child component outputs the correct object or emitted state.
2. Inject or construct that resulting state in the parent or host test.
3. Assert that the parent renders or reacts to that state correctly.

This is especially useful when:

- the child has already been proven to emit the right payload
- the parent mainly consumes and displays that payload
- a full end-to-end workflow would be slower and add little additional confidence

The underlying rule is:

- prove child output correctness
- prove parent rendering correctness
- avoid redundant browser-level integration when those two contracts are already covered clearly

---

# Phase 1: Project Initialization

## Goal

Define the unit-test authoring rules and standardize AI output across the team.

---

## 1.1 Grounding with `CLAUDE.md`

Create or extend a root `CLAUDE.md` file to standardize unit/component test generation.

```md
# Project Context: Unit and Component Testing

- Stack: Angular, TypeScript, Vitest, Angular Testing Library
- Scope: isolated component tests, service tests, and transformation-function tests
- Runtime rule: no full-app navigation for component testing
- Authoring method: combine source analysis with Playwright MCP rendered-state verification when useful
- Assertion rule: prefer semantic queries and observable state changes over brittle DOM structure checks
- Project Structure:
  - Component specs: co-located `*.spec.ts`
  - Optional component visual companions: co-located `*.image.spec.ts`
  - Shared component state helpers: co-located `*.testing.ts` or `*.flow.ts`
  - Shared test helpers: `testing/` or local helper `.ts` files
  - Mock and fixture files: local or shared `.ts` modules
```

---

## 1.2 Complexity Classification

Before generating tests, classify the target into one of these categories:

### Tier 1: Simple

Typical characteristics:

- few injected services
- few inputs and outputs
- straightforward form or display logic
- little or no asynchronous coordination
- little or no DOM-manipulation code

Examples:

- small editors
- simple option panes
- display-only components with lightweight interaction

### Tier 2: Medium

Typical characteristics:

- multiple injected services
- moderate input and output combinations
- reactive form state
- conditional rendering
- some async behavior

Examples:

- selection panes
- tree-driven editors
- moderate configuration dialogs

### Tier 3: Complex

Typical characteristics:

- many injected services
- heavy reactive form logic
- multiple interaction modes or tabs
- branching UI states
- date, time, timezone, or recurrence rules
- complex event choreography
- large templates with many conditional sections

Examples:

- scheduler editors
- wizard-like flows
- large condition or action builders

This classification should guide how much of the test can be generated quickly and how much needs deliberate design.

---

# Phase 2: Authoring Method

## Goal

Use the right combination of source analysis and rendered-state verification to generate accurate tests.

---

## 2.1 The Combined Method

Neither source reading nor rendered-state inspection is sufficient on its own for high-quality component tests.

Use both:

- source analysis for:
  - DI and provider setup
  - business logic and assertions
  - async flows and observables
  - event and output contracts
- Playwright MCP for:
  - rendered labels and semantic queries
  - conditional UI visibility
  - realistic interaction sequences
  - accessibility-tree confirmation

Use human review for:

- final test boundaries
- test naming
- deciding what belongs in component tests versus service tests
- eliminating redundant cases

---

## 2.2 Simple and Medium Components

For Tier 1 and most Tier 2 components, the primary workflow is:

1. Read the component `.ts` and `.html`.
2. Identify injected services, form controls, and outputs.
3. Use Playwright MCP if needed to confirm rendered labels, roles, and interaction flow.
4. Generate a co-located `*.spec.ts`.
5. Extract reusable mocks or fixtures only if more than one spec needs them.

Expected output:

- one co-located component `*.spec.ts`
- local mock and fixture `.ts` files as needed
- focused tests for:
  - render
  - happy-path interaction
  - validation states
  - outputs or callbacks

Preferred pattern:

- small number of high-signal tests
- semantic queries
- no full-app navigation
- no one-spec-per-field explosion

---

## 2.3 Complex Components

For Tier 3 components, do not start by asking AI to generate one giant spec that tries to cover everything.

Instead:

1. Map the component into testable slices.
2. Separate pure logic from UI state behavior.
3. Generate tests per slice.
4. Move high-variation rules into service or transformation tests where possible.
5. Keep each component test focused on one interaction family or state family.

Typical slice categories:

- mode switching
- conditional field visibility
- validation rules
- date and time calculations
- emitted events and saved payload shape
- service-driven initialization

This is where human test design matters most. AI should accelerate setup and assertions, but people should decide the slice boundaries.

---

# Output Patterns

## Goal

Define what files should be created for different kinds of unit/component targets.

---

## 3.1 Component Spec Pattern

Default pattern:

- component source:
  - `feature.component.ts`
- component test:
  - `feature.component.spec.ts`

Possible companion files:

- `feature.fixture.ts`
- `feature.mock.ts`
- `feature.testing.ts`

Use local files first. Promote to shared helpers only when reuse becomes real.

Visual companion pattern:

- functional component spec:
  - `feature.component.spec.ts`
- optional visual companion spec:
  - `feature.component.image.spec.ts`
- shared state/setup helper:
  - `feature.component.testing.ts`

---

## 3.2 Service and Transformation Pattern

If the hard part of the feature is data logic, scheduling math, or payload construction, create direct tests for that logic instead of forcing the browser-like component test to carry the burden.

Pattern:

- service or utility source:
  - `schedule-math.service.ts`
- direct test:
  - `schedule-math.service.spec.ts`

These tests should own:

- high-variation data permutations
- edge cases
- calendar and date math
- string or payload transformations
- deterministic logic that does not require template rendering

---

## 3.3 Mock and Fixture Ownership

Store mocks and fixtures near the owning component or service unless there is clear reuse.

Ownership model:

- the unit/component test owner maintains the `*.spec.ts`
- the same owner maintains any optional `*.image.spec.ts` companion
- shared setup helpers such as `*.testing.ts` remain owned by the same feature
- local helper, mock, and fixture `.ts` files are maintained with the owning feature
- human reviewers approve major mock-shape changes that affect multiple tests

Do not create a giant shared mock library too early. It usually increases coupling and slows maintenance.

---

# Simple vs. Complex Authoring Playbooks

## Goal

Make the authoring workflow concrete for both easy and difficult component classes.

---

## 4.1 Simple Component Playbook

Use this for Tier 1 and straightforward Tier 2 targets.

### Atomic and Isolated Field Logic

When a single field has meaningful validation or formatting behavior, test that field in isolation inside the component rather than proving it indirectly through a larger workflow.

Recommended pattern:

- **Strategy:** Render the Dialog component in **Isolation**.
- **Mocking:** Pass "Spy" functions into the Dialog props.
- **Verification:** - Input invalid data into a Field-> Assert the "Error" class appears.
    - Input valid data into a Field -> Assert the "Spy" function was called with the correct value.
- **Outcome:** We exercise 100% of the field permutations in milliseconds.

Use this for things like:

- required-field errors
- regex or formatting behavior
- conditional enablement
- input-to-output mapping for one field or one small control group

This pattern is intentionally cheaper and clearer than proving the same logic through a full workflow or through repeated browser-style interactions.

Authoring prompt pattern:

> "Read `feature.component.ts` and `feature.component.html`. Generate a Vitest and Angular Testing Library spec that covers render, primary user interaction, validation errors, and output events. Use semantic queries. Keep the test isolated and do not boot the full app. Extract only minimal mocks needed for the component."

Expected tests:

- renders expected labels and controls
- reacts to primary user interaction
- shows or hides validation errors correctly
- emits the expected output or callback payload

Optional visual companion:

- create `feature.component.image.spec.ts` only when the component has meaningful presentation states worth snapshotting
- keep the component visual companion focused on a few high-value states, not every interaction branch

Shared helper pattern:

```ts
// feature.component.testing.ts
export async function renderFilledFeature() {
  const result = await render(FeatureComponent);
  await userEvent.type(screen.getByLabelText(/name/i), 'Acme');
  return result;
}
```

```ts
// feature.component.spec.ts
import { renderFilledFeature } from './feature.component.testing';

it('submits the form', async () => {
  await renderFilledFeature();
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(screen.getByText(/saved/i)).toBeVisible();
});
```

```ts
// feature.component.image.spec.ts
import { renderFilledFeature } from './feature.component.testing';

it('filled state visual', async () => {
  const { fixture } = await renderFilledFeature();
  expect(fixture.nativeElement).toMatchSnapshot();
});
```

Anti-creep rules:

- do not create one test per field when one interaction sequence proves the behavior clearly
- do not validate every edge case in the rendered component if a service-level test is cheaper

---

## 4.2 Complex Component Playbook

Use this for Tier 3 targets or unusually stateful Tier 2 targets.

Real example:

- sibling project: `stylebi-visual_BI_tool`
- schedule area:
  - [task-condition-pane.component.ts](E:/home/dev/github/stylebi-visual_BI_tool/stylebi/web/projects/portal/src/app/portal/schedule/schedule-task-editor/conditions/task-condition-pane.component.ts)
  - [task-condition-pane.component.html](E:/home/dev/github/stylebi-visual_BI_tool/stylebi/web/projects/portal/src/app/portal/schedule/schedule-task-editor/conditions/task-condition-pane.component.html)

Why this is complex:

- many inputs and outputs
- reactive forms plus conditional template branches
- date, time, and timezone behavior
- recurrence modes such as daily, weekly, monthly, hourly, custom, run once, and chained
- service dependencies such as task-name and timezone services
- multiple validation surfaces and list-management interactions

Recommended authoring decomposition:

### Slice A: Mode and branch switching

Test that changing condition type or recurrence mode reveals the correct UI branch and hides irrelevant controls.

### Slice B: Validation behavior

Test numeric intervals, required values, weekday selection, and invalid-state messages.

### Slice C: List and selection state

Test add, remove, select-all, and deselect-all style interactions for weekday or condition lists.

### Slice D: Date, time, and timezone behavior

Move as much calculation-heavy logic as possible into direct service or helper tests.

### Slice E: Save payload and emitted state

Test that the component emits or mutates the expected model shape after valid edits.

Authoring prompt pattern:

> "Read the Schedule condition pane source and template. Do not generate one giant spec. First identify 4-6 logical test slices such as mode switching, validation, list state, timezone handling, and emitted model updates. For each slice, generate focused Vitest and Angular Testing Library tests with the minimum mocks required. Move calculation-heavy date and recurrence rules into direct logic tests where possible."

Expected output:

- one or more focused `*.spec.ts` files for major state families when needed
- optional focused `*.image.spec.ts` companions for important visual states
- shared `*.testing.ts` helpers for repeated render and setup logic
- extracted fixture and helper `.ts` files for schedule models and form setup
- direct service or utility specs for recurrence and transformation logic

Anti-creep rules:

- do not try to prove every recurrence permutation through template interaction alone
- do not use the rendered component to test large mathematical matrices
- do not collapse all modes into one giant unreadable spec
- do not create visual companions for every branch by default; reserve them for high-value states

---

# Maintenance and Failure Analysis

## Goal

Keep the suite fast, isolated, and maintainable as components evolve.

---

## 5.1 Failure Classification

When a unit or component test fails, classify the issue as:

- provider or setup failure
- logic failure
- validation failure
- UI-state regression
- fixture or mock drift

This classification helps decide whether to:

- fix the component
- fix the test setup
- move logic into a lower-cost service test
- split an oversized spec into smaller slices

---

## 5.2 Refactoring Rules

As the suite grows:

- split oversized specs by state family
- extract repeated setup into local testing helpers
- move repeated complex fixtures into local fixture files
- move calculation-heavy assertions into service or utility tests

Do not:

- keep expanding browser-like component specs when direct logic tests are clearer
- centralize every mock too early
- preserve low-signal tests that duplicate other layers

---

# Summary Matrix

| Requirement | Preferred Layer | Typical File Shape |
|---|---|---|
| Field validation | Component test | `component.spec.ts` |
| Conditional UI state | Component test | `component.spec.ts` |
| Output event or callback | Component test | `component.spec.ts` |
| Date or recurrence permutations | Service or utility test | `service.spec.ts` |
| Payload transformation | Service or utility test | `service.spec.ts` |
| Large stateful scheduler branch behavior | Sliced component tests plus direct logic tests | `component.spec.ts` + helper specs |

---

## Generated for the Engineering Team

**AI-Assisted Unit and Component Authoring Initiative**
