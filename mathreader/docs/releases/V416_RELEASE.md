# MathReader v416 — Formula OCR initialization without a reading lock

**Scope:** Interaction behavior during the first image-formula crop. No equation-index, OCR-model, mathematical transcription, or persistence-schema changes.

## Behavior

- Only submitting the **first image formula crop** starts the model import and construction. Merely opening the PDF, opening the OCR workspace, or starting a selection does not initialize Texify.
- The actual crop stays in the asynchronous recognition request. The OCR sidebar shows non-modal status while the model is loading; the PDF canvas, navigation, keyboard commands, window controls and file opening remain accessible.
- Remove the obsolete full-viewport initialization dialog, global `inert` mutations, and capture-phase keyboard/drop blocking. The existing one-at-a-time extraction lock applies only to Formula OCR selection and engine reset/settings until the pending crop completes, not to normal PDF reading.
- A pending request shares a single model-initialization promise, then performs the same local image recognition. Navigation within the original PDF does not change the crop. If a *different PDF* is opened before completion, the stale result is not committed into the new document.
- Failed imports, backend initialization errors, and 120-second timeouts leave reading operational; existing explicit Reset OCR behavior, timeout disposal, and configured WebGPU→CPU fallback remain in place. No automatic repeated loading.

## Verification and limitations

- `tests/formula_ocr_initialization_regression.js` exercises pending initialization, underlying controls, shared requests, failure, fallback, import and pipeline timeouts, and late pipeline disposal.
- `tests/formula_ocr_lazy_regression.js` covers first-crop execution after a deferred result and stale cross-document completion.
- `regression_tools/p0_browser.py --shell-only` exercises actual Chromium controls while a delayed model-import failure is injected. No real Texify or original PDF is needed, so this does **not** verify end-to-end inference or guarantee uninterrupted frame rendering under heavy WASM/GPU compilation.
- The backend still runs within the page's existing Transformers.js pipeline; long synchronous WASM compilation/inference may temporarily occupy the browser main thread. This change removes MathReader's artificial UI lock but is **not** a migration to a dedicated OCR Web Worker.

The existing accepted limitations for historical mathematical PDFs and hard-reload OCR persistence are unchanged.
