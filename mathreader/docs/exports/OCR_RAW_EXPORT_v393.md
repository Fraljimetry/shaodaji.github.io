# v393 — Export original detection evidence with reading data

**Baseline:** exact v392 clean-replayed source; **release:** v392 → v393 (Beijing UTC+08, 2026-11-07).

## Problem confirmed by real exports

The 73-page Yau (1978) and 253-page Giusti (1984) `mathreader.reading-data@1` files contained `contentDetection` (final Structure / Results / Equations / Bibliography) but `documentOcr: null`. For these native-/hidden-text-layer PDFs, the exports omitted the original PDF.js text items and their geometry. Without the detector input, it is impossible to distinguish poor text extraction from wrong parsing/filtering, or reproduce why a printed equation tag was missed. An empty `documentOcr` is **not** proof that no OCR activity happened: Meticulous OCR and equation-margin image assistance have separate evidence paths.

## Behavior

The existing **Export** action writes a single JSON file with unchanged schema `mathreader.reading-data@1` and all existing `document`, `contentDetection`, `documentOcr`, and `session` fields. A new `rawDetection` block is diagnostic, export-only, optional for older imports, and not used to restore/replace reading state. No new controls are added.

`rawDetection` contains `version: 1`, `pageCount`, an explicit `complete` flag and any `errors`, and one entry per page. Each entry contains:

- `nativePdf.view`, original `nativePdf.items` from PDF.js `getTextContent()` (including original text and transforms), `nativePdf.styles`, and `nativePdf.rawText` reconstructed **in extraction order**, not silently repaired or sorted.
- `detectorInputLines`: the lines actually offered to detection, with recognized text, geometry, and `parts`; `textSource` describes whether the lines came from native text, full-document OCR, or manual Meticulous OCR.
- `meticulousOcr` when a page was manually scanned, retaining Tesseract-derived lines, words, confidences, geometry, and equation-margin evidence.
- `documentOcrPageRef` when full-document OCR already exists; the full OCR record remains in the existing top-level `documentOcr.pages` to avoid duplicating it.
- `equationMarginOcr` only for completed margin-image OCR observations currently available in the per-document in-memory cache, with left/right side provenance. Pending promises, another document's cache entries, and out-of-range pages are excluded.
- `directOcrTextAvailable` when relevant, indicating whether the original Tesseract `data.text` is retained in `ocrRawText` for this OCR record.

New full-document / meticulous OCR runs preserve Tesseract's **original plain-text output** (`ocrRawText`) in addition to the existing normalized lines and word boxes. Older cached scans cannot retroactively supply the original engine plain text; their `directOcrTextAvailable` is `false`. Original raw hOCR markup is **not** retained/exported (size/storage and compatibility risks); `rawHocrAvailable: false` declares this limitation explicitly. Raw mathematical image pixels, original rendered PDF pages, unaccepted candidate traces, and Texify source crops are **not** exported. These are documented gaps, not silently represented as captured evidence.

The export does not run a new full-document or manual OCR pass solely to collect evidence. The existing export-settlement step may still finish its configured equation-index work. Native PDF.js extraction reads every page; the export yields periodically to the event loop. Each failed page extraction is recorded in `errors` with `complete: false` rather than falsely reporting full coverage. A PDF/file change during the asynchronous capture cancels the export without mixing documents. The export remains local; no evidence is uploaded.

**Performance/privacy:** JSON can be substantially larger for long PDFs, and can contain full copyrighted or confidential page text; the user controls the resulting local download. No extra work is performed during ordinary reading, and no persistent native-text copy is added to IndexedDB. The existing 24-page PDF.js text LRU is unchanged.

## Testing and limits

- `node mathreader/tests/raw_detection_export_v393_regression.js`: real function harness, native text, geometry, styles, line inputs, OCR provenance, margin side, wrong-document cache isolation, async document change, partial-read error flags, engine text integrity, and backward-compatible JSON/import path.
- `node --check mathreader/mathreader.js` and compile/check all ten assembled module files.
- Completed: 36/36 JS suites, including 37 direct export assertions; 7/7 Chromium shell/component scripts; 5/5 Python suites; syntax checks of all modules and assembled runtime. See `REGRESSION.md` for scope and limitations.

**Not certified:** accuracy against the two original PDF page images, complete historical 50-textbook OCR campaign, actual PDF.js + Tesseract/ Texify in-browser export of the 253-page book, JSON memory/size on a low-memory device, or replay of rejected internal detector candidates. Both Yau and Giusti should be reopened in v393 and freshly exported to obtain this additional evidence. Older exported JSONs remain valid, but their omitted inputs cannot be reconstructed from the exports alone.
