# MathReader v429 — Formula OCR extreme-case stability

**Baseline:** v428 assembled from the v418 complete source plus v419–v428 overlays. **Delivery:** a small changed-file overlay ZIP with one top-level `mathreader/` directory. No automatic data/schema migrations or unrelated UI changes.

## User-provided 16-page stress set

The source is `Formula OCR Extreme Cases 20261110.docx` (16 pages, 20 formula screenshots and 20 companion *previously recognized* LaTeX samples). The recognized text is **not a mathematical ground truth**, and many source screenshots contain fragments beyond the formula crop, diagrams, or truncated multi-line expressions. The user file and raw images are not shipped in the website package; a subset of source OCR strings is recorded verbatim in `regression/fixtures/extreme_formula_ocr_v429.json` for exact regression. The included optional `regression_tools/extreme_formula_crop_replay_v429.py` takes the supplied DOCX path as an argument, reproducing the screenshot-side checks without bundling the original.

The most important observations:

- Screenshot 2: repeated nested `\\rm`/format commands; previously caught as a decoder runaway.
- Screenshot 3: matrix output degenerates into many empty rows; previously caught as a repeated-fragment runaway.
- **Screenshot 4:** an array declares five columns but some decoded rows contain extra cells; **v428 failed to flag the corruption**.
- Screenshot 8: a commutative diagram becomes an `\\includegraphics` placeholder; already rejected as non-mathematical layout markup. MathReader has no diagram-aware formula model.
- **Screenshot 9:** a two-line norm inequality becomes many one-token `grad`, `||`, and `\\leq` rows; **v428 failed to flag the corruption**.
- Screenshots 12–13 and 20: extremely tall/dense formulas can exceed reliable single-pass recognition length; the 512-token cap cannot be inferred from character counts, and long inputs often omit rows despite compilable LaTeX. The new image-vs-output check **warns** on strong evidence of missing rows rather than fabricating any formula content.
- Other dense tensors, block matrices, high-order derivatives, hypergeometric expressions, and nested fractions are deliberately not hard-rejected just for their complexity or repetition.

### Root causes and changes

1. **Quality gate blind spots** (`js/10-formula-ocr.js`). A column-arity check now detects repeated extra array columns in simple `c/l/r` arrays. Repeated empty-row/matrix detection additionally requires characteristic `{{}}` decoder artifacts; intentionally sparse valid matrices remain allowed. Fragmented-alignment detection requires numerous isolated-symbol rows and at least two bare mathematical relation rows, avoiding false positives on legitimate short aligned equalities. OCR does not replace mathematics with guessed content.
2. **One bounded, visible local retry** (`js/11-formula-vector.js`). Only a *severe* initial output-quality rejection triggers a second Texify inference on a relaxed crop with beam 2. A structurally sound second candidate is selected; if both remain corrupt, choose a substantially less corrupted candidate or retain the original, marked **review**. If the retry itself fails, preserve the first editable output. There is never more than one additional inference; no engine switching, model reload, or repeated automatic attempts. Model loading remains lazy and the PDF reader remains usable.
3. **Image-derived omission warning.** For tall crops only, count sufficiently separated ink bands without attempting to segment the formula. If many visual bands produced very few decoded rows, warn that lines may be omitted. This does **not** trigger an expensive retry on otherwise valid LaTeX. It is not an OCR accuracy estimate.
4. **Quality-state honesty.** A hard-rejected candidate remains `ok:false` and review-only instead of being labeled structurally valid; vector leaf fusion cannot hide a hard-rejected result. Inference diagnostics record both attempted calls even if the second call raises an error.

The normal path stays **one local inference with the original 512-token cap**; the extra pass is strictly limited to severe failures. Changes neither repair genuine mathematical mistakes nor substitute vector text silently.

## Validation and limitations

- `tests/extreme_formula_ocr_v429_regression.js` evaluates all **20 actual supplied OCR strings**. The original v428 gate flagged **3/20** as severely corrupted; v429 flags **5/20** (the two new detections above), without newly hard-rejecting the tested dense, longer math samples. This is *quality-failure detection*, **not formula recognition precision/recall**.
- `tests/extreme_formula_retry_v429_regression.js` runs the production recognition coordinator with a **mock deterministic Texify pipeline**, covering normal one pass, corrupt-first/clean-second, two corrupt candidates, failed retry, accurate call counting, visible feedback, and tall-image under-transcription warnings. It makes no claim of actual model-inference accuracy.
- The screenshot-side audit used **all 20 original embedded PNGs**, genuine Chromium canvases, and production polarity/crop normalization code: 20/20 produced nonempty normalized ink regions, with no canvas exceptions. Three screenshots produced high visual row estimates (15, 9, 12). `regression/v429_crop_stress_audit.json` records dimensions, bounds, image row estimates, and exact source-file SHA-256. It does not measure whether those formulae were transcribed correctly.
- Existing full JavaScript and Python/Chromium regression suites and ZIP integrity are listed in `regression/v429_release_gate.json`.
- **Not executed:** actual `Xenova/texify` model inference on the 20 screenshots (model weights/runtime unavailable in this environment); live website GPU/CPU throughput; independent mathematical transcription fidelity. No improvement percentage is asserted. The very long aligned formulas, mathematical diagrams, and intricate large matrices remain demanding for this model; cropping into smaller meaningful expressions may improve manual results.

## Install

Unzip the overlay into the parent of the existing v428 `mathreader/` directory and overwrite matching paths. The ZIP includes **only changed/new files**, no copies of the original document, no model files, and no cleanup scripts. The application asset version advances to `429`, while saved OCR/document schema versions remain unchanged.
