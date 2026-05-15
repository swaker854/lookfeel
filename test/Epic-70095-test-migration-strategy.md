# StyleBI Angular Test Strategy — Post Epic-70095
## Plan for portal2026 & composer2026 — May 2026

---

## 1. Post-Epic Baseline

**Framework:** Angular 15.2 + TypeScript 4.9.4 + RxJS 6.6.7  
**Test runner:** Jest 28 via `@angular-builders/jest` — migration to Vitest is the first step (see Section 3)  
**Spec location:** Co-located with source (`foo.component.ts` + `foo.component.tl.spec.ts` siblings)

### Angular Coverage After Epic-70095

> **Scope:** This analysis covers **UI (Angular) tests only** — backend/Java tests are out of scope for portal2026 and composer2026. Of the three test layers defined in this strategy, only **Layer 1 unit tests** currently exist. Layer 2 (Playwright E2E) and Layer 3 (Stagehand) are at zero. The plan therefore focuses on completing Layer 1 coverage first before expanding to Layers 2 and 3.

Composer is not a separate Angular project — it lives inside the `portal` project under `web/projects/portal/src/app/composer/`. The portal project also contains shared subfolders (`vsobjects/`, `widget/`, `binding/`, `graph/`, etc.) used by both the Portal viewer and Composer. The table separates these for the 2026 design planning lens.

| Project / Area | Subfolder(s) | Total Components | Specs After Epic | Still Missing | 2026 Design |
|---|---|---|---|---|---|
| Composer | `portal/app/composer/` | ~176 | ~54 | ~122 | composer2026 — **defer** existing, write fresh |
| Portal user-facing | `portal/app/portal/` | ~142 | ~9 | ~133 | portal2026 — **write now** |
| Portal shared (vsobjects, widget, binding, graph, etc.) | `portal/app/vsobjects/` etc. | ~434 | ~182 | ~252 | portal2026 viewer side — **write now** |
| EM | `em/` | ~210 | ~75 | ~135 | Not in 2026 redesign scope |
| Shared | `shared/` | ~140 | ~149 | ~4 | Near-complete |
| Elements | `elements/` | ~35 | ~35 | ~0 | Complete |
| **Total** | | **~1,137** | **~504 (44%)** | **~633 (56%)** | |

> **Note on portal2026 scope:** The ~434 shared components (`vsobjects/`, `widget/`, etc.) serve both the Portal viewer and the Composer. portal2026 is CSS-only so their component contracts are unchanged — all tests written now survive. The composer2026 redesign will eventually replace the Composer-side usage of some of these shared components, but the components themselves are not being replaced.

### Test Naming Conventions (established by this epic)

| Pattern | When to Use | Example |
|---|---|---|
| `feature.component.tl.spec.ts` | Component/template tests using ATL + Material stubs | `schedule-task-editor-page.component.tl.spec.ts` |
| `feature.service.spec.ts` | Pure service/utility logic tests | `schedule-task-editor-data.service.spec.ts` |
| `feature.service.logic.spec.ts` | Logic-only slice of a complex service | `security-provider.service.logic.spec.ts` |
| `feature.service.scene.spec.ts` | Integration/scene slice of a complex service | `security-provider.service.scene.spec.ts` |

### Shared Test Infrastructure (established by this epic)

**`MaterialTestingModule`** — central re-export of Material modules for EM component tests. Use in every new EM `.tl.spec.ts` instead of manually listing Material imports.

**`audit-test-utils.ts`**
- `MatSelectStub` — `ControlValueAccessor` stub for form-select testing without Material overhead
- `makeErrorServiceMock()` — factory for `ErrorHandlerService` mock; use in any test that injects it

**`ScheduleTaskEditorDataService` extraction pattern** — HTTP logic extracted from component into dedicated service. This is the model to follow: service spec owns HTTP logic, `.tl.spec.ts` owns component template behavior. Use `TimerService` abstraction for any new component with `setTimeout`-based behavior.

