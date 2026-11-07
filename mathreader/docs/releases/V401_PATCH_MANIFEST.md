# v401 patch manifest

**Apply over v400**. Root-level ZIP contains only changed and new files, with `mathreader/` folder paths. This is not a full replacement and does not contain user-uploaded PDFs or JSON export payloads.

## Source changes
- `mathreader/index.html`: remove two redundant Export data note sentences, including translated text; advance asset keys.
- `mathreader/mathreader.css`: remove unused note divider/spacing/selectors; keep compact settings alignment.
- `mathreader/mathreader.js`: v401 module version.
- `mathreader/js/00-core.js`: add bounded document-keyed IndexedDB persistence for completed equation-margin OCR observations, strict validation, and cleanup on Forget.
- `mathreader/js/41-equations-bibliography.js`: persist available page observations at end of margin OCR pass; does not change recognition rules.
- `mathreader/js/60-notes-bookmarks-data.js`: read stored observations only for opted-in full-text export; report actual margin evidence coverage.

## Regression and documentation
- `mathreader/REGRESSION.md`, `mathreader/OCR_EVIDENCE_v401.md`, `mathreader/regression/v401_seven_export_evidence.json`.
- New regression `mathreader/tests/equation_margin_persistence_v401_regression.js`, `mathreader/tests/seven_export_evidence_v401.py`.
- Updated version-sensitive JavaScript tests and Chromium settings/no-orphan tests, the raw export test, and v400 full-text coverage shims.
- `mathreader/regression/v401_js_gate.json` and `mathreader/regression/v401_release_gate.json` record executed gates and the one timed-out aggregate Python runner.

## Verification
- 46/46 Node JavaScript suites pass, after updating old version-sensitive assertions.
- 20/20 distinct Python/Chromium suites passed individually: first aggregate runner timed out after 17 completed passes, the other three passed on standalone rerun. The **full aggregate did not complete** and is not represented as having passed.
- 7 source-document pairs/595 PDF pages replayed against their actual uploaded JSON files (both versions), with original file SHA-256 comparison and navigation-coordinate parity; 291 earlier targeted equation-margin pages had no surviving evidence in the new exports.
- All 10 runtime source parts parse individually and as a concatenated logical module; `mathreader.js` syntax passes.
- Live production OCR worker/IndexedDB durability after v401 deployment remains to be checked. This source-level fix cannot reconstruct earlier in-memory OCR evidence that has already vanished. It never runs OCR for export.
