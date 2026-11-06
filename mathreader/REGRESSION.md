## v374 — Compatibility, multi-PDF concurrency and performance audit (2026-11-06, Beijing UTC+08)

**Baseline:** applied v373 source plus the full v373 History-only lazy-opening implementation. This release preserves its History-only design, first-file-only eager load, other Files unparsed until click, no horizontal tabs, no automatic OCR of pending PDFs, one PDF.js document rendered, and all current user reading preferences.

**Confirmed defect fixed — concurrent document opens:** v373 blocked simultaneous clicks on pending PDF entries, but native picker reads and cached History reopens could still execute concurrently across separate entry points. This could overlap `flushCurrentDocumentSession`, `pdfDoc.destroy()`, `pdfDoc` reassignment, IndexedDB last-document writes and rendering. A shared `documentOpenBusy` gate now excludes overlapping `openPdfFile()` and `openCachedDocument()` operations *before* file reading or IndexedDB fetch. It is released in `finally`, including failed reads/failed cached records. Existing P1 navigation awaits open completion and remains sequential; a conflicting user attempt is rejected, not queued or silently auto-opened.

**Confirmed defect fixed — incorrect successful return:** `openPdfFile()` previously caught file read/hash/engine errors or downstream `openPdfSource` errors without propagating failure. `activatePendingPdf()` therefore returned `true` even when the PDF was not actually opened. `openPdfFile()` now returns `true` only on successful completion, `false` on an error, while retaining the pending entry for explicit retry and existing user-visible error handling.

**Confirmed test drift corrected:** `ui_responsive_regression.py` asserted full-width desktop reader when left/right panels were closed by default, incompatible with the approved v366 default-open behavior. It now tests usable reader width and round-trip restoration of the starting width instead. The OCR/equation tests' literal v373 cache-key assertions advance with v374.

**Verification:** 18 JS regression files including new concurrency/failure assertion tests; JS parser checks of 10 modules/bootstrap/tests; 176/176 Chromium responsive shell assertions across 320–1440px; Help/manual browser suite 130/130; 879 LaTeX checks and 228 MathJax compilation tests; 1204 layout/performance parity assertions. These are isolated/source-level and shell-browser tests, NOT full original-PDF/OCR acceptance. Exact execution log is summarized in `regression/v374_compat_performance_audit.json`.

**Unresolved / unverified:** Real PDF.js switching from a scanned PDF while the previous document OCR is active; real IndexedDB write durability and quota exceptions; 100+MB byte-array read, digest and memory peaks; history list DOM growth for hundreds of pending Files; side effects of excluding simultaneous P1/user open requests; Safari and Firefox compatibility; performance of rasterized continuous scroll and full-document Texify OCR; absence of full production-browser ground-truth certification. No silent fallbacks, no detection/recognition changes, and no optimistic P0 status. The older Schoen [11] original-page browser OCR is likewise still unverified.

---

# v371 — Scanned bibliography damaged marker recovery (Beijing UTC+08, 2026-11-06)

**User-reported recurrence:** Schoen, *Uniqueness, Symmetry, and Embeddedness of Minimal Surfaces*, 19-page image-only scan, PDF page 19: printed bibliography `[11]` follows `[10]` and precedes `[12]` but is missing in the user's MathReader. This same example was previously claimed recovered by a local Tesseract proxy in earlier regressions; those claims did not establish production browser completeness. The present upload has **no PDF text layer** (`pdftotext` returns no content). Its last-page raster, independently inspected, visibly contains `[11]`, an Osserman entry beginning “Global properties of minimal surfaces ...”, *Ann. of Math.* 80 (1964), pp. 340–364. Local Tesseract `--psm 6` at 215 DPI reads the prefix as `{lj ,` (with `j` and lost closing delimiter), a shape absent from the old provisional-key parser. Production Tesseract.js hOCR line segmentation may differ and has **not** been captured.

**Minimal class-level fix:** `malformedNumericBibliographyCandidate` now retains OCR-only left-margin `opening-delimiter + two/three narrow digit/confusable glyphs + comma/semicolon/colon + strong bibliographic body` as provisional evidence. Narrow `j` is allowed only in this punctuation-anchored OCR candidate and never globally substituted. The existing document-order reconciliation promotes it only when a **unique** candidate lies strictly between two real, consecutive-surrounding numeric references (e.g., `[10]`, `[12]` imply exactly one missing number). No synthetic bibliography entry is created solely from a numeric gap or from a body citation. Normal native text and OCR engine selection are unchanged.

**Validation:** 25/25 bibliography-boundary assertions, including `{lj ,` recovery and weak-body, native-text, center-position, wrong-neighbor, malformed-punctuation, and ambiguous-double-candidate negatives. All **16/16** JS regression suites passed, as did syntax checking. `STRUCTURE_INDEX_VERSION 45→46` forces ordinary saved Structure/Bibliography detection summaries to rebuild without clearing user annotations or OCR cache. Reader package version `370→371`. The PDF itself and independent raster OCR are *observational ground truth*, not a browser production test. **Still UNVERIFIED:** actual Tesseract.js page-19 output/geometry, full-document OCR completion, persistence/imported snapshots, cross-disciplinary corpus recall and OCR accuracy. User should complete full-document OCR and rebuild indexes on the affected PDF, then verify `[10]`, `[11]`, `[12]` as separate rows. If still missing, capture actual browser OCR record for page 19 rather than stacking more guesses. This is not P0 certification.

---

## v368 — Reader-facing manual copy edit (2026-11-06, Beijing UTC+08)

**Scope:** Bilingual `tutorial.html` prose only, plus v368 cache/version metadata, updated regression assertions, and this audit record. No changes to the PDF parser, mathematical detectors, OCR engine, navigation, storage, or actual interaction semantics.

**Editorial policy:** The guide addresses what the reader can do and how to do it. Remove internal milestone labels (P0/P1), stale release history, redundant negative explanations (e.g. the top-right `?` is “not” the PDF-open command), and over-technical implementation caveats. Preserve meaningful limitations (OCR reliability, browser storage, actual PDF-link behavior), real command labels, bilingual parity, and accessible markup. The Help icon description is concise and functional. Link-to-PDF instructions use a simple step sequence instead of implementation-oriented discussion. Also update “Export reading data” to the current “Export” label.

**Regression requirement:** `tests/manual_version_regression.js` now guards against release/milestone labels in the manual, redundant Help icon phrasing, and missing key user-facing descriptions. Exercise the guide in English and Chinese, light and dark themes, small and large screens, and check every link and keyboard instruction against an actual current UI before promoting these browser checks to PASS. Source assertions alone cannot verify all control labels or browser behavior.

**Open verification risks:** Original-pinned PDF.js, Texify, large-PDF performance, full-document OCR/semantic truth, and full browser persistence are outside the manual-only change and remain at their previous UNVERIFIED/BLOCKED states. Existing operational documentation must continue to retain those historical audit records; simplifying the *user-facing* manual must not erase developer regression obligations.

---

# MathReader Regression / Behavioral Audit Record — v367

## v367 — Remove version label from the user guide (Beijing UTC+08, 2026-11-06)

**Baseline:** complete v363 source with applied v364, v365, and v366 patches. **Release:** v366 → v367.

- Remove the stale `v362` badge from the standalone English/Chinese tutorial's visible header and footer. The guide is now version-neutral; its substantive instructions and privacy statement are unchanged.
- Bump reader bootstrap and HTML cache keys to v367. No feature, state, annotation, OCR, or indexing logic is modified.
- Manual gate: open Help in English and Chinese, confirm no version number in visible manual header/footer and all guide links/sections work. Live browser/PDF-specific behavior remains unverified unless exercised.

## v365 — 15px Help glyph and targeted broad regression audit (Beijing UTC+08, 2026-11-06)

**Baseline:** supplied complete `mathreader(9).zip` (v363), with previous v364 patch overlaid. **Release:** v364 → v365. User-visible behavior change is limited to reducing the Help `?` glyph **20px → 15px**, while preserving its **34px** button dimensions, 34px mobile override, keyboard focus, accessibility label, and tutorial target. Export continues to be concise. Ten production JS subsystem files are byte-identical to v364; changes to the bootstrap and index are version/cache-key updates only.

### Audit scope and actually executed gates

- Read the full standing regression policy and latest historical findings; examined the ten-module bootstrap, CSS/responsive rules, validation scripts, offline runner, browser harness and risk notes for P0/P1, image-only OCR, formula OCR, indexing, persistent local library, cross-document navigation and memory/performance. Reviewed source by pattern for DOM measurements, event scheduling, external model dependencies, blob URLs, and DOM content injection.
- JS syntax checks of every subsystem, bootstrap, JS test and JS regression tool: PASS; **13/13 Node regression files PASS**, including **879 LaTeX syntax checks and 228 real MathJax compilations**, **1,204 geometric/layout and performance parity assertions**, and source-level bibliographic, Results, indexing/persistence, OCR initialization/failure-path tests. `formula_ocr_initialization_regression.js` logs a deliberately exercised simulated timeout but exits successfully.
- Updated real Chromium shell Help/tutorial regression: **130/130 assertions PASS** at 320, 375, 768, 1024 and 1440px; checks measured Help/Theme/Language button heights of 34px, Help glyph computed font size 15px, language, Export, shortcuts and script errors. This is not a real PDF browser test.
- Comprehensive one-command P0 gate and separate responsive Chromium test each **TIMEOUT/INCOMPLETE** in the constrained runtime. Neither is represented as PASS. Real PDF.js 4.10.38, Texify inference and full original-document visual truth were not available in this campaign. P0/P1 end-to-end mathematical accuracy and memory/performance at real document scale remain **UNVERIFIED**.

### Findings, deferred concerns and next verification

1. **No new confirmed application bug fixed during this audit.** The glyph edit is intentionally separate from detector, state or rendering changes. Existing historical known source-level subject-index/glossary `Definition` false-positive and other candidate misclassifications remain tracked; status **KNOWN HISTORICAL / final-browser UNVERIFIED**. Do not implement a global suppression based on a few examples.
2. **Performance concern — large documents and continuous mode (UNVERIFIED at production scale).** Document skeleton metrics require page geometry from PDF.js. Prior bounded DOM scan optimizations have synthetic parity evidence, but browser profiling of PDF.js document loading, memory, very long continuous-mode papers, and rapid navigation is still needed. Do not replace exact metrics with guessed layout without anchor/invariant evidence.
3. **Dependency/availability concern (UNVERIFIED online and offline).** Production loads pinned PDF.js from CDN and lazy OCR dependencies/models from network; network outage, blocked CDN, slow first model initialization and cache eviction need genuine browser evaluation. Intentional WebGPU→CPU fallback stays unchanged. Do not introduce silent alternate engines.
4. **P0 paired detection gap (UNVERIFIED).** Need cross-disciplinary old/new/printed/scanned/handwritten original PDFs, complete document text + Structure/Results/Equations/Bibliography + formula image-to-LaTeX pairings, independent page/crop truth and real Texify browser proof; MathJax compilation alone is not semantic correctness.
5. **P1 durability gap (BLOCKED/UNVERIFIED).** Full two-PDF bibliography link/relink/unlink and return-to-exact-page-ratio scenario through genuine PDF.js/IndexedDB remains outstanding. Existing source-level assertions do not close the gap.
6. **UI responsive retest (INCOMPLETE).** Previous v364 176/176 responsive assertions and 130/130 Help assertions are recorded historically. Only the latter was rerun and passed under v365; responsive suite timing out is not a newly confirmed UI regression. Validate mobile with live Chrome at 320, 375, 520, 768, 860, 861, 1024 and 1440px once runtime allows.

**Conservative decision:** do not make speculative changes for unverified risks. Preserve approved P0/P1 scope; P2/P3/P4 are not authorized. For independent reproduction run `python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir <report-folder>` from the project root and supply the original PDF manifest and pinned PDF.js for real browser acceptance. `regression/v365_audit.json` contains the targeted gate results.

---

## v364 — Compact Help glyph, unchanged 34px control (2026-11-06, Beijing UTC+08)

**Baseline:** user-provided complete v363 ZIP (`mathreader(9).zip`). **Release:** v363 → v364.

- Decrease the header tutorial question-mark glyph from 25px to **20px** without changing its 34px button height, existing min-width, responsive overrides, keyboard focus, title, accessibility label or new-tab destination.
- Preserve the v363 concise **Export** label and full tooltip/accessibility name.
- Update version/cache keys and inherited test assertions. This is a presentation-only change: no PDF/OCR, index, navigation, data export or mathematical semantics modified.
- Scope of verification: automated JavaScript and isolated Chromium shell checks only; full PDF.js/Texify end-to-end mathematical accuracy remains unverified, as documented below.

---

## Historical record — v363

## v363 — Header button height + concise Export label (2026-11-06, Beijing UTC+08)

**Baseline:** original v347 complete source ZIP overlaid sequentially with exact v348–v362 root code patches. **Release:** v362 → v363. This is a presentation-only adjustment to the reader header and History → Local library controls.

- Make the **?** tutorial control exactly 34px tall at desktop, tablet and narrow-phone breakpoints, equal to adjacent theme and language controls; keep its large 25px glyph, accessible label, keyboard focus and new-tab behavior. Previously it was 38px on desktop and 36px on mobile while neighbors were 34px.
- Rename the visible **Export reading data** button to **Export** (Chinese **导出**); retain its descriptive full hover title and accessibility label. Preserve its export action, disabled-state semantics, JSON payload and command-palette name.
- Regression: Chromium shell checks at 320/375/768/1024/1440 widths assert matching header-button heights, unaltered prominent glyph, accessible export label, and both language variants; the inherited entire source gate must still pass. No claims about real PDF.js/Texify inference or actual P1 two-PDF browser navigation are implied by these checks.
- This release does **not** change mathematical detectors, OCR configuration, P0/P1 data semantics, IndexedDB schema or bibliography right-click linking. Full live-engine mathematical acceptance remains outstanding as recorded in prior audits.

---

# MathReader Regression / Behavioral Audit Record — v360

## v360 — Cross-viewport UI, performance and stability regression (2026-11-06, Beijing UTC+08)

**Source:** v359 reconstructed from the original v347 complete ZIP and every sequential code root patch v348→v359; all 61 files match the v359 working tree byte-for-byte before this edit. **Release:** v360; next source-code modification v361. Only UI responsive behavior, related test coverage and cache-busting version were modified. No mathematical detection, PDF processing, formula recognition, lazy OCR, WebGPU→CPU fallback, P1 confirmed-link schema, or index cache schema was changed.

### Confirmed real Chromium responsive defects and fixes

1. **Collapsed desktop grid rule defeated mobile layout.** At widths ≤860px, `.reader-shell.left-collapsed.right-collapsed` had higher specificity than the existing mobile `.reader-shell` override. The reading stage occupied only ~330–356px instead of the phone/tablet width, leaving an apparently empty page strip. The mobile rule now explicitly overrides each collapsed combination and uses a single full-width track.
2. **Mobile sidebars were keyboard-only.** L/R could open Contents/Workspace, but there was no visible touch control. Add compact mobile-only toolbar toggles and reachable in-panel Close controls. `aria-expanded` follows all class changes (buttons, Escape, keyboard shortcuts, other UI actions). Desktop panels and keyboard shortcuts remain unchanged.
3. **Open PDF could disappear on touch devices.** The header Open control was hidden below 860px even after a document replaced the welcome view. Keep it visible on mobile. The welcome Open button remains unchanged.
4. **P1 Return crowded narrow toolbars.** On phones ≤520px, page/return controls and zoom now occupy two rows, retaining visibility instead of clipping; all toolbar functions remain available. Mobile off-canvas sidebars are positioned relative to the shell to prevent document-root horizontal overflow.

