# MathReader v402 — Equation-margin evidence and leading appendix-label recovery

**Baseline:** authoritative uploaded v401 full source package. This is a minimal v401 → v402 patch, not a replacement. Date: 2026-11-07 (Beijing UTC+08).

## Reproduced faults and class-level correction

1. **Manual meticulous page OCR was not persisted as raw margin evidence.** The v401 IndexedDB commit was wired to `supplementEquationIndexFromPageImages()` only. `meticulousEquationMarginEvidence()` called the same image recognition helper but did not retain its observed `lines` in `equationSupplementalOcrCache` or write them to the versioned margin-evidence cache. A successful user-invoked recheck could therefore add an Equation row while leaving the next full-text export without that recheck's underlying observations. v402 records the measured raw margin lines under the *exact current PDF key + side + page*, persists them once the page OCR completes, and checks document object/key before and after the async write. Failed or late foreign-document OCR cannot publish records. This does not change any OCR worker selection, heading/Result/bibliography classifier, auto-navigation, or export options.

2. **The first printed appendix equation could not enter the bounded gap plan.** On the original 253-page Giusti PDF, page 231 visibly has a mathematical display `(A.1)` above `(A.2)` and `(A.3)`. The native PDF text layer omitted `(A.1)`, even though it preserved `(A.2)` and `(A.3)` and garbled one separate prose citation as `(A.l)`. The real saved index additionally contains `(A.4)` and `(A.5)` on page 233; nevertheless, `equationNativeImageGapPlan()` chose 24 other pages and **excluded page 231**. Its existing first-number recovery required at least five labels if the family started at `.2`, whereas this corroborated appendix family had four.

   v402 considers a **leading** missing appendix `.1` only when at least four distinct *native* labels in the same sequence family survive, the first two are `.2` and `.3`, and those two appear on the same original page. It schedules an image-OCR **query** for the corresponding `.1` on that page. The existing 24-page native gap and 12-page proof-reference budgets remain intact; at most four *additional* pages are authorized for this class. No sequence gap is published as an equation unless the exact printed margin tag is actually read and accepted by the existing geometric/semantic checks. Different numbering separators, OCR-only anchors, short families, and already-indexed labels do not create a new leading query.

## Original-document evidence (not reconstructed test PDFs)

| Document | Original SHA-256 | Inspection | Result |
|---|---|---|---|
| Giusti, *Minimal Surfaces and Functions of Bounded Variation* (1984), 253 PDF pages | `d9799feeb8d2093e205c914ad8fabb0e7e21157270d8cd4fe77210ac58895725` | Visually inspected original PDF p231; source-native text shows `(A.2)`, `(A.3)` but drops `(A.1)`; offline **Tesseract** on a real left-margin crop reads `(A.1)`. Replayed the actual saved Equation rows into `equationNativeImageGapPlan`. | v401 planner omitted p231; v402 planner includes p231 as an `(A.1)` **query**. Not yet verified as a *published* label by production PDF.js/Tesseract.js. |
| Ahlfors, *Conformal Invariants*, 172 PDF pages | `970cda290270daa397d0bd5a06da4e423bb548d1556e71c1135f54fd637ac949` | Original p81 includes printed right-margin `(4-12)` at source-PDF y ratio ≈0.557; offline Tesseract of the real right-margin image recognizes `(4-12)`. | Supplies an independently observed margin text/approximate coordinate for a Chromium **source-function simulation**; not browser OCR or export-from-original. |

The older Giusti user export inspected for this investigation had 253 native page records and an existing index including `(A.2)`–`(A.5)` but no `(A.1)`; its export schema **predates** the v401 margin-coverage field. It is not a newly generated v402 export and must not be represented as one. Historical visual-truth fixture `regression/historical_visual_equation_truth_v394.json` separately records Giusti p231 `(A.1)` at approximately 0.28 page height.

## Executed verification

