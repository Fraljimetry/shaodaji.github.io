# MathReader Regression / Behavioral Audit Record — v342

Date: **2026-11-04 (Beijing, UTC+08)**

## Scope and outcome: stability and reliability of v341

This campaign starts from the user's authoritative v339 ZIP with the **v340 and v341 root patches applied in order**, then tests current v341 behavior and builds a **conservative v342 patch** for two reproducible OCR classes. No filename-, author-, or document-specific detection exception was added. Tests use real input PDF bytes; the PDF source text is projected with PyMuPDF into PDF.js-like objects for a direct Node VM run of the **current detector functions**. That adapter is not identical to PDF.js and does not replace live browser tests. Scanned pages use locally rendered images, Tesseract 5 CLI word boxes and full-document downstream MathReader source functions. This is a partial local integration test, **not** a production WASM/Tesseract.js/Texify benchmark.

### Summary gates

| Gate | Result | Interpretation |
|---|---|---|
| Native-text detector regression | **23 byte-distinct PDFs / 1092 pages / 23 completed** | Every document completed without an uncaught exception; **zero output changes** in full label/item inventories for Outline, Results, Equations, Bibliography compared with v341, including same page/ratio in the projection adapter |
| Actual arXiv equation UI order | **(1), (2), (3), (4), (5), (6)** | Instrumented real `renderEquationIndex` pre-DOM row sorting; `(1)` and `(2)` correctly on left/right column respectively |
| Full scanned-PDF OCR rotation | **5 documents / 77 pages** | Schoen 19 + Gromov 10 + Caffarelli 27 + Pisier 18 + handwritten 3; details and incomplete inventories below |
| Targeted OCR segmentation controls | **16 / 16** | 7 positive variants + 9 negative/layout/context/profile controls (details below) |
| Source state portability assertions | **14** | Equation snapshot round-trip/column metadata, old ordinary cache rejection, portable import preservation, automatic/manual order distinction, exact OCR snapshot page validation |
| Ordered prefetch + native text cache assertions | **7** | Completion order preserved, max in-flight 3, LRU cap 24, eviction, retry after failed page load |
| Deployment/runtime check | JS syntax, bootstrap/asset versions, package integrity | `node --check` for all parts and concatenated runtime, ZIP CRC and exact changed-file check |
| Production browser end-to-end | **NOT TESTED** | Local Chromium navigation was refused with `ERR_BLOCKED_BY_ADMINISTRATOR`. No claims for live PDF.js, Tesseract.js, WebGPU, keyboard and touch UI |

## Two confirmed, narrowly repaired defects

1. **Classical OCR bibliography, lost opening bracket and fused digits.** On the 19-page Schoen scan at 3.0×, the printed `[11]` becomes the OCR line `tl) , Global properties of minimal surfaces ... Ann. of Math. ... (1964)`. v341's strong-key parser had no opening bracket and no digit it could reliably interpret: **13** references, missing `[11]`. v342 records this OCR-only token as **candidate evidence**, never as an immediate index item. It must have an unambiguous short confusable-digit token ending `)`, a ditto-author comma/colon, a strong independent bibliographic body, a left-margin position, and later be *uniquely bracketed* by existing exact numeric keys, e.g. `[10]` and `[12]`. The original marker remains unaltered outside Bibliography parsing. Full scan result: **14/14**, without modifying Results or Equations. This covers a general class of old ditto-author bibliography scans, not a hard-coded reference number.
2. **Historical OCR `§N` read as uppercase `SN`.** The 10-page Gromov scan read its heading as `S1. Statement of results`, while four subsequent `§` headings were read as `$2`–`$5` and successfully inferred by v341. v342 recovers `S1` as an explicit section **only** when an established multi-page `§N` profile exists, the next section number is directly observed, the candidate is centered, has a short non-mathematical multiword title, and passes OCR confidence. Outline improves **5 → 6** (all `§1`–`§5` plus Bibliography). Results, Equations, and Bibliography remain unchanged.

`STRUCTURE_INDEX_VERSION` advances **41 → 42** to invalidate normal local cached Structure/Bibliography and inferred outlines. `EQUATION_INDEX_SUMMARY_VERSION` stays **22** because equation detection and equation snapshots are unchanged. Portable user-imported detection data remains preserved and can be rebuilt explicitly. Application and bootstrap query versions advance **341 → 342**.

## Native corpus, counts from the same-source adapter

These numbers are **diagnostic inventories, not fully verified accuracy goldens**. Native scanned Schoen has zero text because it is image-only and is tested through OCR below. Differences from historical strict goldens can originate from the PyMuPDF-to-PDF.js adapter and require independent inspection, rather than implying a detector regression.

