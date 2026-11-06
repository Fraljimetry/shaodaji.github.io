# MathReader v391 — OCR cache completeness and document identity

**Baseline:** the attached complete v390 MathReader ZIP, inspected as ten source modules.  **Change class:** narrow OCR state-integrity fix, not a new recognition method and not a historical-textbook OCR certification.

## Confirmed v390 failure (executable reproduction)

The existing `loadCachedDocumentOcr()` accepted any nonnegative page numbers whose **distinct Map key count** happened to equal the PDF's page count. A cached record declaring two pages but containing pages **1 and 3** passed the old test `map.size === pdfDoc.numPages`, marked `documentOcrActive = true`, and silently supplied no OCR evidence for actual page 2. A duplicate/missing-page cache was also not individually validated before insertion.

Both cache loaders awaited `dbMetaGet()` but subsequently referred to *mutable global* `pdfDoc`/`currentFileKey` without rechecking original document identity. For two PDFs with the same number of pages, a delayed cache read for A could publish A's text into B's current OCR map. The normal `documentOpenBusy` guard reduces the likelihood in the ordinary UI, but the cache functions themselves violated the existing asynchronous OCR ownership invariant. A source-executable delayed-Promise test reproduces this behavior independently of a specific PDF or an OCR model.

Before the fix, `node mathreader/tests/ocr_cache_identity_v391_regression.js` failed on its first malformed-cache control (`out-of-range page rejected`). The same test passes after the fix.

## Minimal repairs

1. `loadCachedDocumentOcr` captures the original `pdfDoc` object and exact `currentFileKey` before the IndexedDB read. After `await`, any source-identity change makes this read a no-op. The returned full-document OCR page set must have exactly the expected **one valid, unique, in-range page record per source PDF page**, with array-based line records; otherwise it is rejected as incomplete. A rejected cache does not mark OCR active and the normal document OCR decision path remains available.
2. `loadManualIndexOcrPages` captures the same source identity and stages its restored overlay in a local Map. Only the original active PDF receives that Map after the asynchronous read resolves. Existing support for a partial (page-specific) meticulous overlay is unchanged: valid stored page records can be restored without scanning the full document.
3. No OCR models, OCR engine settings, page rendering, equation label grammar, ordering, user corrections, manual index additions, navigation, sidebars, or reading-state persistence were changed. No OCR cache-key/schema migration is necessary: valid previously persisted evidence still loads, while malformed full-document snapshots are rejected.
4. A version bump to v391 updates the bootstrap and HTML source cache busters. Three preexisting tests that intentionally pinned the previous cache-buster version are updated to v391.

## Executed gates

- **Source regression:** 33 JavaScript regression suites PASS, including 10 new executable v391 cache cases; the v391 cache test failed against untouched v390 as described above.
- **Syntax:** `node --check` for bootstrap, all ten source modules, the new test, and the assembled ten-part module PASS.
- **Chromium, real DOM (simulated PDF/OCR backends):** six browser scripts PASS: v390 right-click menu and OCR-status layout; v387 reading/Contents scroll position; v386 equation-target landing and hOCR geometry; v388 622-entry appendix list/filter; browser hOCR/canvas geometry (13 assertions); responsive shell (176 assertions). These tests do **not** load original PDFs or infer text/formulas with production OCR.
- **Additional independent comparator/isolated P1 tests:** ran the available P0/P1 Python tests; see test log from this build. These are not the pinned browser PDF.js acceptance campaign.
- **P0 combined gate:** `python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir ...` exceeded the bounded execution window (~200 s) in this environment. It is recorded as **INCOMPLETE/TIMEOUT**, not PASS. The individual source/browser tests above are separately verifiable.

## Historical 50-textbook certification: still OPEN

No original mathematics PDF files were included in the v390 source ZIP, and the separate `MathReader_v390_historical_50page_OCR_audit_root_patch.zip` mentioned in the handoff was **not attached as a separate artifact**. The included v389 OCR report/JSON is historical evidence, not the original image corpus. Exact pinned browser `pdfjs-dist@4.10.38` build/worker assets and Texify model files were also not available locally. Public archival PDF catalog pages were located, but no original PDFs could be downloaded into the execution sandbox. Therefore this run contains **zero new original-PDF mathematical OCR evaluations** and **zero newly certified original textbooks**.

The previous 50-page / nine-PDF *diagnostic* Tesseract campaign is not relabeled as a 50-textbook production OCR result. Real Tesseract.js whole-document OCR, Texify image-to-LaTeX transcription accuracy, independent ground-truth recall/precision of all four Contents indexes, and PDF navigation with the genuine PDF.js engine remain **UNVERIFIED**. Future certification must include independently verified original-page image/label/crop ground truth, false positives, scanned vs native text, appendix labels, navigation geometry, repeated meticulous OCR, memory, and cancellation. Any attempts with missing model assets or corpus files must remain blocked instead of being simulated and counted as genuine recognition.

## Exact regression commands (from the enclosing repository root)

```bash
node --check mathreader/mathreader.js
node --check mathreader/js/00-core.js
node mathreader/tests/ocr_cache_identity_v391_regression.js
for f in mathreader/tests/*regression.js; do node "$f" || exit 1; done
python mathreader/tests/meticulous_ocr_menu_browser_v390.py
python mathreader/tests/meticulous_viewport_browser_v387.py
python mathreader/tests/equation_navigation_browser_geometry_v386.py
python mathreader/tests/appendix_equation_sidebar_browser_v388.py
python mathreader/tests/ocr_browser_geometry_regression.py
python mathreader/tests/ui_responsive_regression.py
```

**Permanent invariant:** an async cache read may publish only to its captured PDF object and exact file key. A purported complete OCR cache must enumerate each actual page exactly once; page-count equality by itself is insufficient. A valid meticulous-page overlay may remain partial. These controls must accompany later OCR, caching, multi-file, navigation, and import/export regressions.