---

## 2. Write Now vs. Defer — portal2026 & composer2026

| Area | Design Impact | Test Action |
|---|---|---|
| Portal components (~569 untested) | portal2026 is CSS/visual only — selectors, DOM hierarchy, and contracts unchanged | **Write now** — all Portal tests survive portal2026 |
| Composer services (`composer-binding-tree` and related) | Services reused unchanged by composer2026 binding tab | **Write now** — stable, no redesign risk |
| Composer shell/toolbar/panels/dialogs (~400+ components) | Entire component tree replaced by composer2026 architecture | **Defer** — write fresh when composer2026 components are built |
| New composer2026 components (top bar, activity rail, inspector panels) | Net-new components — no existing code to test yet | **Write during Stage 2** — co-locate spec as each component is built |
| Binding editor sub-screen (inline shelf + chart overlay) | Net-new sub-screen within composer2026 right panel Inspector | **Write during Stage 2** — when routing and surfaces are built |
| Layer 2 E2E — portal2026 golden paths | CSS-only redesign won't break workflow selectors | **Write now** — stable golden paths post-migration |
| Layer 2 E2E — composer2026 golden paths | Structural rearchitecture makes selectors brittle today | **Defer deterministic E2E** — write after composer2026 shell stabilizes |
| Layer 3 Stagehand — Composer during redesign | Semantic intent survives composer2026 structural churn | **Set up now** — 15-20 critical workflows as safety net during redesign |

---

## 3. Vitest Migration

The ~346 existing Jest specs must migrate to Vitest before the Portal and Composer test expansion begins. Writing hundreds of new specs on Jest and migrating again later doubles the work.

**Migration is mechanical — ~1-2 days for full suite:**

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.mock()` | `vi.mock()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `@types/jest` | `@vitest/globals` types |
| `@angular-builders/jest` | vitest config + npm script |
| `jest-canvas-mock` | `vitest-canvas-mock` |

Test logic, assertions, TestBed configs, and mock structures are **unchanged**.

### Audit of Hard-to-Migrate Cases

Actual spec file audit across all ~346 specs:

| Pattern | Files affected | Migration effort |
|---|---|---|
| `jest.resetModules` / `jest.isolateModules` / `jest.genMockFromModule` | **0** | None — these hard cases don't exist |
| `jest.mock()` factory | **2** | Direct rename to `vi.mock()` — same API, 1-2 line change per file |
| Canvas mocking | **11** | One global package swap (`jest-canvas-mock` → `vitest-canvas-mock`) — no per-spec changes |
| `toMatchSnapshot` / `toMatchInlineSnapshot` | **28** | Snapshot API exists in Vitest — `.snap` files need one regeneration pass (`vitest --update-snapshots`) |
| Everything else | **~305** | Pure `jest.` → `vi.` find-and-replace, no structural changes |

The 28 snapshot files are the only wrinkle. All 27 are concentrated in `vsobjects/action/` (action menu tests) plus 1 in `format/`. The fix is a single CLI command after migration — not manual edits per file.

**Steps:**
1. Add `vitest.config.ts` + `vitest-setup.ts` (canvas mocks, global stubs)
2. Update `angular.json` — replace `@angular-builders/jest` with vitest npm scripts
3. Swap `@types/jest` → `@vitest/globals` in `tsconfig.spec.json`
4. Regex replace `jest.` → `vi.` across all spec files
5. Swap `jest-canvas-mock` → `vitest-canvas-mock`
6. Run `vitest --update-snapshots` to regenerate the 28 snapshot files in `vsobjects/action/` and `format/`

### Post-Migration Enhancements

The existing ~346 specs lean heavily toward service and utility tests — they prove services work but leave component template behavior almost entirely uncovered. After the mechanical migration completes, five categories of enhancement are needed, in priority order:

