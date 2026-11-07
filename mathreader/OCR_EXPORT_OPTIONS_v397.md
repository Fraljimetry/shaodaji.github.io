# Export data settings — v397

## User-facing behavior

MathReader Settings → Export data contains two independent checkboxes. The reading-data JSON export (and toolbar button) remain the same. Default detection=ON, full-document text=OFF. Preferences are stored locally under `mathreader-export-v1`, global to the browser, and are not imported from other users' JSON.

| Detection | Full text | Export fields |
| --- | --- | --- |
| Off | Off | `document`, `session`, `exportLayers`; reading-only session, with user edits |
| On | Off | Above plus `contentDetection` and portable automatic index snapshots in `session` |
| Off | On | Reading-only session plus `fullDocumentText`, `documentOcr` when stored |
| On | On | All layers |

`contentDetection` contains Structure, Results, Equations and Bibliography output labels, positions and compact supporting details. `fullDocumentText` contains page-complete available native text and detector input evidence, not the PDF binary. Per-page metadata explicitly identifies native text/OCR provenance, unavailability and errors; `documentOcr` is the single non-duplicated full OCR cache. A separate OCR operation is **never** started by selecting an export option. Original hOCR markup, original PDF image pixels, and Texify crop images are not stored and cannot be reconstructed from these exports.

`fullDocumentText` replaces the v393–v396 export field name `rawDetection` in *new* exports; both older and new files have unchanged schema `mathreader.reading-data@1`. The importer ignores raw diagnostic fields in both generations and accepts `documentOcr` only when included and valid. With detection OFF, automatically inferred structure/Results/equations/bibliography are removed *both* from top level and session; user-selected Structure nodes marked `userEdited` and manual equation/embedded outline corrections survive. Some unmarked historic manual Structure edits cannot be distinguished from automatic index entries; users requiring exact Structure backup should leave detection ON.

## Safety and performance

An export captures checkbox preferences once, checks the same PDF object and SHA ID after async reads, and restores the Export button state in `finally`. Missing/failed per-page native reads yield `complete:false` plus error provenance rather than an incorrect success label. For full-text exports, JSON is serialized as Blob parts, yielding after eight pages instead of one gigantic stringification. This reduces a potential UI block but has not been benchmarked under very large (1000+ page) books. No fallback OCR, remote calls, or new page renderers are introduced.

## Acceptance checklist

- All four independent combinations with `exportLayers` truth table.
- No detector text leaked via `session` when detection OFF; manual corrections and notes retained.
- No all-page text extraction or detector rebuilding in reading-only export.
- Full-text partial extraction, missing OCR cache and cross-PDF switch guarded.
- Incremental serializer JSON roundtrip on 30 pages, Blob download and URL release.
- Repeated browser toggle, local preference restore, theme and mobile viewport.
- v393 raw-export tests, existing structure/equation/appendix/Stop OCR regressions retained.

## Remaining unverified

Real-browser full export of the 253-page Giusti and 73-page Yau PDFs with installed PDF.js/Tesseract workers, main-thread wall-clock/memory profiling, and manual reimport of a scan-backed document with OCR cache disabled were not performed. Release gates are source and simulated-browser verification, not OCR accuracy measurements.
