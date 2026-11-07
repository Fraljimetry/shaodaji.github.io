# MathReader Regression / Behavioral Audit Record — v338

Date: 2026-11-02 (America/Los_Angeles)

## v338 comprehensive document-state lifecycle audit

This is a behavioral/state audit on top of the v334 detector regression and v335–v337 import/export fixes below. Detector heuristics are unchanged in v338.

### State transitions audited

- scanned PDF opened without full-document OCR → import portable reading data;
- import → expand Equations / invoke equation-reference lookup while text remains unavailable;
- import → persist → close/reopen the same scanned PDF without OCR;
- old equation snapshot version → portable import under a newer detector version;
- repeated/local equation labels with multiple candidate locations → export/import round trip;
- text-unavailable Search UI → saved/extracted equation-search mode;
- reading-data import against an open PDF with the same filename/page count but a different SHA-256 identity;
- deployment cache-busting for the top-level bootstrap and stylesheet.

### Confirmed behavioral bugs fixed

1. **Portable equations could be destroyed after a successful import.** `ensureEquationIndexRendered()` still interpreted “text unavailable” as authority to clear the equation map. Expanding Equations, equation-reference resolution, command-palette equation access, or reopening the imported scan could therefore erase restored equations. v338 preserves the imported equation map whenever portable content detection is active.
2. **Equation-only Search was implemented but unreachable.** `searchPdf()` already supported saved/extracted equation search without document text, but the Text-unavailable UI disabled the entire Search form. v338 leaves the Equations toggle enabled and enables the query/Find controls when equation-only search is selected; text/fuzzy options remain disabled.
3. **Wrong-PDF import was too permissive.** A mismatched exact document hash was accepted when filename and page count happened to match. v338 requires exact SHA-256 identity whenever both export and open PDF have exact identities. Filename/page-count fallback is retained only for legacy non-hash exports.
4. **Equation export lost alternate locations.** Persistence kept only the first candidate for each normalized equation label. Repeated/local labels could therefore lose valid targets after import. v338 serializes all bounded candidates and restores them as candidate lists.
5. **Portable equation data was coupled to detector-version invalidation.** A future equation-summary version bump could make valid user-exported equation rows disappear. v338 keeps ordinary local caches version-gated but accepts normalized equation rows from portable reading-data imports across detector versions.
6. **Deployment cache busting was stale.** v337 still referenced `mathreader.js?v=333` from `index.html`. A browser/CDN could continue executing an old bootstrap and therefore old subsystem code even after a newer package was deployed. v338 synchronizes `index.html` JavaScript and CSS query versions with bootstrap `VERSION = 338`. This can explain fixes appearing ineffective after deployment.

### Validation

- Real DOM/runtime state-transition harness in headless Chromium: portable equations survive no-text helper access and reopen; equation-only Search becomes usable; old portable equation snapshots restore while equivalent stale local caches remain rejected; repeated labels preserve multiple candidates; explicit portable equation blocks merge across old detector versions; exact-hash wrong-PDF import is rejected.
- Runtime harness reported no page JavaScript errors.
- Bootstrap version, `index.html` JavaScript cache key, and CSS cache key are all exactly **338**.
- Every subsystem passes `node --check`; the fully concatenated runtime also passes `node --check`.

### Remaining manual/browser risks

- Production file-picker/download behavior, deployed CDN cache headers, and production OCR/Texify engines are not controlled by this sandbox. v338 fixes the in-package cache keys, but a deployment layer that forcibly caches `index.html` itself still needs ordinary website cache policy.
- Running full-document OCR after restoring a portable detection snapshot intentionally switches authority back to freshly rebuilt OCR-derived indexes. If a future OCR rebuild fails after OCR itself completes, the desired transactional fallback policy should be revisited rather than patched speculatively now.
- Very large books can still hit existing detector/index caps (Structure 500, Bibliography 400, equation snapshot 5000 candidate rows). These are established bounded-performance limits, not newly observed regressions in this audit.

---

## Prior record: v334 regression + v335 targeted round-trip fix

Date: 2026-11-02 (America/Los_Angeles)

## v335 targeted export/import fix

This package keeps the full v334 regression campaign below and adds one targeted portability fix discovered immediately afterward. No new broad regression corpus is claimed for v335.

Confirmed bug: an image/scanned PDF could be fully OCRed, detected, and exported, but importing that reading-data JSON on a clean browser did **not** carry the full-document OCR cache or the automatic equation index. If the matching PDF was then opened without rerunning OCR, MathReader could enter the text-unavailable path and clear the imported text-derived indexes, leaving no Structure/Results/Equations/Bibliography.

v335 changes the export/import contract additively while retaining `mathreader.reading-data@1` compatibility:

- export now contains an explicit `contentDetection` snapshot: Structure (`inferredOutline`), Results, Equations, and Bibliography;
- export now contains `documentOcr` when full-document OCR is active and complete, including page text/geometry needed by search and downstream detectors;
- automatic equation detections are persisted as an equation-index snapshot instead of only a count;
- first-screen import writes the OCR snapshot under the exact SHA-256 document id before the user selects the matching PDF, so `loadCachedDocumentOcr()` restores it before the text-availability gate;
- import into an already-open matching PDF activates and persists the imported OCR cache before restoring the content-detection session.

Targeted validation performed for v335:

- synthetic equation-index round trip: 2 automatic equation rows exported and restored with page/ratio/confidence/OCR flags intact;
- synthetic 2-page full-document OCR snapshot accepted and restored only when page count matches; mismatched page-count OCR is rejected;
- synthetic portable content-detection snapshot restores Structure, Results, Equations, and Bibliography together;
- all JavaScript files pass `node --check`;
- source inspection confirms blank-screen import persists OCR before the matching PDF is opened, and open-document import activates OCR before `loadDocumentState()`.

Manual-browser caveat: this sandbox cannot fully exercise the browser file-picker/download + IndexedDB round trip with production OCR engines. The serialization/restoration contract and pure round-trip helpers are tested, but one real browser export → fresh import → select matching scanned PDF should remain a release smoke test.


## Regression rules

- Every regression uses genuinely new/newly rotated files plus a selective subset of older difficult fixtures.
- New coverage must span different branches of mathematics and adjacent technical fields. Geometric analysis is a minority/control slice unless the active bug requires it.
- Prefer pre-21st-century, archaic, degraded, scan-backed material when runnable files are available; modern/arXiv files are minority controls.
- Standard readable files receive strict visible-page checks for Structure/Results, Equations, and Bibliography. Missing items and false positives are release blockers.
- Illegible/corrupted/pathological files may use relaxed acceptance and must not drive code changes unless the behavior is a reproducible class problem or violates a general invariant.
- Every regression includes image/OCR coverage and selectively includes handwritten mathematics. OCR accuracy, downstream detection stability, and performance are checked.
- Equation and bibliography detection receive special scrutiny.
- Code changes are made only for class-level defects, never for a single-file exception.
- Regression is bounded to avoid timeout. Byte-identical cached OCR geometry may be reused for a difficult old fixture only when the current detector is rerun against it.
- Potential exceptions, uncertain side effects, and anything requiring manual browser/Texify verification are recorded below.

## Files covered

### New / newly rotated broad-field corpus

| File | Field / type | v334 acceptance result |
|---|---|---|
| `rose_tile_solution.pdf` | combinatorics / permutations / Burnside counting, Chinese | **0 Equations / 0 Results / 0 Bibliography.** All displayed formulas are intentionally unnumbered; no false equation labels. |
| `124ws2.pdf` | elementary calculus / graph interpretation / rates | **0 / 0 / 0.** Worksheet item numbers and graph tick values do not pollute Equations or Results. |
| `A_Geometric_Approach_to_Integration.pdf` | multivariable calculus / integration / Jacobian and measure intuition | **0 / 0 / 0.** Displayed formulas are unnumbered; section numbers are not equations. |
| `Where_do_Complex_Numbers_come_from_.pdf` | abstract algebra / complex-number construction | **0 Equations / 4 Results / 0 Bibliography.** The four explicit Definitions are correctly indexed; prose and algebraic expressions are not equations. |
| `14922fe9-aa1a-4a9c-8698-ee3ff46b703d.pdf` | engineering mechanics / helix geometry / Chinese technical note | **2 Equations / 0 Results / 0 Bibliography**, the two visibly displayed quoted formulas `(20)` and `(6)`. The hand-drawn figure page does not pollute detection. |
| `Code_final.pdf` | mathematical software / C# source-code layout | **0 / 0 / 0.** Code line numbers, numeric constants, and comments remain negative controls. |
| `Fraljiculator_ArrayPool_Architecture_Updated.pdf` | software architecture / performance engineering | **0 / 0 / 0 after v334 fix.** v333 falsely indexed timing value `1.242 s / 22.8% faster` as equation `(1.242)`. |
| `Lean_Diagonal_Similarity_Beginner_Guide.pdf` | formal proof / linear algebra / Lean | **0 / 0 / 0.** Source syntax and numbered instructional prose do not pollute mathematical indexes. |
| `581 Note 7.pdf` | handwritten inverse problems / electrical impedance tomography | Relaxed handwritten OCR: **0 / 0 / 0**; no false downstream detections. Exact symbol transcription is not claimed. |

### Selectively retested older / difficult controls

| File | Field / era | v334 result |
|---|---|---|
| `Gromov_1967_A_Geometrical_Conjecture_of_Banach.pdf` | functional analysis / Banach-space geometry, 1967 | Native detector **15 / 14 / 9**; established strict image-assisted golden remains **16 / 14 / 9**, with visible `(10)` supplied only by image evidence. The v334 measurement guard does not affect this family. |
| `Pisier_1988_Riesz_Transforms.pdf` | probability / harmonic analysis, 1988 | Native detector **22 / 7 / 17**; established strict image-assisted golden remains **25 / 7 / 17**, with `(2.8)–(2.10)` image-confirmed. The v334 change leaves native output identical. |
| `Schoen_1983_Uniqueness_Symmetry_Embeddedness_scan.pdf` | image-only classical differential geometry scan, 1983 | Current detector rerun on byte-identical strict OCR geometry: **0 / 16 / 14**. |
| `2309.00806v2.pdf` | matrix algebra / stable polynomials | **0 / 26 / 18**; all four `Main Result` declarations from v333 remain present. |
| `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf` | functional equations / Chinese mathematical article | **0 / 0 / 2**; numbered assumptions remain excluded from Equations and Chinese bibliography remains complete. |

## Confirmed class-level defect fixed in v334