| PDF | Pages | Outline | Results | Equations | Bibliography |
|---|---:|---:|---:|---:|---:|
| `1209.2203v2.pdf` | 88 | 46 | 63 | 293 | 183 |
| `Radon Measures and Riesz Representation Theorems.pdf` | 10 | 6 | 16 | 0 | 2 |
| `YamabeProblem.pdf` | 56 | 12 | 51 | 61 | 46 |
| `Ahlfors-Conformal-Invariants.pdf` | 172 | 65 | 91 | 160 | 66 |
| `0810.5645v6.pdf` | 212 | 78 | 202 | 344 | 105 |
| `yau1978(2).pdf` | 73 | 13 | 13 | 158 | 15 |
| `Asymptotic behaviour of  minimal graphs over exterior domains. L. Simon.pdf` | 13 | 4 | 4 | 4 | 18 |
| `mathreader_formula_ocr_stress_test.pdf` | 13 | 12 | 0 | 8 | 0 |
| `581 Note 7.pdf` | 3 | 0 | 0 | 0 | 0 |
| `lectures_on_pde_split_pages.pdf` | 236 | 20 | 37 | 22 | 0 |
| `caffarelli1989.pdf` | 27 | 9 | 18 | 23 | 10 |
| `SPS_1988__22__485_0.pdf` | 18 | 3 | 7 | 23 | 17 |
| `The_Classic_Solution_to_the_Yamabe_Problem (1).pdf` | 26 | 25 | 13 | 270 | 7 |
| `利用D'_Alembert函数方程定义余弦函数_汲绍达.pdf` | 3 | 2 | 0 | 1 | 2 |
| `Where_do_Complex_Numbers_come_from_.pdf` | 3 | 3 | 0 | 0 | 0 |
| `Code_final.pdf` | 40 | 0 | 0 | 0 | 0 |
| `2309.00806v2.pdf` | 15 | 9 | 26 | 0 | 18 |
| `Fraljiculator_ArrayPool_Architecture_Updated.pdf` | 16 | 55 | 0 | 0 | 0 |
| `Lean_Diagonal_Similarity_Beginner_Guide.pdf` | 18 | 29 | 0 | 0 | 0 |
| `124ws2.pdf` | 6 | 0 | 0 | 0 | 0 |
| `2610.07774v1.pdf` | 15 | 5 | 0 | 6 | 18 |
| `Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces(6).pdf` | 19 | 0 | 0 | 0 | 0 |
| `geometrical_hypothesis_Banach(3).pdf` | 10 | 6 | 14 | 15 | 9 |

The 23 byte-distinct files cover historical functional analysis, harmonic analysis/probability, complex analysis, nonlinear PDE, geometric analysis, measure theory, a modern algebraic/matrix-paper control, formal proof/Lean, numbered data/worksheet, a technical performance report, code, handwritten mathematics, and modern arXiv. Geometric analysis and PDE remain overrepresented among accessible historical sources; future rotations should add older number theory, logic, statistics, coding theory and formal methods independently rather than multiplying near-duplicate geometry PDFs.

### OCR full-document inventory (local Tesseract CLI proxy)

| Scan | Pages | Structure | Results | Equations | Bibliography | Assessment |
|---|---:|---:|---:|---:|---:|---|
| Schoen 1983, image-only, 3.0× | 19 | 4 | **16** | **0** | **14** | All printed references `[1]`–`[14]`; scanned bibliography `[11]` newly recovered, no false exponent equation |
| Gromov 1967, rasterized, 2.5× | 10 | **6** | **13** | **9** | **9** | All five `§` headings and all references; native control detects 14 Results and 15 equation labels, so some OCR completeness is **missing** |
| Caffarelli 1989, rasterized, 2.5× | 27 | 9 | **16** | **50** | **10** | Historical strict image-assisted expectation 18 Results / 55 equations / 10 references: at least 2 Results and 5 numbered equations are still not recovered by this OCR proxy |
| Pisier 1988, rasterized, 2.5× | 18 | 3 | **6** | **22** | **4** | **Open accuracy issue:** native text yields 7 Results, 23 equations and 17 bibliography entries. Most author-key OCR markers are heavily damaged or separated from authors; four indexed bibliography entries is *not* a pass |
| Handwritten inverse-problems notes, 2.3× | 3 | 0 | 0 | 0 | 0 | OCR extracts only about 775 characters of weak content; relaxed no-index-pollution check, **not** a successful transcription |

**OCR performance (same host, full page renders and Tesseract 5 CLI, four worker processes, OMP_THREAD_LIMIT=1):** Schoen 19 pp ~18.35 s, ~0.97 s/page; Gromov 10 pp ~12.84 s, ~1.28 s/page; handwritten 3 pp ~2.33 s, ~0.78 s/page. Caffarelli and Pisier completed full-image OCR and detector checks, but comparable whole-document wall times were not retained reliably because a later Simon job hit the execution limit. They are *not* counted in the throughput comparison. These figures must not be presented as Texify, browser Tesseract.js, WASM or WebGPU throughput.

