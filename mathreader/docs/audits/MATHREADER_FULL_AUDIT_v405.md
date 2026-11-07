# MathReader — v404 post-release comprehensive audit (campaign v405)

Date: 2026-11-07, Beijing UTC+08. Baseline: exact user v401 ZIP + root-level v402, v403, and v404 patches, applied in that order. **This campaign changes no production JavaScript, CSS, OCR model, browser storage, runtime version, or indexes.** Audit deliverable is a minimal root-level documentation/test patch, not a new application release.

## Verdict

- **PASS — existing automated regressions:** Fresh v404-baseline run of 48/48 JavaScript and 20/20 Python/Chromium suites; final audit-overlay run of **48/48 JavaScript and 21/21 Python/Chromium suites (69/69)**, including the new corpus-integrity negative-control test. Those are code, simulated browser, isolated Chromium UI, and source-level assertions, not full production PDF.js/Texify accuracy.
- **PASS — source parser execution:** All 1,120 pages of 11 real PDFs traversed with the source equation/Results/bibliography parser. Seven PDFs / 595 pages use saved original MathReader PDF.js detector input. Four additional PDFs / 525 pages use **PyMuPDF geometry proxy** input. Zero parser exceptions. Raw candidate counts (943 Results; 6,315 equation-candidate lines) are **not** precision/recall or final index counts.
- **PASS — saved index structure checks:** Seven exported indexes total 122 Structure, 380 Results, 848 Equation, 246 Bibliography entries. No saved page/ratio out-of-range entries. 356 bibliography citations and 208 resolved proof-use targets have structurally valid coordinates/target labels. Another 30 unresolved free-text proof references require source review; they are not automatically bad links.
- **PASS — offline OCR process only:** Independent CLI Tesseract `eng` on **90 sampled pages spanning all 11 PDFs** completed all 90, with **88 nonempty outputs**. The empty outputs are Ahlfors p.172 and `geometric_measure_theory_split_pages` p.1, both with no native text. This is **not** MathReader's browser engine, and not proof of correct mathematical recognition. 
- **BLOCKED — paired original source check:** The available `YamabeProblem.pdf` has SHA-256 `11a7a3c6...`, but the available 56-page MathReader export identifies `8d07e079...`. Never equate their image text or geometry until matching original source bytes are available. All six other original PDF/export identity checks agree.
- **FAIL — live evidence durability (accepted limitation):** User's Ahlfors real browser exports `(6).json` and `(7).json` have identical PDF identity; margin OCR evidence drops **172 page-side records / 4,054 lines → 0** after Ctrl+Shift+R, while two annotations and final detection indexes persist. v404 `persistence: verified` in the earlier export does not guarantee post-reload durability. The user explicitly opted to acknowledge this and **not** repeatedly patch this issue. Browser reload itself does not inherently clear IndexedDB; the failure is in the current observed MathReader workflow, precise mechanism unknown.
- **CONFIRMED missing label:** Printed Giusti equation `(A.1)` on original PDF p.231 is missing from the saved Equation index. Independent original-page visual review confirms it is distinct from Result `Theorem A.1`; local full-page Tesseract reads `(Al)` in the equation location, demonstrating glyph ambiguity even when OCR executes. Previous v402 planner logic may schedule a recovery but this export does not prove that the label was recovered in production.
- **UNVERIFIED:** Full-document math/formula OCR accuracy; semantic accuracy of every indexed label and proof relationship; Texify image-to-LaTeX on original images; real multi-document PDF.js navigation / resource disposal; real production worker cancellation, repeated modal use, memory ceiling, and live reload behavior beyond the already failed Ahlfors case. No 100%-accuracy claim is justified.

## Original corpus examined

