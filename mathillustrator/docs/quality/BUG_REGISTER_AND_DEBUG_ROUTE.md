# Cumulative Bug Register & Future Debugging Route

**Authoritative living document.** Update **this same file** on every subsequent audit or repair round. Do not create a competing master register. The detailed historical evidence and runnable regressions stay in the linked round-specific files.

**Baseline provenance:** authoritative user-uploaded Round 76 `mathillustrator(9).zip`, with sequential Round 77–84 overlays, followed by Round 85 changes. Historical R72/R75 findings are derived from the included audit documents, and are marked closed according to subsequent test-report closure records, not independently re-proven in Round 85. **A passing local test is not a guarantee of hosted-site behavior.**

**Statuses:** CLOSED = a recorded fix and follow-up regression; OPEN = reproduced in a pending expected-correctness test; INVESTIGATE = risk not yet established as a bug. Do not conflate the latter two. Normal regression tests use `*.test.mjs`; pending tests are intentionally excluded from the green test glob.

## Master confirmed-defect register

| Bug ID | Priority | Status / round | Reproduction or symptom (abridged) | Detailed evidence |
|---|---|---|---|---|
| R72-01 | P1 | CLOSED / R74 | Fit / visibility | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-02 | P2 | CLOSED / R74 | Constrained point on ray | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-03 | P2 | CLOSED / R74 | Triangle centers / conditioning | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-04 | P1 | CLOSED / R74 | General point–line incidence | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-05 | P2 | CLOSED / R74 | Two straight-line intersection commands | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-06 | P1 | CLOSED / R74 | False line–circle crossing | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-07 | P1 | CLOSED / R74 | False circle–circle crossing | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-08 | P1 | CLOSED / R74 | Persistent general-intersection branch | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-09 | P2 | CLOSED / R74 | Many crossings / silent truncation | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-10 | P2 | CLOSED / R74 | Hierarchy / measurements | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-11 | P1 | CLOSED / R74 | Deep constructions / stack and responsiveness | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R72-12 | P2 | CLOSED / R74 | Fit failure guidance | [ROUND72_POINTS_LINES_BUG_AUDIT.md](./ROUND72_POINTS_LINES_BUG_AUDIT.md) |
| R75-01 | P1 | CLOSED / R76 | Two distinct points (0,0) and (1e-8,0) have no unique common intersection. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-02 | P2 | CLOSED / R76 | Point (0.0010001,0) lies outside circle radius .001 and admits two different tangents. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-03 | P2 | CLOSED / R76 | A point (1,0) on the unit circle has one tangent line through the point. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-04 | P2 | CLOSED / R76 | A non-self-intersecting square of side 1e-7 has area 1e-14. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-05 | P2 | CLOSED / R76 | Two perpendicular length-1e-7 polyline segments centered at the origin cross once. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-06 | P1 | CLOSED / R76 | Polyline with points (0,0), (100,0), (100,100), dilated ×3 about the origin, reaches (300,300); Fit bounds must include that image. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-07 | P2 | CLOSED / R76 | A point constrained to the ray of a Fixed angle may need to travel to distance 100. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-08 | P1 | CLOSED / R76 | A cubic Bézier whose y-coordinate is (t−0.5002)(t−0.5004)(t−0.8) has three crossings with y=0 on t in [0,1]. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-09 | P2 | CLOSED / R76 | A horizontal polyline y=.5 intersecting the exact unit circle has roots x=±√.75; each root must satisfy x²+y²=1. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R75-10 | P1 | CLOSED / R76 | A 1,500-level chain of identity dilations of a polyline must return its unchanged finite vertices. | [ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md](./ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md) |
| R77-01 | P2 | CLOSED / R78 | Unit circle, infinite horizontal line at y=1-1e-12: two roots at approximately x=±1.4142e-6, but intersectLineCircle returns tangent:true. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-02 | P2 | CLOSED / R78 | Two unit circles with center distance 2-1e-12: returns duplicated [~1,0] and tangent:true, omitting roots with nonzero ±y. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-03 | P2 | CLOSED / R78 | Externally tangent unit circles at centers (0,0) and (2,0): minus and plus both [1,0] despite comment that tangency has a unique minus root. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-04 | P2 | CLOSED / R78 | Same-radius circles at (0,0) and (1e-11,0), both radius 1: resolver returns no intersections because the centers are treated as coincident. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-05 | P2 | CLOSED / R79 | Valid circle with center (0,0) and radial point (1e-10,0): circleGeometry returns null. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-06 | P2 | CLOSED / R79 | Three noncollinear points (0,0), (1e-9,0), (0,1e-9): circumcircle returns null. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-08 | P2 | CLOSED / R80 | checkNewGeometry('hyperbola', [[0,0],[0,0],[1,0]]) and third point equal a focus both return normally, though hyperbolaPoints produces no drawable curve. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R77-09 | P2 | CLOSED / R79 | Near-collinear (0,0),(.1,0),(.2,1e-10) is rejected by circumcircle, but circleArcPoints(...,8) renders 9 points with enormous center/radius. | [ROUND77_CIRCLES_CONICS_BUG_AUDIT.md](./ROUND77_CIRCLES_CONICS_BUG_AUDIT.md) |
| R81-01 | P1 | CLOSED / R82 | Circle inversion | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-02 | P1 | CLOSED / R82 | Circle inversion | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-03 | P1 | CLOSED / R82 | Parabola | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-04 | P1 | CLOSED / R82 | Hyperbola | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-05 | P2 | CLOSED / R82 | Hyperbola | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-06 | P2 | CLOSED / R82 | Constrained points | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-07 | P2 | CLOSED / R82 | Constrained points | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-08 | P1 | CLOSED / R82 | General intersections | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-09 | P1 | CLOSED / R82 | General intersections | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-10 | P1 | CLOSED / R82 | 3D domain coloring | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-11 | P1 | CLOSED / R82 | 3D domain coloring | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-12 | P3 | CLOSED / R82 | Complex arithmetic | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-13 | P2 | CLOSED / R82 | 2D domain coloring | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-14 | P1 | CLOSED / R82 | Ellipse construction | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-15 | P1 | CLOSED / R82 | Legacy ellipse compatibility | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R81-16 | P2 | CLOSED / R82 | Reflection | [ROUND81_CROSS_SECTION_AUDIT.md](./ROUND81_CROSS_SECTION_AUDIT.md) |
| R83-01 | P1 | CLOSED / R83 | Point (0.5,5e-11) intersecting segment from (0,0) to (1,0) returns a false root | [ROUND83_INTERSECTION_FOLLOWUP.md](./ROUND83_INTERSECTION_FOLLOWUP.md) |
| R83-02 | P1 | CLOSED / R83 | Point (1+5e-9,0) beyond segment endpoint returns a false root | [ROUND83_INTERSECTION_FOLLOWUP.md](./ROUND83_INTERSECTION_FOLLOWUP.md) |
| R83-03 | P2 | CLOSED / R83 | Point (5e-12,0) exactly on a 1e-11 spline segment returns no root | [ROUND83_INTERSECTION_FOLLOWUP.md](./ROUND83_INTERSECTION_FOLLOWUP.md) |
| R84-01 | P1 | CLOSED / R84 | polylineCrossings([[0,0],[1,0]], [[1+5e-10,-1],[1+5e-10,1]]) incorrectly reports an intersection beyond the endpoint | [ROUND84_INTERSECTION_BOUNDARY_AUDIT.md](./ROUND84_INTERSECTION_BOUNDARY_AUDIT.md) |
| R84-02 | P1 | CLOSED / R84 | circlePolylineCrossings({center:[0,0],radius:1}, [[0,0],[1-5e-13,0]]) incorrectly reports an on-segment circle root | [ROUND84_INTERSECTION_BOUNDARY_AUDIT.md](./ROUND84_INTERSECTION_BOUNDARY_AUDIT.md) |
| R84-03 | P1 | CLOSED / R84 | Two analytic lines with a crossing at x=1+5e-9, outside a unit segment, still return a root | [ROUND84_INTERSECTION_BOUNDARY_AUDIT.md](./ROUND84_INTERSECTION_BOUNDARY_AUDIT.md) |
| R85-01 | P1 | CLOSED / R85 | r50SourceShape for rectangle with opposite corners [0,0] and [1e-10,2e-10] returns [] instead of five closed path vertices | [ROUND85_FOLLOWUP_AUDIT.md](./ROUND85_FOLLOWUP_AUDIT.md) |
| R85-02 | P1 | CLOSED / R85 | generalCrossings on two derived midpoint singletons at [0,0] and [5e-18,0] returns a false intersection | [ROUND85_FOLLOWUP_AUDIT.md](./ROUND85_FOLLOWUP_AUDIT.md) |
| R85-03 | P2 | CLOSED / R85 | Circle radius 1e-12 against segment at y=1.000005e-12 returns a spurious tangent at [0,1.000005e-12] | [ROUND85_FOLLOWUP_AUDIT.md](./ROUND85_FOLLOWUP_AUDIT.md) |
| R86-01 | P2 | CLOSED / R87 | Zero-radius regular polygon emits a closed path consisting only of repeated vertices | [ROUND86_DEGENERATE_SHAPES_AUDIT.md](./ROUND86_DEGENERATE_SHAPES_AUDIT.md) |
| R86-02 | P2 | CLOSED / R87 | Three collinear rectangle anchors emit a zero-area closed path | [ROUND86_DEGENERATE_SHAPES_AUDIT.md](./ROUND86_DEGENERATE_SHAPES_AUDIT.md) |
| R86-03 | P2 | CLOSED / R87 | Three collinear parallelogram anchors emit a zero-area closed path | [ROUND86_DEGENERATE_SHAPES_AUDIT.md](./ROUND86_DEGENERATE_SHAPES_AUDIT.md) |

