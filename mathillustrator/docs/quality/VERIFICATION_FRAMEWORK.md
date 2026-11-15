# MathIllustrator Verification Framework — authoritative living plan

**Started:** Round 86. **Current:** Round 87. This document records the verification architecture and exit gates; it does not replace the cumulative [bug register](BUG_REGISTER_AND_DEBUG_ROUTE.md), [test report](TEST_REPORT_CURRENT.md), or [requirements](../planning/USER_REQUIREMENTS.md).

## Purpose and evidence rules

Stop selecting arbitrary quantities of defects for each release. Verify named mathematical properties of shared kernels, then cover dependent constructions, dependency graph behavior and real UI workflows. A passing finite randomized suite **is not proof of correctness**. A catalog status `covered` means *at least one automated property family executed*, not exhaustive coverage or proof, and does not certify Chrome/mobile/hosted behavior.

1. Define mathematical preconditions and oracle independently of the implementation under test. Avoid checking a result only against another invocation of the same defective algorithm (round-trip alone is not enough).
2. Deterministic seeded input generators across world scales and near boundaries. Capture seed, operation, scale, inputs and failure details; fail closed on unexpected test exceptions.
3. Use analytical invariants, metamorphic transformations and independent numerical oracles where possible. Distinguish world tolerances from screen-pixel interaction tolerances.
4. Measure **coverage of operation families**, not solely Node test count. Show all unverified families and separate known OPEN issues from merely unexplored areas.
5. Keep intentional red tests in `*.pending.mjs` until fixed; permanent repaired reproducers move to `*.test.mjs`. Never delete a failing oracle to create a green report.
6. Check updated source and exact browser import graph; document unrun targets. Keep glyphs and v1 projects compatible. Protect benchmarks from arbitrary unmeasured pass/fail thresholds.

## Five verification layers

| Layer | Source scope | Primary verification | Round 86 status |
|---|---|---|---|
| 1. Numerical kernel | finite input, conditioning, scale tolerance, degeneracy | independent predicates, adversarial cases | 0/3 scoped operations covered |
| 2. Primitives | incidence, intersection, circle, path, spline/Bezier | analytic incidence, symmetry and root residuals | 2/7 |
| 3. Constructions | transforms, conics, shapes, 2D/3D plots | mathematical invariants and metamorphic input changes | 5/11 |
| 4. Dependencies | upstream edits, cycles, stable branch identity | graph mutation / save-load equivalence | 0/3 |
| 5. Integration | browser, undo, serialization, performance | Playwright + measured resource budgets | 0/4 *property catalog*; existing targeted browser scripts still exist |

`tests/verification/coverage_catalog.json` is the machine-checkable scoped operation inventory; it is not an exhaustive list of all MathIllustrator tools. The report validates all listed source module paths, operation IDs and property-family references. All uncovered entries are marked `unverified`.

## Round 86 initial properties

Source: `tests/verification/kernel_properties.mjs` (pure, portable JS). Reproducer seed `0x5a17c0de` (decimal `1511506142`), 1,200 cases per family across six repeating scale strata from `1e-9` to `1e6`, for **8,400 deterministic assertions**:

- rotation.isometry: distance between two rotated points unchanged
- reflection.involution: reflect twice about the same nondegenerate line recovers point
- translation.isometry: distance unchanged by common translation
- dilation.composition: two positive dilations equal their product
- inversion.involution: two inversions with same positive circle recover point away from center
- circumcircle.incidence: three noncollinear anchors have common center-to-anchor radius
- segment.projection_roundtrip: projecting a point sampled on a segment preserves its position

Tests avoid invalid inputs by construction; separate invalid/degenerate tests are **future work**, not implied by these passes. Current oracles are local and may share floating-point behavior with implementations; independent high-precision comparisons are planned. Failures are reported with their seed, family, case number, scale and inputs. Generator behavior, guard validation and catalog completeness are unit-tested.

From the `mathillustrator` directory:

```
node --test tests/*.test.mjs
node tests/verification/run_kernel_properties.mjs --seed=1511506142 --cases=1200
node tests/verification/report_coverage.mjs
```

The runners print structured JSON, exit nonzero on failure, and do not modify application state. `--cases=N` changes the count *per family*. To reproduce a failing configuration, preserve the original seed and case count; generators are family-isolated so adding families does not alter earlier sequences.

## Round 87 — numerical degeneracy foundation

- Introduced `src/numeric_geometry.mjs`: exact finite point separation and scale-aware orientation/perpendicular-height predicates using local edge products (not a global world-unit floor).
- Closed polygon defects R86-01/02/03 in both live shape and source-path consumers, including microscopic shapes and invalid new constructions. Legacy v1 documents remain loadable; degenerate shapes are not materialized as misleading closed paths.
- Property families expanded **7 → 9** and cases **8,400 → 10,800**. Operation catalog covered **7/28 → 9/28** (numeric.degeneracy, shape.polygons); 19 scoped operations remain unverified. New tests check 1e-12 through 1e6 world scales and positive/degenerate inputs.
- Full Node **479/479 PASS**, 27 module syntax checks PASS, Chromium smoke + R68 + R73 + R76 PASS. Other Chromium scripts, Safari/Firefox, and published site remain unverified.
- A critical limitation: these are floating-point sampled properties, not a certified robust orientation predicate. Cancellation near machine representability still needs independent high-precision oracle work.

## Phases and strict exit gates

- **A — Inventory and numerical contracts:** enumerate source operations, guard valid/invalid/singular inputs and create independent reference oracles. Exit: every core primitive in catalog, no ambiguous unverified critical kernel contracts.
- **B — Automated verification:** expand seeded tests to each core operation, add scale/translation/rotation metamorphic tests and boundary-focused generators. Exit: all tracked critical operation families have an automated oracle; 10,000 valid trials per critical operation across a declared scale matrix, plus invalid-input suites.
- **C — Shared root-cause fixes:** prioritize failures of shared kernels and propagate regressions to all consumers. Exit: no confirmed P0/P1 unaddressed; every closed bug has a retained test; unresolved P2/P3 explicitly triaged.
- **D — Dependency and browser:** moving constraints, intersections through tangency, cyclic/deleted owners, undo/export/reimport; actual Chromium UI, performance and memory budgets. Exit: supported critical workflows and stated performance limits pass, with browser/platform exclusions declared.
- **E — Maintenance:** required suite in every release, stable baseline metrics and explicit release gates. Exit: no unexplained failures; predeclared scope complete, no false claim that absence of sampled defects proves bug freedom.

### Next focused step (Round 88)

Advance analytic line/circle intersection residuals and symmetry, including independent reference calculations and near-tangencies. Then move to dynamic branch identity. Scope and count of uncovered operations should decrease only as new property families execute.
