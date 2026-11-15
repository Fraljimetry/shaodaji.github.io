# MathReader v437 — OCR envelope consistency sweep

Baseline: uploaded complete MathReader v436 with Verification Engine V5. Changed-files-only website-root overlay; no Git commits.

## Confirmed failures reproduced with synthetic OCR model-output strings

- The multi-regex OCR envelope collector could collect `$...$` *inside* an already matched `$$...$$` display envelope, duplicating a subformula as another aligned line. Fix: reserve non-overlapping source intervals, taking long display delimiters first. Unwrapped LaTeX is unchanged.
- The same collector deleted consecutive identical display or inline math blocks. Those can be genuine mathematical rows, so duplicate filtering has been removed at this envelope stage. The downstream row formatter also no longer deletes mathematically valid adjacent identical rows; blank rows are still suppressed.

Regression: `tests/formula_ocr_envelope_v437_regression.js` explicitly checks all three fixes and negative controls. This is deterministic source-level string replay, **not real Texify/model inference**, proof of character-level OCR correctness, or original-PDF detection/navigation acceptance.

Bilingual Tutorial updated to emphasize manual line-by-line review. Verification results and limitations are reported in the accompanying delivery; original 41-PDF corpus and independently reviewed Texify inference evidence are not available in the uploaded package.

## V5 final local verification

V5 **full** run on the patched v437 tree: 140 checks; **138 PASS, 0 FAIL, 2 INCOMPLETE**. The two incomplete historical export-corps tests (`full_text_exports_v400.py`, `seven_export_evidence_v401.py`) explicitly skip because original export corpus assets are not available. All JavaScript and available Python/Chromium checks, V5 engine self-tests and bounded stress checks completed without failures. This is *not* an original-PDF/Texify accuracy certificate. The initial diagnosis run had older v436-version test assertions and a 55-second engine-selftest timeout; the patched test assertions and increased 180-second browser/selftest allowance passed in the final full run.
