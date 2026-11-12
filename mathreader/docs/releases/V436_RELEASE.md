# MathReader v436 — Cross-tab consistency and overlooked Reset Display failure path

**Date:** 2026-11-11. **Baseline:** user-provided v433 original + v434 overlay + v435 overlay (verified before edits). Delivered as a **changed-file-only ZIP overlay**, rooted in `mathreader/`, with no Git commit. No mathematical detection thresholds, OCR model, reading-data schema, or existing document-content indexes were modified.

## New bugs confirmed from v435 source and repaired

1. **Two tabs could retain contradictory Settings values.** v435 saved global Display, Content Detection display filters, Formula OCR crop/retry, and Export options to `localStorage` but had no `storage` event listener. An already-open tab did not update its UI or runtime state when another tab saved preferences. v436 reloads the relevant setting groups and updates their controls and, when relevant, Structure/Equations views. The event handler does not save the values it just received, preventing a write loop.
2. **A slow mode transition could overwrite a later change from another tab.** Simply deferring the cross-tab refresh until a rendering transition ended still lost updates: the transition persisted its stale appearance fields first. Reproduced with the two-page Chromium event harness, then fixed by adopting incoming appearance preferences immediately during a transition while retaining the mode being built. A final, coalesced synchronization follows completion. **Simultaneous writes before storage events propagate can still be last-writer-wins; this is not transactional storage.**
3. **Reset Display while *already* in continuous mode lacked error handling.** This path differed from the v435 mode-switch path and allowed rejected `renderCurrentPage()` calls to surface as unhandled promise rejections, without the same Settings failure message or busy-state protection. The same-mode branch now guards rendering, handles failures, locks and releases its controls, and rejects stale completion after opening another PDF. A visual preference that was changed before re-render failure remains applied and is saved; this is not a claim of all-or-nothing rollback.
4. **An absent or invalid Display record did not reset all in-memory defaults.** The missing-record branch restored flow, brightness, contrast and zoom, but failed to restore page tone, gap and shadow. The fallback now covers all seven display fields, including after another tab clears saved preferences.
5. **Changes to the OCR engine or extraction method from another tab are not applied mid-inference.** These deliberately produce an actionable, bilingual reload notice instead of silently disposing or substituting a live model. Current-tab OCR state remains unchanged until the user explicitly reloads or changes it there.

## Scope and verification

- Existing Settings groups: Display, Formula OCR, Content Detection, Export data; **22 Settings controls/actions**.
- `tests/settings_full_sweep_v434.py`: **96/96 assertions PASS**, using the production preference functions and event handlers and original HTML/CSS in Chromium. PDF and model behavior is mocked. New cases include failed and stale same-mode Reset, plus existing slow mode transitions and responsive bilingual widths.
- `tests/settings_cross_tab_v436.py`: **19/19 assertions PASS**. Two Chromium pages run production Settings functions and UI handlers with *manually mirrored `StorageEvent` payloads*, including the reproduced stale-write race. The test environment blocks navigation to same-origin HTTP and `file:` pages; therefore actual browser-transported cross-tab events **were not accepted end-to-end**. This is an event-handler simulation, not proof of transport across browsers.
- Node JavaScript tests: **80/80 test files PASS**, 0 failed, 0 timed out. Source suite results: `regression/v436_js_results.json`.
- Python tests: **39/39 test files PASS**, 0 failed, 0 timed out. 36 completed in a bounded batch; the 3 slower files were rerun individually and passed (regression runner smoke **19 assertions**, UI copy layout **80**, responsive **176**). Two previous large combined wrappers timed out and are **not** counted as passing. Per-file results are in `regression/v436_python_results.json`.
- JavaScript syntax: 10 application source modules, `mathreader.js` bootstrap and 10-part assembled runtime all pass `node --check`.
- Updated bilingual Tutorial explains browser-local Settings, cross-tab preference synchronization, and the safe exception for OCR engine/method changes.
- `mathreader.js` bootstrap and HTML cache version updated to **436**. CSS retains **433** because no stylesheet was modified.

## Not established by this release

- The original 41-PDF native geometry corpus and real detector precision/recall were **not** rerun; the corpus smoke test does not replace that evidence.
- A served end-to-end real PDF.js navigation test and real CPU/WASM/WebGPU Texify inference were **not** carried out in this round.
- True multi-tab browser storage transport, other browser engines, private-mode storage denial, very high-frequency simultaneous writes before event delivery, and deployment caching remain unverified. The `storage` event listener is browser-standard, but the tested transport was simulated.
- Failure of a PDF re-render after appearance settings changed does not roll all visual fields back atomically; instead it provides a visible error and persists the actual chosen appearance.

## Installation

Extract this ZIP into the parent directory of the existing `mathreader/` folder, overwrite matching paths, and retain all untouched files. Do not replace the application with a v433 directory; v436 is the next overlay after v435.
