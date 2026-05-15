# AI-Driven UI Testing Architecture
## Large Angular Enterprise Applications

---

# Executive Summary

This document describes the target-state UI testing architecture for large Angular enterprise applications.

It is intentionally scoped to UI testing, including component testing, deterministic end-to-end regression, runtime resilience, exploratory UI testing, and visual regression.

It does not cover backend endpoint, API, contract, or other non-UI test architecture, which should be documented separately.

The goal is a UI testing model that improves release confidence, resilience, maintainability, and AI-assisted productivity while keeping CI deterministic and sustainable at enterprise scale.

---

# Core Architectural Principle

The most important architectural principle is:

> AI discovers and assists.  
> Playwright certifies and gates.

In practice, AI is used to accelerate authoring, discovery, and runtime resilience, while deterministic Playwright assertions remain the release authority for CI/CD and business-critical UI validation.

Visual ownership principle:

- unit and E2E layers may author and maintain companion visual specs for their own states
- the visual regression layer governs selective execution, baseline storage, masking policy, and diff review for those visual specs

---

# StyleBI Implementation State

This section records the current state of StyleBI's implementation of this architecture, established through epic-70095. Generic guidance in the rest of this document applies; the decisions below are the StyleBI-specific anchors.

**Layer status:**

| Layer | Current State | Plan |
|---|---|---|
| Layer 1 — Unit tests (Vitest) | ~346 specs exist as Jest — migration to Vitest pending | Complete Layer 1 coverage first before expanding to Layers 2 and 3 |
| Layer 2 — Playwright E2E | Zero | portal2026 golden paths after Layer 1 migration; composer2026 after shell stabilizes |
| Layer 3 — Stagehand AI-driven | Zero | Set up for ~15-20 Composer workflows before composer2026 redesign begins |

**Established naming conventions (epic-70095):**

| Pattern | Layer | When to use |
|---|---|---|
| `feature.component.tl.spec.ts` | Layer 1 | Component/template tests with Angular Testing Library + Material stubs |
| `feature.service.spec.ts` | Layer 1 | Pure service or utility logic |
| `feature.service.logic.spec.ts` | Layer 1 | Logic-only slice of a Tier 3 complex service |
| `feature.service.scene.spec.ts` | Layer 1 | Integration/scene slice of a Tier 3 complex service |
| `workflow-name.spec.ts` | Layer 2 | Playwright deterministic golden-path workflow |
| `workflow-name.image.spec.ts` | Visual | Visual companion spec for a workflow state |
| `workflow-name.flow.ts` | Shared | Shared setup helper reused by functional and visual specs |

**Shared test infrastructure (epic-70095):**
- `MaterialTestingModule` — EM component test module; use in all EM `.tl.spec.ts`
- `audit-test-utils.ts` — `MatSelectStub` and `makeErrorServiceMock()` factory

**Project structure:**

```
web/projects/portal/      ← Portal + Composer Angular project
web/projects/em/          ← Enterprise Manager Angular project
web/projects/shared/      ← Shared Angular library (near-complete Layer 1 coverage)
web/projects/elements/    ← Elements library (complete)
web/tests/e2e/            ← Layer 2 Playwright specs (to be established)
web/tests/page-objects/   ← POMs (to be established)
```

---

# Recommended Architecture View

The cleanest representation is to organize the UI testing architecture by test type first, then distinguish:

- purpose
- runtime framework
- authoring tools
- authoring artifacts

This prevents mixing testing categories with supporting tools in the same tree level.

