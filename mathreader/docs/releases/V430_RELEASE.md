# MathReader v430 — November 11 Formula OCR regression and stability

**Base:** v429, reconstructed from v418 complete + v419–v429 overlay chain. **Distribution:** changed/new-file overlay only; the ZIP has exactly one top-level `mathreader/` folder. Date: 2026-11-11.

## Source and exact reproductions

User feedback: `Formula OCR 20261111.docx`, 10 original mathematical screenshot examples paired with the user's actual generated LaTeX and remarks. Frozen verbatim text: `regression/fixtures/formula_ocr_feedback_20261111_v430.json`. No original screenshot or DOCX bytes are included in the patch.

- **Case 07:** An `aligned` environment closes while a `\frac` argument is still open. MathJax's actual parser raises **“Missing \begin{aligned} or extra \end{aligned}”**, even when a naive total-brace count appears balanced. Detect the scope problem as **review**, and show a localized explanatory fallback instead of displaying the MathJax merror node. Keep original text editable.
- **Case 01:** A multi-column block matrix is flattened into `\begin{array}{c}` plus many `\qquad` spacers, with delimiters appearing on one row. Detect this suspicious layout and warn; **do not invent matrix cells/large parentheses**.
- **Case 06:** Legitimate repeated `\int` operators and repeated limits of a fourfold integral matched the v429 decoder-loop heuristic and wasted the sole automatic retry. Recognize bounded operator chains as plausible mathematics: **warn** rather than hard-reject or retry. Genuine repeated command garbage is still rejected.
- **Cases 02, 05, 08, 09, 10:** Multiline truncation, lost content, alignment and glyph ambiguities remain mathematically unresolved. In particular, *z/s substitution cannot be corrected safely by output syntax inspection*. Syntactic validity is not semantic accuracy.
- **Two OCR completion paths:** v429's “Try Image OCR” comparison could mark an output `clean` based only on zero structural penalty, ignoring a hard-reject or warnings. Both paths now call the same quality state evaluator.

## Input/retry improvements

The ordinary first inference remains unchanged. The already-bounded *single* extra inference for severe decoder/layout errors may now use **gentle, nonthreshold soft contrast** on its alternative crop when image sampling identifies substantial gray strokes. It does not switch engines, silently guess symbols, or increase the 512-token generation budget. The user’s 10 screenshots were processed in Chromium: all outputs retain original dimensions, dark strokes, and nonempty image content; 7 qualified as potentially faded. This is image-processing verification, **not a measured Texify improvement**.

The first-result error still stays editable if the retry fails. Repeated-integral chains that are plausible mathematics are marked for review rather than repeatedly invoking Texify.

## Regression

- **77/77 JS** test files passed; new test exercises all 10 verbatim November-11 LaTeX strings, real MathJax compilation, both OCR completion handlers and warnings, plus v429 extreme-case controls.
- **33/33 Python/Chromium** test files passed individually. The sequential aggregate run exceeded its execution limit after 18 successful files; the remaining 15 passed in a separate batch. **176/176 responsive checks** are included in the existing responsive suite.
- 10/10 supplied screenshot preprocessing cases completed on Chromium; optional source-image audit was conducted against the user DOCX and source images are not distributed.
- Bilingual tutorial viewed at mobile, tablet and desktop widths (375, 768, 1440 px): **no horizontal overflow**.
- JavaScript syntax for the 10-module assembled runtime and ZIP overlay integrity must pass the final packaging gate (`regression/v430_release_gate.json`).

## Unverified / intentionally out of scope

Actual **Texify model inference** against the ten screenshots could not be executed: the model weights are unavailable here. Thus no mathematical transcription precision, symbol improvement rate, or long-form completeness percentage is asserted. Complex diagram topology, huge matrix reconstruction, historical page quality and missing/ambiguous symbols (e.g. z versus s) still require manual checking. Long formulas may exceed the stable 512-token output budget; split into smaller meaningful crops rather than blindly increasing tokens. No OCR/document state schema changes, no new background model loads, and no unrelated detection-index modifications.

The in-app **Tutorial**, not merely the release notes, now documents both Content Detection and Formula OCR capabilities and limitations in English and Chinese. Its Formula OCR section explains warning/retry behavior and troubleshooting without implying that compilable LaTeX is mathematically correct.

## Install

Extract the ZIP at the parent of the existing v429 `mathreader/`, overwriting matching paths. Do not replace the full folder or delete untouched files. Hard-refresh to fetch the `?v=430` runtime parts.
