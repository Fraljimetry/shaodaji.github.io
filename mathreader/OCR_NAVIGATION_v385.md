# MathReader v385 — Equation-label target vs. prose citation

**Date:** 2026-11-06. **Baseline:** v384 root patch applied on the v374 complete package through each version in order.

## Reproduced issue

Giusti, *Minimal Surfaces and Functions of Bounded Variation* (1984), original PDF page **28/253**. The mathematical display numbered **(1.12)** appears in the **left margin**. The same number appears later in prose (“It follows from (1.12) ...”). On the deployed reader, clicking the new Equations index entry could land at the prose occurrence rather than at the displayed equation.

Two independent implementation paths could cause this:

1. **Post-navigation semantic snap.** `goToMatchedLocation` navigated to the saved (page, ratio) and then independently searched the selectable PDF text layer for the label. When the text layer only retained the later prose citation, semantic search overrode the page-coordinate landing position. This is directly demonstrable from the v384 code.
2. **Unvetted cropped-margin coordinates.** The 28%-wide margin crop also includes part of the normal text column. A clipped prose reference can resemble an isolated equation label. The v384 classifier accepted a broad numbering-side region and could promote such a candidate or leave an older bad coordinate cached.

## Evidence from the user-provided original PDF

Independently inspected with PyMuPDF and 3× page rasterization + local Tesseract. No MathReader browser OCR is claimed.

| Observation | x of label on page | Approx. vertical page ratio | Origin |
|---|---:|---:|---|
| Printed `(1.12)` | 102–168 / 1206 px (x≈0.085–0.139) | 453/1844 ≈ **0.246** | Tesseract on left margin image |
| Prose `(1.12)` | 96.99–119.03 / 402 pt (x≈0.241–0.296) | 282.65/614.64 ≈ **0.460** | PDF native text layer |

The native text layer contains the prose citation but **does not contain the printed `(1.12)` label**. This explains why searching the text layer for the number is unsafe as a final navigation step.

## Changes

- Equation index, equation command palette, equation-reference clicks and related equation links navigate to **the stored page-relative location directly**. No fuzzy text-layer re-search for numbered equation targets; other semantic text navigation remains unchanged.
- Meticulous OCR promotes an equation-margin position only if its candidate **glyph coordinates are measured**, are sufficiently near the outer page margin, and are not contradicted by uncropped same-row prose citations. When an inset tag is legitimate, separate same-row display-math evidence can validate it. Same-height citations in another document column are not treated as the same target.
- Both full-page OCR lines and the native PDF text layer provide context to screen the cropped candidate.
- An explicitly **v385-verified** replacement location supersedes an older same-label location, without deleting any equation label or unrelated OCR evidence. The verified status survives saved equation-index snapshots and reopen.
- Re-running meticulous OCR remains user initiated, not automatic, and OCR model/backend, retry settings, full-document OCR and Texify remain unchanged.

## Regression results / boundaries

- `node mathreader/tests/equation_reference_ocr_target_regression.js`: **25 assertions PASS**, using measured Giusti geometry, negative controls for references, two-column edge cases, no silent deletion, repeated scan, cache round-trip, and direct target-navigation behavior.
- All **28 Node regression files** pass. JS syntax check and assembled single-module syntax check pass.
- Chromium DOM/canvas OCR geometry test **13 PASS**, OCR worker mocked.
- Chromium responsive shell regression **176/176 PASS**. 
- ZIP CRC/integrity checked after packaging.

**Not verified:** actual deployed-browser MathReader + original Giusti PDF + Tesseract.js runtime recognition and accurate clicking of each indexed label. This remains a required P0 acceptance item. Local command-line Tesseract and a mocked OCR worker cannot certify that end-to-end browser flow.

## Existing cached positions

The navigation change immediately avoids semantic snap for any cached entry with a correct coordinate. If an old v381–v384 record already contains an incorrect coordinate, the system **will not guess a corrected location or automatically rescan**. Run `Meticulous OCR` manually once on the affected page: if the real printed label is verified again, v385 replaces only its obsolete target coordinate; if it is not recognized, the old label is preserved but its navigation remains unverified. Avoid declaring an unrecognized label fixed.

## Remaining general risks

This correction does not solve missed math characters, missing equation numbers where no OCR candidate survives, two-column/rotated historic page reading order, formula Texify transcription errors, or other false positives in Structure/Results/Bibliography. Keep these in the broader `OCR_AUDIT_v384.md` and regression backlog; do not treat these focused tests as comprehensive historical-PDF accuracy evidence.