### Fresh validation

- **Chromium actual-UI shell:** **139/139 assertions PASS** across 9 viewport widths (320, 375, 390, 520, 768, 860, 861, 1024 and 1440px), 2 touch-device contexts (375×667, landscape 640×320), both side-panel toggles and Close buttons, Escape, theme, language, Open PDF presence, P1 Return toolbar layout, 30 repeated open/close/theme cycles, stable DOM node count, zero uncaught JS exceptions, zero mobile root horizontal overflow. This runs real MathReader assembled JS/CSS with no PDF engine; it is not production PDF.js acceptance. Median local shell setup ~0.25s in the observed browser environment and **not** evidence of end-to-end PDF rendering speed.
- **Source and isolated browser shell:** 49/49 source/test commands PASS; isolated Chromium P0 shell PASS. Existing scrolling, OCR initialization/failure, LaTeX, P1 concurrency, and P0 evidence tests remain passing. Complete syntax and ten-module assembly gates PASS.
- **80 real original PDF files (1,096 pages):** two independently uncached v359/v360 source-proxy runs, 80 selected Tesseract OCR-proxy crops each. 80/80 identical PDF geometry, formula-region selections, Results/Equation/Bibliography source-level candidate outputs, and OCR-proxy transcripts. No native extraction or proxy failures. Ten previously source-verified formulas from Ahlfors, Yau, Caffarelli and an older Riesz-transform paper compiled in MathJax; this is **not actual Texify inference or mathematical accuracy certification**.
- **Strict real engines:** P0 original-PDF browser preflight remains **UNVERIFIED**, and real two-PDF P1 browser preflight remains **BLOCKED**, because original pinned PDF.js v4.10.38 files and Texify assets are not present in this environment. All 80 PDF whole-document accuracy statuses remain **UNVERIFIED**; the previous known open issues remain open. No production-browser acceptance is claimed.

**Evidence:** `regression/ui_stability_v360_20261106.json`; new `tests/ui_responsive_regression.py`, invoked by `regression_tools/p0_gate.py`. All original PDF hashes, comparison fields, scopes and limitations are retained. No test PDFs, local OCR caches or screenshots are included in the patch.

---

## v359 — P0/P1 real-engine readiness and acceptance-report integrity (2026-11-06, Beijing UTC+08)

**Baseline:** full v358 reconstructed from authoritative ZIP patches; **release:** v359; next code change v360. Work remains limited to approved P0 recognition reliability and P1 confirmed local-PDF navigation. No new production mathematical detection, OCR inference, cache, rendering or bibliography-link behavior was introduced. Ten production JS subsystem files and CSS are byte-identical to v358; only version/cache-buster metadata, regression tools, tests and policies changed.

### Reproduced acceptance defects and conservative corrections

1. **P0 formula OCR could fail while the browser summary said COMPLETE.** The v358 browser report excluded the formula stage from its per-PDF completion condition, even for explicitly requested formula crops; navigation and persistence failures were also not part of that report. The new browser-capture classifier checks all requested stages and reports **FAIL** for actual browser errors, failed navigation/persistence or actual Texify compilation errors. A missing real OCR result is **UNVERIFIED**, not COMPLETE or PASS. `COMPLETE` is *execution completeness only*, and never independent mathematical verification.
2. **Unavailable Texify unnecessarily blocked PDF.js index acceptance.** With requested formula cases and no `--allow-texify-network`, v358 blocked the entire PDF-browser job even if genuine pinned PDF.js was installed. v359 separates PDF.js prerequisites from Texify limitations. With the genuine PDF.js engine supplied, document indexes/navigation can run without Texify; selected formula rectangles can produce browser-rendered, SHA-256-checked **crop-only** PNG evidence for human review, explicitly `original_pdf_browser_crop`, **not formula OCR**. Texify never initializes from crop-only mode.
3. **P0 missing equation locations were silently changed to ratio zero.** The test-only real-index probe used `Number(candidate.ratio) || 0`; absent/NaN ratios therefore looked like legitimate top-of-page coordinates. It now preserves valid numerical ratios (including genuine 0) and reports invalid/missing ratios as `null`, allowing the strict comparator to flag them.
4. **P0 non-finite performance measurements could evade the gate.** In the truth comparator, `NaN > threshold` is false and could bypass an explicitly requested performance limit. Missing, non-finite, negative or boolean measurements, and invalid/nonpositive performance thresholds, now remain UNVERIFIED. Valid limits and actual overruns are unchanged.
5. **P1 first assertion failure could be mislabeled BLOCKED.** v358's real-browser two-PDF script classified general exceptions as BLOCKED whenever no previous assertion had passed. A failed first assertion is now always **FAIL**, while a browser that never starts is BLOCKED and a source paper with no suitable reference is UNVERIFIED. All of these classifications are test infrastructure, not new P1 navigation logic.

6. **Image-only PDF index precondition.** A real PDF.js document without native text requires explicit document OCR before whole-document index verification. The test-only browser probe reports `P0_REQUIRES_DOCUMENT_OCR`; P0 records an **UNVERIFIED** OCR/index stage rather than falsely treating a valid image-only source as a crashing mathematical detector. Other runtime index failures remain FAIL.

### Executed verification

- Source and isolated Chromium-shell gate: **48/48 checks PASS**, including all inherited JavaScript/assembled-module tests, Python tests, new 15-case gap-closure tests and 5 Node test-only probe checks. P0 independent truth comparator: **54/54 test methods PASS** (including new non-finite metric controls). JavaScript syntax and assembled ten-part runtime PASS.
- Strict real-engine preflight used **two different existing PDFs** and a separate original-PDF formula crop case: **P0 INCOMPLETE/UNVERIFIED**, **P1 BLOCKED**, strict exit code **2** (correct fail-closed behavior). Exact genuine `pdfjs-dist@4.10.38` browser and worker assets were unavailable in this environment; Texify recognition was not executed. Neither a synthetic PDF engine nor an unrelated OCR backend was substituted for real browser acceptance.
- Additional cached-corpus nonregression: **30 SHA-256-distinct original PDFs, 1,521 pages**, 22 low-native-text pages; **30/30** native extraction and actual source-parser-proxy jobs completed, **30/30** selected Tesseract plain-text OCR-proxy calls, **0** execution failures/timeouts/empty transcripts. Cold ~10.78 s; fully cached ~0.21 s. This is not whole-document OCR nor actual Texify, and all 30 original PDFs remain **UNVERIFIED** for whole-document correctness. The 30 PDF hashes, page counts and stage statuses are recorded in `regression/p0_p1_v359_20261106.json`.
- Full source-module comparison against v358: **10/10 production JavaScript subsystems and CSS unchanged**. New regression logic and version/cache keys were checked independently. The user-facing P1 navigation implementation was not modified.

### Still open — not reported as fixed

- **P0:** real pinned PDF.js entire-document indexes, actual Texify model initialization/inference and WebGPU→CPU fallback, true page-to-LaTeX transcription, independent full-document golden truth, and deployed-browser performance/acceptance remain **UNVERIFIED/BLOCKED**, exactly as before. Crop-only mode is a future reviewer aid, not evidence that OCR works.
- **P1:** actual two-PDF browser interaction and IndexedDB durability/reopen/return at the original page and within-page ratio remain **BLOCKED** until genuine pinned PDF.js assets are provided. Isolated DOM/VM checks and a correct blocked preflight are not equivalent to this test.
- Prior known detector defects listed below retain their previous classification. No unverified manuscript or Formula OCR result was promoted to PASS.

**Execution on a machine with the pinned engine available:** supply `--pdfjs-build` pointing to the actual `pdfjs-dist@4.10.38/build` directory containing `pdf.min.mjs` and `pdf.worker.min.mjs`; use `regression_tools/p0_gate.py` with original manifest and `--p1-source-pdf`/`--p1-target-pdf`, plus `--require-p0-full --require-p1-real` for strict status. Optional `--formula-cases` without `--allow-texify-network` captures only the real browser PDF crop (UNVERIFIED formula); opt in to the real Texify model separately and provide independently verified formula ground truth. Never treat external dependency absence as a PASS. No hidden dependency fallback is permitted.

---

## Historical record — v358

## v358 — Comprehensive P0/P1 reliability regression and fail-closed corrections (2026-11-06, Beijing UTC+08)

**Source baseline:** v357 reconstructed from the original v347 ZIP and each successive root patch; **current release:** v358. Next source change: v359. Only P0 reliability and P1 confirmed local cross-paper navigation are authorized. P2–P4 remain deferred. All earlier entries are retained below.

### Independently reproduced framework bugs corrected

1. **P0 false PASS when location evidence is absent.** A synthetic, internally consistent index/ground-truth pair with all `ratio` fields removed was incorrectly classified **PASS** in v357. Whole-document reviewer inventories must now include a valid finite within-page ratio and an integer source page for every indexed entry; missing review geometry => **UNVERIFIED**, never a certification. Malformed actual-browser source locations are separately recorded as FAIL even when the golden inventory is incomplete. This changes only the acceptance comparator, not document detectors.
2. **P0 malformed-evidence crashes.** Null/nonobject engine, index, stage, navigation and error records, invalid category lists and scalar defect records could produce uncaught exceptions. A reproducible 180-input schema stress pass previously identified nine crashes; the corrected validator completed the identical pass with **zero uncaught exceptions**. Invalid or incomplete reviewer evidence remains UNVERIFIED. The expanded comparator suite has **52 passing tests**, including new structured negative controls.
3. **P1 committed-write completion mismatch.** An IndexedDB confirmed link write could commit under the exact source PDF identity after the active paper switched, but the promise reported `false` as though cancelled. This is not a foreign-document write; it is a source-scoped durability/return-state inconsistency. After the write commits, it now reports success while deliberately leaving the newly active paper's in-memory link map and UI untouched. Reopening the source reloads the committed link. **74 P1 VM assertions** cover the added delayed-commit case and existing rapid-click, nested-return, failure-retry and session-save races.
4. **P1 blocked status obscured in the top-level gate.** The P0 gate now surfaces the real P1 runner's `BLOCKED`/`UNVERIFIED`/`FAIL` detail instead of only a generic `INCOMPLETE` process-exit classification; it never turns absence of genuine PDF.js into PASS. One new test confirms this behavior.
5. **Offline audit version provenance.** The corpus runner now reports the tested bootstrap version (v358), not its historical v354 infrastructure origin. Synthetic test projects without a bootstrap are explicitly `UNKNOWN` and do not crash.

### Fresh 110-document original PDF and formula regression

- **110 SHA-256-distinct original PDFs, 1,467 pages**, with 218 pages below the native-text threshold. Includes handwritten inverse-problem and seminar notes, historical research, applied technical documents, modern papers, Chinese-language and nonmathematical negative controls. Strata are filename-based; these are not 110 independent archival scientific manuscripts.
- Native text/geometry and source-level Results / raw Equation / Bibliography probes completed on every document, with **0 extraction errors and 0 parser exceptions**. One explicitly selected **Tesseract plaintext proxy OCR crop per PDF: 110/110 completed**, 0 execution failures, 0 empty transcripts. This is not full-page or production Texify OCR.
- **15 page-linked, previously human-transcribed formula references from six of these PDFs** compiled in actual MathJax (15/15). Compilation does not establish a new Texify recognition result or independent verification of all the formulas in the 110 documents.
- Differential comparison v357→v358 across 110 PDFs found **0 changed output fields** among page counts, text geometry, source-level mathematical candidates, selected OCR-proxy transcripts and formula-region selections. Cold run ~23.23 s; fully cached post-change repeat ~0.64 s (not a production PDF performance benchmark).
- **Status:** 0 PASS–Fully verified; 0 newly proven PDF detection FAIL; 110 UNVERIFIED; 0 EXCEPTION. This classification does not clear historical known detection errors documented below.

### Browser P0/P1 acceptance and remaining blockers

- Existing P0 source gate: **45/45 checks passed**, including the inherited JavaScript/Python suites and isolated Chromium shell. A separately executed genuine-browser preflight on 12 original PDFs explicitly marked 12/12 UNVERIFIED because the exact `pdfjs-dist@4.10.38` browser/worker assets are absent. The independent comparator returned INCOMPLETE, not PASS.
- Genuine P1 two-original-PDF Chromium preflight on Caffarelli and handwritten inverse-problems originals returned **BLOCKED, 0 real-navigation assertions**. Isolated DOM/VM tests cannot substitute for live PDF.js/IndexedDB/PDF navigation. An attempted combined strict run exceeded its bounded wall time; it is **not** counted as success. Separate bounded preflights establish the exact dependency blocker.
- **UNVERIFIED:** deployed browser navigation and return anchor, persistence across real PDF.js reload, PDF.js OCR geometry and final indexes, actual Texify image-to-LaTeX inference, WebGPU→CPU fallback, and full original-page mathematical ground truth for modern/historical printed and handwritten material. No image-OCR or mathematical detector source was changed to compensate for a test blocker.
- Machine-readable per-document hashes and detector/paired-formula counts: `regression/p0_p1_v358_20261106.json`. Original PDFs, OCR caches, model files, and personal reading data are deliberately excluded from the deployable ZIP.

**Required release checks:** `node --check` for bootstrap, 10 source modules and tests; assembled 10-module syntax; all existing JavaScript test scripts; Python runner, P0 comparator, P0/P1 browser smoke/gate tests; 110 original PDF identity and differential audit; 15 source-linked MathJax compilations; strict fail-closed browser preflights; ZIP overlay and integrity. **No live PDF.js or Texify success is claimed.**

---

# MathReader Regression / Behavioral Audit Record — v357

## v357 — P0/P1 gap closure, provenance hardening, and real two-PDF acceptance path (2026-11-06 Beijing UTC+08)

**Version:** v356 → **v357**. This is a small source+test repair, not completion of real Texify/PDF.js acceptance. Next source modification must be v358. Only P0 and P1 remain approved; P2–P4 stay deferred. All historical records below remain intact.

### Confirmed defects fixed

1. **P1 asynchronous local-link write race.** While IndexedDB verified the target PDF, a user could change documents. The outdated callback could then write a link snapshot under a source no longer active. New code acquires a write lock before its first await, rejects simultaneous link mutations, checks exact source identity again before the persistent write, and releases the lock in `finally`. Persistent link schemas and exact PDF identities remain unchanged. This prevents an unrelated PDF's link record from being contaminated by a delayed edit.
2. **P1 stale transient Return path.** Navigating to an unrelated PDF outside the P1 jump path left old A→B→A return history in memory; manually opening B later could resurrect an obsolete **Return** action. The temporary return stack is now dropped when a non-P1 manual document switch makes the current target identity inconsistent. Nested P1 A→B→C→B→A navigation is preserved, because those switches hold the P1 busy lock.
3. **P0 golden index comparator could falsely accept malformed positions or ordering.** Integer truncation of fractional pages, nonfinite `NaN` ratios, out-of-document page numbers and shuffled equal-count inventories could evade its multiset comparison. The gate now rejects invalid coordinates, checks the page range and source order, and compares each matching item's reviewed ratio. These are acceptance-test integrity changes, not changes in MathReader's detection output.
4. **P0 formula-evidence provenance weakness.** A claimed OCR crop SHA-256 in a JSON capture could be treated as sufficient without ensuring the actual browser-rendered PNG existed and matched its bytes. Acceptance now requires a safe relative PNG filename, the SHA-256 of real saved PNG bytes, correct PNG header, and nonempty actual Texify backend provenance before it can compare the OCR LaTeX to independent approved original-page transcription. Missing/mismatched crop/backend => **UNVERIFIED**, not PASS. Actual compilation or wrong mathematical content remains FAIL where real evidence exists.

