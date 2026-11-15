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

## Round 88 — analytic intersections (framework only)

- Added three independently constructed seeded mathematical properties: crossing straight-line symmetry and known incidence, circle–line intersection residuals, and circle–circle root residuals plus argument-order symmetry. Each runs 1,200 cases at six world scales.
- Coverage now **11/28** scoped operations, **12 property families**, **14,400/14,400** passing cases. `line.intersections` and `circle.intersections` are covered; point incidence, tangency transitions, domain-boundary counterexamples, dependent branch continuity, and rigorous high-precision reference remain **unverified**.
- No production code changed. This coverage validates selected *interior, well-conditioned* cases, not arbitrary near-tangencies or loss of significance.
- Next: test exact tangencies and bounded segment/ray domains with independent oracles, then dynamic intersection-branch identity.

## Round 89 — bounded domains, exact tangency and branch identity

- Added four independent deterministic families (4,800 cases): bounded line/segment/ray crossings, bounded circle–line crossings, exactly representable tangencies, and saved `+`/`−` circle-intersection branch identity across anchor edits. Existing 12 families remain unchanged and independently seeded.
- **12/28** catalogued operations covered, **16 property families**, **19,200/19,200** passing trials over six scales (1e-9–1e6). Newly covered: `dependency.branch-identity` (the line/circle domain and tangent checks deepen already-covered operations). This is sampled floating-point coverage, not a formal proof of tangency or dynamic branch continuity.
- Fixed a root cause in `model.mjs`: previously fixed `1e-9` segment/ray endpoint padding allowed nonexistent crossings on microscopic objects. Both line–line and line–circle solvers now share a parameter-magnitude-based floating-point allowance; infinite domains remain unrestricted.
- Exact tangent generators use axis-aligned, exactly constructible configurations, because general rotated floating-point constructions may be near-secant/near-disjoint even when mathematically tangent. General near-tangency and root continuity through nonrepresentable contacts remain future verification targets.
- Full Node **479/479 PASS**, syntax **27 modules PASS**, Chromium isolated smoke and Round 76 **PASS**. No glyph, schema or unrelated UI changes.
- Next: independent high-precision near-tangent oracle, then dependency recomputation and cycle/deletion contracts. These are still marked unverified in the catalog.

## Round 90 — dependency recomputation and deletion/cycle contracts

- Added deterministic properties `dependency.recompute` and `dependency.cycles_and_deletion` (1,200 cases each over six scales).
- Recompute property checks midpoint chains after anchor movement and verifies snapshot isolation for existing resolvers.
- Graph property checks transitive cascade deletion, unrelated-object preservation, explicit cycle rejection by `validateDoc`, and cycle-safe resolver behavior.
- Coverage **14/28**, **18 families**, **21,600 sampled cases**. This checks a scoped family of midpoint dependencies; other dynamically constrained objects, complicated ownership and high-depth graphs remain separate risks.
- No runtime application code changed; actual browser smoke and full Node results are recorded in this release summary.

## Round 91 — JSON project roundtrip and real browser undo/redo

- Added `integration.json_roundtrip`: 1,200 deterministic multiscale v1 projects with mixed point, midpoint, and segment references. Each case serializes, validates, reserializes and checks resolved derived positions and snapshot isolation.
- Coverage **15/28** scoped operations, **19 families**, **22,800 sampled cases**. `integration.import-export` is covered for this bounded JSON subset only; malformed/project migration, larger documents, non-JSON export formats and concurrency remain unverified.
- Added `tests/browser_round91_history.py` which exercises actual Chromium JSON import, undo, redo and JSON download of an edited project. The `integration.undo-redo` catalog operation deliberately remains *unverified* pending comprehensive history bounds, failed edits, multi-step redo invalidation, and drag cancellation properties. UI smoke alone is not counted as a seeded property.
- No production modules or glyphs changed. Next: history state machine verification, then wider import/export schemas and invalid input tests.

## Round 92 — history state-machine verification

- Added `integration.history_snapshots`: 1,200 seeded scale-varying serialization, rollback and divergent-state isolation cases. Pure snapshot invariants are paired with `tests/browser_round92_history.py`, which exercises **actual Chromium app history**.
- Browser verifies multiple independent imports, full undo and redo traversal, disabled-state boundaries, new-edit redo invalidation, rejected malformed JSON and rejected invalid-schema imports preserving document/history, and successful export after redo.
- Coverage **16/28**, **20 families**, **24,000 sampled cases**. Covered means a defined oracle executed, **not** complete history verification. History eviction at 80 states/30MiB, pointer-drag cancellation, tab conflict, asynchronous autosave, and high-volume history are still unverified.
- Production code unchanged; no glyph, schema, or behavior changes.

