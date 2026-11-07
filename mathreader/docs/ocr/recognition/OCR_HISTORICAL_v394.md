# MathReader v394 — original-PDF historical detection and OCR audit

**Baseline:** complete, cleanly reconstructed v393 source. **Target:** v394.
**Audit date:** 2026-11-07, Beijing UTC+08. **Scope:** P0 classification reliability only. No OCR engine configuration, automatic OCR policy, layout, PDF rendering, reading state, formula model, or P1 link behavior was intentionally modified.

## Source evidence and provenance

The two *new* user-supplied `mathreader.reading-data@1` JSON exports contained original PDF.js text items, transforms and exact detector inputs for all 253 pages of Enrico Giusti, *Minimal Surfaces and Functions of Bounded Variation* (1984) and all 73 pages of Yau, *On the Ricci Curvature ... and the Complex Monge–Ampère Equation I* (1978). Both original PDFs were recovered from the user's ChatGPT Library, rendered and manually inspected. **These exports have `documentOcr: null`; they do not represent full raw Texify or Tesseract browser OCR output.** Yau did contain some *saved equation-margin* OCR observations, which were separately retained in the original exports.

The regression bundle retains selected **unaltered PDF.js source items** for 43 Giusti and 18 Yau pages in `regression/historical_native_pages_v394.json`, five pages of detector line evidence from actual exports, and independently visually reviewed displayed-equation targets in `regression/historical_visual_equation_truth_v394.json`. They are derived evidence, not synthetic PDFs or claims of OCR character correctness. The full original PDFs are **not** included in the root patch, which contains only changed/new source and test files.

## Confirmed defect classes and corrections

1. **Mathematical formula/prose → Structure false positives in large-font, old text-layer books.** The v393 typography detector reproduced the Giusti export's **175** Structure rows, including integrals, sentences, theorem declarations, and facing-page running headers (e.g. PDF p.125). When at least five pages establish a high-confidence, large-font *lexical title* profile, v394 confines the loose font fallback to more credible heading candidates, suppresses math/prose misclassifications and repeated alternating headers, and retains explicit numbered/known heading rules. **On the two actual exported source-item datasets, v394 returns 24 Giusti rows and the same 13 Yau rows.** The 24 Giusti rows are the 17 printed chapters, Parts 1–2, Appendices A–C, Bibliography and Subject Index. All 17 printed chapter numbers are reconstructed from actual same-line PDF glyphs (never guessed).
2. **Multi-line chapter/appendix titles split or truncated.** Giusti p.14 and p.148 Part headings, p.87/98 `Approximation of Minimal Sets (I)/(II)`, p.164 `The a priori Estimate for the Gradient`, p.195 multi-line title, and p.239 Appendix C are now joined from actual adjacent large-print source geometry. The join is conditional on an already confirmed oversize lexical title, close line spacing, font-size agreement and nonformula continuation text. An isolated short line is never promoted independently.
3. **Previous reference's title absorbs the *next* bibliography author.** On Giusti p.248, the author is printed on a preceding standalone line, followed by the reference key. The original `[AR]` lost `ADAMS, R.A.` and incorrectly acquired `ALLARD, W.`; many subsequent keyed references were similarly damaged. v394 recognizes a left-margin, predominantly uppercase surname/initials line **only when the immediately following line starts an author key**, stores the printed author for that key and subsequent same-author entries, and stops the preceding entry. A tightly scoped, observed `]`→`}` closing-bracket repair recovers the printed `[BDGM]` key from `[BDGM}` only with confirmed author-heading context. The real source-line replay changes Giusti from **74 → 75** keyed references, without changing Yau's **15** numeric references. The full original book would need independent review for remaining typography/diacritic OCR errors.
4. **Numerical sorting overrides genuine printed equation sequence.** On Yau's original PDF p.8, `(1.21)` is visibly printed *after* `(1.33)` (an authentic editorial ordering). v393 sorted these same-page labels numerically. v394 respects printed page position when **both** entries have valid measured candidate bounding boxes separated by at least 0.024 page height; two-column reading order continues to take priority. For entries with only approximate OCR positions, prior numeric fallback remains; explicit user drag ordering remains authoritative. The real exported Yau row ordering now reproduces the original page; earlier numerical-sort regression inputs without measured geometry are unchanged.