### Real-browser P1 acceptance now runnable, but not yet passed here

`regression_tools/p1_browser_e2e.py` is a new **test-only**, isolated Chromium two-original-PDF scenario. It loads the original source and target PDFs through pinned **genuine** `pdfjs-dist@4.10.38` in the actual MathReader runtime; checks exact SHA-based local identities and IndexedDB cache; builds the source Bibliography; selects and confirms the actual UI `Link PDF` picker; opens the real target PDF; checks the temporary `Return` control and source page/ratio restoration; reloads the browser and verifies the stored link. It checks that P1 never eagerly initializes Formula OCR. A source PDF with a numbered bibliography entry is necessary. The test-only observer is appended only to a disposable copy, never to production `js/` modules.

P0's single-command gate accepts `--p1-source-pdf`, `--p1-target-pdf`, `--pdfjs-build` and `--require-p1-real`; runs a fresh real-P1 scenario with isolation, refuses to reuse old results, and records PASS/FAIL/BLOCKED distinctly. Missing or mismatched pinned assets **cannot** be substituted with a PDF mock. **This environment lacks the actual pinned browser PDF.js build and cannot fetch it from the network; therefore genuine two-PDF P1 acceptance remains BLOCKED and unverified.** Real formula Texify image inference and independent whole-document mathematical ground truth likewise remain **UNVERIFIED**. No production-browser deployment was tested.

### Executed gates and corpus evidence

- **P1 Node VM:** 69 targeted assertions, including stale IndexedDB lookups, concurrent mutations, nested/failed returns and manual-open stale-stack invalidation, PASS.
- **P1 isolated Chromium:** 18 DOM/UI assertions, PASS. Its PDF backend is simulated and must not count as genuine PDF.js navigation.
- **P0 comparator:** 39 unit tests, including verified PNG-byte requirements, NaN / fractional / out-of-range page rejection, ordering, missing Texify backend, stale evidence and malformed-source handling, PASS. These test fixtures are *synthetic comparator controls* and are not independent mathematical ground truth.
- **P1 real harness preflight:** rejects missing pinned browser assets and exact-duplicate original PDFs; no false success. Real PDF.js and actual inference could not be executed in this environment.
- **70 unique original PDFs / 555 pages** compared v356→v357 using the existing source-level detector with 70 paired Tesseract plaintext OCR proxy crops. All 70 pagesets had identical extraction geometry, selected formula-region provenance, Results/raw-equation/Bibliography candidate output and OCR proxy transcripts across both versions, with no parser/OCR execution failures. This is **source-level nonregression**, not whole-document mathematical verification or actual Texify recognition; all 70 are UNVERIFIED by the full P0 standard.
- The bounded regression was selected after a separate 140-PDF extraction timed out on dense reference-book geometry. That timed-out attempt was not counted as a pass; do not silently replace full geometry with a lower-fidelity probe.
- The remaining source/assembled/runtime and Python regression gates, isolated UI tests, root ZIP integrity and version overlay are required release gates. See `regression/p0_p1_v357_20261106.json` for exact recorded observations.

**Outstanding:** pinned PDF.js assets, genuine real-browser P1 two-PDF navigation, real Texify/CPU fallback inference, independently verified all-page formula/text golden corpus, historical handwritten technical documents and whole-document accuracy. Never claim P0 or P1 end-to-end completion solely from the newly runnable harness or passing isolated tests. Preserve every earlier known-defect entry below.

---


## v356 — Conservative P1 cross-document links; P0/P1 regression and repairs (2026-11-05 Beijing UTC+08)

**Approved roadmap only:** P0 end-to-end mathematical recognition reliability, P1 conservative cross-document mathematical navigation. P2 comprehensive expression search, P3 correction sharing and P4 paper version comparison remain **deferred**. All history below is retained unchanged. **Source version v355 → v356; the next code change is v357.**

### P1 user workflow and constraints

- From an existing numbered **Bibliography** entry in Paper A, select **Link PDF** and explicitly choose a different PDF already cached in MathReader's local library. No metadata-title, DOI, arXiv or theorem-text guessing; this is a human-confirmed exact PDF ID association, not an automatic document match.
- Afterwards select **Open PDF**. MathReader saves the source document's current session before opening the exact linked local PDF, where the existing Results/Equations indexes can be used to reach a known mathematical statement. A temporary compact **↩ Paper** button returns to the recorded source page and within-page ratio. Nested A→B→C→B→A return is supported during one running session. **No automatic theorem number matching** has been implemented: guessing a cross-document theorem destination is prohibited without reliable evidence/user confirmation.
- Confirmed source→target mappings are stored only under IndexedDB `meta/crossdoc-links:v1:<exact source PDF ID>` (schema v1, at most 400 links/source), separate from ordinary annotations, reading positions and reading-data export. A missing/evicted PDF cannot silently resolve to another candidate; users can Relink or Unlink. Forgot/removed source PDFs delete their source-side link metadata. Return history is temporary in-memory; each document's normal independently saved reading position is preserved when switching or reopening, but cross-paper Return button state does **not** survive browser restart.
- Reuse the existing ten-part module, sidebar Bibliography, cached file database and navigation; no new panel, remote dependency, hidden OCR initialization or mathematical detector/recovery modification. No original PDF modification. The toolbar return button only shows while an active source return path exists. Important: the source must be cached to guarantee return; otherwise the jump is denied with a clear message.

### P0 and P1 defects investigated and fixed

1. **Document persistence race:** debounced session writes or recovery-snapshot timers could complete after switching PDFs. Each save is scoped to the original exact document identity and generation; switching flushes and awaits the previous source's session; reopening the same source refreshes its persisted snapshot. The source's page/ratio are captured before navigation.
2. **Double-click racing navigation:** a busy lock now starts **before** the first awaited storage read. A second jump/return cannot switch documents concurrently.
3. **Failed return navigation:** return-history is consumed only **after** exact original page/ratio navigation succeeds. If that navigation fails, the source can be retried and the target is restored when possible; suppression flags and busy state are always released.
4. **Forgetting cached files:** outbound bibliography mapping metadata is deleted for a forgotten source PDF; inbound mappings cannot be used against unavailable target bytes. Never auto-relink from similar titles.
5. **P0 stale evidence:** a manifest run erases previous browser captures and comparison outputs before capturing new evidence; old PASS data cannot certify a fresh run. A fresh, partial *actual browser* error is compared and reported FAIL rather than hidden as INCOMPLETE. The overall acceptance can never become PASS when the actual browser process has not passed.

### Validation executed, limitations and classifications

- **61 P1 VM behavior assertions** PASS, including exact-ID linking, persistence errors, missing/evicted targets, nested return, simultaneous clicks, failure/retry, timed session saves and recovery snapshots.
- **16 real Chromium Bibliography UI assertions** PASS (link chooser, confirmed selection, Open, Return, location ratio, no eager Formula OCR, evicted target). **PDF engine deliberately simulated** for this UI test; not actual PDF.js or deployed browser proof.
- **Three P0 test-isolation tests** PASS; **31 P0 independent-ground-truth comparator logic tests** PASS. `p0_gate.py` also runs inherited source regressions and the standalone Chromium shell check; v356 combined gate PASS with **43 source checks** (including Python/Chromium smoke), browser shell PASS, **P0 actual PDF/browser/formula end-to-end INCOMPLETE**.
- **50 SHA-256-distinct original PDFs / 2,437 pages** underwent *v355 vs v356 source-level* comparison: text, page geometry, candidate Results, raw equation lines, Bibliography and available formula region metadata were **identical for every source**; **zero detector exceptions and zero field differences**. This differential explicitly ran **without OCR** and did not independently verify mathematical accuracy. The source files were selected from the prior 50-file corpus; do not count as 50 first-time documents. Details and hashes: `regression/p1_v356_20261105.json`.
- Full original-document accuracy statuses: **0 PASS—Fully verified / 0 newly established end-to-end FAIL / 50 UNVERIFIED / 0 EXCEPTION**. Pre-existing reported mathematical detection/OCR failures remain open. Actual PDF.js loaded document switching, real IndexedDB in a live browser with PDFs, deployed-site navigation, original-page Texify recognition, and whole-document independently reviewed ground truth are **UNVERIFIED** due to unavailable pinned engines/models. Never call the isolated Chromium PDF backend an actual end-to-end acceptance.
- Future gates: provide locally pinned exact PDF.js, original source PDFs and reviewed golden data; execute the strict `regression_tools/p0_gate.py --manifest ... --pdfjs-build ... --require-p0-full` before claiming fully verified P0/P1 in production. Preserve source file hash identities, parallel text/formula checks, no silent OCR fallback, and the historical defect ledger.

---

# MathReader Regression / Behavioral Audit Record — v355

## v355 — P0 automated acceptance framework (2026-11-05 Beijing UTC+08)

**Roadmap decision (per user): P0 end-to-end reliability and P1 conservative cross-document mathematical navigation are the only approved directions.** P2 comprehensive expression search, P3 shared correction layers, and P4 version comparison remain deferred and must not be implemented without new explicit approval. P0 is a continuous reliability requirement, not a UI feature. P1 may begin only after its relevant P0 dependencies have sufficient independently verified evidence; not every historical handwritten document must be solved first.

### Implementation, exactly what changed

- New **test-only** `regression_tools/p0_gate.py` runs each established JavaScript regression suite, syntax-checks source and the exactly-ten-part assembled module, runs the existing Python cached-runner tests and 30 new ground-truth comparator unit tests, and invokes a Chromium shell acceptance test. Reports preserve **code gate PASS** separately from **mathematical acceptance INCOMPLETE**.
- New `regression_tools/p0_browser.py` can open actual original PDFs using the site's *exact pinned* `pdfjs-dist@4.10.38` assets supplied locally; test-only instrumentation from `p0_browser_probe.js` observes the real final Structure/Results/Equation/Bibliography indexes, page navigation, and position restoration. Source-linked PDF-page rectangles can be rendered by actual PDF.js into SHA-256-attested image crops before running MathReader's Texify recognition and MathJax error-node compilation; these real-PDF paths were not runnable on this host. Without the pinned PDF.js modules or a permitted real Texify runtime/model, the test is **BLOCKED/UNVERIFIED**, never replaced silently with a mock or a Tesseract proxy. A separate isolated DOM shell test loads the unmodified ten-part application code and verifies lazy initialization/modal failure release with explicit fault injection; it makes **no** PDF/browser-index correctness claim.
- New `regression_tools/p0_ground_truth.py` validates original PDF SHA-256, actual source page count, a human-independent whole-page/whole-category reviewer inventory and source evidence, actual browser PDF.js version and completed index stages, exact Results/Equations/Structure/Bibliography entries and their locations, formula crop/model provenance and literal LaTeX, MathJax compilation, navigation and persistence. Known open defects remain FAIL; incomplete data remains UNVERIFIED. Do not infer mathematical equivalence from LaTeX normalization or accept syntax compilation as symbolic correctness. Strict examples, requirements, and commands: `regression_tools/P0_ACCEPTANCE.md`.
- Application source: **all ten JS subsystems, CSS, detection/recognition/recovery logic, schema versions (Structure 45 / Equation 23), lazy first-extraction Texify, and intentional WebGPU→CPU fallback are unchanged**. Only `mathreader.js` VERSION and the two HTML cache-busters advance **v354→v355**, and three established tests update version assertions. No production probe, new UI, hidden OCR triggers or network calls added.

### Locally executed results and explicit limits

- **2,313/2,313** inherited JavaScript assertions passed (including 228 MathJax compilations). **19/19** existing Python regression-runner assertions and **30/30** new independent-ground-truth *comparator logic* unit assertions passed. All JavaScript sources/tests, ten-part assembled runtime, and Python syntax pass. The 30 new checks use **generated synthetic controls** and validate fail-closed classification; they are not independently verified mathematical documents.
- **Seven/seven Chromium isolated UI shell checks PASS:** initial no-PDF/never-eager-Texify, theme/language controls, overlay shown with inert/focus during an intentionally failed model import, modal released with normal controls restored. This is a real headless browser running the application's lexical JS, **without** actual PDF.js loading or Texify inference; IndexedDB/real-site persistence is not verified.
- **Eight real existing PDFs / 540 pages**, SHA-256 checked, native text/geometry plus actual-source detector proxy completed, with **8/8** selected Tesseract text-proxy OCR calls, **0** OCR execution failures, timeouts or empty transcripts. This is a repeated limited pilot, **not** an additional eight first-time documents and not whole-document OCR. See `regression/p0_v355_20261105.json` for per-file hashes.
- Browser PDF acceptance was **BLOCKED** in this test container: both the production-site JSDeliver PDF.js CDN and localhost HTTP were administratively unavailable and the pinned PDF.js modules were not present as local assets. Actual production Texify images/models were likewise unavailable. The pilot has no fully reviewed whole-document ground truth. **8/8 UNVERIFIED; 0 PASS—Fully verified; 0 newly confirmed product FAIL; 0 EXCEPTION.** Pre-existing open defects remain unresolved. **P0 as a fully verified browser and mathematical acceptance milestone is not yet completed.** The framework can execute the missing stages once the exact assets and reviewed originals are provided; do not represent this release as end-to-end certification.

### Permanent P0 standards / regression policy

Always pair text indexing and formulas from the **same PDFs**. Keep a small whole-document independently verified golden corpus and a broad diverse original-PDF stress corpus, including degraded historical scans and handwriting from outside pure mathematics. Execute both native source-level diagnostics and **real browser** PDF.js and production model tests where available. Measure structural accuracy, missing/extra labels, ordering and positions, OCR symbol fidelity, compilable LaTeX, navigation, persistence, crash recovery, responsiveness, memory/time. Store evidence by source hash/page/crop and never silently mark a deferred OCR page or incomplete human review PASS. Preserve PASS—Fully verified / FAIL—Known error / UNVERIFIED—Incomplete verification / EXCEPTION—Demonstrably human-illegible source classifications. No speculative document-specific patches. The automated comparison may run unattended **after** human-approved ground truth exists; initial approval or ambiguous mathematical transcription requires expert review. Every future release must retain and advance this gate without diluting quality requirements.

---

# MathReader Regression / Behavioral Audit Record — v354

## v354 — 200 NEW source PDF paired text/formula regression (2026-11-05 Beijing UTC+08)

**Scope:** This campaign used **200 additional SHA-256-distinct original PDF files, 10,364 pages**. Each source hash differs from all 159 unique PDFs in the previous sweeping audit, and all 200 originals are distinct from one another. Sources are genuine preinstalled ConTeXt/TeX scientific-typesetting documentation: 104 document/manual PDFs, 16 source-reference PDFs, 2 illustrative examples, 3 other installed technical documents, and 75 presentations. They cover mathematical typography, tables/columns, multilingual and mixed-layout references, graphical examples, and negative controls, but **NOT** 200 independent mathematical papers, and not new original historical handwritten physics, engineering or geological field notes. External NASA/USGS downloads could be located publicly but their bytes were not available to the runtime. This corpus expansion must **not** close the independent-historical-science coverage requirement.