**1. Add component template tests (highest impact)**
Each surviving service spec needs a companion `.tl.spec.ts` for the component that consumes it. This is the largest gap — service correctness is proven but rendered output, user interaction, and conditional UI states are untested. Use the `.tl.spec.ts` naming convention and the combined authoring method (see Section 5).

**2. Convert CSS selector queries to semantic ATL queries**
The component tests that do exist use `fixture.debugElement.query(By.css('.some-class'))` patterns. These break on CSS refactors even when behavior is unchanged. Upgrade to `screen.getByRole()` / `screen.getByLabel()` from Angular Testing Library so tests survive portal2026 and composer2026 visual changes.

**3. Convert snapshot tests to explicit assertions**
The 28 `vsobjects/action/` snapshot tests will regenerate fine but snapshots are opaque — a diff tells you something changed, not whether it's correct. Convert to explicit assertions like "toolbar contains exactly these 5 actions when user has edit permission." Concentrated in one folder, this is a bounded one-time effort.

**4. Adopt `MaterialTestingModule` in EM specs**
Several EM specs manually list Material module imports in each `TestBed`. Replace with the `MaterialTestingModule` introduced by epic-70095 — less boilerplate per file, one place to update when Material versions change.

**5. Standardize async patterns**
Older specs mix `fakeAsync/tick`, `async/await`, and `fixture.whenStable()` inconsistently. Vitest + ATL favors `waitFor()` from Testing Library. Standardize as new tests are written alongside old ones — no need for a dedicated pass.

---

## 4. Component Complexity Classification

Tiers apply to the portal2026 write-now targets: the `portal/` user-facing subfolder (~142) and the Portal shared subfolders (~434). Composer components (~176) are deferred — they will be classified fresh when composer2026 components are built.

### Tier 1 — Simple (~200 portal2026 components, ~34%)

**Criteria:** ≤5 injected services, ≤6 @Input/@Output, no @ViewChild DOM manipulation, no canvas/Renderer2  
**Portal examples:** `AliasPane`, `MultiSelect`, `StaticColorEditor`, `ColumnOptionDialog`, `TabListPane`, `TrapAlert`, `TableFormatOption`  
**Auto-generation quality (combined method): ~95%**

---

### Tier 2 — Medium (~330 portal2026 components, ~50%)

**Criteria:** 6-12 injected services, OR 7-15 @Input/@Output, OR @ViewChild + form binding + async patterns  
**Portal examples:** `AdvancedConditionPane`, `IdentityTreeComponent`, `ComponentsPane`, `ResourcePermissionComponent`, `VSLine`  
**Auto-generation quality (combined method): ~80%**

---

### Tier 3 — Complex (~90 portal2026 components, ~16%)

**Criteria:** 12+ injected services, OR extends `AbstractVSObject` or heavy base class, OR canvas/Renderer2/direct DOM manipulation, OR OnPush + many ViewChildren + complex async  
**Portal examples:** `VSChart` (18 services), `VSTable` (OnPush + scroll + Renderer2), `DatabaseQueryComponent`, `ScriptEditPaneComponent`  
**Auto-generation quality (combined method): ~65%** — slice-first approach required

**Tier 3 slice approach:** decompose into focused test families before generating
- Mode/branch switching
- Validation behavior
- List and selection state
- Async/subscription behavior
- Emitted events and save payload shape

---

### New composer2026 Components (written fresh during Stage 2)

New components are prime candidates to be written **standalone from day one** (Angular 17+ compatible), making TestBed setup lighter and tests naturally ready for the Angular upgrade.

| New Component | Tier estimate | When to write |
|---|---|---|
| Top bar (44px file tabs + actions) | Tier 2 | When component is built |
| Activity rail | Tier 1 | When component is built |
| Left panel split container (components tab, data tab) | Tier 2 | When component is built |
| Right panel Inspector (tab router: Bindings / Format / Script) | Tier 2 | When tab routing is built |
| Bindings tab — widget kind → surface routing logic | Tier 1 | When routing is built |
| Bindings tab — inline shelf (tables, selections, form widgets) | Tier 2 | When component is built |
| Bindings tab — chart overlay (open/close, back navigation) | Tier 2 | When component is built |
| 4-bucket dialogs (side sheet, popover, compact modal, inspector) | Tier 2 | When each pattern is built |
| Floating selection toolbar | Tier 1 | When component is built |
| Status bar toggles | Tier 1 | When component is built |