The Structure persistent index version advances **47 → 48** so previously saved classification is not treated as current. The Equation persistence version **remains 26**: this change corrects the presentation/reconciliation comparator, not recognized equations, and existing saved/manual labels are preserved.

## Independent printed-equation spot check — actual page images

Four **independently visually inspected** printed pages were annotated: Yau PDF pp.5 and 8, Giusti PDF pp.231 and 239. There are **23** distinct printed equation labels; the latest user export recorded **22**, all with page-relative navigation location within **0.04 of the approximate visually checked coordinates**. There were **zero** additional labels on these selected pages. This is a deliberately narrow **22/23 observed-label recall, 22/22 observed-label precision** measurement *on four selected pages only* — **not** whole-document, OCR model, or formula recognition accuracy. The regression asserts the ordering and coordinates; no unmeasured mathematical correctness is claimed.

**Outstanding missing target:** Giusti p.231 has printed `(A.1)` immediately before `(A.2)` and `(A.3)`, but that label is absent from the native PDF.js text layer and from this export's equation index; the export contains no saved page-margin/Meticulous OCR on p.231. Offline Tesseract read the printed `(A.1)` as an ambiguous `(Al)` on this page. No auto-filled `(A.1)` is added, since sequence inference would invent evidence; recover it through explicit image-margin OCR and manual verification. The existing additive Meticulous OCR, reading-position restoration and persistence behavior was **not** altered in v394.

## Cross-document historical OCR diagnostic — engine separated from application

The 11 distinct PDFs are **10 real original papers/books plus one generated formula stress control**, drawn from available user Library files. Fields include classical geometry/PDE, the 1978 Monge–Ampère paper, a fully scanned Riemannian geometry textbook, Ahlfors's *Conformal Invariants*, a 1988 probability/analytic inequalities paper (Pisier), a 1967 Banach-space geometry article (Gromov), 1987 Yamabe work, 2010 algebraic geometry/Donaldson–Thomas theory, and mixed/text-layer minimal-surface papers. Geography is not the focus; distribution is still *not* the desired 50 distinct old books or a balanced pre-1950 sample.

**Offline diagnostic protocol:** rasterize actual PDF pages with PyMuPDF grayscale at ~126 dpi; call `tesseract` 5.5, `eng`, `--psm 3`, `OMP_THREAD_LIMIT=1`. Preserve page counts, checksums, OCR lengths and elapsed worker seconds in `regression/historical_ocr_coverage_v394.json`. This is a **diagnostic alternative engine**, not MathReader's production browser PDF.js/Texify/OCR workers.

| OCR campaign | PDFs | Original pages actually rasterized | Nonempty OCR | Observed errors | Scope |
|---|---:|---:|---:|---:|---|
| Varied-page sample | 11 | 89 | 88 | 0 | One empty page: Ahlfors's visually blank final page |
| Full document, Giusti + Yau + image-only 19p paper | 3 | 345 | 341 | 0 | Four empty pages (Giusti 3, 7, 15, 149) are visibly/structurally blank |

The 89-page sample overlaps the three full documents; **434 page-processing executions are not 434 distinct pages**. The full-document run comprises **all 253 + 73 + 19 pages**, with **345/345 successful Tesseract process exits**. Measured total worker time was ~256 s (parallel invocations; **not** user-facing document load or browser inference latency), with the separate sample ~67.7 s. OCR producing text, even on all nonblank pages, is **not a precision/recall/LaTeX-fidelity pass**. Raw output and page-by-page source/checksum metrics were kept in run-time evidence; the ZIP ships lightweight reproducibility metadata, not copyrighted PDFs.