### Focused adversarial checks

- The OCR damaged-key candidate recovers `tl)`, `ll)`, `l1)`, `1l)`, and `I1)` in the full Schoen bibliography, **only** when numeric neighbors `[10]` / `[12]` and strong bibliographic body are present.
- Rejected: key outside bibliography's left margin; weak/ordinary prose after marker; no closing `)`; arbitrary letters instead of confusable key glyphs; no right numeric neighbor.
- The Gromov `S1` OCR heading is recovered with an existing multi-page section profile. Rejected: low-confidence OCR, off-center marker, missing neighboring section profile, and mathematical-symbol title.
- None of the 23 native-input inventories changes because both new parsing paths are OCR-scoped. The other three completed OCR documents keep exactly the same outputs as v341. One severe known limitation (Pisier author-key bibliography completeness) remains deliberately **unfixed**: a broad new OCR rewriter could fabricate keys without visual confirmation and violates the conservative-detector principle.

## Explicit exceptions / manual review and possible regressions

1. **Live browser integration, PDF.js and OCR production engines have not been verified.** A real browser run on the user's deployment is needed for page opening, heading click/navigation, sidebars, equation drag ordering, persistence, export/import, WebGPU → CPU fallback, CPU/WASM accuracy, memory and responsiveness. The local Chromium browser existed, but actual URL navigation was administratively blocked.
2. **Historical OCR coverage remains incomplete.** Gromov's 9 OCR equations versus 15 native, Caffarelli's 50 versus 55 strict image-confirmed labels, and Pisier's **4 of 17 bibliography entries** are unresolved precision/recall problems. These must not be reported as accepted golden passes. Some older paper equation strings are also difficult for PDF text extraction and require human visual checks.
3. **Severely degraded OCR and nonstandard author-key citations.** Pisier's printed keys such as `[B1]` / `[B2]` appear as `(B1 J` / `(B2` in the OCR stream, sometimes on lines separate from the author and title. This is a confirmed general weakness of the OCR → bibliography detector, but a reliable repair needs a separately verified corpus and false-positive controls; it was not attempted in v342.
4. **Potential over-indexing from non-PDF.js projection:** `The_Classic_Solution_to_the_Yamabe_Problem (1).pdf` yields 270 equation candidates on 26 pages; the output requires manual inspection before being treated as correct. `Where_do_Complex_Numbers_come_from_.pdf` returned zero Results in the PyMuPDF adapter although an older PDF.js-oriented record counted four unnumbered Definitions. This discrepancy is **not diagnosed as a source regression** and must be reproduced with actual PDF.js before a code change.
5. **Limit/cap behavior:** This pass completed a 212-page technical book and a 236-page PDE book, but did not stress documents beyond the 800-page Results primary window plus tail, UI 500-row clipping, giant page images, damaged PDF attachments, memory exhaustion, or rapid document switching during active OCR. No general cap change is justified by this test.
6. **False-positive tradeoffs:** The new ditto-author OCR path is intentionally restricted to short two-/three-glyph digit-like markers plus strong body and a unique one-number sequence gap; it will miss cases where the original marker and body are entirely erased, or where non-confusable glyphs are substituted. The `S1` recovery requires prior section-number context and will omit isolated single headings rather than invent sections.
7. **Data policy:** Imported portable indexes are preserved rather than silently overwritten on detector version changes. A manual Rebuild is required to replace already-imported OCR-derived bibliography/outline data. Ordinary locally inferred Structure should rebuild automatically after the v342 cache bump.

## Release and validation record

- Inputs: original `mathreader(5).zip` v339 + exact v340 and v341 root patches. No change to excluded unrelated workspace code, credentials, local data or Git state.
- Intended changed files (root ZIP): `mathreader/js/41-equations-bibliography.js`, `mathreader/js/40-outline-structure.js`, `mathreader/js/00-core.js`, `mathreader/mathreader.js`, `mathreader/index.html`, and this `mathreader/REGRESSION.md`.
- Syntax: all JS source files and assembled runtime checked with `node --check`; root patch ZIP member integrity and replacement equivalence checked. The numerical test counts and fixtures are local evidence; **not** asserted to be full Tesseract.js / in-browser MathReader regression.

---

# MathReader Regression / Behavioral Audit Record — v341

Date: 2026-11-03 (America/Los_Angeles)

## Purpose and code baseline

