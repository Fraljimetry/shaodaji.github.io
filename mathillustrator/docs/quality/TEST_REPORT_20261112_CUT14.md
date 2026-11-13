# Cut 14 (v0.15.0) — document lifecycle, IME, viewport and storage recovery

## Baseline, purpose, and provenance

Cut 14 starts from the **exact cumulative Cut 13 overlay**, not an older local checkout. The new focus is on interactions across otherwise working workflows: unfinished constructions surviving project replacement, delayed file imports, keyboard composition, viewport changes during captured gestures, and autosave error recovery. The website root `index.html` and `tools.html` are carried forward unchanged; no MathReader application file changes are included.

## Red → green findings

| Case | Previously missed failure | Resolution and evidence |
| --- | --- | --- |
| MI14-001 | Starting a segment, choosing New, and clicking the canvas again constructed a segment using the first endpoint of the *previous* document | Clear all in-progress draft state on real document replacement. `tests/browser_cut14.py` reproduced the ghost segment on Cut 13 and verifies the fix. |
| MI14-002 | Tab-hidden cancellation applied to captured drags but not multi-click polygon/segment/morphism drafts | Clear drafts and hover on document hidden/window blur. Synthetic visibility Chromium test passes; physical mobile/app-background behavior is **not certified**. |
| MI14-003 | A delayed JSON `file.text()` completion was guarded by `documentRevision` alone; a byte-identical New changed the project identity but not that counter | Also check `documentGeneration` before committing the import. Delayed promise test confirms stale import is rejected, even with unchanged edit revision. |
| MI14-004 | `Delete` during IME composition could delete an object. `Escape` while composing could close the semantic TeX import dialog | Global key handler ignores `isComposing` and `keyCode=229` before modal and shortcut handling. Synthetic composition and ordinary Escape tests pass. |
| MI14-005 | Zoom/Fit controls could modify camera transforms mid captured point drag and permit an unintended release-to-world-coordinate conversion | Cancel and roll back the pending gesture before wheel Zoom, +/- Zoom, Reset, and Fit. Browser test covers zoom-in during active drag. |
| MI14-006 | Quota/recovery was only a documented risk, without concrete UI evidence | Simulated localStorage quota failure preserves prior snapshot, shows failure, keeps JSON download operational and recovers when storage becomes writable. No production code change was necessary. |

## Evidence and what it does not prove

- Existing **93/93 Node model tests** pass; Cut14's fixes are primarily controller/lifecycle code and are directly exercised by the *new browser script*, not by artificially increasing pure Node test counts.
- **24 isolated Chromium editor scripts** pass in individual batches, including every retained Cut00–13 suite and `browser_cut14.py`. One large aggregate sweep was interrupted by an execution-time limit; its unfinished portion was rerun separately. Do not reinterpret a batch timeout as an editor defect or an aggregate PASS.
- The quota test uses a deterministic **Storage-shaped test double**: the sandbox's `about:blank` test document denies actual `window.localStorage`; we deliberately avoid presenting this as a real quota or cross-tab transactional test.
- Open-file testing uses a controllable `File.text()` promise. IME and visibility tests dispatch synthetic browser events. These establish controller behavior under those events, not physical keyboard, touch-device, tab suspension, browser crash or service-worker behavior.
- All project JSON still uses **schema v1**, with no silent migration. Drawing drafts and camera drag coordinates are transient and intentionally not saved as objects; the existing native JSON export remains the lossless backup.
- No new measured rendering-performance claim in this cut. Cut13's export-only-settings benchmarks remain historical, not evidence of better Cut14 frame rate.

## Still open / next stage

Genuine HTTPS-origin two-tab Web Locks/storage contention, `pagehide` fallback atomicity, real storage-quota recovery on devices, multitouch and pen/canvas scroll gestures, Safari/Firefox and live GitHub Pages deployment, mixed-font/MathTeX export goldens, and large mixed-scene frame latency. Next targeted work should address these independently and keep unverified items explicitly open.

## Package requirements

Cumulative site-root ZIP must include `index.html` and latest root `tools.html` alongside `mathillustrator/`, preserve all historical cut files and native JSON examples, and exclude unrelated `mathreader/`. Manifest and SHA-256 checks must be rerun against the extracted ZIP.
