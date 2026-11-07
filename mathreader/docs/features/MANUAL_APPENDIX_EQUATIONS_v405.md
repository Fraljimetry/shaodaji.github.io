# v405 Manual appendix equation labels — targeted audit

## Reproduction and cause

- On unmodified v404, invoking the manual Equation `Add` workflow, choosing the real printed location on a page, then typing `(A.1)` is rejected by `equationLabelFromSelectionText`.
- The source index detector already recognizes appendix labels through `isPlausibleEquationTagInner`. The manual parser incorrectly used only `isPlausibleNumericEquationTagInner` and symbolic tags.
- The regression test `tests/manual_appendix_equation_v405_regression.js` was executed before the correction and failed at the positive `(A.1)` assertion. After the correction it passed 38 assertions.

## Solution and boundaries

- Reuse the pre-existing appendix-aware label grammar in manual selection and manual point Add only, retaining the existing year exclusion and symbolic-tag guard.
- The user must still select the printed page location: no gap filling, no invented label coordinates, no changes in OCR heuristics, no change to the document/annotation storage schema.
- Accepted labels include `(A.1)`, `(A.10)`, `(A.1.2)`, `(B-3)`, `(A1)`, `(AA.5)`, `(C.2a)`, `(a.4)`, and legacy numeric/symbolic tags.
- Explicit negative controls: `(A)`, `(ABCD.2)`, `(A.)`, `(n-1)`, `(x+1)`, `(2023)`, `(Theorem A.1)` and invalid non-parenthesized input.
- Changed only the manual Add prompt and error example text in English/Chinese; academic UI otherwise unchanged.

## Verification and limitations

Regressions run from the actual v404 source plus the v405 patch, with `MATHREADER_AHLFORS_PDF` pointing at the original Ahlfors PDF for tests that use it. Test logs are in the release gate summary. Syntax check includes `node --check mathreader.js`, each ten-part `js/*.js`, and their concatenation. ZIP-overlay replay and unchanged-file SHA validation are required before shipping.

The existing production Chromium test environment does not certify the genuine in-site Add mouse flow against PDF.js. Real-browser mathematical OCR accuracy also remains **UNVERIFIED**. The known Ahlfors hard-reload loss remains acknowledged, intentionally untouched.