---

## 5. Unit Test Authoring Methodology

> **Scope: Layer 1 unit tests only.** This section is a summary extract from [Unit_test_roadmap.md](Unit_test_roadmap.md), which contains the full playbooks, output patterns, and anti-creep rules. For Layer 2 E2E case authoring methodology, see [E2E_test_roadmap.md](E2E_test_roadmap.md).

### The Combined Method: Playwright MCP + Source Reading

Neither tool alone is sufficient for unit/component test authoring. They cover each other's blind spots:

| What's needed | Source reading | Playwright MCP | **Combined** |
|---|---|---|---|
| TestBed providers/mock setup | ✓ reads DI tree | ✗ | ✓ |
| Accurate ATL selectors | ✗ inferred | ✓ live DOM | ✓ |
| Interaction → state changes | ✗ inferred | ✓ observes live | ✓ |
| Business logic assertions | ✓ reads class | ✗ | ✓ |
| Edge case / state triggering | ✗ static | ✓ navigate live | ✓ |
| Async/subscription behavior | ✓ reads Observables | ✗ | ✓ |
| Actual rendered output | ✗ guessed | ✓ screenshot | ✓ |

### AI Automation Created Cases Quality by Tier (combined method)

| Tier | Source only | Playwright only | **Combined** |
|---|---|---|---|
| Tier 1 (~296) | ~90% | ~70% | **~95%** |
| Tier 2 (~431) | ~60% | ~50% | **~80%** |
| Tier 3 (~135) | ~35% | ~40% | **~65%** |
| **Overall** | **~55%** | **~50%** | **~80%** |

### Tier 3 Slice Convention (from this epic)

For Tier 3 complex services and components, follow the `.logic.spec.ts` / `.scene.spec.ts` pattern introduced by `SecurityProviderService`:

- **`.logic.spec.ts`** — pure method-level behavior, no HTTP, no template
- **`.scene.spec.ts`** — service interactions, async flows, state transitions
- **`.tl.spec.ts`** — component template behavior using ATL queries

---

## 6. Three-Layer Test Architecture — portal2026 & composer2026 Plan

```
Layer 1 — Vitest unit tests      (migrate 346 specs, then expand Portal + write fresh composer2026)
Layer 2 — Playwright E2E         (portal2026 golden paths now; composer2026 after shell stabilizes)
Layer 3 — Stagehand AI-driven    (Composer critical workflows during composer2026 redesign window)
```

### Layer 1 — Unit Tests

**Portal (write now):** All ~569 untested components — portal2026 is CSS-only so every test written now survives  
**Composer services (write now):** `composer-binding-tree` and related services — unchanged by composer2026  
**Composer components (write fresh):** Co-locate `.tl.spec.ts` as each composer2026 component is built; do not write for old component tree

### Layer 2 — Playwright E2E

**Deterministic golden-path workflows against a running StyleBI instance.**

portal2026 golden paths — write now (stable selectors):

| Workflow | Navigation Success | UI Success | Network Success |
|---|---|---|---|
| Login → Portal home | `/portal` | Dashboard list visible | `200 OK` |
| Open viewsheet | `/portal/tab/dashboard/vs` | Viewsheet canvas renders | `200 OK` |
| Run report | Stays on viewsheet | Report output visible | `200 OK` |
| Export data | Modal → file download | "Download started" signal | `200 OK` |
| Create new viewsheet | `/composer` | Blank canvas visible | `200 OK` |

composer2026 golden paths — **defer until composer2026 shell stabilizes.** Selector-based E2E against the current Composer will be invalidated by the component tree rearchitecture. Write after Phase 4 (composer2026 Stage 2) lands.