## Verified status snapshot — Round 87

- **All three R86 shape defects CLOSED:** shared, scale-equivariant numerical predicates in `src/numeric_geometry.mjs`; consistent `src/model.mjs` and `src/geometry_round50.mjs` construction resolution; promoted permanent tests in `tests/round87_degenerate_shapes.test.mjs`. Regular-polygon creation now accepts distinct microscopic anchors. The old pending suite is a compatibility no-op, not a hidden failing oracle.
- **Verification catalog:** 9/28 operations with property probes, 10,800 seeded cases across 9 families, six scales; unverified operations remain 19. Full Node 479/479 and four Chromium suites PASS.

## Historical status snapshot — Round 85

- **Three R85 defects closed:** R85-01, R85-02, R85-03. Source `src/geometry_round50.mjs`; `round85_precision_repairs.test.mjs` (3 PASS).
- **Three new R86 defects open:** R86-01/02/03. `round86_degenerate_shapes.pending.mjs` (3 intentional FAIL).
- All earlier tracked defects (R72, R75, R77, R81, R83, R84) have closure recorded in their respective release documents. This does *not* mean all MathIllustrator features have been audited exhaustively.
- Round 81's original R81-04 hyperbola oracle was invalid because the chosen point was degenerate; the reproduction was corrected before closing it. Preserve that correction rather than reinstating the faulty test.
- Chromium historical scripts `browser_round26_closure_circle.py`, `browser_round27_ui_snap_circles.py`, and `browser_round50_geometry.py` have old baseline-failing assertions. Differentiate them from new regressions before altering code or glyphs.

