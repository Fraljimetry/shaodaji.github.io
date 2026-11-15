# Round 77 — Circles & Conics discovery-only audit

**Baseline:** user-supplied `mathillustrator(9).zip`, Round 76; source is unchanged in this release. **Status:** 8 independently reproduced, OPEN defects; 1 positive control passed. No application fixes attempted.

**Reproduction:** `node --test tests/round77_circles_conics.pending.mjs` -> **1 PASS / 8 FAIL**, intentionally excluded from green `*.test.mjs` acceptance. Numerical oracles use finite representable coordinates; they do not claim arbitrary-precision support.

| ID | Severity | Minimal input and observed deviation | Expected result / likely focus |
| --- | --- | --- | --- |
| R77-01 | High | Unit circle, infinite horizontal line at `y=1-1e-12`: two roots at approximately `x=±1.4142e-6`, but `intersectLineCircle` returns `tangent:true`. | Preserve distinct secant/tangent classification; avoid absolute squared-radius threshold in `src/model.mjs`. |
| R77-02 | High | Two unit circles with center distance `2-1e-12`: returns duplicated `[~1,0]` and `tangent:true`, omitting roots with nonzero `±y`. | Restore two genuine roots close to contact in `intersectCircles`. |
| R77-03 | Medium | Externally tangent unit circles at centers `(0,0)` and `(2,0)`: `minus` and `plus` both `[1,0]` despite comment that tangency has a unique minus root. | One geometric root; `plus:null`, with downstream branch selection and v1 compatibility tested. |
| R77-04 | High | Same-radius circles at `(0,0)` and `(1e-11,0)`, both radius `1`: resolver returns no intersections because the centers are treated as coincident. | Two almost diametrically opposite roots; avoid distance-relative center-coincidence rejection. |
| R77-05 | Medium | Valid circle with center `(0,0)` and radial point `(1e-10,0)`: `circleGeometry` returns `null`. | Scale-aware nonzero radius policy; coordinate rendering and draggable constraints must be reviewed. |
| R77-06 | Medium | Three noncollinear points `(0,0), (1e-9,0), (0,1e-9)`: `circumcircle` returns `null`. | Finite center `(5e-10,5e-10)` and radius `~7.071e-10`; review absolute length floor without accepting numerically ill-conditioned triples. |
| R77-08 | High | `checkNewGeometry('hyperbola', [[0,0],[0,0],[1,0]])` and third point equal a focus both return normally, though `hyperbolaPoints` produces no drawable curve. | Reject invalid new hyperbolas at creation, preserving legacy project validation behavior. |
| R77-09 | Medium | Near-collinear `(0,0),(.1,0),(.2,1e-10)` is rejected by `circumcircle`, but `circleArcPoints(...,8)` renders 9 points with enormous center/radius. | Shared geometric degeneracy guard and bounded behavior across tools; review `geometry_round50.mjs` `circum` versus `model.mjs` `circumcircle`. |

**Positive control R77-07:** A semicircular three-point arc includes its specified middle point with 24 samples. This passes and is not a defect.

## Coverage / follow-up

Reviewed circle/three-point circle construction and scale floors, circle–circle and line–circle root branches, arc consistency, focal ellipse and parabola/hyperbola generation paths, and v1 compatibility concerns. Additional risk areas for subsequent focused test exploration: smooth motion through tangency, branch identity when centers cross, hyperbola sampled bounds (`cosh(5)` forces an example with foci at `0` and `4` to span over 76 world units), and dependent point-on-curve resolution on approximate polyline samples. These are **investigation leads, not confirmed defect counts**.

**Green baseline:** `node --test tests/*.test.mjs` -> **428/428 PASS**, 26 ES module files individually `node --check` PASS. Actual `/usr/bin/chromium` Playwright tests `browser_smoke.py` and `browser_round76_remaining_points_lines.py` **PASS** (startup, edit, exports, previous circle-regression fixtures, no page errors). A larger optional multi-suite Chromium sweep did not complete within the execution budget; it is **not** claimed as passed. No hosted HTTP, multi-browser, physical touch, full performance, or precision certification. This is discovery-only, so all 8 failing oracles remain deliberately RED.

**Round 78 proposed repair order:** first R77-01/02/03/04 together (shared root geometry and branch semantics), then R77-05/06/09 (consistent scale/degeneracy), then R77-08 (hyperbola construction guard and editing flow). Keep changed glyphs = none, preserve legacy v1 saved objects and test documentation; re-run both green baseline and red-to-green cases after each cut.

## Round 78 follow-up — circle-intersection repair (2026-11-14)

