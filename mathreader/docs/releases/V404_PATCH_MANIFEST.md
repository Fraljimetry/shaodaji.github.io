# MathReader v404 root-level patch — apply over v403

This ZIP is a **patch**, not the complete application. Authoritative baseline is the user-uploaded v401 ZIP with the verified v402 and v403 patches applied in order. Only the changed or newly added paths below are present.

## Fix

- Restore equation-margin evidence **after** `loadDocumentState`/text-unavailable clearing, both on PDF open and in on-document Import. Previously the reset immediately discarded the just-restored cache.
- Leave v403 independently persisted IndexedDB page journal, import validation, export settings, mathematical indexing and UI styling unchanged.
- v403 compatibility remains. Browser storage persistence after a real reload is not certified by this source-order repair: the new Ahlfors real-browser `(5)` export still shows zero evidence on v403, and a separate IndexedDB issue cannot be excluded.

## Live evidence

`(3).json`: 49 records, 1,053 lines, 2 annotations. `(4).json`: 172 records, 4,054 lines, 0 annotations. `(5).json` after reload: 0 records. The original saved OCR is byte-for-byte equal as parsed observation records to `(4).json`; the auxiliary merged recovery file preserves the full evidence from `(4)` and newer user session from `(3)`. See `OCR_EVIDENCE_REOPEN_v404.md`.

## Verification

- New test fails against v403 and passes against v404 (11 assertions).
- 48/48 JS suites and 20/20 sequential Python/Chromium suites pass (`regression/v404_release_gate.json`).
- `node --check mathreader/mathreader.js`, `node --check mathreader/js/60-notes-bookmarks-data.js` and all four modified JS test files; ZIP CRC and deterministic clean replay tested for byte-for-byte equality.
- No live production-origin IndexedDB reload claim.

## Changed or new files

- `mathreader/OCR_EVIDENCE_REOPEN_v404.md`
- `mathreader/REGRESSION.md`
- `mathreader/V404_PATCH_MANIFEST.md`
- `mathreader/index.html`
- `mathreader/js/60-notes-bookmarks-data.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v404_release_gate.json`
- `mathreader/tests/equation_margin_restore_order_v404_regression.js`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
