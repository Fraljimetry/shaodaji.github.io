# MathReader v427 — Column-local TOC and reference navigation

**Baseline:** v426. **Delivery:** overlay-only ZIP with changed/new files under `mathreader/`. No persistent-schema changes.

## Verified failure and general cause

`pageTextLines()` intentionally preserves baseline rows; on two-column PDFs one row can contain text from both the left and right columns. v426 corrected the Structure-panel heading locator, but other reading/link consumers continued searching these concatenated rows:

- **In-document TOC links:** a wrapped heading, such as STOC 2025 section 3, was missed by single-line title lookup despite an accurate measured heading position.
- **Reference-text fallback:** concatenated row fragments could make a phantom phrase (for example, `Lemma 5` assembled from a left-column `Lemma` and a right-column `5`).
- **Backlinks:** the same manufactured phrase could be reported as a real link, with a snippet spanning two unrelated columns.
- **TOC-page recognition:** side-by-side headings on the same y baseline could be merged and misclassified or left unlinked.

A newly introduced regression fails on unmodified v426 at the wrapped section-3 destination. It then tests cross-column false references, zero phantom backlinks, two-column TOC matching, and retention of single-column right-margin equation tags.

## Change

`js/50-references-search.js` now projects PDF.js baseline rows into **column-local reading streams only after multiple substantive rows establish a two-column page**. It reuses the existing v426 horizontal fragmentation and avoids changing the shared native text extractor, equation detection, mathematical Results, bibliography detection, or user selection. For TOC title targets it also reuses the conservative, bounded, multiline Structure heading locator with ambiguity handling.

The change applies to `findSectionNumberLocation`, `findTocTitleLocation`, `compareTocPageWithStructure`, `findReferenceTextLocation`, and `collectBacklinks`. Unproven two-column hypotheses leave the original rows intact. No filename/DOI/title special cases. No extra full-document OCR, network calls, hidden fallback, or altered reading-data schema.

## Original source and test coverage

The source-backed native-item fixture derives from the user's `PMESTOC25-mathreader.json` export, PDF SHA-256 `c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20`. Both source-level testing and a controlled Chromium TOC-link click/physical scroll confirm section 3 at PDF page 5 / ratio 0.4066 and section 2.1 at page 4 / ratio 0.3206.

The 30-document PDF-native proxy detector corpus was replayed again: all 30 successfully ran Structure, Results/Bibliography and Equation stages. Their complete detector output arrays are byte-for-byte logically equal to the previous v422 proxy results (549 Results, 413 Bibliography entries, 1,879 equation occurrences across 708 pages). **This is a compatibility check, not an independent proof of indexing accuracy.** Some source works and teaching notes are related versions; they are not 30 independent journal papers.

The final test counts and integrity evidence are recorded in `regression/v427_release_gate.json`.

## Important remaining limitations

- This patch is **not** a full multicolumn document-reading-order rewrite. Search-text aggregation, text-layer selection/copy, and full-document text export can still follow PDF-provided text order. Their cross-column correctness remains unverified; changing them requires coordinated search-hit mapping and highlight/navigation tests.
- Unusually complex pages (three columns, floating figures, nested tables, mixed single/full-width blocks, handwriting, image-only pages) are not certified by this source fixture and controlled browser test.
- PDF.js geometry is from the supplied MathReader export, not a new independent live-site browser extraction using the original raw bookmark object graph.
- OCR inference, mathematical formula transcription and Ahlfors equation-margin OCR evidence persistence are not modified or recertified.

## Install

Extract this archive into the **parent of `mathreader/`** over an existing **v426** installation. Overwrite matching files. The package deliberately excludes untouched files; do not delete the existing folder.
