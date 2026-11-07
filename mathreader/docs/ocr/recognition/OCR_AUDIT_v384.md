# MathReader OCR reliability audit — v384

Date: 2026-11-06 UTC. Baseline: **actual v383 ten-part source** reconstructed from the v374 full package and the sequential v375–v383 patches. This is a **code-and-diagnostic audit**, not a claim of fully validated recognition accuracy.

## Scope and risk model

This review traced the following runtime routes:

1. Open/restore a PDF, sample native text quality and choose the document OCR gate.
2. Full-document Tesseract.js OCR: render, overlap prefetch, worker, hOCR parsing, caching, activation, cancellation, text layer, and index rebuilding.
3. User-triggered **Meticulous OCR**: raster page, full-page hOCR, extra equation-margin hOCR, native text, merging, IndexedDB persistence, Structure/Results/Bibliography rebuild, Equation index rebuild, and navigation.
4. Automatic/forced supplemental equation-number OCR: image-backed and gap page plans, OCR crop geometry, numeric retry, confidence/canonicalization, ordering, and user edits.
5. Formula-image Texify: lazy engine initialization, device selection, selected crop, recognition, postprocessing, preview, result/history persistence and document switches.
6. State recovery and cross-document interference; text/OCR cache ownership and storage growth; navigation targets; failure/stop memory handling.

Evidence tiers are kept separate: **confirmed executable source defect**, **source-level regression**, **real Chromium DOM/canvas**, **real PDF + local Tesseract diagnostic**, and **unverified real deployed PDF.js + Tesseract.js/Texify**. The first four do *not* imply the fifth.

## Confirmed defects repaired

| ID | Severity | Mechanism in v383 | Repair in v384 | Regression |
|---|---|---|---|---|
| OCR-384-01 | High | `ensureDocumentTextReady` returned immediately after restoring cached whole-document OCR and never loaded separate manually verified page OCR records. After reopening an OCR-backed PDF, page-level meticulous evidence could silently disappear. | Restore `manualIndexOcrPages` before text/index activation in the cached-full-OCR branch. | Executable async restore branch, `ocr_reliability_deep_regression.js`. |
| OCR-384-02 | High | `mergePageIndexOcrEvidence` appended all `words` on *every* meticulous scan even when identical. Each repeated scan grew the IndexedDB payload and subsequent OCR text layer workload. | Deduplicate word observations by normalized text plus fine page-relative bbox; preserve identical words at distinct locations. | Eight consecutive repeated merges, repeat-position control. |
| OCR-384-03 | High | Old page text lines with `ratio=1`, affected by the previous reset-canvas bug, remained in the additive records when a newly scanned, geometrically valid identical line existed. | Repair *only* exact text + matching horizontal placement with a new measured vertical position; discard the geometry duplicate, not the recognized text. Keep distinct repeated lines. | Old erroneous page-ratio upgrade, distinct-position control, Chromium hOCR parser. |
| OCR-384-04 | High | Saved image-margin evidence did not fix an *already-present* label. `buildEquationLabelIndex` inserted it only when `index.has(label)` was false; canonicalization could prefer a stale native-text location. | Append same-label verified margin evidence to the candidate set, and prioritize a genuine valid `meticulousPageVerified` position during canonicalization. The label remains one indexed label. | Source-level append rule + executable canonical candidate ordering. |
| OCR-384-05 | High | A long-running formula Texify inference (or its image-comparison preparation) could complete after another PDF had been opened and commit results/notifications/history to the wrong file. | Capture exact `pdfDoc` and `currentFileKey`, discard late completions/errors after a switch, and check source result identity across asynchronous image decode. | Deferred-Promise real function tests for original and image-comparison recognition. |
| OCR-384-06 | Medium–High | If full-document OCR failed or was stopped after next-page prefetch, one active rendered canvas and one speculative rendered canvas could stay live until GC, potentially tens of MB each. | Explicitly release active and prefetched private canvases on success/stop/failure, including prefetched render settling. | Real `runFullDocumentOcr` function with injected recognition failure after prefetch; both canvas dimensions return to 1. |
| OCR-384-07 | High | Tesseract's full-text-only fallback fabricated line positions when hOCR was unavailable. The equation-margin indexer could treat those synthetic y-ratios as verified navigation, even after the v383 canvas fix. | Explicitly mark text-only fallback line geometry as estimated; never promote such lines as margin equation evidence; prefer fresh actual-hOCR geometry over older cached margin coordinates for an identical label. | Real Chromium DOMParser/canvas fallback test and executable canonical preference test. |

The v383 **source-canvas/denominator** repair remains in place; v384 addresses collateral states and consumers of those coordinates. No change to Texify model, token cap (512), crop/beam/quality policy, automatic OCR scheduling, page order, OCR whitelist, or Tesseract model download endpoints.

## Tests and evidence

### Runtime/static

- `node --check` for bootstrap and all ten source modules.
- Assemble the ten shared-lexical-scope source modules **in manifest order** and run `node --check` on the resulting `.mjs`.
- Run every `mathreader/tests/*.js` independently, including **new** `ocr_reliability_deep_regression.js` (34 source-executable assertions, including async races, repeated merge and worker failure).
- `ocr_browser_geometry_regression.py`: 13 assertions inside actual headless Chromium using real DOMParser and canvas; the worker and PDF page renderer are deliberately mocked.
- Existing responsive/browser-shell and P0/P1 gating tests; see attached audit outcomes for accurate statuses.
- ZIP integrity, no absolute paths or unexpected top-level files, changed-file manifest.

### Original PDF diagnostics (Tesseract outside the site)

