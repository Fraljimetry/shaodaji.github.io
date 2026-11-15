# Round 72 — 2D Points & Lines: bug discovery only

**Date:** 2026-11-14 (project-local source provided in this conversation).  
**Authoritative baseline:** uploaded `mathillustrator(8).zip`, identified as the user's latest Round 71 tree.  
**Audit posture:** **NO RUNTIME FIXES**. No changes to `src/`, `index.html`, `style.css`, glyphs, JSON schema, or existing tests. No Git operations. This report records reproducible failures, not speculative fixes or green acceptance of the defects.

## Scope and evidence classes

The starting section is the first logical 2D category: **Points & measurements / Lines & constructions**. Interoperability was probed where these tools depend on circle/curve intersections, affine transformed objects, viewport Fit, and project imports. The audit examined mathematical resolution, finite/degenerate limits, dynamic branches, selection/drag constraints, rendering/viewport, imported deep dependency graphs, and semantic measurements. Diagrams, complete 2D plot solvers, full 3D, cross-tab storage, real touch hardware and published-site HTTP behavior are **not certified by this audit**.

Evidence classes: **N** = independently reproduced failing Node oracle (`tests/round72_points_lines.pending.mjs`); **B** = failing actual headless Chromium oracle (`tests/round72_points_lines_browser.pending.py`); **S** = static source inspection corroborating the exercised path. Red oracles deliberately run outside the ordinary green test glob. The intended mathematics and observed outcome are both retained so subsequent repair can turn each red test green.

## Confirmed bug register (12 open, 0 fixed)