## Next debugging route — ranked and section-focused

1. **R86 / Geometry Polygons & Quadrilaterals (P2, CLOSED / R87):** reject zero-radius regular polygons and collinear 3-anchor rectangles/parallelograms at new construction; preserve historical v1 import behavior for existing degenerate objects. Check normal, microscopic, translated, and dynamically degenerating examples. Avoid changes to glyphs. Promote all three pending oracles to green tests only after fixes.
2. **Dynamic intersection branch identity (high risk, INVESTIGATE):** animate anchor movement through tangency, circle-center orientation flips, and roots appearing/disappearing for sampled splines and Béziers. Validate point-identity continuity and undo/save/reload.
3. **Dependency graph and transformations (high risk, INVESTIGATE):** deep mixed line/curve chains, deleting upstream refs, singular inverse images, derived point role, constrained-point snapping, serialization and undo/redo consistency.
4. **Plotting 2D/3D (high risk, INVESTIGATE):** implicit surfaces at high resolution, field and domain-color mode switches, z-range, multi-surface occlusion, high-frequency curves, aspect-ratio memory budgets and responsive dragging.
5. **Diagrams, export and persistence (medium risk, INVESTIGATE):** TikZ-cd arrow semantics under double/wavy styles, label/harpoon/hook direction, Unicode/LaTeX round trips, selection/drag overlays, cross-language settings, JSON project migration, SVG/TikZ fidelity.
6. **UX/real browsers (medium risk, INVESTIGATE):** actual mouse and touch construction of all palette items, all 44 geometry workflows across edit/undo/export; Safari/Firefox, large scenes, accessibility, mobile and published site. Check known historical Chromium scripts against baseline before classifying failures.

