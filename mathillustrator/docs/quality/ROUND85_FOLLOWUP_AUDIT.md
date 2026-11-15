# Round 84 follow-up discovery — precision and tiny primitives (OPEN)

Baseline: authoritative Round 76 source, sequential Round 77–83 overlays, and Round 84 endpoint fixes. Three counterexamples reproduced as intentionally failing tests in `tests/round85_cross_section_followup.pending.mjs`. Application source **has not** been modified to address these discoveries.

| Priority | ID | Reproduction | Impact and repair boundary |
|---|---|---|---|
| P1 | R85-01 | `r50SourceShape` for `rectangle` with opposite corners `[0,0]` and `[1e-10,2e-10]` returns `[]` instead of five closed path vertices | Fixed `1e-9` width/height threshold rejects valid rectangles. Audit rectangle construction, dynamic side objects, and saved tiny rectangles together before changing tolerance. |
| P1 | R85-02 | `generalCrossings` on two derived `midpoint` singletons at `[0,0]` and `[5e-18,0]` returns a false intersection | Representational floor in derived-point coincidence tolerance merges separately representable objects. Audit exact point identity and operations that introduce rounding. |
| P2 | R85-03 | Circle radius `1e-12` against segment at `y=1.000005e-12` returns a spurious tangent at `[0,1.000005e-12]` | Fixed `1e-3` floor in `distanceEpsilon` exceeds actual radius separation. Audit circle-vs-path and analytic line-vs-circle near-miss tolerances together. |

All three cases are deterministic pure-geometry reproductions; do not confuse them with pixel hit-testing or visual antialiasing. Other speculative issues are NOT counted as confirmed. Next round should fix these together as a focused world-scale geometry pass and add Chromium coverage for constructions when practical.

## Round 85 resolution (CLOSED)

R85-01/02/03 now pass. Two-anchor tiny rectangles require strictly positive width/height, derived singleton intersections require exact coordinate coincidence, and the shared world-distance epsilon now scales with the actual finite input magnitude rather than a fixed `1e-3` floor. Three assertions promoted to `round85_precision_repairs.test.mjs`. See living [`BUG_REGISTER_AND_DEBUG_ROUTE.md`](./BUG_REGISTER_AND_DEBUG_ROUTE.md) for consolidated statuses and future debugging route.
