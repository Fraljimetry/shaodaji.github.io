# v392 — Two exported MathReader detection datasets: evidence and corrective rules

**Input evidence (2026-11-06):** User-supplied `mathreader.reading-data@1` JSON exports from `yau1978.pdf` and *Enrico Giusti, Minimal Surfaces and Functions of Bounded Variation* (1984). These are **saved reader detection/index records**, not raw page OCR transcripts. In both cases `documentOcr` is `null`, and the saved `session.documentTextPreference` is `native`. The original PDF files, page images, Tesseract hOCR, Texify outputs, PDF.js page geometry, and independent visual truth were **not attached to this task**. A JSON assertion is not an original-PDF OCR accuracy score.

| Evidence | Yau (1978) | Giusti (1984) |
|---|---:|---:|
| PDF page count (export metadata) | 73 | 253 |
| Saved Structure entries | 14 | 240 (exact prior hard limit) |
| Saved Results entries | 13 | 185 |
| Saved Equation rows | 269 | 275 |
| Saved Bibliography entries | 15 | 74 |
| Last indexed Structure PDF page | 73 | 191 (62 pages still remain) |
| Numbered Results declarations **also** in Structure | 0 | 68 |

Source export SHA-256:

- Yau: `72eca1795f4b54afccc890fcc4f7afdfe12be9d3b735ab8298d8789aa2bc4cf0`
- Giusti: `0fe02453b3b0a4c45ff78431a058cd6ff03d6100e7a5aca68b31a6705a94fd23`

## Confirmed defects derived from the saved output and verified in v391 source

1. **Duplicate result declarations pollute Structure.** Giusti's saved Structure contains 68 titles such as `1.1 Definition: ...`, `1.9 Theorem (Semicontinuity): ...`, and `2.2 Lemma: ...`. These belong in Results; the export already contains Results separately. The prior Structure classifier admitted numbered Result declarations because only *unnumbered* theorem/lemma starts were explicitly recognized as mathematical environments. New rule rejects only declarative numbered-result grammar, **not** section titles such as `2.1 Theorem of Stokes` or any Results records.
2. **Structure silently capped at 240 items, inconsistently.** v391's detector, session restore, manual add and Undo each independently truncated to 240. Giusti has precisely 240 saved entries, ending at page 191 of a 253-page PDF. The source-level truncation is confirmed; **whether each omitted later-page title is a valid heading requires PDF review**. v392 uses one bounded 1,200-entry ceiling across detection, restore, edit and Undo, without claiming all pages are now recognized. Version 47 rebuilds ordinary local inferred outlines.
3. **Book Contents page treated as document structure.** Giusti's `Table of Contents` (p.6) and TOC-only `Appendix A/B/C` (p.6) appear in Structure. The previous detector recognized literal `Contents` but not `Table of Contents`, and did not treat bare `Appendix A` as a TOC row. v392 recognizes the standard heading, protects early genuine document headings, and rejects cover/series typography **before** a reliably identified early Contents page. Yau's actual body `Appendix A` (p.65), `Appendix B` (p.69) remain valid.
4. **Strong prose/math artifacts treated as headings.** Examples: Giusti's `Roughly speaking, Fleming's idea was the following ...`; Yau's `2 C (giy+d2cp/dzi ...` at p.25. The new strict sentence/operator filters target these defect classes; no generic automatic title rewriting or equation invention was added.
5. **Algebraic variables admitted by the appendix-tag grammar.** Examples from the exports include Yau `(rn-1)` and Giusti `(n-1)`, `(p-0)`, `(j-00)`, `(Wn8)`, `(bn-1)`, `(l2)` and `(k1)`. The old appendix grammar permitted lowercase/mixed-case compact and hyphenated names that collide with mathematical variables. The updated grammar preserves uppercase `A1`, `B-3`, `AA.3`, `A.1a` and lowercase dotted `a.3`, but rejects these lower/mixed-case non-dotted variable shapes. Single **bare** (unparenthesized) uppercase compact/hyphen candidates without a same-family companion (e.g. `J-00`, `Q0`) no longer enter the automatic Equation index solely from that token. Genuine printed parenthesized compact/hyphen tags and at-least-two-label compact families remain eligible. The rule runs in both the initial build and post-image-OCR validation; manual entries and explicit user corrections are not deleted. Equation snapshot version 26 causes the local automatic index to rebuild.

## Validation actually performed

- The new `tests/real_export_index_precision_v392_regression.js` executes **63** assertions against the actual detector helper functions, using representative literal entries from the two supplied JSON exports and paired positive/negative controls. v391 fails this new gate because the required classifiers do not exist; v392 passes.
- The full existing 33 JavaScript regression files passed before adding the new suite. The new synthetic native-page integration test `tests/long_book_outline_v392_regression.js` also passed **15** assertions exercising the genuine full Structure detector. Final full suite: **35/35 JavaScript tests PASS** (including both new files).
- Chromium shell/component checks (not real PDF/Tesseract/Texify) passed for appendix scrolling, equation targets, Meticulous OCR right-click menu, reading position, OCR hOCR geometry, responsive layout, and tutorial/help UI: **7 browser scripts**.
- Assembled ten-subsystem runtime passed `node --check`. Five additional Python acceptance/regression scripts passed (P0 truth comparator 54 tests; gate isolation 5; P0/P1 gap closure 15; P1 real gate 2; regression-runner smoke 19 assertions). ZIP and root patch integrity to be confirmed during packaging.

## Still unverified / deliberately not changed

- Neither complete PDF was reprocessed in the *real MathReader browser OCR pipeline*. No OCR accuracy, recall, precision, full-page coverage, memory/performance certification, or correctness of every exported label has been established. These are **candidate-error-class reductions**, not a claim of corrected live PDF detection results.
- The Giusti bibliography shows possible author/title boundary contamination (e.g. `[AR]` ends with `ALLARD, W.` while `[A W]` begins with a title). Without original page layout and actual extracted bibliography lines, applying a title shifter risks damaging genuine references. **No automatic bibliography rewrite** was performed.
- Yau `(IS212)` and some other apparently spurious uppercase compact labels might be parenthesized printed objects or transcription artifacts; a visual target/coordinate is required to decide. They were not hardcoded away.
- Genuine isolated **bare** compact or hyphenated appendix identifiers lacking parentheses and family support can now be omitted; use manual `Add` or `Reselect` until their original page images can corroborate them. Explicitly parenthesized single appendix labels remain eligible. Lower-case compact/hyphen appendix conventions, if present in a particular book, need manual validation. Any new false negative from this conservative rule must be documented and regressed before relaxation.
- Very large inferred outlines (up to 1,200 rows) increase DOM/persistence cost; actual long-document browser performance was not tested with the original Giusti PDF.
- Because v392 bumps local detector summary versions, opening old documents requires the normal index rebuild. An imported portable reading-data file intentionally preserves the user-supplied snapshot and should not be silently rewritten. Existing manual edits, drag ordering and saved reading position must remain intact.
- The v391 OCR cache identity/completeness fix remains unchanged. Texify, Tesseract settings, persistent raw OCR storage and unrelated application behavior remain unchanged.

**Required next real-document check:** open both original PDFs in the deployed reader, let the index rebuild, inspect Giusti actual sections and appendices through the final pages, verify two or more original printed equation images per appendix, inspect cited bibliography entries, and export fresh detections for comparison. Do not report 100% OCR certification from exported JSON alone.