## Required process for every subsequent round

1. Rebuild from the latest authoritative ZIP + overlays. Never assume an earlier output is the new base if the user provides newer source.
2. Choose one focused section. Start with OPEN defects; reproduce before editing and preserve the failing oracle.
3. Repair with exact mathematical predicates, scale-aware tolerances, and safe invalid/degenerate behavior. Avoid mixing world-space numerical checks with pixel hit testing.
4. Promote corrected pending tests into permanent `*.test.mjs` tests, retaining case IDs. Include boundary, symmetry, dynamic-update, import and export cases where relevant.
5. Run full `node --test tests/*.test.mjs`, syntax checks, real isolated Chromium startup and relevant interaction suites. Report exclusions and baseline-old failures.
6. Append new confirmed bugs to **this register**, with ID, priority, concise reproducer, status, exact test path, and follow-up round. Keep separate detailed audit reports and update `TEST_REPORT_CURRENT.md` plus `USER_REQUIREMENTS.md`.
7. Deliver a website-root, changed/new-files-only ZIP overlay; no Git commit. Do not alter protected glyphs without explicit user permission.

**Never silently close a bug because the pending test is deleted, or turn a conjecture into a confirmed defect without an executable reproduction.**

## Round 86 — systematic verification foundation (no bug status changes)

The debugging strategy is now **invariant-driven**, not a repeating quota of newly found bugs. See [VERIFICATION_FRAMEWORK.md](VERIFICATION_FRAMEWORK.md) and `tests/verification/coverage_catalog.json`. Seven seeded mathematical property families (8,400 cases over six scales) now pass; scoped property coverage is **7/28** operations. The three degenerate polygon cases R86-01/02/03 stay **OPEN** and their `*.pending.mjs` reproducers are untouched. Property coverage is not equivalent to complete software coverage, and earlier historical closure statements remain unchanged. Next priority is numerical degeneracy contracts and independent intersection oracles, then dependent and browser workflows.

## Round 88 — verification-only checkpoint

No new confirmed defects and no bug status changes. `line.intersections` and `circle.intersections` gained deterministic seeded incidence/symmetry properties; **11/28 operations** now meet the current property coverage criterion. Prioritized open investigation: analytic tangency transitions, ray/segment domains, intersection branch continuity. Keep the distinction between property coverage and full defect clearance.

## Round 89 — numerical domain regression and verification

- **R89-01 — CLOSED (P1):** Fixed absolute `1e-9` line-parameter boundary padding used in both `intersectStraightLines` and `intersectLineCircle`. It could return false intersections beyond segment/ray endpoints for microscopic shapes. Reproducer: six-scale, deterministically seeded `line.domain_boundary` and `circle.domain_boundary` invariants in `tests/verification/kernel_properties.mjs`. Shared correction: `inStraightDomain` in `src/model.mjs`. Regression included in the regular framework test.
- Covered `dependency.branch-identity` for sampled exactly representable tangent transitions. No other defect claimed or closed. Continue prioritized next with independent near-tangent oracle, recomputation and deleted-source handling; do not count previously sampled families as exhaustive.

### Round 90 verification update

No new defect confirmed. Dependency recomputation and cycle/cascade deletion now have seeded regression properties. Remaining priorities: dependent non-point curves, ownership of polygon edges, complex branch changes, and browser undo/redo. The register of existing defects is unchanged.

### Round 91 — integration verification checkpoint

