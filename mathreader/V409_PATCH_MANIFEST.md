# MathReader v409 — root-level differential patch manifest

Apply this patch over the **exact v408 source** (v405 full ZIP followed by v406, v407, v408 patches). It does not contain untouched files.

## Corrections

- Fix wrapped prose references masquerading as Results; preserve 12 real Giusti theorems and reject Yau p39 duplicate lemma.
- Accept verified named result headings without a PDF text-layer spacer and repeated lecture-local labels; protect against truncated labels.
- Recover printed no-space bibliography key `[16]Anneaux` while retaining all historical spaced/Unicode/punctuation-leading references.
- Advance runtime asset v409 and Structure index version 52; preserve unrelated OCR, annotation, and export semantics.
- Keep conservative corpus and release-gate reports; accuracy on arbitrary scanned documents is not guaranteed.

## All changed/added files

- `mathreader/REGRESSION.md`
- `mathreader/V409_PATCH_MANIFEST.md`
- `mathreader/index.html`
- `mathreader/js/00-core.js`
- `mathreader/js/41-equations-bibliography.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v409_corpus_audit.json`
- `mathreader/regression/v409_release_gate.json`
- `mathreader/tests/bibliography_no_space_key_v409_regression.js`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/historical_appendix_results_v395_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`
- `mathreader/tests/parenthesized_results_v409_regression.js`
- `mathreader/tests/real_export_index_precision_v392_regression.js`
- `mathreader/tests/results_declaration_reference_v408_regression.js`
- `mathreader/tests/results_wrapped_references_v409_regression.js`
- `mathreader/V409_PATCH_MANIFEST.md`

## Verification

55/55 JS suites, 22/22 Python/Chromium suites (two browser-harness suites rerun separately), 70/70 JS syntax checks, 10-part assembled runtime syntax, complete six-export original PDF.js-index replay, and six-export original bibliography exact parity.

The full 14-document campaign is an evidence-based audit with clearly marked PDF.js, PyMuPDF proxy, and image-only OCR limitations; no blanket accuracy certification.

The compiled patch is CRC-checked, contains exactly the changed files listed here, and is byte-identically replayed against the pristine v408 source before release.