### Decimal measurements could become bare hierarchical equation labels

Technical documents often contain rows such as:

- `1.242 s / 22.8% faster`
- `1.40 GiB/s`
- `13.79 MiB/s`
- `31.6% faster`

The mature old-PDF detector deliberately allows a bare dotted token such as `1.14` when PDF extraction loses visible parentheses around an old equation number. In a performance table, that same recovery path could interpret the leading decimal `1.242` as equation `(1.242)` if its geometry happened to resemble an equation-number margin.

This is a repeated class, not a one-off glyph: `Fraljiculator_ArrayPool_Architecture_Updated.pdf` contains **33** decimal measurement rows using seconds, percentages, MiB/GiB and throughput units. Only one happened to pass all v333 geometry gates, demonstrating the instability.

v334 adds a narrow invariant: a **bare** dotted numeric candidate at line start is rejected when the immediately following token is an explicit measurement unit (`s`, `ms`, byte units, Hz-family, fps, `%`, etc.). Parenthesized labels and ordinary bare old-journal labels remain unchanged. The same guard applies to the two-column supplement path.

Regression effect:

- `Fraljiculator_ArrayPool_Architecture_Updated.pdf`: Equations **1 → 0**, removing only false `(1.242)`.
- Across every other file in this campaign, equation labels, Results, and Bibliography are **bit-for-bit identical at the detector-output level** to v333.

## OCR accuracy and performance

- `581 Note 7.pdf`: 3 image/handwritten pages, full-document local OCR proxy **2.06 s total / 0.69 s per page**. Downstream output **0 / 0 / 0** with no index pollution. Handwriting is difficult and exact transcription is not treated as strict golden accuracy.
- `Schoen_1983_Uniqueness_Symmetry_Embeddedness_scan.pdf`: 19 image-only pages. Byte-identical strict 180-DPI OCR geometry is rerun through v334 and preserves **0 / 16 / 14**. The retained strict geometry was originally measured at about **1.16 s/page** in the local OCR proxy; this is cache-reuse evidence, not a fresh production-Texify benchmark.
- The local OCR proxy is not the production browser Formula OCR/Texify path. Production OCR should be manually checked when OCR-engine-specific behavior is suspected.

## Breadth / historical corpus note

This regression intentionally expands runnable coverage beyond geometric analysis to combinatorics, calculus/graphs, integration, abstract algebra, engineering mechanics, source-code documents, software architecture/performance, formal proof, functional equations, matrix algebra, functional analysis, and probability/harmonic analysis.

Historical cross-field works were additionally researched for future rotation—Turing (computability), Shannon (information theory), Selberg (number theory), Nash (game theory), Metropolis et al. (Monte Carlo/statistical mechanics), Milnor (topology), Erdős–Rényi (random graphs), Kalman (control/filtering), Kac (spectral geometry), Black–Scholes (mathematical finance), and Courant–Friedrichs–Lewy (numerical PDE). Their public PDF bytes were not available to the local detector sandbox in this run, so **they are not counted as tested files**.

## Unresolved / manual checks / future reference

- Handwritten `581 Note 7.pdf` is visually readable to a person but the generic local OCR proxy has weak symbol/text transcription. This does not currently create false Structure/Results/Equations/Bibliography. Production Formula OCR/Texify should be checked manually before treating handwritten transcription accuracy as a product defect.
- Gromov and Pisier still rely on established image-assisted margin evidence for their strict equation totals; the native text layer alone remains incomplete by design. Future rotations should continue to exercise those image-assist paths.
- Browser-only rendering/navigation behavior and production Texify OCR cannot be fully exercised in this sandbox. Detector functions are run from the actual MathReader source against native/OCR line geometry.
- Public historical papers researched above are future candidates, not claimed coverage.
- Rare technical unit strings outside the deliberately narrow measurement-unit guard should only be added if they recur as a class problem; do not broaden the rule speculatively.

## Cleanup / release gates

- Application version: **v335** (v334 detector regression retained; v335 is a targeted export/import portability fix).
- Structure index version: **39** (unchanged).
- Equation summary index version: **20**.
- All JavaScript subsystem files and bootstrap pass `node --check`.
- The only intended detector behavior change is rejection of bare dotted decimal measurements as equation labels.
- Full campaign comparison shows no detector-output changes outside `Fraljiculator_ArrayPool_Architecture_Updated.pdf`, where the single false equation is removed.
- Release ZIP contains only the root `mathreader/` package; no OCR intermediates, harnesses, screenshots, or regression scratch files.

## v347 additional 50-file regression — historical, handwritten, and cross-disciplinary controls (2026-11-05 Beijing UTC+08)

**Scope and baseline.** This is an additional documentation-only regression executed against the user-provided full **v347** ZIP, with the previously delivered v347 cross-field `REGRESSION.md` addendum preserved. These **50 SHA-256-distinct PDFs / 1,672 PDF pages** are additional to the **immediately previous six-file cross-field run**. Some documents were deliberately rotated from older project regression campaigns and several are related editions/compilations: byte distinction does **not** mean 50 historically independent works. Five are additional handwritten lecture-note documents (four applied inverse-problem and one geometric-analysis seminar); old published scans include Yau (1978), Caffarelli–Gidas–Spruck (1989), and historical math controls. The sample extends to AI/ML, source code, software performance, economics, language/character tables, literature, calculus teaching and applied PDE. **It does not satisfy the still-open request for 50 independently sourced old handwritten works outside pure mathematics.** Those original archival physics/engineering laboratory notebook PDFs remain unavailable to the local detector environment.

**Actual test method.** Original PDF bytes were materialized and SHA-256 hashed. PyMuPDF independently traversed **all 1,672 PDF pages** and extracted native words/spans, line geometry, and bookmark metadata. A page with fewer than 30 native-text characters was separately rendered and passed through local Tesseract OCR; OCR-derived visual lines were marked `ocrSource: true` and inserted into a full-document page-line cache. The **unmodified v347 `mathreader/js/41-equations-bibliography.js`** was evaluated in Node VM, and its actual `buildStructureIndex()` (Results + Bibliography) and `buildEquationLabelIndex()` were run against each full-document cache. Browser-only UI, async scheduling, persistence and equation posterior image assistance were stubbed; the last mechanism was **intentionally disabled**. This is a source-level detector run against **proxy geometry**, not MathReader PDF.js or production Texify/WebGPU/CPU runtime. The PDF outline/bookmark metadata was inventoried, but the separate `40-outline-structure.js` browser Structure inference was **not** exercised end-to-end. Therefore a completed detector job **does not constitute fully verified PDF detection accuracy**.

**Results.** All **50/50** source-level detector jobs completed without VM exceptions; **884 Results, 1940 distinct equation labels, 478 bibliography entries** across the entire corpus. These are output counts, not precision, recall, or golden assertions. **Three PDFs have confirmed local-proxy errors (FAIL); the other 47 are UNVERIFIED**, not PASS, because whole-document independently annotated ground truth was not supplied. The archived machine-readable audit `mathreader/regression/crossfield_50_20261105.json` holds exact PDF hashes, page counts, original page/item locations, OCR attempts and detector labels.

**OCR proxy and actual execution failures.** **102** pages (<30 native-text characters) required image OCR. Three initial local Tesseract diagnostic passes showed heavy timeouts under unconstrained OpenMP: PSM3 115 DPI **18 ok / 84 failures**, PSM6 115 DPI **11 ok / 73 failures** among the first-pass failures, and low-fidelity PSM11 78 DPI English-only **10 ok / 63 failures** among the remaining failures. Investigation isolated test-environment thread oversubscription. A new consistent **160 DPI / PSM 3 / per-process `OMP_THREAD_LIMIT=1`** full OCR pass was executed on **all 102** eligible pages, producing **102 OCR successes / 0 failures** (15-second per-page timeout). Where this last controlled pass succeeded, its text and geometry **replaced**, not combined with, earlier weaker proxies before the detector rerun. Across all attempts, **102/102** pages yielded some proxy OCR record and **0** remained without local OCR. A successful OCR execution does **not** establish accurate text or mathematical symbol recognition. The 3 initial passes are test-harness-only diagnostic configurations, not hidden application fallbacks. No production browser Texify/WebGPU/CPU OCR or fallback was executed; the source code remains unchanged.

### Document-by-document observed indexes

Legend: **R/E/B = Results / Equation labels / Bibliography**; OCR is returned pages / attempted pages in the staged **proxy** (not OCR character accuracy). `FAIL` = confirmed error; `U` = **UNVERIFIED**, never a fully verified PASS. An empty index can be a correct negative control *or* a recognition omission.