```text
UI Testing Architecture
|
+-- Permanent Regression Suite
|   +-- Unit / Component Testing
|   |   +-- Purpose
|   |   |   +-- Fast deterministic component validation
|   |   |   +-- Atomic component interaction and validation testing
|   |   |   +-- Service and data-transformation logic testing
|   |   +-- Runtime Framework
|   |   |   +-- Vitest + Angular Testing Library
|   |   +-- Authoring Tools
|   |   |   +-- Claude code analysis with Playwright MCP support for inspecting rendered UI
|   |   |   +-- Human review and enhancement
|   |   +-- Authoring Artifacts
|   |   |   +-- Vitest + Angular Testing Library `.spec.ts` files
|   |   |   +-- Mock and fixture `.ts` files
|   |   |   +-- Optional companion visual `.image.spec.ts` files for high-value UI states
|   |
|   +-- E2E UI Testing
|   |   +-- Purpose
|   |   |   +-- Release certification and CI gating for UI workflows
|   |   |   +-- Breadth-first coverage of critical golden-path UI workflows
|   |   +-- Runtime Framework
|   |   |   +-- Playwright
|   |   +-- Authoring Tools
|   |   |   +-- Claude workflow analysis with Playwright MCP support for inspecting live UI flows
|   |   |   +-- Human review and enhancement
|   |   +-- Authoring Artifacts
|   |   |   +-- Playwright `.spec.ts` files
|   |   |   +-- Playwright selectors and assertions in `.spec.ts` files
|   |   |   +-- Navigation, UI, and network success verification in `.spec.ts` files
|   |   |   +-- Reusable helper and fixture `.ts` files
|   |   |   +-- Optional companion visual `.image.spec.ts` files for selected workflow states
|   |
|   +-- Visual Regression Testing
|       +-- Purpose
|       |   +-- Detect layout, rendering, and responsive regressions
|       |   +-- Permanent but typically less frequent than unit and E2E runs
|       +-- Runtime Framework
|       |   +-- Playwright screenshot snapshots
|       |   +-- BackstopJS (optional at scale)
|       +-- Authoring Tools
|       |   +-- Feature-owned companion visual specs from unit and E2E layers
|       |   +-- Human review and baseline approval
|       +-- Authoring Artifacts
|       |   +-- Companion visual `.image.spec.ts` files
|       |   +-- Shared visual setup or flow helper `.ts` files
|       |   +-- Approved baseline snapshot images
|       |   +-- Snapshot masking rules for dynamic UI elements
|       |   +-- Visual coverage map for major screens and high-value UI surfaces
|       |   +-- Coverage-gap review for uncovered or stale visual ownership
|       |   +-- Visual execution and governance conventions
|
+-- Selective AI-Assisted Testing
|   +-- Selective Runtime Resilience for UI Areas Under Significant Change
|   |   +-- Purpose
|   |   |   +-- Reduce brittleness in high-churn or transitional UI workflows
|   |   +-- Runtime Framework
|   |   |   +-- Playwright with Stagehand for significant-change workflows
|   |   +-- Authoring Tools
|   |   |   +-- Claude workflow analysis with Playwright MCP support for inspecting live UI flows and identifying volatile interactions
|   |   |   +-- Human review and enhancement
|   |   +-- Authoring Artifacts
|   |   |   +-- Hybrid Playwright + Stagehand `.spec.ts` files
|   |   |   +-- Semantic interaction steps in `.spec.ts` files
|   |   |   +-- Selective helper and fixture `.ts` files for volatile workflows
|   |
|   +-- Exploratory / Autonomous UI Testing
|       +-- Purpose
|       |   +-- Discover risky UI flows, edge cases, and regression gaps
|       +-- Runtime Framework
|       |   +-- browser-use
|       +-- Authoring Tools
|       |   +-- Prompt-driven scenarios
|       |   +-- Optional Playwright MCP support
|       +-- Authoring Artifacts
|       |   +-- Exploration goals
|       |   +-- Candidate deterministic test ideas
|
+-- Cross-Cutting Infrastructure
    +-- CI/CD
    |   +-- GitHub Actions / GitLab / Jenkins
    +-- Reporting
    |   +-- Allure Report
    +-- Failure Analysis
    |   +-- System failures
    |   +-- Logic failures
    |   +-- Layout failures
    +-- Architecture Principle
        +-- AI discovers and assists
        +-- Playwright certifies and gates
```

