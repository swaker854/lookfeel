# Engineering Roadmap: AI-Augmented Playwright Suite (Phased Evolution)

This roadmap focuses on a **Breadth-First** strategy: securing core business value across the entire application before performing deep-dives into individual component logic.

---

## Phase 1: Global "Golden Path" E2E (Breadth-First)
**Goal:** Establish a "Smoke Suite" that covers 100% of the critical business routes.

### 1.1 Discovery: High-Value Only
Ask Claude to identify only the "Revenue" or "Critical" paths:
> "Scan the codebase and identify the top 10 **P0 Golden Paths**. Focus on successful completion of tasks (e.g., successful login, successful order save). Ignore edge cases, validation errors, and complex field permutations for now."

### 1.2 "3-Point Success" Verification
Every Golden Path test must verify:
1. **Navigation Success:** The final expected URL or route is reached.
2. **UI Success:** Visible feedback elements (e.g., a "Success" alert) are present.
3. **Network Success:** API status validation (e.g., `201 Created` payload).

### 1.3 Authoring Strategy
- **The "Batch" Interaction:** Instead of testing one field at a time, fill the entire form (e.g., the Scheduler or Order dialog) in one pass and hit "Submit".
- **Outcome:** Total system connectivity is verified immediately without redundant browser overhead.

---

## Phase 2: Component & Unit Deep-Dive (Logic Depth)
**Goal:** Exercise 100% of the internal logic, validations, and edge cases for high-risk components.

### 2.1 Identifying "Complex" Components
Target components like the **Scheduler**, **Search Filters**, or **Multi-step Wizards**.

### 2.2 Atomic Component Testing (State Interactivity)
For components with high-state logic (like the Scheduler's Daily/Weekly/Monthly toggles):
- **Strategy:** Render the component in isolation.
- **Action:** Exercise field visibility and real-time validation (e.g., "Field B should appear when Field A is checked").
- **Constraint:** Do not navigate the full app; test the component as a "unit" to save time.

### 2.3 Mathematical/Service Unit Testing
For components that calculate data (e.g., a scheduler returning an array of dates):
- **Strategy:** Test the **Data Transformation Function** directly via Vitest or Jest.
- **Goal:** Test 100 variations (Leap years, 31st of the month) in milliseconds without a browser.

---

## Phase 3: Visual Baseline & Layout Guardrails (Polishing)
**Goal:** Detect "Bad Placement," overlapping elements, and responsive breakages.

### 3.1 Establishing Visual Baselines
Add visual snapshots to key "Landing States" in P0 workflows.
- **Empty States:** What the user sees first.
- **Filled States:** Ensuring complex dialogs don't overflow on small screens.
- **Masking:** Use `{ mask: [page.locator('.dynamic-id-field')] }` to ignore dynamic data like dates or IDs.

### 3.2 Visual Audit Routine
Use Claude to scan for "Layout Debt":
> "Compare the 'Scheduler' dialog on Mobile (375px) vs Desktop (1440px). Ensure the 'Save' button is not hidden behind the footer and all 10 fields are reachable."

---

## Summary: The Evolution of a Test Case

| Feature | Phase 1 (E2E) | Phase 2 (Component/Unit) | Phase 3 (Visual) |
| :--- | :--- | :--- | :--- |
| **Scheduler** | Can I save a simple 'Daily' event? | Does 'Monthly' handle leap years correctly? | Does the calendar look right on mobile? |
| **Login** | Can I reach the Dashboard? | Does the 'Invalid Password' error trigger? | Is the logo centered on the login box? |
| **Search** | Does hitting 'Search' return data? | Do filters work with 0 results? | Do results overlap the sidebar? |

---

## Phase 4: Maintenance & Failure Analysis (Ongoing)
When a test fails, Claude Code uses the **Playwright Trace** to diagnose the root cause:
1. **System Failure?** (Phase 1 issue: The API is down).
2. **Logic Failure?** (Phase 2 issue: The component state is bugged).
3. **Layout Failure?** (Phase 3 issue: A CSS update moved a button).

---
*Generated for the Engineering Team — AI-First Regression Initiative*