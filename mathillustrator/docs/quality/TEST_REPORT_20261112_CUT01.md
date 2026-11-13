# Cut 01 · audit, bug fixes and expanded capabilities — November 12, 2026

**Version:** 0.2.0. This document records observed evidence, not a claim that MathIllustrator's full long-term mathematical scope is implemented.

## Test provenance and environment

- Source: extracted previous Cut 00 ZIP into `mathillustrator/`, then modified only this application. All changes compared to Cut 00 for packaging.
- Unit: Node.js 22.16.0 `node --test tests/*.test.mjs`: **25 tests passed; 0 failed**.
- Syntax: `node --check src/*.mjs`: expected PASS for every module; rerun before packaging. JSON: parsed, schema draft 2020-12 checked, examples validated using Python jsonschema. See package verification output for final gate.
- Browser: Python Playwright and locally installed headless Chromium, 1440×900. Because the environment refuses navigation to `localhost`, `file://`, and regular HTTP targets with `ERR_BLOCKED_BY_ADMINISTRATOR`, we used `page.set_content()` with CSS and ES-module imports inlined through data URLs, preserving app logic while avoiding the forbidden navigation. This **is a real Chromium execution of DOM, Canvas, pointer and download logic**, but **not** an HTTP-deployed GitHub Pages smoke test. Both `tests/browser_smoke.py` and `tests/browser_edges.py` pass. They catch page exceptions as failures.
- No claim of Windows Edge, Safari, Firefox, touch-screen, public deployment or visual golden-reference PASS. Those remain required.

## Confirmed Cut 00 defects corrected

| ID | Failure | Fix | Verification |
| --- | --- | --- | --- |
| MI-FIX-01 | Browser `change` handler replaced its own active property input, triggering a DOM child ownership exception | Defer the property control reconstruction to the next animation frame, while committing the model synchronously | Chromium property-change smoke and subsequent mutation |
| MI-FIX-02 | A foreground polygon could intercept selection of its underlying vertex | Add top-layer transparent point hit disks; these are excluded from exports | Chromium drag-over-polygon test |
| MI-FIX-03 | The initial hit-disk implementation mistakenly referenced undeclared `cx` and `cy`, interrupting render | Assign the projected `x,y` values explicitly as `cx:x, cy:y` | Red/green browser reproduction and rerun |
| MI-FIX-04 | Pointer cancellation could commit an unfinished edit | `pointercancel` and lost capture roll back the active point drag; freehand canceled without append | Chromium interruption test, JSON project snapshot comparison |
| MI-FIX-05 | Very deep dependent midpoint chains risked recursion overflow | Iterative validation and cached position resolving | 3,500-midpoint Node regression |
| MI-FIX-06 | Import let malformed diagram reference/style settings through | Explicit type, reference count, label flag, finite coordinate, graph and paint validation | Node malformed JSON tests |
| MI-FIX-07 | Arrowheads ignored per-object edited stroke | Per-object SVG marker colors | Chromium SVG text check |
| MI-FIX-08 | Circle radius and ellipse extent were ignored by Fit | Type-aware mathematical world bounds | Node geometry regression |
| MI-FIX-09 | Export did not distinguish page frame from viewport | Region selection and artboard SVG viewBox crop | Chromium SVG viewBox difference assertion |
| MI-FIX-10 | Unsupported raster encoders were initially offered even when not advertised by Canvas | Probe MIME output capabilities when building export menu; disable unsupported choices, and reject a wrong `toBlob()` type | Chromium PNG pass; JPEG/WebP non-Chromium availability still unverified |
| MI-FIX-11 | Autosave across two tabs could silently overwrite another state | Detect divergent localStorage states; pause saves until explicit reload/overwrite decision | Source checked; race/abrupt-close end-to-end test remains pending |
| MI-FIX-12 | Long edit sessions could accumulate unbounded undo snapshots | Cap to 80 snapshots and evict older ones above 30 MiB | Code and smoke checked; memory pressure coverage pending |

## New tests and features exercised

- New cursor tools: axis-aligned ellipse, cubic Bézier, 3-point angle marker, semantic diagram node and morphism. Model references are live, labels and paint properties editable. A four-vertex rectangle remains ordinary polygon data; no misleading constrained rectangle type.
- New commands: scientific-point literals, `Ellipse`, `Bezier`, `Angle`, `Node`, `Morphism`. Explicit-function safe syntax unchanged; do not treat these as full symbolic algebra.
- Preset-specific right-side toolkits and direct manual visibility, search and expanded property editing.
- Restricted `tikz-cd`: deterministic node/morphism parser, direction/grid checks, label-side round-trip, and disabled export for unsupported shapes or bends. No untrusted LaTeX execution in browser.
- SVG/PNG/TikZ/JSON download via browser integration; image sizes, region and scene feature gate. PDF/GIF/video/Asymptote remain disabled. TikZ is a static geometric depiction, **not** a semantic round-trip of all dependencies.
- Undo/redo across diagram imports; polygon double-click, point dragging through polygon, canceled gestures, lock/deletion behavior; isolated Chromium no page errors.

## Isolated performance evidence

`python tests/browser_performance.py` imported point-only scenes with axes, grid and labels off, on one 1440×900 isolated Chromium instance:

| Point objects | Time to UI object-count update | Most recent SVG rebuild | SVG descendant nodes |
| ---: | ---: | ---: | ---: |
| 100 | 200.6 ms | 5.1 ms | 202 |
| 1,000 | 305.3 ms | 23.6 ms | 2,002 |
| 3,000 | 535.3 ms | 55.3 ms | 6,002 |

This is **one run, one platform, simple points**, not a 95th-percentile statistic. A 3,000-object SVG rebuild exceeds the 16.7 ms frame budget for 60 FPS; the app is not claimed to sustain that speed. True interaction performance and export stress with complex shapes need a second benchmark generation. Full records: `performance.json`.

## Still required before publishing as a mature mathematical illustration product

1. Hosted GitHub Pages / Windows browser load and accurate relative URL/stylesheet/module check; screenshot parity of tutorial and application.
2. Chromium + Firefox + Safari JPEG/WebP/PDF (when implemented), SVG typography and TeX compilation visual round-trip; no unsupported export may show success.
3. Touch/pointer/multi-touch, keyboard-only controls, screen reader audits and narrow-screen layout.
4. Cross-tab storage races, quota/disabled storage, corrupted save recovery, abrupt tab close, import replacement/rollback, rapid undo/redo.
5. 10k mixed geometry, very long paths, mobile memory, viewport visibility, culling and incremental scene diff; target performance numbers must be measured.
6. Real mathematical engine work: geometric constraints/intersections, scientific plotting, Möbius transformations, arbitrary diagrams, 3D, Ricci-flow visualization, animation. None are claimed complete.
