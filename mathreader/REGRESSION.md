# MathReader Regression Record — v332

Date: 2026-11-02 (America/Los_Angeles)

## Regression rules

- Every regression uses genuinely new or newly rotated files plus a selective subset of older fixtures; it must not simply repeat the immediately previous corpus.
- Prefer pre-21st-century mathematics and adjacent technical literature, especially old journal scans, historical typography, degraded text layers, books, proceedings, and lecture material. Modern/arXiv-style files remain a small control minority.
- New/rotated files should span different branches rather than cluster in one subject.
- Always include image-only/image-heavy PDFs and selectively include handwritten mathematical notes.
- Standard readable files are held to strict visible-page ground truth for Structure, Results, Equations, and Bibliography. Missing items and false positives are both release blockers.
- Extremely illegible, corrupted, broken, or pathological files may use relaxed acceptance. Such outliers must not drive detector changes unless the behavior is reproducible as a class problem or violates a clear invariant.
- Equation and bibliography detection receive special scrutiny on old PDFs. Full-document OCR is checked for accuracy, downstream detection stability, and performance.
- Code changes are allowed only for reproducible class-level problems, never to special-case one document.
- Regression work is bounded to avoid timeout. If exhaustive validation is unsafe, strict representative coverage is preferred and unfinished items are recorded instead of silently treated as passes.
- Any uncertain exception, possible side effect, or item requiring manual browser validation must be recorded below.

## Files covered

### New / newly rotated relative to v331

| File | Field / type | Acceptance | Result / note |
|---|---|---|---|
| `Ahlfors-Conformal-Invariants.pdf` | complex analysis / geometric function theory; original 1973 monograph, scan/OCR text layer | Strict | **163 Equations / 95 Results / 66 Bibliography.** Native layer gives 160 equations; exact image-margin recovery restores `(1-4)`, `(1-7)`, `(5-16)`. |
| `YamabeProblem.pdf` | geometric analysis / PDE; Lee–Parker 1987 survey, scanned/OCR text layer | Strict | **67 Equations / 51 Results / 46 Bibliography.** Native layer gives 62 equations; exact image-margin recovery restores `(1.3)`, `(3.1)`, `(7.3)`, `(7.4)`, `(9.1)`. |
| `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf` | functional equations / Chinese mathematical journal, 2023 | Strict standard multilingual control | **0 numbered Equations / 0 Results / 2 Bibliography.** The visible `(1)–(4)` and later `(1)–(3)` are enumerated assumptions/conditions, not equation labels. Explicit `参考文献` contains exactly two entries. |
| `Riemann球面上的旋转_Fraljimetry.pdf` | complex geometry / linear algebra, 2025 | Strict small modern control | **0 numbered Equations / 0 Results / 0 Bibliography.** Displayed formulas are unnumbered. |
| `581 Note 3.pdf` | handwritten inverse-problems notes | Relaxed OCR stress | Full-document OCR proxy: 3 pages, **0 Equations / 0 Results / 0 Bibliography**. No OCR pollution into content indexes; exact handwriting transcription is not claimed. |

### Selectively retested older / difficult fixtures

| File | Field / type | Accepted detection / regression result |
|---|---|---|
| `yau_1978.pdf` | complex geometry / Monge–Ampère, old journal scan | **256 visible Equations / 13 Results / 15 Bibliography.** Full image-assist replay passed; native text remains 159 labels. `(6.22)` remains a genuine printed-sequence gap. |
| `caffarelli1989.pdf` | nonlinear PDE, 1989 | Native replay remains 23 Equations / 18 Results / 10 Bibliography; established strict visible golden remains **55 Equations / 18 Results / 10 Bibliography**. No native regression from v331. |
| `gromov_1967.pdf` | functional analysis / geometry, 1967 | Native replay remains 15 / 14 / 9; established strict image-assisted golden remains 16 / 14 / 9. |
| `pisier_1988.pdf` | probability / harmonic analysis, 1988 | Native replay remains 22 / 7 / 17; established strict image-assisted golden remains 25 / 7 / 17. |
| `schoen_1983_scan.pdf` | minimal surfaces, 19-page image-only scan | Full-document OCR passed at **0 numbered Equations / 16 Results / 14 Bibliography**. Displayed formulas are unnumbered; zero equation labels is intentional. |
| `covering_spaces_for_geometric_analysis.pdf` | topology / geometric analysis control | v331 regression guard preserved: **0 Equations / 15 Results / 0 Bibliography**; subsection numbers still do not pollute Equations. |
| `lectures_on_pde_split_pages.pdf` | long PDE notes control | v331 guard preserved: 22 Equations / 37 Results / 0 Bibliography; false `Hypothesis y` remains absent. |

## Confirmed class-level defects fixed in v332

### 1. Multilingual bibliography headings were not recognized

The bibliography detector recognized English headings such as `References` and `Bibliography` but not common Chinese/Japanese forms. A standard Chinese journal article with an explicit `参考文献` section therefore returned zero bibliography entries even though its `[1]`, `[2]` entries were otherwise parseable.