### Layer 3 — Stagehand

**Semantic AI-driven smoke tests — survive structural UI churn.**

Set up for 15-20 critical Composer workflows **now**, before composer2026 redesign begins. Stagehand acts on semantic intent (`"open chart binding editor"`) not CSS selectors, so these tests remain valid through the rearchitecture.

Recommended Composer workflows for Stagehand coverage during composer2026 redesign:

| Workflow | Why Stagehand |
|---|---|
| Open viewsheet, add chart widget, configure bindings | Core Composer path; will change structurally |
| Add table widget, set data binding inline shelf | Binding sub-screen is being redesigned |
| Save/load viewsheet round-trip | Cross-component state — brittle with selectors |
| Open property dialog → change format | Dialog model is being replaced by inspector panels |
| Format tab: apply color, font, border | Format inspector is net-new in v3 |
| Script tab: enter expression, apply | Script tab context is changing |

| | Vitest unit | Playwright E2E | Stagehand |
|---|---|---|---|
| Speed | ms | seconds | 10-30s/action |
| Cost | free | free | $ per LLM call |
| Determinism | ✓ | ✓ | ✗ occasional flakiness |
| Survives UI refactor | ✗ | ✗ | **✓ adapts** |
| Tests business logic | ✓ | partial | ✗ |

---

## 7. Effort Estimates

### Phase 1 — Vitest Migration (~1-2 days)
- Migrate all ~346 Jest specs to Vitest
- Validates toolchain before expansion begins

### Phase 2 — Layer 3 Stagehand Setup (~1 week)
- Stand up Stagehand against running StyleBI instance
- Author 15-20 Composer semantic workflow tests
- Safety net active before Stage 2 redesign touches the component tree

### Phase 3 — portal2026 Layer 1 Expansion (~3-4 weeks)
- ~385 untested portal2026 components (`portal/` + shared subfolders), post Vitest migration

| Tier | Count | Method | Estimate |
|---|---|---|---|
| portal2026 Tier 1 (simple) | ~200 | Combined (95% auto) | ~1 week |
| portal2026 Tier 2 (medium) | ~330 | Combined (80% auto) | ~2 weeks |
| portal2026 Tier 3 (complex) | ~90 | Sliced approach | ~1 week |
| Composer services | ~30 | Source reading | ~3 days |
| **Total** | **~650** | | **~3-4 weeks** |

### Phase 4 — Layer 2 Playwright E2E for portal2026 (~1 week)
- 5 portal2026 golden-path workflows (see Section 6)
- Includes Page Object setup and 3-point success assertions (navigation + UI + network)

### Phase 5 — composer2026 Stage 2: Write Fresh as Built
composer2026 components get tests co-located as they are built — no migration debt:
- Top bar, activity rail, left panel split container
- Right panel Inspector — Bindings / Format / Script tab routing
- Binding sub-screen: inline shelf + chart overlay open/close/back navigation
- Widget kind → binding surface routing logic
- 4-bucket dialog patterns (side sheet, popover, compact modal)
- Floating selection toolbar, status bar toggles

After composer2026 shell stabilizes:
- Layer 2 Playwright E2E for composer2026 golden paths (~1 week)

---

## 8. CI Wiring

### Current State — Gaps

The `pr-build.yml` GitHub Actions workflow runs `mvnw clean install` → Maven calls `npm run verify` (`ng lint && ng test`) on every PR. Several gaps exist:

| Gap | Detail |
|---|---|
| `.tl.spec.ts` tests not in CI | `ng test` excludes `.tl.spec.ts` via `testPathIgnorePatterns`; `npm run test:tl` is never called by Maven — the entire epic-70095 component test suite runs manually only |
| JUnit XML is never uploaded | `jest-junit` writes `junit.xml` to `web/` but `pr-build.yml` has no `upload-artifact` step — the file is discarded when the runner exits |
| No test result visibility in PRs | Failures show only as a red build check — no per-test breakdown, no GitHub annotations pointing to the failing file and line |
| No output path configured | `jest-junit` has no explicit output path in `package.json` — relies on default location and env vars |

