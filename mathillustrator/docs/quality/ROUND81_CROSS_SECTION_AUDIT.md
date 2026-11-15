# Round 81 — cross-section second-order audit (discovery only)

**Baseline:** authoritative user-supplied `mathillustrator(9).zip` (Round 76) plus the previously issued Round 77, 78, 79 and 80 overlays, in that order. All source changes from previous rounds are retained. **This round changes no application source, glyph, layout, JSON format, or exported file.**

## What is verified

Sixteen independent, deterministic, source-reproduced pending assertions were added as `tests/round81_cross_section_audit.pending.mjs`. All sixteen **currently fail**, as expected for a discovery-only audit. Do not include the file in the normal green `*.test.mjs` suite; move/promote tests one at a time as fixes land. Numerical assertions use finite values and documented, valid geometric inputs. Some cases intentionally stress scale invariance far beyond ordinary on-screen drawing; distinguish numerical mathematical correctness from pointer hit-target limitations.

### Ranked confirmed defects

| Priority | ID | Section | Confirmed result and reproduction | Cause / repair boundary |
|---|---|---|---|---|
| P1 | R81-08 | General intersections | A point at `(0.5, 5e-7)` is reported as intersecting a spline whose only segment runs `(0,0)` to `(1,0)`. | `generalCrossings` sampled point/path incidence uses absolute `<1e-6` world distance; replace with a representation-aware incidence rule without changing point hit testing. |
| P1 | R81-09 | General intersections | Point `(1+5e-11,0)` is falsely on the unit circle. | Point/circle general intersection uses absolute `1e-10` radial allowance; separate strict mathematical incidence from UI snapping. |
| P1 | R81-10 | 3D domain coloring | Setting `heightMode='argument'` on a valid `z` plot leaves initial `zMin=0`; sampling clips every negative-phase face. | Domain plot is initialized with nonnegative modulus bounds; reconfigure/calculate signed z range on mode changes without changing legacy scenes unexpectedly. |
| P1 | R81-11 | 3D domain coloring | A validated domain plot with `colorMode='solid'` still emits many different phase colors; sampled mesh has >1 color. | `parse3D` calls `domainColor` for solid, which falls through to the phase-modulus palette; choose the requested constant surface color. |
| P1 | R81-01 | Circle inversion | Inverting `(1e-10,0)` through circle radius `1e-5` about origin should return `(1,0)`, but returns `null`. | Hard-coded `d²>1e-18` rejects a finite representable image. Fix with overflow-safe relative domain checking. |
| P1 | R81-02 | Circle inversion | Valid radius `1e-10` / point `(2e-10,0)` returns `null` rather than `(5e-11,0)`. | Absolute `radius>1e-9` gate; also inspect analogous `transformCopy` gate before applying same policy. |
| P1 | R81-14 | Ellipse construction | Valid foci `(-1e-10,0),(1e-10,0)` and curve point `(0,2e-10)` fail `focalEllipse`. | `a-c` must exceed an absolute `1e-9`; inconsistent with recently scale-corrected circles. |
| P1 | R81-15 | Legacy ellipse compatibility | A nondegenerate 2-corner ellipse spanning `[-1e-8,1e-8]` samples to just **two opposite corners** (a diagonal) instead of a closed curve. | `r50SourceShape` falls back to line on `rx<1e-7 || ry<1e-7`. Keep true limiting-line handling but respect valid small ellipses. |
| P1 | R81-03 | Parabola | Focus `(0,1e-10)` with directrix `y=0` produces an empty path. | Absolute focus/directrix separation `<1e-9`; additionally audit sampling span and near-focus curvature. |
| P1 | R81-04 | Hyperbola | Distinct foci `±5e-10` and on-branch point `(6e-10,0)` produce an empty path. | `c<=1e-9` and `a<=1e-9` absolute cutoffs, despite Round 80 validation for ordinary scale. |
| P2 | R81-05 | Hyperbola | Foci `±10` and a valid near-perpendicular-bisector branch point `(1e-10,1)` produce no path. | Absolute semimajor-axis lower bound; test degeneracy against relative precision and branch-identity stability. |
| P2 | R81-06 | Constrained points | Projection onto a valid `1e-10`-long segment returns `null`. | `projectToCurve` discards segment lengths `<1e-9`. |
| P2 | R81-07 | Constrained points | Interpolation at `t=0.5` on the same segment returns `null`. | `alongCurve` uses another hard-coded length floor (`1e-10`). Both constraint helpers need a shared scale contract. |
| P2 | R81-16 | Reflection | Reflecting `(2e-10,1e-10)` about line `(0,0)->(1e-10,0)` yields `null` rather than `(2e-10,-1e-10)`. | `unit()` rejects a nonzero direction shorter than `1e-10`; also affects perpendicular/angle helpers. |
| P2 | R81-13 | 2D domain coloring | A valid, very thin region returns `limited=true` with an enormous image height (~`3.2e301`), not a bounded image dimension. | Aspect ratio calculated before guard and returned directly; cap/normalize requested output size even for budget-limited responses. No massive allocation observed in this test. |
| P3 | R81-12 | Complex arithmetic | `parseComplexExpression('z^0')(0,0)` returns `[NaN,NaN]`, rather than constant `1` under the polynomial / exponent-zero convention. | General complex power follows `exp(0*log(z))`, which is undefined at zero; handle the zero exponent separately while specifying a deliberate `0^0` convention. |

