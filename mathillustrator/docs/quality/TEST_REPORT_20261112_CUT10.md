# MathIllustrator Cut 10 / v0.11.0 — distinct subtle-risk audit

Date: 2026-11-12. Exact baseline: `mathillustrator_cut09_overlay.zip`. All changes are within `mathillustrator/`, while the cumulative delivery retains existing root `index.html` and the latest `tools.html`; **MathReader source is untouched**. JSON project version remains 1.

## Reproduced defects and second-order fixes

1. **Morphism boundary corruption.** In the exact Cut09 browser, a semantic edge started at SVG x=430.5 while the source node rectangle extended to x=444.5. A fixed 18px trim ignores box width. The Cut10 layout computes approximate node extents, intersects the centerline with both boxes, shrinks cosmetic padding on crowded but non-overlapping nodes, and avoids reversed arrows if boxes actually overlap. The edge remains in native JSON. New unit/browser regressions check two box boundaries, actual overlap recovery, diagonal crossing, multibyte labels; an older property suite initially failed because a 14px gap was over-trimmed. This *red* test led to adaptive margins; it then passed. Complex node text and TeX typography remain approximate.
2. **Excessive function resampling during unrelated redraws.** Cut09 resampled every visible explicit function whenever the user selected an object or reset an unchanged viewport. A new bounded pure plot-path cache keys each result by expression, view center, scale, width and height. It preserves style/selection and resamples after camera/expression changes. Cache eviction is 32 entries / at most 1.2M string characters. The controlled 9-curve benchmark: Cut09 median **3.2 ms**, Cut10 median **1.0 ms** across 15 repeated unchanged-view SVG rebuilds on one isolated headless Chromium host. These are renderer-only milliseconds, not frame times or a promise of 60 FPS.
3. **Huge offscreen SVG line endpoints.** Previously a line between distant anchors was extended by twice the canvas width/height and could yield extreme pixel endpoints under huge camera offsets. `clipInfiniteLine` now intersects the mathematical infinite line with the current viewport and paints nothing when it misses. Source anchors/JSON remain lossless. Tests cover vertical, horizontal, corner, degenerate and far-away cases.
4. **Modal UI inconsistency.** Export previously intercepted Tab/Escape but did not prevent clicks into the underlying editor. Cut10 adds a modal pointer backdrop, Esc/close/outside-dismiss cancellation, and focus restoration after success; the import/export keyboard focus loops are explicitly tested. An older test that clicked the background Save button through an open modal now checks document state without bypassing the modal.
5. **Virtual-list keyboard focus and recoverability.** Moving through items with ArrowUp/Down/Home/End now maintains selected ID and row focus even when virtualization replaces its DOM. Real screen-reader announcements and keyboard-only freehand drawing remain unverified.

## Provenance / release gates

- Model and geometry regressions: `node --test mathillustrator/tests/*.test.mjs`, including `tests/cut10.test.mjs`.
- Real browser engine, isolated inlined DOM: `tests/browser_cut10.py` plus retained `browser_smoke.py`, `browser_edges.py`, `browser_storage.py`, `browser_cut02.py` through `browser_cut09.py` excluding the attempted policy-blocked true multi-tab test. These simulate app operation and file downloads, not real hosted GitHub Pages navigation.
- Actual pdfLaTeX compiler checks, JSON schema/runtime validation of all four existing sample files, `site_integration.py` with original global site assets and eight locale/viewport browser cases, cumulative extracted-package SHA-256 and historical-union checks.
- **Still unverified:** full browser accessibility, Safari/Firefox, physical stylus/touch, genuine two-tab storage atomicity and deployed-site caching; advanced implicit/3D/flow/animation remain unsupported. Do not equate an isolated browser check with a user-device production pass.

## New standing gates

The exact JSON state after a view-only layout optimization must be unchanged, and viewport clipping must not delete semantic objects. Cache invalidation is required on expression and camera/size changes, and cache memory must be bounded. A visual modal must enforce consistent pointer and keyboard isolation; an open export overlay cannot permit background Save/geometry edits. A rejected or overlapping diagram layout may never silently alter the morphism graph. Performance must be compared to prior source on the same scene, reporting all observations.

## Final clean-package verification (from exact extracted cumulative ZIP)

- **78/78 Node tests PASS**, including eight new Cut10 pure tests and all 70 retained model regressions.
- **19/19 isolated Chromium editor scripts PASS** from freshly extracted Cut10 files, including baseline smoke/edge/storage, Cut02–09 browser suites and `browser_cut10.py`. The Cut07 adversarial script was updated to avoid clicking an intentionally modal-blocked background Save control; its semantic state assertions remain unchanged.
- **8/8 homepage/browser cases PASS** (home and Tools, desktop/mobile, English/Chinese) with real original website CSS and language JavaScript, plus site static-link integration PASS.
- **2/2 actual `pdflatex` compilations PASS** (generated TikZ picture and semantic tikz-cd). Compilation only, not screenshot-equivalent proof.
- **4/4 example JSON projects PASS** both JSON Schema and runtime v1 validation. Project format remains version 1.
- **99/99 cumulative root-relative paths PASS**, 97 SHA-256 content checks PASS. Historical Cut02–09 path union covered; no `mathreader/` source is included. Root `index.html` / latest `tools.html` remain integration exceptions.
- **Performance:** identical synthetic 9-curve scene, 15 unchanged-view redraw measurements on each source. Cut09 median 3.2ms, Cut10 median 1.0ms. Full vectors in `performance.json`; not user-device 60 FPS guarantee.
- **Unverified:** actual hosted-site navigation/cache behavior, real same-origin 2-tab storage atomics, Safari/Firefox, touchscreen/pen hardware, screenreader accessibility and all unsupported mathematical modules. The previously blocked HTTPS navigation attempt remains BLOCKED, not PASS.