## Round 93 — real browser selection and drag lifecycle

- Added `tests/browser_round93_interaction.py`, a real Chromium test of SVG point selection, in-flight pointer dragging, Escape cancellation without mutation, successful drag commit, undo/redo restoration, empty-canvas double-click deselection, and locked-point immobility.
- These are reproducible **browser integration scenarios** rather than independent seeded mathematical properties. Accordingly the property coverage remains **16/28**, **20 families**, **24,000 cases**; `integration.browser-interaction` stays unverified for complete property/invariant coverage.
- No production behavior changed; no new bug confirmed. Further checks: pointercancel/lostcapture, multi-object selection, marquee, touch/pinch, snapping focus, unusual SVG overlap, platform-specific input events.

## Round 94 — pointer cancellation and additive selection

- Added `tests/browser_round94_pointer_multiselect.py`, an actual Chromium scenario using captured pointer events and real SVG point dragging. Checks `pointercancel` and `lostpointercapture` rollback, prevents later pointerup from committing canceled edits, and verifies Shift-additive selection and Shift-toggle removal across two independent points.
- Node **479/479**, Chromium smoke, Round 76 and Round 93 browser checks, and Round 94 new check **PASS**; 27 source-module syntax checks **PASS**. No application runtime or saved schema changes.
- Coverage remains **16/28** scoped property operations / **24,000** seeded mathematical cases; these are deterministic browser scenarios, not a newly qualified property family. **Unverified:** native multitouch pinch/zoom, touchscreen long press and pointer ordering, OS-specific pointer capture, marquee geometry with overlapping paths. Do not infer touch-platform support from desktop Chromium checks.
- Next: scoped pointer/marquee property model and touchscreen emulation in Chromium, then physical-device validation before marking `integration.browser-interaction` covered.

## Round 95 — touchscreen contact ordering and marquee boundaries

- Added `tests/browser_round95_touch_marquee.py`, exercising actual Chromium SVG handling for Shift marquee with fully enclosed window selection versus reverse crossing selection. Two-point additive selection verified.
- Touchscreen-emulated `PointerEvent` sequences verify deferred construction until release, two simultaneous contacts suppressing a premature point, cancelled touches not constructing, and an ordinary single-contact tap constructing exactly one point. This uses browser-dispatched PointerEvents in Chromium with touch enabled; **it is not evidence of hardware pinch zoom, native touch-event ordering, real device gestures, or mobile browser behavior**.
- Node **479/479 PASS**, Chromium smoke and Round 76 **PASS**, Round 95 browser **PASS**. Round 94 browser check initially encountered a transient absent SVG marker, but passed independently on immediate rerun; not claimed as a confirmed defect.
- Coverage remains **16/28**, **24,000** seeded cases: browser interaction scenarios do not meet the catalogued seeded-property criterion. No application source changes. Next: investigate hardware gesture support and marquee on overlapping/clipped SVG elements; qualify an integration property only with a reproducible oracle.

## Round 96 — conic invariants and scale-safe parabola sampling

- Added independent seeded focal-distance invariants for the **ellipse** (sum), **parabola** (focus/directrix equality), and **hyperbola** (absolute difference). Each performs 1,200 cases over the existing six scale strata; curves are sampled at multiple points, not merely at the construction anchor.
- **R96-01 CLOSED (P1):** `parabolaPoints` used a fixed minimum world-span of 3 even when its focal separation was microscopic, causing out-of-domain samples to be silently filtered. The reproduced seed `0x5a17c0de`, case 0 at scale `1e-9` produced only 13/25 sample points; now all 25 remain finite and satisfy the focus/directrix residual. Small separation uses a scale-proportional span; normal-scale behavior remains unchanged.
- Property inventory **19/28**, **23 families**, **27,600 sampled cases PASS**. Existing full Node **479/479 PASS**; actual Chromium smoke and Round 76 workflows PASS; 27 module syntax checks PASS. This is sampled functional coverage, not proof of numerical robustness or certification of every conic construction.
- Remaining unverified: numeric domains and tolerance policy, point incidence, spline, Bezier, 2D/3D plotting, browser interaction as a seeded property, and performance. Continue prioritizing these nine inventory operations.

## Round 97 — spline and cubic Bézier invariants

