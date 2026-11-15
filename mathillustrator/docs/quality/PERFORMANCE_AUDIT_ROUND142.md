# Round 142 — Current Overall Performance Audit

Date: 2026-11-15. Source: provided authoritative ZIP plus Round 136–141 overlays. **Measurement only; no code changes.**

Environment: local Linux x64, Node 22.16.0, headless `/usr/bin/chromium`, Playwright, 1440×900 viewport. Browser tests run on an isolated inline copy of the actual application, **not** hosted deployment. WebGL2 unavailable; 3D UI follows CPU/SVG path. All timings are observations on this machine, not guaranteed budgets or physical-GPU performance. Browser wall time includes input automation, rendering and settled check; app status times are internal rendering figures.

## Browser observations

| Workload | Measurement | Observed |
|---|---|---|
| 2D import 40 points | 3 trials, median / max | 40.09 / 89.95 ms |
| 2D import 120 points | 3 trials, median / max | 64.19 / 79.79 ms |
| 2D import 240 points | 3 trials, median / max | 61.14 / 74.81 ms |
| Diagram: 2,520 labels (2,400 offscreen) | 12 warm redraws, median; max | 9.6 ms; 14.5 ms |
| Diagram: 48 nodes + 80 morphisms | 12 redraws, median, avoid / avoid-crossings | 3.60 / 3.85 ms |
| Diagram: 180 nodes + 80 morphisms | 12 redraws, manual / auto labels | 11.2 / 17.3 ms |
| Diagram: 16 nodes + 20 arrows | 12 redraws, direct / scene crossings | 1.5 / 1.1 ms |
| Single 3D surface, detail 22 | isolated browser, wall / internal render | 198–213 / 57–60 ms |
| Single 3D surface, detail 80 | isolated browser, wall / internal render | 1,110–1,124 / 959–969 ms |
| Single implicit 3D surface, detail 32 | isolated browser, wall / internal render | 1,631–1,678 / 1,495–1,526 ms |
| Single 3D vector field, detail 22 | isolated browser, wall / internal render | 181 / 6 ms |

Browser: zero page errors in isolated 3D cases. For import: all nine samples <2,000 ms configured benchmark budget. Browser startup was observed once at 2,499 ms using `set_content` and wait-for-control, including fixture/module evaluation; it is **not** a network page-load metric. 3D scenes were also sampled cumulatively and were slower (detail 80 in 2-plot scene about 1,946 ms; implicit third plot about 2,085 ms), but those comparisons are confounded by scene size.

## Node CPU 3D projections

Round125 benchmark (cold/warm, ms): surface detail 72 **57.71/29.70**; implicit detail 56 **231.05/38.95**; vector detail 64 **0.96/0.23**; complex domain detail 64 **68.73/14.64**. Warm cache reported zero expression evaluations in all four cases. Projected cache total about 5.3 MB, below the configured 224 MiB limit.

Round103 5-iteration benchmark passed its 1,500 ms per-scenario budget: surface detail 24 cold/warm-p95 **14.32/5.04 ms**; domain detail 48 **34.39/13.66**; implicit detail 32 **115.91/21.35**.

Cache-stability benchmark: 72 projections / 24 scenarios, median 2.41 ms, heap 5.16→22.99 MiB, peak 28.31 MiB, peak estimated mesh cache 3.78 MiB, passed its own assertions. **No GC available**, therefore not a leak-certification test.

## Not passed / incomplete

- The archived `browser_gpu3d_acceleration.py` fails a status-text assertion: it expects `CPU SVG fallback`, but the current render info says `1 3D plots · 935 ms`; polygons are present (12,800), WebGL2 is false. A subsequent diagnostic run fails the test's mock-GPU activation assertion. This is an **unresolved integration-test mismatch**, not GPU verification or proof of a GPU rendering defect.
- Native hardware GPU, hosted page network load, long interactive FPS, multi-minute drag/rotate traces, large-scale 2D import beyond 240 points, 3D high-resolution domain coloring, mobile responsiveness under intensive loads, and browser-heap leak testing were not measured in this pass.
- The initial vector-field probe mistakenly supplied all three components in one input; it created zero plots. The corrected isolated run supplied `command`, `command-y`, and `command-z` and successfully created one plot. Only the corrected value is reported above.

## Priority conclusions

1. Highest observed latency: **implicit 3D and dense 3D surface rendering on CPU/SVG**; prioritize real GPU validation and progressive draw scheduling.
2. Automatic diagram label avoidance has ~1.54× the measured redraw cost of manual mode for the benchmark scene (17.3/11.2), though both are near a 16.7 ms 60 Hz frame budget; CPU redraw timing is **not** true FPS.
3. 2D modest-scene import, offscreen culling, and mesh-cache reuse behaved well in these scenarios.
4. No application code was changed; performance optimization should follow a reproducible target-machine baseline.
