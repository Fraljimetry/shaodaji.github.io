# MathReader v405 minimal root patch manifest

**Applies to:** v404 source. The prior audit-only v405 campaign is also compatible; its production code was unchanged. ZIP entries all start at the original `mathreader/` project root.

## Changed files (11)

1. `mathreader/js/20-selection-annotations.js` — manual equation tag parser accepts existing appendix grammar, e.g. `(A.1)`; localized prompt/error examples.
2. `mathreader/mathreader.js` — bootstrap/cache version 405.
3. `mathreader/index.html` — HTML cache-busting version 405.
4. `mathreader/tests/manual_appendix_equation_v405_regression.js` — 38 manual label, add, reselect, navigation, persistence and negative assertions; was red on v404.
5. `mathreader/tests/equation_progress_regression.js` — v405 cache-key expectation.
6. `mathreader/tests/export_preferences_v397_regression.js` — v405 cache-key expectation.
7. `mathreader/tests/formula_ocr_lazy_regression.js` — v405 cache-key expectation.
8. `mathreader/tests/maintenance_integrity_regression.js` — v405 bootstrap/cache-key expectations.
9. `mathreader/REGRESSION.md` — permanent behavioral rule and limitations.
10. `mathreader/MANUAL_APPENDIX_EQUATIONS_v405.md` — defect reproduction, audit and caveats.
11. `mathreader/V405_PATCH_MANIFEST.md` — this manifest.

## Verification

- **Pre-fix reproducer:** new manual appendix test fails for `(A.1)` on v404.
- **After fix:** manual appendix test PASS, 38 assertions. JavaScript tests 49/49 PASS; Python/Chromium tests 21/21 PASS in separate/bounded runs, including 176/176 responsive Chromium assertions. Initial aggregate test invocations were interrupted by the execution harness; tests subsequently completed in isolated/bounded runs. These are not live production PDF OCR acceptance.
- `node --check` for `mathreader.js`, every ten-part `js/*.js`, and the assembled source: PASS.
- Root ZIP integrity and exact clean overlay replay over v404 and audited v404 baseline: PASS (verified by release packaging script).

**Scope exclusions:** automatic OCR/detector behavior, mathematical formula transcription, and document IndexedDB persistence are unchanged. The previously accepted Ahlfors hard-reload loss of raw equation-margin OCR evidence remains a known limitation.