This iteration is a **regression-driven detector repair**, based strictly on the v340 root-patch-applied source; the supplied v339 full ZIP remains the common ancestor. The three motivating documents have different extraction modes. User-confirmed v340 behavior: `§5. Supplement` was recovered; the modern arXiv equation `(1)` existed but was **displayed between `(2)` and `(3)`**, and image-only Schoen reference `[11]` was **still absent**. No title-, filename-, or document-ID-specific special cases were introduced.

## Confirmed root causes and implemented repairs

| Category | Evidence | v341 change | Boundary / qualification |
|---|---|---|---|
| **Two-column equation order** | In arXiv:2610.07774v1, `(1)` is at the right margin of the **left** column on PDF p. 3, while `(2)` is in the right column; a gap-recovered `(1)` inherited the wrong `equationColumnIndex`, so column-based rendering placed it after `(2)` | Reconcile equation-column metadata using the page's established local column profile after supplementary/gap recovery. Tested the *actual* `renderEquationIndex` ordering: `(1), (2), (3), (4), (5), (6)` | Requires existing two-column geometry; does not use ascending numeric labels as a replacement for physical reading order |
| **Persisted wrong automatic order** | Existing local records retain the old generated equation order even without a user drag | Versioned equation snapshot (`EQUATION_INDEX_SUMMARY_VERSION=22`) and targeted invalidation of **old automatic** equation order when it agrees with the previous snapshot | Preserve genuinely customized order, edits, and portable import state; do not force-reset intentional user order |
| **Scanned bibliography `[11]`** | In full 19-page Schoen OCR, key `[11]` was damaged or split; observed variants include `{ll ,`, `{11} ,`, `[ll`, `[l1,`, and an isolated marker on a line separate from its body | Repair only the **expected** OCR-confusable numeric key within a validated bibliography sequence and left-margin bibliography geometry; support isolated damaged markers when established preceding references support continuation | OCR only; substantive body evidence or continuation required; native text, misnumbered keys, centered text, and bibliography-like body prose are negative controls |
| **Other historical numeric reference markers** | Full 10-page Gromov scan yielded `2]` in place of `[2]` | OCR-only repair for an opening bracket lost before an otherwise clear numeric key, again subject to expected sequential number and bibliography context | Constrained to left-side bibliography key position and known sequence; no arbitrary key insertion |
| **Sparse scan false equations** | Complete 19-page Schoen OCR found a *spurious* `(2)` on PDF p. 13 from a mathematical exponent in running prose, not a displayed tagged equation | Added a narrow sparse-OCR suppression for isolated, untrusted integer candidates that are not standalone and are not at a plausible page-side number margin | A true isolated interior-margin equation number may still be omitted; this is an explicit precision-over-recall tradeoff |
| **Historical OCR `§` confusion** | Full 10-page Gromov scan misread several `§N` section markers as `$N`, obscuring `§5. Supplement` | Require a repeated, high-confidence centered **multi-page** `$N. Title` profile before treating the isolated OCR `$` typography as a section marker | Three distinct headings and pages required; single `$5. Supplement` alone is not promoted; native-text heuristics unchanged |

## Actual-corpus regression (old and modern texts)

The native detector regression included **16 byte-distinct PDF inputs, 991 pages total**, across old mathematical papers, books, lecture notes, and modern arXiv controls. Subjects include historical functional analysis/Banach geometry, complex analysis, PDE/harmonic analysis, geometric analysis, functional analysis/measure theory, numerical examples, and modern applied/model papers. Representative items: `Ahlfors-Conformal-Invariants.pdf` (172 pp), `caffarelli1989.pdf` (27 pp), `yau1978(2).pdf` (73 pp), `SPS_1988__22__485_0.pdf` (18 pp), L. Simon's exterior minimal-graph paper (13 pp), `YamabeProblem.pdf` (56 pp), Gromov's Banach paper (10 pp), `0810.5645v6.pdf` (212 pp), `1209.2203v2.pdf` (88 pp), `Radon Measures and Riesz Representation Theorems.pdf` (10 pp), and the three user-target PDFs. Multiple locally available copies of the *same* paper were not treated as separate independent corpus examples.

These tests used actual PDF text and position data projected into PDF.js-like page text items and the **current JavaScript detection functions**, not hand-authored expected output. Compared with v340, **all 16** have exactly unchanged native **Structure, Results, Equation, and Bibliography inventory counts**; no introduced native equation labels were added or removed and no harness errors occurred. This is a **nonregression inventory gate**, not a statement that every historical scanned equation was recognized. Image-only native-text cases correctly have no usable native text and were tested separately through OCR below.

### Real complete-document OCR (not isolated snippets)

