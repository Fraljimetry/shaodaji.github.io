# MathReader v420 — Two-column equation labels and native-text regression

**Baseline:** v419 (v418 complete source with the v419 overlay applied). **Distribution:** changed-files-only ZIP, retaining the `mathreader/` relative paths.

## Reproduction and independently checked printed labels

The user's `PMESTOC25-mathreader.json` is the 12-page ACM STOC 2025 paper, *Characterizing and Testing Principal Minor Equivalence of Matrices* (Chatterjee, Ghosh, Gurjar, Raj). Its native text covers every page, but v419 indexed only 16 of the 21 printed equation labels. Comparing with the original publisher-format PDF at <https://www.cse.iitb.ac.in/~rgurjar/papers/PMESTOC25.pdf> identifies the absent labels:

| Printed label | PDF page | Actual v419 reason |
|---|---:|---|
| (1) | 2 | End-of-left-column tag was assigned to the right column when splitting a same-row text record |
| (12), (13), (14) | 9 | Standalone end-of-left-column tags straddled the inferred gutter instead of being classified by the column's local right edge |
| (18) | 11 | Text from a left-column algorithm contaminated the unsplit right-column equation; after splitting, a displayed determinant equation with one `=` was wrongly considered too prose-like |

These defects were not caused by unusual numbering punctuation. They resulted from **layout and context attribution before label classification**, affecting even ordinary `(1)`–`(21)` tags. The same source file contains `(1)`, `(2)` **numbered list conditions** that must *not* be counted as equation labels.

The new standalone regression uses frozen native PDF.js text and geometric text items from this complete 12-page export. It was executed against the unchanged v419 detector first and **failed on exactly the five labels above**. With the v420 change, it finds **all 21 printed labels, zero extra equation labels**, in the PDF's two-column reading order. Original PDF screenshots were compared for the layout and missing tags. This is native-text detection verification; no new Texify/OCR inference test is implied.

## Production changes

1. When a reliable two-column profile exists, recognize an isolated parenthesized number in the **inner gutter** as the end of the *left* column if it lies fully before the start of right-column text. Use token bounds, not the median extent of ordinary prose. Do not change the PDF's inferred numbering side globally.
2. Evaluate the physical outer column using **that column's split text**, not a same-y merged row. Promote a previously absent label only when it has explicit margin tag geometry, a genuinely mathematical display, no reference/list context, and trusted immediate predecessor and successor equation numbers.
3. Treat repeated conventional mathematical function names (such as `det`) as mathematics rather than counting them as free-standing prose words in short local displayed formulas. Explicit reference and numbered-condition checks remain enforced.
4. Advance the persisted **equation index schema from 28 to 29** to invalidate old native detector snapshots without changing manual equation edits, bookmarks, notes, or the existing v419 manual Structure model. Static asset version is **420**.

No book title, PDF hash, page number, expected equation number, or other sample-specific exception exists in production detection code.

## Regression breadth

- **STOC 2025**, independently checked 12-page real native-text corpus: `tests/two_column_native_equations_v420_regression.js`, 21/21 labels, zero extras, page and two-column order assertions.
- **Leon Simon, *Lectures on PDE***, complete user-supplied 224-page text export: native replay remains **20 label strings / 171 occurrences** before and after this fix. Its original v418 selected-page regression checks restarted `(1)`–`(12)` sequences and rejects a broken prose reference.
- **Leon Simon, *Introduction to Geometric Measure Theory***: historical v415 regression for colon-encoded label geometry, repeated labels, and exclusion of numbered condition lists passes; the original complete source PDF was not rescanned in this cycle.
- **Giusti** and **Yau**, historical native-page fixtures: genuine declarations and irregular equation locations retained; known Giusti PDF p.231 `(A.1)` issue remains documented by the historical test, not claimed resolved here.
- **Historical appendix, bibliography, results, citation, Latin/Roman and alphanumeric tag, OCR, browser navigation and responsive-layout regressions** remain in the independent test matrix. Grammar-only tests are not represented as original-PDF page verification.

All 67 JavaScript suites passed, including the new test. Python/Chromium: 29 of 29 test files passed when run independently / with the responsive test isolated from a timed-out combined batch; the complete combined batch was **not** certified as a single successful run. Browser tests generally use controlled geometry, not an actual running online Texify model. `node --check` on all source modules and the assembled ESM bootstrap passed.

## Deployment and limitations

Install v420 **over v419**: extract the overlay ZIP into the parent directory containing `mathreader/`, overwrite matching files, and retain all others. No deletion or full-folder replacement is required. Refresh to invalidate cached assets, then open the PDF to regenerate the equation index. Do not treat the old exported v419 snapshot as ground truth.

This release does not certify 100% detection across all mathematical PDFs or solve image-only formulas, OCR transcription accuracy, textbook bibliographies, or the accepted Ahlfors hard-reload equation-margin evidence limitation. The scope is the confirmed two-column native-text failure, with broad regression protecting existing behavior.
