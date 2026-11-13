# MathIllustrator Cut 09 / v0.10.0 — publication and interrupted-work audit

Date: 2026-11-12. Baseline: extracted `mathillustrator_cut08_overlay.zip`; no MathReader source changed. All results describe local Node or isolated Chromium, not the deployed website.

## New distinct issues, causality and mitigation

1. **MI09-TEX-01 — Silent tiny-geometry collapse.** Baseline `texPoint()` rounded each world coordinate to five decimal places in centimeters. A valid segment from `(0,0)` to `(0.000001,0)` serialized into two identical TikZ endpoints. The new pure `src/export_fidelity.mjs` preflight disables TikZ for visible geometry whose sampled endpoints, edges, thin rectangle/ellipse axes, or regular polygon corners collapse after that exact quantization. It also refuses source coordinates beyond ±300 cm (a conservative limit to avoid TeX dimension overflow). Invisible/hidden objects do not block export; native JSON and SVG remain available. **No claim of TeX numerical certification for all shapes**: typography, optical visibility, TeX engine and arbitrarily long infinite lines still require proof. Tests: `tests/cut09.test.mjs`, `tests/browser_cut09.py`.
2. **MI09-ASYNC-02 — Out-of-date raster download.** Cut08 could finish a delayed PNG/JPEG/WebP encode after a later project edit or pan/resize and download an earlier figure without identifying it as stale. Cut09 associates raster attempts with in-memory document revision, document identity, viewport and export-menu epoch, checks again after SVG decode and after `toBlob`, and cancels stale completions visibly without downloading. Export buttons cannot be triggered twice while an image is encoding. Decode/encoding each have a bounded 15-second failure path; temporary object URLs are released even on failure. Tests: real deferred `HTMLCanvasElement.toBlob` in isolated Chromium, modified scene before callback.
3. **MI09-RASTER-03 — Fractional crop edge.** Cut08 used a possibly fractional SVG page width multiplied by a separate raster scale; rounded Canvas allocation could leave a border pixel at some page/scale combinations. The 2D transform now maps the exact SVG crop width and height to the actual integer canvas pixel dimensions. This change preserves the existing background fill and maximum output limits, but pixel-perfect font equality across browsers is unverified.
4. **MI09-GESTURE-04 — Uncommitted drag on tab blur.** A point drag mutates the scene temporarily before pointer-up, with no undo history entry. Losing focus/visibility previously relied on a browser `pointercancel` which may not fire in every transition; Cut09 explicitly cancels drag and restores the prior point/view before hidden-state persistence. Tests: moved point, synthetic window blur, verified coordinate rollback and subsequent pointer-up no-op.
5. **MI09-EXPORT-05 — Reentrancy, modal close, and timeouts.** Export menu dismissal advances a cancellation epoch so a queued image export does not unexpectedly download after Escape/Close. Encoding-stage timeout does not silently fallback to another format. A subsequent export is still possible. No background computation or async server fallback is introduced.

## Verification provenance

- Node: `node --test mathillustrator/tests/*.test.mjs` 70/70 PASS (9 new Cut09 cases; all previous 61 pass).
- Chromium: `tests/browser_cut09.py` PASS for preflight availability, delayed PNG cancellation, and interrupted pointer drag; `tests/browser_smoke.py` PASS for representative SVG/PNG/TikZ/JSON exports. Additional historical browser scripts and exact clean-extraction results are recorded at release gate.
- Original project v1 JSON/schema is not changed; SVG and JSON exports remain usable for edge-case geometry when TikZ is disabled. No project data is silently normalized or truncated.
- Same-origin real multi-tab automated test `tests/browser_cut09_multitab.py` was attempted using mocked HTTPS requests but navigation was BLOCKED (`ERR_BLOCKED_BY_ADMINISTRATOR`) before execution. Its result is **UNVERIFIED**, not PASS. Existing deterministic storage conflict test remains available.
- Hosted GitHub Pages, Firefox/Safari, physical touchscreen, 3D, Möbius, Ricci flow, true vector PDF, full LaTeX math text, full SVG/TeX layout parity and large-scene 60 FPS remain **UNVERIFIED or NOT IMPLEMENTED**.

## New standing regression requirements

- Test print-coordinate quantization, axis-wise skinny shapes, closing polygon edges, very large visible coordinates, and hidden/zero-opacity objects; an enabled output must not silently lose the mathematical geometry.
- For asynchronous exports, test document edits, view changes, menu close, decoding failure, encoding failure, encoder timeout, and a second export after cancellation. Confirm no unexpected file download, no leaked object URL and no double-start.
- For focus/visibility transitions during a drag, confirm rollback of temporary state, no undo entry and no hidden-tab autosave of transient coordinates. Test cancel then valid drag.
- Cumulative overlay must include `index.html`, **latest root `tools.html`**, every historical Cut00–08 file, both new Cut09 test scripts and pure helper, and this report. No MathReader file is allowed.

## Final working-tree pre-package execution

- **70/70 Node tests PASS** (`node --test mathillustrator/tests/*.test.mjs`): 61 retained + 9 Cut09 cases, including signed-negative-zero numerical equivalence.
- **18/18 isolated Chromium editor scripts PASS** individually under a three-process bounded runner. Includes Cut02–08 smoke, storage, pointer, opacity, property, list and adversarial regressions plus the new Cut09 browser test. Per-script stdout/stderr and elapsed times were collected locally; no skipped browser script is counted in the 18.
- **2/2 actual pdflatex compilation PASS** for browser-generated representative basic TikZ and a semantic `tikz-cd` diagram. This proves compilation of those samples, not universal TeX fidelity.
- **8/8 homepage viewport/language checks PASS** under isolated Chromium (index/tools pages, desktop/mobile, English/Chinese, dark-mode toggle) using retained original-site CSS/JS fixtures. Static site integration passed with original image/script assets mounted outside the overlay. Neither is a deployed-site HTTP pass.
- **Real two-tab scripted HTTPS navigation BLOCKED**, `ERR_BLOCKED_BY_ADMINISTRATOR`; no true multi-tab atomicity claim.
- The project JSON schema/version remains **v1** and is unchanged. The Cut09 source changes are representational/export/interaction-only; four existing sample JSON files must still pass schema and runtime validation from extracted-package verification.
- There is **no new whole-scene performance benchmark** and no claim of 60 FPS, physical print-scale accuracy, or a complete per-feature manual device sweep.

### Retained extracted-browser edge timing note

An initial concurrent execution from the extracted ZIP had **17/18** passing editor scripts: `browser_edges.py` queried an SVG point's bounding box before a delayed redraw had made the circle visible. The same exact extracted code passed when run individually. The test harness was then updated to wait for a visible point before interacting, without weakening the geometry assertions. The complete script was rerun twice successfully. This finding is classified as an intermittent **test timing / asynchronous DOM readiness issue**, not proof of an editor-renderer defect; future concurrent extracted-package sweeps should still be rerun rather than assuming a green historical result.
