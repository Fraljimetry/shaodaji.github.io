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
