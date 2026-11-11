# MathReader v433 — Greedy prose wrapping and small-last-line policy

Date: 2026-11-11. Baseline: v432 plus the separately supplied v432 Formula OCR Settings copy overlay. Delivery: **changed/new files only**, under one `mathreader/` top-level directory.

## Cause and correction

The existing `.sidebar-right .display-note`, `.export-setting-description`, and other help-copy selectors used `text-wrap: balance`, which **deliberately shortened otherwise fillable intermediate lines**, especially in narrow settings groups. A one-sentence rewrite did not correct the shared layout policy. v433 removes the balancing rule and applies **natural-width, `text-wrap: pretty`** to prose in both reader sidebars and the Tutorial, with a normal `wrap` fallback and `overflow-wrap: break-word` only for oversized unbreakable tokens. It does not justify all lines, hyphenate displayed mathematics, modify form controls, force line breaks, or rewrite user-selected text.

The supported browser may make small last-line refinements, but no CSS property can guarantee a full preceding line *and* a long final line for every arbitrary combination of font, viewport and word lengths. The implementation therefore prioritizes line-width usage and best-effort widow reduction; it does **not** claim the impossible absolute guarantee. The handful of Settings descriptions that still looked short at regular sidebar widths were edited conservatively in English/Chinese. Longer and user-generated content is left untouched.

The affected labels remain functional: OCR retry quality warnings do not depend on enabling retries; detection display filters do not modify saved indexes, annotations or reading data; index rebuild and margin scan remain user initiated. No detection, OCR inference, navigation, storage schema or cache-index logic changes were made.

## Regression and evidence

- **Before/after:** New `tests/prose_flow_v433_regression.py` fails against untouched v432 because `text-wrap: balance` is still in the production stylesheet; passes against v433. The test checks real Chromium line rectangles and available-width usage, EN/ZH Settings descriptions at 204–360px, horizontal overflow, and Tutorial prose. It excludes buttons, preformatted code and mathematical displays.
- Historical `tests/settings_formula_note_wrap_v432_regression.py` has been migrated from the older *balanced* criterion to natural wrapping. `tests/settings_text_orphans_v399.py` and `tests/help_tutorial_regression.py` were updated only to match the current real sidebar markup and tutorial cache key, and they still test their original behavior.
- JavaScript: **80/80** test files PASS, with assembled-runtime syntax validation in the maintenance suite. `node --check mathreader.js` PASS.
- Python/Chromium: all **37 test files passed individually or in reruns**. The concurrent batch exceeded the execution limit; do not interpret that combined run as PASS. `tests/help_tutorial_regression.py`: **130/130** assertions, `tests/settings_text_orphans_v399.py`: **12** theme/width configurations, and `tests/ui_responsive_regression.py`: **176/176** assertions PASS.
- No new live PDF.js original-document or Texify inference testing was required for this CSS-only correction; no mathematical recognition accuracy claim.

## Deployment

Extract the ZIP into the **parent** of your installed `mathreader/` folder, overwriting only the included files. CSS/JS cache keys advance to v433; no data migration or cleanup is required. Do not replace the complete application folder.