v332 recognizes the common heading family `参考文献 / 參考文獻 / 参考资料 / 參考資料 / 参考书目 / 參考書目` using the existing bibliography pipeline. No document-specific title or author rule was added.

Regression evidence:

- `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf`: Bibliography **0 → 2**, matching the visible two-entry reference list.
- Existing old English bibliographies remain unchanged, including Ahlfors 66, Lee–Parker 46, Caffarelli 10, Gromov 9, Pisier 17, Yau 15, Schoen 14.

### 2. Consecutive numbered assumptions/conditions could pollute Equations

A prose condition list can have equation-like left-margin tags such as `(1)`, `(2)`, `(3)`, `(4)` and contain mathematical symbols. The previous classifier could accept isolated members of such a list when the PDF text layer split the prose tail from the tag line.

v332 rejects a parenthesized integer candidate when it belongs to a local run of at least three consecutive, similarly aligned items and the run has clear prose/list evidence (multiple prose-like tails, or prose plus repeated semicolon termination). This is a layout/class rule rather than a file-specific exception.

Regression evidence:

- `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf`: false Equations **2 → 0**. Both numbered condition lists are excluded.
- Ahlfors, Lee–Parker, Caffarelli, Gromov, Pisier, and Yau native equation outputs are unchanged by the new guard.

### 3. v330 accidentally over-tightened scan-backed equation gap planning

Strict replay exposed a pre-existing regression: v330 had increased two posterior OCR planning thresholds. That prevented otherwise mature equation families from scheduling exact image checks for some hidden-text gaps. Lee–Parker 1987 therefore stayed at 62 native labels instead of recovering the five visibly printed missing labels.

v332 restores the mature v329 gap-planning criteria:

- a dense family beginning at `.2` may request its missing first label when the family already has at least five members;
- cross-page small gaps may be checked once an established family has at least four members rather than six.

The recovery remains posterior-only: **the exact label must still be read by image-margin OCR before it is added. No number is synthesized from sequence alone.**

Regression evidence:

- `YamabeProblem.pdf`: **62 → 67**, restoring `(1.3)`, `(3.1)`, `(7.3)`, `(7.4)`, `(9.1)`.
- `Ahlfors-Conformal-Invariants.pdf`: full image-assisted result remains **163**, including three OCR-restored labels.
- `yau_1978.pdf`: full image-assisted result remains the strict **256-label** golden.

## OCR accuracy and performance

Full-document OCR checks in this campaign:

- `schoen_1983_scan.pdf`: 19 image-only pages, about **22.07 s total / 1.16 s per page** using the local PyMuPDF/Tesseract regression proxy; downstream detection is 0 / 16 / 14.
- `581 Note 3.pdf`: 3 handwritten pages, about **2.55 s total / 0.85 s per page**; OCR noise does not create false Structure/Results/Equations/Bibliography entries.
- Full stored image-margin replay was also executed for `yau_1978.pdf` (256-label golden), `YamabeProblem.pdf` (67-label golden), and `Ahlfors-Conformal-Invariants.pdf` (163-label golden).

These timings are local regression-proxy measurements, not browser/Texify production benchmarks. They are used to detect accuracy/performance regressions and gross slowdowns.

## Unresolved / manual checks / future reference

- Production browser/Texify OCR still cannot be exercised end-to-end inside this sandbox. Detector code is exercised directly with PDF/native/OCR geometry, and image OCR is separately validated. Manual browser parity remains appropriate for major OCR changes.
- `581 Note 3.pdf` is a robustness fixture, not a symbol-perfect handwriting transcription golden. Its acceptance target is stable OCR behavior and no downstream index pollution.
- `caffarelli1989.pdf`, `gromov_1967.pdf`, and `pisier_1988.pdf` were selectively replayed natively this time rather than fully re-inventoried visually; their established strict image-assisted goldens remain recorded from prior campaigns.
- The new Chinese bibliography support is intentionally limited to common explicit bibliography headings. It does not attempt language detection or infer unlabeled reference sections.
- The enumerated-condition guard requires a local consecutive run with prose/list evidence. A rare document that intentionally numbers displayed equations as a dense left-aligned semicolon-terminated prose-like list could require manual review; this is not currently evidenced as a class problem.
- Any future expansion for rare layouts must again demonstrate a class-level problem across multiple documents or a clear invariant; isolated pathological files must not broaden normal detection heuristics.

## Cleanup / release gates

- JavaScript syntax check all subsystem files plus bootstrap.
- Confirm version consistency: application v332, Structure index v38, Equation summary index v19.
- Confirm selected old native detector outputs are unchanged except for the intended Chinese condition-list removal.
- Confirm strict image-assisted goldens: Ahlfors 163 / 95 / 66, Lee–Parker 67 / 51 / 46, Yau 256 / 13 / 15, Schoen OCR 0 / 16 / 14.
- Verify release ZIP integrity and root `mathreader/` layout.
- No regression scratch files, OCR intermediates, rendered pages, or harnesses belong in the release package.