## Actual executed regression gates

- The **real production** native-typography detector was replayed using selected original PDF.js `items` and viewport transforms: **24/24 printed Giusti heads, 13/13 Yau heads**, plus 88 assertions (title text, page, forbidden formula/prose, page-relative position). The same test **fails on clean v393**, providing an actual red→green reproduction.
- The actual bibliography builder was replayed from the exported PDF page **line** inputs: **75 Giusti / 15 Yau** bibliographic entries and 27 source-based assertions. Yau's numbered bibliography, including reference 11, is preserved.
- Equation comparator + source-page spot check: **33 assertions**, including print ordering of Yau `(1.21)`, measured geometry, zero extra labels on four checked pages and the documented unresolved Giusti `(A.1)` miss.
- **39/39 JavaScript suites PASS**; **5/5 non-browser Python regression scripts PASS**; **8 distinct Chromium regression scripts PASS** (real DOM/canvas layout tests, but **mocked PDF page and OCR workers**). All changed JS files and assembled runtime also require the separate syntax gate.
- ZIP integrity and clean replay over unchanged v393 source must pass before release; document actual check results in `REGRESSION.md`.

## Regression limits and mandatory next work

- **Not certified:** 50 distinct original math textbooks, broad pre-1950 scans, readable printed OCR at 100%, full-document four-index mathematical ground truth for each book, handwritten pages, independent formula-to-LaTeX semantic correctness, full production Texify/browser PDF.js OCR, actual-browser PDF loading/IndexedDB synchronization, browser heap/performance under hundreds of pages, and cancellation/rapid PDF switching with live workers. The offline probe's successful process exits do not fill these gaps.
- **Unresolved Giusti `(A.1)`** on p.231: requires actual image-based OCR or human verification. No sequence-filling or hidden automatic fallback is authorized.
- **Potential new regression, to monitor:** the native large-title profile activates only with five independently confident oversize headings, so books with fewer strong chapter headings may still exhibit old false positives; extremely ornate heading fonts may suppress genuine titles. Multi-column OCR and unusual heading typography are not certified by the native-layer replay.
- **Potential bibliography regression, to monitor:** standalone author-heading detection assumes upper-case surname/initials and a nearby left-margin keyed entry. Different-language/lowercase authors, author lines split across page boundaries, or unusually long headings remain out of scope; the `{}` repair is deliberately author-context-only. `currentBibliographyAuthorHeading` resets per index build and is not saved across documents.
- **Potential equation-order regression, to monitor:** if an OCR layer reports believable but incorrect bounding boxes, same-page coordinates may still misorder equations. Numerical fallback is kept for entries without both measured candidate bounds. **Do not** infer labels from mere numbering continuity.
- **No unrelated changes:** OCR provider settings, Meticulous OCR request semantics, application UI layout, readers' stored navigation and manual edits, bibliography links and P1 restrictions are unchanged.

## Reproduction commands (from Windows Workspace root)

```powershell
cd D:\Workspace
node --check .\mathreader\mathreader.js
node --check .\mathreader\js\40-outline-structure.js
node --check .\mathreader\js\41-equations-bibliography.js
node .\mathreader\tests\historical_native_pdf_detection_v394_regression.js
node .\mathreader\tests\historical_bibliography_v394_regression.js
node .\mathreader\tests\historical_equation_positions_v394_regression.js
Get-ChildItem .\mathreader\tests\*.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" } }
```

Optional diagnostic with **locally supplied, lawfully held PDF files**, Python/PyMuPDF/Tesseract installed:

```powershell
python .\mathreader\regression_tools\historical_ocr_probe_v394.py --pdf-dir .\temp\historical-pdfs --out .\temp\historical-audit.json --workers 3
```

Do not expose a completed 50-book or actual Texify model certification until the source PDFs and real browser harness have been run against independent ground truth. Document *all* suspicious partial failures in `REGRESSION.md` before another algorithmic change.
