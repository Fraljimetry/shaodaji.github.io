# MathReader Regression / Behavioral Audit Record — v346

## v346: One-line equation progress and compact sidebar copy (UI-only; 2026-11-05 Beijing time)

**Baseline:** Full user-provided v345 ZIP (`mathreader(6).zip`), 10 shared-scope JavaScript parts; `REGRESSION.md` was consulted before editing. **Code version 345 → 346**, exactly one step. Structure cache **44** and equation snapshot version **22** unchanged. This is a copy/layout correction, not a detector, OCR pipeline, scheduling or cache change.

### UI defect class and conservative correction

- **Observed / user-reported:** v345's Equations sidebar status concatenated stage, text pages, planned OCR pages, retries, labels, gains, failures and partial-coverage disclosure into a long string. The existing `overflow-wrap:anywhere` allowed several wrapped lines in a narrow academic sidebar. The class is *diagnostic prose overflowing compact status surfaces*, not a single-PDF detection issue.
- **Correction:** show a short **single-line, nonwrapping** status with constrained width and ellipsis when needed. Preserve progress counters and truthful stage changes (`Text`, `OCR plan`, `OCR x/y`, `Checking`, `Auto done`, partial, failure, saved). Put the **original detailed work summary** plus existing measured local times in the hover `title` (two lines); leave the one-per-run local console metrics intact. Put **failure and selected-page coverage before the recovered count** so they remain prominent even when truncated. Avoid duplicating the total label count already shown in the adjacent Equations badge; keep it in the detailed tooltip. Selected-page OCR is explicitly marked `selected` (中文 `选页`), and OCR denominators still represent planned pages, not all document pages. `Auto done` continues to mean *scheduled automatic checking finished*, **not** 100% detection accuracy or full OCR coverage.
- **Related, limited copy audit:** shorten cramped Results/Equations/Bibliography empty hints, Formula OCR default/ready/select-mode messages, Search's passive help, and the pinned-page status. Retain substantive OCR errors, safety advice, help popovers and scanned-document instructions; do not globally truncate all error/status text. Both English and Chinese are updated; Search retains the exact normalization details in its bilingual tooltip.
- **No semantic changes:** Preserve v345's PDF/Javascript selection, candidate recognition, retry scheduling, failure accounting, native-first publishing, document generation guards, PDF rendering, full-text OCR choices, WebGPU→CPU fallback, caching, import/export and local timing measurements. Do not modify detector rules merely to make UI tests pass.

### Gates and limits actually observed

| Gate | Result | What it proves / does not prove |
|---|---|---|
| `node mathreader/tests/results_toc_regression.js` | **PASS, 23 assertions** | Previously tested TOC-to-Results boundaries retained. |
| `node mathreader/tests/bibliography_boundary_regression.js` | **PASS, 15 assertions** | Previously tested bibliography boundaries retained. |
| `node mathreader/tests/equation_progress_regression.js` | **PASS, 33 assertions** | v345 generation guards, native/OCR/partial/saved/unavailable/failure, timing/canvas release; v346 compact text, expanded tooltip, selective-coverage caveat, English/Chinese copy and CSS contract. |
| 10 subsystem `node --check`, bootstrap and tests | **PASS** | JavaScript syntax. |
| 10-part assembled ES-module `node --check` | **PASS** | Module ordering and assembled syntax. |
| Static source comparison with v345 | **PASS for scope** | Only UI copy/presentation, test expectations, docs and version keys changed; no indexing/detection functions or OCR fallback implementation changed. |
| Full-document native/old-scan/handwriting corpus | **UNVERIFIED in v346** | PDF fixture bytes and actual OCR/browser end-to-end execution were not available in this handoff. v345 evidence is historical, not a new v346 accuracy gate. |
| Headless Chromium style preview | **UNVERIFIED** | Offline visual smoke process timed out; no rendered CSS/layout verification claim. |
| Production website and mobile browser | **UNVERIFIED** | Release not deployed by this artifact; CSS ellipsis, hover detail and narrow/mobile interaction require manual observation. |

### Manual acceptance and ongoing risks

1. In the deployed app, test the narrow Contents sidebar in English and Chinese (desktop and mobile), each stage of native, planning, OCR, validation, complete, partial and restored index. The visible status must use **one line**, not wrap; reveal full details by hovering on desktop. Check whether touch-only users need a future compact accessible details control rather than a hover-only `title`.
2. Test long counts (e.g., 1,000+ pages, 100+ OCR pages) with very narrow sidebars. Confirm that ellipsis never hides *critical failures or selected coverage*; narrow modes may still need a responsive compact design if field measurements show critical text hidden.
3. Compare actual output across native-text math PDFs, OCR-heavy historical scans and handwriting with v345, including all index inventories, anchors and ordering. **Not done in v346**. Known source-content omissions are inherited unresolved: Pisier reference OCR, Gromov/Caffarelli Results/Equations OCR, Ahlfors damaged native equation labels, handwriting, and lack of exhaustive production-browser acceptance. Keep these as **FAIL** or **UNVERIFIED**, never count them as PASS because the UI is smaller.
4. Verify the default Formula OCR ready/select text, Results/Bibliography hints, Search help and pinned-page copy in both languages. Error messages still wrap when important: do **not** force one-line CSS on all status/error surfaces.

**Release paths:** `mathreader/mathreader.js`, `mathreader/index.html`, `mathreader/mathreader.css`, `mathreader/js/00-core.js`, `mathreader/js/10-formula-ocr.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/js/70-command-ui-runtime.js`, `mathreader/tests/equation_progress_regression.js`, and `mathreader/REGRESSION.md`. Root ZIP patch only. No new fixtures or hidden network dependencies.


## v345: Progressive equation-detection status and local performance profiling (UI-only; 2026-11-04)

**Authoritative input:** v339 full source, then root ZIP overlays v340, v341, v342, v343 (including durable policy), v344 and v344 handwriting policy. Reconstructed from the files and retained the exact 10-part ES-module architecture. **Code version v344 → v345**, exactly one increment; detector/cache versions intentionally unchanged because equation recognition, acceptance, and persistence data formats have not changed. The next code version is **v346**.

**User-approved changes:** (1) explicitly distinguish native-text indexing, planned image OCR and completion; (2) show current pages inspected and recovered labels, including failed pages and bounded/selected-page coverage; (3) measure local time spent extracting native text, PDF margin rendering, OCR-worker setup, OCR recognition, numeric gap retries, index validation and UI publication. Keep the display one unobtrusive line in Equations; detailed numbers are available on hover and in **one local console.info record per finished run**. No telemetry, external service, new OCR engine, new detector fallback or expanded OCR scheduling. Preserve progressive publication and user edits/order.