**Whole-document native extraction and local detector proxy:** PyMuPDF traversed **10,364/10,364 pages** across **200/200** PDFs, with **0 extraction errors** and **0 MathReader source-level parser exceptions**. There were **580 pages** with fewer than 30 native text characters. The unchanged v354 parser functions generated **84 preliminary Results candidates, 11,131 lines bearing raw equation-label candidates, and 10 bibliography-heading matches**. These are NOT final MathReader index counts. Some malformed-PDF resource notices were printed by MuPDF, but the multi-process console logs do not reliably attribute them to individual files. Document presence and parser completion do not prove accuracy.

**Paired formula evaluation:** From these same 200 originals, exactly **200 selected page/crop OCR-proxy calls** completed at configured 160 DPI with Tesseract, **0 execution failures, 0 timeouts, 8 empty transcripts**; an empty transcript remains UNVERIFIED rather than passing recognition. The region selector can choose mathematical or nonmathematical fallback content and is **not** a verified formula detector. On visually inspected source pages, **13 manually provided LaTeX reference/stress cases from 4 PDFs** were processed by v354's actual postprocessor and compiled with real MathJax (**13/13 compiled**). Some references introduce neutral operands to exercise printed relation symbols, so they must not be represented as exact OCR transcriptions. **No actual browser Texify**, symbol-level formula recognition score, PDF.js final index, or image-to-LaTeX success rate is established. The 200-document paired whole-document classification remains **0 PASS / 0 confirmed end-to-end FAIL / 200 UNVERIFIED / 0 EXCEPTION**.

**Differential nonregression:** The exact same 200 cached geometric inputs were probed with v347 and v354 source. A **test-only** v347 compatibility shim returns false for an index-navigation helper that did not exist in that earlier source; without this shim, the current proxy generates one irrelevant instrumentation error per page. With this disclosed interface normalization, v347 and v354 had **identical per-file Results, raw equation-label lines, bibliography-heading counts, and zero parser exceptions**. This supports unchanged local candidate behavior on the new technical corpus; it cannot prove final browser/old-model OCR equivalence or eliminate historical omissions. A clean v354 200-file run took approximately **43.2 s**; warm reuse took **0.336 s**, with all extraction/detector/OCR stages cache hits (environment-dependent timing). Original PDF SHA-256s were rehashed on repeat.

**Page-image reviewed local proxy negatives (remain open; no speculative source fixes):**

- `lowlevel.pdf`, PDF page **4**, visually a table of contents: `12.8 Remark` was classified as `Remark 12.8`. The page contains a chapter listing, not a mathematical remark statement. **FAIL in source-level Results candidate context, final-browser behavior UNVERIFIED.** Likely TOC-heading lexical leakage; confirm the final Structure/Results assembly excludes TOC entries before changing detectors. Priority: medium; positive controls must retain genuine Remark statements.
- `rules-mkiv.pdf`, PDF page **3**: `Definition 1` and `Definition 2` are reference entries for TeX commands `\definebar` and `\setupbar`, not mathematical definitions. **FAIL in source-level domain-specific interpretation, final-browser behavior UNVERIFIED.** Domain-aware suppression could hide genuine mathematical definitions, so defer pending positive/negative controls. Priority: low.
- `context-2020-tokens.pdf`, PDF page **10**: `Example 1` is an instructional Lua token-table slide, not a mathematical result. `lowlevel-tokens.pdf`, PDF page **10**, similarly has `Example 6.1` for a programming example. **FAIL in source-level math-specific semantic interpretation, final-browser behavior UNVERIFIED.** Do not globally suppress Examples; validate genuine mathematical examples and final index semantics. Priority: low.

**Local gates:** 11 bundled JavaScript suites, **2,313/2,313** assertions (including **228 compiled MathJax formula cases** in the pre-existing syntax suite), 19/19 Python regression-runner assertions, 13/13 new source-linked candidate compilations, full-document 200-PDF 10,364-page extraction, 200 OCR selected proxy calls, all 200 independent-hash checks, source-level differential comparison, and 200/200 warm cache reuse. Browser production acceptance, handwritten physics/engineering/geology PDFs, whole-document ground truth and Texify image recognition remain **UNVERIFIED**. Source-code version remains **v354**. Per-document reproducibility record: `regression/scientific_typesetting_200_20261105.json`.

---

## v354 — Comprehensive previous-release behavioral sweep (2026-11-05, Beijing UTC+08)

**Purpose and baseline:** Audit effects of v348–v354 (precision fixes, Formula OCR initialization/lazy-loading, dead-code cleanup, LaTeX repair, regression infrastructure, continuous scrolling and CSS). The exact v354 tree was reconstructed from the user-supplied complete v347 ZIP plus successive root patches v348→v354 and **all 40 project files matched byte-for-byte** with the local v354 baseline. **No application code changed in this campaign; version remains v354.** Source and historical policy remain authoritative. Machine-readable audit: `regression/sweep_v354_20261105.json`.

**Exhaustive available on-disk corpus inventory:** 190 accessible PDF copies across existing regression-corpus directories, SHA-256 grouped to **159 byte-distinct originals (31 duplicate copies)** totaling **12,242 pages**. This is an audit of *the PDFs actually mounted in this working environment*, not a claim to have retrieved every previously researched remote or Library PDF. No duplicate copy was counted as a new document.

**Standard native-text/detector sweep:** **158/158 PDFs, 11,542/11,542 pages** processed using PyMuPDF sorted line geometry; **0 extraction exceptions, 0 source-level parser exceptions**. A total of **2,037 pages** had fewer than 30 native-text characters. The unchanged v354 source-level probes produced **2,251 Results candidates, 35,034 raw equation-candidate lines and 45 bibliography heading matches**, not final PDF.js indexes or accuracy percentages. The remaining **700-page** dense Chinese grammar book (`张道真实用英语语法.pdf`, SHA `ff163b64…`) was completely traversed using a **separately declared, lower-fidelity block-geometry probe** (29,416 approximate lines; 0 parser errors). The standard fine-grained PyMuPDF text-span extraction was still around page 283 after more than five minutes, so it was stopped. This is a **regression infrastructure performance limitation**, not a confirmed site loading bug; the block-level test cannot be counted as full-geometry equivalence. Revisit with a general, explicit per-document extraction budget/progress diagnostic (not a filename-specific workaround), and retain fail-closed accuracy classification.

**Actual source differential v347→v354:** Across the 158 standard PDFs and **656,298 native lines**, v347 yielded **2,253 Results** and v354 **2,251**; the only removals were the deliberately rejected nonmathematical `Remark I` on the phrase-finder index (PDF p.211) and `Definition` on the subject index (PDF p.436), confirmed against original page images. **0 added/changed Results, 0 unrelated removals, 0 parsing exceptions**. Raw equation-candidate line counts stayed **35,034→35,034** and bibliography heading matches **45→45**. These are local source probes; the browser pipeline and specialized equation recovery may behave differently. The nine non-renderer runtime subsystem files were unchanged from v353 to v354 by prior source-level verification.

**Recent runtime behavior safety:** All **11 bundled JavaScript suites passed (2,313/2,313 assertions)**, including Formula OCR initialization failure/timeout/fallback, first-extraction-only loading, MathJax preview errors, formula LaTeX scope, index precision and scroll parity. All **19 Python infrastructure smoke assertions** passed, including cache invalidation/failure checks. An independent **headless Chromium DOM** comparison tested the v353/v354 page-selection implementations across **1,400 real-layout cases** (regular/narrow screens, dynamically resized frames, CSS transforms), **0 mismatches**. This tests isolated browser layout parity, **not deployed site PDF loading** or actual Texify. Bootstrap, every JS source and test and the assembled ten-part module passed `node --check`; patch-chain source identity was verified.

**Paired formula and OCR evidence:** **158 selected 160-DPI Tesseract plaintext proxy crops** from the standard PDF corpus completed with **0 execution failures, 0 timeouts and 0 empty results**; the 700-page grammar control had no equivalent scheduled crop. On repeat, the 158 extraction/detector/OCR stages were all real cache hits. **18 original-PDF/page-linked, manually transcribed formula LaTeX references compiled 18/18 through v354's actual postprocessor and MathJax**. The inherited wider suite contains 228 MathJax compilation cases. These are not Texify recognitions; full-scan OCR, handwritten symbol accuracy, and rendered mathematical semantic accuracy are still **UNVERIFIED**. No synthetic OCR or compilation case is counted as a fully verified document.

**Release gate and disposition:** **0 newly confirmed application behavior defects**, **0 fully verified document PASS**, **159 document-level UNVERIFIED**, **0 human-illegibility EXCEPTION**. Existing known OCR/Results/Equation and browser-acceptance issues remain open. Nonfatal MuPDF parse warnings were observed on a damaged PDF (`qQq`), without caught extraction/parser exceptions; those warnings do not prove correct transcription. No speculative fixes were applied. No new recovery behavior was introduced. This documentation-only ZIP updates this record plus the sweep audit JSON; **v354 remains current and next code change is v355**.


## v354 — Performance and cleanup audit (2026-11-05 Beijing UTC+08)

**Scope and version:** v353 → **v354**; source-code changes are limited to `js/30-rendering-navigation.js` (continuous-reader layout/scroll lookup), `mathreader.css` (duplicate/orphaned responsive CSS cleanup), and the **offline-only** `regression_tools/run.py`. The bootstrap version and matching HTML cache-busters increment to 354; tests and documentation are updated. All nine other application subsystem JS sources remain byte-identical to v353. Mathematical detection, Structure/Results/Equations/Bibliography indexing, image-to-LaTeX postprocessing, recovery, persistence schema versions (Structure 45, Equation 23), lazy first-extraction formula OCR, WebGPU→CPU fallback, and OCR failure handling are unchanged.

### Measured, conservative changes

1. **Continuous-mode current-page scroll tracking.** The old function measured the `getBoundingClientRect()` of *every* placeholder on each debounced scroll. For documents of at least 64 pages with the expected ordered continuous-frame geometry, binary-search the first potentially visible placeholder using `offsetTop`/`offsetHeight`, and apply the **same original rectangle-based visibility and nearest-top/tie rule** only to those candidate pages. Short documents, transformed visual geometry, unavailable geometry, incomplete frame maps, or inconsistent probe values retain the full-scan behavior. A deterministic parity test compared **1,204 assertions** over varied lengths (1–2,000 pages), mixed page heights, scroll jumps, boundary cases and current-page anchors. A simulated 30,000-page document used **10 vs 30,000 `getBoundingClientRect()` calls** with identical chosen page; this is a **synthetic DOM-call reduction**, *not* a measured full-browser PDF load-time speedup or proof about arbitrary transformed layouts. Offscreen and production-browser acceptance remain UNVERIFIED.
2. **Continuous horizontal-overflow maximum.** Replace allocation of `pageMetrics.map(...)` plus unbounded argument spread in `Math.max` with a bounded incremental maximum. CSS width and frame styles are identical for tested normal, narrow, overflowing, empty and malformed-width inputs; a 155,000-metric stress case avoids the former spread/argument-limit risk. No zoom/anchor/detection semantics changed.
3. **Responsive CSS cleanup.** Removed a second, accidentally inserted Formula OCR overlay declaration and the dangling `.reference-pane` selector inside the 860px media query; retained the authoritative global Formula OCR overlay, responsive `.canvas-wrap{padding:14px}`, and header-button rule. The stylesheet and 860px media rule parse without CSS errors. The dialog's click/focus-blocking and failure release logic are unmodified.
4. **Offline regression tools.** Reuse already validated extractor metadata in the parent process before creating a PyMuPDF process pool; start worker processes only for cache misses. Likewise, load and verify existing cached detector JSON in the parent process and start the Node detector probe only for misses. Cache keys remain based on original PDF SHA-256, schemas, PyMuPDF version, detector JS/proxy fingerprints and OCR settings; cache corruption, unknown SHA, and changed JS remain fail-closed or explicitly reprocessed. Actual OCR/MathJax models are never silently substituted or claimed equivalent.

**Benchmark, same pre-existing 50-PDF manifest (1,125 pages):** A separate empty-cache run with v354 performed all extraction and source-level detector probes and 50 selected **Tesseract plain-text OCR proxy** crops in **16.158 seconds**, with 0 extraction, 0 detector and 0 OCR hits, and 0 execution failures. Repeating on the same cache took **0.206 seconds**, with 50/50 hits in each stage (**78.4× cold/warm**). The previous v353 independently measured fully cold 16.345 s and warm 0.389 s (**42.0×**), but direct alternating warm-run measurements exhibit substantial machine noise: v353 0.534/0.355/0.340 s versus v354 0.181/0.229/0.254 s. **Do not interpret these as a statistically proven universal speedup.** A complete 50-PDF comparison to the prior v353 `benchmark_warm/audit.json` showed **zero differences** in page counts, native character and line counts, low-native-page counts, selected formula regions, and source-level Results/Equation/Bibliography parser reports. No new source documents or independent mathematical ground truth were introduced.

**Validation actually executed:** **2,313/2,313** JavaScript assertions (1,109 inherited, 1,204 new scroll/layout/CSS parity), **19/19** offline Python runner smoke assertions; Python compilation, syntax of all JavaScript sources/tests/tools, assembled ten-module runtime parse, and CSS stylesheet/media-rule parsing. An **isolated Chromium** style smoke verified 1,280px/820px/480px responsive canvas padding (22px/14px/8px), modal z-index 2000/fixed positioning and `.is-hidden` release. A 50-PDF native text/detector comparison against v353 showed zero reported output differences. Final outputs and benchmark evidence are in `regression/performance_audit_v354.json`. This is **not** a production-site PDF/Texify browser acceptance test.

**Deferred optimization opportunities (do not implement speculatively):** continuous mode currently calls PDF.js `getPage()` for every page when building exact skeleton metrics; replacing that with guessed geometry or unbounded lazy estimates could break page anchors, mixed-size pages and navigation. Reworking final mathematical indexing/recovery or changing OCR sampling heuristics is likewise outside safe cleanup without original-page, whole-document, browser-based ground truth. Keep MathReader's current background rendering and on-demand model semantics. Production-browser full-PDF acceptance and actual Texify remain **UNVERIFIED**. The permanent policy of paired text + formula regression, historical/handwritten cross-disciplinary coverage and explicit PASS/FAIL/UNVERIFIED/EXCEPTION classifications remains fully in force.

---

## PERMANENT POLICY — Efficient, content-addressed regression infrastructure (effective 2026-11-05 Beijing UTC+08)

The persistent text/index + **within-same-PDF formula** regression policy below remains unchanged. Optimize *preparation and repeatability*, not acceptance thresholds. Use the shipped `regression_tools/run.py` for reusable original-PDF SHA-256 validation, page text/geometry extraction, stage-specific caches, selected formula-region evidence, optional plain-text OCR proxy, optional **actual provided** formula-LaTeX compilation, and source-level parser audits. This is **test infrastructure only**: it must not be wired into the reader, eagerly initialize Texify, add hidden model fallbacks, or rewrite mathematical detection logic.