| Original file | PDF page | Native text | Local Tesseract observation | Limitation |
|---|---:|---|---|---|
| Enrico Giusti (1984), *Minimal Surfaces and Functions of Bounded Variation* | 20 | (1.4) absent, (1.5) present | Full-page OCR missed (1.4), left-margin OCR read it; (1.5) read | Local desktop Tesseract, not browser Tesseract.js; not full-formula truth |
| Same | 24 | (1.7) absent | Neither full-page nor either 28% margin crop read exact (1.7) in this diagnostic configuration | A true recognition miss remains; index-only patches cannot invent the label |
| Manfredo do Carmo, *Riemannian Geometry* | 10 | No embedded text | 1,092 characters after trimming leading/trailing whitespace from raster OCR | No independent word or formula accuracy assessment |

Record-level sample provenance, PDF hashes, literal tests and measured durations are in `regression/ocr_v384_pdf_samples.json`. Do not report the above as 50-old-book testing: the 50-book catalog in the previous partial audit was a *candidate* corpus, not 50 downloaded and executed PDF tests.

## Outstanding issues — explicitly not certified

1. **P0: True browser model integration.** No genuine full-document Tesseract.js and Texify inference on original 50+ books, side-by-side with human-verified full mathematical ground truth. Web CDN/model artifacts were not available in this audit environment. Browser-shell and isolated DOM/parser checks are only partial gates. Real equation-to-formula pairing, paper structure, bibliography completeness, false positives, end-to-end P0 truth and performance remain unverified.
2. **P0: Mathematical recognition itself.** Giusti (1.7) did not survive the tested local OCR configuration. Missing glyphs, matrices, subscripts, fraction layout, scanning defects and poor PDF font maps remain unresolved recognition problems. Never fill equations by sequential label arithmetic alone or call syntax compilation semantic correctness.
3. **P1: Estimated hOCR fallback geometry.** `pageRecordFromHocr` retains an approximate line-position fallback when no hOCR bboxes are returned. v384 now **marks** those text-only positions as estimated and prohibits equation-margin promotion; ordinary full-page fallback text can still feed Structure/Results/Bibliography/search with rough positions. A future change should page-only-navigate unlocated text through **all** index/search routes, after an explicit compatibility regression, rather than silently treating estimated coordinates as measured.
4. **P1: Mixed numbering margins / scanned-document supplementary OCR.** Global `equationNumberingSide` may misclassify documents with variable left/right numbering; whole-document OCR mode does not automatically run the *native-mode* supplemental equation-margin inventory. Forcing both margins everywhere raises false-positive risks. Test left/right and mixed-numbering corpus with verified labels before changing policy.
5. **P1: Additive index false positives and matching.** Exact preservation of historical results also retains old false positives. The current line matching is geometry-heuristic; a changed OCR spelling, a rotated page, a two-column page or repeated textual rows can require manual correction. Preserved entries are not automatically marked mathematically verified.
6. **P1: Metadata/portable-index transition.** Importing detections and then enabling whole-document OCR invalidates/rebuilds some derived indexes; confirm all original and manually corrected entries survive. The v384 cached-OCR fix protects the separate meticulous page record, not every possible portable-data transition.
7. **P1: Large-page/long-PDF coverage.** Automatic image-margin recovery is intentionally bounded (e.g. long books); it cannot guarantee 100% equation inventory. Full-document OCR remains costly and may require explicit user activation. Audit worst-case memory/time on 300+ page scanned books.
8. **P1: Cache corruption and quota failure.** IndexedDB read/write failures log warnings; per-document OCR and index consistency under quota pressure/crash require real browser failure injection. A save failure should not falsely claim durable re-open behavior.
9. **P2: Additional graphic cases.** Rotated/cropped PDF pages, odd Unicode, hOCR with zero/no bboxes, multi-column reading order, handwritten notes, rare typography and scan skew need independent corpus tests. Handwriting is best-effort; printed mathematical text requires human-verified targets.

## Permanent policy and acceptance gates

1. **Never overwrite a previously verified manual detection merely because another OCR pass fails to see it.** Replacement of bad *coordinates* is permitted only with fresh measured geometry and exact label/evidence correspondence; count records separately from recognition accuracy.
2. **Reruns must be idempotent**, including text lines, margin equation labels, indexed rows and word lists. Detect numeric order and landing-position failures, not just labels.
3. **All asynchronous OCR commits must be scoped to the exact source document and current OCR result**, including late errors. Cancelled/failed scans must not publish incomplete derived indexes.
4. **Always release private page/crop canvases** on stop and failure; do not mutate caller-owned canvases before extracting coordinate denominators.
5. **Restore independently cached OCR evidence together:** document OCR cache, meticulous page cache, manually edited indexes, and document-specific reading state.
6. **Regression input must mix old/new, image-only and unreliable-native-text PDFs** across branches of mathematics; paired formula/text recognition and manual mathematical truth are required. Geometric analysis should be only a minority/control, not the whole corpus.
7. Source tests and locally simulated browser tests may pass while **genuine PDF.js + Tesseract.js + Texify** remains **UNVERIFIED**. Keep this status explicit, and record unresolved cases permanently in the packaged Markdown.

## Reproduce locally

From the repository root in a checkout of this patched source:

```bash
node --check mathreader/mathreader.js
node --check mathreader/js/00-core.js
node --check mathreader/js/11-formula-vector.js
node --check mathreader/js/41-equations-bibliography.js
node mathreader/tests/ocr_reliability_deep_regression.js
python mathreader/tests/ocr_browser_geometry_regression.py
python mathreader/tests/ui_responsive_regression.py
python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir ./mathreader-audit-v384
```

The last command's P0 full-document acceptance **must** remain `INCOMPLETE` without a real-original-PDF manifest and truth/captures. Do not use its exit code alone to claim OCR recognition accuracy.
