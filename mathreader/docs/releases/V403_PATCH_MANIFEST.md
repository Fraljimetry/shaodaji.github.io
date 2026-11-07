# MathReader v403 root-level patch manifest — apply over v402

**Authoritative baseline:** uploaded `mathreader(20261107-014000).zip` (v401), plus verified `mathreader_v402_patch.zip`, then this v403 patch. Not a complete application replacement.

**Reproduced:** the two real Ahlfors exports share PDF SHA-256 ID and 172 PDF pages, but lose all 172 equation-margin page records (4,054 OCR lines) on close/reopen/browser reload. The exact old-browser storage mechanism is not determinable from exports.

**Changed production files:** `mathreader/js/00-core.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/js/60-notes-bookmarks-data.js`, `mathreader/index.html`, `mathreader/mathreader.js` (page-journal v2, exact-source readback and bounded timeout, error warning, exact-SHA backup recovery, v1 compatibility, version bump). No CSS or mathematical classifier changes.

**Patch paths** (only changed/new files; relative to ZIP root):

- `mathreader/OCR_EVIDENCE_RECOVERY_v403.md`
- `mathreader/REGRESSION.md`
- `mathreader/V403_PATCH_MANIFEST.md`
- `mathreader/index.html`
- `mathreader/js/00-core.js`
- `mathreader/js/41-equations-bibliography.js`
- `mathreader/js/60-notes-bookmarks-data.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v403_patch_verification.json`
- `mathreader/regression/v403_release_gate.json`
- `mathreader/regression_tools/compare_margin_exports_v403.py`
- `mathreader/tests/appendix_leading_equation_v402_regression.js`
- `mathreader/tests/equation_margin_export_browser_v402.py`
- `mathreader/tests/equation_margin_page_journal_v403_regression.js`
- `mathreader/tests/equation_margin_persistence_v401_regression.js`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/full_text_coverage_v400_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/raw_detection_export_v393_regression.js`

**Verification:** 47 JavaScript and 20 Python/Chromium regression suites (see `regression/v403_release_gate.json`); original 172-page Ahlfors export offline page-record replay and exact hash/geometry comparison; JavaScript `node --check`; root-archive CRC and clean overlay on v402. Production-origin IndexedDB reload test **not run**; it remains a required user-verified acceptance gate. See `OCR_EVIDENCE_RECOVERY_v403.md`.
