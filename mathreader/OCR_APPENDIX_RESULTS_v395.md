# v395 — Appendix mathematical Results: original-PDF verification and regression

**Baseline:** the complete v394 MathReader tree from the preceding historical regression release. **Patch:** v395, root-level ZIP containing only changed/new source and tests. **Date:** 2026-11-07, Beijing time (UTC+08).

## Independently observed failure

The user identified an additional Contents/Results omission: older mathematics books frequently print **the number before the declaration type**, for example **`C.10 Theorem`** rather than `Theorem C.10`. In the original 253-page *Enrico Giusti, Minimal Surfaces and Functions of Bounded Variation* (1984), Appendix C prints results `C.1` through `C.11`; Appendix A prints `A.1 De La Vallée Poussin Theorem`. The actual archived PDF.js detector lines (from the user-supplied v393+ JSON raw export) contain **`C.lO Theorem`**, **`C.ll Theorem`**, **`C.l. Theorem`**, and **`· C.S Theorem (Liouville's Theorem)`** instead of their printed `C.10`, `C.11`, `C.1`, and `C.8` glyphs. Native text has 1/l and 0/O ambiguity; S is ambiguous with 5 and 8. The images from the original PDF, particularly pages **231, 240, 242–247**, were inspected to confirm the true labels.

The v394 Results parser handled number-first **numeric** identifiers but not appendix-letter-first identifiers. On the genuine exported detector lines it missed the entire set of 12 appendix mathematical Results. It also incorrectly indexed **`Theorem 125`** on page 253, which is an alphabetical Subject Index headword with folio 125 on the continuation of the Subject Index, **not** a theorem. Yau (1978)'s existing Results were a non-regression control.

## Fix classes

1. **Number-first appendix declaration grammar.** In `js/41-equations-bibliography.js`, accept high-confidence `C.10 Theorem: ...`, `C.11 Lemma. ...`, `B-3 Corollary: ...`, `AA.2 Proposition (...): ...`, `A.1 Theorem` and conventional `Theorem C.10`; preserve the printed appendix family and page-relative coordinate. Type words may follow the number; they need a genuine declaration form, not a naked substring match. Ordinary numeric Results continue to use their existing parser.
2. **Eponymic type-after-title declarations.** Accept `A.1 De La Vallee Poussin Theorem: Suppose ...` with a substantive statement. Reject `A.2 Theorem A.1 for vector-valued measures` / `A.3 Theorem A.1 for Caccioppoli Sets`, which are appendix **subsection headings** referencing A.1, not separately numbered Theorems. Parenthesized equation labels `(C.10)` and prose `From Theorem C.10` remain negative controls.
3. **Conservative glyph normalization.** Normalize `l`/`I`→`1`, `O`→`0` **only within an already recognized appendix Result number token**. A lone `S` is not converted automatically. A real `C.S Theorem` observation can be resolved to `C.8` **only** when an observed `Theorem C.7` immediately precedes it and `Theorem C.9` immediately follows within a bounded three-page local window, with no `Theorem C.8` already present. No missing Result is manufactured from sequence alone. Retain the literal observed title as `appendixOriginalNumberText` on the resolved entry. Unbracketed ambiguity is excluded rather than invented.
4. **Proof references and Structure ownership.** Recognize `Theorem C.10` / OCR variant `Theorem C.lO` in result/proof cross-reference extraction and canonicalize them to the same lookup key without modifying underlying OCR text. Prevent `C.lO Theorem:` from reappearing as a Structure heading. All existing normal Results and genuine Structure section-title formats remain eligible.
5. **Back-of-book Subject Index continuation.** Once a dense, explicitly headed Subject Index starts near the end of the book, subsequent index pages cannot inject folio-labelled pseudo-Results. A new genuine top-of-page Chapter/Appendix heading can end this suppression for unusually ordered documents. The header detector now accepts the actual Giusti index heading at relative y≈0.127.

The **Structure index version advances 48→49** to invalidate only the obsolete cached classification and rebuild it on ordinary open; the Equations version and underlying OCR model settings remain unchanged. Existing user manual edits, raw diagnostic exports, equation OCR, PDF rendering and navigation behavior were not intentionally changed.

## Actual original-export comparison — complete documents

Replayed **all detector input lines, not just sampled pages**, from the two complete user JSON exports using both the unchanged v394 and updated v395 production Results builder:

| Book or paper | Original PDF pages | v394 Results | v395 Results | Exact difference |
|---|---:|---:|---:|---|
| Giusti (1984) | 253 | 185 | **196** | **+12 verified appendix declarations; −1 false Subject Index folio** |
| Yau (1978) | 73 | 13 | **13** | No labels added or removed |

Recovered Giusti labels (original PDF page): **Theorem A.1** (231), **Theorem C.1** (240), **Theorem C.2** (242), **Theorem C.3** (242), **Theorem C.4** (243), **Lemma C.5** (244), **Lemma C.6** (244), **Theorem C.7** (245), **Theorem C.8** (246), **Theorem C.9** (246), **Theorem C.10** (246), **Theorem C.11** (247). Removed spurious **Theorem 125** (253). All **184** Giusti Results common to v394 and v395 kept exactly their prior **label, PDF page and ratio**; all 13 Yau Results kept theirs.

The attached test fixtures retain **16 original Giusti pages** and **19 original Yau pages** of exported detector input lines, not retyped textbook content or fabricated PDF outputs. The targeted real-source regression has **164 assertions**, including output labels, coordinates, deduplication, proof-to-Result reference normalization, equation/section/prose negatives, sequence-constrained ambiguity, and Yau unchanged. This regression fails against v394's parser on `A.1` and `C.10`. The programmatic full-document replay was also run before delivery, but its 253+73-page derived temporary files are not redistributed in the root patch because both complete raw exports were already supplied by the user.

## Validation and limitations

- `node --check` on every changed JS file and on the concatenated ten-part runtime: required PASS.
- **40/40 Node regression suites PASS** (including the 164-assertion historical Results test), **5/5 Python regression scripts PASS**, **8/8 distinct Chromium scripts PASS** (real browser DOM tests, **mocked** page/OCR workers). The live source browser Texify/OCR runtime was **not** exercised here; export replay tests final detection, not character/LaTeX OCR precision.
- The **previously missing printed equation `(A.1)` on Giusti page 231 remains unresolved**. The newly recovered **Theorem A.1** is a separate *Result declaration*, not a substitute for the missing formula label. The 11-document OCR audit of v394 is historical evidence and **has not been re-certified as full live MathReader OCR** in this patch.
- Unusual appendix naming, low-confidence/isolated `S`, `B` vs `8`, unobserved letters, OCR with missing declaration words, uncommon case and multi-column layouts still require independent evidence; do not blindly change an index label based on a gap or claim 100% accuracy.
- Reopening after deployment should trigger a Structure/Results refresh due to index version 49; check original Giusti pp.231 and 240–247, Yau Results, index page 253, and reading position in a live browser. **No live original-PDF/browser load or user-side deployment was run** in this session.

## Commands (Windows root `D:\Workspace`)

```powershell
cd D:\Workspace
node --check .\mathreader\mathreader.js
node --check .\mathreader\js\40-outline-structure.js
node --check .\mathreader\js\41-equations-bibliography.js
node .\mathreader\tests\historical_appendix_results_v395_regression.js
node .\mathreader\tests\historical_native_pdf_detection_v394_regression.js
node .\mathreader\tests\historical_bibliography_v394_regression.js
Get-ChildItem .\mathreader\tests\*.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" } }
```
