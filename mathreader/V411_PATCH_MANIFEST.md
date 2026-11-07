# MathReader v411 — root-level differential patch manifest

Apply over **exact v410** (original v405 source plus cumulative v406–v410 ZIP overlays). This archive contains changed files only, never a full replacement tree.

## Fix

- Manual Equations → Add and Reselect now use strict **two-dimensional** glyph-level hit-testing, not a nearby vertical-text search.
- On Giusti PDF page 20, the printed `(1.4)` is absent from the native text layer, while `(1.2)` appears in prose above. Clicking at `(1.4)` must prompt for `(1.4)`, then add it at the clicked position **without moving `(1.2)`**.
- Never allow Add of an already indexed label to overwrite the existing location, even for imported historical manual edits. Reject duplicates from clicks, typed text, and selected text; use Reselect for an intentional relocation.
- Preserve page/zoom/reading position, existing manual edits, OCR worker behavior, data formats, Results and Bibliography. Browser cache keys move v410 → v411.

## Changed files

This manifest is verified against the intact v410 baseline in the release gate. See the full list below (must match ZIP members).

- `mathreader/REGRESSION.md`
- `mathreader/V411_PATCH_MANIFEST.md`
- `mathreader/index.html`
- `mathreader/js/20-selection-annotations.js`
- `mathreader/js/41-equations-bibliography.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v411_giusti_p20_click_evidence.json`
- `mathreader/regression/v411_release_gate.json`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/manual_appendix_equation_v405_regression.js`
- `mathreader/tests/manual_equation_click_precision_v411_regression.js`
- `mathreader/tests/manual_equation_click_browser_v411.py`

## Verification boundaries

Red on v410 / green on v411; 56/56 JavaScript regression suites and 24/24 Python/Chromium suites. These include real browser event tests with controlled PDF text geometries but do **not** constitute live deployment acceptance with Giusti's PDF loaded into MathReader. Do not describe manual equation correction as automatically recovering missing OCR labels.
