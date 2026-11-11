# MathReader v431 — Comprehensive reading, detection, and Formula OCR regression sweep

**Baseline:** reconstructed v430 original source. **Install:** ZIP with changed/new files under the single top-level `mathreader/` folder. No deletions, no full application replacement. Date: 2026-11-11.

## Baseline and scope

The complete v430 source was inspected before changes; the untouched baseline passed **77/77 JavaScript test files** and **33/33 Python/Chromium files**. The sweep inspected reading and navigation, two-column Structure/Results/Equation/Bibliography detection, TOC/reference links, text search, selection-related tests, export/persistence, image Formula OCR quality/retry rules and bilingual documentation. It also re-executed the production JavaScript detector stages, using PyMuPDF-native text geometry proxies, on **41 available original PDFs / 2,039 pages** (123/123 stages completed). This is not an image-OCR pass and is not 41 independent page-by-page accuracy certifications.

## Reproducible defects

1. **False cross-column Search hits.** Previous releases made TOC and backlinks column-aware, but `searchPdf` still searched the flattened full page. On a true two-column page, independent words from the left/right sides could form a false phrase, while a genuine phrase wrapping across two lines *within one column* could be missed. `tests/search_multicolumn_fuzzy_v431_regression.js` reproduces the baseline defect, checks correct same-column wrapping, and verifies incomplete-page reporting. `tests/search_stoc_native_v431_regression.js` verifies the new projection against actual exported PMESTOC25 PDF.js text items for sections 2.1 and 2.5.
2. **Fuzzy-search results lacked an exact visual target.** The matcher allowed a misspelled query but the click handler then looked for that *misspelling* in the rendered PDF text layer. Repeated phrases in two columns were further distinguished only by ordinal, which does not reliably correspond to visual reading order. The patch retains the actual approximately matched words and measured source line geometry, chooses the nearest rendered occurrence, and preserves the older ordinal fallback when the layer has not laid out. `tests/search_fuzzy_geometry_v431.py` exercises real Chromium DOM Ranges, duplicate phrases in opposite columns, and a hidden-layout fallback.
3. **Incomplete searches looked complete.** A PDF text-page extraction exception was logged but the result count still appeared exhaustive. The status now reports the number of inaccessible pages. It does not invent missing matches or silently change OCR engines.

## Implementation boundaries

- Changed `js/50-references-search.js` only among production detector/reader modules. The search-only `searchPageRuns` projection uses column-local lines **only when two columns are independently supported by multiple substantive geometrical lines**. Single-column documents, manual/full-document OCR, and uncertain layouts retain the prior text path. There is no document-specific title or PDF hash exception.
- Search highlights use actual matched text and the source page's approximate horizontal/vertical geometry; user query and saved PDF text are never rewritten. Ongoing query/document cancellation remains checked after asynchronous stages.
- Existing manual Structure features, equations, OCR inference/retry, bookmarks, document data, and export schemas remain unchanged. No cache/index schema bump: browser script cache key changes to v431, without forcing content re-detection.
- The in-app bilingual Tutorial now describes multi-column/fuzzy-search improvements **and** their remaining limitations, beside its existing Content Detection and Formula OCR accuracy warnings.

## Regression and limitations

See `regression/v431_release_gate.json` for exact executed tests, source SHA, and package evidence. Verification distinguishes JavaScript unit source tests, controlled Chromium browser behavior, PyMuPDF-native-span detection replay, and untested live PDF.js/Texify integrations. **Do not interpret these tests as proof of universal mathematical accuracy.** In particular, unusual column layouts, mixed right-to-left spans, hyphenation, fully scanned PDFs, text selection/copy order, and optional raw full-document text export ordering remain unverified. Real Texify model weights were not available, so no claim of higher symbol transcription precision or long-form formula completeness is made.
