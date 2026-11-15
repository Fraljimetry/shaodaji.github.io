# Round 85 follow-up: degenerate polygon/quadrilateral shapes (OPEN)

All findings reproduced on the Round 85 repaired source by `node --test tests/round86_degenerate_shapes.pending.mjs` (**0 PASS / 3 intentionally FAIL**).

| ID | Priority | Reproduction | Expected / risk |
|---|---|---|---|
| R86-01 | P2 | `r50SourceShape({type:'regularPolygon',sides:5})`, center = vertex = `(2,3)` returns six copies of `(2,3)`. | No valid closed polygon should be generated at zero radius; keep saved project compatibility. |
| R86-02 | P2 | Three-point rectangle anchors `(0,0),(2,0),(1,0)` create five vertices with zero area. | Reject degenerate new shape or resolve to explicit invalid geometry rather than a zero-area closed path. |
| R86-03 | P2 | Parallelogram anchors `(0,0),(2,0),(1,0)` create a zero-area closed path. | Same consistency rule for collinear geometry; preserve valid small-scale cases. |

**Not fixed this round.** Audit the new-construction guard and dynamic invalidation separately in the next focused cut. These are pure geometry regressions; UI construction acceptance and import behavior have not been established.