| PDF (input method) | Pages | Structure | Results | Equations | Bibliography | Confirmed observations |
|---|---:|---:|---:|---:|---:|---|
| Schoen, *Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces* (1983, image-only, Tesseract 5.5 hOCR psm 3 at 3.1×) | 19 | 4 | **16** | **0** | **14** | All bibliography `[1]`–`[14]`, including previously absent `[11]`; removed the false `(2)` at p. 13 without changing Results; four heading entries include References |
| Gromov, *A Geometrical Conjecture of Banach* (1967; image-rendered OCR at 2.5×) | 10 | **6** | **13** | **11** | **9** | `§1`–`§5. Supplement` plus BIBLIOGRAPHY; bibliography `[1]`–`[9]` including broken `[2]` |
| Handwritten mathematical lecture notes `581 Note 7.pdf` (2.3× OCR, 3 pages) | 3 | 0 | 0 | 0 | 0 | Poor OCR produces empty conservative index, **not** an accuracy pass; no false positives |

Scanned Schoen bibliography was additionally rerun through the full detector with **three OCR line-segmentation and character-confusion mutations**; all yielded **14 entries including `[11]`**, **16 Results**, **0 false equations**. A negative scan variant with just an isolated `$5` and no repeated section-marker profile was *not* promoted to a `§5` heading. The 24 focused JS assertions passed, including native / wrong-key / far-margin / nonbibliographic negative cases, single-key variants, sparse equation suppression controls, legacy order migration, and the real rendered equation order.

OCR timing on this machine: Gromov's 10-page scan completed in roughly **11.6 s**; Schoen's 19-page scan in about **23.4 s** using 4 local worker processes and `OMP_THREAD_LIMIT=1`; the 3-page notes in **8.7 s**. These are *local CLI Tesseract hOCR throughput examples*, **not production Tesseract.js CPU, WASM, or WebGPU benchmarks**. Browser memory, latency, and WebGPU-to-CPU fallback have not been measured in this campaign.

### Detector-level safeguards / regressions

- Focused source-level positives and negatives: **24 assertions**, including 5 reference `[11]` damaged-marker forms; separate full-document OCR variants 3/3; source-driven `renderEquationIndex` returns `(1)` before `(2)`; old automatic order invalidated but custom order preserved.
- The native 16-document geometry comparisons establish **no output-inventory changes** on their PDF text layer; source-level OCR reproductions identify two *additional* confirmed defects and their fixes: historical `$N` headings, truncated `[2]` bibliography keys, and the spurious scanned exponent `(2)`.
- All JS source files and combined assembled JS syntax are checked by `node --check`; the final root patch archive is checked for CRC and applying it to the v340 tree yields the exact v341 modified files (see release verification).

## Explicit caveats and follow-up risks (do not silently treat as passes)

1. **No full live browser integration run:** The PDF data adapter and Node VM call the exact source detectors, but **do not replicate** production PDF.js extraction, real Tesseract.js segmentation, cache storage, DOM interaction, mobile behavior, or all browser layout conditions. The JavaScript source renderer's sorting result was instrumented, rather than visually clicked in a deployed browser. Verify the user's live `(1)` location and `[11]` after deployment.
2. **Partial OCR coverage remains:** For the Gromov OCR-input test, only **11 numbered equations** and **13 Results** were recovered versus 15 equation labels and 14 Results in the native-text projection. This is an observed OCR recognition/completeness limitation requiring future goldens, not a v341 success claim. The 3-page handwritten notes produced almost no usable OCR—also not a success.
3. **OCR false-positive/false-negative tradeoffs:** The sparse-scan guard may reject a genuine solitary unlabeled-width interior equation; a wholly erased bibliography marker/body cannot be reconstructed safely. OCR `$N` only recovers repeated, confidently recognized historical section layouts; one-off headings may still be missed.
4. **No fully independent quantitative truth for every text:** Inventory equality does not prove correctness. Existing historical goldens, full-document **WebGPU/CPU WASM** OCR accuracy and performance, image-heavy degraded pre-21st-century scans, all downstream headings/results/formulas/bibliography, mixed-image/text pages, and visual click-through remain important manual/browser regression gates. The corpus is intentionally more diverse than geometric analysis but is not comprehensive across number theory, probability, algebra, logic, theoretical CS, or information theory.
5. **Persistence semantics:** Version bump invalidates standard local outdated index summaries. Imported portable detection snapshots and explicit user-customized equation orders are intentionally preserved; users may manually rebuild imported older snapshots when needed. Live storage migration was source-audited but not executed against the user's actual browser DB.

## Release record

- Version `340` → **`341`** (exactly one increment).
- `STRUCTURE_INDEX_VERSION`: `40` → **`41`**; `EQUATION_INDEX_SUMMARY_VERSION`: `21` → **`22`**.
- Modified full-file payloads only: `mathreader/REGRESSION.md`, `mathreader/index.html`, `mathreader/mathreader.js`, `mathreader/js/00-core.js`, `mathreader/js/40-outline-structure.js`, `mathreader/js/41-equations-bibliography.js`.
- Root-level ZIP patch only; no original PDFs, credentials, other app code, standalone loose-file deliverables, or test helper scripts in the shipped archive.

