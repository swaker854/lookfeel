# StyleBI Test Strategy
## Discussion Summary — May 2026

---

## 1. Claude UI Redesign

The Portal & Composer UI is being fully rearchitected as the next major project. This is the trigger for this test strategy review — it creates both a window of opportunity and a clear constraint on what to test now vs. later.

### Existing tests - Unit Tests for limited coverage, No E2E or smoke tests exist

The repository has **unit tests only**. There is no Playwright, Cypress, Protractor, or any other E2E framework configured. No integration or smoke test layer of any kind. The `npm run test` script runs Jest unit tests exclusively. E2E and smoke testing are a complete gap this strategy also addresses but will require their own strategy files.

### Portal redesign — safe to test now
Changes are **CSS/visual only** (top bar height, spacing, button sizing). Component selectors, DOM hierarchy, and input/output contracts are unchanged. All Portal tests written now will survive.

### Composer redesign — defer component tests

The new Composer v3 shell introduces a substantially different component tree:

| Component | Change | Test action |
|---|---|---|
| `ComposerToolbarComponent` | Merged into new 44px top bar (file tabs + actions) | Defer — new structure |
| `ComposerMainComponent` | Split into activity rail + left panel + canvas + right panel + status bar | Defer — new component tree |
| `ComponentsPaneComponent` | Moved to always-on left panel tab | Defer — new parent/context |
| ~50 property dialog components | Replaced by 4-bucket dialog model (right inspector, side sheet, popover, compact modal) | Defer — old dialogs replaced |
| `composer-binding-tree` services | **Unchanged** — reused by new binding tab | **Write now** |

Writing Composer component tests now = writing them twice. Write Composer **service** tests now; defer component tests until the new shell is built.

### Binding editor as sub-screen

The binding editor is a sub-screen within the right panel Inspector's **Bindings tab** — not a standalone component. The Bindings tab routes by widget type:

- **Tables, Crosstabs, Selection Lists, form widgets** → inline editable shelf in right panel
- **Charts** → summary card + "Open chart editor" CTA → slides in as overlay (~78% width, scrim behind), leaving composer visible

**Test targets introduced by this sub-screen:**

| Target | Type | When to write |
|---|---|---|
| Bindings tab routing logic (widget kind → surface) | Unit test | When routing is built (Phase 4) |
| Inline binding shelf (simple widgets) | Unit test | When component is built (Phase 4) |
| Chart binding overlay (open/close, back navigation) | Unit test + Stagehand | When component is built (Phase 4) |
| `composer-binding-tree` services | Unit tests | Write now (services unchanged) |

---

## 2. Current Codebase State

**Framework:** Angular 15.2 + TypeScript 4.9.4 + RxJS 6.6.7  
**Build:** Angular CLI + Webpack + Maven (orchestrates npm)  
**Existing test runner:** Jest 28 via `@angular-builders/jest` (migrated from Karma)  
**Projects:** `portal`, `em`, `shared`, `elements` under `web/projects/`  
**Spec location:** Co-located with source — `foo.component.ts` and `foo.component.spec.ts` are siblings in the same directory.

#

### Test Coverage Gap

| Project | Total Components | Have Jest Specs | Missing Tests |
|---------|-----------------|-----------------|---------------|
| Portal | ~640 | ~65 | ~575 |
| EM | ~210 | ~33 | ~177 |
| Shared | ~140 | ~136 | ~4 |
| Elements | ~35 | ~35 | ~0 |
| **Total** | **1,025** | **269 (26%)** | **756 (74%)** |

---

## 3. Proposed Test Stack

### Primary: Vitest + Angular Testing Library

| Tool | Role |
|------|------|
| **Vitest** | Test runner (replaces Jest) |
| **@testing-library/angular** | Component rendering + semantic queries |
| **@testing-library/user-event** | User interaction simulation |
| **vitest-canvas-mock** | Canvas API stub (replaces jest-canvas-mock) |

### Why vitest over keeping Jest

- ~2-3x faster execution on large suites
- ESM-native — aligns with Angular 17+ direction
- First-class vite ecosystem integration
- Vitest API is ~95% identical to Jest — migration is mostly mechanical

### Migration from Jest is cheap

The Jest → Vitest diff is almost entirely:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.mock()` | `vi.mock()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `@types/jest` | `@vitest/globals` types |
| `@angular-builders/jest` | vitest config + npm script |

Test logic, assertions, TestBed configs, and mock structures are **unchanged**.  
The 269 existing Jest specs migrate in ~1-2 days.

---

## 4. Component Complexity Classification

Based on sampling 70 of the 756 unspecced components:

