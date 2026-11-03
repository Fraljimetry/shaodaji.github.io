# MathReader Regression Record — v333

Date: 2026-11-02 (America/Los_Angeles)

## Regression rules

- Every regression must contain genuinely new or newly rotated files plus a selective subset of older difficult fixtures.
- Do not let geometric analysis dominate. Deliberately distribute coverage across substantially different branches of mathematics and adjacent technical fields.
- Prefer pre-21st-century works, old scans, historical typography, degraded text layers, books, proceedings, and journal papers. Modern/arXiv material is a minority control.
- Always test image-only/image-heavy PDFs and selectively test handwritten mathematical notes.
- Standard readable files require strict visible-page ground truth for Results, Equations, and Bibliography; both missing items and false positives are release blockers.
- Extremely illegible, corrupted, or pathological files may use relaxed acceptance and must not drive detector changes unless the behavior is a reproducible class problem or violates a clear invariant.
- Equation and bibliography detection receive special scrutiny. Full-document OCR is checked for accuracy, downstream detection stability, and performance.
- Code changes are allowed only for class-level problems, never to special-case one document.
- Regression is bounded to avoid timeout. Cached OCR geometry may be reused only for byte-identical fixtures; the current detector must still be rerun against it.
- Record uncertain exceptions, possible side effects, and anything still requiring manual browser/Texify validation.

## Files covered

### New / newly rotated relative to v332

| File | Branch / type | Acceptance | v333 result |
|---|---|---|---|
| `2309.00806v2.pdf` | algebra / matrix theory / stable polynomials | **Strict standard** | **0 Equations / 26 Results / 18 Bibliography.** Visible `Main Result 1–4` are now indexed in addition to theorem/lemma/corollary/example declarations. The 18 visible bibliography entries are complete. Parenthesized `(1)/(2)` items on pp. 2–3 are prose alternatives, not equation labels. |
| `lean_quintessential_examples_collection.pdf` | formal theorem proving / logic / algebra / analysis | Relaxed unusual-layout control | **0 Equations / 259 Results / 5 Bibliography.** The document visibly contains 261 numbered `Example n.` headings; `Example 191–193` are missed and one inline Lean source declaration `example (a b : Real)` is falsely promoted. This is recorded but not patched because source-code prose is an unusual mixed layout and no multi-document class has been established. |
| `mathreader_formula_ocr_stress_test.pdf` | formula/OCR stress across algebra, analysis, geometry, tensors | Strict native + OCR stress | Native: **8 Equations / 0 Results / 0 Bibliography** (`(1)–(8)`). Full-page OCR: **7 Equations**, with visible `(3)` read by the OCR proxy as `(0)` while `(4)–(8)` are recovered. This is treated as OCR-engine evidence, not a detector-class defect. |
| `无穷的历史.pdf` | mathematics history / logic-oriented slide deck | Standard negative control | **0 Equations / 0 Results / 0 Bibliography.** Section/slide headings do not pollute mathematical Results or Equations. |
| `581 Note 5.pdf` | handwritten inverse-problems / Fourier-analysis notes | Relaxed handwritten OCR stress | 4 image pages; full-document OCR gives **0 Equations / 0 Results / 0 Bibliography**. No OCR pollution. Exact symbol transcription is not claimed as a golden. |

### Selectively retested older / difficult pre-2000 fixtures

| File | Branch / era | Acceptance / result |
|---|---|---|
| `Ahlfors_1973_Conformal_Invariants.pdf` | complex analysis / geometric function theory, 1973 | Current v333 image-assisted replay: **163 Equations / 95 Results / 66 Bibliography**. Exact margin evidence restores `(1-4)`, `(1-7)`, `(5-16)`. |
| `Gromov_1967_A_Geometrical_Conjecture_of_Banach.pdf` | functional analysis / Banach-space geometry, 1967 | Current v333 image-assisted replay: **16 / 14 / 9**; exact image evidence restores `(10)`. |
| `Pisier_1988_Riesz_Transforms.pdf` | probability / harmonic analysis, 1988 | Current v333 image-assisted replay: **25 / 7 / 17**; exact image evidence restores `(2.8)`, `(2.9)`, `(2.10)`. |
| `Caffarelli_Gidas_Spruck_1989.pdf` | nonlinear elliptic PDE, 1989 | Native v333 replay unchanged at **23 / 18 / 10**. Established strict visible golden remains **55 / 18 / 10**; equation code was not changed in v333, but the full 55-label image inventory was not re-run in this bounded pass. |
| `Schoen_1983_Uniqueness_Symmetry_Embeddedness_scan.pdf` | classical differential geometry, image-only 1983 scan | Byte-identical strict 180-DPI OCR geometry rerun through v333 gives **0 / 16 / 14**. A fresh 120-DPI full-document OCR performance pass gives **0 / 14 / 11**, demonstrating the expected speed/accuracy trade-off; the lower-resolution loss is not accepted as the strict golden. |

