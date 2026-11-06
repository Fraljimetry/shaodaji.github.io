# MathReader v388 — Appendix equation numbering and long-index coverage

## Defect and scope

In the verified v387 source, `isPlausibleNumericEquationTagInner` and `parsedEquationNumber` accepted only digit-led equation labels and a small symbolic alphabet. Printed appendix labels such as `(A.1)`, `(B-3)`, `(A1)`, `(AA.5)`, `(A.1.2)` and `(C.2a)` were rejected before they could reach the Equation index. A second, independent omission was `visibleRows.slice(0, 500)` in `renderEquationIndex`: books with more than 500 indexed equations silently hid later entries, commonly the appendices.

## Corrected invariant

- Appendix equations are **separate numbering families** from the main text. `(A.1)` and `(B.1)` do not collide with `(1.1)`, and reset at the start of a new appendix is legitimate.
- The shared label grammar (document text, full-document OCR, meticulous margin OCR, query/navigation, and cached metadata) supports explicit `A.1`, `B-3`, `A1`, `AA.5`, `A.1.2`, `C.2a` and lowercase-letter equivalents, **with parentheses when printed**. PDF.js text-layer bare forms are candidates only, still subject to conservative geometry/math/section-heading checks. Do not reinterpret unnumbered `(A)` or ordinary strings as equation labels.
- Parenthesized *prose references* such as `see (A.1)` and `From (B-3)` remain non-targets. They may inform bounded OCR recovery, but they cannot become navigation targets without independent evidence.
- The existing document-relative page/ratio remains the navigation target. Existing measured OCR provenance, single-page user position, additive merge, idempotent rescan, and manual edits are preserved.
- A numeric-only OCR retry does not certify the alphabetic prefix of an appendix tag: a recognized `1` cannot establish `(A1)`.
- The Equations sidebar no longer silently drops every row after 500. It renders the first 500 and appends the next groups on scroll or by a small "Show more equations" action; a text filter searches all indexed entries, even those not yet in the DOM. No new panel and no eager large-list DOM costs.
- The persistent automatic equation-index summary was versioned from 23 to 24, so stale main-text-only indexes are re-examined. User-corrected and meticulous-page evidence are not discarded merely because the detector version changed.

## Verified tests (source / browser-shell)

- `node mathreader/tests/appendix_equations_v388_regression.js`: **71 executable assertions** covering nine positive label schemes, paired false-positive controls, parsed identities, query dispatch, prose-reference rejection, numeric suffix ordering, original-string offsets, compact bare-label safeguards, idempotent meticulous OCR, and persistence round-trip.
- `python mathreader/tests/appendix_equation_sidebar_browser_v388.py`: the **actual `renderEquationIndex()`** in Chromium with a simulated 622-entry index; verifies incremental listing and all 12 appendix entries discoverable through the filter.
- All available Node `tests/*.js`, plus `equation_navigation_browser_geometry_v386.py`, `meticulous_viewport_browser_v387.py`, `ocr_browser_geometry_regression.py`, and `ui_responsive_regression.py`.

## Outstanding risks / independent validation needed

1. **Actual historical-textbook appendix OCR remains unverified end to end.** The tests use simulated text/geometry and a browser DOM index, not a full original scanned appendix processed with PDF.js + Tesseract.js + Texify. Do not claim mathematical recognition accuracy on those documents.
2. Unusual systems such as roman appendix labels, multiletter prefixes longer than two letters, tags of the form `(Eq. A.1)`, and completely unnumbered appendix displays are intentionally not generalized. Broad matching would invite false positives.
3. A document switching its *physical margin side* between main text and appendices is not yet independently verified; the current global numbering-side inference remains in use. This change addresses alphabetic numbering, not layout inference.
4. Misread glyphs, missing parentheses, poor OCR geometry, two-column cross-talk, and repeated appendix names may still need targeted page-level verification. Preserve existing detections when attempting recovery.
5. Existing local automatic indexes will need the normal detector refresh under summary v24; forced full-document OCR is **not** automatically triggered. A cached missed appendix label may require explicit Meticulous OCR on its page.

## Human acceptance on deployed site

Open a printed-text mathematical book with main equations `(1.1)` etc. and appendix `(A.1)` / `(B.1)`. Verify both families appear **in document order**, including all labels beyond 500, and click targets land on printed displays rather than prose citations. Repeat for a scanned book with measured margin positions, then run page-level Meticulous OCR and confirm no existing label disappears and reading/Contents viewport stays in place. Close and reopen the PDF and verify the same appendix labels/positions. Compare a right-numbered and left-numbered document, and record unreadable scans separately.
