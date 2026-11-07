# MathReader v412 root-level patch manifest

**Baseline**: exact v411 root folder `mathreader/`, assembled from authoritative v405 source and v406–v411 root-level patches. Do not apply this patch to an earlier version. **Deploy**: overwrite changed files at the repository/web root, retaining all other v411 files; no full replacement archive is supplied.

## Changed/added files

- `mathreader/REGRESSION.md`
- `mathreader/index.html`
- `mathreader/js/00-core.js`
- `mathreader/js/41-equations-bibliography.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v412_content_corpus_audit.json`
- `mathreader/regression/v412_release_gate.json`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/real_export_index_precision_v392_regression.js`
- `mathreader/tests/results_declaration_reference_v408_regression.js`
- `mathreader/tests/results_geometry_browser_v412.py`
- `mathreader/tests/results_joined_heading_v412_regression.js`
- `mathreader/tests/results_split_baseline_v412_regression.js`
- `mathreader/V412_PATCH_MANIFEST.md`

## Behavioral scope

- Result declaration detection for joined uppercase mathematical headings and carefully measured split-baseline numbers.
- Exclude prose references (including superscript-interrupted text) that masquerade as new declarations.
- Preserve existing Bibliography, Structure, OCR, equations, navigation, manual annotations and saved reading state.
- Bump Results index version 52→53 and web asset version 411→412 so stale index results are rebuilt.
- Add permanent original-PDF corpus evidence and exact checks; no claims of deployed-browser PDF.js acceptance.

## Release gates and provenance

See `mathreader/regression/v412_release_gate.json`, `mathreader/regression/v412_content_corpus_audit.json`, and leading v412 entry of `mathreader/REGRESSION.md`. These checks distinguish independently printed PDF verification from PyMuPDF-to-PDF.js-shaped simulated input.

**Do not assume** that a missing result number proves an OCR result; no missing equations, Results or bibliography entries are fabricated from numbering gaps. Zero-error accuracy for arbitrary unseen scanned material remains unverified.
