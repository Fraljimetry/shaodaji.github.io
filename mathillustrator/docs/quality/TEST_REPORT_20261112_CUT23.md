# MathIllustrator Cut 23 — v0.24.0: automatic morphism-label avoidance (opt-in)

Baseline: exact cumulative Cut22 overlay; existing 125 Node regression cases. No MathReader application file touched. JSON remains version 1.

## Finding / intervention

Cut22 can route an arrow around nodes and drag labels manually, but two labels from coincident morphisms can occupy identical screen pixels. This creates ambiguous mathematical diagrams. New per-arrow `labelAvoid` is opt-in and defaults off, retaining old appearances. `morphism_label_layout.mjs` evaluates bounded nearby candidate placements against visible node boxes and other visible morphism labels, with **manual labels reserved first**. Screen-space positions are recomputed for SVG/raster output, never persisted as transformed mathematical coordinates. No source/destination reference, label text, arrow path or object ordering changes. Overloaded positions remain visible and are explicitly amber/warned, never silently hidden.

### New second-order tests

1. A selected label's drag handle displays the automatically chosen location. On movement, freeze this visual position into manual offsets before continuing; otherwise the label jumps. A stationary click leaves legacy/fractional values unchanged. Undo and cancellation restore opt-in status and exact semantic data.
2. Enforce `labelAvoid` as an optional morphism-only Boolean in runtime and project JSON schema. Old files without it remain in manual mode.
3. Disable TikZ for automatically positioned visible morphism labels; no lossy fallback. JSON and SVG remain available.
4. Use capped buckets to avoid unbounded index growth under exceptionally long label dimensions. Detect unsolved layouts and document that result.

### Scope / limitations

This is **not** a global graph layout solver or exact TeX font engine. Candidates avoid visible node boxes and morphism labels, not arbitrary arrows, text, point labels or every font-specific glyph. Zoom, fonts and export crops can change the visual position; native JSON is semantic. UI behavior is verified only in isolated Chromium. Cross-browser, real hardware, deployment, real multi-tab atomicity and thousands-of-visible-label end-to-end frame rates remain unverified.

## Test provenance (filled at the release gate)

- Node: 129/129 (125 inherited, 4 Cut23).
- Browser: `tests/browser_cut23.py` performs actual pointer events/import/SVG/JSON/TikZ gating and Undo.
- Other inherited suites, LaTeX, examples and site integration are checked separately against cleanly extracted final ZIP bytes.

### Observed test results

- Direct Node tests: **129/129 PASS** (Cut22 125 + Cut23 4), including the new strict Boolean schema model rules and deterministic layout tests.
- Isolated Chromium editor scripts: **34/34 PASS** after updating an old test selector to use the text **Swap label side** instead of the first checkbox. That first run failed because the new checkbox appeared ahead of the old one; it did not reveal an application defect. Detailed per-script exit codes and elapsed time: `cut23-browser-results.json`.
- New browser test verifies manual-first placement, hide/undo, auto-to-manual pointer dragging and abort rollback, native SVG and JSON export, TikZ gating, **amber unresolved-collision rendering in a fully blocked layout**, and no page errors.
- Benchmarked **180 nodes + 80 labeled arrows** (3 warmups, 12 samples/mode): median 12.25 ms manual / 12.95 ms automatic SVG rebuild. This is a single synthetic run, not a proven multi-device throughput improvement. Full distributions: `cut23-performance.json`.
- Site + two `pdflatex` compilations + schema fixtures + package checksum history: documented as clean-extraction release checks.

### Remaining caveats

- Automatic avoidance considers node boxes and morphism label rectangles, not every mathematical object, and is only approximate because of browser text metrics. When no candidate clears the occupied area, the label stays visible with an amber unresolved-collision status.
- Layout recomputes for each viewport and may change with zoom, crop, font fallback or browser. For publication compare the final SVG/raster output with the editor. The native JSON remains the only lossless semantic source.
- HTML page loads via `page.set_content()` do not certify the actual hosted URL. Real multi-tab lock atomicity, physical touch, Firefox/Safari, accessibility and full mathematical coverage remain unverified.

### Late export-gating refinement (verified before packaging)

A final review found that a morphism could have `labelAvoid: true` with `text: ""`. There is no visible label to reposition; the first preflight nevertheless disabled TikZ. The preflight now rejects only *visible labeled* auto-morphisms, and the Cut23 Chromium test checks that an unlabeled flagged arrow does not trigger a false disabled state. Existing tests verify that a visible labeled auto arrow still disables TikZ.

### Final clean-extraction checks

- The cumulative 202-file archive with 200 SHA-256 payload checks and all Cut02–22 historical path coverage was extracted and validated. After this late refinement, the archive is rebuilt and checked again before release.
- Complete isolated-Chromium editor matrix: 34/34 passed in bounded test batches; one aggregate invocation timed out, and its unfinished cases passed when run independently.
- Bilingual homepage and Tools page: 8/8 Chromium desktop/mobile and English/Chinese scenarios passed using the actual original stylesheet and locale script. Static integration link/path checks passed.
- Four historical example JSON documents pass the version-1 JSON schema; morphism-only `labelAvoid` is schema-valid, and the same flag on a node is schema-invalid.
- Actual `pdflatex` compiled both supported representative TikZ and semantic tikz-cd exports. Unsupported visual auto-label placement remains explicitly gated.
