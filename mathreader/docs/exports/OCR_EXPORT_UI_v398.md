# v398 — Export Settings layout and four real Giusti export combinations

**Baseline:** v397. **Scope:** compact Settings → Export data presentation; remove automatically generated equation-order snapshots from portable exports when equation ordering has never been explicitly customized. No OCR logic, detection classifier, PDF rendering, or import implementation is changed.

## Real user-export audit (253-page Giusti PDF)

The user supplied four v397 exports from the same SHA-256 PDF, covering every combination. Read `regression/v398_giusti_export_matrix.json` for file SHA-256s, sizes, parsed counts, and evidence. All four `exportLayers` flags matched field presence. The actual top-level `contentDetection` in exports (1) and (3) was identical; `fullDocumentText` in (1) and (2) was identical. The reading-only session was identical between exports (2)/(4); the detection-enabled session was identical between (1)/(3).

| User file | Detection | Full-document text | Bytes | Output evidence |
| --- | --- | --- | ---: | --- |
| (1) | yes | yes | 15,891,884 | 24 headings, 196 Results, 262 equations, 75 bibliography entries; 253 raw-text pages |
| (2) | no | yes | 15,527,429 | 253 raw-text pages; no automatic detection fields |
| (3) | yes | no | 566,620 | same 24/196/262/75 Contents; no full raw-text pages |
| (4) | no | no | 7,222 | reading-only session; no Content detection nor full-text payload |

The full-text exports contain **68,461** original PDF.js text items and **6,282** detector-input lines. In both, `documentOcr` was `null` and `fullDocumentOcr` correctly declared `not-stored`; no source image OCR was recovered or executed during export.

**Newly confirmed bug:** each of the four v397 files also contained 262 `equationManualOrder` keys inside `session` despite `equationOrderCustomized=false`. The list is filled by automatic equation-index generation and ignored by the importer when no manual order exists. It is neither manual reading data nor a meaningful backup requirement. v398 omits it from exported sessions whenever `equationOrderCustomized !== true`, for **both** choices of Detection data. Genuine user drag-and-drop order (`equationOrderCustomized=true`) is preserved. Internal local sessions, existing stored JSON imports and the ordinary equation detector are unchanged. Do not remove `equationEdits`, `embeddedOutlineEdits`, notes or bookmarks.

## Compact layout correction

v397 placed checkbox labels and help text in **five separate grid children**. Parent `.settings-group-body` had `gap:9px`, while `.toggle-setting` had vertical margins and `.display-note` had margin-top:8px. These multiplied vertical gaps, causing notes to float far from the appropriate checkbox, as shown in the supplied 1536px desktop screenshot.

v398 uses two self-contained checkbox/description rows with a consistent 14px control track, 8px column gap, 3px title-description gap and 4px option gap. One short footnote states that reading data is always included and export does not start OCR. The styling is scoped to `#settings-export-group`; other Settings and side-panel layout rules are untouched. Existing checkbox IDs, localStorage preference key, click handlers and English/Chinese translations remain compatible. No new button or section.

## Verification and limits

- Focused v397-based export test extended to **112 assertions**, including the reproduced leakage defect, all four feature flags, document-switch safety, missing OCR caches, streaming, local persistence, manual-edit preservation and custom order.
- **42/42 JavaScript** regression scripts and **16/16 Python/Chromium** regression scripts pass. Full runner ledger: `regression/v398_gate_results.json`.
- Chromium geometry test verifies both titles/descriptions share the intended track, at most 7px vertical separation, tight group height, no horizontal overflow and working click targets in dark/light themes at narrow 220px and 330px viewports.
- `node --check` for bootstrap, modified module and assembled modules; clean ZIP replay and archive integrity must pass.

**Not certified:** deployment/browser cache invalidation at shaodaji.cc, real PDF.js/Tesseract OCR quality, text extraction latency or memory consumption for 1000+ page volumes. The 50-original-book OCR accuracy campaign remains open. These two UI/export corrections do not re-run OCR and cannot improve printed-equation recognition by themselves.
