# MathIllustrator Cut 12 · v0.13.0 — staged full-function audit, part 1

**Baseline:** exact delivered Cut 11 cumulative overlay (`mathillustrator_cut11_overlay.zip`); all root pages included and MathReader untouched. **No new project JSON version**: version 1 remains the durable editable format. **Environment:** Node.js 22.16.0, local Python Playwright + headless Chromium, Linux container, local `pdflatex`. Browser tests use isolated inlined JS modules; they do not test GitHub Pages or a real HTTPS origin.

## Invariant and red/green findings

1. **MI12-LIFE-001: background tab and unfinished pointer capture.** Chromium proved that `document.dispatchEvent(new Event('visibilitychange'))` reaches `document` but not a listener installed on `window`. The editor had listened on `window`, so the cancellation/last pending save path could be missed. **Fix:** listen on `document`. **Green:** the isolated-browser regression starts unfinished point movement and panning, synthesizes a hidden document event, observes exact return to starting view/object and no subsequent pointer-up mutation. Synthetic hidden events are not proof of real OS suspension, unload or crash handling.
2. **MI12-FIT-002: invisible outliers.** Cut 11 used fully transparent points as bounds contributors, even though the SVG hides them. A point at (800000,900000) could pull Fit away from visible A/B. Edges whose diagram node is hidden or transparent could similarly inflate bounds while their arrow is suppressed. **Fix:** visible-only worldBounds; data/semantic graph unchanged. **Green:** new Node cases for hidden/transparent/no-visible scene and actual Chromium Fit screen coordinates.
3. **MI12-BATCH-003: duplicate work in compound constructions.** Point cursor picking was indexed in Cut 11, but completing a polygon, polyline, or Bézier still scanned every existing anchor for every new vertex. **Fix:** reuse the settled 32px spatial index for pre-gesture vertices, maintaining the strict 12px cutoff and never allowing a just-created point to capture its sibling. **Green:** standalone 2,400-request oracle on an 800-anchor grid, plus exact Cut11/Cut12 reference/new-point comparison with 0 divergence.

## Performance measurement: full-anchor batch only

| Scene | Cut 11 median | Cut 12 median |
|---|---:|---:|
| 6,000 existing points, 1,200 referenced vertices, five headless-Chromium passes | **135.7 ms** | **9.5 ms** |

This measures only synchronous `makeRefs` resolution including one index build, not total GUI frame time, user interaction throughput, arbitrary dense overlapping geometry, cross-device performance, or 60 FPS. Individual samples and fixtures are archived in `quality/performance.json`.

## Verification scope

- **Before change:** Cut 11, 87/87 Node tests passing. New Fit tests initially failed; Chromium reproduced invisible-outlier Fit and incorrect document visibility listener.
- **After change:** **91/91 Node tests**, **21/21 isolated Chromium editor scripts**, plus the new **standalone 2,400-request batch oracle** passing.
- **Regression coverage retained:** tool tiles and commands, drawing modes, freehand, semantic diagrams, object properties/search/virtualization, document and per-object settings, presets, invalid edit rollback, live geometry, undo/redo, JSON open/save, image exports, TikZ, storage conflict simulation, mobile drawer and dialog focus, plotting and caches.
- **Publication/site/package:** actual TikZ compilation of representative examples, four example project JSON schema+runtime checks, static site integration, bilingual homepage tests, package file inventory/SHA must pass from clean extracted final ZIP; see the final release evidence in the accompanying package and quality records.

## Why the audit is intentionally staged

`cut07-control-matrix.json` inventories **152 UI controls/behaviors**, and Cut 12 adds `cut12-function-inventory.json` enumerating named source functions with evidence levels. A passing representative UI workflow does **not** establish complete branch coverage or every control/setting combination. Future batches should target complete Settings cross-products, export golden files, real multi-tab recovery, touch/keyboard accessibility and mixed-scene performance. Those are explicitly **NOT VERIFIED** in this cut. Neither advanced mathematical content (3D, Möbius, Ricci flow) nor native PDF support was added.