- Added `curve.spline_interpolation` (1,200 seeded cases): renderer-generated SVG cubic endpoints interpolate the original control anchors in both open and closed modes, all path coordinates are finite, and closed paths have the expected closing command. Pixel-level 3-decimal serialization allowance is explicit.
- Added `curve.bezier_convex_hull` (1,200 cases): production sampled cubic endpoints match first/last anchors and all 65 samples agree with independently evaluated nonnegative Bernstein weights (whose sum is one, implying the convex-hull property). Six world-scale strata retained.
- Coverage: **21/28**, **25 families**, **30,000 sampled cases PASS**. Full Node **479/479 PASS**; actual Chromium smoke and Round 76 PASS. No production code change.
- Remaining: numerical domain/finite and tolerance rules, point incidence, plotting 2D/3D, browser interaction property model, performance (7 scoped operations). Additional risks: duplicated/invalid spline anchors, very high control-point counts, closure seam continuity, Bézier self-intersection, browser export precision. Not confirmed bugs.

## Round 98 — finite domains and tolerance equivariance

- `numeric.domain_and_finite` (1,200 seeded cases): geometry predicates reject nonfinite/malformed coordinates; v1 document validation rejects mutated nonfinite point data without mutating the original document.
- `numeric.tolerance_equivariance` (1,200 cases): segment-bounded orthogonal line intersections, out-of-domain rejection, and proper circle secants remain consistent across six coordinate scales. The oracle does not claim uniform accuracy near floating-point underflow/overflow, or nearly coincident geometry.
- Coverage: **23/28** operations, **27** families, **32,400/32,400** property cases PASS. Full Node **479/479 PASS**; syntax and real Chromium smoke/round-76 PASS. No runtime code changes.
- Still unverified: point incidence, 2D plotting, 3D plotting, seeded browser interaction, performance (5 scoped operations). Numerical tolerance tests are sampled contracts, not universal proofs.

## Round 99 — point incidence

- Added `point.support_incidence` (1,200 deterministic cases, six world scales): constrained points on segment and circle supports are checked against independently computed positions; `generalCrossings` finds true isolated-point incidences and rejects points beyond segment endpoints or outside circles. The test harness provides each isolated point through `resolver.at`, matching the production resolver protocol.
- Coverage: **24/28**, **28 families**, **33,600/33,600** passing cases. Full Node **479/479 PASS**; real Chromium smoke and Round 76 PASS. No runtime or glyph changes.
- Still unverified: 2D plotting, 3D plotting, seeded browser-interaction properties, performance. Physical-device behavior and exhaustive near-tangencies are not asserted.

## Round 100 — 2D plotting verification

- Added `plot.2d_sampling`: 1,200 seeded cases over six world scales. Independent analytic checks cover real expression evaluation, legacy-compatible parametric evaluation, circle implicit equation, finite vector-field geometry, and explicit straight-line sampling with screen-coordinate incidence and viewport continuity.
- Coverage **25/28** operations, **29 families**, **34,800/34,800** property cases PASS. Node **479/479 PASS**, Chromium smoke and Round 76 PASS. No production change.
- This does **not** verify implicit contour extraction, adaptive sampling around poles, oscillatory functions, domain-color rasterization, canvas pixel fidelity, extreme zoom, or real-time performance. These remain explicit risks and are not counted as covered subfeatures.
- Remaining catalog operations: 3D plotting, seeded browser interaction, performance.

## Round 101 — 3D plotting verification

- Added `plot.3d_sampling` (1,200 deterministic cases over six coordinate scales). Independent algebraic reference evaluations cover explicit 3D surfaces, parametric surfaces, implicit scalar fields, vector fields, and complex argument height with solid coloring. Every twelfth case also exercises finite triangulated planar surface sampling.
- Coverage **26/28** operations, **30 families**, **36,000/36,000** property cases PASS; full Node **479/479** PASS; Chromium startup and Round 76 PASS. No production source changes.
- `plot.3d` coverage is scoped to these checks only. The framework does NOT yet validate implicit meshing topology, discontinuity boundaries, lighting behavior, mesh cache eviction, camera interaction, clipping at extreme zoom, or high-detail performance.
- Remaining catalog operations: browser interaction and performance.

## Round 102 update

Round 102: `integration.browser-interaction` covered with deterministic real-Chromium drag, Escape cancellation, undo/redo sequences (seed 1022026, 12 independent cases). Coverage 27/28, with 36,000 Node property cases unchanged. This operation uses Chromium evidence, **not** an extra Node property family. Physical touch, multi-tab concurrency and every possible UI state remain outside the scoped contract. Performance operation remains unverified.

## Round 103 — measured performance verification

