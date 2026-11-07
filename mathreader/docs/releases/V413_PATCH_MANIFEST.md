# MathReader v413 — changed-files-only root ZIP patch

Apply over the fully installed **v412**, preserving all unaffected source files. This is **not** a complete replacement archive.

### Corrections
- Correct genuine named theorem/lemma/proposition/corollary headings with no text-layer gap after a closing parenthesis; preserve exact PDF page positions and reference exclusions.
- Strengthen narrowly observed explicit declaration evidence for chapter-local reused theorem numbers.
- Increment Results index cache from 53 to 54; cache-bust browser assets as 413.
- Add two regression suites, comprehensive original-PDF corpus evidence and release-gate documentation.

### Changed files

- `REGRESSION.md`
- `V413_PATCH_MANIFEST.md` (new)
- `index.html`
- `js/00-core.js`
- `js/41-equations-bibliography.js`
- `mathreader.js`
- `regression/v413_release_gate.json` (new)
- `regression/v413_results_bibliography_corpus.json` (new)
- `tests/equation_progress_regression.js`
- `tests/export_preferences_v397_regression.js`
- `tests/formula_ocr_lazy_regression.js`
- `tests/maintenance_integrity_regression.js`
- `tests/real_export_index_precision_v392_regression.js`
- `tests/results_declaration_reference_v408_regression.js`
- `tests/results_named_boundary_browser_v413.py` (new)
- `tests/results_named_boundary_v413_regression.js` (new)

### Validation

See `regression/v413_release_gate.json` (executed gates) and `regression/v413_results_bibliography_corpus.json` (new source PDF SHA, Results/bibliography before/after and identity limitations). Historical exact export replays unchanged. No production browser OCR/semantic accuracy certification.
