# Round 83 follow-up discovery — endpoint boundary leaks (CLOSED Round 84)

Baseline: Round 82 plus Round 83 point-incidence repairs. All three cases below were independently reproduced as **failing tests** in `tests/round84_intersection_boundary.pending.mjs`. No Round 84 cases are repaired in Round 83.

| Priority | ID | Reproduction | Root cause and next focused boundary |
|---|---|---|---|
| P1 | R84-01 | `polylineCrossings([[0,0],[1,0]], [[1+5e-10,-1],[1+5e-10,1]])` incorrectly reports an intersection beyond the endpoint | Fixed `1e-9` segment-parameter allowance; replace with representational-scale tolerance and verify endpoint true positives |
| P1 | R84-02 | `circlePolylineCrossings({center:[0,0],radius:1}, [[0,0],[1-5e-13,0]])` incorrectly reports an on-segment circle root | Fixed `1e-12` parameter allowance clamps a genuine beyond-endpoint root; test small circles and terminal tangency |
| P1 | R84-03 | Two analytic lines with a crossing at `x=1+5e-9`, outside a unit segment, still return a root | `generalCrossings` analytic `inside()` retains fixed `1e-8` world allowance; update all related analytic solvers coherently |

Scope boundary: test numerical constructions, not pixel-level pointer selection; retain signed branch ordering and JSON v1 compatibility. Further examine Bezier-line, curve-vs-line and coincident/parallel degeneracies before claiming all intersections are fully audited.

**Resolution (Round 84):** All three counterexamples now pass; six permanent focused tests cover near misses and exact endpoint crossings. See `round84_intersection_boundary.test.mjs`.
