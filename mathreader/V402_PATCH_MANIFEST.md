# v402 patch manifest — apply over v401

**Required baseline:** uploaded full-source `mathreader(20261107-014000).zip` containing MathReader v401. This is a **root-level overlay ZIP**, with `mathreader/` as the common prefix. It contains **changed/new files only**, not any original PDFs, full-document JSON exports, local libraries, OCR caches, or a complete replacement tree. Never apply over an older version directly.

## Production changes (3 files)

- `mathreader/js/41-equations-bibliography.js` — add a bounded leading appendix `.1` OCR gap query for native `.2`/`.3` same-page four-member families; persist exact manual meticulous margin observations and enforce async identity checks.
- `mathreader/mathreader.js` — advance the assembled application version and part URLs to v402.
- `mathreader/index.html` — v402 runtime and stylesheet cache keys. **No CSS or visible UI redesign.**

## Test and audit changes (15 files)

- `mathreader/tests/appendix_leading_equation_v402_regression.js` — v401 failing/v402 passing appendix and manual OCR evidence tests (15 assertions).
- `mathreader/tests/equation_margin_export_browser_v402.py` — Chromium with actual export/cache functions and explicitly mocked PDF/IndexedDB (6 assertions).
- `mathreader/regression_tools/equation_margin_indexeddb_browser_v402.py` — optional actual IndexedDB origin/reload harness; **BLOCKED by local browser navigation policy in this environment**.
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/ocr_reliability_deep_regression.js` — update obsolete cache-key assertions and isolated v396 cleanup mocks; no change to the production cancellation implementation.
- `mathreader/REGRESSION.md` — permanent v402 policy, regression results, exclusions and known limitations.
- `mathreader/OCR_EVIDENCE_AND_APPENDIX_v402.md` — original-PDF evidence, source-level reproduction, metrics and unresolved risks.
- `mathreader/regression/v402_js_gate.json` — final 46/46 JavaScript suite results and output excerpts.
- `mathreader/regression/v402_release_gate.json` — exact multi-gate status; first aggregate failed; one Chromium retry; unavailable live-browser work.
- `mathreader/regression/v402_original_pdf_evidence.json` — source SHA-256 and two inspected original printed pages.
- `mathreader/regression/v402_synthetic_benchmark.json` — explicitly synthetic cache benchmark.
- `mathreader/V402_PATCH_MANIFEST.md` — this file.

All unchanged files remain authoritative v401 bytes after overlay.

## Verified gates

- Final 46/46 Node regression suites **PASS**.
- 20/20 distinct Python/Chromium suites **PASS across a first sequential run plus one isolated rerun**. The first aggregate was 19/20; `p1_browser_smoke.py` failed once, then passed (36 assertions) in isolation. Do **not** call the first aggregate a pass.
- Original Giusti/Ahlfors PDF image/native-text forensic checks and offline Tesseract margin proxies executed, **not** a production PDF.js/Tesseract.js/Texify acceptance.
- Both the bootstrap and 10 source JavaScript parts pass `node --check`; assembled runtime parsing, root ZIP CRC, and exact clean overlay replay are recorded in the release-gate audit.
- No successful real production/browser IndexedDB round-trip was established here. See `OCR_EVIDENCE_AND_APPENDIX_v402.md`.