- Coverage **28/28** in the *initial scoped inventory* (30 seeded functional families, **36,000** cases; performance is separate measured evidence). This is not comprehensive correctness or cross-device performance certification.
- Node benchmark `tests/verification/benchmark_performance.mjs`: surface detail 24, complex domain detail 48, implicit sphere detail 32; 1 cold and 5 warm measurements each, checks finite output, face/evaluation ceilings and mesh cache limit. Environment-specific cold/warm p95 budget defaults to **10,000 ms**, configurable via `MI_PERF_P95_MS` (also `MI_PERF_ITERATIONS`). Sampled heap and per-scenario timings are JSON.
- Chromium `tests/browser_round103_performance.py`: 40/120/240 actual SVG points, three JSON import→visible-render measurements per size, p95 sample maximum, default configurable 10,000-ms budget `MI_BROWSER_IMPORT_P95_MS`. Uses isolated inline app with real Chromium; not public-server network cost or mobile hardware.
- These are **initial non-regression guardrails**, not product SLOs. Do not use this generous environment-independent threshold to assert UI responsiveness. Rebaseline on representative hardware with tighter budgets, collect variability over repeated runs, add 3D browser frame timing, memory growth/leak tests, export stress and device matrix.
- No production code, glyph, schema or project behavior changed. Next phase: upgrade assurance strength, target outstanding gaps rather than expanding the 28-op denominator arbitrarily.

## Round 104 — reliability hardening (post-inventory)

The initial 28/28 scoped coverage remains unchanged. Reliability probes are **independent** of the 36,000 mathematical property cases:

- `node --expose-gc tests/verification/benchmark_cache_stability.mjs`: 24 distinct 3D scenes × 3 passes (72 projections), repeated mesh signatures, finite projections, face/evaluation ceilings, cache byte invariant, post-GC heap growth. Configurable `MI_CACHE_SCENARIOS` (8–80), `MI_CACHE_PASSES` (2–8), `MI_CACHE_HEAP_GROWTH_MIB` (default 128). GC-aware heap assertion is skipped when `--expose-gc` is absent.
- `python tests/browser_round104_churn.py`: 12 repeated 120-point JSON imports, actual SVG element counts and constant DOM node population; observable heap growth capped at 64 MiB when the browser exposes a heap metric. Configurable `MI_BROWSER_CHURN_ROUNDS` (4–50).
- This is a **stress/regression guard**, not proof of absence of memory leaks: caches did not approach their 192 MiB ceiling, GC snapshots can hide retained allocations, browser metrics can be unavailable/uninformative, and testing used a headless isolated Chromium environment. Later tests should deliberately force cache eviction with high-detail varied meshes, measure memory in a sustained browser session, and test real 3D UI orbit/frame pacing on multiple devices.
- No new defect was confirmed by these probes; no production source was modified.

## Round 105 — isolated forced LRU eviction

`node tests/verification/benchmark_cache_eviction.mjs` runs the **real production cache implementation** in a temporary isolated copy with its 192 MiB limit reduced to 1 MiB **only inside that copy**. It verifies actual oldest-entry eviction, hit-triggered LRU promotion, bounded cache bytes, and deterministic geometry after an evicted mesh is recomputed. The original source, runtime limit, glyphs, and project schema remain unchanged. This is a semantic eviction regression, **not** a full-size 192 MiB memory-load certification; long-duration real-browser stress remains an investigation target. Initial 28/28 scope and 36,000 property cases are unchanged.

## Round 106 — real Chromium 3D lifecycle reliability

`python tests/browser_round106_3d_lifecycle.py` exercises the real application modules in isolated Chromium: one editable 3D surface, repeated mesh-detail edits, yaw/pitch updates, actual mouse camera orbits, 2D→3D→2D mode transitions, and post-GC JS heap / live DOM checks. Default: 8 cycles (configure `MI_3D_BROWSER_CYCLES`, allowed 4–40), up to 96 MiB post-GC growth and 1,500 DOM-node drift (configurable). Asserts nonempty 3D output on each return, zero stale polygons in 2D, stable plot count, untouched 2D model and zero page errors.

Observed locally (8 cycles): 800–2,048 3D faces, 1,606–2,854 DOM nodes (detail-dependent), -0.10 MiB first-to-last post-GC heap difference, median wall-clock cycle 384.6 ms, zero page errors. The variable mesh detail intentionally changes DOM size, so the envelope is an invariant rather than demanding equal nodes each cycle. These are short, isolated, headless Chromium measurements; not proof of leak freedom, hardware GPU frame latency or real-site performance. The 28/28 scoped operation catalog and 36,000 mathematical property-case total are unchanged.
