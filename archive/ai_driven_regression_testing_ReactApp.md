# Comprehensive Engineering Roadmap: AI-Augmented Playwright Suite (React Edition)

This roadmap provides a step-by-step guide to building a modern, self-healing, and visual-first regression suite for React applications.

---

# Core Principle

Use AI (Claude Code + MCP) for verification at authoring time and visual baselines for layout stability.

---

# Phase 1: Project Initialization & Standards (Day 1)

## Goal

Define the React-specific standards and set the "Rules of Engagement."

---

## 1.1 Grounding with `CLAUDE.md`

Create a `CLAUDE.md` file in the root to standardize AI output for the React ecosystem.

```md
# Project Context: React Regression Suite

- **Stack:** React (Vite/Next.js), Tailwind/MUI/Styled Components.

- **Locator Strategy:**
  Prioritize `page.getByRole()` and `page.getByLabel()`
  (Accessibility-first).

  Use `data-testid` only when ARIA roles are insufficient.

- **Constraint:**
  Avoid brittle class-based selectors
  (especially generated Tailwind hashes).

- **Verification:**
  Always use Playwright MCP tools
  (`browser_click`, `browser_snapshot`)
  to verify every selector against the live DOM
  before saving code.

- **Project Structure:**
  - POMs: `tests/page-objects/`
  - Specs: `tests/e2e/`
```

---

# Phase 2: Workflow Discovery & Human Curation (Day 2)

## Goal

Map the business intent and prioritize what to test.

---

## 2.1 Automated Discovery

Run this prompt in Claude Code to generate the initial `WORKFLOWS.md` file:

> "Scan the React codebase. Look at React Router configs and custom hooks (e.g., `/hooks` folder). Generate a `WORKFLOWS.md` file listing all detected user journeys. Categorize by business value. For each journey, identify which custom hooks manage the state and propose a 'Success Definition' table."

---

## 2.2 Human Refinement (The "Name and Aim" Step)

Review `WORKFLOWS.md`:

- Delete technical noise or redundant flows
- Rename technical hook names to business terms
- Prioritize workflows

### Example Rename

```text
useSubmitPayment
→ Premium Subscription Checkout
```

---

### Priority Levels

| Priority | Meaning |
|---|---|
| P0 | Critical Path |
| P1 | Feature |
| P2 | Maintenance |

---

# Phase 3: Building the Page Object Library (Weeks 1–2)

## Goal

Create verified POMs that understand React's hydrated state.

---

## 3.1 Live-Verified POMs

For each major React component, instruct Claude to:

---

### Analyze Code

Read:

- `.tsx` files
- associated custom hooks

---

### Verify Hydration

Using MCP, Claude verifies that elements are:

- Present in the DOM
- Interactive
- Hydrated with React event listeners

---

### Generate POM

Create a class where methods are pre-tested via MCP tools.

---

### Example Verification

Claude verifies that:

- A modal rendered via a React Portal
- Is detectable in the global DOM
- Before finalizing the selector

---

# Phase 4: Workflow Authoring & "3-Point Success" (Weeks 3–5)

## Goal

Assert success using React's internal logic and external UI.

---

## 4.1 The Success Definition Profile

For every workflow, Claude must generate a **Success Profile** for human approval.

---

### Navigation Success

React Router has pushed the new state/URL.

---

### UI Success

The UI reflects the data returned by the hook.

Example:

```text
"Success" toast appears
```

---

### Network Success

The API payload (`POST`/`PUT`) matches what the React app expects.

---

## 4.2 Execution

### Prompt

> "Using the `CartPage` POM, write the 'Checkout' workflow. Ensure the test asserts all 3 success points identified in our Success Profile."

---

# Phase 5: Visual Baseline & Layout Guardrails (Weeks 6–7)

## Goal

Catch layout shifts in dynamic React components and responsive breakpoints.

---

## 5.1 Establishing Visual Baselines

Add visual snapshots to key states in P0 workflows.

```ts
// Masking dynamic data (Dates/IDs) rendered by React
await expect(page).toHaveScreenshot({
  mask: [page.locator('.dynamic-id-field')]
});
```

---

## 5.2 Responsive Audits

Since React apps are often mobile-first:

- Generate snapshots for:
  - Mobile
  - Desktop

---

### Layout Scans

Periodically ask Claude to perform a "Layout Scan" via MCP to detect:

- Overlapping elements
- CSS-in-JS injection failures
- Broken responsive layouts

---

# Phase 6: Maintenance & Failure Analysis (Ongoing)

## Goal

Use AI to interpret React errors for faster debugging.

---

## 6.1 AI Failure Triaging

When a test fails:

---

### Input

Pipe the following into Claude Code:

- Playwright Trace
- Console Logs
- React Error Boundary logs

---

### Verdict

Claude determines whether the issue is:

- Hydration Mismatch
- Broken Hook/State
- Visual Shift

---

### Self-Healing

Claude:

- Updates the POM
- Uses live MCP session findings
- Submits a PR automatically

---

# Summary of Success Definitions

| Workflow | Navigation Success | UI Success | Network Success | Visual Check |
|---|---|---|---|---|
| User Onboarding | `/onboarding/step-2` | "Welcome" Header | `200 OK` | Modal Centering |
| Data Export | `/reports/download` | "Export Started" Toast | `201 Created` | Button Alignment |

---

# Generated for the React Engineering Team

## AI-First QA Initiative