**Resolved:** R77-01, R77-02, R77-03, R77-04. The line/circle solver uses the signed perpendicular distance and factored discriminant to preserve shallow secants. The circle/circle solver rejects only truly coincident centers, uses strict crossing bounds and a factored radical, and reports exactly one root on tangency. Old persisted `circleCircleIntersection` objects with `branch:1` still resolve at tangency, without duplicate public roots. New geometric crossings are represented in source-center orientation; no glyphs or document format fields were changed.

**Still OPEN:** R77-05 (tiny radius), R77-06 (tiny circumcircle), R77-08 (degenerate hyperbola), R77-09 (arc/three-point collinearity policy). Original discovery suite: **5 PASS / 4 expected FAIL**; do not include `.pending.mjs` in the release-green suite. Follow-up rounds must retain these tests until repaired.

**Checks:** Node full `tests/*.test.mjs` **433/433 PASS**, 26 syntax checks PASS, actual Chromium `browser_smoke.py`, `browser_round76_remaining_points_lines.py`, and `browser_round68_geometry_diagram_hierarchy.py` PASS. Three additional historical browser scripts (`browser_round26_closure_circle.py`, `browser_round27_ui_snap_circles.py`, `browser_round50_geometry.py`) fail identically on unchanged Round 76 source (old DOM/glyph expectations); they are **pre-existing** and not certified green. No hosted-site or cross-browser certification. No Git commits.

## Round 79 follow-up — circle scale and 3-point collinearity (2026-11-14)

**Resolved:** R77-05, R77-06, R77-09. A strictly positive finite circle radius is mathematically valid even when below the old absolute 1e-9 world-unit floor. `circleGeometry`, creation guard, analytic line/circle and circle/circle solvers, and the derived affine circle resolver now agree. Exact zero-radius input remains invalid; a very small circle may naturally be subpixel at ordinary zoom (not a rendering defect). The translated, finite circumcircle calculation is now shared with `geometry_round50.mjs`'s arc/triangle-center geometry, using the former model's relative near-collinearity cutoff (1e-9 sine). Both tools reject the same ill-conditioned near-collinear anchors, but accept well-conditioned small-scale triangles. No glyph or JSON v1 format changes.

**Still OPEN:** R77-08 invalid hyperbola anchors, to be repaired in Round 80. The original discovery oracle is now **8 PASS, 1 intentionally FAIL** (the hyperbola case). Five new `round79_circle_scale_collinearity.test.mjs` green regression cases cover tiny circles, zero radius, solver roots, shared circumcircle/arc scale behavior, nearly collinear rejection, document JSON validation and dependent edits.

**Verification:** green full Node suite **438/438 PASS**, syntax **26/26 PASS**, actual local isolated Chromium Playwright `browser_smoke.py`, `browser_round76_remaining_points_lines.py`, and `browser_round68_geometry_diagram_hierarchy.py` **PASS**. These tests exercise actual Chromium startup/exports and existing interaction suites; the new numerical edge cases are tested in Node, not browser UI gestures. The three historical browser suite failures described above remain baseline discrepancies and are not claimed repaired. No hosted-site, Firefox/Safari or physical touch certification. No Git commits.

## Round 80 follow-up — hyperbola creation validation (2026-11-14)

**Resolved: R77-08. All eight Round 77 confirmed defects are closed.** The new-geometry guard uses the same hyperbola sampler as rendering, rejecting coincident foci, third points on focal rays/segment or at either focus, and equal-distance loci (zero semimajor axis). A second-order UI path was addressed: final snapped references, rather than only initial raw pointer coordinates, now undergo the same guard. This prevents invisible new objects when a valid-looking click snaps to a degenerate existing point.

**Compatibility:** Previously saved v1 projects, including hyperbolas that later become geometrically degenerate after a point edit, retain their historical import behavior. `validateDoc` does not impose the new *creation-only* hyperbola rule; original structural checks still apply. No icons, schema fields or migration were modified.

**Verification:** `tests/round80_hyperbola_construction.test.mjs`: 3 new passing tests (six degenerate triples, four valid branch anchors, v1 import/edit). Original Round 77 discovery suite: **9 PASS / 0 FAIL**. Full Node suite: **441/441 PASS**; 26 module syntax checks PASS. Actual local Chromium Playwright: `browser_smoke.py`, `browser_round68_geometry_diagram_hierarchy.py`, and `browser_round76_remaining_points_lines.py` PASS. Chromium suite runs do not include a new end-to-end mouse-gesture hyperbola case; snapped-reference validation is covered by direct source guard and Node checks. Three historical browser scripts remain baseline-failing as noted in Round 78. No deployed-site or other-browser certification.

**Additional audit leads (not counted as confirmed defects):** fixed `cosh(5)` sampling extent, incomplete curve point-on-object semantics for moving anchors, and visual performance at extreme focal distances. Investigate in the next *discovery-only* Circles & Conics pass before making unrelated changes.