| Document | Original PDF pages | Evidence |
| --- | ---: | --- |
| Giusti, *Minimal Surfaces and Functions of Bounded Variation* (1984) | 253 | Original PDF + saved full text/index; manual p.231 appendix inspection |
| Ahlfors, *Conformal Invariants* | 172 | Original PDF + newest live v404 export; manual p.81 equation and p.172 blank-page checks |
| S.-T. Yau (1978) | 73 | Original PDF + exported full text/index; manual p.38 unnumbered lemma |
| *Yamabe Problem* | 56 | Original PDF and export, **SHA mismatch**, not legitimate paired ground truth |
| L. Simon, minimal graphs over exterior domains | 13 | Original PDF + export; p.7 `1.18. LEMMA` visually checked, not a false positive |
| `SPS_1988__22__485_0` | 18 | Original PDF + export |
| `geometrical_hypothesis_Banach` | 10 | Original PDF + export; p.4 equation numbers inspected |
| *The Classic Solution to the Yamabe Problem* | 26 | Original PDF only, PyMuPDF detector proxy |
| arXiv `1209.2203v2` | 88 | Original PDF only, PyMuPDF detector proxy |
| UUID-named additional mathematics PDF | 137 | Original PDF only, PyMuPDF detector proxy |
| *geometric_measure_theory_split_pages* | 274 | Original PDF only, PyMuPDF detector proxy |
| **Total** | **1,120** | Seven established regression originals (595 pages) plus four additional accessible mathematics PDFs (525 pages) |

This inventory enumerates the **11 selected accessible MathReader-related original PDFs tested in this campaign**, not all possible PDFs across the user's entire file Library. SHA values and native text coverage are in the structured audit report. Some originals have sparse native text; they must not be assumed blank or OCR-accurate without visual review. All 7 saved full exports report `fullDocumentOcr: not-stored`.

## Other key behaviors exercised by existing regression suites

- UI: responsive sidebars, compact Settings headings, controls, light/dark, tutorials, menu, no orphan text, viewports, multi-PDF open guard and document switches.
- OCR: cancellation and late results, force OCR, first-open workflow, meticulous per-page OCR, page-coordinate mapping and navigation, appendix numbering, OCR worker lazy initialization, OCR status/queue semantics, source cache identity, partial margin rescans, source-level evidence persistence and reload ordering.
- Detection: headings, theorem/lemma/results, proof links, bibliography boundaries/citations, equation order/printed positions, formula LaTeX syntax and MathJax compilation, appendices, multi-document constraints.
- Data: export checkbox combinations and no-OCR export, PDF/native data coverage, notes/annotations/selection, import compatibility, document identity and cache guards.
- Performance: bounded scheduling, safety invariants and UI/browser shell regression, not quantitative live engine speed or production memory profiling.

## Newly available repeatable tool

`regression_tools/corpus_integrity_v405.py` reads a manifest of original PDF paths and optional MathReader JSON export paths. It rejects out-of-range saved navigation coordinates and dangling resolved proof links, and explicitly marks mismatched PDF/export hash pairs **BLOCKED_PAIR**, instead of using one PDF as false visual ground truth for another. It does not modify files, run OCR or infer mathematics. Its negative-control regression is `tests/corpus_integrity_v405_regression.py`.

Example invocation (from project root, with your own local manifest and PDF paths):

```bash
python mathreader/regression_tools/corpus_integrity_v405.py --manifest /path/to/corpus_manifest.json --out /path/to/corpus_audit.json
```

Manifest format: `{"documents":[{"name":"Ahlfors","pdf":"original.pdf","export":"original-mathreader.json"}]}`. Relative PDF/export paths resolve against the manifest's directory. The original PDFs, raw OCR samples and full exports are deliberately excluded from this ZIP to avoid redistributing copyrighted content and personal annotations.

## Priority / follow-up decisions

1. **P0 retained known limitation:** Ahlfors raw margin observations disappear on hard reload in the real v404 browser test. Do not claim persistence fixed; do not restart iterative persistence work without a new user request. Existing detection indexes and annotations were retained in that test.
2. **P0 recognition gap:** Giusti printed `(A.1)` still absent. Maintain as a known visual-ground-truth failure, and do not fabricate labels from numbering continuity.
3. **P0 incomplete certification:** Obtain genuinely matched source/export pairs for Yamabe and additional historical PDFs, source-linked image-to-LaTeX tests and independent printed mathematics truth before reporting accuracy percentages.
4. **P1 quality and durability checks:** Confirm live PDF.js click targets, multi-document memory/worker races, and genuine indexed navigation using original PDF source; the existing script-level tests are necessary but not sufficient.

Five exact-hash historical exports (Simon, Banach, SPS, Yamabe, Yau) also passed the existing v399 Structure replay with **23 source-level assertions** and 170 PDF.js page records; the two other exact v399 export files were unavailable in the current corpus and were not quietly substituted. The newer Ahlfors/Giusti exports were checked for structural invariants, not compared to different-version goldens.

No production heuristic changed: the campaign did not establish a new, general, safely reproducible correction that would justify altering recognizer behavior in this release.