No new confirmed bugs and no existing status changes. JSON roundtrip has 1,200 seeded mathematical state checks; actual Chromium import → undo → redo → save passes. Continue reviewing rejected mutations, redo invalidation, history size eviction, older scene formats, SVG/TikZ interchanges and multi-tab conflicts. The history operation remains unverified in the property catalog; do not count simple UI smoke as exhaustive history validation.

## Round 92 verification update

No new confirmed defects. Chromium history tests cover multi-step traversal, redo invalidation and rejected-import preservation; history eviction, concurrent tabs, drag cancellation and autosave remain *unverified risks*, not registered bugs. Continue to prioritize evidence-backed failures over arbitrary discovery quotas.

## Round 93 verification update

No new confirmed defects or status changes. Real Chromium pointer interaction now verifies selection, canceled and committed point dragging, undo/redo, empty-canvas deselection and locked-point immobility. Follow-up coverage: pointercancel, touch gestures, multi-select, marquee and overlapping shapes. Do not count these browser workflows as a new seeded property operation.

## Round 94 verification update

No new confirmed defects, and no statuses changed. Real Chromium confirms pointercancel and lostpointercapture fully roll back pending point edits, and Shift selection toggles two distinct point objects. Touchscreen pinch gestures, real multi-pointer hardware ordering and overlapping-geometry marquee behavior remain **unverified risks**, not confirmed bugs. Property coverage stays **16/28**.

## Round 95 verification update

No new confirmed defects; status unchanged. Real Chromium validates mouse marquee window/crossing and emulated multitouch contact suppression, cancellation, and single-touch point creation. Hardware pinch and platform-specific touch remain unverified. A transient missing marker in one prior Round 94 test was not reproducible on rerun and is not registered as a bug. Property coverage stays **16/28**.

## Round 96 — conic property verification

- **R96-01 — CLOSED (P1):** Microscopic valid parabolas lost sampled path points because `parabolaPoints` imposed a fixed 3-world-unit sampling span, producing huge unstable parabola heights. Evidence: `conic.parabola_focus_directrix` property seed `0x5a17c0de`, case 0, scale `1e-9`, returned 13 points instead of the requested 25. Repair: proportional span below focal separation 0.6; retain the original span at ordinary world scales. The property now passes all 1,200 cases.
- No other new confirmed defects. **19/28** catalog operations covered; nine explicitly unverified. Prior open statuses unaffected. Continue to validate numerical/domain contracts, spline and Bezier, plotting and integration performance.

## Round 97 verification update

No new confirmed defects or status changes. Added 2,400 deterministic cases for open/closed spline interpolation and cubic Bézier weighted evaluation. Coverage 21/28 operations; 30,000 cases PASS. High-density spline and invalid-point paths remain unverified risk areas, not discovered bugs. Continue to the seven unverified catalog operations, prioritizing numeric domain/finite and tolerance-policy verification.

## Round 98 verification update

No new confirmed defects. Closed/open defect statuses unchanged. Verified finite-coordinate rejection and scale-consistent proper intersection boundaries with 2,400 additional deterministic property cases. Coverage now 23/28 operations and 32,400/32,400 passing sampled cases. Debug route: point incidence → 2D/3D plotting → seeded browser interaction → performance. Continue maintaining this cumulative register.

## Round 99 verification update

No new confirmed defects or defect-status changes. Point-on-segment/circle incidence and isolated-point crossing behavior verified with 1,200 seeded cases spanning six scales. Framework: 24/28 operations, 33,600 passing sampled cases. Next route: 2D plotting → 3D plotting → browser-state model → performance, with regression preservation at each step.

## Round 100 verification update

No new confirmed defects. 2D plotting's scoped analytic expression, parametric/implicit evaluation, vector fields, and smooth explicit line sampling now have seeded, scale-aware oracle coverage (25/28 catalogued operations). Further testing should target discontinuities, contour topology, domain color raster, extreme zoom, and interactive workflows; these are investigation targets, not confirmed bugs. Next: 3D mathematical properties → seeded browser model → performance budgets.

## Round 101 verification update

No newly confirmed defects. Added 3D parsing and planar mesh numerical oracles (26/28 catalogued operations covered). Next: browser-interaction seeded state transitions and explicit performance budgets. Unverified 3D mesh topology, camera/lighting, heavy-scene memory, and physical touch remain risk areas, not confirmed bugs.

