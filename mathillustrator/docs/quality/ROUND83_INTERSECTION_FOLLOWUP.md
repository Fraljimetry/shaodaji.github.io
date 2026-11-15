# Round 82 second-order audit — follow-up bugs (discovery only)

Reproduced on the Round 82 repaired source using `tests/round83_intersection_followup.pending.mjs` (**3 intentional failures**). These defects are new and are **not fixed** in Round 82, to preserve a stable focused repair boundary. They are analytic geometry incidences, not UI pixel hit tests.

| Priority | ID | Confirmed reproducer | Likely root cause |
|---|---|---|---|
| P1 | R83-01 | Point `(0.5,5e-11)` intersecting segment from `(0,0)` to `(1,0)` returns a false root | `generalCrossings` `pointOnLine` has an unconditional `1e-10` distance floor |
| P1 | R83-02 | Point `(1+5e-9,0)` beyond segment endpoint returns a false root | Analytic `pointOnLine` uses `1e-8` endpoint allowance independent of scale |
| P2 | R83-03 | Point `(5e-12,0)` exactly on a `1e-11` spline segment returns no root | Sampled incidence ignores squared length `<=1e-20` |

**Follow-up boundary:** Fix the analytic segment parameter and sampled point-path incidence with floating-point representational bounds, preserve ray/line semantics, and test translated/zoomed microgeometry. Do not change pointer snapping or glyphs. Historical browser assertions may retain old failures and must be distinguished from actual regressions.
