# MathReader v434 — Comprehensive Settings functionality audit (2026-11-11)

**Baseline:** the user-provided v433 archive `mathreader(20261111-223505).zip`. The patch is a changed-file overlay under `mathreader/`, not a whole application directory. No Git commit, reading-data schema migration, model inference, or automatic detector threshold change.

## Reproduced issues and changes

1. **Display → Reset display (single-page to continuous).** The original reset assigned `readingFlow = 'continuous'` *before* calling `setReadingFlow('continuous')`. This made `setReadingFlow()` follow its unchanged-mode branch, exposing the continuous surface before the normal transition could prepare it. Reset now preserves the departure mode until the existing asynchronous transition captures its anchor, prepares the destination, and swaps surfaces. Appearance, spacing, shadow and zoom-step defaults are unchanged.
2. **Formula OCR → Image OCR engine (WebGPU).** The WebGPU q4f16 selection explicitly contained an automatic CPU fallback. A failed GPU initialization could therefore run a different engine without the user's consent. The WebGPU plan now contains only the selected GPU backend. A failure remains visible, PDF reading stays available, and the user can explicitly switch to **Default · Texify CPU** or reset the selected engine. Error instructions and the bilingual Tutorial use the actual UI labels. This is **not a claim that Texify formula transcription became more accurate**.
3. **Content Detection → action availability.** The Settings rebuild button did not reflect an index already rebuilding; the margin-scan button did not track the corresponding Equations scan's busy state. These actions now disable when unavailable/busy and become available again afterward. The initial PDF control enablement also checks that usable text exists. Both actions remain *explicit*, and a view filter never rewrites detector data.
4. **Settings persistence errors.** The previous Settings writes used a generic local-storage helper that swallowed `setItem()` failures. A user's control could appear saved but revert after refresh. Display, Content Detection, OCR preferences/engine, and Export settings now share a Settings-specific save helper that shows one visible warning per uninterrupted storage failure. Successful writes clear the warning latch. No global document-cache storage behavior was changed.

## Audit coverage

- **Display:** continuous/single buttons; reset including transition ordering and default restoration; zoom-button step in both directions; page tone; brightness; contrast; page spacing; shadows; DOM/CSS effects; browser-local restore; malformed settings validation.
- **Formula OCR:** image/vector selection and storage; explicit CPU/WASM/WebGPU plans; engine-switch disposal; Reset OCR; crop padding; bounded severe-error retry setting; settings restore. Production OCR initialization and quality checks are covered by existing mocked tests, **not real Texify mathematical-fidelity testing**.
- **Content Detection:** Results and equation-confidence filters; proof-relationship toggle; reset; rebuild and margin-scan click guards; operation-busy states; non-destructive preferences; index rendering integration. No exhaustive precision/recall certification was performed.
- **Export data:** independent detection and full-document-text checkboxes, persisted/restored choices, serializer matrix for all four combinations, no unintended detector rebuild, and import-layer compatibility via legacy tests.
- **UI:** real Chromium DOM/production CSS and extracted production functions/events; 204/240/270/330 px right sidebar in English and Chinese, no horizontal overflow; both Tutorial languages updated.

## Verification

- New `tests/settings_full_sweep_v434.py`: **64/64 assertions PASS** on an offline Chromium harness using real production HTML/CSS, state functions, and event handlers. A stub PDF/engine is used to exercise lifecycle guards; it is not live PDF.js or real Texify inference.
- Production OCR-engine plan and initialization failure tested through `tests/formula_ocr_initialization_regression.js`, with a mock GPU failure verifying one initialization attempt and **no automatic CPU retry**.
- JavaScript: **79/79 individual test files PASS**. Both v433 baseline failures from two legacy `STRUCTURE_INDEX_VERSION = 57` equality checks were repaired to accept the current v433+ schema version 58 without weakening the minimum-version requirement. Version pin assertions were advanced to v434. Production-source JS and the joined ten-part runtime parse successfully.
- Python/Chromium: the initial concurrent run produced 36/38 PASS; two isolated browser fixtures needed the new Settings save function in their harness, then both passed on independent rerun. The final full rerun result is recorded in `regression/v434_release_gate.json`.
- Original PDFs: **not supplied in this archive**, so no new real-PDF loading, page geometry, live text-layer OCR, or mathematical indexing accuracy claim is made. No live Texify inference, CDN/host deployment, or real-model WebGPU support was validated.

## Installation and remaining limits

Apply only the files included in the v434 ZIP to the parent of `mathreader/`. Versioned `mathreader.js` and all ten assembled parts receive the v434 cache key; unchanged `mathreader.css` intentionally stays at v433. Existing PDF data, detector indexes, OCR evidence and user annotations are not migrated or cleared. Browser-local preferences can still fail to persist if the browser blocks storage, but now display a warning. Complex mathematics and PDF geometry require separate original-document acceptance testing.
