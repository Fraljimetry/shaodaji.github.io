# MathIllustrator Cut 20 — v0.21.0: dense selection and point-label layout

**Scope:** new, verified failure classes in crowded on-screen illustrations. **Baseline:** exact Cut19 ZIP; editable JSON schema remains **version 1**. MathReader and website content are preserved outside the two required root HTML integration files.

## Reproduced baseline failures

- **Unreachable coincident anchors:** Cut19 point picking only returned the closest point. Its tie-breaker always chose the topmost of three identically located points. A red isolated-Chromium test showed `P3 → P3 → P3 → P3` across four Ctrl-clicks. Selection was impossible without the object list, especially with overlapping filled geometry.
- **Overlapping diagram nodes:** topmost SVG hit alone could not directly reach a node behind another. The same browser test now checks that `N2 → N1 → N2` cycles without modifying objects.
- **Label collisions and clipping:** the old renderer always placed all point names at `(x+8,y-9)` regardless of overlap or viewport boundaries. Three coincident points drew three names at one pixel position.
- **Publication semantics:** newly moved labels cannot be faithfully represented by the restricted TikZ exporter, which places them `above right` in world coordinates. The export is disabled where a labeled point uses screen-space avoidance; SVG/raster and lossless JSON remain available.

## Corrections and second-order safeguards

1. **Ctrl-click / Command-click cycles overlap candidates.** Screen-space index returns all nearby points in deterministic distance/stack order. The browser's SVG hit stack supplies overlapping non-point shapes. Ordinary clicking, dragging, Shift/Alt pan, hidden objects, locked-object selection and object-list search continue unchanged. Ctrl-click only selects, never drags an anchor.
2. **Right-panel Point label placement:** `Standard` preserves the exact old display, including for all previous v1 projects. `Avoid nearby overlaps` tests six candidate positions and uses bounded 72px buckets to reduce label/point overlaps and viewport clipping. It never modifies labels, coordinates, object ordering, dependency graph or native JSON data. No collision-free guarantee is possible in fully crowded scenes; label widths use approximations, not browser font metrics.
3. **Model/preset compatibility:** New documents use Standard initially; older v1 projects missing `labelPlacement` default to Standard at validation. Named presets restore Standard; choosing Avoid marks the modified preset Custom. The setting is undoable and validated with an explicit enum (no hidden fallback).
4. **Export restriction:** SVG/PNG/WebP use exactly the same label positions as the current drawing (for the same view and export region). TikZ is disabled if at least one visible labeled point uses automatic layout; other scenes continue exporting normally. This is preferable to silently replacing the layout with TikZ's fixed label placement.
5. **Performance and cache invalidation:** A bounded four-entry LRU caches placement for settled document/viewport keys, so repeated redraws do not pay for the same collision search. **Point dragging bypasses it** because coordinates mutate before revision increments. Model tests verify eviction; the browser checks the label follows an actively dragged anchor and undo restores its project position. Dense candidate searches cap exact comparisons per bucket to prevent quadratic scans. Two rounds of actual 1,500-visible-label timing (uncached then cached) appear in `cut20-performance.json`; these are not a controlled cross-browser FPS guarantee. Large visible scenes can still exceed the frame-time budget.

## Verification evidence

- Cut19 red UI reproduction and Cut20 green isolated Chromium in `tests/browser_cut20.py`.
- `tests/cut20.test.mjs` pure deterministic label, boundary, bounded-cost, and legacy schema tests.
- `tests/browser_cut20_performance.py` paired 1,500 visible-point measurement with 13 samples after warmups, not a global frame-rate claim.
- Inherited model, browser, site, LaTeX and package gates recorded in the final release summary below and machine-readable `cut20-regressions.json`.

## Still outside certification

Label–diagram obstacle avoidance, multiarrow diagram routing, semantic label attachment to a true LaTeX typesetter, automatic overlap resolution when no free space remains, font-exact Safari/Firefox layout, public GitHub Pages deployment, actual simultaneous-tab transaction atomicity, physical touch hardware, and 60 FPS dense-scene interaction. No evidence of those has been inferred from isolated Chromium tests.

## Current acceptance results (working tree, before ZIP gate)

- **116/116** Node test cases passed, including five new label/compatibility cases and one LRU cache case.
- **31/31** isolated Chromium editor scripts passed, comprising all inherited scripts in the retained Cut19 suite plus `browser_cut20.py` (picking, overlap, label placement, export, project persistence, undo/redo, drag-cache invalidation, preset). Exact per-script results are in `cut20-browser-results.json`.
- **Two actual `pdflatex` compilations** passed: geometric TikZ and semantic `tikz-cd`. They do not certify font-exact interchange or every possible figure.
- **8/8** isolated bilingual homepage/Tools viewport/language configurations passed, using original website CSS and locale JS fixtures. `tests/site_integration.py` also passed. This is not a deployed HTTP navigation test.
- All four historical example projects passed JSON Schema; malformed `labelPlacement` enum was rejected.
- Performance: see `cut20-performance.json`. 1,500 visible points have two recorded 13-sample rounds. The first (before settled-scene cache) reported median redraw of 36.3ms Standard / 50.6ms Avoid; the later cache-enabled run reported 23.2ms Standard / 23.4ms Avoid. Runs had differing execution conditions; the difference cannot solely be attributed to caching. Neither implies 60 FPS.

**Still unverified:** Live website, Safari/Firefox, physical pen/touch and accessibility, real multi-tab atomicity, font-exact placements, obstacle-aware arrow routing, arbitrary mathematical text shaping, dense-scene 60 FPS. A full function-by-function audit remains ongoing.

## Extracted-package acceptance addendum

A full **31/31** Chromium script sweep (see `cut20-browser-results.json` for names, timings and output) passed independently against the **cleanly extracted Cut20 overlay** as well as against the working tree. The source files were not changed between these runs; the final archive rebuild updates only release evidence and integrity hashes. The extracted project also passed **116/116 Node cases**, the new overlap/drag browser test, actual `pdflatex` of two representative exported figures, four JSON schema fixtures, 8/8 bilingual responsive site cases using original website assets, and static homepage/Tools-path checks. This remains isolated-browser verification, **not a claim that the public deployed site, Safari/Firefox, real two-tab writes or physical touch devices passed**.