**Critical semantic guard:** `Finished` means the scheduled automatic work for this open document has ended. It does **NOT** mean full OCR coverage or 100% content-detection accuracy. When only selected pages were image-inspected, the UI explicitly says `selected coverage only`; its OCR fraction is **planned pages**, not the total PDF page count. Reopening a persisted result displays `Saved index · not rescanned`, never a false fresh-completion claim. Failed pages/end-stage exceptions show partial/failed status, not silent success. Progress is per-document-generation guarded against stale asynchronous callbacks when the PDF changes. The bilingual status is refreshed on language switches and display updates are throttled (~400 ms) to reduce live-region noise. No index output, detector version or cache semantics should change as a result of instrumentation.

### Gates actually executed

| Check | Result | Meaning/limit |
|---|---|---|
| `node mathreader/tests/results_toc_regression.js` | **23/23 PASS** | Existing class-level TOC-to-Results negative/positive controls preserved. |
| `node mathreader/tests/bibliography_boundary_regression.js` | **15/15 PASS** | Existing boundary-reference positive/adversarial controls preserved. |
| `node mathreader/tests/equation_progress_regression.js` | **24/24 PASS** | New progress states, per-document generation, partial/failed/unavailable/saved handling, selected coverage, failure-safe canvas release, mock OCR timing, stage event wiring. |
| Native projection nonregression vs v344 | **8 byte-distinct PDFs / 340 pages; exact same equation labels, pages, ratios, confidence, and column-order metadata** | Native geometry projected with PyMuPDF, same Node-VM source detector in both versions, image assistance stubbed. Not independent accuracy truth or a production PDF.js run. |
| JavaScript syntax, assembled runtime, boot version and archive CRC | **PASS** | All 10 JavaScript subsystem syntax checks, compiled assembly syntax, HTML asset version=345 and ZIP CRC verified in release audit. |
| Headless Chromium page-load smoke | **UNVERIFIED** | Local browser returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` for local HTTP server before app loaded; neither deployed browser nor production PDF.js/Tesseract.js/Texify was exercised. |

**Eight PDF types in projected nonregression:** Gromov/Banach 1967, Schoen-related modern arXiv paper 2026, Ahlfors *Conformal Invariants* (long classical book), Caffarelli 1989, Pisier 1988, Yau 1978, a 2023 algebra paper, and a Radon/Riesz mathematical exposition. The projector covered 340 actual PDF pages, but only the equation-native detector was compared item-by-item. Output counts in that harness were 15, 5, 161, 23, 22, 159, 0, 0; these are **projector-derived counts**, not verified ground truth or production equation totals. Existing known missed equations and OCR inaccuracies remain OPEN (see v344 ledger below).

**Performance interpretation:** new counters and per-stage local millisecond measurements are installed and exercised with a mock OCR worker. **No production performance improvement has been claimed or measured.** Time spent in PDF.js/Tesseract in the user's browser remains a manual test. `nativeMs` includes native extraction/candidate collection, `validationMs` covers sequencing/deduplication, OCR rendering and recognition are measured around actual margin work, `ocrSetupMs` measures worker creation, `retryMs` is a subset of OCR work (do not sum it with render/recognition to compute wall time), and `uiMs` measures equation-list rendering. Pauses, cache waits and general scheduling overhead can account for elapsed time beyond the shown categories; cached OCR pages are not re-timed. Timings are diagnostic only, not correctness evidence.

### Mandatory manual browser checks for this UI-only release

1. Open a modern PDF with complete native equation labels. Expand Equations and confirm `Reading text …` transitions to `Automatic check finished`, with no invented image-scan percentage.
2. Open an older, image-backed, *native text-layer* PDF and confirm the index first shows native labels, then `image OCR x/y planned pages` progresses even when zero labels are recovered, and ultimately finishes. For >120-page scanned books, verify `selected coverage only` when fewer than all pages were planned.
3. Force one OCR-page failure (or offline OCR-worker load) and confirm partial status plus page count; restart/replace the PDF while OCR is active and confirm no stale status or old rows appear.
4. Reopen a saved/indexed document without rebuilding; verify `Saved index · not rescanned` and preserved manual ordering, equation edits, cache summary, and portable reading-data restore.
5. Hover the status to inspect local stage timings; check console record, UI responsiveness, no leaked OCR workers, and no unexpected network calls. Compare native index and OCR index contents, correct ordering, anchor navigation and full-document export/import with v344 where browser access permits.

**Open risks / non-gates:** browser event wiring and stylesheet appearance in the deployed app are unverified (browser environment blocked), and increased status updates should be profiled on very long PDFs before claiming no slowdown. This release **does not resolve** the Ahlfors native `(1-4)`/`(1-7)` omissions, Pisier/Caffarelli/Gromov OCR incompleteness, or handwritten OCR recall. Continue treating every human-legible known omission as FAIL/deferred, never as a certified accuracy PASS.

### Standing policy reminder

All policies, decisions, known failures, exceptions, and regression evidence must live in packaged Markdown, not merely chats. Every future code change uses a root `mathreader/` patch from the latest authoritative package, advances exactly one application version, runs positive and adversarial class-level tests plus broad real-PDF nonregression, and explicitly distinguishes operational stability from exhaustive content accuracy. Human-legible printed content requires independent complete accuracy validation before any 100% claim; handwritten notes are best-effort with measured recall, negative controls and recorded limitations. Keep previous sections below intact as historical records.

---


Date: **2026-11-04 (Beijing, UTC+08)**

## Permanent handwritten-mathematics quality policy — best achievable accuracy (effective v344; 2026-11-04 Beijing time)

**User decision / hierarchy:** For handwritten notes, perfect symbol/text recognition is not a realistic *release prerequisite*. **Maximize measured accuracy without fabricating text or mathematics**. This is a *narrow handwriting-specific acceptance distinction*, **not** a downgrade of the 100%-verified-content standard for printed, human-legible mathematical works. Human-readable handwriting is not automatically an "illegible source" exception. Do not call its recognition "100% accurate" or fully verified merely because processing completes or an index has no false positives.

1. **Prioritize useful handwriting recall and faithfulness**: detect legible headings, actual labelled Theorem/Lemma/Definition/Result statements, numbered displayed equations, references and reading order as well as possible; preserve mathematical symbols, superscripts, subscripts and inequality direction. Record both omissions and invented/wrong entries. OCR/transcription quality and *downstream detection accuracy* are separate measurements.
2. **Independent visual ground truth**: For each representative handwriting family, visually inspect original pages and annotate expected readable targets. Report exact-page target-level precision/recall when an exhaustive ground truth exists; otherwise use explicit partial "anchor checks", with a denominator, and label the rest UNVERIFIED. Separate handwritten-content text, equation/transcription fidelity, Structure, Results, Equations, Bibliography and navigation; do not count a zero-index document as passing without checking it visibly lacks indexed targets.
3. **Conservative improvement rule**: Consider OCR scale, contrast, segmentation and page/layout alternatives, but promote a new default only after positive *and* adversarial negatives across different handwriting styles, fields and scan conditions, including actual downstream MathReader outputs. Do not infer a mathematical symbol or number from a sequence alone; do not broaden parser rules merely to rescue one distorted page. Protect printed/native and old-scan corpora, caches and user customizations.
4. **Performance and fallbacks**: Measure total/page OCR time, completion/error rate and memory on full and rotated handwriting samples. Preserve intentional WebGPU-to-CPU Formula OCR fallback. Distinguish local Tesseract CLI proxy from deployed browser Tesseract.js, PDF.js and Texify recognition; one cannot certify the other. Compare OCR text with any embedded PDF text layer before proposing a forced-re-OCR policy.
5. **Deferral and release labels**: A difficult handwritten recognition problem may be deferred without blocking an unrelated release, **but its affected content remains a known accuracy limitation / FAIL or UNVERIFIED**, never a blanket PASS. Record a stable ID, original file/page, legible expected content, observed output, likely class, why a safe fix is deferred, and next test. Fully verified PASS applies only to actually checked targets; the rest is not certified. This quality concession does **not** excuse avoidable reproducible detector regressions, bad ordering, failures on readable printed material, or fabricated entries.
6. **Durability**: This policy and each future decision must remain in `mathreader/REGRESSION.md` in every delivered root ZIP. The latest fully supplied project ZIP and its packaged Markdown—not chat summaries—are authoritative across conversations. Revisit open handwriting defects in later regressions instead of silently forgetting them.

### v344 focused handwritten regression — current local evidence (code unchanged)

- **Corpus provenance:** Prior user-provided `Handwritten Notes.zip`, SHA-256 `d915797822f9fc091bf7b56233de6098b621dd721045b037e706586e0e658c79`; **100 PDF entries, 97 byte-distinct PDFs, 1,139 byte-distinct pages** after removing 3 byte-duplicates. Diverse styles in MIT 6.046 algorithms, handwritten MIT lectures, CMU robotics mathematics and Berkeley Stat 210A. Plus separate `581 Note 7.pdf` (3 inverse-problems pages). Do not count the same reprocessed material as newly sourced scholarship.
- **Fresh OCR selection:** **182 rendered page samples**: page 1 from each of 97 unique documents, additional deeper pages of selected documents across families, and all 3 pages of `581 Note 7.pdf`. This is **not** a full 1,139-page current-v344 OCR rerun; unsampled pages remain UNVERIFIED. Rendered through PyMuPDF at 2.0x (~144 dpi for typical 72-pt pages); local Tesseract CLI `eng`, PSM 3, 4 concurrent tasks, `OMP_THREAD_LIMIT=1`; page-line geometry passed to actual v344 Structure, Results, Equations and Bibliography detection functions in Node VM.
- **Throughput:** OCR **182/182 completed**, 0 timeout/process errors; local wall time **40.72 s**, mean summed per-page worker time **0.726 s**, slowest **1.889 s**; **10 pages** had no OCR lines; ~15,536 OCR words, confidence weighted by recognized words ~44.85/100. Confidence is a proxy diagnostic, not an accuracy percentage; engine concurrency/wall time are not production-browser benchmarks.
- **v344 detector source integration:** **98 document inputs** (97 byte-distinct historical handwritten PDFs plus the 3-page inverse-problems note) completed the four source-level index paths without uncaught exceptions. On the **sampled OCR pages only**, **0 inferred Structure, 0 Results, 0 Equations, 0 Bibliography** were output. This is **PASS for no exception and no observed index pollution**, but **NOT a content-recall or 100%-accuracy PASS**. Earlier archived v317 fully sampled handwriting run reported eight Results and dozens of inferred headings; the present sparse-page selection **cannot** be used to contradict or erase that historical evidence.
- **Visible-text anchor comparison (exploratory, not word error rate):** Across 39 short, human-read first-page heading/text anchors in 10 different notes, line-string fuzzy matching at 0.70 threshold found **21/39** under Tesseract CLI PSM 3 and **22/39** under PSM 11 at the same 2.0x scale; at stricter 0.85 the figures were 12/39 vs 14/39. PSM 11 helped `lecture08-fisherinfo.pdf` p1 (**0/5 → 3/5**) and `lecture26-multipletesting.pdf` p1 (**1/5 → 4/5**), but hurt `lecture02-probability.pdf` p1 (**5/5 → 3/5**) and `Optimization.pdf` p1 (**2/2 → 0/2**). The tiny, fuzzy anchor experiment does not justify globally switching segmentation modes or a production setting.
- **Nominal text-layer triage risk:** Source-level `pdfNeedsDocumentOcr` exercised with projected text from seven distributed pages of each of the 97 distinct PDFs chose full OCR for **73** and treated the existing PDF text layer as usable for **24** (mostly Berkeley handwritten statistics). Those pages visibly contain handwriting, and their embedded text transcription can be imperfect. This is **a possible class-level quality blind spot** rather than proof that forcing browser OCR would improve it; PDF.js and a full ground-truth comparison are still needed.
- **Code/nonregression:** No detector or engine code modified. Existing `node mathreader/tests/results_toc_regression.js` **23/23**, `node mathreader/tests/bibliography_boundary_regression.js` **15/15**, all JS module `node --check`, and assembled JS syntax gate passed. No newly claimed native or production-browser regression: this document-only update leaves **app v344**, detector cache versions, and production behavior unchanged.

### Handwriting-specific open defects / risks (do not count as fully accurate)

| ID | Evidence, expected vs observed | Class and severity | Deferral / next acceptance action |
|---|---|---|---|
| MR-HW-001 | `lecture08-fisherinfo.pdf`, PDF page 1 visibly has `Outline`, `Score function`, `Fisher information`, `Cramér–Rao Lower Bound`, `Examples`. Default local Tesseract PSM 3 returns severely fragmented/misspelled lines; **0/5** short anchors recovered at the exploratory 0.70 threshold. `lecture26-multipletesting.pdf`, PDF page 1 similarly recovers only **1/5** selected anchors under PSM 3. | **CONFIRMED weak handwritten-text OCR recall in the CLI proxy; high user impact for search/Structure; production status UNVERIFIED.** | PSM 11 improves these pages but harms others. Do not silently flip a global PSM value. Build page-level visual transcription ground truth across independent styles, compare multi-pass or layout-aware OCR with false-text safeguards, then run full-index and time/memory gates. |
| MR-HW-002 | `581 Note 7.pdf`, PDF page 1 visibly contains `Electrical Impedance Tomography`, `Calderón problem`, PDEs, Dirichlet boundary problem, and multiple formulas; generic local OCR is weak and the sampled MathReader index returns no labels. | **KNOWN handwritten mathematical transcription weakness; formula fidelity INCOMPLETE/UNVERIFIED**, not automatically a missed numbered equation (many formulas are unnumbered). | Audit all visible text/formula content and identify *actually numbered* targets before changing Equation detection; compare Texify and general OCR locally/in browser. Do not invent numerical labels from unnumbered formulas. |
| MR-HW-003 | 24/97 source-level PDF text-layer quality checks accept existing text for handwriting-heavy statistics notes (e.g. `lecture02-probability.pdf` p1; embedded text visibly loses/merges some handwriting). | **POTENTIAL quality-gate blind spot; UNVERIFIED production behavior.** | Compare the actual PDF.js text layer, on-page visual ground truth, default Tesseract.js and optional local OCR/Texify. Provide explicit quality choice or safe per-document override only if repeatable class-level improvement; avoid silent fallback and avoid unnecessary OCR of good digital PDFs. |

**Interpretation and next steps:** The local OCR engine is generally usable for rough text but has poor handwritten math recognition; downstream conservative filters prevent observed false positives on this sparse corpus but may also miss real headings/results. A 100% handwritten recognition claim would be unsupported. Handwritten improvements are an open workstream; future regression must compare a fuller/rotated corpus, create independently human-annotated ground truth for selected pages, and test production browser workers and fallback behavior before promoting any new algorithm or declaring improved accuracy. Policy-only release: **v344 remains current; next application-code change is v345**.

---

## Mandatory accuracy acceptance, deferral and disclosure policy (effective immediately; doc-only v343 addendum)

**This section supersedes any weaker interpretation of “passed regression” in older entries of this document. It is a permanent release rule.** The v343 source and detector versions have not changed in this documentation-only update.

### Acceptance standard and evidence

1. **Target: 100% detection accuracy on every human-legible printed PDF declared fully verified.** Handwritten mathematics instead follows the explicitly documented best-effort policy above; unverified handwritten content must not be described as fully accurate. Check all actual body items in **Structure, Results, Equations, and Bibliography**, including OCR-origin items, their types, labels, locations/pages, reading/order, and absence of false items (e.g. TOC entries, headers, equation citations, and duplicates). A source must be independently audited against its *visible pages* and a complete ground-truth inventory or equivalent exhaustive review. A successful script, zero exceptions, unchanged inventory counts, spot checks or a match to an earlier detector's output **never prove** 100% content accuracy. Zero detected items is not proof that the document contains zero detectable items.
2. **Any confirmed error on human-legible source remains a known accuracy defect, even when correction is difficult.** For handwritten pages, this does not automatically block unrelated releases, but the affected content must stay marked incomplete or failed under the best-effort policy above. Missing, extra, misclassified, wrongly located, misordered, duplicated, or OCR-damaged detectable content is an accuracy failure. An OCR system's inability to transcribe human-legible text is **not** grounds for an exception. Do not claim 100%, full coverage, “all correct,” or an accuracy pass for an item/document with an open defect.
3. **Deferral is explicitly allowed, not silent acceptance.** When a class-level fix is too risky, poorly understood, expensive, or lacks sufficient negative controls, keep the issue open; do not add a broad fragile heuristic to satisfy one document. Log it in the Markdown defect ledger **inside every release ZIP** (this file, `mathreader/REGRESSION.md`), with a stable issue ID, source PDF and exact pages/items, evidence and reproduction, observed versus expected outcome, general class/root-cause hypothesis, severity/impact, reason for deferral, next corrective approach, and verification needed. If unknown, state *unknown* rather than inventing details. Do not erase or silently close a deferred issue.
4. **Four mutually explicit reporting states.** **PASS — fully verified:** exhaustive visual ground truth and all index/navigation checks match, no unresolved human-legible errors. **FAIL — known defect/deferred:** one or more confirmed errors; documentation and/or nonregression tests may still pass, but *accuracy* does not. **UNVERIFIED:** independent full-document ground truth or production end-to-end execution is incomplete, even if individual controls pass. **EXCEPTION — human-illegible source:** only a genuinely damaged or visually unreadable region, demonstrated with page/region evidence and the excluded scope; it does not cover merely difficult typefaces, scans, mathematics or handwriting that a human can read. Mixed cases must report accurate per-item/per-region status; do not label an entire file PASS because some assertions passed.
5. **Every future class-level change gets a strict before/after audit.** Reproduce a red case, fix the general detector class (never hard-code a filename/page), add positive *and* negative controls, compare exhaustive ground-truth inventories on affected full documents, and rerun diverse historical/native/image-only/OCR corpora for all four indexes and performance/stability. Any new or existing human-legible discrepancy is either fixed and verified or remains a documented FAIL; an unchanged baseline alone is not a sufficient acceptance gate. Manual browser, PDF.js, native OCR engines, and import/export correctness must be checked before claiming corresponding end-to-end status.
6. **Never confuse operational stability with semantic completeness.** “23 PDFs/1,092 pages ran without error” can be a PASS for the **no-crash gate** but is **UNVERIFIED for exhaustive detection accuracy** unless each readable item was separately ground-truthed. Historical numerical summaries and golden comparisons below are retained as evidence of the limited gates actually run, **not certifications** that the examined corpus had 100% recall and precision.
7. **Packaged Markdown—not conversation or memory—is authoritative for project policy.** Before any future MathReader edit/regression, read the current complete authoritative ZIP and all in-package policy/decision Markdown. Every new or revised rule, quality bar, accepted/deferred defect, performance gate, architectural decision, and changed workflow must be persisted inside the next delivered root ZIP (primarily this `REGRESSION.md`, with additional project MD when appropriate). Never rely on a future chat carrying earlier instructions; do not silently drop, weaken, supersede, or hide a policy. Policy-only changes retain the same application version; code changes increment by exactly one.

### Active known failures and unverified coverage inherited by v343

| ID | Source / observed problem | State | Evidence, deferral rationale, and next acceptance action |
|---|---|---|---|
| MR-OPEN-001 | Pisier (1988), scanned author-key bibliography: OCR index returned **4 references** versus **17 in native-text inventory** | **FAIL — deferred** | Human-readable bibliographic entries are not all recovered through scanned OCR; author keys are badly segmented. Broadly accepting corrupted keys risks invented references. Verify each visually readable bibliography item, characterize key grammar across independent older works, develop sequence/layout safeguards and rerun complete positive/negative regression. Exact per-entry pages/IDs need further auditing. |
| MR-OPEN-002 | Gromov (1967), scanned equation index incomplete compared with the native/image-assisted inventory | **FAIL — deferred** | Native detector historically indexed **15** equations; image-assisted reference inventory had **16** (including visible `(10)`); the OCR route was reported incomplete. Need exhaustive visual reconciliation, a general old-margin label-recovery strategy with no spurious labels, and full scan recheck. Do not call OCR accuracy fully verified. |
| MR-OPEN-003 | Caffarelli (1989), historical scan: OCR misses some **Equations** and **Results** relative to native/visible content | **FAIL — deferred** | Previous OCR test reported **50 equations, 16 Results, 10 references**, but this did not establish completeness. Identify each readable omission and its page, determine OCR segmentation versus detector cause, fix at the class level with adversarial tests, then verify all pages/items. Exact missing-item inventory is currently **not established**. |
| MR-OPEN-004 | Handwritten inverse-problems notes (`581 Note 7.pdf`), weak OCR/transcription | **FAIL if readable content is mistranscribed; completeness UNVERIFIED** | Earlier `0 / 0 / 0` downstream indexes and poor transcription are not proof of accurate OCR; legible handwriting is not an exception. Produce human-checked page-level transcription and identify actual detectable headings/results/equation numbers/references before judging downstream recall; fix any confirmed misses or log explicitly. |
| MR-VERIFY-005 | v343 Ahlfors 171-page book and 22 unchanged native corpus items | **UNVERIFIED for 100% content accuracy** | Targeted TOC regressions and source-level comparisons passed, but exhaustive manual/independent truth verification of every item in every file was **not performed**. Audit all pages and all four index families before claiming fully verified PASS. The repaired TOC false positives are not reopened by this status. |
| MR-VERIFY-006 | Browser PDF.js, production Tesseract.js/Texify, WebGPU→CPU behavior, index persistence/import after v343 | **UNVERIFIED end-to-end** | Previous tests used projected native lines and CLI OCR rather than the deployed browser pipeline. Check actual browser workflows on full old-PDF scans, error handling, caching and order after reload, including manually customized indexes. |

**Disposition rule:** A deferred defect remains **OPEN / FAIL** until a verified class-level correction, or explicit evidence that the *particular source region* is human-illegible. Continue to include the open-defect ledger in every subsequent package and record new failures as they are discovered. The historical record below is not retroactively reinterpreted as an accuracy certification.

---

## v344 current stability, reliability and accuracy regression — 2026-11-04 (Beijing UTC+08)

### Scope and status — never equate a detector run with complete content correctness

**Starting point:** the user's v339 source ZIP plus successive v340, v341, v342, v343 overlays **and the v343 accuracy/deferral policy-only overlay**. The source was reconstructed and checked before testing; this is **v343 → v344**, exactly one code-version increment. The current regression adds eight distinct PDFs to the previous 23-PDF native corpus; the regression PDFs themselves are *not* part of the release patch.

| Gate | Tested / observed | Acceptance state and limits |
|---|---|---|
| Native PDF line geometry → actual Results + Bibliography builder | **31 byte-distinct PDFs, 1,552 pages, 31/31 without exceptions**; 23 previously tested inventories identical to prior v343 source run | **PASS for source-level no-crash/nonregression only; UNVERIFIED semantic accuracy** (PyMuPDF → PDF.js-like adapter) |
| Native PDF geometry → actual Equation index | **31/31 without exceptions; 1,520 indexed distinct labels** | **PASS for source-level no-crash; UNVERIFIED exhaustive precision/recall and production image assist** |
| Native PDF span/font geometry → actual inferred Structure | **31/31 without exceptions; 526 outline entries** | **PASS for source-level no-crash; UNVERIFIED complete heading accuracy** |
| v344 vs v343 source indexes | **31/31 Results and Bibliography item inventories exactly unchanged** (including pages/ratios); **31/31 native equation inventories unchanged** | **PASS for intended source-level nonregression**, not independent accuracy |
| Historical/full-scanned local OCR rotation | **89 rendered/OCRed pages**, five complete documents (19 + 10 + 18 + 27 + 3 = 77) and 12 selected Ahlfors pages; **0 OCR process failures** | **FAIL for documented readable-content omissions below; production OCR/PDF.js UNVERIFIED** |
| Existing TOC Results class test | **23/23 passed** | Source-level gate only |
| New boundary-reference class test | **15/15 passed** (red reproduction failed on v343, then green on v344) | Source-level gate only |
| Performance (one local run each, not statistical benchmarks) | Native Results+Bibliography v344 **2.12 s**, peak RSS ~257 MB; native Outline **6.34 s**, peak RSS ~441 MB; concurrent 89-page OCR **27.53 s wall**, Tesseract word-recognition work ~102 s sum | No regression timeout; **not** a browser/production Texify speed claim |
| Deployed browser/PDF.js, WebGPU→CPU, formula Texify, user edits/import/export | **Not executed** in this environment | **UNVERIFIED**, release acceptance cannot claim production end-to-end PASS |

The eight files newly rotated relative to the prior native 23-PDF set were `A_Geometric_Approach_to_Integration.pdf` (applied multivariable mathematics), `Computation_VS_Dark.pdf` (computation), `Marques2005.pdf` and `brendle_marques2009.pdf` (geometric analysis controls), `Riemann球面上的旋转_Fraljimetry.pdf` (complex analysis), `geometric_measure_theory_split_pages.pdf` (measure theory), `lean_quintessential_examples_collection_overleaf_pdflatex.pdf` (formal proof), and `无穷的历史.pdf` (history/exposition). Older full-scan OCR controls cover Schoen 1983, Gromov 1967, Pisier 1988, Caffarelli 1989 and handwritten notes. **This is not yet a sufficient fresh historical/non-geometric corpus for complete accuracy certification:** future campaigns should add historical logic, number theory, probability, information theory, numerical analysis and mathematical physics originals when their PDF bytes are available. New public historical files located online but not downloaded into this sandbox are **not** counted.

### Confirmed general defect fixed in v344 — first numbered bibliography marker damaged as `{i}`

- **Red reproduction:** Gromov (1967), PDF page **9**, starts its visibly numbered bibliography with `[1]`, but a fresh, legible **2.1× Tesseract 5.5** OCR pass read `{i} J. F. Adams, Vector fields on spheres, Ann. of Math. ...`. The v343 bibliography source indexed **[2]–[9] only (8/9)**. This was an unhandled boundary case of the general OCR-key damage class, not a title-specific exception.
- **Root cause:** `malformedNumericBibliographyCandidate()` retained the damaged bracketed one-glyph token for sequence recovery, but `recoverSingleGapBibliographyCandidates()` only recovered *interior* keys between two surviving numbers and never the **leading** key.
- **General repair:** an OCR-only candidate containing a single numeric-confusable vertical stroke (`i/l/I/|`) in brackets can become `[1]` **only** with a confirmed immediate `[2]`, `[3]`, `[4]` series, **exactly one** candidate before `[2]` on that same page within a narrow vertical/left-margin band, an independently strong reference body, and no existing `[1]`. No filename/page number appears in the detector; author keys and native text are protected. The source preserves explicit `ocrSource` provenance on recovery candidates.
- **Regression:** Tesseract-derived full Gromov bibliography **8 → 9**; exactly `[1]` was added with the observed page anchor. On all **31 native PDFs**, every Results and Bibliography entry was **identical** before/after. On the six OCR datasets, all other Results/Bibliography inventories were unchanged. Fifteen positive/negative tests prevent promotion of native text, author-key `[B]`, ambiguous competing candidates, isolated markers, weak bibliographic bodies, mispositioned/distant lines or under-established sequences.
- **Cache/release:** Structure/Bibliography cache **43 → 44**; equation snapshot version remains **22**; bootstrap/assets **343 → 344**. Portable imported user snapshots and user-edited order remain governed by existing preservation rules. The new test `mathreader/tests/bibliography_boundary_regression.js` is included in the root patch.

### Full-document OCR proxy evidence and strict disposition

All 89 pages were rendered at **2.1×** and passed through local `tesseract 5.5.0 --psm 3`, with OCR word-box geometry sent to the existing MathReader source functions; four worker processes were used. The 12 Ahlfors pages are **samples, not a complete scan**, and should not be compared against the full-book index totals. The Tesseract CLI adapter is not the production Tesseract.js/Texify/WebGPU pipeline.

| File | Full OCR Results / Bibliography | Native comparison / accuracy finding |
|---|---|---|
| Schoen 1983, 19 pages, image-only | **16 Results / 14 references**, includes `[11]` | Targeted known index controls recovered. **Full exhaustive visual correctness UNVERIFIED**, native layer is empty by design |
| Gromov 1967, 10 pages | **13 Results / 9 references** | Bibliography **9/9** after fix; OCR misses visibly present `Lemma 2′` relative to **14** native Results. **FAIL for OCR Results completeness** |
| Caffarelli 1989, 27 pages | **16 Results / 10 references** | Native has **18 Results / 10 references**; OCR misses `Lemma 2.2` and `Corollary 6.2`. **FAIL**, pending visual/segmentation confirmation of exact locations |
| Pisier 1988, 18 pages | **6 Results / 3 references** | Native has **7 Results / 17 references**; `Lemma 2.4` and 14 author-key references are absent from this OCR pass. **FAIL** |
| Handwritten inverse-problems notes, 3 pages | **0 / 0** | Handwriting is human-legible in places, transcription is poor; no 100%-accuracy claim, **UNVERIFIED/possible FAIL** |
| Ahlfors, 12 selected pages | **8 Results / 0 references** | Selected pages include TOC and several body definitions, not the book bibliography; cannot infer complete-book accuracy. **UNVERIFIED** |

**Equation OCR caution:** Running the available source-level equation detector on these 2.1× OCR-line projections produced **zero accepted equation labels** in six datasets despite numerous recognizable OCR tag candidates. This reveals a severe *proxy-path coverage discrepancy* but is **not enough to claim that the deployed browser fails identically**: the adapter does not exercise image-margin retry, Texify, or actual PDF.js/production text/OCR geometry, and its confidence/scale/segmentation differ from prior 3.0× runs. Treat this as **FAIL for the tested OCR-proxy equation gate and UNVERIFIED in production**, not a valid accuracy pass or proof of a specific production bug. Vary DPI/PSM, preserve real bounding-box sizes, compare browser OCR, and only make a general detector change after adequate negative controls.

**Ahlfors equation audit (native path):** The visible printed `(1-4)` on PDF page **13** and `(1-7)` on page **15** are decoded as `0-4)` and `0-7)` in its native text layer and are absent from the **160-item native index**. Separate 2.1× OCR reads both correctly, and the current native image-assist planner independently targets page **13** for `(1-4)` and pages **14–16** for `(1-7)`. Actual posterior OCR acceptance and browser index navigation were **not** executed. **OPEN: native text has readable omissions; final production recovery UNVERIFIED**. Do not automatically synthesize missing labels from numbers alone.

### Active v344 open-failure / verification ledger (carry into every subsequent release)

| ID | State | Evidence / impact / deferral and required follow-up |
|---|---|---|
| MR-OPEN-001 | **FAIL — deferred** | Pisier 1988 pp. 17–18: current 2.1× scanned bibliography **3/17** vs native; author keys mutilated. General grammar for author-keyed old scans needs independent visual truth and negative controls before changing code; prior 3.0× proxy gave 4/17. |
| MR-OPEN-002 | **FAIL proxy / production UNVERIFIED — deferred** | Gromov 1967 OCR equation detection incomplete (2.1× proxy **0 accepted** vs 15 native/16 historical image-assisted reference); OCR scale/geometry/side inference and image retry must be isolated. Human-legible equations cannot be exempted. |
| MR-OPEN-003 | **FAIL — deferred** | Caffarelli 1989: `Lemma 2.2`, `Corollary 6.2` absent in Results OCR; equation OCR proxy also deficient. Need page-by-page visual anchors, segmentation comparisons and class-level safeguards; no broad speculative heuristic. |
| MR-OPEN-004 | **UNVERIFIED / possible FAIL — deferred** | Handwritten `581 Note 7.pdf`: OCR poor despite human-legible symbols; obtain independent line/page ground truth and test native Texify before asserting accuracy. |
| MR-OPEN-007 | **Native-path FAIL / production UNVERIFIED — deferred** | Ahlfors pp. 13,15: `0-4)`/`0-7)` native corruption vs printed `(1-4)`/`(1-7)`. Image OCR could recover them but production integration untested; never auto-invent numbering. |
| MR-OPEN-008 | **FAIL proxy / production UNVERIFIED — deferred** | Gromov OCR Results `Lemma 2′` absent. A simplified OCR Structure adapter also failed to recover all historic `§` headings; that adapter lacks original line-height and production style data, so Structure needs a correct-geometry run and visual reconciliation before attribution. |
| MR-VERIFY-005 | **UNVERIFIED** | All 31 native documents (1,552 pages) lack exhaustive independent visual item-by-item ground truth for Structure, Results, Equations, Bibliography. Unchanged counts are *not* certifications. |
| MR-VERIFY-006 | **UNVERIFIED** | Deployed browser PDF.js/Tesseract.js/Texify/ WebGPU→CPU, reading-data export/import, user-adjusted order, full cache recovery and navigation anchors were not executed in this run. |
| MR-VERIFY-009 | **UNVERIFIED / quality risk** | Historical OCR performance varies with render scale and source geometry; a one-run wall time and one PSM cannot support broad performance/accuracy guarantees. Reproduce in the production engine, retain measured samples and add automatic truth checks before closing. |

**Deferral is not an acceptance exception.** A human-readable omission or false detection remains a documented FAIL until fixed and independently verified; only a visually demonstrated human-illegible region may receive the narrow EXCEPTION state. If a release contains known failures, describe exactly which test gates pass, never claim full content accuracy. **Files, not chat summaries, govern future maintenance**: every future policy and defect update must appear in the packaged Markdown file(s).

### Reproducible gates and root ZIP contents

Run from a workspace with the latest full baseline and this root patch overlaid:

```bash
node mathreader/tests/results_toc_regression.js
node mathreader/tests/bibliography_boundary_regression.js
node --check mathreader/mathreader.js
# Also syntax-check mathreader/js/*.js, concatenate the 10 declared parts in order
# and run node --check on that assembled runtime.
# Validate the ZIP CRC, changed paths, app version=344, index cache=44,
# and index.html ?v=344 cache keys. The PDF/OCR regression inputs
# are external fixtures and are NOT bundled into the root code patch.
```

Exactly six changed/added files: `mathreader/REGRESSION.md`, `mathreader/index.html`, `mathreader/js/00-core.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/mathreader.js`, `mathreader/tests/bibliography_boundary_regression.js`. All unchanged MathReader modules and existing tests stay at their v343 content. The next code change must be **v345**; policy-only documentation can be distributed without changing v344.

---

## Standing maintenance policy — required for every future MathReader change

These are **permanent instructions**, not just a one-time v343 test checklist. Retain this section in future revisions of `REGRESSION.md` and update the evidence below instead of replacing the historical record.

1. **Treat every reported miss, false positive, wrong order, or crash as evidence of a possible *defect class*.** Reproduce it against the exact user-supplied PDF and the current authoritative ZIP, investigate the parser, layout/OCR, sequencing, caching, and persistence pipeline, and identify a principled general cause. Never add filename-, author-, title-, or page-number-specific detection exceptions just to pass a fixture. A single case does not by itself justify a broad heuristic: require independent structural evidence and negative controls.
2. **Conservative semantics and controlled scope.** Correct the smallest general class that is demonstrably broken. Maintain all existing intentional behaviors, including local-first execution, existing OCR WebGPU → CPU fallback, human-adjusted ordering, imported portable data, and established indexing behavior. Avoid new hidden fallbacks. Do not promote a contents listing, index, equation reference, running header, or citation into a main-text Result/Equation/Reference merely because its text resembles a valid label.
3. **Regression is mandatory with every class fix.** Start with a red reproduction, add permanent positive and adversarial negative tests, and run both old goldens and a deliberately varied *byte-distinct* real-PDF corpus across native text and image-only/image-heavy/OCR. Cover **Structure, Results, Equations, Bibliography** together and watch for interactions: false early entries can suppress genuine later entries through deduplication, sequencing or caches. Track false negatives as well as false positives, equation order and page/ratio anchors, export/import/state survival, and runtime/timeout/resource behavior. Test degraded pre-21st-century scans; rotate across number theory, algebra, logic, probability/statistics, analysis/PDE, computer science, information theory, numerical/applied math and physics rather than letting geometry dominate. Record which papers are repeats vs new.
4. **Evidence must be auditable, not optimistic.** Record exact source baseline/version, changed files, gate commands, PDF/page counts, measured changes, OCR engine and settings, timings and major constraints. Keep distinct (a) source-level synthetic unit tests, (b) native PDF → PDF.js-like projected integration, (c) OCR proxy, and (d) actual browser/PDF.js/Tesseract.js/Texify/WebGPU checks. Never claim an unrun gate as passed; keep unresolved defects, suspicious edge cases, possible new false positives and required manual checks explicit, so future regression campaigns revisit them.
5. **Delivery and cache discipline.** Increment exactly one version for each code change, deliver a **root `mathreader/` ZIP patch** containing only changed files, run JS syntax + assembled-runtime + ZIP integrity gates, bump relevant detector cache version(s) when indexed output semantics change, and never silently overwrite intentionally imported user snapshots. Preserve historical regression notes and maintain reusable executable tests when feasible.

## v343: TOC entries falsely become mathematical Results (class-level fix)

**Confirmed original report:** In Lars V. Ahlfors, *Conformal Invariants*, the TOC on PDF page **4** contains `4-1. Definition of extremal length ... 50`; the continuation on PDF page **6** contains `9-1. Definition and examples ... 125`. v342 treated these navigation headings as `Definition 4-1` / `Definition 9-1` at the *TOC pages*. The real labelled declarations occur on **PDF page 62** (`Definition 4-1`) and **PDF page 136** (`Definition 9-1`). This was not merely extra display noise: `normalizeSequentialStructureEntries()` deduplicated and enforced per-type monotonic numbers using the premature `Definition 9-1`, suppressing the genuine `Definition 1-1`, `2-1`, `4-2`, and `4-3`, as well as replacing genuine `4-1` and `9-1` anchors with the TOC anchors. The result index was incomplete and navigated to incorrect pages.

**General cause:** The Results builder directly applied `detectedStructureResult()` to each extracted visual line, whereas the Outline detector had separate TOC awareness. Number-first section-title rows containing a mathematical result keyword (e.g. `4-1. Definition...`) were treated as declarations. Later sequence filtering made the false positives causal rather than harmless.

**Conservative source change:**

- `tocResultLineIndices()` recognizes navigation *rows*, not whole pages: it requires aligned folios and either a Contents heading with multiple matching rows, or substantial repeated hierarchical subsection rows in the early-page window for a continuation with a missing/degraded heading. A substantive-title guard protects against early numerical tables. A single candidate or a Contents heading alone never excludes a Result.
- The Results builder skips qualified TOC lines **before** declaration parsing, proof attachment, deduplication and numeric sequence validation, allowing later genuine entries to survive. Normal body declarations on a page with a short TOC remain eligible.
- `structureResultLooksLikeNumberedSectionTitle()` independently rejects uppercase subsection titles of the narrow `4-1 DEFINITION OF ...` / `9-1 DEFINITION AND ...` class, which occur in the actual chapter text ahead of an explicit `Definition 4-1 ...` declaration. This is based on heading grammar, not book identity or a hard-coded label.
- `STRUCTURE_INDEX_VERSION` **42 → 43** so ordinary cached Results/Bibliography indexes refresh; equation summary version remains 22. App and asset versions **342 → 343**. Portable imported detector data are not silently rewritten; manually rebuild their indexes when upgrading.

### v343 test evidence and exact observed change

| Gate | Outcome | Meaning |
|---|---|---|
| Full Results/Bibliography source-function integration | **23 byte-distinct PDFs / 1,092 pages / no exceptions** | Same baseline native corpus used in v342; runs the real `buildStructureIndex()` on PyMuPDF → PDF.js-like line objects in Node VM, separately for v342 and v343 |
| Exact downstream nonregression comparison | **22 PDFs unchanged item-for-item**; only Ahlfors differs | No new Results/Bibliography changes outside the confirmed class; all 23 Bibliography inventories unchanged |
| Ahlfors actual Result changes | **91 → 95** indexed Results | Two false locations removed and six genuine locations restored: `Definition 1-1` p24, `2-1` p36, `4-1` p62, `4-2` p68, `4-3` p69, `9-1` p136. Net **+4**, because two false TOC entries previously displaced six valid items |
| Class-level executable assertions | **23 / 23 passed** | `node mathreader/tests/results_toc_regression.js`; contents with folios, damaged continuation headings, title-vs-declaration, same-page body, no-header controls, numeric-data tables, isolated rows, OCR/no-span variants, and sequence/dedup behavior |
| Real OCR rotation focused on TOC and body | **10 image-rendered pages / 10 completed** | Ahlfors PDF pages 4,5,6,24,36,61,62,68,69,136 through 2.1× rendered images → Tesseract 5.5 CLI (`--psm 3`, `OMP_THREAD_LIMIT=1`), then MathReader source Result parsing. Zero false TOC Results in these OCR outputs; genuine `Definition 1-1`, `2-1`, `4-1`, `4-2`, `4-3`, `9-1` still appear. Some OCR TOC titles are split across lines: this only confirms *no index pollution*, not perfect OCR recognition |
| Approximate parser throughput | v342 **1.58 s** vs v343 **1.52 s** | One local 23-document Node VM integration pass each, same host; peak resident memory ~203 MB vs ~204 MB. One-shot diagnostic, **not** a statistically meaningful performance claim or browser benchmark |
| Unchanged systems | 40-outline-structure.js, Equation detection, OCR engine, export/import logic not edited | Syntax/build gates below; no claim of full fresh browser or production OCR pipeline regression |

**Important interpretation:** The user reported two *extra* Results, but the correct post-fix count increases from 91 to 95 in this test adapter because genuine body definitions that were previously suppressed become available. Counts alone are not quality measures: the **correct locations and identities** matter. Actual PDF page numbers above are 1-based PDF pages, not printed-book page numbers.

### v343 unresolved exceptions, manual checks and possible regressions

1. **Real browser/PDF.js and production OCR engines not executed in this patch environment.** The native corpus uses a PyMuPDF geometric projection into MathReader functions; the OCR rotation uses Tesseract CLI, not browser Tesseract.js/Texify, nor WebGPU/CPU fallback. A browser acceptance run should open Ahlfors, rebuild Results, check `Definition 1-1`, `2-1`, `4-1`–`4-3`, `9-1`, `9-2`, `10-1`, and verify jumps to body statements rather than contents or chapter headings. Check persistence after reload and imported portable snapshots separately.
2. **Conservative TOC recall:** A table of contents with destroyed/missing page folios, extracted one-word-only lines, no Contents header *and* too few hierarchical rows will not be auto-classified. An isolated true Definition directly under a contents list is protected from blanket-page rejection. A future corpus may expose other TOC syntaxes (dot leaders, two columns, roman numeral pages, author-index listings, unnumbered result lists) which should be addressed only with validated class-level evidence and negative cases.
3. **Possible TOC false positives:** Repeated early technical tables can have aligned numeric last columns. v343 requires a page header or strong hierarchical-title profile, but a table with multiple title-like subsection rows could still resemble a TOC. Treat this as an explicit open risk; avoid broadening TOC filtering to an entire page.
4. **Existing v342 unresolved OCR completeness issues remain:** Pisier author-key references (4/17 OCR-vs-native), Gromov OCR equations, Caffarelli OCR Results/Equations, and handwritten transcription quality are not fixed by v343. The earlier regression details below remain authoritative. Do not report these as passes or reclassify them as resolved.
5. **Coverage rotation:** 23-native-PDF set is the same corpus as v342 (not 23 newly sourced papers). The Ahlfors 10-page OCR rotation is newly performed. Future campaigns should include fresh mathematical disciplines/eras, full-document old scans, OCR performance measurements, import/export and browser stress alongside these permanent cases.

### v343 reproducible local validation

From a workspace containing the complete v342 baseline with v343 root ZIP patch overlaid:

```bash
node mathreader/tests/results_toc_regression.js
node --check mathreader/mathreader.js
node --check mathreader/js/00-core.js
node --check mathreader/js/41-equations-bibliography.js
# Also syntax-check every other mathreader/js/*.js and the assembled module;
# validate the root ZIP's CRC, exact changed-file list and version synchronization.
```

The full 23-PDF and real OCR integration corpora are documented as external source fixtures and **are not embedded** in the distributable ZIP. The self-contained 23-assertion Node test is included in the patch; repeating the full real-PDF tests requires the original source PDFs. There is no claim that this test file alone establishes end-to-end production correctness.

### v343 release files and gates

**Root ZIP patch:** `mathreader_v343_patch.zip` (root directory is `mathreader/`), containing exactly six files:

```text
mathreader/REGRESSION.md
mathreader/index.html
mathreader/js/00-core.js
mathreader/js/41-equations-bibliography.js
mathreader/mathreader.js
mathreader/tests/results_toc_regression.js
```

**Checks:** Node syntax for all JavaScript source files, the concatenated runtime, and the new test; version synchronization `343` in bootstrap/assets and Structure cache `43`; exact diff versus fully reconstituted v342 baseline; ZIP entry paths, CRC/integrity and six-file containment. These are packaging/source gates, not live browser acceptance.

---

## Archived v342 regression (historical record preserved verbatim)

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
