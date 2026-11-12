# MathReader v435 — Settings hard-to-reproduce lifecycle audit (2026-11-11)

**Baseline:** v434 changed-file overlay applied to the user-provided original v433 source archive; no rollback, no Git commit. Delivery is a `mathreader/`-rooted **changed-file overlay**, not a complete application directory. No detector thresholds, reading-data schema, annotations, or Texify model are changed.

## Confirmed additional bugs and resolutions

1. **Reading-mode switches can overlap their own destination render.** With a large/slow PDF, rapid clicks could change the in-memory flow while the old surface remained visible. Settings Reset and toolbar mode controls now lock during a transition and release on completion. If rendering fails, restore the previous surface and flow, report the failure, and persist the truthful flow. A PDF switch suppresses stale completion from the previous PDF.
2. **Display reflows could invalidate an unfinished reading-mode change.** Sidebar changes (width/collapse) and page-spacing changes invoke a second asynchronous transition. Advancing the shared serial while the first mode switch is building could make its completion disappear, leaving the selected mode and visible surface inconsistent. A display mutation during a mode switch now takes effect immediately, while its expensive PDF reflow is **coalesced and deferred** until the mode switch is finished. A deferred reflow belongs only to the same PDF; switching PDFs does not replay stale work.
3. **Malformed stored Display numbers used minimum values rather than documented defaults.** `Number(null)`, empty strings, and booleans can parse as zero/one. These persisted values now restore appropriate default brightness, contrast, and page gap; legitimate numeric strings are accepted and out-of-range actual numbers remain clamped.
4. **PDF-vector extraction silently fell back to image-model inference.** When a vector crop returned no usable LaTeX, it could unexpectedly initialize Texify or send the crop through image OCR, even though PDF vector was selected. The vector-only path now stops with a visible message directing the user to explicitly choose **Image OCR** in Settings. This is a mode-boundary/privacy/resource fix, **not an OCR transcription improvement**. A regression reproduced the old unwanted inference path before the change.
5. **OCR engine reset/unload race and false success.** Reset and engine changes could overlap slow model disposal. Disposal errors were swallowed, while Settings could still claim “OCR reset.” Image engine controls now lock during disposal, failed unload is reported, and unsafe engine reuse is blocked until a page reload. Explicit PDF-vector extraction and ordinary PDF reading remain available. The engine is never silently changed.
6. **Display reflow errors could be lost or leave controls busy.** Reflow exceptions now have a visible error message, and control release is covered for success, errors, and stale renders. A missing PDF keeps the toolbar reading-mode toggle disabled while Settings still allows configuring the default.
7. **A page-gap change could schedule a redundant concurrent reflow.** The final change event now skips a second build while the mode transition already incorporates the new gap; the active-mode overlap path uses one deferred rebuild when needed.

## Complete Settings action map

All **22 Settings controls/actions** were mapped to production preference and event paths:

| Group | Controls/actions audited | High-risk interactions exercised |
| --- | --- | --- |
| Display (9) | Continuous, Single page, Reset display, Zoom step, Page tone, Brightness, Contrast, Page spacing, Page shadow | Saving/loading, safe switch/reset and rollback, no-PDF toolbar state, invalid saved values, out-of-order renders, asynchronous sidebar changes, eight EN/ZH responsive width combinations |
| Formula OCR (5) | Extraction method, Image engine, Crop padding, Severe-error retry, Reset OCR | Explicit vector/image boundary, engine plan, slow unload, unload failure, reset guard, saved preferences; all inference/model disposal work mocked except production disposal function in the Node VM test |
| Content Detection (6) | Results filter, Proof relationships, Equation-confidence filter, Reset filters, Rebuild indexes, Scan equation margins | In-memory filtering vs durable data, busy/unavailable controls, single execution of deliberate actions; detector accuracy not re-measured |
| Export data (2) | Include detected content, Include full document text | Defaults, persistence, independent combinations, legacy import/export fixtures |

## Evidence, with test boundaries

- `tests/settings_full_sweep_v434.py` (retained filename): **90/90 assertions PASS**, Chromium using actual v435 HTML/CSS and extracted production preference handlers. The PDF and image model are **stubs**; this is not a live PDF.js/Texify end-to-end test. Includes a new concurrent sidebar/display mutation during a suspended mode switch.
- `tests/formula_ocr_lazy_regression.js`: covers the **pre-fix red / post-fix green** vector-to-image fallback path; production OCR code plus mocked model.
- `tests/settings_ocr_disposal_v435_regression.js`: production disposal source in a VM, mocked success and thrown unload, including visible error and failure latch.
- Full JavaScript: **80/80 test files PASS**, 0 failures, 0 timeouts. `regression/v435_js_results.json` contains per-file results.
- Python/Chromium: **38/38 test files PASS when executed in bounded/isolated runs**. The earlier all-in-one runner timed out while subsequently entering a nested regression subprocess, **not** because 38 files finished; the nested smoke test then completed independently with **19 checks PASS**, as did UI copy layout (**80/80 assertions**) and responsive layout (**176/176 assertions**). Never count a timed-out batch as a passing test.
- JavaScript syntax: **10/10 source modules**, `mathreader.js` bootstrap, and the concatenated runtime **PASS** `node --check`.
- Bilingual Tutorial and wrapping tests PASS. Formula OCR behavior and known limitations are updated in the existing EN/ZH Tutorial; no new standalone tutorial file was introduced.

## Residual risks / not certified

- **Real end-to-end PDF acceptance:** A live served-app browser request was blocked by the test environment, so complete PDF.js loading and navigation on a real PDF are **not verified in this round**. The 41-PDF/2,039-page native-text geometry proxy corpus was **not rerun** and does not certify perfect detection precision/recall.
- **Actual Texify inference:** No original image crop was run through a real CPU, WASM, or WebGPU model during this release; transcription quality, memory use, first-load download, rare GPU failures, and long-formula accuracy remain unverified.
- **Concurrent browser tabs:** Preferences are saved per browser local storage, but cross-tab changes are not proactively synchronized. A stale tab may overwrite another tab's changes; this is a **source-level risk**, not a reproduced fault in this round.
- **Storage read restrictions:** Invalid JSON is validated, and Settings write failures have a visible warning since v434; browser-specific storage read-denial behavior remains untested.
- **Render failure side effects:** An asynchronous PDF display reflow may already have applied a chosen visual preference before the reflow fails. The user is warned, but atomic restoration of *every* appearance control's prior value is not promised.
- **Deployment:** Live CDN, cache propagation, browser security policies, and behavior on other engines/devices have not been tested. Applying the overlay is not equivalent to deploying and accepting the production site.

## Installation

Extract the v435 overlay in the **parent** of your existing `mathreader/` directory, overwriting matching files. Preserve all untouched files. The entrypoint and assembled source modules use cache key `435`; unchanged CSS files retain their older cache identifiers. The overlay's file hashes and unchanged-file preservation are checked against the pristine v434 baseline before delivery.
