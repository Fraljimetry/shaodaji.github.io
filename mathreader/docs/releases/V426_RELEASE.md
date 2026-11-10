# MathReader v426 — General Structure heading navigation

**Baseline:** v425. **Delivery:** overlay-only ZIP, changed/new files under one top-level `mathreader/` directory. **Scope:** Structure click destination recovery, not automatic content detection or OCR.

## Root cause and new behavior

The previous recovery expected a nearly complete heading inside one text baseline. In a mathematical PDF with two columns, a heading may wrap into two or three consecutive baselines, while lines in the opposite column are interleaved by vertical coordinate. Mathematical symbols may also be encoded as NFKC-compatible bold/italic letters and split-off subscript digits, so an embedded title such as `5.1 A0=B0=0` does not match a literal space-normalized text row.

The v426 locator:

1. Separates baseline fragments with their PDF.js horizontal coordinates, without changing the shared PDF text extractor.
2. Reconstructs a bounded number of consecutive heading baselines **within the same column**; the first fragment supplies the destination Y.
3. Matches normalized full titles or tightly constrained mathematical spelling variants, not arbitrary prose substrings.
4. Prefers an unambiguous complete match to a weaker partial match; equal-strength repeated titles remain unresolved rather than guessed.
5. When no readable line match exists, may reuse an existing *unique, exact* `(page, title)` match from the detector's measured Structure entries. It does not invent coordinates.
6. Keeps manual Reselect positions, explicit non-top PDF destinations, and navigation/document-switch cancellation authoritative.

No paper-name special cases are introduced.

## Real source evidence

`regression/fixtures/structure_navigation_native_rows_v426.json` contains bounded PDF.js-native text-item strips reproduced from the user-supplied `PMESTOC25-mathreader.json` export, identified by source PDF SHA-256 `c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20`.

| Bookmark | PDF page | Source-text heading ratio |
|---|---:|---:|
| 2.1 Principal Minor Equivalence | 4 | 0.320612 |
| 2.5 Cut-Transpose Operation | 5 | 0.224429 |
| 3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices | 5 | 0.406597 |
| 5.1 A0=B0=0 | 11 | 0.4963 |

The new source-backed regression covers all 15 Structure entries observed in this paper (the 14 source-inferred titles plus 5.1), together with rejected cross-column merges, prose, duplicate headings, exact detector fallback, explicit PDF coordinates, and user-edited positions.

The Chromium test exercises the production `pageTextLines`, matching, Structure row click, and `goToLocation` logic, including actual scroll offsets. It does not impersonate a live website session or reconstitute the original PDF's bookmark object data.

## Acceptance

See `regression/v426_release_gate.json` for recorded test results and exact changed-file inventory. All unaffected document detection, equation OCR, and persistence functionality remains unchanged. Browser assets use `?v=426` to prevent stale v425 JavaScript.

## Deployment

Extract over the existing **v425** `mathreader/` directory and overwrite matching files. Do not delete the directory; this is not a complete source release.