### Target State — After Vitest Migration

Vitest has a **built-in JUnit reporter** — no external package needed. Output path is declared in `vitest.config.ts` directly:

```ts
// vitest.config.ts
export default defineConfig({
  reporters: ['default', 'junit'],
  outputFile: {
    junit: './target/test-results/junit.xml'
  }
})
```

This replaces both the `jest-junit` npm dependency and the implicit env-var-based path configuration. The `target/test-results/` path aligns with Maven's standard output conventions.

### CI Wiring Steps

**Step 1 — Wire `.tl.spec.ts` into Maven build**

Update `web/pom.xml` to run both test commands during the `test` phase:
```xml
<arguments>run verify:tl</arguments>
```
Add `verify:tl` to `package.json` scripts: `"verify:tl": "ng lint && ng test && npm run test:tl"`

After Vitest migration this collapses to one command since both spec patterns run in the same Vitest suite.

**Step 2 — Upload test results in `pr-build.yml`**

```yaml
- name: Build with Maven
  run: ./mvnw --batch-mode clean install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Angular Unit Tests
    path: web/target/test-results/junit.xml
    reporter: java-junit
```

The `if: always()` ensures results are published even when tests fail — otherwise the failure exits Maven before the upload step runs.

**Step 3 — Add Layer 2 Playwright results when E2E is added**

When portal2026 E2E is wired in, add a second reporter entry:
```yaml
- name: Publish E2E results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Playwright E2E
    path: web/target/test-results/e2e-junit.xml
    reporter: java-junit
```

### Reporting After Wiring

| What you get | How |
|---|---|
| Per-test pass/fail annotations on PR diff | `dorny/test-reporter` writes GitHub Check annotations |
| Test summary in GitHub Actions run | Inline table of passed/failed/skipped counts |
| Trend visibility | GitHub Actions stores result history per workflow run |
| Failure triage without log diving | Failing test name, file, and assertion visible directly in PR |

---

## 9. Quick-Win Summary

| Group | Count | Method | When |
|---|---|---|---|
| Vitest migration (all existing specs) | ~346 | Mechanical find-replace | Day 1-2 |
| Stagehand Composer smoke suite | ~15-20 workflows | Semantic authoring | Week 1 |
| portal2026 Tier 1 simple | ~200 | Combined (95% auto) | Week 2-3 |
| portal2026 Tier 2 medium | ~300 | Combined (80% auto) | Week 3-5 |
| portal2026 Tier 3 complex | ~50 | Sliced approach | Week 5-6 |
| Composer services | ~30 | Source reading | Week 4-5 |
| portal2026 Layer 2 E2E (5 golden paths) | 5 workflows | Playwright + POM | Week 6 |
| composer2026 components (fresh) | ~15-20 new components | Co-located as built | During Stage 2 |
| composer2026 Layer 2 E2E (after shell stabilizes) | ~10 workflows | Playwright + POM | Post Stage 2 |

---

## 10. Recommended Starting Point

1. **Vitest migration** (1-2 days) — unblocks all subsequent expansion on the right stack
2. **Stagehand Composer smoke setup** (~1 week) — safety net must be in place before composer2026 Stage 2 touches the Composer component tree
3. **Pilot: 10 portal2026 Tier 1 components** using combined method — validate the workflow before batching
4. **Batch portal2026 Tier 1 + Tier 2** (~500 components) — broad coverage before redesign lands
5. **Composer service tests** (~30) — stable now, write alongside portal2026 batch
6. **portal2026 Layer 2 E2E** (5 golden paths) — after Portal test suite is solid
7. **Write composer2026 component tests fresh** — co-located as each new component is built in Stage 2
8. **composer2026 Layer 2 E2E** — after composer2026 shell is stable
