# MathIllustrator Cut 24 — v0.25.0: earlier-arrow crossing reduction and export-state reliability

Baseline: exact cumulative Cut23 root overlay (202 files). Scope: app under `mathillustrator/`, plus unchanged root homepage/Tools integration pages. MathReader application code untouched. Native JSON project schema **remains version 1**.

## Reproduced defects / gaps

1. In Cut23 obstacle-aware routing checks visible node rectangles but does not compare arrow paths. A simple crossing of two otherwise node-clear arrows remains uncorrected. New mode adds bounded crossing-reduction without silently changing existing documents.
2. The first bounding-box implementation incorrectly discarded a proper crossing between a vertical and a horizontal segment because one bounding-box axis had zero width. Corrected, and added an explicit red/green geometry test.
3. Routes were evaluated separately for arrow rendering and label packing, which risks mismatches when route selection depends on earlier arrows; Cut24 builds a single order-stable route map reused for both.
4. `draw(exporting:true)` could overwrite the editing-only automatic label-position map. Cut24 keeps it local during export; the on-screen drag-handle map updates only for non-export renders.
5. The old 53%-width routing selector truncates longer options on narrow panels; Cut24 gives the routing selector a full-width Properties row and a concise caption, with the detailed meaning kept in the adjacent hint.
6. Large graphs must not claim crossing-free output after only a partial search. The new safety budget is 128 prior arrow paths and 8192 segment-pair comparisons per candidate, with a visibly warned amber `capacity` status.

## User-facing changes

- Properties → Arrow routing: `Direct / curved (legacy)`, `Avoid diagram nodes (two-turn)`, and `Reduce earlier arrow crossings (best effort)`.
- New optional `routing: "avoid-crossings"` is morphism-only. Default and historical v1 files unchanged; invalid values reject at JSON runtime/schema import.
- The new route considers earlier **visible** arrow paths; curved predecessors use a bounded 12-segment polyline approximation. Direct/legacy routing and arbitrary object references remain unmodified.
- If a two-turn route cannot clear crossings, is node-blocked, or reaches a safety limit, the path becomes dashed amber with a descriptive SVG `<title>`. It does not disappear or silently claim success.
- SVG and raster use the display route. TikZ visual output is explicitly disabled for unsupported screen-space crossing-aware routing. `tikz-cd` remains semantic, not exact visual layout.

## Red/green and second-order coverage

See `cut24-regressions.json`: strict interior X/perpendicular intersections vs endpoint touches; selector width on the Properties panel; no changes to previous modes; X with constrained corridors; deterministic choices and unchanged semantic refs; partial-work capacity; hidden earlier arrows; UI Properties/undo/redo; SVG/JSON/TikZ gating; rejected imports; label/export consistency.

## Test provenance and performance

- Node regression: **136/136 PASS** (129 inherited + 7 Cut24) against the Cut24 working tree.
- Isolated Chromium scripts: **35/35 PASS** (including all available inherited editor tests), with per-script timings in `cut24-browser-results.json`. `browser_cut09_multitab.py` is excluded because this environment blocks its secure-origin navigation; this exclusion is not a PASS.
- New browser test verifies actual UI, SVG export, JSON, Undo/Redo, hidden predecessor recomputation, invalid import, and safety-limit warning. No browser console page errors.
- On a deterministic 48-node / 80-arrow scene, 3 warmups + 12 synchronous Chromium redraw measurements: node-only Avoid median **7.75 ms**; crossing-aware median **7.90 ms**. See full raw data in `cut24-performance.json`. This is not end-to-end frame time, nor a claim of 60 FPS or general scalability.
- Clean ZIP, site links, LaTeX compilation, four JSON fixtures and checksum gates are recorded at final packaging; a local browser is not a deployed-site test.

## Known limitations

This is not planar graph layout or an exact font engine. Two-turn corridors cannot always solve even a simple X if four endpoint node boxes occupy all candidate lanes. Proper crossings omit collinear overlaps and shared-endpoint tangencies. Routes are order-dependent, screen-space and can exceed export crop bounds. Complex curved predecessors are sampled rather than intersected analytically. Large diagrams can trigger a visible `capacity` warning. Cross-browser, deployed site, hardware touch, accessibility and real simultaneous-tab storage remain unverified.

## Final extracted-overlay release gate

- Cumulative archive: **212** website-root-relative files, **210** SHA-256 payload checks; required homepage `index.html` and `tools.html` are byte-identical to Cut23, and all historical Cut02–23 paths remain present. No MathReader application files are packaged.
- **136/136 Node model tests** passed from extracted ZIP; all four examples validate against JSON project schema v1 and the new `avoid-crossings` enum is schema-valid only for morphisms.
- **35/35 isolated Chromium scripts** passed in a full clean-extraction sweep before a final *routing-selector width/caption-only* polish. Against the final ZIP bytes, the new Cut24 browser suite, baseline browser smoke, historical Cut07 full-tool inventory, Cut21 routing, and Cut23 label-drag tests all passed. The cosmetic change was also directly asserted by a width check. The original clean run was not a deployed-site test.
- **2/2 actual `pdflatex` compilations** of the supported ordinary TikZ and semantic `tikz-cd` fixtures passed. The new crossing-mode unsupported visual TikZ export is disabled in Chromium.
- **8/8** bilingual homepage/Tools-page cases (English/Chinese × mobile/desktop) passed with the original site CSS and locale script from a local fixture. Those external site assets are not included in this incremental overlay and were not modified.
- Final source integrity is checked with `python mathillustrator/tests/package_integrity.py SITE_ROOT`; complete ZIP CRC was verified. Browser scripts use isolated local Chromium, and physical touch, Firefox/Safari, hosted-site deployment and true multi-tab concurrency remain unverified.