**Priority definitions:** P1 = wrong visible mathematical result or rendering mode; P2 = scale/persistence/edge correctness or unsafe dimensions; P3 = convention-specific mathematical edge behavior. No evidence of security compromise, project corruption, or user data loss from these 16 cases.

### Existing coverage and broader sweep

| Area | Audit method | Outcome |
|---|---|---|
| Points, lines, circles, conics | Inspected model/resolver/geometry contracts; constructed extreme-scale, incidence, and degeneracy cases | R81-01–09, 14–16 reproduced; Round 77–80 repairs preserved |
| Transformations and constrained paths | Algebraic expected-image, nearest-point and interpolation checks | R81-01/02/06/07/16 reproduced |
| 2D plotting / parser | Inspected strict parser, implicit/vector/domain samplers and limits; constructed complex-zero and narrow-aspect cases | R81-12/13 reproduced |
| 3D plotting | Inspected parse, validation, sampling, clipping, plot initialization and coloring | R81-10/11 reproduced |
| Diagram, morphisms, glyphs | Source-path inspection plus browser hierarchy/style regressions | No NEW deterministic regression confirmed in this pass; previously documented historical scripts remain separate |
| Persistence, exports, undo/redo, application startup | Current full Node suite and actual Chromium smoke including JSON/SVG/PNG/TikZ/tikz-cd, undo/redo | Green baseline; does not imply exhaustive external file compatibility |
| Performance and stability | Checked bounded sampler returns, 3D mesh sampling on reproduction cases and extreme aspect ratios | R81-13 confirmed dimension contract failure; no OOM observed |

### Second-order risks requiring new investigations (NOT confirmed bugs)

- General intersection root identity under animation and branch swapping for sampled curves; high-value moving-anchor Chromium oracle.
- 3D argument coloring phase-wrap discontinuities and z auto-fit after mode changes, including saved project reload.
- Near-zero transformations applied to *whole curves*, not just points; test singularity splitting and sampling budget.
- Long-duration 3D orbit, cache invalidation and mesh render budget under 3 simultaneous surfaces.
- Local storage behavior on true simultaneous browser tabs; Web Locks fallback is documented best-effort, not a guarantee.
- Touch/mobile, Firefox, Safari, accessibility and hosted cache behavior; not exercised by isolated Chromium.
- More section-specific UI controls and all glyphs are not exhaustively pointer-tested by this sweep. Do not interpret silence as a clean bill of health.

## Test status / evidence

- `node --test tests/*.test.mjs`: **441/441 PASS** on the Round 80 runtime (no Round 81 runtime edits).
- `node --test tests/round81_cross_section_audit.pending.mjs`: **0 PASS / 16 expected FAIL**, each uniquely named.
- Chromium `browser_smoke.py`: PASS (startup, command palette, SVG/PNG/TikZ/JSON, TikZ-cd, undo/redo, property edit).
- Chromium `browser_round76_remaining_points_lines.py`: PASS.
- Chromium `browser_round68_geometry_diagram_hierarchy.py`: PASS.
- Chromium `browser_round63_headless_styles.py`: PASS.
- Full historical Chromium script archive, real cross-browser/touch, live-site HTTP and physical-device testing: NOT RUN in this audit.

### Next repair batches

1. **R82 intersections**: R81-08/09; prove true intersections and nearby non-intersections at varied coordinates without changing UI snap tolerance.
2. **R83 3D domain**: R81-10/11; signed argument bounds, solid colors, saved-mode transitions, real Chromium.
3. **R84 transformations**: R81-01/02/16; inversion/reflect, finite-image and overflow safeguards.
4. **R85 conics**: R81-03/04/05/14/15; align scale policies and preserve degeneracy behavior.
5. **R86 constraints and 2D plotting**: R81-06/07/12/13; verify renderer-scale and dimension limits.

Each repair batch should promote its pending oracle to a normal regression test and retain documentation status. No application fixes were attempted in Round 81.

## Round 82 resolution and audit correction (2026-11-15)

All 16 **corrected** R81 regression assertions now PASS. R81-04's original on-branch point `(6e-10,0)` is on the focal axis beyond a focus, giving the **degenerate** case `a=c`; a valid off-axis point `(6e-10,1e-10)` replaces it. Therefore the original R81-04 input was incorrectly called valid, but the corrected scale-invariant hyperbola test was genuinely red before repairs. The corrected suite is promoted to `tests/round82_cross_section_repairs.test.mjs` and included in routine Node regressions. See `ROUND83_INTERSECTION_FOLLOWUP.md` for newly discovered, still-open second-order defects.
