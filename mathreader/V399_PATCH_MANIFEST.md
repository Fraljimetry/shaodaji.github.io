# MathReader v399 — root patch manifest

Baseline: full v398 tree. Archive paths are rooted at `mathreader/` and may be extracted over existing project root.

## Changed and new files

- `mathreader/OCR_EXPORT_CORPUS_v399.md`
- `mathreader/REGRESSION.md`
- `mathreader/index.html`
- `mathreader/js/00-core.js`
- `mathreader/js/40-outline-structure.js`
- `mathreader/js/41-equations-bibliography.js`
- `mathreader/mathreader.css`
- `mathreader/mathreader.js`
- `mathreader/regression/ahlfors_toc_source_pages_v399.json`
- `mathreader/regression/v399_followup_rechecks.json`
- `mathreader/regression/v399_gate_results.json`
- `mathreader/regression/v399_seven_full_exports.json`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/export_settings_browser_v397.py`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/full_exports_outline_v399_regression.js`
- `mathreader/tests/full_exports_proof_precision_v399_regression.js`
- `mathreader/tests/historical_appendix_results_v395_regression.js`
- `mathreader/tests/historical_bibliography_v394_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/real_export_index_precision_v392_regression.js`
- `mathreader/tests/settings_text_orphans_v399.py`

## Gates and limitations

- 44/44 JavaScript regression suites passed; key source-replay and original PDF.js item tests passed.
- All 17 existing/new Python browser tests passed in individual executions; aggregate runner had intermittent P1/context OCR menu issues and did not achieve a single reproducible all-green execution. This is recorded in `OCR_EXPORT_CORPUS_v399.md`.
- `node --check` and clean ZIP replay are verified in release preparation.
- Native text-detection evidence is not full image OCR; no production OCR mathematical accuracy claim.