| ID | Priority | Area | Exact reproduction / expected behavior | Observed defect | Evidence / likely code path |
| --- | --- | --- | --- | --- | --- |
| **R72-01** | P1 | Fit / visibility | Create points (0,0) and (1000,0), click Fit on a 900px-wide canvas. Both finite anchors should be framed or the operation should explicitly offer fit beyond the current zoom floor. | `fitSceneView()` uses **scale 5**, reports `clipped=true`, and places the far point at **screen x=2923** in the 900px test. In the real Chromium UI (825px canvas) the saved far point's SVG circle is **culled** following Fit. | **N+B+S**, `src/geometry.mjs:180–207` (`Math.max(5, ...)`), `src/app.mjs:2415–2421` |
| **R72-02** | P2 | Constrained point on ray | Define ray from (0,0) towards (1,0), then drag a `pointOnObject` along the visible ray towards (100,0). Its finite location should follow the ray. | The sampled ray length is fixed to **15** world units. Projection of (100,0) yields parameter 1 and point **(15,0)**, not (100,0). Similar fixed 30-unit samples affect unbounded lines. | **N+S**, `src/geometry_round50.mjs:83–86,240–241`; `src/app.mjs` `r50MoveConstrained()` |
| **R72-03** | P2 | Triangle centers / conditioning | A noncollinear triangle with vertices (0,0), (0.000001,0), (0,0.000001) has genuine circumcenter, incenter and excenters. | `triangleCenter()` returns **null** for all three kinds; centroid still works. The circumcircle guard uses an absolute determinant floor which rejects this mathematically valid scale. | **N+S**, `src/geometry_round50.mjs:17–36` |
| **R72-04** | P1 | General point–line incidence | Point (1000000,0.05) lies **off** the horizontal line y=0. General Intersection should return no root. | It returns the point as a crossing. The line-incidence distance tolerance grows with the distance from line origin: `1e-7 * max(1, norm(point-origin))`. | **N+S**, `src/geometry_round50.mjs:132–141` |
| **R72-05** | P2 | Two straight-line intersection commands | Intersect y=0 with the line from (0,1e-10) to (1,1.1e-10), crossing near (-10,0). Standard and General Intersection should agree on this finite root or consistently classify it as numerically indeterminate. | Standard `intersectStraightLines()` returns **null** (`|det| <= 1e-10`); `generalCrossings()` returns approximately **(-10,0)** (`|det| < 1e-12`). | **N+S**, `src/model.mjs:337–352` vs `src/geometry_round50.mjs:150–154` |
| **R72-06** | P1 | False line–circle crossing | Unit test: circle centered (0,0), radius .001; horizontal line y=.0010001 is strictly outside it. | Standard circle intersection gives no roots, but General Intersection manufactures a **(0,.0010001)** crossing. A fixed discriminant allowance of `-1e-9` is in squared world units, inappropriate for tiny geometry. | **N+S**, `src/geometry_round50.mjs:155–161` |
| **R72-07** | P1 | False circle–circle crossing | Two circles of radius .001 centered (0,0) and (.0020000001,0) have a positive gap. | Standard `intersectCircles()` gives no crossings; General Intersection invents a midpoint root **(.00100000005,0)**. Its absolute +1e-9 distance tolerance accepts disjoint circles and clamps the imaginary height to zero. | **N+S**, `src/geometry_round50.mjs:163–168` |
| **R72-08** | P1 | Persistent general-intersection branch | Two radius-one circles with centers (0,0) and (1,dy), move `dy` from -.001 to +.001. A persisted `rootIndex:0` should follow one continuous physical intersection through the small motion. | Index 0 jumps from roughly **(.499134,-.866525)** to **(.499134,+.866525)**. Roots are sorted lexicographically by x/y on every recomputation, not tracked by a stable geometric branch. | **N+S**, `src/geometry_round50.mjs:148,163–168`, `src/model.mjs:450`, `src/app.mjs:2097` |
| **R72-09** | P2 | Many crossings / silent truncation | Zigzag polyline with **51** distinct crossings against y=0 should return all crossings or explicitly report an incomplete result. | `polylineCrossings()` returns only **32**, silently truncating `.slice(0,32)`; general intersections also cap sorted results at 32, and the `rootIndex` schema only permits 0–31. | **N+S**, `src/geometry_round50.mjs:109–118,148`; `src/model.mjs:646` |
| **R72-10** | P2 | Hierarchy / measurements | A segment of length 2 dilated by factor 3 is another exact segment of length **6**. Its Length Properties/measurement should use its semantic line role. | Resolver correctly computes `line(image).length=6`, but `measureGeometry(image, resolver)` returns **null**, because only concrete `segment`/`fixedLength` types receive a length result. | **N+S**, `src/geometry_measurements.mjs:38–44` |
| **R72-11** | P1 | Deep constructions / stack and responsiveness | A **schema-valid 4,000-level** chain of affine point rotations (zero angle) must resolve to the initial point (1,2), without crashing. | `validateDoc()` succeeds (~0.5s in the local probe), but `createResolver(...).at(lastId)` throws **RangeError: Maximum call stack size exceeded** (roughly 1.7s in the separate probe); 2,000 transforms took roughly 0.7–0.8s to resolve. The iterative resolver calls recursively expanding `r50Shape()` → `r50SourceShape()` for nested transformed-point images. | **N+S**, `src/model.mjs:411–522`; `src/geometry_round50.mjs:184–238,282` |
| **R72-12** | P2 | Fit failure guidance | On the R72-01 two-point scene with ordinary labels, Fit should explain that geometry is too far apart for the editor's minimum zoom, not blame font sizes. | Chromium displays **“Some fixed-size labels are wider than this viewport. Enlarge the canvas or reduce font size.”** although the blocker is finite geometry and a scale floor, not a long label. | **B+S**, `src/app.mjs:2419`, `src/geometry.mjs:203–207` |

**P1** denotes false mathematical results, loss of visual accessibility, discontinuous geometry, or an actual exception. **P2** denotes a bounded but mathematically incomplete construction, inconsistency, incorrect measurement, or misleading feedback. Priorities are triage suggestions; no repair is implied.

## Safe reproductions

From the website root containing `mathillustrator/`:

```bash
cd mathillustrator
# This is intentionally RED: currently 11 failures out of 11 expected-correctness oracles.
node --test tests/round72_points_lines.pending.mjs
# This is intentionally RED: real Chromium starts but Fit culls the far point.
PYTHONPATH=tests python tests/round72_points_lines_browser.pending.py
```

The pending suffix is **intentional**, keeping discovery tests out of `node --test tests/*.test.mjs` until a future targeted fix changes the expected behavior. Do **not** write tests that assert the buggy output as acceptable, and do not remove these failures simply to recover a green build. The browser test captures the misleading Fit toast before making its failing visibility assertion.

## Non-regression / current verification (no fixes)