### Tier 1 — Simple (~296 components, 34%)

**Criteria:**
- ≤5 constructor-injected services
- ≤6 @Input/@Output total
- No @ViewChild DOM manipulation
- No canvas, Renderer2, or nativeElement usage
- No heavy base class inheritance

**Examples:** `AliasPane`, `MultiSelect`, `StaticColorEditor`, `ColumnOptionDialog`, `TabListPane`, `DataEditorTabPane`, `TrapAlert`, `TableFormatOption`

**Auto-generation quality with combined method: ~95%**

---

### Tier 2 — Medium (~431 components, 50%)

**Criteria:**
- 6-12 injected services, OR
- 7-15 @Input/@Output, OR
- @ViewChild without canvas/DOM manipulation
- Form binding, state management, some async patterns

**Examples:** `AdvancedConditionPane`, `IdentityTreeComponent`, `ComponentsPane`, `ResourcePermissionComponent`, `VSLine`, `ComposerBindingTree`

**Auto-generation quality with combined method: ~80%**

---

### Tier 3 — Complex (~135 components, 16%)

**Criteria:**
- 12+ injected services, OR
- Extends `AbstractVSObject` or similar heavy base class, OR
- Canvas rendering, Renderer2, direct DOM manipulation, OR
- OnPush + many ViewChildren + complex async

**Examples:** `VSChart` (18 services), `VSTable` (OnPush + scroll + Renderer2), `DatabaseQueryComponent`, `ScriptEditPaneComponent`, `LogicalModelComponent`

**Auto-generation quality with combined method: ~65%**

---

## 5. Test Authoring Methodology

### The Combined Method: Playwright MCP + Source Reading

Neither tool alone is sufficient. They cover each other's blind spots:

| What's needed | Source reading | Playwright MCP | **Combined** |
|---|---|---|---|
| TestBed providers/mock setup | ✓ reads DI tree | ✗ | ✓ |
| Accurate ATL selectors | ✗ inferred | ✓ live DOM | ✓ |
| Interaction → state changes | ✗ inferred | ✓ observes live | ✓ |
| Business logic assertions | ✓ reads class | ✗ | ✓ |
| Edge case / state triggering | ✗ static | ✓ navigate live | ✓ |
| Async/subscription behavior | ✓ reads Observables | ✗ | ✓ |
| Actual rendered output | ✗ guessed | ✓ screenshot | ✓ |

### Automation Quality by Tier (combined method)

| Tier | Source only | Playwright only | **Combined** |
|---|---|---|---|
| Tier 1 (~296) | ~90% | ~70% | **~95%** |
| Tier 2 (~431) | ~60% | ~50% | **~80%** |
| Tier 3 (~135) | ~35% | ~40% | **~65%** |
| **Overall** | **~55%** | **~50%** | **~80%** |

---

## 6. Three-Layer Test Architecture

All three layers are being introduced as part of this strategy. Currently only Layer 1 (unit tests via Jest) exists in any form; Layers 2 and 3 are built from zero.

```
Layer 1 — Vitest unit tests          (component isolation, business logic)   ← exists as Jest, migrating
Layer 2 — Playwright E2E             (critical user journeys, deterministic)  ← new, zero today
Layer 3 — Stagehand AI-driven        (smoke tests during active refactoring)  ← new, zero today
```

### Layer 2: Playwright E2E

Deterministic end-to-end tests against a running StyleBI instance. Covers critical user journeys that unit tests cannot — multi-step workflows, cross-component state, real HTTP. Selector-based, so tied to DOM structure. Suitable for stable flows that won't change frequently.

**Starting targets:** login → open dashboard, create viewsheet, run report, export data.

### Layer 3: Stagehand

Stagehand wraps Playwright with LLM-driven semantic actions:

```typescript
// Selector-based (brittle):
await page.click('[data-id="chart-type-dropdown"]')

// Stagehand semantic (resilient):
await stagehand.act("select Bar Chart from the chart type dropdown")
await stagehand.extract("the number of bars rendered in the chart")
```

**Why relevant for StyleBI:** The Claude UI redesign and look & feel modernization make selector-based E2E tests fragile — DOM structure and CSS change frequently. Stagehand tests operate on semantic intent and survive both. Recommended for **15-20 critical Composer workflows** during the redesign window, not for unit-test-scale coverage.

| | Vitest unit | Playwright E2E | Stagehand |
|---|---|---|---|
| **Current state** | **269 Jest specs** | **None** | **None** |
| Speed | ms | seconds | **10-30s/action** |
| Cost | free | free | **$ per LLM call** |
| Determinism | ✓ | ✓ | ✗ occasional flakiness |
| Survives UI refactor | ✗ | ✗ | **✓ adapts** |
| Tests business logic | ✓ | partial | ✗ |

