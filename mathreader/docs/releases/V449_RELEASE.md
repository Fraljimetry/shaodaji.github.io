# MathReader v449 — bounded Structure geometry hardening

## Confirmed defect and change

A single native PDF.js text row split into an unusually large number of fragments made Structure typography detection call `Math.min(...items)` and `Math.max(...items)`. The argument-spread operation raises a `RangeError` when the row is sufficiently fragmented, interrupting Structure detection. Replaced both spreads with a linear-time bounded accumulator, with explicit finite-number handling for malformed x/width values. This preserves ordinary row positioning and nonnegative-width handling. Updated the browser source cache key to v449.

## Evidence and scope

- Red reproduction: `tests/structure_row_bounds_v449_regression.js` failed on v448 because the bounded row helper was absent; the newly added helper is now exercised with 160,000 fragments and malformed/negative widths.
- Local focused Node tests: Structure row bounds, v448 index integrity, v442 dense Structure geometry, maintenance/assembly, equation progress, two-column Structure navigation. Relevant syntax checks passed.
- Actual Chromium regression scripts for navigation races and Settings completed on the changed tree. Those scripts explicitly include mocked PDF/model cases.
- No independently reviewed original-PDF corpus or original-PDF navigation manifest came with the v448 ZIP. A previously uploaded historical PDF was located in the file library but raw bytes could not be materialized in this environment. No original-document accuracy or original-PDF click-navigation certification is claimed.
- No live Texify inference/model or human-approved formula-crop transcript was available; real OCR accuracy remains INCOMPLETE.
- Two historical export-corpus checks remain INCOMPLETE unless their genuine external evidence becomes available. PDF.js pinned runtime assets for original-PDF P0/P1 execution were not present locally.

## Release interpretation

This is a targeted crash-prevention change, not a declaration that Results, Equations, Structure, Bibliography, TOC, OCR, or cross-references have attained full real-document acceptance. Synthetic fixture and mocked-browser tests are not counted as genuine production-PDF or Texify accuracy evidence. Any full V5 gate count must come from a completed runner report; an interrupted `.partial` report is incomplete.

## Full verification follow-up

An initial complete v449 V5 run enumerated 154 checks and exposed two stale exact-version test assertions (`export_preferences_v397_regression.js` and `formula_ocr_lazy_regression.js`) after bumping the cache key. Both test expectations were updated and rerun independently with zero failures; the V5 full run was repeated on the corrected files. The two external historical export evidence cases remain explicitly incomplete rather than passed.