## Round 102 update

Round 102: Added seeded Chromium interaction verification. No new defect asserted; continue next with scoped performance budgets, then independent root-cause risk review. Test coverage does not imply bug-free behavior.

## Round 103 — verification framework closure / future route

No new confirmed defects. Initial operation inventory is 28/28 covered; **do not confuse sampled coverage with absence of bugs**. Priority next: (1) tighten environment-specific latency thresholds; (2) 3D interactive rendering and long-run memory retention; (3) mobile pointer and browser compatibility; (4) independent high-precision oracles at singularities; (5) export stress, persistence and dependency chains. Reopen this register only for reproduced defects with permanent tests.

## Round 104 — bounded-state reliability verification

No new **confirmed** defects (do not create a speculative bug ID). New durable regression probes: `tests/verification/benchmark_cache_stability.mjs` and `tests/browser_round104_churn.py`. Both pass; the 3D cache did **not** reach its eviction limit, so eviction correctness remains an **INVESTIGATE** item, not a closed test category. Also investigate long-lived 3D interactive renderer allocations and browser memory under repeated 3D import/orbit/export. Next focused reliability round: force LRU eviction with varied high-detail 3D meshes and verify deterministic recomputation and bounded heap after eviction.

## Round 105 — forced LRU eviction verification

No newly confirmed defect. The prior *untested eviction behavior* risk now has a passing isolated regression: oldest-entry eviction, LRU promotion on hit, bounded cache size, and deterministic recomputation under a 1 MiB test-only cache limit, using an otherwise unmodified production cache implementation. Remaining reliability route: sustained real 192 MiB cache churn, actual 3D orbit and UI lifecycle memory, repeated export/scene editing, and platform/browser performance. No defect IDs assigned without reproduction.

## Round 106 — 3D browser lifecycle

No new confirmed defect. New reusable browser regression `tests/browser_round106_3d_lifecycle.py` verifies repeated 3D detail edits, real mouse orbits, 2D/3D mode cancellation, polygon restoration, unaffected 2D state, post-GC JS heap and DOM size. Eight cycles pass with zero page errors. Further route: longer-duration sustained 3D editing, export within the lifecycle loop, representative device/GPU frame pacing, and multi-browser coverage; no speculative defect IDs. Initial framework coverage remains 28/28.

## Round 107 — 3D image/project export verification

No new confirmed defects. A retained real-Chromium test checks three successive edited 3D scenes and all nine SVG/PNG/JSON downloads. Next routes: (1) pixel-level image fidelity and alpha-channel semantics; (2) interruption/cancellation under asynchronous raster encoding; (3) same-second filename collisions; (4) Firefox/Safari/hosted environments. These are *unverified risks*, not confirmed bugs.

## Round 108 — finite release exit plan

No new confirmed defect. Chromium checks pass for opaque/transparent 3D PNG alpha, SVG face fidelity, and disabling transparent JPEG. Stop arbitrary next-round bug discovery. Close only release gates G4 (interrupted export), G5 (open confirmed P0/P1 triage), G7 (hosted deployment smoke), as tracked in `RELEASE_EXIT_GATE.md`; then enter regression-driven maintenance.

## Rounds 109–111 — finite campaign closure

All **58** entries in the master confirmed-defect table currently have CLOSED status, with no registered OPEN P0/P1/P2 issue. Round 109 added actual Chromium sabotage of deferred image encoding: closing the export dialog before `canvas.toBlob` completion prevents any stale download; subsequent fresh PNG download succeeds. Round 110 cross-checked the bug register and compatibility regressions; Round 111 closed the *local* verification campaign. **Hosted deployment remains unverified**, as documented in `RELEASE_EXIT_GATE.md`. Future debugging is driven by reproducible regressions or requested features rather than creating arbitrary defects to populate each round.

## Round 112 — verification infrastructure (no new production defects asserted)

The release runner now enforces actual executed evidence for browser/performance catalog items. Numerical adversarial tests and explicit PASS/FAIL/INCOMPLETE states prevent false complete-coverage assertions. Production bug statuses remain unchanged; infrastructure gaps are documented in `VERIFICATION_ENGINE_USER_GUIDE.md` and not mislabeled as mathematical defects.