- Every original document is keyed by its **actual SHA-256**; reject mismatched expected hashes and exact duplicate bytes, not just duplicate filenames. Reuse cached geometry only if PDF identity, extraction schema/selector, and PyMuPDF version match; invalidate detector probes on detector source or runner changes; invalidate OCR results on the selected page/crop or engine settings/version changes. Reuse is *not* new corpus coverage or accuracy evidence.
- Prefer parsing source text and page geometry **once per PDF**, share it across Structure/Results/Equation/Bibliography source-level probes, and process independent PDFs in separate processes. For native text, avoid OCR. Selectively OCR original image crops/pages, with explicit user-visible budgets and unprocessed-page records, and cap Tesseract CPU threads (`OMP_THREAD_LIMIT=1`). Never silently upgrade a partial OCR run to whole-document success. Cache only successful OCR results; retryable errors/timeouts must remain visible.
- Pair each PDF text/index audit with a source-page formula-region audit, including a formally marked negative control or unverified fallback if no formula can be positively located. Plain-text Tesseract transcripts are **not** Texify formula recognition. Actual image-to-LaTeX output must be separately supplied or captured from the browser, retain raw and repaired output, compile using real MathJax including error-node inspection, and independently compare symbols and structure to human-readable original crops. Compilable LaTeX is not semantic correctness.
- Mark **PASS—Fully verified** only after appropriate exhaustive original-page ground truth and real final browser detection/model OCR; **FAIL—Known error**, **UNVERIFIED—Incomplete verification**, and **EXCEPTION—Demonstrably human-illegible** retain their established definitions. Cache hits, 0 exceptions, heuristic crops, or source-level candidate counts can never promote a document to PASS. Preserve and revisit documented known defects.
- Keep local caches **outside the deployment ZIP**. Use the cross-platform commands and manifest schema in `regression_tools/README.md`. Do not include source PDF bytes, generated image crops or machine-local cache paths in root ZIP patches. Keep small hashed per-file benchmark evidence and statuses in `regression/` and continue to run the project's JavaScript gates.

## v353 — Reusable regression tool and measured 50-PDF cold/warm benchmark

**Release:** v352 → **v353** because runnable test-source code was added; the only website source modifications are the bootstrap `VERSION` and HTML JS/CSS cache keys 352→353. All ten application subsystem JavaScript files, all OCR engines, MathJax postprocessing, index/recovery algorithms, cache schemas (Structure 45, Equations 23), UI and lazy-first-extraction Texify behavior remain unchanged. No production-browser claim is made.

