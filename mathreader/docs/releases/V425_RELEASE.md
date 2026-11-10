# MathReader v425 — Two-column Structure bookmark navigation

**Release date:** 2026-11-09. **Baseline:** v424 overlay installation (v418 complete + v419–v424 overlays). **Delivery:** changed-file overlay only, one `mathreader/` ZIP root, no untouched application files.

## Confirmed regression

The previous v423 page-only-bookmark recovery was insufficient for two-column PDFs. MathReader combines fragments sharing a PDF y-baseline into a single `pageTextLines()` row, even when they belong to different columns. Consequently the heading matcher saw a section title followed by prose or mathematics from the opposite column, rejected the entire row, and navigated to ratio zero. The screenshot for STOC 2025 displays sections **2.1** and **2.5** lower on PDF pages **4** and **5** respectively.

The actual `PMESTOC25-mathreader.json` native text-layer replay reproduced both failures on the unchanged matcher and verified the new positions using the unchanged production `pageTextLines()` implementation:

| Entry | v424 ratio | v425 ratio | Source PDF page |
|---|---:|---:|---:|
| 2.1 Principal Minor Equivalence | 0 | 0.3206123737 | 4 |
| 2.5 Cut-Transpose Operation | 0 | 0.2244292929 | 5 |
| 2.2 Reducible and Irreducible Matrix | 0.5295707071 | 0.5295707071 | 4 |
| 2.3 Cut of a Matrix | 0.2890643939 | 0.2890643939 | 4 |
| 2.4 Diagonal Similarity | 0.5685732323 | 0.5685732323 | 4 |

## Changes

- Split text *only for Structure bookmark heading matching* using existing PDF.js `parts` x-coordinates and conservative column gutter/broad-gap checks.
- When a bookmark is page-top, prefer a unique printed heading location if it exists. Non-top explicit PDF coordinates and manual positions remain authoritative; ambiguous headings retain original destinations.
- Preserve the existing stale-request and document-switch guard.
- Add red/green Node coverage and Chromium physical-scroll checks for the reported two-column headings.
- Increment browser asset version to 425 so the corrected module cannot be shadowed by cached v424 JavaScript.

No equation/index detection or OCR code is changed. Structure snapshot and reading-data versions remain unchanged.

## Verification

- `tests/structure_two_column_navigation_v425_regression.js`: pre-fix FAIL (2.1 ratio 0), after-fix PASS.
- Original 12-page native-PDF export replay: 2.1 and 2.5 recovered, 2.2/2.3/2.4 unchanged.
- `tests/structure_jump_position_v423.py`: Chromium scroll alignment PASS for 2.1 and 2.5 in continuous reading mode.
- Full JavaScript suite: **71/71 PASS**.
- Python/Chromium suite: see `regression/v425_release_gate.json` for the final executed counts.
- Assembled runtime parse and overlay ZIP integrity: see release gate.

**Limitations:** the PDF was verified through its actual exported PDF.js-native text and web-viewed printed pages, not by opening the user's specific installed website instance with its live embedded bookmark destination. Chromium tests use real DOM scrolling and mocked PDF.js interfaces. No claims of general Structure 100% accuracy or universal PDF bookmark correctness. The accepted Ahlfors OCR-evidence hard-reload limitation is not addressed.

## Deployment

Extract the overlay ZIP into the parent directory of the existing `mathreader/` folder; overwrite same-path files. **Do not delete or replace the whole application directory.**