| # | Original PDF (SHA-256 recorded in JSON) | Field / era | Pages | Proxy OCR | R/E/B | Status |
|---:|---|---|---:|---:|---:|---|
| 1 | `0810.5645v6.pdf` | Mathematical research / analysis control | 212 | 0/0 | 203/344/105 | U |
| 2 | `1209.2203v2.pdf` | Mathematical research / analysis control | 88 | 0/0 | 63/293/183 | U |
| 3 | `124ws2.pdf` | Applied calculus / teaching control | 6 | 0/0 | 0/0/0 | U |
| 4 | `2309.00806v2.pdf` | Mathematical research / analysis control | 15 | 0/0 | 26/0/18 | U |
| 5 | `2610.07774v1.pdf` | Machine learning / AI safety | 15 | 0/0 | 0/5/17 | FAIL |
| 6 | `581 Note 2.pdf` | Handwritten inverse problems / applied imaging | 2 | 2/2 | 0/0/0 | U |
| 7 | `581 Note 4.pdf` | Handwritten inverse problems / applied imaging | 2 | 2/2 | 0/0/0 | U |
| 8 | `581 Note 5.pdf` | Handwritten inverse problems / applied imaging | 4 | 4/4 | 0/0/0 | U |
| 9 | `581 Note 6.pdf` | Handwritten inverse problems / applied imaging | 2 | 2/2 | 0/0/0 | U |
| 10 | `A_Geometric_Approach_to_Integration.pdf` | Mathematics teaching control | 6 | 0/0 | 0/0/0 | U |
| 11 | `A_Streamlined_Proof_of_the_Yamabe_Problem.pdf` | Mathematical research / analysis control | 18 | 0/0 | 10/66/0 | U |
| 12 | `Code_final.pdf` | Software / performance engineering | 40 | 0/0 | 0/0/0 | U |
| 13 | `Computation_VS_Dark.pdf` | Software / performance engineering | 25 | 0/0 | 0/0/0 | U |
| 14 | `Fraljiculator_Performance_Optimization_Closeout_Report.pdf` | Software / performance engineering | 6 | 0/0 | 0/0/0 | U |
| 15 | `GA Seminar Note 1.pdf` | Handwritten math seminar control | 4 | 4/4 | 0/0/0 | U |
| 16 | `Green_Function_Expansion_One_Page.pdf` | Mathematical research / analysis control | 1 | 0/0 | 1/14/0 | U |
| 17 | `Inverse_Problems_Lecture_1.pdf` | Applied PDE / inverse problems | 6 | 0/0 | 3/54/0 | U |
| 18 | `Inverse_Problems_Lectures_1_7.pdf` | Applied PDE / inverse problems | 38 | 0/0 | 14/65/0 | U |
| 19 | `Inversion_to_ADM_Mass.pdf` | Mathematical research / analysis control | 5 | 0/0 | 0/64/0 | U |
| 20 | `Lean_Diagonal_Similarity_Beginner_Guide.pdf` | Formal methods / Lean teaching | 18 | 0/0 | 0/0/0 | U |
| 21 | `Math124_Week2_Distance_Speed_Solutions.pdf` | Applied calculus / teaching control | 4 | 0/0 | 0/0/0 | U |
| 22 | `Positive_Mass_Theorem_Schoen_Yau_Higher_Dimensions.pdf` | Mathematical research / analysis control | 18 | 0/0 | 19/93/14 | U |
| 23 | `Radon Measures and Riesz Representation Theorems.pdf` | Mathematical research / analysis control | 10 | 0/0 | 15/0/2 | U |
| 24 | `Riemann球面上的旋转_Fraljimetry.pdf` | Mathematical research / analysis control | 2 | 0/0 | 0/0/0 | U |
| 25 | `Schoen_Yau_Positive_Mass_Step_Tables.pdf` | Mathematical research / analysis control | 9 | 0/0 | 0/0/0 | U |
| 26 | `Seattle_UDistrict_vs_Xian_Beilin_房价与租金详细对比_2026-09.pdf` | Economic / character-table negative control | 8 | 0/0 | 0/0/0 | U |
| 27 | `Seattle_UDistrict_vs_Xian_Beilin_超市典型商品价格详细对比_2026-09.pdf` | Economic / character-table negative control | 8 | 0/0 | 0/0/0 | U |
| 28 | `The_Classic_Solution_to_the_Yamabe_Problem (1).pdf` | Mathematical research / analysis control | 26 | 0/0 | 13/270/7 | U |
| 29 | `Where_do_Complex_Numbers_come_from_.pdf` | Mathematics teaching control | 3 | 0/0 | 4/0/0 | U |
| 30 | `YamabeProblem.pdf` | Historical mathematical research control | 56 | 0/0 | 51/62/46 | U |
| 31 | `Yamabe_Review_Math_Corrected.pdf` | Mathematical research / analysis control | 26 | 0/0 | 13/270/7 | U |
| 32 | `Yamabe_missing_inputs_detailed_proofs.pdf` | Mathematical research / analysis control | 15 | 0/0 | 7/38/0 | U |
| 33 | `brendle2007.pdf` | Mathematical research / analysis control | 29 | 0/0 | 30/6/20 | U |
| 34 | `caffarelli1989.pdf` | Historical mathematical research control | 27 | 0/0 | 18/23/10 | FAIL |
| 35 | `chongxi_CommonWords.pdf` | Economic / character-table negative control | 49 | 0/0 | 0/0/0 | U |
| 36 | `colleague_inverted_bubble.pdf` | Mathematical research / analysis control | 3 | 0/0 | 0/24/0 | U |
| 37 | `covering_spaces_for_geometric_analysis.pdf` | Mathematical research / analysis control | 18 | 0/0 | 15/0/0 | U |
| 38 | `double_spiral_surface_revision_spec.pdf` | Technical manuscript / formatting | 13 | 0/0 | 0/1/0 | FAIL |
| 39 | `geometric_measure_theory_split_pages.pdf` | Mathematical research / analysis control | 274 | 7/7 | 70/67/27 | U |
| 40 | `lean_quintessential_examples_collection.pdf` | Formal methods / Lean teaching | 76 | 0/0 | 259/0/5 | U |
| 41 | `lectures_on_pde_split_pages.pdf` | Applied PDE / inverse problems | 236 | 12/12 | 37/22/0 | U |
| 42 | `micro_geometry_covers_4x3_safe.pdf` | Illustrated scanned slide/cover collection | 70 | 68/68 | 0/0/0 | U |
| 43 | `rose_tile_solution.pdf` | Mathematics teaching control | 2 | 0/0 | 0/0/0 | U |
| 44 | `rose_tile_thinking.pdf` | Mathematics teaching control | 1 | 0/0 | 0/0/0 | U |
| 45 | `yau1978.pdf` | Historical mathematical research control | 73 | 1/1 | 13/159/15 | U |
| 46 | `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf` | Mathematical research / analysis control | 3 | 0/0 | 0/0/2 | U |
| 47 | `无穷的历史.pdf` | History of mathematical ideas | 19 | 0/0 | 0/0/0 | U |
| 48 | `汲绍达诗词文稿集_完整整理版.pdf` | Literature / prose negative control | 37 | 0/0 | 0/0/0 | U |
| 49 | `汲绍达诗词文稿集_完整整理版_修订.pdf` | Literature / prose negative control | 36 | 0/0 | 0/0/0 | U |
| 50 | `祝福_魯迅_分段修正版.pdf` | Literature / prose negative control | 8 | 0/0 | 0/0/0 | U |

### Confirmed issues / independent visual checks

1. **MR-OPEN-003 confirmed reproduction — Caffarelli–Gidas–Spruck, 1989, PDF p.3, Theorem 1.3 (FAIL, Results recall + spurious incomplete result).** Visible print on p.3 contains the genuine `THEOREM 1.3. Let u ...` statement. The proxy index has `Theorem 1.2` and an incomplete `Theorem · p.3`, but **omits Theorem 1.3**. Root-cause hypothesis: legacy PDF text extraction separates `THEOREM`, `1.3.`, and the statement into adjacent same-y rows, with interleaved trailing clause text, defeating the conservative split-heading recovery. Impact: missing navigation target and a duplicate-like nonnumbered pseudo-result. This is a known historical paper family issue, not a reason to patch only this paper. Proposed next test: vary single-line, two-line, three-fragment heading layouts and same-y interleaved column/text contexts; compare with genuine consecutive theorem declarations and prose references; rerun broad negative controls before changing any code.
2. **MR-OPEN-NEW-CROSSFIELD-AXIS — `2610.07774v1.pdf`, PDF p.6, plotted `0.04` (FAIL, Equation precision).** The local detector incorrectly indexed a **chart-axis tick value `0.04`** as equation `(0.04)`; the original PDF page image and text layer show repeated numeric graph scales `0.00, 0.02, 0.04, ...`, not an equation-number label. Root-cause hypothesis: a bare dotted numeric token in a plot axis escaped measurement-unit guards that only cover tokens with explicit units. Affected class: chart scales and data plots in engineering/science PDFs. Severity: moderate false navigation. Defer until geometry-backed axis/plot context controls can exclude ticks without sacrificing genuine old-paper unparenthesized dotted labels. Test multiple axis orientations/column layouts and valid bare equation labels in historical controls. Do **not** add a document-specific exception.
3. **MR-OPEN-NEW-CROSSFIELD-SECTION — `double_spiral_surface_revision_spec.pdf`, PDF p.12, `7.3 图表` (FAIL, Equation precision).** The native text layer splits the Chinese section heading into a bare `7.3` line and the caption `图表`. The detector indexed `(7.3)` despite it being a subsection number. Root-cause hypothesis: same-row heading evidence is fragmented into separate lines, while a bare dotted candidate sits in a plausible equation margin. Affected class: Asian/multilingual and text-layer-fragmented headings; existing mature section guards catch normal same-line headings but not all separated text. Severity: moderate. Defer any fix until positive/negative checks prove the candidate can be excluded without deleting genuine separate-line equation tags in old scans.

**Further suspicious/unverified cases, not promoted to confirmed defects:** `yau1978.pdf` PDF p.38 has a nonnumbered `Lemma · p.38` row and neighboring `Lemma 1` on p.39; requires independent visible-numbering and link-target comparison. The five handwritten documents have weak OCR-derived text and cannot be counted as successfully recognized solely because their equation index is empty. Mixed-language illustrated Chinese pages may yield very few characters under the final English-only sparse diagnostic; these pages are categorically **UNVERIFIED** for real OCR and downstream recall. MathReader’s specialized equation-margin posterior image assist, gap recovery on restored OCR results, full browser Outline inference, runtime OCR fallback, export/import, and production deployed UI were **not** revalidated by this proxy campaign. Historical non-math archive URLs in the preceding addendum remain **not tested** locally; do not count them toward this 50-file corpus.

### Release gates and deferral decision

- **No source code was changed; version stays `v347`** (no `v348` code patch). `mathreader/REGRESSION.md` and the machine-readable audit JSON are the only root-patch files. The root ZIP has no original PDFs or OCR images; source hashes and page mapping enable reproduction once the same authorized PDFs are available.
- All 96/96 existing bundled test assertions pass: 15 bibliography, 25 embedded-outline title, 33 equation progress, 23 Results/TOC. Bootstrap and each modular JavaScript file pass `node --check`; the fully concatenated ten-part runtime passes `node --check`; the ZIP integrity check passes.
- The three confirmed local index defects remain **FAIL**. No filename-specific, rule-broadening, speculative heuristic or unauthorized recovery machinery was introduced. Remaining cross-field accuracy and OCR/barcode/handwriting, missing page ground truth and production browser behavior remain **UNVERIFIED**; there are **zero fully verified documents in this campaign** under the project’s 100% whole-document standard.
- Future regression must obtain independent original historical handwritten physics/engineering/geology notebooks (not previously tested links), compare page-by-page visible labels and structure against the actual browser detector, and prioritize class-level axis-tick, split-section heading, and split theorem heading tests. The original source and future full regression should not be changed solely to improve a specific one-off corpus member.

---



## v347 supplementary cross-field 50-PDF regression (round 4, 2026-11-05 Beijing UTC+8)

**Status: no source modification; v347 remains authoritative.** This is a documentation-only audit after the previous 50+50 and six-file campaigns; the previous text and open issues above are preserved. The source under `mathreader/js/` was not changed. Machine audit: `mathreader/regression/crossfield_50c_20261105.json` (all 50 source SHA-256 hashes, line-index entries and page positions, page-level OCR attempts/timings and failure classifications).

