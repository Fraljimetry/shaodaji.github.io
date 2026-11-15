# Round 75 — post-repair 2D Points & Lines discovery (NO FIXES)

**Audit baseline:** the complete Round 74 repaired tree reconstructed from the user's Round 71 ZIP plus the Round 72 and 73 overlays. **Date:** 2026-11-14. After all nine remaining Round 72 defects were repaired, this second pass deliberately searched for *different*, subtle, scale-dependent or second-order failures. These findings were verified **against the already repaired runtime**. No Round 75 runtime code was changed, no glyph changed, no Git commit made.

**Proof:** run `node --test tests/round75_followup.pending.mjs` explicitly. The suite contains ten mathematical *expected-correctness* checks and currently reports **0 PASS / 10 expected RED**. They are excluded from the `tests/*.test.mjs` release gate. A failure here documents an open defect; it is not an ordinary regression failure or permission to relax the assertion. The measured outputs below were obtained from the actual post-repair Node modules, not inferred from source alone.

## Ten newly confirmed defects (all open)

| ID | Priority | Minimal reproducible case; correct result | Observed post-R74 failure | Root-cause location / evidence |
| --- | --- | --- | --- | --- |
| **R75-01** | P1 | Two distinct points `(0,0)` and `(1e-8,0)` have **no unique common intersection**. | `generalCrossings()` invents `(0,0)` because it considers distinct points equal within a fixed `1e-7`. | `geometry_round50.mjs`, `pa&&pb` / single-point cases; Node RED. |
| **R75-02** | P2 | Point `(0.0010001,0)` lies outside circle radius `.001` and admits **two** different tangents. | `circleTangents()` returns `[]` because `d²-r² ≈ 2e-10` is below an absolute `1e-9` cutoff. | `geometry_round50.mjs:circleTangents`; Node RED. |
| **R75-03** | P2 | A point `(1,0)` **on** the unit circle has one tangent line through the point. | `circleTangents()` returns `[]`. The tangent construction is limited to external points. | Same location, separate boundary-case oracle; Node RED. |
| **R75-04** | P2 | A non-self-intersecting square of side `1e-7` has area `1e-14`. | `polygonArea()` returns `null` because it refuses every area ≤`1e-12`, regardless of scale. | `geometry_measurements.mjs:polygonArea`; Node RED. |
| **R75-05** | P2 | Two perpendicular length-`1e-7` polyline segments centered at the origin cross **once**. | `polylineCrossings()` returns `[]`; its absolute determinant threshold still rejects small (but nondegenerate) edges. | `geometry_round50.mjs:polylineCrossings`; Node RED. |
| **R75-06** | P1 | Polyline with points `(0,0)`, `(100,0)`, `(100,100)`, dilated ×3 about the origin, reaches `(300,300)`; Fit bounds must include that image. | `worldBounds()` gives `maxX=maxY=100`, omitting the transformed curve's extent entirely. | `geometry.mjs:worldBounds` treats generic transformed curves' refs as bounds instead of resolved sample extent; Node RED. |
| **R75-07** | P2 | A point constrained to the ray of a **Fixed angle** may need to travel to distance 100. | `pointOnObject(...,parameter:1,...,'angleRay')` stops at **30**; `r50MoveConstrained()` clamps at `dist/30` and the v1 schema bounds parameter to 0–1. | `geometry_round50.mjs:pointOnObject`, `app.mjs:r50MoveConstrained`; Node RED. The Round 74 ray fix applies to actual `ray`/`line`, not this distinct construction. |
| **R75-08** | P1 | A cubic Bézier whose y-coordinate is `(t−0.5002)(t−0.5004)(t−0.8)` has **three** crossings with y=0 on t in [0,1]. | General Intersection reports only the root near **0.8**, missing both close crossings between adjacent sample ticks. | `geometry_round50.mjs:generalCrossings` with `r50SourceShape(...,160)`; Node RED. Standard fixed sampling is not a complete algebraic Bézier intersection solver. |
| **R75-09** | P2 | A horizontal polyline y=.5 intersecting the exact unit circle has roots `x=±√.75`; each root must satisfy `x²+y²=1`. | `generalCrossings(circle,polyline)` returns `x≈±0.8658268` at radius **0.9998280**, a radial error of roughly `1.72e-4`, because it intersects chords of a sampled circle. | `geometry_round50.mjs:r50SourceShape`/`polylineCrossings`; Node RED. Not a claim that all sampled graphics can be made symbolically exact. |
| **R75-10** | P1 | A 1,500-level chain of identity dilations of a *polyline* must return its unchanged finite vertices. | `r50SourceShape()` throws **RangeError: Maximum call stack size exceeded**; the Round 74 iterative fast path only addresses **point** image chains. | `geometry_round50.mjs:r50Shape` recursively re-evaluates nested nonpoint transforms; Node RED. |

**Cross-section limitation:** R75-08 and R75-09 are precision/topology counterexamples, not an assertion that arbitrary implicit curves, tangencies or coincidences are generally algebraically solvable with the present sampling architecture. R75-03 is a valid geometric tangent but may require a separate UI construction branch. R75-10 is about resolving a sampled *curve*, not the already fixed 4,000-deep *point* chain. R75-06 shows that Round 74 Fit solves wide-separated **points**, not every generic transformed curve.

## How to reproduce safely

```bash
cd mathillustrator
node --test tests/*.test.mjs             # normal green regression, excludes this audit
node --test tests/round75_followup.pending.mjs  # intentionally RED: ten independently checked defects
```

Do not rename the `.pending.mjs` file to `.test.mjs` until working on the appropriate repair. A later repair must add independent normal green regression checks and re-run actual Chromium. The precise numerical output may vary slightly with runtime floating-point implementation; each mathematical conclusion is independent of that variation.

## Follow-up targets not yet established as bugs

- Continuous branch identity for **two sampled** curves with moving control points. Round 74 retains the historical lexicographic root ordering for sampled curves, to avoid changing imported legacy branch indices; only analytic circle/line roots gained geometric orientation ordering. A sampled-curve branch jump is still a risk, not independently reproduced as an additional R75 defect.
- Rendering and hit-testing at ultra-small zoom, especially stroke thickness, wheel-zoom anchor drift and labels outside the viewport after Fit.
- Sign and parameter mapping for negative-dilation or reflected rays with legacy constrained points.
- Local focus changes, drag rollback, Undo/Redo and autosave races during a many-crossings creation event.
- Budgeted intersections with more than 10,000 roots: Round 74 now throws an explicit capacity error during creation instead of returning a silently truncated result; imported historical roots exceeding capacity remain unresolved. This is not proof of responsive behavior at the capacity limit.
- Self-intersections, overlapping collinear arcs, exactly coincident curves, discontinuities and export into TikZ for mixed transformed curves.

**No fixes in this audit phase.** Next repair round should prioritize R75-01 (invented incidence), R75-06 (invisible curve extent), and R75-10 (stack overflow), then target small-scale geometry and sampling limits in separate cuts. Keep the verified Round 74 branch policy and saved v1 references stable.