## Confirmed class-level defect fixed in v333

### Explicit `Main Result` headings were omitted from Results

Standard mathematical papers sometimes summarize their principal statements with declarations such as:

- `Main Result 1 (Theorem 4.1). ...`
- `Main Result 2 (Theorem 6.2). ...`

The Results parser recognized theorem/lemma/proposition/corollary/etc. but not the explicit `Main Result n` declaration family. In `2309.00806v2.pdf`, all four visible Main Result headings were therefore missing even though the underlying later theorem/corollary statements were detected.

v333 adds only the exact `Main Result` declaration type to the existing result-heading grammar. Ordinary prose containing the words “main result” remains ineligible because the declaration must still begin the visual line and carry the normal result-number shape.

Regression evidence:

- `2309.00806v2.pdf`: Results **22 → 26**, adding exactly `Main Result 1`, `Main Result 2`, `Main Result 3`, `Main Result 4`.
- Equations and Bibliography for the file remain **0 / 18**.
- Native outputs for Ahlfors, Gromov, Pisier, Caffarelli, the handwritten note, OCR stress file, and math-history control are unchanged.

## OCR accuracy and performance

- `581 Note 5.pdf`: 4 handwritten pages, **2.97 s total / 0.74 s per page** with the local 180-DPI Tesseract regression proxy; no downstream index pollution.
- `mathreader_formula_ocr_stress_test.pdf`: 13 pages, **4.45 s total / 0.34 s per page** with the local 180-DPI proxy. Seven of eight numbered labels are recovered; visible `(3)` is read as `(0)` by this OCR proxy.
- `Schoen_1983_Uniqueness_Symmetry_Embeddedness_scan.pdf`: fresh 120-DPI full-document OCR: **18.35 s / 0.97 s per page**. It is faster/bounded but loses two Results and three bibliography entries relative to the strict 180-DPI cached golden. This lower-resolution path is therefore performance evidence only, not an accuracy acceptance mode.
- The strict Schoen 180-DPI OCR geometry is reused from v332 only because SHA-256 is identical (`f9163309235ffe21546135b4a39a2657ed89691147432dcf00f2827e5a0525c1`); v333 detector code was rerun against that geometry and preserved **0 / 16 / 14**.

These are local regression-proxy measurements, not production browser/Texify benchmarks.

## Unresolved / manual checks / future reference

- `lean_quintessential_examples_collection.pdf` is intentionally **not** used to broaden general Results heuristics. It mixes prose headings with executable Lean source. Three visible numbered examples (`191–193`) are missed and one lowercase source declaration is falsely recognized. Revisit only if similar behavior appears across multiple formal-mathematics/code-heavy documents.
- In `mathreader_formula_ocr_stress_test.pdf`, the OCR proxy reads the visually clear right-margin `(3)` on page 10 as `(0)`. The native text layer is correct and production Formula OCR/Texify may behave differently. Manual browser/Texify verification is appropriate before changing OCR normalization or allowing sequence inference. No label is synthesized from `(4),(5)`.
- Production browser/Texify OCR cannot be exercised end-to-end in this sandbox. Detector logic is exercised with native/OCR geometry, and full-document image OCR is measured separately.
- `Caffarelli_Gidas_Spruck_1989.pdf` was native-replayed in this bounded pass; its 55-label strict visible inventory was established previously and should be rotated back into a future full image-assisted pass.
- Public historical candidates from information theory, computability, mathematical physics, game theory, and analytic number theory were researched for future corpus expansion, but raw PDF bytes could not be safely materialized into this sandbox in this run, so they are **not counted as covered files**.
- Rare or pathological layouts must not broaden mature heuristics unless they become a reproducible class problem.

## Cleanup / release gates

- Application version: **v333**.
- Structure index version: **39**.
- Equation summary index version: **19** (unchanged; no equation-detector semantics changed).
- All JavaScript subsystem files and bootstrap pass `node --check`.
- The only intended behavioral detector change is explicit `Main Result` recognition.
- Selected old pre-2000 native outputs are unchanged; Ahlfors/Gromov/Pisier strict image-assisted goldens pass under v333.
- Strict image-only Schoen golden remains **0 / 16 / 14**.
- Release ZIP must contain only the root `mathreader/` package; no regression scratch files, OCR intermediates, screenshots, or harnesses.