---

# MathReader Regression / Behavioral Audit Record — v340

Date: 2026-11-03 (America/Los_Angeles)

## Scope: three user-reported omissions, three detector classes

Authoritative source: uploaded MathReader v339 ZIP. These changes are
**class-level, deliberately bounded**; there are no PDF-specific title or file-name
conditions and no changes to native/OCR mode selection or intentional WebGPU-to-CPU
fallback.

| Attached PDF | Visible ground truth | Baseline v339 local reproduction | v340 local reproduction |
|---|---|---|---|
| `Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces(6).pdf` (19-page image-only scan) | Reference **[11]**, on PDF page 19, between [10] and [12] | The OCR line was `{ll , Global properties ... (1964)`; [11] was folded into reference [10] in the focused page-19 bibliography test | [11] created as a distinct entry with its own title, page and position; [10] no longer swallows its text |
| `geometrical_hypothesis_Banach(3).pdf` (1967) | **§5. Supplement**, PDF page 9 (printed 1063) | §1–§4 detected; §5 missing because its one-word title failed the explicit-marker multiword qualification | §1–§5 detected in the inferred outline |
| `2610.07774v1.pdf` (modern two-column paper) | **(1)**, PDF page 3, right edge of left column | (2)–(6) detected, but (1) omitted | (1)–(6) detected, with (1) anchored on PDF page 3 |

### Detector improvements

1. **Scanned numeric bibliography keys:** When the established bibliography is expecting a particular next numeric key, allow a left-margin **OCR-only** marker with surviving opening bracket and damaged closing bracket/punctuation (e.g. `{ll ,`) if its OCR-confusable digits match that exact expected key and a substantive bibliography body remains. No promotion from sequence alone; native text and ordinary body prose are untouched. This applies beyond the example number 11.
2. **Explicit historical section markers:** Repeated, qualified multiword `§N` headings must first establish a document-level profile. Within that profile, admit a genuinely short, centered or larger **single-word** `§N. Title` peer. An isolated marker cannot establish the profile, and the existing equation/prose exclusion rules remain.
3. **Two-column equations:** Permit an explicit local-column-margin tag with weak *single-line* mathematical evidence (one extracted operator, no independent neighboring display line), but only through the existing two-column geometry classifier. When it is the only compatible supplemental label, require a trusted neighboring integer sequence, including a short supported leading gap. This does not relax the ordinary full-page-margin classifier, and it does not infer equation numbers that were never read.

### Evidence and validation

- Read all three supplied PDFs, including visual inspection of the scan's final bibliography page and the modern equation page.
- Current-source deterministic source harness compared v339 and v340 using actual page text and geometry extracted from the uploaded native PDFs, projected into PDF.js-like text items (not claimed identical to browser PDF.js extraction).
- Focused scan harness used the final page rasterized at **3.6×** with local **Tesseract PSM 3 hOCR**, with word bounding boxes and confidence fed into the current MathReader bibliography builder. This mirrors the app's OCR page scale/segmentation settings, but is not a claim of identical Tesseract.js results in production.
- Negative controls passed: wrong expected bibliography key, native-text key, non-left-margin key, nonbibliographic prose, equation-like prose without math, weak formula candidate eligibility, and no single-word §N promotion without an established document profile.
- Independent Banach native-equation inventory stayed **15 labels before / 15 after** in the approximate native-text harness, verifying that the outline change did not spill into its Equation index. The published v339 image-assisted Banach golden of **16** was **not rerun** in this focused campaign; the known missing native `(10)` requires supplemental image inspection.
- Both changed detectors and all bundled JavaScript pass `node --check`, including concatenated-runtime syntax; ZIP CRC/integrity verified.

### Unverified behavior and regression risks

- A full interactive browser run with the production PDF.js/Tesseract.js CDN modules and the user's exact installed browser state was not available in this offline sandbox. The local source harness is **not** equivalent to a production-browser regression. The output should be checked in MathReader after deploying v340 and allowing indexes to rebuild.
- The local OCR CLI recovered only a subset of the scanned bibliography from the final page, whereas older v339 regression records reported a different full-document OCR result. This is an engine/recognition discrepancy, **not** evidence that the other references are absent from the printed paper; full production OCR and all 14 references need human verification.
- A fully erased OCR key **and** erased bibliographic body cannot be confidently recovered, and should not be manufactured. Multi-character damaged keys without a surviving opening delimiter remain an edge case.
- One-word §N headings without any repeated explicit-marker profile can still be missed by design; broad promotion would create false headings.
- Single inner-gutter integer tags without mathematical glyphs or corroborating numbering remain conservative omissions; relaxing this generally would risk adding prose citations and table values as equations.
- Existing portable user-imported detection snapshots deliberately survive a detector-version bump; use a manual rebuild if such an older snapshot still lacks the corrected section or equation.
- The established multi-PDF historical golden suite and live deployed CDN/browser cache behavior were not rerun. These remain the next broad-regression targets, not implied passing gates.