### Selection and what the new files actually cover

- **50 SHA-256-distinct accessible PDFs excluded from the previous 106 officially counted PDF hashes**, **8,823 pages**. Contents include early printed mathematical research, a 441-page twentieth-century technical-writing/reference textbook, old scan-style books, two native-text English dictionaries, image-only Chinese reference dictionaries, cumulative inverse-problem lecture sets, original handwritten mathematics notebooks, and Chinese technical manuscripts.
- **Important shortage not resolved:** these 50 are *not* 50 independent historical physics/engineering/geology sources. Several are related releases/revisions of the same Chinese mathematics manuscript and cumulative lecture PDFs. The language dictionaries add worthwhile negative controls but cannot substitute for independent laboratory and field notebooks. The historical cross-field gap explicitly stays **UNVERIFIED**.
- NASA's original X-15 sensor report PDF (`https://ntrs.nasa.gov/api/citations/19660001314/downloads/19660001314.pdf`) and USGS's 1903 geology report (`https://pubs.usgs.gov/pp/0013/report.pdf`) were located as candidate *public originals*, but their bytes could not be downloaded to this detector sandbox. They were **not counted, tested, or assigned PASS**. No synthetic substitute was created.

### Exact local execution and constraints

- Every selected document was opened and page metadata extracted with PyMuPDF. **All 8,823 pages** were analyzed for native page-text availability and handed to the *actual* unmodified v347 `buildStructureIndex` / `buildEquationLabelIndex` detector functions inside a Node VM. The test provides PyMuPDF text-line geometry and mocked browser state. For performance, first 29 PDFs used span-based line geometry, the remaining 21 grouped text words into lines. Native geometry is only a proxy for PDF.js and is **not** an end-to-end production result.
- The 50 input documents had **1,596 pages below the 30-character native-text threshold**. Tesseract 5 OCR was actually executed on **311 of those pages** (160 DPI, PSM 3, `OMP_THREAD_LIMIT=1`, English or Simplified Chinese + English). OCR calls: **311 succeeded at process level, 0 execution failures, 18 empty transcripts**; **1,285 candidate pages were NOT OCR-tested**. The partial coverage is deliberate for very long scanned dictionaries and not represented as complete. All scanned/historical/handwritten items remain **UNVERIFIED** until independently reviewed.
- Key complete proxy-OCR subsets: handwritten lecture manuscript `早期视频全稿(4).pdf` **52/52**, a separate 25-page handwritten edition `早期视频全稿.pdf` **25/25**, the nineteen-page old scan `Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces(6).pdf` **19/19**, and the 77-page mixed original-manuscript/printed document **51/51 image-only candidates**. Completing an OCR *call* does not prove correct mathematical transcription.
- `暑期数学研究成果展示_汲绍达_完整保留校订版.pdf` triggered reproducible MuPDF warnings `unknown keyword: qQq` while decoding some pages; no detector invocation failed. The source encoding anomaly is a **suspected PDF-specific compatibility risk**, not proof of a browser error and not a reason to patch detection without further evidence.
- Cross-document output of the local v347 source functions: **229 Results**, **12831 equation labels**, **62 bibliography entries**, **0 Node VM failures**. These are *counts*, not precision/recall. The high equation count comes largely from several closely related, equation-dense Chinese mathematics manuscript editions. Production equation image assistance and gap recovery based on image margins were not exercised; Structure's PDF embedded-outline metadata was collected but Structure browser/UI/inferred outline accuracy was not checked.

### Newly confirmed general defect class — back-of-book indexes

