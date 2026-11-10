# MathReader v424 — Reading and navigation lifecycle regression

## Baseline, method and reproduced failures

Authoritative baseline: a clean reassembly of `mathreader_v418_complete.zip` followed, in order, by v419, v420, v421, v422 and v423 overlays. It was byte-for-byte identical to the previously prepared v423 working tree (283 compared files). Original v423 JavaScript regression suite: **70/70 PASS**; all ten subsystem scripts and the bootstrap passed `node --check`.

The new `tests/reading_navigation_races_v424.py` runs actual production navigation/search function bodies in headless Chromium with real scrollable DOM pages and controlled PDF.js/text-layer promises. On unchanged v423, the tests reproduced:

1. A Results/reference/text match with an outstanding animation-frame alignment overwrote a later navigation: the simulated reader was moved from `scrollTop=730` (new jump) to `1300` (old jump).
2. The same stale post-jump alignment occurred for clicking a text-search result.
3. When an old text search completed after a newer search, its rows were appended and its count replaced the newer status (`beta` results mixed with `alpha`).
4. After changing documents, a pending search could populate old-document results/status in the new document.
5. The document-map reset cleared old Structure/Results/Equations/Bibliography rows but **did not clear old search rows/status**, leaving them visible and clickable after switching PDFs.

The corrected test also covers equation bookmarks, equation-search result navigation, a pending inline reference lookup canceled by a document switch, and an ordinary uninterrupted equation bookmark jump. It checks the *production* `clearDocumentMapForIncomingPdf`, `positionTargetAtReadingLead`, `goToEquationBookmark`, `goToSearchMatch`, `goToMatchedLocation`, and `searchPdf` implementations. PDF page data and asynchronous timing are deterministically mocked, not actual publisher PDF parsing.

## General correction

- Track the document identity, flow and expected `readerNavigationSerial` around asynchronous navigation. Reject stale semantic alignment and landing cues after a newer jump, flow change, or PDF switch.
- Apply the same generation check to text-search result jumps, equation bookmarks, and equation-search result positioning; allow active jumps and manual page positions to work normally.
- Ensure pending reference target resolution cannot navigate after a more recent action or document change.
- Give text-search runs a request serial plus PDF identity, so the latest search wins and a previous PDF cannot update the new result list.
- Clear stale search rows/status together with the other document-local navigation indexes when opening a PDF.

Only `js/00-core.js`, `js/50-references-search.js`, and `js/60-notes-bookmarks-data.js` contain changed runtime logic. No changes to mathematical detection, OCR, PDF.js loading, cache/schema versions, reading-data exports, or screen layout. Browser asset version advances from v423 to **v424** to invalidate cached scripts.

## Full regression and evidence

- **70/70 JavaScript source/regression suites PASS**; new Chromium navigation race cases PASS.
- **31/31 Python test files PASS individually or in bounded batches** (including the new race test; final responsive test was run separately after the last batch reached its execution window).
- **176/176 responsive-layout assertions PASS**, nine checked viewport widths (320–1440 px).
- Previous Structure jump positioning, manual Structure Add/Reselect/Remove, equation position and click, OCR initialization, hover lifecycle, continuous page repaint, annotation/export and UI coverage remained green.
- All source modules and assembled ten-part runtime pass syntax checks. Patch is a changed-file-only ZIP with one `mathreader/` root and CRC/integrity and overlay-application verification.

## Limitations / not claimed

These tests use actual browser DOM, scrolling and production JS function bodies, but controlled PDF.js destinations/text layers and network-independent PDF stubs. They do **not** certify an end-to-end live browser run with the exact user's PDF, all PDF bookmark types, OCR model inference, or printed mathematical detection correctness. An invalidated search can still finish its in-flight `pageText()` read before returning, though it cannot modify the visible search results. The previously accepted Ahlfors hard-reload equation-margin OCR evidence limitation remains unchanged.

## Deployment

Extract the `mathreader/` top-level directory from the **v424 overlay ZIP** onto an existing v423 MathReader installation, overwriting matching files; do not delete unrelated files. This is not a complete application download.