## Release information

- Application version **v340** (exactly one increment from v339).
- Structure index version **40** (was 39), equation summary version **21** (was 20), so stale ordinary local content-detection caches are invalidated and recomputed, including the previously sticky inferred-outline completion flag. Portable imported reading-data snapshots remain deliberately preserved.
- Changed files: `mathreader/index.html`, `mathreader/mathreader.js`, `mathreader/js/00-core.js`, `mathreader/js/40-outline-structure.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/REGRESSION.md`.
- Release artifact is a **root-level patch ZIP** containing only those changed full files.

---

# MathReader Regression / Behavioral Audit Record — v339

Date: 2026-11-02 (America/Los_Angeles)

## Regression rules used

- Standard readable documents require strict content-detection checks; degraded/pathological files may use relaxed acceptance and must not drive code changes unless the issue is a reproducible class problem.
- Every regression rotates in new material and selectively retests older difficult fixtures.
- Emphasize pre-21st-century, archaic, degraded, scan-backed material; modern/arXiv documents are minority controls.
- Spread coverage across different mathematical branches and adjacent technical fields; geometric analysis must not dominate unless the active bug requires it.
- Always test image-only/image-heavy PDFs and selectively test handwritten mathematics. Check full-document OCR accuracy, downstream Structure/Results/Equations/Bibliography stability, and OCR performance.
- Equation and bibliography completeness/false positives receive special scrutiny.
- Only class-level defects justify source changes. Unusual one-off documents do not justify broad heuristics.
- Keep the campaign bounded enough to finish safely in one run.
- Record uncertain behavior, possible side effects, and anything needing manual browser/human verification.

## v339 subtle behavioral audit

Audited the document-state lifecycle and asynchronous index pipeline beyond the v338 fixes:

- native PDF / scanned PDF / OCR / no-OCR states;
- import before and after opening the matching PDF;
- portable detections through close/reopen;
- equation-only Search without document text;
- exact-document hash mismatch rejection;
- repeated/local equation candidates through export/import;
- stale detector-version portability;
- Structure/Results/Bibliography background indexing;
- native equation indexing followed by posterior margin-image OCR;
- export while indexes are building;
- switching documents while an export is waiting;
- stale top-level asset cache versions;
- long-document detector/UI safety caps;
- asynchronous document/source-key guards.

### Confirmed class-level behavioral bug fixed

**Export could snapshot incomplete content detection.** Structure/Results/Bibliography are built asynchronously, and the native equation index is intentionally published before posterior margin-image OCR finishes. In v338 and earlier, pressing **Export reading data** during either phase could produce valid JSON that permanently omitted detections which appeared in the UI shortly afterward.

v339 makes export a durability boundary:

1. wait for any in-progress Structure/Results/Bibliography build;
2. force the current structure build if its version is stale;
3. ensure the equation index has been built;
4. wait for posterior image-margin equation OCR to settle;
5. abort rather than export if the user switches to another document while waiting;
6. only then serialize `contentDetection`, OCR data, and session state.

No equation/structure/bibliography detection heuristic was changed in v339.

### Behavioral validation

- Isolated current-source race harness: export waits for an already-running idle Structure build and late equation-image assist; waits for a forced stale Structure rebuild; aborts on document switch; scan/no-text portable export remains immediately eligible.
- Headless Chromium current-source lifecycle replay: portable equations survive no-text helper access and reopen; saved equation search remains usable; old portable equation snapshots restore while stale local caches remain rejected; duplicate equation labels retain multiple candidates; exact-hash wrong-PDF import is rejected; no page JavaScript errors.
- Cache-busting check: only `?v=339` is present in current `index.html` asset references.
- Long-document cap audit did **not** justify speculative limit changes: a 504-page mathematical book produced 375 equation labels; a 212-page algebraic-geometry monograph produced 344 equations / 203 Results / 105 bibliography entries, all below current safety ceilings.

## Old-paper regression — current v339 detector

The detector code is unchanged from v338; the current source was rerun against the following old/difficult files. Image-assisted totals below use actual margin-OCR evidence where rerun in this campaign.

