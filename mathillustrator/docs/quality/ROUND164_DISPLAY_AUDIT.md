# Round 164 — Display audit (tested scope and gaps)

Baseline: latest source archive with Round 159–163 overlays applied, not the hosted site.

## Reproduced product defect and fix

The Snap and Show checkboxes were each assigned `width:calc(50% - 5px)` by a generic geometry rule, despite their parent using a three-column CSS grid. Thus English labels (Points, Objects, Labels; at 768 px also Grid and Axes) overflowed the checkbox grid tracks. Round 164 adds scoped `width:auto` and flex display rules for those two groups. No glyphs or mathematical behavior changed.

## Verified locally

- Node: 566/566 passing (`node --test tests/*.test.mjs`).
- Syntax: `node --check src/app.mjs` and `src/i18n.mjs` passing.
- New real Chromium Round 164 display inventory: pass at widths 1440, 1024, 768, 390, 320 in English, Chinese, English again. Asserts absence of visibly clipped label/button contents in the inspected settings panel, absence of settings inputs/selects escaping the panel, and export checkbox track alignment with Interface settings. Page errors checked.
- Existing real Chromium checks for R159, R160, R161, R162, R163: pass.
- R148 localization audit and R155 expression alignment: pass.

## Historical tests with nonzero exit (not accepted)

- `browser_round138_i18n.py`: expects obsolete exact Chinese `曲面不透明度`; current label differs.
- `browser_round150_size.py`: looks up removed DOM node (`getBoundingClientRect` on null).
- `browser_round152_alignment.py`: assumes an absent legacy element (`querySelector` on undefined).
- `browser_round153_pairs.py`: expects a specific properties control to be visible when the editor mode leaves it hidden.
- `browser_round156_plot_settings.py`: obsolete numeric-input/DOM selector (null rect).
- First broad batch timed out before executing all scripts; no pass inferred for remainder.

## Incomplete coverage

This is NOT exhaustive display certification: 188 historical browser scripts were not all run. The new inventory covers default settings and language switching, not all populated object properties, every modal, every 2D/3D mode, every tool tooltip, zoom/font scaling, theme combinations, screenshot pixel comparisons, text overflow in every hidden/floating panel, or the hosted production deployment. These require dedicated interaction-based assertions and adaptation of stale browser scripts.
