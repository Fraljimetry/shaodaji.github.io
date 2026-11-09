# MathReader v417 — Correct first-crop OCR busy-state ownership

## Confirmed defect and general cause

With the actual v416 engine startup and crop handlers running together, completion of `initializeMathOcrPipeline()` reset the shared `mathOcrLoading` state **before the first crop's inference completed**. OCR-only controls could become active too early, making a concurrent engine reset or a second crop possible. The baseline-failing regression uses a deferred inference promise; it is not a speculative textual assertion.

## Small, bounded correction

- `js/10-formula-ocr.js`: keep the pending crop's busy state across the engine initialization `finally`. Model loading alone still releases its busy state when complete. While a queued crop is pending, show formula-processing status instead of misleadingly announcing an idle OCR engine.
- `js/11-formula-vector.js`: serialize ordinary crop OCR and image-comparison OCR using the same one-at-a-time crop token, released in `finally`. Keep existing PDF-object and file-key identity checks for stale completions.
- Update the application and CSS cache keys to **417**; no detector/index/cache schema change.
- Extend the real-function VM race regression and adapt existing isolated OCR tests to include the new token. No full-screen overlay, global keyboard interception, new worker, additional model load, or hidden fallback was introduced.

## Verification

| Gate | Result | Scope |
|---|---|---|
| v416 baseline JavaScript | 61/61 PASS | Prior source independently executed |
| New v417 race test on unchanged v416 handlers | FAIL (expected) | Reproduces premature idle state |
| v417 JavaScript | 62/62 PASS | All `tests/*_regression.js` |
| v417 Python/Chromium | 28/28 PASS | All `tests/*.py`; many use isolated PDF.js/mock geometry |
| v417 P0 Chromium shell | PASS | Real assembled MathReader UI, mocked model failure, no original PDF |
| Actual Texify model inference on a source-matched original PDF | NOT VERIFIED | No model/original PDF provided in the input source archive |
| Full mathematical index precision/recall | NOT VERIFIED | Existing regression corpora are proxies, not a new independent page-image audit |

A browser main-thread computation may still temporarily reduce responsiveness during real ONNX/WASM compilation/inference; v417 does not claim a Web Worker conversion. The previously accepted equation-margin evidence loss on hard refresh is unchanged. Long-document and memory behavior passed existing simulated/regression gates, not a new calibrated original-PDF campaign.

The complete-folder ZIP is intended to replace the entire `mathreader/` directory, not overlay its older contents. Documentation organization and historical evidence are retained.