**New tools:** `regression_tools/run.py` (parallel independent-PDF extraction, content-addressed gzipped per-page geometry, automatic explicitly *unverified* formula crop and optional selective Tesseract, stage-specific persistent cache, sidecar provenance), `regression_tools/detector_proxy.js` (loads *actual unchanged* v352 `41-equations-bibliography.js` source in a Node VM and runs preliminary native-text parsers across every page), `regression_tools/latex_check.js` (runs the application's actual LaTeX repair/stabilization functions with actual MathJax-full compilation for explicitly supplied original PDF/page-linked LaTeX, checks rendered error nodes). `tests/regression_runner_smoke.py` validates invalidation, duplicate/mismatched original bytes rejection, cache reuse, explicit OCR budget and sidecar compilation. Documentation in `regression_tools/README.md` and `js/README.md`.

**Reproducible executed benchmark:** Reused the previous paired **50 actual original byte-distinct PDFs**, not 50 newly sourced documents. Those files total **1,125 pages** (including 51 pages with fewer than 30 native-text characters). On a **fresh empty cache**, extraction of all page-level native text and geometry, source-level Results / raw Equation candidate / bibliography heading probe for all pages and one 160-DPI English Tesseract plaintext OCR proxy crop/fallback per original (50/50) took **16.345 s wall time**: extraction 0/50 cached, detector 0/50 cached, OCR 0/50 cached, **0 execution failures and 0 empty OCR transcripts**. Repeating the identical command against the persistent cache took **0.389 s wall time**, with **50/50 cache hits at each stage** (42.02× speedup on this machine). A previous partly warm run of the same corpus took 17.246 s (3 cached originals), followed by 0.563 s warm, consistent with the fully cold verification. The machine-readable document SHA list, counts, cache metrics and caveats are in `regression/infrastructure_benchmark_v353.json`; original PDF bytes are not redistributed.

**Native-source observations:** Entire 1,125-page source geometry was extracted, and the selected *source-level parser* functions ran on all pages with zero Node VM exceptions. Preliminary counts were **662 Results candidates, 4,835 lines containing raw equation-label candidates, and 22 bibliography-heading candidates**; *none* is a verified final index count. Only a single local plain-text crop per PDF received OCR, not whole-document scanned OCR, and model Texify was **not run**. A separate supplied Caffarelli 1989 formula sidecar (one manually source-checked LaTeX reference) compiled under MathJax after the real source stabilizer; the sidecar is not a new OCR recognition success. An offline runner cannot determine which OCR formula is mathematically correct without original human ground truth.

**Accuracy:** **0 fully verified PASS, 0 newly independently confirmed FAIL, 50 UNVERIFIED** for whole-document paired acceptance. Historical existing FAIL and UNVERIFIED records remain unchanged. These speed measurements establish test-workflow reuse, **not** faster production MathReader reading or OCR accuracy. The selected reference may be prose, a true formula, or a whole-page fallback; this uncertainty is preserved in each audit. End-to-end PDF.js indexes, live Texify/WebGPU→CPU, full scan OCR, source-to-formula semantic accuracy, and browser navigation are still unverified. The shortage of genuinely historical handwritten physics/engineering/geology originals remains open.

**Release gates:** run `python mathreader/tests/regression_runner_smoke.py`, every `node mathreader/tests/*.js`, `node --check mathreader/mathreader.js`, `node --check` each ten-part module and each JavaScript test, assembled manifest-order runtime syntax, 50 audited SHA-256s, per-document paired record and strict fresh-cache/warm-cache equivalence, root ZIP overlay and integrity. Distinguish actual test assertions, actual MathJax compilation, and unverified browser/model behavior in the release report.

---


## PERMANENT POLICY — Paired PDF text/index and within-document formula regression (effective 2026-11-05 Beijing UTC+08)

**User-mandated regression rule.** Every future campaign that tests the text or document indexes of a PDF must also audit mathematical formulas **from the same source PDF**. A corpus-level generic formula syntax test is useful but **cannot substitute for formula evidence tied to each original document**. Conversely, formula-focused campaigns on PDFs must check surrounding text/index context when appropriate, so layout, table/heading, and citation interactions are not missed. This policy applies to printed, scanned, image-heavy, historical, multilingual, technical, and handwritten documents, including non-mathematical negative controls.

For **every PDF** in a campaign, preserve an auditable pair of records:

1. **Document/text side:** SHA-256 of actual PDF bytes; discipline, source era, page count, native vs scanned/handwritten pages; page locations; Structure, Results, Equations (numbered-label index), and Bibliography (including false positives/negatives, ordering, citations, anchors, section/plot/table interference). Explicitly identify when only preliminary source-level parser output was executed rather than the final browser indexes.
2. **Formula side within that same PDF:** at least one physically grounded formula crop or an explicitly documented *negative-control page with no verified formula target*; original PDF page and crop coordinates, visible-reference transcription where possible; simple and complicated expressions, multiline/aligned, subscripts/superscripts, matrices/cases, fractions, Greek/CJK, equation tags and old scan degradation. Track the **actual recognizer/model output** separately from manually transcribed ground truth, native PDF text and any Tesseract/plain-text proxy. Store raw OCR LaTeX alongside repaired output, with changes/differences and edit/preview status where actual Texify is available. Never call a synthetic or hand-written formula an OCR recognition success.
3. **Compilation and meaning:** compile **every available actual recognized/postprocessed LaTeX candidate** with the real MathJax TeX parser (check rendered `merror` nodes, not just thrown errors); exercise independent TeX compilation for a representative stratified subset. Verify that aligned/matrix/cases/array tabs are preserved, stray tabs and malformed braces are rejected/repaired conservatively, and errors are exposed for manual editing. Then compare recognizable symbols, structure, exponents, bounds, signs and relations to the original visible formula. **Compilable LaTeX is not mathematically correct transcription**; do not guess mathematics to make syntax pass.
4. **General defect investigation:** reproduce on original PDF and original OCR output, explain mechanism and affected class, test true positives and adversarial negatives from **other** documents, make only the smallest conservative generic correction, and broadly rerun **both document indexes and formula OCR**. No filename-specific patches, no increased false positives just to improve recall, no hidden fallback and no destabilization of first-extraction-only Formula OCR, caching or WebGPU→CPU fallback.
5. **Performance and status:** record per-page/region OCR completion and timing, backend/model, failures, timeouts, fallback, model-load behavior and any deferred browser checks. Use four explicit statuses: **PASS—Fully verified** (exhaustive appropriate whole-document ground truth, including all human-legible formula targets and index items), **FAIL—Known defect**, **UNVERIFIED—Incomplete recognition/ground truth/end-to-end**, and **EXCEPTION—Demonstrably human-illegible region**. Handwriting is best effort, not automatically an exception; absence of detection, successful execution, valid LaTeX, or unchanged inventories never proves accuracy. Preserve open failures in `REGRESSION.md`.

**Required limitation disclosure.** If original PDFs, an actual image-to-LaTeX recognizer, browser model assets, or exhaustive ground truth are unavailable, run the available independent checks, attach evidence, and classify the missing stages **UNVERIFIED**. This is not a license to declare 100% formula-OCR or PDF-index accuracy. Every new PDF/text regression package must update this ledger and include a per-file paired formula audit (JSON or similarly inspectable record), even when all code remains unchanged.

## v352 documentation-only — 50-PDF paired text and formula regression (2026-11-05 Beijing UTC+08)

**Release classification:** documentation and evidence only; runtime stays **v352**. No JavaScript subsystem, detector, recognition model, cache schema, OCR initialization, or fallback changed. `regression/paired_text_formula_50_20261105.json` is the authoritative per-file audit with 50 SHA-256 hashes, page counts, source-level text/index samples, selected formula region coordinates, OCR-proxy transcript/timing, compilation linkage and explicit verification gaps. This campaign **reuses some previously tested originals** to exercise the new paired requirement; it is not 50 newly discovered or independently sourced historical works, and PDF/crop image bytes are not shipped in the patch.

**Corpus:** 50 actual byte-distinct PDFs, **1,125 pages** across 8 handwritten/applied inverse-problem or seminar notes; 7 historical research PDFs (including Ahlfors 1973, Yau 1978, classical Banach-space work, a 1988 probability/Riesz-transform paper, Simon and Caffarelli); 13 modern mathematical papers/notes; 12 applied/computation/engineering/AI/technical documents; 7 nonmath or linguistic/prose negative controls; and 3 bilingual mathematical works. The corpus includes formulas of varying visual complexity and dates but still lacks independent original pre-1980 handwritten physical-science/engineering/geology field notebooks. Some modern mathematical items concern geometry; the overall corpus is not restricted to geometry.

**Observed local text/index proxy execution:** Traversed all 1,125 source PDF pages with PyMuPDF, including **51 pages with fewer than 30 native-text characters**. Detected mathematical glyph evidence on 889 pages by a simple Unicode screening heuristic; this is **not** an inventory of formulas. On 144 selected pages (beginning/mid/end and applicable existing verified-formula pages), invoked the **actual unchanged v352** `detectedStructureResult`, `structureResultsIndexNavigationPage`, `equationLabelCandidatesInLine`, and `bibliographyHeadingText` in a Node VM on **6,187 geometric text lines**. Execution errors: **0**. Diagnostic counts: **36 preliminary Results entries; 345 lines with raw equation-label candidates; 5 bibliography-heading candidates**. These are **not full-document final index totals**: PDF.js extraction, complete Structure inference, document-wide bibliography assembly, equation sequence reconciliation, gap recovery and page-anchored browser navigation were not run. Raw equation candidates (especially citation/measurement/section numbers) must not be interpreted as accepted Equations or as confirmed false positives.

**Observed formula side, same 50 source PDFs:** Rendered one formula candidate region or one explicitly unverified fallback/negative-control page per PDF. Ran **50/50** local Tesseract English plain-text OCR proxy calls with `OMP_THREAD_LIMIT=1`, PSM 6, approximately 122-DPI-equivalent rendering, **0 execution failures, 0 empty transcripts, approximately 19.7 seconds cumulative per-call OCR time**. The crops comprise 30 native formula-region candidates, 8 handwritten whole-page samples, and 12 page fallbacks/negative controls. Some native regions may include surrounding mathematical prose rather than a verified formula; `formula_sample.crop_kind` and `native_formula_line_excerpt` disclose this ambiguity. **This is not Texify, not LaTeX-generating OCR, and not a full OCR pass across the 51 low-text pages.** Recognized text is retained as evidence, not passed off as valid mathematical LaTeX.

**Source-verified compilation subset:** Exactly **18 hand-checked LaTeX reference formulas from seven matching PDF SHA-256 sources** (Ahlfors, Yau, 1988 Riesz-transform paper, Caffarelli, Brendle, a 2023 determinantal paper and a 2026 AI/technical paper) remain part of the supplied v352 `regression/formula_syntax_v352.json` and `tests/formula_latex_syntax_regression.js`. This is the **only** within-source subset with independent visible-page reference LaTeX here; 43 other PDFs do **not** have independently source-transcribed LaTeX samples or live Texify output and remain **UNVERIFIED** for formula compilation/recognition. The established full syntax benchmark additionally contains hand-curated and adversarial artificial samples (228 MathJax compilations when mathjax-full is available) that are not independent PDF OCR successes. Do not use them to inflate formula-recognition sample size.

**Outcome and non-closure:** **50 UNVERIFIED / 0 fully verified PASS / 0 newly confirmed FAIL / 0 new EXCEPTION** for whole-document paired acceptance. This does not reclassify pre-existing documented FAIL cases involving historical Gromov/Pisier/Ahlfors/Caffarelli/Simon equation or Result omissions, dictionary/index false positives, or handwritten OCR weaknesses. The current v352 parser probes and source reference compilation did not reproduce a newly independently verified generalized application defect; the absence of additional positives is not evidence of completeness. Next: real first-extraction Texify image OCR on crops, paired page-by-page MathJax compilation plus manual symbol-level comparison across all representative PDFs, browser final four-index comparison and complete independent ground truth. No speculative detector or OCR edits are authorized on this evidence.

**Fresh executed local release gates (this campaign):** all ten bundled regression scripts PASS (**1,109/1,109** assertions, including **228/228** full MathJax compilations); a separate, directly source-linked MathJax run compiled the **18/18** PDF-page-anchored reference formulas successfully; the pre-existing v352 independent pdfLaTeX validation document recompiled successfully (**46 pages** of representative cases, not 46 independently recognized PDF formulas). The bootstrap, all ten modules, all tests and assembled ten-module runtime passed `node --check`. A separate data-integrity gate verified 50/50 paired audit entries, 50 distinct original SHA-256s, valid sample-page and crop coordinates, and 18 source reference-case identifiers. **These gates establish code/syntax execution, not whole-document semantic correctness or Texify recognition.**

**Machine-verifiable gates:** run every `mathreader/tests/*.js` individually, use `NODE_PATH` or installed mathjax-full to ensure the optional 228 MathJax compiler gate **actually runs**; run `node --check mathreader/mathreader.js` and each ten-part module, assemble the ten modules in `PARTS` order and syntax-check, validate the 50 audit entries (per-document both text + formula, SHA uniqueness, page/crop coordinates, 18 existing reference-case links, explicit UNVERIFIED state), and test root ZIP integrity. Syntax/pass of this workflow is not production-browser acceptance.

---


## v352 — Formula OCR LaTeX alignment-scope stabilization and broad syntax compilation (2026-11-05 Beijing UTC+8)

**Authoritative baseline:** complete v351 source and packaged policies. **Code version v352.** This is a focused formula-OCR *postprocessing/preview safety* correction, not a new OCR model, a change to mathematical document detection, or an attempt to guess mathematical content. The Structure and Equation index cache schemas remain 45/23. Formula OCR lazy loading and WebGPU→CPU fallback remain unchanged.

### Confirmed reproduction and root cause

- The user reported multiline Texify output with a stray alignment tab inside a brace-delimited integration subscript: `\int_{|z|\,&=\,r}` within `\begin{aligned}...\end{aligned}`. An alignment tab is valid at the table-row level (e.g. next row `&=...`) but **invalid inside an ordinary braced mathematical subscript**, so actual MathJax parsing produces a math error. Blind global removal would corrupt legitimate `aligned`, `array`, `cases`, `matrix`, `pmatrix`, `alignedat`, etc.
- The production stabilization chain (`normalizeOcrLatex` → `repairOcrLatex` → `stabilizeOcrLatexSyntax`) previously repaired braces/environments but did not distinguish nested illegal `&` from legitimate table tabs; manual-only `improveOcrLatex` operations for inner `\tag`, raw `%`/`#` were likewise not automatically applied.
- Real MathJax may **resolve its promise even when it renders a `<mjx-merror>` node**. Previous preview code therefore could visually contain a TeX error without setting its error indicator.

### Conservative general-purpose changes

1. New `repairOcrMisplacedAlignmentTabs` walks OCR TeX source while tracking brace depth, active alignment environments, escaped characters, and text-like command arguments. It preserves `&` only at the proper alignment-environment body depth, preserving nested matrix/cases cells even inside fractions. Stray math-position `&` is dropped (no mathematical symbol invented), while literal ampersands inside `\text{...}`, `\mathrm{...}` and `\operatorname{...}` are escaped as `\&`. Existing `\&` is untouched. Positive controls cover ordinary matrix/cases/array/alignedat and nested tables.
2. The automatic stabilization path now applies the already-established, non-inferential conversion of invalid `\tag{...}` *inside* inner math-table environments to a visible inline `\qquad(...)`, and escapes raw `%` and `#` before the MathJax preview. No OCR retry or model invocation is added.
3. After typesetting the Formula OCR preview, inspect MathJax's rendered error nodes (`mjx-merror`/`merror`). If present, mark the preview erroneous, downgrade an automatically `clean` saved result to `review`, and show “LaTeX syntax needs review · edit the source”; never label an error-node preview clean. Preserve editable original and avoid fabricating omitted math.
4. Version/cache-busting 351→352 in the bootstrap and HTML, with matching inherited maintenance assertions. No structure/equation index version increase, sidebar changes, model-preload changes, or recovery expansion.

### New regression corpus and independent compilation gates

- `regression/formula_syntax_v352.json`: **136** hand-curated reference inputs, including **18 manually transcribed, visually checked mathematical expressions from seven actual archived/modern PDFs** (Ahlfors 1973, Yau 1978, Riesz-transform paper 1988, Caffarelli 1989, Brendle 2007, generalized Laplace expansion 2023, and a 2026 technical paper) plus the user-provided OCR error example. The remaining cases deliberately cover common simple/complicated mathematical notation across algebra, complex analysis, PDE/geometry, probability, number theory, engineering, matrices/arrays and multiline layouts. Exact PDF SHA-256 values and inspected pages are in the audit JSON.
- `tests/formula_latex_syntax_regression.js`: 125+ reference formulas, the exact full user string, **72 systematic misplaced-tab mutations**, 11 valid-alignment/text preservation controls, and seven additional malformed-syntax controls. **879 passing source/structure assertions and 228/228 passing real MathJax-full parser compilations** in the local test environment. MathJax is optional for a plain Node run; when absent, the test explicitly reports syntax compilation as **UNVERIFIED**, rather than claiming it passed.
- `tests/formula_preview_compilation_regression.js`: **12/12** lifecycle assertions on the actual preview function, covering success, MathJax error-node behavior, error clearance, and empty-preview reset.
- Independent **pdfLaTeX with amsmath/amssymb/mathtools**: **46/46 postprocessed representative formula pages compiled** into one validation PDF without TeX errors. A pre-repair control with the raw bad `&` failed as expected; only the postprocessed result is counted as passing. The user example's ambiguous trailing `-2` was retained and was **not** silently interpreted as an exponent.
- All inherited **218/218** assertions remain passing. Full source-level total: **1,109/1,109** (`218 + 879 + 12`). Bootstrap, ten modules, tests, and assembled ten-module runtime pass JavaScript parsing checks. Validate ZIP overlay and integrity before delivery.

### Mandatory limitations and deferred risks

- These checks prove **LaTeX syntax compilability only for the specific 228 MathJax outputs and 46 pdfLaTeX samples**; they do **not** prove that an arbitrary future Texify output will be compilable, and do not prove symbol-level correctness. For example, the user's formula ends in `-2`, which is syntactically valid yet may reflect a missed exponent; this **cannot safely be repaired by guessing**.
- **UNVERIFIED:** real Texify image-model inference on original rendered PDF formula crops, browser end-to-end extraction, production MathJax load/failure behavior, image-only/handwritten scientific document recognition, full-page and whole-document mathematical transcription accuracy. The corpus consists of hand-checked references and deliberate synthetic corruption scenarios, **not** 228 independent image-OCR successes. Full ground-truth acceptance requires cropping the original formulas, running MathReader's real OCR in a browser, and comparing source symbols.
- Unsupported macros, missing OCR glyphs, ambiguous bracketing, and malformed TeX not belonging to a safely understood syntax class remain review-required. The preview flags a real MathJax error instead of inventing a repair. This is a deliberate precision-first boundary; do not claim an impossible “all future formulas compile” guarantee.
- Do not turn this into a general-purpose LaTeX formatter, strip legitimate matrix/cases alignment tabs, change inference-token budgets, introduce filename-specific exceptions, or automatically start the model before the first image-formula extraction.

### Deliverable files and reproduction

Changed: `index.html`, `mathreader.js`, `js/10-formula-ocr.js`, inherited cache-key assertions in `tests/equation_progress_regression.js`, `tests/formula_ocr_lazy_regression.js`, `tests/maintenance_integrity_regression.js`, new `tests/formula_latex_syntax_regression.js`, new `tests/formula_preview_compilation_regression.js`, new `regression/formula_syntax_v352.json`, new `regression/formula_syntax_v352_audit.json`, `js/README.md`, and `REGRESSION.md`. All paths are beneath root `mathreader/` and delivered as one ZIP overlay. Run every `node mathreader/tests/*.js` independently, `node --check` on every module/bootstrap, assemble in `PARTS` order, then `node --check` on the assembled file. Optional MathJax-full is required to reproduce the **real MathJax** 228-compilation gate. The TeX check requires `pdflatex` plus amsmath/amssymb/mathtools.

---

# MathReader Regression / Behavioral Audit Record — v351

## v351 — Conservative project-wide source cleanup (2026-11-05, Beijing UTC+08)

**Authoritative baseline:** complete locally assembled v350 source, verified byte-for-byte against the supplied v350 patch for its changed members. **Code version v351**. This is strictly a maintainability revision: **no intentional detector, OCR, interface, recovery, search, annotation, document-state, caching-schema, or formula-extraction behavior change**. Preserve the single ES module assembled in the original ten-part order, the first-extraction-only formula model loading, the initialization overlay fail-release behavior, and the intentional WebGPU → CPU OCR fallback. Structure index version **45** and Equation summary version **23** remain unchanged.

### Scope and method

- Audited **all ten JavaScript subsystems** as a single lexical module using JavaScript AST identifier-reference counts, not per-file searches. In a module, top-level declarations are private to the assembled source and cannot be called by inline HTML unless explicitly exposed; no removed declaration was referenced by another part, its UI event bindings, bundled tests, or HTML. No dynamic `eval`-based dispatch was identified for these names.
- Removed **25 unreachable private function declarations**: 19 initially reference-free declarations plus 6 transitive helpers that became unused after the first pass. Categories: orphaned workspace/document-map helper and search/navigation predicates; superseded OCR formatting helpers; retired vector/OCR fusion scoring and layout heuristics; unconnected old equation-edit functions; unused equation/Results reconciliation helpers. This does **not** disable any reachable UI command or detector path. No exported or externally called function was removed.
- Removed **4 unreferenced top-level constants** (one unused DOM lookup and three dormant Results/Structure pattern strings/regexes). None performed a network request, modified state, attached a listener, or supplied a live indexer.
- **Every one of the 582 retained function declarations is byte-for-byte identical** in v350 and v351 (verified by AST extraction). No active function body, live event handler, OCR backend, geometry heuristic, cache format, PDF text extractor, browser preference, or UI stylesheet was rewritten. This was a removal-only code cleanup, not a performance-optimization rewrite or API redesign.
- Advanced bootstrap and HTML JavaScript/CSS cache keys **350 → 351** only. Updated the two cache-version assertions, added a 24-assertion manifest/lazy-OCR maintenance regression and a short cross-module maintenance note in `js/README.md`. No cache-schema or detector-index version increment was appropriate.

### Validation gates actually run

- Node syntax: `node --check` on bootstrap, **all ten JavaScript subsystems**, and **all eight regression test files** — PASS.
- Assembled runtime: concatenated the ten parts **in the manifest order** into one ES module and ran `node --check` — PASS.
- Seven inherited regression files: bibliography 15, embedded-outline titles 25, equation-progress 33, formula initialization/timeout/error/fallback 37, first-extraction lazy OCR 28, precision context 33, Results/TOC 23 = **194/194** — PASS. New maintenance/manifest/cache/lazy-OCR wiring assertions: **28/28** — PASS. **Total 218/218 local assertions**.
- AST-based cross-version audit: **607 v350 function declarations, 25 removed, 582 retained**, with all retained source bodies byte-identical — PASS. After removal, the complete ten-module AST has **no unreferenced named function declaration or top-level variable binding** using this static lexical criterion. That criterion is a maintenance check, not a general-purpose proof of program correctness.
- Isolated Chromium DOM/CSS smoke: actual initialization overlay markup, styling and modal function; verifies visibility, focus, background `inert`, release, and focus restoration — PASS. This is not full MathReader/browser/Texify initialization or PDF-usage acceptance.
- Root ZIP overlay integrity and exact member comparison must be verified before delivery. No archived PDF corpus was rerun with an end-to-end production PDF.js/Texify pipeline during this source-only cleanup; all prior full-document ground-truth gaps remain open.

### Open risks and acceptance boundaries

- Although lexical unreferenced-function removal leaves all retained function bodies untouched, static reference analysis cannot replace full production-browser acceptance, cross-browser clipboard/device behavior, or real long-running WebGPU/CPU Texify loads. **UNVERIFIED:** deployed browser, OCR initialization/failure under real network conditions, actual production OCR, full-dataset mathematical ground truth, and handwritten historical scientific notebooks outside pure mathematics.
- Earlier source-level regressions and documented FAIL/UNVERIFIED cases (historical OCR, false positives awaiting browser acceptance, handwritten notes, etc.) retain their original classifications; no detection improvement is claimed by this cleanup.
- Further changes should remain targeted. Do not combine speculative restructuring of large detector functions (`detectOutlineFromTypography`, `buildStructureIndex`, `buildEquationLabelIndex`, etc.) with a maintenance-only release. Only refactor live algorithms when equivalence is independently demonstrated and positive/negative whole-document controls exist.

### Changed files and delivery

Root overlay only: `mathreader/index.html`, `mathreader/mathreader.js`, `mathreader/js/00-core.js`, `mathreader/js/10-formula-ocr.js`, `mathreader/js/11-formula-vector.js`, `mathreader/js/20-selection-annotations.js`, `mathreader/js/40-outline-structure.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/js/50-references-search.js`, `mathreader/js/README.md`, `mathreader/tests/equation_progress_regression.js`, `mathreader/tests/formula_ocr_lazy_regression.js`, new `mathreader/tests/maintenance_integrity_regression.js`, and `mathreader/REGRESSION.md`.

---

## v350 — Lazy Formula OCR initialization on first extraction (2026-11-05, Beijing UTC+08)

**Authoritative baseline:** full user-supplied v347 ZIP, overlaid with the v348 and v349 root patches (in that order). **Code version v350**. This update corrects the activation timing of the v349 blocking initialization dialog; it is a UX/runtime lifecycle change, **not a recognition, mathematical detection, or OCR backend change**. Structure cache version **45** and equation summary version **23** remain unchanged. The ten-part single-module assembly architecture and intentional WebGPU → CPU fallback are preserved.

### Behavior contract

1. **No automatic Formula OCR model load during ordinary reading.** Opening or restoring a PDF, idle callbacks, entering/leaving Formula OCR selection mode (`F`, toolbar, or command palette), switching image OCR engines, and `Reset OCR` now **do not import/create the Texify model** or display the blocking dialog. PDF.js's separate light core preload remains in place and is not a Texify preload. The formula selection tool is enabled with an open PDF **before** the image model is ready. Rectangle selection can begin immediately.
2. **First actual image-formula extraction initiates loading.** After a user completes a sufficiently large rectangle selection, the image recognition call obtains `ensureMathOcrPipeline()`; only then is the v349 full-app initialization dialog shown, once, for initial import/model creation. Reuse of an already ready model does not re-lock the reader. Simply toggling formula selection or cancelling a too-small rectangle never initializes it. A successful PDF-vector extraction is model-free, including when the image model is not installed.
3. **Failure never strands the reader.** Preserve the v349 `finally` dismissal, focus and pre-existing `inert` state restoration, shared-promise behavior, timeout and late-pipeline disposal. The image-engine failure flag disables further image-formula selections until an explicit `Reset OCR`/engine change, preventing automatic repeated blocking. **Native PDF reading, document navigation, annotations, search and usable PDF-vector formula extraction remain available.** After an image-model failure, attempting PDF-vector mode where no vector formula is available reports that the user must reset OCR for image fallback; it does not silently reload the failed model. `Reset OCR` clears failure and unloads the engine but waits for the **next actual extraction** to initialize it.
4. **No hidden background reinitialization.** Removed the prior `scheduleMathOcrPreload()` scheduler and all calls from document-opening, recognition-failure cleanup and settings/reset handlers. Startup/busy indicators use concise text instead of misleading “preloading” messages. Changing default extraction mode updates toolbar availability immediately.
5. **No scope expansion.** The PDF text/document OCR, equation-indexing OCR, gap recovery, PDF vector extraction, and model/backend selection semantics are not deliberately changed. The initialization overlay continues to block the app **only during first image-model initialization** (or an explicit model load following reset), not during ordinary formula inference.

### Local regression and verification

- Run `node mathreader/tests/*.js` individually (shell glob expansion) and report per-test counts. The baseline 129 assertions remain green. The existing modal lifecycle tests now exercise lazy-source constraints as well as success/error/timeout/retry/fallback, with **37 assertions**; the new `tests/formula_ocr_lazy_regression.js` exercises source-level no-eager-import paths, actual selection-mode functions, extraction entry, PDF-vector bypass, manual reset, failure latch and busy states, with **28 assertions**. **194/194 assertions passed**.
- `node --check` on the bootstrap, ten subsystem JS modules, and every bundled test passes. Concatenate all ten runtime parts in manifest order and `node --check` the assembled `.mjs` artifact. Root ZIP integrity/overlay consistency also passes.
- **UNVERIFIED:** production browser with real Texify model download, CPU/WASM/WebGPU execution, first-drag pixel-to-LaTeX correctness, model switching while a real browser is stalled, mobile interactions, browser caching after deployment. Node/VM path tests verify when loading is initiated but are not a substitute for full production browser/OCR acceptance; no mathematical ground-truth document has been newly fully verified. The 120-second async timeout cannot unblock a synchronously frozen browser event loop.

### Changed files / delivery

`mathreader/index.html`, `mathreader/mathreader.js`, `mathreader/js/10-formula-ocr.js`, `mathreader/js/11-formula-vector.js`, `mathreader/js/60-notes-bookmarks-data.js`, `mathreader/js/70-command-ui-runtime.js`, `mathreader/tests/equation_progress_regression.js`, `mathreader/tests/formula_ocr_initialization_regression.js`, **new** `mathreader/tests/formula_ocr_lazy_regression.js`, and `mathreader/REGRESSION.md`. Deliver only a **root ZIP overlay patch**. Do not claim deployed-browser acceptance from this local check.

---

## v349 — Blocking Formula OCR model initialization with guaranteed UI release (2026-11-05, Beijing UTC+08)

**Authoritative source:** full uploaded v347 ZIP with the supplied v348 root source patch applied. **Code version v349**; MathReader remains one assembled JavaScript module, with the exact original ten-file manifest order. This is an OCR-startup usability and failure-recovery change, **not** an OCR/detection-model or indexing algorithm change. Structure index version **45** and Equation summary version **23** are unchanged because their serialized detector semantics did not change.

### Behavior and scope

1. **Initialization-only blocking dialog:** Each initial Texify runtime/model load, including automatic idle preload after a PDF opens, displays a compact, full-viewport bilingual floating dialog: “Initializing formula OCR” / “正在初始化公式 OCR”. An underlying `inert` lock preserves and restores every previous element's existing inert state; a capture-phase keyboard guard blocks MathReader shortcuts and file drops, and focus enters the dialog. Browser reload remains possible as an escape hatch. This lock is **not** used for ordinary formula inference; the existing nonmodal formula processing indicator remains unchanged. There is no fake percentage, spinner, animation or model-download progress counter.
2. **Successful engine load:** The existing Texify backend plan, including intentional **WebGPU q4f16 → CPU** fallback, is not altered. On successful initialization, the overlay is removed, inert states and prior focus are restored, and ordinary reader interaction resumes. Simultaneous calls share one initialization promise rather than creating competing blocking overlays.
3. **Failure/timeout release:** Model import and pipeline creation share a **120-second overall asynchronous initialization deadline**. Failed requests, import errors, backend errors, and watchdog expiry all take the same `finally` release path. The failed OCR engine stays unavailable, but PDF navigation, reading, annotations, search and unrelated controls are not disabled afterward. A small error notice confirms reading remains possible and points to **Settings → Formula OCR → Troubleshooting → Reset OCR** for retry. Changing the OCR engine mode is another explicit retry path. A failed preload is latched to avoid immediate automatic re-preloads reblocking the user; a successful manual retry clears that latch. If a timed-out pipeline resolves later, it is discarded/disposed, not installed after the error.
4. **Deadline limitation:** The 120-second watchdog applies to asynchronous work while the browser event loop remains responsive; it **cannot forcibly terminate a synchronous browser-main-thread freeze** or guarantee reclamation of a stalled third-party load request. The overlay is not equivalent to an AbortController cancellation of model downloads. Do not promise automatic unlock during a browser process hang. User may reload the page.

### Fresh verification

- **Existing tests:** bibliography 15, embedded-outline title 25, equation progress 33 (HTML cache key updated to 349), precision context 33, Results/TOC 23 = **129/129** legacy assertions passed.
- **New startup regression:** `tests/formula_ocr_initialization_regression.js` has **36** Node/VM assertions on actual v349 initialization and modal functions, including overlay visibility, inert state restoration, focus, capture keyboard/drop blocking, concurrent calls, failed model, manual retry, WebGPU fallback, deadline, stale late-arriving pipeline disposal, failed preload latch and bilingual/static DOM contract. **Combined: 165/165 assertions passed.** Failure cases deliberately log mocked backend errors to the Node console.
- **Isolated Chromium DOM/CSS smoke:** with the actual v349 modal markup, CSS and modal-function source, Chromium rendered the floating card and verified the dialog is focused, header becomes inert, and release restores focus and access. This was **not** a production MathReader/browser Texify test; the network-hosted end-to-end application could not be loaded by the browser smoke environment.
- **Syntax/assembly/packaging:** run `node --check` on bootstrap and each JavaScript file, concatenate the ten source modules and run syntax validation of the resulting assembled ES module; run all six bundled tests and verify ZIP CRC/member paths. No direct OCR downloads, CPU/WASM/WebGPU inference, PDF.js document acceptance, mobile-device test, 120-second wall-clock watchdog experiment, or deployed-site test was performed.

### Outstanding risks and follow-up

- **UNVERIFIED:** real Texify model download times on slow connections, actual production browser initialization and fallback under GPU failure, full application with a PDF, mobile focus handling, very long model-download/CPU hangs, multiple document switches during an active initialization, accessibility screen-reader behavior and full usability of all functions after real network failures. A simple DOM smoke is not an end-to-end validation.
- **No detection accuracy claim:** The historical scanned/handwritten issues, missing mathematical results/equations, pending PDF corpus work and v348 precision fixes retain their previous PASS/FAIL/UNVERIFIED dispositions. No recovery expansion to Structure/Results/Bibliography was introduced.
- **Changed files:** `mathreader/index.html`, `mathreader/mathreader.css`, `mathreader/mathreader.js`, `mathreader/js/00-core.js`, `mathreader/js/10-formula-ocr.js`, `mathreader/js/70-command-ui-runtime.js`, `mathreader/tests/equation_progress_regression.js`, `mathreader/tests/formula_ocr_initialization_regression.js` (new) and this `mathreader/REGRESSION.md`. **Root-level ZIP patch** only. Browser usability acceptance should be performed before treating the release as production verified.

---



## v348 — Conservative precision fixes for Results and Equation labels (2026-11-05, Beijing UTC+08)

**Authoritative baseline:** user-supplied complete v347 source ZIP, with all five previously issued documentation-only regression addenda applied in order. **Code version v348**; no independent recovery machinery was added to Structure/Results/Bibliography and the intended WebGPU OCR → CPU fallback remains unchanged. This release addresses repeatedly observed *class-level false positives*, rather than optimizing one named PDF. **The 100% fully-verified printed-document acceptance goal is unchanged, and no document in this campaign has been independently certified fully accurate.**

### Confirmed source-level defects and corrections

1. **Back-of-book index headwords misread as Results — source-level fix, production UNVERIFIED.** The Oxford technical-writing text (`77c3888b-c5fb-4c8f-ad75-eea45ff656de.pdf`, PDF p.436) had `Definition · p.436` from the headword **Definition** beneath the **SUBJECT INDEX** running header. The McGraw-Hill idiom phrase-finder index (PDF p.211) had `Remark I` from `remark I didn’t ...`, beneath **Phrase-Finder Index**. New `structureResultsIndexNavigationPage()` treats a page as index navigation **only** when a specific index title is visible near the top of a sufficiently dense page (>=12 extracted lines). It suppresses **Results indexing only** for those pages; the direct standalone declaration parser and document bibliography/Structure remain unchanged. Positive controls preserve genuinely unnumbered `Definition. Let ...`, standalone `Definition`, numbered `Lemma 2.2`, and mathematical pages without index headings. Residual risk: damaged/missing index running headers may still create false positives; a genuine Result embedded inside a dense page explicitly titled Index could be suppressed. Do not infer that all index layouts are fixed.
2. **Plot decimal ticks indexed as Equations — source-level fix, production UNVERIFIED.** In an AI/ML plot (`2610.07774v1.pdf`, PDF p.6), isolated `0.04` graph ticks appeared as `(0.04)`. A new **bare-decimal-only** vertical-tick guard rejects only a close, nearly same-x run of at least **four** strictly monotonic `0.xxx` ticks with roughly uniform *numeric step*. The preexisting horizontal-axis and table guards remain. This guard feeds the existing hard rejection path, including the candidate pool; parentheses-bearing equation tags, larger 1.x equation families, nonmonotonic measurements and isolated old-paper dotted labels remain eligible. Negative test: `0.118, 0.129, 0.132, 0.346` in technical performance tables must **not** be interpreted as evenly spaced axis ticks. Remaining risk: a different axis scale (larger magnitude, negative, fewer ticks, uneven scales) is outside the deliberately narrow fix.
3. **Split short CJK section heading promoted to Equation — source-level fix, production UNVERIFIED.** A Chinese technical document (`double_spiral_surface_revision_spec.pdf`, PDF p.12) splits `7.3` and the two-character section title `图表` into adjacent same-baseline lines. The existing same-row heading classifier required >=3 Han characters and missed this case. The new >=2-Han branch requires a **short title**, immediate horizontal continuation, same-baseline proximity and no strong mathematical signal. Real math displays on different baselines and distant captions remain unaffected in dedicated controls. An existing section-list TOC line `7.2 Rutherford 散射` is likewise classified as non-equation heading context on two independent manuscript editions. Watch for genuine numbered formulas adjacent to short CJK captions; page-by-page verification remains necessary.
4. **Historical split theorem label — conservative supporting correction, not closed as an end-to-end defect.** The Caffarelli–Gidas–Spruck 1989 local campaign reported a missing `Theorem 1.3` where `THEOREM`, `1.3. Let ...` and other fragments were interleaved. The v348 standalone result parser can associate a nearby numeric+statement fragment on the same baseline even when other extracted fragments intervene, with bounded x position and y distance. Positive and negative controls cover interleaved ordering, real numbered Lemmas, folios, other columns, and distant fragments. **Important ambiguity:** independent new PyMuPDF page-3 geometry already returned `Theorem 1.3` using **both** v347 and v348, unlike the earlier whole-document VM campaign's geometry. Therefore the historical omission remains **UNVERIFIED as resolved**, rather than being declared fixed; PDF.js/PyMuPDF line joining and actual end-to-end sequence normalization must be checked.

### Fresh nonregression evidence and scope

- **Bundled Node assertions:** 96 existing assertions pass unchanged in meaning, with the cache-buster check advanced to v348; **33 new focused class-level assertions** are added by `mathreader/tests/precision_context_regression.js`, **129/129 total**. They test conservative positives/negatives, index-page wiring, and fragmented theorem/section/axis shapes. JS bootstrap, all ten subsystem files and their one-module assembled runtime pass Node syntax checks.
- **Original-PDF-derived inspection:** pages checked independently using extracted visual-line geometry for the original p.436 writing index, p.211 idiom phrase index, p.6 AI graph, p.12 Chinese section, p.3 Caffarelli theorem, and other older controls. Original-source geometry: index false Results disappear (1→0 on each negative page); AI page has two separately aligned vertical axis-tick columns; short Chinese split section has same-row heading evidence (false→true). **This is a PyMuPDF-based source-level proxy**, not production PDF.js extraction or Texify OCR.
- **Broad differential regression:** **23 original, byte-distinct PDFs; 114 sampled pages; 5,732 native-text visual lines** compared using the actual v347 and v348 Results parser and bare-equation context functions. Remaining difference pages: AI chart p.6, Chinese section p.12, writing subject index p.436, idiom phrase index p.211, and two related mathematical-TOC pages containing short mixed-language section titles. No unrelated Results-label differences were observed on the sampled pages. This is a *sampled comparative test*, not full-document ground truth or a complete 150+ PDF replay. Native-text PDFs only in these comparisons; OCR/Texify and all downstream reconciliation are **UNVERIFIED**.
- **Version/cache migration:** `mathreader/mathreader.js` and `mathreader/index.html` change 347→348; `STRUCTURE_INDEX_VERSION` changes **44→45** and `EQUATION_INDEX_SUMMARY_VERSION` **22→23**, avoiding use of stale cached Results/Equation indexes under revised detection behavior. No OCR cache format, UI layout, gap-recovery algorithm, export/import format, user edits, or WebGPU→CPU fallback was deliberately changed.

### Open issues / non-acceptance

- The four class-level false-positive examples have **fresh source-level fixed** evidence; their status as **fully verified production/browser fixes remains UNVERIFIED**. Do not remove original evidence or reclassify the corresponding historical failed documents as fully verified. Recheck real PDF.js text lines and live browser indexes, persisted-cache migration, Structure/navigation targets, and OCR fallback before closing them.
- Historical Caffarelli Theorem 1.3, Gromov/Caffarelli/SPS missed labels, Ahlfors corrupted native equation labels, Pisier bibliography OCR, handwritten recognition, and all other previously documented exceptions **remain open** unless independently verified.
- Axis-tick detection changes are deliberately limited to uniform small positive decimals; real physical data in tables, low-quality OCR text with fragmented headings, two-column body labels, and genuinely unnumbered mathematical results on explicit index pages need manual regression. No claim of zero false negatives across all mathematical domains.
- Production-browser execution, real Texify CPU/WebGPU OCR, long scanned-book whole-document accuracy, and human-audited 100% item-by-item ground truth were **not performed**. Test counts, valid ZIP and a clean runtime syntax check are *not* full mathematical accuracy proof.

### Release files and gates

Root-level `mathreader/` **patch ZIP** contains modified `index.html`, `mathreader.js`, `js/00-core.js`, `js/41-equations-bibliography.js`, `REGRESSION.md`, `tests/equation_progress_regression.js`, and new `tests/precision_context_regression.js`. The four pre-existing cross-field machine-readable audit JSON files are retained unchanged for reproducible cumulative documentation when the v347 addenda have not been separately deployed. Validate JS and assembled-module syntax, 129 tests, version/cache keys, ZIP member CRC, and exact file list before publication. **No production-browser acceptance** was performed.

---

## v347 documentation-only regression — historical and handwritten material outside pure mathematics (2026-11-05, Beijing UTC+08)

**Baseline:** the user-supplied full v347 ZIP, unchanged application code, no version increment. This is a *new regression measurement*, not inherited evidence from v344 or earlier. It deliberately sought older scientific scans, handwritten applied-science notebooks, and engineering negative controls. **Scope limitation:** the historical *non-pure-mathematics* PDFs located on the public web could be inspected remotely but could not be downloaded into the local detector environment. Consequently this campaign **partially meets**, but does not complete, the requested old-and-handwritten non-pure-math coverage. An archival probability/harmonic-analysis paper is included as a clearly identified **pure-mathematics historical control**, not misrepresented as outside pure math.

### Test environment and method (actual observations)

- **Actual source:** the original v347 `mathreader/js/41-equations-bibliography.js` was evaluated in Node's VM. Its `buildStructureIndex()` and `buildEquationLabelIndex()` ran against full-document, page-by-page line geometry using stubbed browser-only UI, persistence, scheduling, and optional posterior equation-image-assist mechanisms. Test harness only; **no MathReader production source was changed**. Assertions passing on simulated geometry do not imply a PDF.js browser pass.
- Native-text proxy: all pages with substantial native text were extracted from the actual PDF via PyMuPDF span/line coordinates. **This is not identical to MathReader's PDF.js extraction and can differ in joining/line positioning.**
- OCR proxy: every page without usable native text was rendered grayscale at **160 DPI** and processed once by **Tesseract CLI, English, `--psm 3`**. OCR word confidence and bounding geometry were grouped into full-page visual lines and fed into the v347 detector with `ocrSource: true`. No OCR files or cached geometry from older regression campaigns were substituted.
- The image-only pages were all processed, including the single diagram page in the engineering PDF. OCR time was measured per page, not inferred from file length. **Production browser Texify, WebGPU, CPU fallback, and OCR scheduling were not executed.** The v347 automatic *equation-margin posterior image assist* was intentionally disabled in the VM test; this matters for the historical control's missing labels.
- Nine preview pages from the three handwritten PDFs and the two-page engineering document were also rendered for visual review; the preview is insufficient for independent character-by-character transcription or every page's mathematical ground truth.

### Actual local corpus and detector output

| Source PDF / discipline | Pages (OCR proxy) | Equations / Results / Bibliography | Disposition and precise limitations |
|---|---:|---:|---|
| `581 Note 1.pdf` — handwritten inverse problems / Radon transforms, applied imaging | 1 (1) | **0 / 0 / 0** | **UNVERIFIED** — handwritten formulas are present and mostly unnumbered; OCR prose and symbols are heavily corrupted. No detected label pollution in this proxy, not proof of completeness. |
| `581 Note 3.pdf` — handwritten inverse problems / functional analysis and inverse data | 3 (3) | **0 / 0 / 0** | **UNVERIFIED** — all three image-only pages OCRed, many readable symbols/words missed by local proxy. No confirmed browser defect. |
| `581 Note 7.pdf` — handwritten inverse problems / electrical impedance tomography | 3 (3) | **0 / 0 / 0** | **UNVERIFIED** — all three image-only pages OCRed, low transcription recall. Prior v334 zero-index result is reproduced with *fresh* OCR geometry, but exact handwriting recognition is not passing. |
| `14922fe9-aa1a-4a9c-8698-ee3ff46b703d.pdf` — engineering mechanics, Chinese text and hand-drawn 3-D schematic | 2 (1) | **2 / 0 / 0** | **UNVERIFIED** for whole-document accuracy; the detected `(20)` and `(6)` are both on PDF page 1 and match the visibly printed numbered formulas. Page 2 is a labeled engineering drawing; English OCR proxy barely recognizes it. No false equation label was produced. |
| `Fraljiculator_ArrayPool_Architecture_Updated.pdf` — software/performance engineering | 16 (0) | **0 / 0 / 0** | **UNVERIFIED** for full independent ground truth; no spurious equation `1.242` or other timing/throughput decimal index. Matches prior class-level negative control. |
| `SPS_1988__22__485_0.pdf` — *historical pure-math control*, probability/harmonic analysis, 1988 | 18 (0) | **22 / 7 / 17** | **FAIL for complete Equations recall**, because old image-assisted golden includes `(2.8)`, `(2.9)`, `(2.10)` not found in the native-text proxy. Other output totals match the known v334 native control. This document is **not** counted as cross-field non-pure-math coverage. |

**Measured whole-document total:** **6 byte-distinct PDFs / 43 pages**; **8 OCR proxy pages / 13.15 seconds OCR** (roughly 1.64 s per OCR page averaged across these samples). The requested non-pure-math portion is **5 PDFs / 25 pages**, including **8 image-OCR pages**. Only a small, heterogeneous sample is represented; the sample is insufficient for any general performance benchmark or accuracy estimate. The historical pure-math negative control adds the remaining 18 pages. All six Structure/Results/Bibliography builds and Equation index builds completed with no VM exceptions after wiring their documented cross-subsystem dependencies. Zero index counts in handwriting do not prove zero omissions.

OCR time by file: `581 Note 1` **1.87 s / 1 page**; `581 Note 3` **6.23 s / 3 pages**; `581 Note 7` **4.32 s / 3 pages**; engineering schematic p.2 **0.73 s / 1 page**. OCR completeness is measured as **8/8 scheduled pages processed**, not transcription correctness. Source PDF hashes for reproducibility: `581 Note 1` `64a4ab741bae301ab16bf683d80d6811bd7fe9464bfd112c7fbae005c6c589e2`; `581 Note 3` `8c11eecc4577e9c271d1163e7f98669936d17cb3775fd00da9e2c49937dac299`; `581 Note 7` `5b12c2c951e1784154505935d20715278b7f458218a75775507488950e48e676`; engineering `216360ed33b909fec9d013819a1c26c6c06f23f8025d2a663dc2d2c342922baf`; performance `4b51daf5cf2a3a19674189b0572ca67b158c6f2be870cf23d1f69f40bdb2f0b2`; 1988 historical control `7365e2caea0cdcf9f5cfb14bc7820126bf5d55c37acd54ed0304ba24f55f0bca`. These original PDF bytes are not bundled in the root patch.

### Historical non-pure-math sources found and visually sampled, **not** executed locally

- **IEEE Merger Collection, handwritten engineering/IEEE administrative notes, two-page archival PDF:** `https://ethw-images.s3.us-east-va.perf.cloud.ovh.us/ethw/0/0d/1.3.25_Handwritten_Notes.pdf`. A page image is clearly cursive handwriting with numbered `(1)`, `(2)`, `(3)` questions, not mathematical equation tags. Especially valuable for detecting false-positive equation/Result labels in technical prose. **UNVERIFIED**: no local PDF bytes, no detector output; the archive page is publicly browsable, not a tested fixture.
- **Einstein, 1905, light-quanta paper, 17-page original journal scan:** `https://annus-mirabilis.com/papers/pdfs/ap-17-132.pdf`. First-page scanned layout has journal page number `132`, leading article number `6.`, blackletter heading, margin artifacts, German-language text and physical formulas. This is a priority cross-disciplinary historical printed-paper test for running-header, folio, section-vs-equation ambiguity and OCR text-layer quality. **UNVERIFIED**: PDF screenshot read remotely but not locally loaded into detector.
- **JADE particle-physics experiment log, handwritten/data table book:** `https://wwwjade.mpp.mpg.de/history/JADELogBooks/Log09.pdf`. Remote content visibly has handwritten run logs, timestamped table rows and beam/experiment measurements. Priority engineering-physics quantitative negative control. **UNVERIFIED**: no local detector execution.
- **1886 geology/paleontology field notebook (109-page mixture of handwriting and typing):** `https://commons.wikimedia.org/wiki/File:Field_notebook%2C_Chautauqua_County%2C_New_York%2C_1886_%28IA_fieldnotebookch00harr%29.pdf`. Priority historical handwritten geology corpus (field sample numbers, sketches, dates and distances must not turn into mathematical equation labels). **UNVERIFIED**: source located but original bytes not acquired locally.

Do not count four externally reviewed URLs as local regression runs. Next campaign should acquire original PDF files through authorized upload/download or a browser environment with binary PDF access and rerun **whole-document** native/OCR + current four-channel detection, including independent visual ground-truth lists and explicit page/item mappings. Mixed German/Gothic OCR and handwriting engines should be assessed separately from English Tesseract.

### Active defects, follow-up, and change decision

- **MR-HW-004 — UNVERIFIED, quality gap; affected pages:** `581 Note 1` p.1, `581 Note 3` pp.1–3, `581 Note 7` pp.1–3. **Evidence:** source scans visibly contain many readable words, symbols, integrals and formula lines, but the local English Tesseract proxy outputs corrupted fragments (e.g. `581 Note 7` p.1 starts `4 tara Jimpedent...`; it is a proxy transcription, *not* known MathReader/Texify output). **Mechanism hypothesis:** general cursive + low-resolution mathematical symbols + English-language model mismatch. **Impact:** poor potential search/OCR-based recall even when detector outputs have no false positives. **Reason to defer:** no production OCR evidence, no complete manually transcribed target/false-positive controls, and policy disallows heuristic inventions of mathematics. **Next:** inspect full-resolution glyphs, manually annotate readable spans/symbols, compare browser Texify CPU/WebGPU and measured OCR confidence, then rerun full downstream indexing. Do not count 0/0/0 as a PASS.
- **MR-VERIFY-010 — UNVERIFIED, requested corpus coverage blocked:** historical **non-pure-mathematics** scanned PDFs above were viewable remotely but binary downloads were unavailable to this local sandbox. **Impact:** no measured performance or accuracy for old physics, geological handwritten notes, or early IEEE handwriting. **Next:** acquire and hash exact historical PDF bytes; use a cross-disciplinary corpus with several editions/scan qualities, then verify every page including page folios, numbered lists, calculations, diagrams, running headers and references.
- **Known pre-existing FAIL**: `SPS_1988__22__485_0.pdf`, expected `(2.8)`, `(2.9)`, `(2.10)` absent from native-text index. No conclusion that the production's posterior image assist failed, as it was disabled for the local VM experiment. Other earlier MR-OPEN failures remain open with their original ledger status.
- **No new demonstrated class-level regression in the five non-pure-math local controls. No source-code changes.** The v347 index, recovery, OCR fallback, and UI semantics are preserved. Browser full-document OCR, old cross-field PDF ground truth, handwriting transcription correctness, and production deployment acceptance remain **UNVERIFIED**. Under project policy, uncertainty is not a PASS and does not justify an unproven detector heuristic.

---

## v347: Corrupt embedded-PDF bookmark terminators (2026-11-05 Beijing time)

**Authoritative baseline:** user-supplied complete v345 ZIP with the delivered v346 root patch applied and byte-compared; source version **346 → 347**. The full packaged policy and development history below remain authoritative. Structure detection cache **44** and equation summary version **22** do not change because this is bookmark-metadata presentation/TOC-target cleanup only, not an indexing or OCR change.

### Reproduced defect class

- **FAIL (v346, user screenshot):** `Ahlfors-Conformal-Invariants.pdf`, visible Structure panel / embedded PDF outline, e.g. `Contents`, `Foreword`, `Preface`, chapter 1 and sections 1.1–1.9; each has a rendered trailing unknown-glyph rectangle. The three first bookmarks (`Cover`, `Title Page`, `Copyright Page`) appear normal. The same defect affects later chapter/section titles.
- **Independent source evidence:** examined the actual user-library PDF (172 PDF pages) with PyMuPDF bookmark extraction: **78** embedded bookmark entries; **75** (all but the first three) end in two malformed bytes `C0 80` represented in the extraction as surrogate-escaped `U+DCC0 U+DC80`. This matches the screenshot's systematic class-level failure, not a special-case section/title. The exact Unicode character(s) exposed by the deployed PDF.js runtime were **not measured**; replacement glyphs, NUL/control characters, and surrogate escapes are known representations of invalid bookmark tails. Treat exact browser decoder behavior as **UNVERIFIED**, not a proven PDF.js code-point trace.
- **Cause:** metadata from the PDF's embedded outline is passed into Structure labels and TOC link labels without excluding invalid end-of-title characters. No evidence suggests the mathematical text itself contains a required final symbol.
- **Conservative correction:** `cleanEmbeddedOutlineTitle()` strips **only trailing** invalid control/replacement/isolated-surrogate code points and trims surrounding whitespace. Apply it to embedded outline `title` / `matchText` and TOC reference-target labels, not to the PDF text layer, OCR, Results/Equations/Bibliography indexing, or user-authored mathematics. Keep genuine `□`, `☐`, `■`, Greek letters and other math glyphs. Leave *interior* unknown symbols visible rather than inventing text. Retain the **raw original `sourceKey`** to preserve existing user edit mappings, and preserve original destination/page/depth and item ordering. No global symbol-stripping heuristics and no filename-specific conditions.
- **Small UI wording follow-through:** in the one-line Equations progress label, show `+N recovered` rather than `+N rec` (Chinese wording unchanged). Detailed tooltip and progress computation unchanged.

### v347 validation evidence

| Gate | Actual result | Scope / limitation |
|---|---|---|
| `node mathreader/tests/embedded_outline_title_regression.js` | **PASS, 25 assertions** | Malformed control/replacement/surrogate suffixes, legitimate math-square negative controls, internal damaged-glyph preservation, real `renderOutline()` and `getTocOutlineTargets()` entry points, destination/depth/source-key fidelity. |
| `node mathreader/tests/results_toc_regression.js` | **PASS, 23 assertions** | Existing TOC/Results boundaries unchanged. |
| `node mathreader/tests/bibliography_boundary_regression.js` | **PASS, 15 assertions** | Existing Bibliography boundaries unchanged. |
| `node mathreader/tests/equation_progress_regression.js` | **PASS, 33 assertions** | v346 progress/selection/failure semantics and v347 full-word `recovered` plus cache keys. |
| Actual Ahlfors PDF bookmark-tail sweep, PyMuPDF source + extracted JavaScript sanitizer | **PASS, 78/78 entries checked** | **75** invalid tails removed; **3** healthy entries unchanged; no surviving invalid suffix. This is actual PDF bookmark metadata, not a browser PDF.js render. |
| All 10 module parts, bootstrap, test `node --check` and assembled runtime `node --check` | **PASS** | Syntax and module concatenation; not equivalent to loaded browser PDF.js execution. |
| Whole-document OCR and detector inventory, browser/mobile rendering | **UNVERIFIED** | No in-browser OCR, live deployment or visual acceptance was run for v347. No claims of 100% Structure/Results/Equations/Bibliography ground-truth accuracy. |

### Risks / follow-up

1. If an embedded bookmark truly has a meaningful mathematical symbol encoded as a trailing replacement character, the original symbol cannot be reconstructed reliably; the metadata-local sanitizer removes only its invalid terminal encoding marker and leaves any interior corruption visible. Preserve this as a limited **unverified edge case**, not a fully solved encoding repair. A literal valid square glyph is intentionally **never** deleted.
2. The exact production PDF.js decoding of `C0 80`, Firefox/Chrome rendering, localized sidebar behavior, and live Ahlfors navigation should be verified in the deployed browser; no browser test was completed in this patch. If a rectangle remains, inspect the real `pdfDoc.getOutline()` title code points rather than broadening Unicode removal blindly.
3. Previously documented FAIL/UNVERIFIED cases remain open: Pisier reference OCR, Gromov/Caffarelli OCR omissions, Ahlfors damaged native equation numbering, weak handwriting, and end-to-end production acceptance. This metadata fix does not resolve those issues.

**Changed in the root patch:** `mathreader/js/40-outline-structure.js`, `mathreader/js/50-references-search.js`, `mathreader/js/41-equations-bibliography.js`, `mathreader/tests/embedded_outline_title_regression.js` (new), `mathreader/tests/equation_progress_regression.js`, `mathreader/mathreader.js`, `mathreader/index.html`, `mathreader/REGRESSION.md`. Unchanged: all other modules, existing detection algorithms, OCR/WebGPU→CPU fallback, CSS, PDF-page navigation semantics, and cache format versions.

---

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
