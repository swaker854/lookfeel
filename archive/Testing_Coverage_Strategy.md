# Strategy: Commercial-Grade Testing Granularity

This document outlines the "Smart Coverage" strategy for exercising complex UI components (like 10-field dialogs) without creating slow, brittle, or redundant test suites.

---

## 1. The Core Philosophy: "The Pyramid of Granularity"
To achieve 100% functional exercise while maintaining a fast CI/CD pipeline, we distribute testing across three layers rather than opening and closing the UI for every permutation.

| Layer | Coverage Goal | Execution Speed | Frequency |
| :--- | :--- | :--- | :--- |
| **E2E (Playwright)** | "The Plumbing" (Wiring & Golden Path) | Slow | Once per Critical Path |
| **Component (Isolated)** | "The Logic" (Validations & UI States) | Fast | For every unique field logic |
| **Visual (Snapshots)** | "The Presentation" (Layout & Brand) | Medium | For every distinct UI state |

---

## 2. The "Batch & Verify" Strategy
Instead of opening a dialog 10 times to test 10 fields, we use the **Batch** approach for integration testing.

### Steps for a 10-Field Dialog:
1. **The Single Setup:** Open the dialog once.
2. **The Batch Action:** Interact with all 10 fields in a single session (Type, Select, Toggle).
3. **The Final Commit:** Click "Save" or "Submit."
4. **The Global Assertion:** Verify that the Parent Component (or API) reflects the **composite result** of all 10 changes.

**Benefit:** Reduces browser overhead by 90% while still proving the data flow works for every field.

---

## 3. Handling Isolated Field Logic (Atomic Tests)
For complex validation (e.g., Credit Card formatting or Regex), we bypass the parent component entirely.

- **Strategy:** Render the Dialog component in **Isolation** (Component Testing).
- **Mocking:** Pass "Spy" functions into the Dialog props.
- **Verification:** - Input invalid data into Field #4 -> Assert the "Error" class appears.
    - Input valid data into Field #4 -> Assert the "Spy" function was called with the correct value.
- **Outcome:** We exercise 100% of the field permutations in milliseconds.

---

## 4. State-Based Parent Impact
When a field change impacts a parent component, we don't always need a browser click to prove it.

[Image of component testing vs end to end testing]

**The Strategy:**
1. **Mock the State:** Use Playwright to inject a specific "Resulting Object" into the app state.
2. **Verify Parent View:** Assert the parent renders that state correctly (Visual/Functional).
3. **Conclusion:** If the Dialog is proven to *output* the object correctly, and the Parent is proven to *render* the object correctly, the integration is verified.

---

## 5. Summary Matrix: "What to Exercise and Where"

| Requirement | Detail Level | Methodology |
| :--- | :--- | :--- |
| **Golden Path** (Submit Form) | High | **E2E:** 1 full pass (Open -> Fill All -> Submit). |
| **Field Validation** (Error msg) | High | **Component Test:** In isolation (no full app boot). |
| **UI Impact** (Parent Updates) | Medium | **Batch E2E:** Check all 10 results in one pass. |
| **Edge Cases** (Extreme Values) | Very High | **Unit Test:** Test the logic function/service only. |
| **Layout/Alignment** | Visual | **Snapshot:** One photo of the dialog, one of parent. |

---

## 6. Implementation Checklist for Engineers
- [ ] Do not write separate `.spec.ts` files for individual fields in a single form.
- [ ] Group all "Happy Path" interactions into one E2E workflow.
- [ ] Use `page.route()` to mock API failures (400, 500) to test how the dialog handles errors.
- [ ] Apply **Visual Masking** to dynamic data (e.g., timestamps) to prevent flaky snapshots.

---
*Strategy approved for Commercial-Grade Angular & React Suites.*