| File | Field / era | Current v339 result |
|---|---|---|
| `Ahlfors-Conformal-Invariants.pdf` | complex analysis / conformal invariants, 1973 | **163 Equations / 95 Results / 66 Bibliography**, including current posterior image assist. |
| `Gromov_1967_A_Geometrical_Conjecture_of_Banach.pdf` | functional analysis / Banach-space geometry, 1967 | **16 / 14 / 9**, including image-confirmed `(10)`. |
| `Pisier_1988_Riesz_Transforms.pdf` / `SPS_1988__22__485_0(1).pdf` | probability / harmonic analysis, 1988 | **25 / 7 / 17**, including image-confirmed missing `2.x` labels. |
| `Caffarelli_1989.pdf` | nonlinear elliptic PDE, 1989 | Current native rerun **23 / 18 / 10**. Established strict visible-margin golden is **55 / 18 / 10**; posterior detector logic is unchanged in v339. |
| `YamabeProblem.pdf` (Lee–Parker) | elliptic PDE / conformal geometry, 1987 | Current native rerun **62 / 51 / 46**. Established strict image-assisted golden remains **67 / 51 / 46**; the five known missing native labels are image-confirmed. |
| `Simon_1987.pdf` | calculus of variations / nonlinear PDE, 1987 | **36 / 4 / 18**, including local integer equation family `(1),(2)`. |
| `Yau_1978.pdf` | complex differential geometry / Monge–Ampère, 1978 | **256 / 13 / 15**, full strict visible-margin equation golden preserved. |
| `Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces(4).pdf` | image-only classical journal scan, 1983 | Fresh full-document OCR: **0 / 16 / 14**. Zero numbered equations is intentional for this paper. |

### Additional long-document invariants

| File | Type | Current result |
|---|---|---|
| `Lectures_Differential_Geometry_504p.pdf` | 504-page mathematical text / multilingual degraded text layer | **375 Equations**; used primarily for cap/stability auditing. Structure/Bibliography text extraction is too corrupted for strict ground truth and is not treated as an acceptance golden. |
| `0810.5645v6.pdf` | 212-page algebraic-geometry monograph | **344 Equations / 203 Results / 105 Bibliography**; confirms current UI/persistence caps are not reached on a large standard mathematical document. |

## OCR rotation

- `Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces(4).pdf`: 19 image-only pages; fresh local full-document OCR **24.08 s total / 1.27 s per page**; downstream **0 / 16 / 14**.
- `581 Note 6.pdf`: 2 handwritten inverse-problems pages; fresh OCR **1.92 s total / 0.96 s per page**; downstream **0 / 0 / 0**, with no false content-detection pollution. Exact handwritten symbol transcription is relaxed acceptance, not claimed 100% accuracy.

## Cross-field historical candidates researched but not counted as detector coverage

To broaden future rotations beyond analysis/geometry, public copies were located for Turing 1936 (computability), Shannon 1948 (information theory), Hamming 1950 (coding theory), Nash 1951 (game theory), Bellman 1952 (dynamic programming), Erdős–Rényi 1959 (random graphs), Kalman 1960 (control/filtering), and Metropolis–Ulam 1949 (Monte Carlo/statistical physics). The sandbox could read their public web sources but could not obtain raw PDF bytes for the local MathReader detector because outbound byte/DNS access is restricted. **They are future candidates, not claimed tested files in v339.**

## Potential exceptions / manual checks

- Production browser download/file-picker behavior, deployed CDN caching policy, and production Texify/Tesseract engine behavior remain outside the deterministic local harness. The package cache keys are synchronized, but a deployment layer that caches `index.html` itself still needs normal cache policy.
- `Caffarelli_1989.pdf` and `YamabeProblem.pdf` were rerun natively in this campaign; their strict image-assisted totals rely on previously verified visible margin evidence because the image-assist detector code has not changed. They should remain rotating strict fixtures in future campaigns.
- Very large documents still have deliberate bounded UI/index limits. This campaign found no standard document that reaches those ceilings, so no speculative cap expansion was made.
- If a future export is requested while a detector repeatedly fails rather than merely runs slowly, v339 refuses the export instead of silently writing an incomplete detection snapshot. That failure path should be manually observable through the existing error banner.
- Public historical papers listed above were not locally executable this turn and must not be treated as acceptance evidence.

## Cleanup / release gates

- Application version: **v339**.
- Structure index version: **39** (unchanged).
- Equation summary index version: **20** (unchanged).
- Detector heuristics: **unchanged** from v338.
- All JavaScript files and the concatenated runtime pass `node --check`.
- Current-source headless-browser lifecycle replay passes with no page errors.
- Export-settling race harness passes idle-build, forced-build, late image-assist, document-switch-abort, and no-text portable cases.
- Release ZIP contains only the root `mathreader/` package; regression scratch files and OCR intermediates are excluded.

---

## Prior record — v338 and earlier

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