- On the unchanged imported Round 71 runtime: **398/398** ordinary Node tests passed (`node --test tests/*.test.mjs`); **all 26 `src/*.mjs` syntax checks** passed.
- Real headless Chromium from `/usr/bin/chromium`, executed with the current inlined application bundle, passed **six** existing scripts independently: `browser_smoke.py`, `browser_round71_2d_fit_selection.py`, `browser_round69_2d_sweep.py`, `browser_round68_geometry_diagram_hierarchy.py`, `browser_round67_diagram_snap.py`, `browser_round70_3d_sweep.py`.
- The dedicated Round 72 Node oracles are **11/11 expected RED**, and the dedicated Chromium Fit oracle is **expected RED**. Their failure establishes observed defects, not a failed installation or new runtime regression.
- The ordinary green suites exercise previously covered cases; **they do not disprove these new counterexamples**.
- No hosted-origin browser startup, complete historical Chromium archive, Safari, Firefox, touchscreen, assistive technology, long-run rendering FPS, or deployed website tested. The 4,000-level stack result is a local Node observation, not a universal recursion-depth guarantee.

## Additional audit targets (NOT asserted bugs)

Before changing algorithms, check: exact branch identity through tangency and coincident curves; constrained-ray parameter migration for existing v1 JSON; negative-scale transformed-ray direction; hit-testing/rendering of infinite primitives at extreme zoom; non-collinear triangles under rescaling, translation and near singularity; errors/rollback when derived geometry becomes undefined during drag; undo/redo after high-depth imports; desktop keyboard vs pointer vs touch gestures; isolated-point and high-frequency intersection completeness; extremely large `pointSize` and panel labels; bulk selection and dense SVG redraw; export geometry equivalence when Fit clips; 2D screen anchors owned by hidden/locked objects; transformed-circle and transformed-polygon measurements. These have **not** been reproduced in this cut and must not be labeled confirmed or fixed.

## Handoff for next rounds

Proceed section by section rather than rewriting the model wholesale. First make the P1 oracles green using focused changes and verify old v1 save/load, compatible glyphs, and original Round 71 2D, Diagram and 3D behavior. Keep the rest red until independently corrected. For each fix capture a minimal pre-fix red case, post-fix green case, full Node, and actual Chromium interaction. Update `USER_REQUIREMENTS.md`, `KNOWN_ISSUES.md` and `TEST_REPORT_CURRENT.md` cumulatively. **Round 72 itself changes documentation and pending tests only.**


## Post-audit status (Round 73, 2026-11-14; historical discovery facts above unchanged)

**Confirmed fixed (3 original audit IDs): R72-04, R72-06, R72-07.**
The Round 73 focused intersection solver also corrects the newly discovered tiny point–circle incidence near miss, and preserves distinct genuine near-tangent roots instead of merging them using a fixed 1e-7 world-unit deduplication threshold. Tests are now in `tests/round73_analytic_intersections.test.mjs` and `tests/browser_round73_analytic_intersections.py`; successful legacy v1 import/save/reimport is tested. The other **9 R72 IDs remain open**. `round72_points_lines.pending.mjs` now reports **3 PASS, 8 RED** rather than 11 RED. The original discovery provenance (11/11 RED when recorded above) is retained intentionally as a historical snapshot.

The repaired solver intentionally leaves unsupported near-tangent *crossing branches under moving anchors* unchanged (R72-08). New creation of missing intersections is rejected by the editor before append; legacy saved `generalIntersection` objects that become undefined under corrected numerical tolerances are preserved in imported JSON v1 with a null resolved point and no rendered marker. Other invalid project references, indices, and object types are still rejected. No glyph, point-schema, stroke, or export-format change.


## Historical-to-current status addendum (Rounds 73–75)

This document preserves the **original pre-repair Round 71 failures** and unmodified red evidence. They are not claims of active failures on the current release. **Round 73 closed R72-04/06/07. Round 74 closed all nine others: R72-01/02/03/05/08/09/10/11/12.** The original `round72_points_lines.pending.mjs` now passes 11/11 and the Chromium Fit test passes. The originally reported incorrect label-width warning also no longer occurs for wide geometry. Regression details are in `TEST_REPORT_CURRENT.md` and `round74_points_lines_repairs.test.mjs`.

The **new Round 75 audit** is independent and **still deliberately RED**: consult `ROUND75_POINTS_LINES_FOLLOWUP_BUG_AUDIT.md` for 10 different examples. In particular, a 1,500-deep *polyline* transform stack is **not** the now-fixed 4,000-deep *point* transform stack, and transformed *polyline* Fit is **not** the now-fixed Fit for distant points and exact affine circles.