---

## 7. Angular Upgrade Considerations

By the time Angular upgrade happens, the new Claude UI design will be fully implemented with its own test suite as the established baseline. The upgrade applies on top of that foundation.

### Impact on test code when upgrading Angular 15 → 19

| Layer | Changes on Angular 19 upgrade? |
|---|---|
| Vitest API (`vi.fn`, `describe`, `expect`) | **Never** |
| ATL queries (`screen.getBy*`) | **Never** |
| Assertions / business logic | **Never** |
| TestBed `declarations` → `imports` | Only when component goes standalone (1 line/file, scriptable) |
| Signal input setter | Only when component migrates from `@Input()` to `input()` signals |

The new design's test cases are the baseline — the Angular upgrade does not invalidate them. Fixups are mechanical and scoped to the TestBed configuration layer.

### What Angular 17/18/19 improves for the new design's tests

| Version | Benefit for new design tests |
|---|---|
| Angular 16 | Built-in Jest builder (removes `@angular-builders/jest`) |
| Angular 17 | Standalone components default — new design components can be written standalone from the start, making `TestBed` setup lighter with no `NgModule` declarations |
| Angular 18/19 | First-class vitest support via `@analogjs/vitest-angular`; Signals replace `@Input()` + `ChangeDetectorRef` patterns in new components — simpler state assertions |

New components built as part of the Claude UI redesign (compact-shelf, activity rail, inspector panels) are prime candidates to be written as standalone from day one, making them naturally ready for Angular 17+ without any migration step.

---

## 8. Effort Estimates

### Phase 1 — NOW: Migrate 269 existing Jest specs to Vitest (~1-2 days)
- Update `angular.json` to replace `@angular-builders/jest` with vitest npm scripts
- Create `vitest.config.ts` + `vitest-setup.ts` (canvas mocks, global stubs)
- Swap `@types/jest` → `@vitest/globals` in `tsconfig.spec.json`
- Regex replace `jest.` → `vi.` across all spec files
- Swap `jest-canvas-mock` → `vitest-canvas-mock`

### Phase 2 — NOW: Write tests for safe targets (~2-4 weeks)
**Portal** (all ~640 components) + **EM** (all ~210) + **Shared services** + **Composer services**:
- 15-30 min per component with combined method (Playwright MCP + source reading)
- Playwright navigates to live component → exact DOM/ARIA inspection
- Source reading → TestBed mock scaffold + business logic assertions
- Skip Composer shell/panel/dialog components — those are being replaced

### Phase 3 — NOW (parallel): Stagehand smoke layer for Composer (~1 week setup)
Critical Composer journeys that need coverage during the UI redesign window:
- Open viewsheet, add chart widget, configure bindings
- Save/load viewsheet round-trip
- Property dialog interactions (before they become inspector panels)
- These semantic tests survive the structural rearchitecture

### Phase 4 — DURING Claude UI redesign: Test new components as built
New components get tests written fresh — no migration debt:
- Top bar, activity rail, left panel split container
- Right panel Inspector — Bindings / Format / Script tab routing
- Bindings tab sub-screen: inline shelf + chart overlay open/close/back navigation
- Widget kind → binding surface routing logic
- Floating selection toolbar
- 4-bucket dialog patterns (side sheet, popover, compact modal)
- Status bar toggles

---

## 9. Quick-Win Summary

| Group | Count | Method | When |
|---|---|---|---|
| Portal Tier 1 simple | ~200 | Combined (95% auto) | Now |
| Portal Tier 2 medium | ~300 | Combined (80% auto) | Now |
| EM all tiers | ~210 | Combined | Now |
| Composer services | ~30 | Source reading | Now |
| Composer components (shell/panels/dialogs/binding sub-screen) | ~400+ | Fresh tests for new architecture | During redesign |
| **Safe quick wins total** | **~740** | | **~3-5 weeks** |

---

## 10. Recommended Starting Point

1. **Set up vitest config** (1-2 days) — proves the toolchain works
2. **Migrate existing 269 Jest specs** — validates no regressions
3. **Pilot batch: 10 Portal Tier 1 components** using combined method — validates the workflow
4. **Set up Stagehand** for 15-20 critical Composer journeys — safety net during redesign
5. **Batch Portal + EM + Composer services** to reach broad coverage before redesign lands
6. **Write Composer component tests fresh** as new shell/panels/compact-shelf are built