**MR-OPEN-NEW-CROSSFIELD-BACK-OF-BOOK-INDEX — FAIL (local source-level proxy).** `77c3888b-c5fb-4c8f-ad75-eea45ff656de.pdf` (Thomas S. Kane's *The Oxford Essential Guide to Writing*), **PDF p.436 / printed folio 447**, has a two-column **SUBJECT INDEX**. The word **Definition** appears as a subject-index headword followed by subentries/page references; it is **not** a mathematical definition. The actual v347 Results parser nevertheless generated `Definition · p.436`. The original page image was visually inspected; local geometry evidence and line position are reproducible. **Severity:** moderate Results false positive in nonmathematical reference books. **Likely class:** unnumbered-result heading detection versus back-of-book subject indexes, related to the previously open `Remark I` phrase-finder false positive. **Deferral:** test actual unnumbered mathematical Definition/Remark controls, two-column indexes and mixed-content final pages; adopt only a minimal general guard that does not lose genuine Results. No filename-specific exception; no source-code change.

### Additional observations, manual checks and status

- Two native-text dictionary negative controls returned **zero** Results/Equation/Bibliography entries in the local source-level detector: `Merriam_Webster_Pocket_Dictionary.pdf` (813 pages) and `Pocket_Oxford_English_Dictionary.pdf` (2,880 pages). These are useful precision checks but **not** independent all-page human verification, hence **UNVERIFIED**.
- The old 19-page scanned paper again yielded 16 Results and 14 bibliography entries, zero equation labels in this proxy; without full page-level ground truth and production image-assisted recovery the zero equation count cannot be taken as completeness.
- Original handwritten material produced empty mathematical label indexes in some 25- and 52-page manuscripts despite OCR recognition output. This is **not a PASS for mathematical recognition**; treat it as a low-fidelity proxy limitation requiring original-page transcription and production Texify comparison.
- One local-proxy **FAIL document** (confirmed false positive), 49 **UNVERIFIED** documents; **0 PASS—Fully verified**, **0 EXCEPTION**. No unresolved errors from earlier campaigns are closed or reclassified. Do not infer success from 96 unit assertions or valid JavaScript syntax.

### Unverified acceptance and next steps

**Still needed:** authentic source PDF bytes for pre-1980 physics/aerospace technical notes, electrical or mechanical lab notebooks, geological field logs, historical scanned experiment records; independently transcribed item-level ground truth, particularly for handwritten formulas; complete OCR on the 1,285 unprocessed image-heavy pages or a declared narrower audit scope; live MathReader PDF.js/Texify/CPU fallback and image-assisted equation gap recovery; and end-to-end browser Structure/Results/Equations/Bibliography comparison. No complete detection accuracy claim is warranted.

**Release gate:** JS syntax, assembled runtime syntax, existing 96 source-regression assertions, SHA-256 uniqueness/exclusion, machine-audit consistency and root ZIP integrity verified. Only `mathreader/REGRESSION.md` and `mathreader/regression/crossfield_50c_20261105.json` are updated. No JS/version modification; remains **v347**.

---


## v347 Round 5 — 50 controlled scan/OCR stress PDFs (2026-11-05 Beijing UTC+08)

**Status and critical scope distinction.** Round 5 was requested after the 50+50+50 source-file campaigns. The accessible Library had no sufficient supply of 50 *new, independently sourced* historical physics/engineering/geology PDFs; external NASA/USGS/Smithsonian original PDF bytes were not retrievable into the local test environment. **This round therefore consists of 50 new SHA-256-distinct synthetic scan fixtures derived from exactly 10 real source pages** (five systematic raster/degradation variants per page). It is a deliberately narrower, controlled robustness test; **do not count these as 50 newly tested archival works or as resolution of the longstanding nonpure historical-handwriting shortage.** The fixtures have unique hashes distinct from all 150 PDFs in the three preceding 50-file audit JSONs; their source documents and pages are traceable in `mathreader/regression/crossfield_50d_20261105.json`. No generated scans or source originals are included in the documentation patch.

### Corpus and reproducibility

Sources (one original PDF page each): `581 Note 8.pdf` p.2 and `581 Note 7.pdf` p.2 (handwritten applied inverse problems), `GA Seminar Note 1.pdf` p.1 (handwritten seminar), `SPS_1988__22__485_0.pdf` p.3 (1988 printed probability), L. Simon's *Asymptotic Behaviour of Minimal Graphs* p.7 (historical printed equations), McGraw-Hill idiom dictionary p.211 (language index negative control), `77c3888b-c5fb-4c8f-ad75-eea45ff656de.pdf` p.436 (subject index negative control), `2610.07774v1.pdf` p.6 (AI graph/axis), `double_spiral_surface_revision_spec.pdf` p.12 (engineering section numbering), `Safe Travels Elite PPO - 旅游医疗保险.pdf` p.1 (nonmath image-only insurance negative control). Sources are real but many were already tested in prior rounds; this campaign tests controlled transformations rather than their first discovery.

Five deterministic 160-DPI grayscale, image-only PDF variants per source: **control JPEG (quality 86); +1.5° skew (bicubic); low contrast (0.48×) and brightness (1.12×); Gaussian noise σ=8 + JPEG quality 24 (seed = 20261105 + source index); downsample to 60%, bilinear upsample, then blur radius 0.7**. All pages are preserved as single raster images inside newly generated PDFs with no text layer. Original-source SHA-256s, generated-PDF SHA-256s, original page numbers, transforms, geometry, and detector output are recorded per fixture in the JSON audit. Distinct generated bytes are **not** statistically independent source evidence.

### Execution and results

- **50/50 image-only fixture pages** rendered, run through local **Tesseract CLI at 160 DPI, English PSM 3, `OMP_THREAD_LIMIT=1`, three concurrent workers**; 50/50 OCR calls returned successfully, 0 execution failures, 0 empty transcripts, aggregate individual OCR execution time **92.2 s**. A successful call only means a transcript was emitted; Tesseract outputs for mathematical handwriting remain low confidence and often nonsensical. This is **not production Texify**, nor a production-browser timing measurement.
- **50/50 v347 source-level parser invocations** completed with 0 Node VM exceptions. Observed **13 Results parser entries**, **58 raw equation candidates**, **1 preliminary high-confidence equation candidate** (not a final Equation index), and **0 bibliography-heading candidates**. These cannot be equated with complete Structure/Results/Equations/Bibliography index outputs; document-wide sequence reconciliation, specialized image-assisted margin recovery, bibliography assembly, and browser rendering were not run.
- **Positive printed-result controls:** `Theorem 1.1` on old probability scan retained **4/5**; `Lemma 1.18` in Simon retained **5/5**. Missing Theorem in low contrast shows OCR fragility; it is **UNVERIFIED** as a product miss because the production OCR engine was not used.
- **Handwriting:** all 15 variations of the three handwritten source pages yielded no mathematical Results entries or high-confidence equation candidates despite receiving OCR transcripts. This is a weak-recognition risk, **not** evidence that the pages contain no mathematics. No independent per-symbol handwritten ground truth or Texify parity was established.

### Reproduced defect and suspected regression risk

1. **FAIL — repeated existing subject-index false positive, 4/5 fixtures.** The single word **`Definition`** on the source's PDF p.436, visibly in the **SUBJECT INDEX**, was promoted by `detectedStructureResult` to `Definition · p.1` in the control, skew, low-contrast, and noisy-JPEG regenerated scans. In the severe low-resolution blurred scan, OCR did not produce the same parser candidate; this disappearance **must not** be described as a detector fix. General class: dictionary/glossary/back-of-book subject-index headwords imitating unnumbered mathematical result declarations. Original document and page and reproduction evidence are supplied in the per-fixture JSON; previous round's open issue stays open. Severity moderate; no modification without genuine unnumbered Definition positive controls and negatives. Source page number `p.436` refers to the original PDF; fixture page is always `p.1`.
2. **UNVERIFIED — possible new JPEG OCR fraction/exponent candidate.** On `SPS_1988__22__485_0.pdf` original PDF p.3, the noisy-compression fixture produced OCR line `s-2 (42)` and the preliminary Equation confidence gate accepted `(42)`. The source visually contains mathematical fractions/exponents in this area; this is **not** a verified printed equation label. The full final equation index (including OCR sequence reconciliation and false-positive suppression) was not run, so this remains a **suspected pipeline risk**, not a confirmed MathReader defect. Next: reproduce with production Texify and final Equation index, inspect exact bounding boxes, and compare genuine label negatives such as `(1.1)`–`(1.3)`.
3. **UNVERIFIED — known native-text class cases not reproduced as final indexes.** The AI plot page OCR produced raw decimal/section candidates but no strong Equation candidate in this proxy. The Chinese engineering page produced raw `(7.3)`-like candidates but no strong candidate. This does **not** close earlier confirmed native-text graph-axis and section-numbering failures; input modality and extraction differed. The dictionary `Remark I` false positive likewise did not recur in this OCR variation, without proving the original native-text failure resolved.

### Accuracy classification and remaining coverage

**FAIL (local-proxy): 4 synthesized files; UNVERIFIED: 46; PASS—Fully verified: 0; EXCEPTION: 0.** Each FAIL is a transformed version of the same **one previously known** source-page defect—not four independent defect classes. All unverified results require independent ground truth and actual browser OCR/index verification; successful source-level tests are not 100% acceptance. Some manually visible formulas from the selected Simon page fail to reach the preliminary confidence gate; no product-level missing-equation claim is made until specialized margin-image recovery is run.

**The original unmet high-priority gap remains:** 50 independently sourced, runnable pre-1980 engineering/physics/geology scans, especially field and lab notebooks *written by hand*, plus full-document OCR and all four MathReader downstream index comparisons, not just page-level stress fixtures. Official candidate sources include NASA NTRS (`https://ntrs.nasa.gov/api/citations/20040006368/downloads/20040006368.pdf`, 1961 aerodynamics) and the Smithsonian's digitized geological notebook (`https://www.si.edu/object/field-notes-indiana-and-kentucky-1910%3Afbr_item_MODSI6820`); these are **external leads, not tested files**. No PDF bytes from those external records were used in this campaign.

**Release gates.** Documentation-only root ZIP patch. Source remains **v347**; no detection, OCR, UI, recovery, fallback, or JavaScript behavior changed. Run JS syntax, assembled-module syntax, the 96 bundled regression assertions, unique fixture-hash validation, JSON audit consistency, and patch ZIP integrity before delivering. Production-browser and whole-document independent ground truth remain **UNVERIFIED**.


---

## v361 — P1 bibliography actions moved to right-click (2026-11-06 Beijing UTC+08)

**Requested UI contract:** normal bibliography rows stay compact. Link PDF,
Relink PDF, Open PDF and Unlink appear only in the bibliography item's context
menu (as appropriate to its confirmed-link state); DOI/arXiv outbound links
remain as before. The old inline link buttons are removed, not merely hidden
by CSS. One temporary in-row PDF picker remains while the user explicitly
chooses and confirms a target. The menu is appended at document-body level so
it is not clipped by bibliography's overflow scroll region, and its position
is clamped to the viewport. Close on Escape, outside press, scroll, resize,
or bibliography re-render. Keyboard: Shift+F10 / Menu key; touch: stationary
550ms long-press (cancel on move or release).

**Conservative scope:** no detector, Formula OCR, PDF rendering, local-library
identity, IndexedDB schema, confirmed-link persistence, navigation/return
stack, or caching changes. Ordinary click-to-show-citations and double-click
to-reference remain. A right click does not expand citations. Native browser
context menus for DOI/arXiv anchors are not intercepted.

**Validation:** JS source syntax, assembled ten-module runtime, existing
source and browser tests, updated isolated P1 Chromium context-menu test,
responsive UI, and root ZIP overlay/integrity. The isolated P1 UI probe uses
a simulated PDF backend and must not be described as real PDF.js acceptance.
Actual two-PDF PDF.js and Texify/whole-document mathematical ground truth
remain **BLOCKED/UNVERIFIED** pending pinned assets and independent reference
data. See `regression/p1_context_menu_v361_20261106.json` for recorded gate
results.


## v362 — Separate help tutorial replaces top Open (2026-11-06 Beijing UTC+08)

**Requested interaction:** the top-right header Open PDF button is removed and
replaced by a visually prominent `?` linking to `mathreader/tutorial.html` in
a separate tab (`noopener`). Help does not open a PDF or change current reading
location. The dedicated, scrollable English/Chinese tutorial includes a
chapter navigator, controls, shortcut reference, Formula OCR/document OCR,
P0 limitations, P1 two-right-click bibliography linking, reader persistence,
mobile interactions and troubleshooting. The tutorial uses standalone CSS and
inherits language/theme preferences; no reader PDF or OCR modules run on it.

**Touch regression avoidance:** desktop `O`, Ctrl(Cmd)+O, Ctrl(Cmd)+K → Open,
drag-and-drop and the welcome Open PDF remain intact. A new **History → Local
library → Open PDF** action offers a second-PDF chooser on touch-only devices.
The existing document OCR interaction guard applies. The right-click P1
context menu remains unchanged, including Link/Relink/Open/Unlink and return
navigation. No changes were made to recognition, detector schemas or OCR.

**Validation:** complete JS syntax/assembled-module tests, existing
regressions, P0 browser-shell, 176 responsive Chromium assertions across nine
viewport widths, and new standalone tutorial/reader Chromium assertions in
`tests/help_tutorial_regression.py` over 320–1440px. Browser sandbox prohibits
real HTTP/file/data navigation; the new-tab href and `noopener` contract are
verified statically, and the actual HTML/CSS and JS are independently rendered
in Chromium, but real new-tab URL navigation remains UNVERIFIED in this
sandbox. P0 whole-document recognition and real P1 PDF.js/Texify end-to-end
remain UNVERIFIED from previous rounds. A no-PDF regression can never certify
PDF/index accuracy. Patch ZIP must contain only changed files; all link targets
must resolve inside the overlaid website tree. See
`regression/help_tutorial_v362_20261106.json` for this release audit.

## v366 — Desktop sidebar / Contents defaults and annotation reveal (2026-11-06 Beijing UTC+08)

- **Requested defaults:** both desktop sidebars start open for first-time/new-document use. Contents starts with Structure, Results, Equations, and Bibliography expanded, but Annotations collapsed. Every right-sidebar workspace section remains collapsed by default, unchanged. On narrow mobile viewports, existing off-canvas visibility semantics take precedence; do not force sidebars across the reading canvas.
- **Persistence policy:** saved per-document sidebar visibility and saved per-section collapse choices continue to win over the defaults. Turning off the corresponding remember preference restores the new defaults. Do not reset the user's explicitly collapsed/expanded sections merely because a PDF opens.
- **Annotation reaction:** new highlight or margin-note creation expands Contents → Annotations without automatically switching the left sidebar tab, scrolling, navigating, or changing focus. Existing margin-note behavior also reveals the right Annotations section; simple highlights do not newly open the right sidebar. Deletion does not automatically collapse the section. No OCR or formula-detection behavior changes.
- **Regression scope:** run `node mathreader/tests/sidebar_defaults_regression.js` and the normal zero-network Node suites. Manually verify first launch, document reopen with saved visibility, disabled remember preferences, mobile viewport, both highlight and margin-note additions, delete/restore, and layout widths. A source-only test does not establish real-browser persistence or PDF interaction accuracy; record unavailable gates as UNVERIFIED.

## v369 — Guide shortcut layout and copy restraint (2026-11-06 Beijing UTC+08)

**User request.** Replace the visually noisy, alternating two-column key-first shortcut table with self-contained functional groups. Each row now presents a short action label on the left and a compact key or key chord on the right. Groups are Document, Workspace, and Reading & notes, with all 17 original shortcuts retained. Two columns are used above 520px; at 520px and below the groups stack into one column. Full-width per-row divider lines are removed. English/Chinese descriptions and keyboard semantics are preserved.

**Copy audit.** Removed a repeated Help explanation in Display/mobile (the Getting started explanation suffices), shortened the shortcut heading and introductory note, removed decorative footer tagline, and avoided platform/version/internal release language in the manual. This is a focused reader-guide and shortcut-presentation pass, **not** a certification that every production-reader UI string is optimal. Meaningful exceptions about PDF data export, OCR limitations, and local-storage loss are intentionally retained rather than removed for brevity.

**Scope and safeguards.** Changes are confined to `tutorial.html`, `tutorial.css`, version/cache keys in `mathreader.js` and `index.html`, test fixtures, and this documentation. No PDF.js, OCR, mathematical detection, storage, navigation, annotations or shortcut dispatch behavior was modified. Existing reader layout CSS is untouched.

**Executed validation.** `node --check` on the bootstrap, ten subsystem JS files, and test JS; 16/16 bundled zero-network JavaScript regression scripts passed, including 879 formula LaTeX checks, 228 MathJax compilations, 1,204 performance/CSS parity checks, and 11 new grouped shortcut assertions. Chromium Help/tutorial regression: 130/130 assertions across five widths, including the 34px Help button. Additional responsive shortcut rendering: 12/12 checks across six widths (320, 375, 520, 768, 1024, 1440) × English/Chinese, with no page horizontal overflow or shortcut-label/key overlap. This is a no-real-PDF UI regression, **not** browser acceptance of PDF.js/Texify mathematical correctness; full end-to-end PDF and visual human assessment remain UNVERIFIED.


## v370 — Shortcut reference column alignment (2026-11-06 Beijing UTC+08)

**Visual defect:** With three groups flowing through a two-column CSS grid, the third group (Reading & notes) began beneath the tallest group (Workspace), leaving a large blank rectangle under Document; labels and keys also stretched across overwide rows. This is shown in the user's v369 desktop screenshot.

**Conservative fix:** Two explicit aligned columns: Document then Reading & notes at left; Workspace at right. The Reading group immediately follows Document without an artificial grid-row gap. Limit the shortcut layout to 700px inside the 790px guide content, tighten group/row spacing, and retain the small-screen one-column layout. Keep all 17 bindings, bilingual labels, and keyboard behaviors. No decorative separator rules or new UI instructions.

**Gates:** JavaScript syntax, zero-network JavaScript tests, tutorial Chromium assertions and English/Chinese breakpoint checks when available. Screenshots/browser layout are not a substitute for real PDF/OCR acceptance. The PDF reading pipeline, index detection, and data models are unchanged.

**Executed v370 checks:** 16/16 zero-network Node regression suites passed; Chromium rendered the actual standalone tutorial CSS/HTML at 320, 375, 520, 768, 1024 and 1440px in both English and Chinese: 48/48 geometry assertions passed (no page overflow, label/key collision, wrong column start or separated left-stack group). The separately hosted-site navigation and actual PDF.js OCR/index behavior were not exercised; remain UNVERIFIED.

## v372 — Multiple PDFs in one reader window (2026-11-06 Beijing UTC+08)

**User requirement:** open many PDFs at once and switch between them without replacing the current document. The reader now provides a compact, horizontally scrollable tab strip beneath the existing toolbar. The native picker accepts multiple PDFs and the desktop drag-and-drop path accepts multiple PDFs; single-file open, library open and cross-paper open also register a tab. Tabs may be closed individually. Closing the last tab returns to the welcome view without deleting any cached PDF or reading data.

**Scope/architecture:** only one PDF.js document is rendered at any given moment. Other selected files remain lazy `File` handles until activated; on switching, existing `flushCurrentDocumentSession` and per-document session restoration preserve page/position/notes/index state. No extra OCR or PDF rendering runs for inactive tabs. Existing local library remains the persistent cross-session source; the transient tab strip itself is not restored after page reload. Avoid claiming all PDFs are simultaneously rendered. Do not silently discard a failed PDF tab: an unavailable cached tab remains visible for manual recovery.

**Test gates:** JavaScript syntax for all 10 modules and bootstrap; assembled runtime parser; all 17 zero-network Node suites including `tests/multi_pdf_tabs_regression.js` (picker, drop, lazy activation, active/inactive close, last tab, named File retention, CSS row). Manual browser acceptance still needed for actual PDF.js opening, switching while indexes/OCR are running, exact reading position in continuous flow, IndexedDB quota failure, huge PDFs, and mobile tab-strip scrolling. Full P0 mathematical detection and real Texify OCR correctness remain unverified by this UI patch.

**Known limitations:** tab state is session-local and lost on browser reload; each reactivation reinitializes one PDF.js instance rather than keeping canvases resident. File picker selection of multiple PDFs does not parse all of them eagerly. Browser file handles remain available only while the MathReader tab is open. This is intentional to avoid multiplying the memory footprint, but the switch path may take longer for scanned or large documents. Do not introduce background PDF.js rendering or automatic OCR of inactive tabs without separate approval and measured regression evidence.

## v373 — History-only lazy multi-PDF selection (2026-11-06 Beijing UTC+08)

**User correction to v372:** no horizontal tabs or additional reader toolbar row. The existing History panel is the single list of PDFs. Selecting/dropping multiple PDFs shows each selected file as a compact History entry. Only the first chosen file is opened immediately. Every other `File` remains in memory, labelled “Not loaded,” until the user explicitly clicks it. This click invokes the original PDF loading → text detection/OCR decision → indexing workflow; there is no pre-read, hashing, caching, OCR request, or parallel rendering for an untouched waiting file. Successfully opened files use the established persistent History entries; unopened files are temporary and disappear on reload. The `×` beside a waiting entry removes it from the queue only, never from the local PDF library. A failed file remains selectable for retry; the next one must not be auto-opened.

**Safeguards:** one active PDF.js document at a time; preserve existing per-document session save/restore, cached History, cross-paper navigation and OCR interaction guard. No OCR detection heuristics, library formats, auto-fallback, or sidebar defaults change. The new queue is session-only because browser File objects cannot be resurrected after refresh without user permission.

**Gates:** zero-network lazy queue tests cover first-only open, deferred activation, order, removal and failure/retry. Run all Node regression suites and JS syntax check. In a real browser manually verify a mixed scanned/native PDF batch, individual OCR gating after selection, page-position restoration when switching, memory pressure, refresh semantics, duplicates and failed File/IndexedDB operations. These tests are NOT verification of full document OCR, mathematical indexes, or real PDF.js switching. Retain P0 full-document ground-truth requirements.


## v375 — Explicit Equations image OCR (2026-11-06 Beijing UTC+08)

**Request:** Add a small `OCR` action immediately after the one-line Equations status (including `Saved · not rescanned`). A PDF text layer is not sufficient evidence that equation labels were extracted correctly. The action is opt-in and scans equation-number margins on **every page**, including native-text PDFs; automatic bounded assistance remains unchanged. Existing Tesseract image-assistance, numeric-gap rechecks and conservative dense-family filtering are reused. Native text is retained and manual equation edits remain applied. The action does not claim to recognize arbitrary formula LaTeX or replace full-document text OCR.

**Performance:** This explicit full-book pass may be slow on 253/303-page books, uses one worker and page-at-a-time processing, reuses previously recognized page margins and shows OCR page progress. No OCR starts for pending documents. During index work the control is disabled; document switching uses existing source-document checks and generation guards.

**Limitations:** This only covers the current equation-numbering side and uses the existing OCR candidate-validation policy; it is not a mathematical guarantee of completeness. Giusti and do Carmo represent distinct scan/text-layer challenges; browser recognition quality and memory behavior need real PDF.js/Tesseract testing. Full-page formula semantics and missing mathematical expressions are not addressed. Real-browser acceptance remains UNVERIFIED unless independently performed.


## v376 — Manual meticulous page OCR (source-level)

- Added a compact page-surface right-click action for explicit OCR of that single page in both single-page and continuous reading.
- Reuses the document OCR engine at high resolution, saves page-specific OCR evidence, and rebuilds Contents indexes (Structure, Results, Equations, Bibliography). Existing PDF text selection and the original native text layer are not overwritten.
- Cached OCR evidence is scoped by document key and page count. A failed/empty recognition is rejected without replacing prior evidence. Concurrent document OCR or index-building disables the action; document identity is checked through asynchronous stages.
- Limitations: This is Tesseract-based text/label OCR, **not verified full mathematical expression-to-LaTeX transcription**. Index reconstruction is document-wide for consistency and may take time on books. Browser OCR accuracy, persistence under quota errors, equation results, and continuous-page interactions remain unverified; regression script asserts code invariants only.
- No arbitrary filling of missing mathematical symbols or bibliography entries. Inspect actual scanned page image before accepting OCR text.


## v377 — Theme-aligned page menu and opt-in equation image recovery

- Page-specific Meticulous OCR context menu and its status label now use the same defined MathReader CSS theme tokens as the bibliography context menu (`--paper`, `--ink`, `--line-strong`, `--surface-soft`, `--accent`) and compact menu dimensions. This removes undefined white-fallback variables in dark mode.
- Equation indexing continues to parse the existing native/OCR text evidence automatically, but it **does not launch any posterior equation-margin image OCR** on normal open, restore, or index refresh. The Equations **OCR** button explicitly requests the image pass across pages; no automatic periodic or repeated scan is scheduled. The separate right-click Meticulous Page OCR remains explicitly user-triggered.
- Current scope: This is a trigger-policy/style change, not an improvement to formula-symbol transcription. Mathematically correct equation recovery, Chromium rendering, browser OCR, scan-to-Contents refresh, Firefox/Safari styling, and stress behavior remain **UNVERIFIED** until tested in the actual browser. No false mathematical certainty is implied by source checks.


## v378 — Page OCR completion notice automatically dismisses

- Confirmed UI defect: `manualPageIndexOcrMessage` displayed the completion toast without any dismissal. Added a single cancellable timer: success is displayed for 3.5 seconds, errors for 6.5 seconds; in-progress notices remain until the OCR phase ends. A new status clears the prior timer, so an older completion cannot hide a newer operation.
- No change to OCR recognition, indexes, document evidence or manual-only triggers.
- Source-level tests exercise timer replacement, visibility, and progress persistence. Actual live browser interaction is not independently verified; other P0 OCR and rendering limitations remain open.


## v379 — Meticulous OCR equation margin evidence (manual-only)

- **Confirmed class-level integration defect:** Page context Meticulous OCR previously ran only full-page text OCR. It rebuilt Equations from that text but never applied the available equation-number margin recognition. High-resolution local Tesseract margin samples of Giusti (1984) found printed `(1.4)` on PDF page 20 and `(1.7)` on PDF page 24; the embedded PDF text omits those exact parenthesized labels. `(1.5)` already appears in the text on page 20. These observations do not certify browser performance.
- **Fix:** On an explicit Meticulous OCR page action only, reuse its already-rendered canvas for a narrow-margin OCR pass. Keep only explicitly parenthesized, side-aligned, conservatively screened labels; store those as separate per-page evidence alongside the general-text OCR result, and apply them during equation index rebuild and reopens without any automatic OCR. No arithmetic label invention. This does not recognize formula semantics or guarantee the three labels in the deployed browser.
- **Test obligations and limitations:** Source-level regressions cover the manual trigger, same-canvas crop, explicit-only evidence, index restoration and label geometry guards. Inspect the original Giusti pages in actual Chromium: trigger manual OCR on pages 20 and 24, verify `(1.4)`, `(1.5)`, `(1.7)` in Equations; verify no false positives from numbered `1.4 Example`, `1.5 Remark`, `1.7 Remark`; test persisted reopening and cancellation. Exact end-to-end browser indexing **not verified**.


## v380 — First-open equation recovery and OCR action state

- First equation-index build on a native-text document performs the existing **bounded image-margin recovery plan** once, including for older sessions whose saved index was text-only. Full all-page OCR still requires the adjacent manual OCR button. This overrides the v377 manual-only default at the user's express request.
- `equationInitialRecoveryDone` is a per-document session flag set only upon successful completion. On reopen, a completed run is not repeated. A partial run remains eligible for retry on a subsequent document opening; it does not loop upon expanding Contents. The label count is not an accuracy certificate.
- The button refreshes after `equationIndexBuildPromise` settles; previously it could remain disabled because its final refresh ran while the promise was still set.
- Status now says `Text done` when no image OCR occurred, rather than ambiguous `Auto done`. Image OCR displays actual bounded coverage.
- Coverage is limited by the existing gap/page plan on long books (not an all-page accuracy guarantee). The v379 manual OCR remains available for a complete recheck.
- Source-level tests only. Real Chromium PDF.js/Tesseract runs, memory and model time, image-only initial OCR, and equation-label accuracy are not verified.


## v381 — Monotonic meticulous OCR and forced equation recheck

**Source of truth:** Full v374 ZIP plus v375, v376, v377, v378, v379, v380 root patches, applied in order. The v380 event handler and button styling are already present, and are deliberately unchanged.

**Confirmed defects corrected:**

1. Meticulous page OCR previously replaced the saved page record wholesale. A second OCR pass could therefore erase previously recognized lines or margin equation labels. The new merge preserves prior OCR evidence, adds new detections and native text evidence, removes exact near-position duplicates, and keeps conflicting reads separate rather than arbitrarily selecting an interpretation.
2. Rebuilding Structure/Results and Bibliography after the manual page scan could discard entries already indexed. Explicit meticulous recovery now unions previous entries back by existing index keys and restores document order.
3. Both meticulous page reindexing and the manually forced Equations image OCR rebuild could discard previously detected equation labels. Explicit recovery now unions earlier equation labels into the rebuilt automatic index, then applies existing manual edits; it checks the original document identity before publication.
4. Completion status reports additive total index-entry differences and zero removals; does not claim OCR accuracy or count duplicate text observations as newly verified results.

**Tests:** New `mathreader/tests/meticulous_additive_ocr_regression.js` checks idempotence, preservation of old lines/margin labels, and conflicting-recognition retention. All existing Node OCR, navigation, progress, theme and runtime tests must pass. `node --check` on all modules and assembled runtime and ZIP integrity are release gates. Real browser PDF.js/Tesseract and paired formula/text OCR evaluation were not run; no complete-accuracy claim.

**Open limitations and verification needed:**
- Additive observations can preserve a false positive from an earlier run. This intentionally prioritizes non-destructive recovery; manual correction and conservative confidence gating remain necessary. Contradictory OCR text is retained as competing evidence, not a verified mathematical result.
- Deduplication by normalized text and nearby geometry is heuristic. Visually repeated identical lines or large OCR coordinate shifts may require manual review.
- The existing index caps and book-wide structure heuristics still exist; additive behavior is specifically guaranteed for a completed explicit OCR action, not every auto-index rebuild or cache purge.
- A failed/aborted scan does not publish partial results. Storage quota, crashes, browser switching, old degraded/handwritten PDFs, Giusti labels (1.4), (1.5), (1.7), formula-to-LaTeX semantics and full-document scanned bibliography OCR require real-browser verification. All unresolved P0 accuracy obligations remain open.

**Changed files:** `mathreader/js/00-core.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/mathreader.js`, `mathreader/index.html` (asset cache keys), `mathreader/tests/meticulous_additive_ocr_regression.js`, `mathreader/tests/page_context_ocr_regression.js`, `mathreader/tests/maintenance_integrity_regression.js`, `mathreader/tests/equation_progress_regression.js`, `mathreader/tests/formula_ocr_lazy_regression.js`, and `mathreader/REGRESSION.md`. Other v380 files, including `js/70-command-ui-runtime.js` and `mathreader.css`, are untouched.


## v382 — Meticulous OCR equation ordering (2026-11-06)

**Confirmed problem:** After v381 additive OCR, newly recovered labels could appear after earlier rows rather than in printed numerical sequence. `reconcileEquationManualOrder` persisted an automatically synthesized order, then inserted new detection keys relative to that stale order. The initial coordinate sort also trusted imprecise OCR positions even for neighboring labels from one numbering family.

**Fix:** The default Equations order is recomputed from the current detected rows, prioritizing PDF page and numerical labels within the same numbering family; coordinate/column sort remains for mixed/non-numeric labels. New recovered labels are inserted in sequence; previously detected labels remain present. Explicit user drag-and-drop now sets `equationOrderCustomized = true` and retains its chosen order on reopen. Legacy auto-generated saved orders without this explicit marker are discarded rather than treated as deliberate manual sorting. Manual add-before/after placement remains independent.

**Compatibility note:** A manual drag order created before v382 cannot be reliably distinguished from the automatically saved key order in old sessions. Such old custom order may return to document/numerical order. New explicit drag orders persist correctly. This is a known migration limitation and is preferable to silently perpetuating misordered OCR indexes.

**Acceptance:** Run `node mathreader/tests/equation_order_ocr_regression.js` and all available zero-network Node regression suites, `node --check` on each source part and assembled runtime, and ZIP integrity. Live browser verification remains required for the displayed Giusti PDF and real meticulous OCR (including reference positions and navigation). No automatic OCR recognition accuracy is claimed.

## v383 — Meticulous OCR equation navigation geometry

**Confirmed defect:** `equationMarginOcrLines` cleared `fullCanvas.height` before calling `pageRecordFromHocr`. Its vertical normalization denominator therefore became 1, clipping OCR y-ratios to the bottom of the PDF page even for correctly read equation numbers. When rendering a fresh page, a second defect initialized canvas height from its default instead of the PDF viewport. This affected manual meticulous-margin evidence and automatic supplemental margin passes, and could yield wrong or missing navigation coordinates.

**Fix:** Capture source-page height before cleanup, initialize fresh render canvas from the PDF viewport, and never modify a caller-owned page canvas. Continue releasing private canvases after OCR. Retire legacy ratio=1 margin navigation coordinates **only when** a fresh observation of the same page/label supplies a usable position; the equation label itself and other evidence remain intact. Add geometry and replacement tests in `tests/equation_margin_navigation_regression.js`.

**Manual verification pending:** On a real old scanned PDF, run meticulous page OCR again on an affected page; click a newly recovered label and compare its landing position against the printed equation. Pre-v383 invalid cached targets may persist until a fresh OCR pass replaces their geometry. No live browser test or accuracy percentage is claimed here.

## v384 — Comprehensive OCR source reliability sweep (2026-11-06)

**Authoritative audit:** `mathreader/OCR_AUDIT_v384.md`. This sweep covers the full document OCR / manual Meticulous OCR / equation-margin OCR / formula Texify interface, PDF text layers, IndexedDB records, document-switch races, geometry, sorting, manual edits and failure cleanup. Seven confirmed independent runtime defects are corrected and protected by executable regression tests (restoring meticulous evidence for cached full-document OCR, repeated-word storage growth, old clipped line geometry, same-label verified-margin navigation precedence, async formula results crossing PDFs, unreleased full-document canvases on failure, and falsely verified navigation from text-only hOCR fallback). None changes the Texify model, decoder budget, OCR retry policy, or automatic scan budget.

**Required follow-up regression gate:** Run all `tests/*.js`, Chromium `tests/ocr_browser_geometry_regression.py`, existing P0/P1 browser tests and only then real-original-PDF PDF.js/Tesseract.js/Texify with independently reviewed math ground truth. Code/DOM tests do not certify image-to-LaTeX or mathematical indexing accuracy. Real PDF diagnostic samples and source hashes: `regression/ocr_v384_pdf_samples.json`. Original Giusti PDF page 24 (1.7) remains a genuine recognition miss in the local Tesseract diagnostic. See `OCR_AUDIT_v384.md` for additional severity-ranked open issues. Future OCR changes must remain additive, idempotent and document-scoped, and explicitly verify correct index navigation positions and cache reopen behavior.

## v385 — Printed equation target vs. inline reference (Giusti page 28)

**Observed in the real deployed screenshot:** Meticulous OCR added `(1.12)`, but clicking the index navigated to the later sentence “It follows from (1.12)” instead of the displayed left-margin equation.

**Root causes corrected:** equation navigation re-searched the PDF text layer and overrode verified page coordinates; the 28% equation-margin OCR crop could also include prose references and promote incorrect same-label coordinates. The original Giusti page 28 has its true `(1.12)` at approximately x=.085–.139 and y=.246, whereas its native PDF text layer has the prose reference at x=.241–.296 and y=.460. These coordinates are measurements, not a MathReader browser OCR ground-truth pass.

**New invariants:** for equation-target navigation, the actual indexed page/ratio must control the landing location and text-layer matches must never override it. Meticulous margin label candidates require measured outer-edge coordinates; use full-page OCR plus native text to reject same-row prose references and avoid cross-column false vetoes. A fresh location vetted under v385 outranks pre-v385 same-label evidence and replaces obsolete coordinates only for that same label. Preserve other labels, manual edits and cache contents; no automatic meticulous rerun. Serialize the v385 provenance marker on cache save/restore.

**Tests:** `tests/equation_reference_ocr_target_regression.js` (25 executable assertions from actual Giusti measured positions; wrong reference vs true printed tag, second column, numeric order integrity, merging, caching and semantic jump isolation), all 28 Node tests; Chromium OCR geometry 13; Chromium responsive shell 176/176. Also run `node --check` on source modules and assembled runtime plus ZIP CRC integrity.

**Pending mandatory live acceptance:** Install v385, open the original Giusti PDF, page 28, run Meticulous OCR once if the cached coordinate is already bad, click `(1.12)` and verify it lands on the first display, not the prose reference. Reopen the book and repeat, then test right-numbered textbook controls, saved manual edits and mixed numbering pages. Actual Texify/MathReader browser OCR mathematical accuracy remains UNVERIFIED; other P0 risks stay open. See `OCR_NAVIGATION_v385.md`.

## v386 — Page-relative OCR coordinates and exact equation landing (2026-11-06)

**Reported:** after manually adding entries through Meticulous OCR, clicking them can land increasingly above the printed equation toward the bottom of the page. Original Giusti (1984) p. 222 has a real `(17.11)` in the left margin near top-ratio 0.864–0.870 (native PDF and local 3× Tesseract measurements). The actual v386 hOCR parser in Chromium read locally generated Giusti p.222 Tesseract hOCR at ratio 0.8703904555; these are independently measured source positions, not a deployed-browser Tesseract.js result.

**Defect class fixed:** hOCR glyph coordinates were divided by caller-canvas dimensions instead of the hOCR `.ocr_page` bounding frame. A downscaled/internal OCR coordinate frame therefore produces an affine vertical drift. v386 normalizes all hOCR word/line/part positions against their page bounding frame, with safe fallback when the frame is unavailable. New explicitly measured margin targets carry `marginLocationVerifiedV386`; a newly rescanned same-page/same-label target replaces an old position observation while preserving the equation, all unrelated labels and the additive OCR history. Equations sidebar uses unique verified page evidence rather than trusting a stale older target; intentional manual moves remain authoritative. `goToLocation()` checks the onscreen target against the actual PDF surface rectangle after page rendering; async navigation is guarded against newer clicks and document switches. This does **not** modify model inference, OCR thresholds, crops, initial OCR trigger, page detector or manual ordering.

**Gate:** all 29 Node JS regression files passed, including the 17-assertion v386 test and earlier v385 reference-vs-display cases. Chromium passed 19 browser DOM geometry/hOCR normalization assertions, using simulated long-document page surfaces and the real asynchronous `goToLocation()` body rather than a live PDF.js renderer. `node --check` on bootstrap, JS modules and assembled runtime passed. Package integrity passed. **Real original-PDF browser Texify/Tesseract.js acceptance remains UNVERIFIED.** Existing inaccurate persisted positions should be explicitly rescanned once; v386 does not automatically run Meticulous OCR.

See `OCR_NAVIGATION_v386.md` and `tests/equation_meticulous_navigation_v386_regression.js` / `tests/equation_navigation_browser_geometry_v386.py` for exact cases, limitations and source coordinates.

## v387 — Meticulous OCR must preserve the *current reading/Contents position* (2026-11-06)

**Failure class:** v383–v386 corrected equation target coordinates but did not enclose manually triggered page OCR and its asynchronous index rebuild in a viewport-preserving transaction. Rebuilding the equation list can reset its own scroll and, in some conditions, leave the PDF reading viewport or persisted position elsewhere. This is independent of the equation's `page/ratio` target and of OCR recognition accuracy.

**Required invariants:** Save the active PDF page+relative position (or exact single-page scroll) and independent left/sidebar index scroll *before* manual OCR begins; after updates, restore the same reading position, and keep the same previously visible equation row at the same relative screen offset even if new equations are inserted above it. Never add a navigation history item, jump to a newly detected equation, or overwrite a deliberate navigation that happened during OCR. Never apply a snapshot to a different PDF or mode. Apply on failure too. Preserve additive index content and user edits; do not add automatic OCR triggers.

**New tests:** `tests/meticulous_position_preservation_v387_regression.js` (25 executable checks with user-input event guards) and `tests/meticulous_viewport_browser_v387.py` (real Chromium scroll container geometry with rows inserted above the existing viewport). `OCR_VIEWPORT_v387.md` documents implementation and human acceptance.

**Remaining uncertainty:** Full original-Giusti/Tesseract.js browser interaction, post-update font/layout shifts, and target-landing correctness require real browser acceptance; browser-shell simulation is not proof of the complete OCR engine. Do not mark full P0 OCR accuracy complete on these tests.

## v388 — Appendix equation label families and long-index completeness (2026-11-06)

**Confirmed source omissions:** v387 equated an equation's numeric label with a digit-led label, rejecting common appendix `(A.1)`, `(B-3)`, `(A1)`, `(AA.5)`, `(A.1.2)`, `(C.2a)` tags during both native-text and OCR indexing. The Equation sidebar also silently rendered only `visibleRows.slice(0, 500)`, hiding later appendix equations in long mathematical textbooks.

**Permanent policy:** index main and appendix equation numbering as independent document-order families, allow explicit alphabetic prefixes conservatively, prevent appendix prose citations and section headings from becoming equation targets, never synthesize an appendix prefix from numeric-only OCR, preserve original navigation geometry and additive meticulous-page evidence, and never silently truncate the equation list. Filtering must find entries that are not yet rendered; a large index may be displayed incrementally. Running OCR may not change reader/Contents position. Existing user edits always win.

**Implementation:** shared appendix label grammar, prefix-aware sorting/gap handling, conservative prose/reference and compact bare-tag controls, persisted summary detector version 24, 500-row incremental DOM batches plus all-row search, and CSS alignment for the existing manual Equation OCR control. Exact changed-file list and execution evidence are in `OCR_APPENDIX_v388.md`.

**Regression:** `tests/appendix_equations_v388_regression.js`, `tests/appendix_equation_sidebar_browser_v388.py`, existing Node and Chromium geometry/viewport/responsive suites, assembled runtime parse and ZIP verification. **Not verified:** browser-side PDF.js/Tesseract.js/Texify on real scanned appendices, mixed physical numbering sides between chapters and appendices, long-prefix/roman/nonstandard labels, and false negatives in degraded handwritten scans. Those remain explicit human-review risks, not silently passed cases.


## v389 — Historical textbook OCR / separator-consistency repair (2026-11-06, Beijing UTC+08)

Nine distinct old mathematics PDFs examined, eight fully extracted (585 original pages), 11 real raster hOCR page probes; one confirmed detector defect in Appendix B mixed dotted/compact tags fixed. v388 source reconstructed from v374 + v375–v388 patches; an obsolete digit-only test was corrected. Details, independent provenance, limitations and unresolved original-browser verification are in `OCR_HISTORICAL_v389.md` and `regression/historical_textbooks_v389_evidence.json`. This does not certify full Texify or 50-book recognition. Future audits must continue both all-four-Contents and paired formula transcription accuracy checks with manually verified image ground truth.

## v390 — Meticulous OCR context-menu / transient status layout repair (2026-11-06)

**Real screenshot:** On Giusti PDF page 231 the right-click `Meticulous OCR · page 231` action appeared displaced at the lower-left of the browser. The page OCR menu and its status were created dynamically but had **no CSS for their two class names**. `left/top` assignments on an unpositioned menu are ignored; the unpositioned status was also an implicit extra child of the PDF pane grid.

**Minimal change:** Style `.page-ocr-context-menu` as a viewport-fixed, clamped, theme-aware menu; position `.page-ocr-status` absolutely within `.pdf-pane`; preserve the original user-invoked OCR code, additive merge, equation navigation, OCR accuracy policy, cache and reading position. The existing Equations sidebar `OCR` button is unchanged. Increment resource versions to v390.

**Mandatory regression:** `tests/meticulous_ocr_menu_browser_v390.py` covers real Chromium DOM/CSS placement, viewport edges, theme, disabled/menu activation, Escape/outside close, OCR status overlay, unchanged PDF scroll/grid. Run all Node regression suites and earlier Chromium cases (v385 reference vs target, v386 page geometry, v387 viewport preservation, v388/389 appendix families and list pagination). Document all failures, timeouts and unverified original-PDF browser OCR. See `OCR_CONTEXT_MENU_v390.md`.

## v391 — Complete OCR-cache page inventory and async source isolation (2026-11-07 Beijing UTC+08)

**Confirmed from v390:** the full-document OCR cache could be marked active for a two-page PDF if its Map had two keys `1` and `3`, leaving real page 2 absent. Both full-document and manual meticulous OCR cache restore functions also lacked an after-`await` identity recheck, so a late IndexedDB read could publish OCR evidence against a different equal-page-count PDF. See `OCR_CACHE_v391.md` for the independently executable before/after reproduction.

**Narrow fix:** capture original PDF object + exact file key; discard delayed foreign-document reads. Reject duplicate, out-of-range, missing, and malformed full-document OCR pages before activating that cache. Stage manual-page overlays locally and publish only on the original document, preserving deliberately partial overlays and existing manual corrections. No recognition heuristic, model configuration, index version, or OCR cache schema changed. Source/HTML resource version v391; three existing version-specific regression assertions updated.

**Executed:** all 33 JS suites PASS; 10 new cache identity/completeness assertions; bootstrap, ten modules, assembled module JS syntax PASS; six real Chromium DOM/geometry suites PASS (mocked PDF/OCR backends). The combined P0 gate was attempted but exceeded its bounded execution window and must remain **INCOMPLETE**, not PASS. No original PDFs or genuine pinned PDF.js/Tesseract.js/Texify model artifacts were available locally for a new mathematical recognition campaign. Historical 50-textbook independent image-ground-truth certification remains **OPEN / 0 newly certified PDFs**. There is no basis for changing old measured recognition-accuracy figures or declaring any new formula-text correctness rate.

**Mandatory future regressions:** corrupt cache page IDs, missing and duplicate page records, delayed equal-length A/B PDF reopen, same key but replacement PDF object, valid partial meticulous overlays, valid complete cache, OCR/user-initiated navigation, and true original-PDF browser OCR when assets are available. Do not substitute VM/DOM mocks or local Tesseract proxies for model-level accuracy evidence. Unresolved P0/P1 and historical appendix/navigation cases in the earlier audit sections remain open.

## v400 — Settings typography hierarchy and native-text export coverage (2026-11-07)

**User-visible defect reproduced:** The Settings heading uses 12px; nested `Display`, `Formula OCR`, `Export data` summaries inherited an equal or larger document font. Scoped hierarchy is parent 12px, groups 11px, nested labels 10px. No changes to other sidebars' section titles. Chromium typography test checks computed sizes across six sidebar widths in both themes, no horizontal overflow; preserve v399 orphan-word handling.

**Export source audit:** Seven full-text exports contain **595/595 page records**, with **585** pages containing native PDF text and **10** without it. The Ahlfors and Giusti covers are raster/image-only; the remaining textless pages are blank in original page renders. None of the exports contains stored full-document OCR, as correctly reported by `fullDocumentOcr: not-stored`. A checkbox selects inclusion of *available* text/OCR evidence and never launches new OCR. New optional `fullDocumentText.nativeTextCoverage` fields distinguish text-bearing and textless native pages while retaining the `complete` flag's existing page-extraction meaning. Document switching and partial extraction are separately tested. No OCR model or detection rules changed.

**Regression:** 45/45 zero-network JavaScript suites; 19 Python/Chromium suites (one older cross-document browser test failed once and then passed when rerun individually; retain this flake caveat); `MATHREADER_EXPORT_CORPUS_DIR` original seven-export replay passed with original SHA256 checks. New fixtures/tests: `regression/v400_export_coverage_manifest.json`, `tests/full_text_coverage_v400_regression.js`, `tests/full_text_exports_v400.py`, `tests/settings_heading_hierarchy_v400.py`. See `EXPORT_COVERAGE_v400.md` for the authoritative audit and unresolved verification limits. **Live production OCR accuracy is not certified**.

---

