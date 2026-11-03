# MathReader Regression Record — v330

Date: 2026-11-02 (America/Los_Angeles)

## Regression rules

- Every regression must include genuinely new files plus a selective subset of older regression fixtures.
- Prefer pre-21st-century mathematical works, especially old scans, degraded text layers, historical typography, books, proceedings, and journal articles. Modern/arXiv-style files are a small control minority.
- New files should span different branches of mathematics or adjacent technical fields rather than clustering in one subject.
- Always include image-only/image-heavy PDFs and selectively include handwritten mathematical notes.
- Standard readable files are held to strict visible-page ground truth for Structure, Results, Equations, and Bibliography: both completeness and false positives matter.
- Extremely illegible, corrupted, broken, or pathological files may use relaxed acceptance. Such outliers must not drive detector changes unless the behavior is reproducible as a class problem or violates a clear general invariant.
- Equation and bibliography detection receive special scrutiny on old PDFs. Image OCR must be checked for full-document accuracy, downstream detection stability, and performance.
- Code changes are allowed only for reproducible class-level problems, never to special-case one document.
- Regression work is bounded to avoid timeout. If exhaustive validation is unsafe in one run, strict representative coverage is preferred and unfinished items are recorded here rather than silently treated as passes.
- Any uncertain exception, possible side effect, or item requiring manual browser validation must be recorded below.

## Files covered

### New / newly selected for this campaign

| File | Field / type | Acceptance | Result / note |
|---|---|---|---|
| `Caffarelli_1989.pdf` | PDE / critical semilinear elliptic equations, 1989 | Diagnostic, not full strict equation acceptance | Native detector: 23 Equations / 18 Results / 10 Bibliography. Full high-resolution margin-OCR inventory was not completed within the bounded run; see Unresolved / manual checks. |
| `Schoen_Yau_Positive_Mass_Theorem.pdf` | Geometric analysis / general relativity, clean modern control | Strict | 6 Equations / 7 Results / 7 Bibliography. Used to validate reference-page reading order and bibliography boundary handling. |
| `581_Note_2.pdf` | Handwritten inverse-problems / distribution notes | Relaxed OCR stress | Full-document OCR proxy completed. Downstream detector remained conservative: 0 numbered Equations / 0 Results / 0 Bibliography. Handwriting transcription accuracy is not claimed to be complete. |
| `GA_Seminar_Note_1.pdf` | Handwritten geometry seminar notes | Relaxed OCR stress | Full-document OCR proxy completed. Downstream detector remained conservative: 0 numbered Equations / 0 Results / 0 Bibliography. Handwriting transcription accuracy is not claimed to be complete. |

### Selectively retested older strict fixtures

| File | Field / type | Accepted detection |
|---|---|---|
| `Yau_1978_Calabi.pdf` | complex geometry / Monge–Ampère, old journal PDF | 256 Equations / 13 Results / 15 Bibliography |
| `Pisier_1988_Riesz_Transforms.pdf` | probability / harmonic analysis, digitized old journal PDF | 25 Equations / 7 Results / 17 Bibliography |
| `Gromov_1967_Banach.pdf` | functional analysis / geometry, historical typesetting | 16 Equations / 14 Results / 9 Bibliography |
| `Ahlfors_Conformal_Invariants.pdf` | complex analysis / geometric function theory, old book | 163 Equations / 95 Results / 66 Bibliography |
| `Schoen_1983_Minimal_Surfaces_image_only.pdf` | minimal surfaces, image-only scan | 0 numbered Equations / 16 Results / 14 Bibliography |
| `YamabeProblem.pdf` | geometric analysis, older long paper | 62 Equations / 51 Results / 46 Bibliography |

Notes:
- For the image-only Schoen fixture, the displayed mathematics is unnumbered; zero numbered equation labels is intentional. Visual review also confirms the unnumbered `Definition.` is a genuine Result item, so 16 Results is the accepted count.
- Strict old-fixture equation totals above include the established posterior image-margin OCR recovery path, not just native PDF text-layer extraction.

## Confirmed class-level defects fixed in v330

### 1. Wrapped old-book section headings falsely indexed as Results

Old books can split a heading such as `PROOF OF THE ...` onto one line and `THEOREM (PART I)` onto the next. The second line previously looked like an unnumbered theorem and entered Results. The detector now rejects that continuation when the preceding nearby line establishes the section-heading context. This removed the two false Ahlfors Results while preserving genuine theorems.

### 2. Single-column bibliography pages could be reordered as two columns

PDF span geometry inside one long reference line can create large horizontal gaps that resemble two-column layout. On a page where prose precedes an explicit `References` heading, this could reorder entries and attach pre-bibliography prose to a citation. v330 now:

- treats an explicit bibliography heading as a hard reading-order boundary on that page;
- preserves pre-heading material separately;
- recognizes repeated full-width hanging reference entries as a single-column bibliography even when their internal PDF spans contain wide gaps.

The clean control now preserves `[1] ... [7]` in reading order without Conclusions prose contaminating a reference.

## OCR accuracy and performance checks

Image/OCR coverage in this campaign included the 19-page image-only Schoen paper plus six pages of handwritten notes.

Proxy full-document OCR measurements in this regression environment:

- image-only Schoen paper: 19 pages, about 26.8 s total, about 1.41 s/page;
- handwritten `581_Note_2.pdf` + `GA_Seminar_Note_1.pdf`: 6 pages, about 8.18 s total, about 1.36 s/page.

These timings use the local PyMuPDF/Tesseract regression proxy. They are useful for relative regression detection but are **not** a benchmark of MathReader's production browser/Texify OCR path. Production full-document OCR speed and transcription quality still require browser-side validation when OCR implementation/performance changes.

For the handwritten samples, OCR text quality was poor enough that 100% transcription accuracy is not a reasonable release gate. The important stability result is that noisy OCR did not create false equation/result/bibliography structures.

## Unresolved / manual checks / future reference

- `Caffarelli_1989.pdf`: native Structure/Results/Bibliography behavior was checked, but a full 27-page high-resolution equation-margin OCR inventory exceeded the bounded regression run. Therefore 23 native Equations is **not** asserted as complete. This document should be revisited with the browser production OCR path or a bounded page-priority inventory before it becomes a strict equation golden fixture.
- Handwritten notes: production OCR transcription quality was not manually graded symbol-by-symbol. They are currently OCR robustness/stability fixtures, not exact transcription goldens.
- OCR performance numbers above are proxy measurements, not browser/Texify timings. Manual browser full-document OCR profiling remains appropriate if a future change touches the OCR engine, render scale, batching, or scheduling.
- Historical candidate PDFs visually inspected during corpus selection (including Turing 1936, Nash 1956, and Milnor 1956) were not executed through the local regression harness in this bounded run and are **not counted as passes**. They are good candidates for future new-file campaigns.
- Any future fix that expands recovery on unusually degraded or rare layouts must first demonstrate the same failure class on multiple documents; isolated pathological text must not broaden normal detection heuristics.

## Cleanup / release gates

- Re-run syntax checking on all MathReader JavaScript files.
- Confirm version consistency: application v330, Structure index v36, Equation summary index v17.
- Confirm only intended source/version files plus this regression record changed from v329.
- Verify release ZIP integrity and root `mathreader/` layout.
- No debug payloads, OCR render intermediates, or regression scratch files belong in the release package.