- New failing-before/working-after JavaScript test `tests/appendix_leading_equation_v402_regression.js`: **15 assertions passed** after change. It includes actual source-p231/native-export label values, no fabricated label, short-family/previous-label/other-page/OCR-only negative controls, and a dynamic manual OCR storage + late-document-change simulation. On v401 its first missing-page assertion fails.
- Re-executed entire **46/46 JavaScript** test inventory under the final v402 source, all passed. Includes existing OCR cancellation, navigation, appendix Results/equations, native PDF evidence, raw exports, formula syntax, bibliography and UI source tests. Final suite summary: `regression/v402_js_gate.json`.
- **20/20 distinct Python/Chromium** scripts passed across a sequential run and isolated retry. First aggregate pass: 19 passed, one (`p1_browser_smoke.py`) failed intermittently at a simulated local-link context-menu check; immediate isolated rerun **passed 36 assertions**. This is not claimed as a single clean aggregate. The five initial JavaScript failures in the first pass were stale expected-version checks plus an older isolated OCR test harness missing the current v396 cleanup functions; test assertions/harness corrected, production document OCR code unchanged.
- `tests/equation_margin_export_browser_v402.py`: **6 Chromium assertions passed**, executing the actual v402 persistence and full-text export functions against a clearly declared *in-memory storage/PDF.js mock*; verifies exported text/geometry, simulated reopen, same-page-count other-PDF isolation, partial rescan merge, corruption rejection and Forget. It is **not** a production IndexedDB or production PDF test.
- Optional `regression_tools/equation_margin_indexeddb_browser_v402.py` attempts a real Chromium IndexedDB origin/reload test using original Ahlfors SHA/page count and app cache/export functions. **BLOCKED here:** administrator-controlled Chromium rejects navigations to local HTTP, local files, and mock HTTPS origins with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. This script was attempted and did not pass; run from a browser environment with allowed local origins and then separately test production PDF.js/Tesseract.js.
- Bounded Node/structuredClone synthetic cache benchmark (49 pages × 8 fabricated observations = 392 lines): JSON payload **50,208 bytes**, clone/write **5.8 ms**, restore **5.71 ms**, post-GC heap delta **132,056 bytes**. The numbers are one local synthetic measurement, **not** real IndexedDB, actual Tesseract, or production-browser performance. Raw payload cap remains 6,000,000 characters (the code uses string length), not a tested per-browser quota guarantee.
- HTML/part syntax and patch replay are separately recorded in `regression/v402_release_gate.json`.

## Must remain OPEN / not certified

1. A full **live production** Ahlfors PDF.js + Tesseract.js -> completed equation-margin OCR -> both export options enabled -> exported raw observations/coordinates -> same PDF reopened -> export with no OCR -> identity isolation -> partial/interrupted scans, corrupted cache, PDF Forget and browser performance. No live production-browser claim is made here; a source-function simulation is not equivalent.
2. Source text on scanned Giusti p231 is missing `(A.1)`; the v402 *scan query* is correct, but **successful production OCR publication and exact navigation are unverified**. The other known appendix and historical text-layer misses remain subject to image-ground-truth testing.
3. An image scan interrupted by switching PDFs **before the end-of-pass persistence commit** can still lose unsaved observations from that interrupted pass. Previously persisted page records are preserved. This is not silently reported as solved.
4. Full-text image transcription, Texify formula-to-LaTeX faithfulness, real navigation against all PDF pages, independently reviewed 50-book accuracy, and best-effort handwriting performance are not certified by these tests. OCR process completion and source text extraction do not establish correctness.
5. Browser-specific IndexedDB quota, storage eviction, asynchronous Forget/commit ordering, and sustained hundreds-page memory overhead need genuine interactive testing. Old v400/v401 exports that already lost raw margin observations cannot reconstruct them from the final Equation index.

## Manual reproduction commands

From the project root, with original PDFs and Tesseract available locally:

```
node mathreader/tests/appendix_leading_equation_v402_regression.js
node mathreader/tests/equation_margin_persistence_v401_regression.js
python mathreader/tests/equation_margin_export_browser_v402.py
MATHREADER_AHLFORS_PDF=/path/to/Ahlfors.pdf python mathreader/regression_tools/equation_margin_indexeddb_browser_v402.py
```

The final command only verifies actual browser IndexedDB persistence of *source-function test observations*, not production OCR. For production acceptance, separately open the original 172-page Ahlfors PDF on the live website, complete targeted OCR, export with both options checked, verify nonempty `fullDocumentText.pages[].equationMarginOcr`, reopen, export again without OCR and compare each text+coordinate record. The `Eq OCR 28/49` progress line refers to selected OCR pages, **not** 49/172 of PDF text read.