---

# Operating Model

The UI testing architecture operates as two complementary modes:

- a permanent regression suite for continuous release confidence
- selective AI-assisted testing for periods of significant change, exploratory discovery, or targeted resilience needs

## Permanent Regression Suite

The permanent regression suite is the standing test baseline for the product.

It includes:
- unit / component testing
- E2E UI testing
- visual regression testing

Operational expectations:
- unit and E2E tests run continuously as the primary deterministic regression signal
- visual regression remains part of the permanent suite, but typically runs less frequently than unit and E2E
- Playwright and Vitest remain the core runtime frameworks for release confidence and CI gating
- when visual companions exist, the originating unit or E2E owner keeps them in sync with the functional spec
- the visual regression layer runs those companion specs selectively and governs baselines, masking, and diff review
- every major screen or high-value UI surface should have at least one owned visual regression entry point

## Visual Coverage Map

Visual coverage should be managed at the screen or high-value UI surface level, not by requiring every functional spec to have a companion visual spec.

The operating rule is:

- optional per functional spec
- required per major screen or high-value UI surface

Recommended practice:

- maintain a visual coverage map that lists each major screen or UI surface
- assign at least one visual owner for each entry
- allow that owner to be:
  - a component `*.image.spec.ts`
  - an E2E workflow `*.image.spec.ts`
  - a dedicated standalone visual spec when needed

Operational expectation:

- periodically review the visual coverage map to identify uncovered screens, duplicate low-value coverage, and stale visual ownership

## Selective AI-Assisted Testing

Selective AI-assisted testing is not part of the always-on regression baseline.

It is used:
- when UI areas are under significant active change
- when semantic resilience is needed for brittle workflows
- when teams want exploratory discovery of risky paths and regression gaps

This includes:
- Stagehand-based runtime resilience for significant-change workflows
- browser-use exploratory runs for discovery and candidate test generation

Operational expectations:
- selective AI-assisted runs inform and strengthen the permanent regression suite
- useful findings should be converted into permanent deterministic tests where appropriate
- Playwright remains the release-certifying authority even when AI-assisted tools are used

---

# Coverage Strategy & Boundaries

Coverage should be distributed by test granularity so each behavior is exercised at the cheapest, clearest, and most maintainable layer.

## Coverage Matrix

| Test Type | Primary Responsibility | What Belongs Here | What Should Not Expand Here |
|---|---|---|---|
| Unit / Component Testing | Logic, validation, and UI state behavior | Field validation, conditional UI states, isolated interaction behavior, service and data-transformation logic, optional component-level visual companions | Full multi-page workflow certification, repeated browser-level golden-path coverage |
| E2E UI Testing | Wiring, integration, and golden-path completion | Critical path workflows, navigation success, visible UI success, network success, composite outcome verification, optional workflow-level visual companions | Exhaustive field permutations, deep validation matrices, logic-edge-case combinatorics |
| Visual Regression Testing | Layout, presentation, and responsive guardrails | Selective execution of companion visual specs, baseline governance, masking policy, viewport policy, visual drift detection | Business logic verification, workflow-state permutations without a functional owner, detailed interaction validation |

## Boundary Rules

- E2E should prove that the integrated workflow works, not that every field permutation has been exhaustively exercised.
- Unit and component tests should carry the majority of validation-state and edge-case coverage.
- Pure logic and high-variation data rules should be tested at the service or transformation-function level whenever possible.
- Visual regression should verify presentation states and layout guardrails, not replace functional assertions.
- Companion visual specs should usually be maintained by the same owner as the originating functional spec so both stay in sync.

## Anti-Creep Guidance

- Group happy-path interactions into a single E2E workflow instead of creating one E2E test per field.
- Use batch verification for complex forms and dialogs: complete the meaningful workflow once, then verify the composite result.
- Keep dynamic visual noise out of snapshots by using masking rules where needed.
- When a new test idea appears, place it at the lowest-cost layer that can prove the behavior clearly.
