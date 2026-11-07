# MathReader v397 root patch — Export data preferences

**Baseline:** v396, **next:** v397; apply the ZIP at the website/repository root, preserving the existing `mathreader/` directory. It is a patch, not a full source replacement.

## Scope

- Settings → Export data, two independent local-only preferences, detection ON by default, full-document text OFF.
- Existing Export button; JSON schema `mathreader.reading-data@1` unchanged; a new `exportLayers` manifest and optional `fullDocumentText` block.
- Suppress automatic detectors in *both* `contentDetection` and nested `session` when detection is disabled; preserve personal reading state and manual structure/equation edits.
- When full text is disabled, avoid all-page OCR/native text evidence extraction; when enabled, retain available raw text, geometry and saved OCR evidence, serialize page arrays incrementally, and report missing/partial OCR accurately.
- No changes to Tesseract/Texify settings, detection heuristics, OCR cancellation, navigation, formula recognition or imports of earlier exports.

## Test gates

- 42 JavaScript suites passed; 14 Python/Chromium suites passed; see `regression/v397_execution_results.json`.
- Real Chromium Settings checkbox, saved-preference restoration, light/dark appearance, narrow viewport; PDF/OCR engines simulated or not loaded for these browser tests.
- Direct export assertions (107), v393 raw-evidence assertions (37), v396 Stop OCR and prior appendix/structure/equation regression suites all passed.
- Node syntax checks for all component JS and the dynamically assembled runtime.
- Clean patch application, ZIP test and SHA-256 byte comparisons performed at packaging.

## Unverified and known limitations

- Production end-to-end OCR against original Giusti/Yau PDFs and Texify recognition accuracy are not claimed.
- Full-text JSON with very large 1000+ page PDFs can still require substantial in-memory page data. Incremental Blob serialization reduces large synchronous stringify stalls, not overall evidence memory usage.
- Manually selected Structure entries marked `userEdited` survive reading-only exports; unmarked historical personal corrections may be indistinguishable from automatic detection. For a comprehensive backup, keep detection enabled.

## Changed/new files (relative to website root)

- `mathreader/OCR_EXPORT_OPTIONS_v397.md`
- `mathreader/REGRESSION.md`
- `mathreader/index.html`
- `mathreader/js/00-core.js`
- `mathreader/js/60-notes-bookmarks-data.js`
- `mathreader/js/70-command-ui-runtime.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v397_execution_results.json`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/export_settings_browser_v397.py`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/raw_detection_export_v393_regression.js`
- `mathreader/V397_PATCH_MANIFEST.md`
