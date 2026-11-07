# MathReader v398 — root-level patch over v397

Only modified/new files are included. No raw user PDFs/JSONs are repackaged.

## Scope

- `index.html`, `mathreader.css`: compact and aligned export checkboxes, concise per-control help, v398 browser cache busting.
- `js/60-notes-bookmarks-data.js`: omit auto-generated equation ordering when no manual drag/reorder exists, preserving real manual order.
- `mathreader.js`: v398 source version.
- Settings/export regressions and version-sensitive checks, complete gate ledger, real four-file export metadata audit.
- Updated `REGRESSION.md` and `OCR_EXPORT_UI_v398.md` explain evidence and remaining limits.

## Exact changed/new paths

- `mathreader/OCR_EXPORT_UI_v398.md`
- `mathreader/REGRESSION.md`
- `mathreader/index.html`
- `mathreader/js/60-notes-bookmarks-data.js`
- `mathreader/mathreader.css`
- `mathreader/mathreader.js`
- `mathreader/regression/v398_gate_results.json`
- `mathreader/regression/v398_giusti_export_matrix.json`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/export_settings_browser_v397.py`
- `mathreader/tests/export_settings_layout_v398.py`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`

## Gates

- 42/42 JavaScript regression scripts.
- 16/16 Python and Chromium regression scripts.
- Extended direct export test: 112 assertions.
- Assembled source plus bootstrap JS syntax checks.
- ZIP CRC and clean replay over v397 verified at packaging.

## Limitations

Real browser PDF.js/Tesseract worker inference, original scanned-text accuracy, and OCR accuracy certification are not part of this UI/export patch.
