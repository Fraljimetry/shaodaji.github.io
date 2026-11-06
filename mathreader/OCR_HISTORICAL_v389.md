# MathReader v389 — Historical textbook OCR regression

**Baseline:** fully reconstructed v374 complete MathReader source with every incremental patch v375 through v388, verified in order. The only functional modification in v389 is a conservative appendix-numbering family distinction; no Texify model/backend, crop DPI, preprocessing, beam, or retry settings changed.

## Original documents and independent image checks

Nine SHA-256-distinct original mathematical PDFs were available: three textbooks (Giusti, *Minimal Surfaces and Functions of Bounded Variation* (1984), 253 pages; do Carmo, *Riemannian Geometry*, 315 pages; Ahlfors, *Conformal Invariants*, 172 pages), and six older-paper controls (Banach/functional analysis, Yau 1978, Simon, Caffarelli 1989, SPS 1988, and Schoen minimal-surface scan). Eight original PDFs were fully extracted, totaling **585 pages**. The full do Carmo image-only scan repeatedly exceeded the execution window during complete PyMuPDF extraction; 2 of its real pages were nonetheless rasterized and OCR-probed. This must remain **INCOMPLETE**, not a full-scan PASS.

For all eight fully extracted PDFs, the unchanged historical-corpus runner executed the actual v388/v389 source-level text/parser-probe functions on **all 585 original pages**. The source-level probes count raw candidate lines, **not validated final Structure/Results/Equations/Bibliography indexes**. Eight selected Tesseract OCR crops executed (0 timeouts, 0 errors, 0 empty transcripts). The crop selector is heuristic; that is not eight documents recognized with mathematical accuracy.

**Eleven individually rendered old-PDF pages were OCR-tested using Tesseract 5, `--psm 11`, English, and visual page inspection where labels are reported.** Important observations:

| Original source/page (PDF 1-based) | Printed equation targets | At default 1.8× page raster / Tesseract proxy |
|---|---|---|
| Giusti p20 | (1.4), (1.5) | (1.4) lost separator and became `(14)`; (1.5) exact |
| Giusti p28 | (1.12), (1.13), (1.14) | All three exact; prose reference to (1.12) also recognized at a different position |
| Giusti p222 | (17.11) | Exact, y≈0.870, a critical late-page navigation control |
| Giusti p238, Appendix B | (B.2), (B.3), (B.4) | B.2 and B.4 exact; **B.3 read as `(B3)`** |
| Giusti p240, Appendix C | (C.5), (C.6), (C.7) | C.6 exact; C.5 read `(C5)`, C.7 read `(C1)` |
| Giusti p246, Appendix C | (C.12) | Exact display exists; also later prose citations |
| Ahlfors p29 | (1-24), (1-25) | Both exact at right margin y≈0.145 and y≈0.243 |
| Ahlfors p86 | (4-17), (4-18) | Both exact at right margin |
| Schoen p19 | printed bibliography [11] | OCR reads [11] but also produces misleading parenthesized integer keys; source sequence filter does not promote these as a valid equation family |

**High-DPI verification:** when Appendix B/C margins were rerendered at 3.4× and cropped to 28% page width, p238 recovered `(B.3)` with PSM 6 and 11; p240 recovered `(C.7)` with PSM 6 and 11, and `(C.5)` with PSM 6. These are genuine image-OCR results, **not MathReader browser output or Texify formula-to-LaTeX**. High-DPI recognition illustrates why it is harmful to silently normalize the weaker low-resolution output.

## Confirmed defect and general-class repair

The actual lower-resolution p238 OCR observation `(B3)` belongs to a page with correctly printed `(B.2)` and `(B.4)`. The v388 `denseSupplementalEquationFamilies` algorithm grouped all three under `prefix B`; a source-level reproduction **promoted `(B.2)`, `(B3)`, `(B.4)` as a valid consecutive family**, even though the actual page uses dotted numbering. This can add a *wrong-looking but plausible* appendix entry during OCR.

v389 introduces `equationSequenceFamilyKey`: prefix **and exact numbering separator** are required for dense OCR corroboration, native-text gap queries, rejected-reference query support, and monotonic OCR sequence filtering. Separate genuine formats `B.1/B.2/B.3`, `B-1/B-2/B-3`, and `B1/B2/B3` continue to work. A damaged compact OCR observation cannot borrow evidence from neighboring dotted or hyphenated labels. No missing label is invented. The saved equation-summary schema is bumped from v24 to v25; **explicit user edits and past meticulous OCR evidence are not deleted**.

The original `meticulous_equation_margin_regression.js` contained a stale digit-only source assertion and failed on the fully reconstructed v388 baseline. Its assertion was updated to check the genuine shared appendix-capable grammar. That correction is **test maintenance**, not an additional application fix.

## Executed verification and limits

- All original v388 JS test suites plus the new separator-class test; JS syntax for all application modules and bootstrap.
- Chromium original shell tests: appendix incremental listing/filter with 622 synthetic labels; equation landing/hOCR DOM geometry; meticulous reading position restoration; OCR browser DOM/canvas geometry; 176 responsive checks. These are not real-PDF OCR passes.
- Repeated corpus runner with persistent cache: 8 source-level PDFs, 585 fully extracted pages, 8 selected OCR crops. PDF hashes and diagnostic summary in `regression/historical_textbooks_v389_evidence.json`.

**Still incomplete:** no direct installed MathReader Tesseract.js/Texify production inference or model assets; no completed original-PDF four-index browser capture; no formula image-to-LaTeX semantic accuracy measurement; no full-document do Carmo OCR; no cross-disciplinary 50-old-textbook completion; no claim of 100% OCR accuracy. Handwritten material remains best-effort and was not evaluated. For a true P0 PASS, use the original PDFs in a pinned browser with independently checked page-level mathematics and OCR crop truth for printed/scanned/handwritten samples.
