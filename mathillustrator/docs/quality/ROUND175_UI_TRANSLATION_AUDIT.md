# Round 175 — User-facing translation audit (EN ↔ CN)

## Confirmed gaps corrected

- Arrowhead selectors for free curves and diagram morphisms: None, End, Start, Both, Double end, Hook, Tail, Harpoon.
- Line and shape selectors: Line style, Solid/Dashed/Dotted/Double/Wavy, Shape, Free, Regular.
- Other uncovered user-visible choices: Single color, several top-level toolbar tooltips, navigation labels, panel accessible descriptions, plotting-mode help, and zoom controls.
- The same translation dictionary is used for UI text and accessibility metadata; no project/model labels or mathematical expressions are translated.

## Verification and limitations

- Node test suite 582/582 (including four newly added translation-coverage tests), exit 0.
- JavaScript syntax checked (app and i18n).
- Actual Chromium UI: option text for diagram arrowheads and Free Curve arrowheads verified at 1440, 768 and 390 px; switching Chinese → English → Chinese verified.
- This is an inline Chromium fixture of the current real application, not the hosted website. The mobile viewport exercised object selection through DOM events because the normal search field is hidden.
- A static scan of `index.html` found no additional clear untranslated standalone visible options; items including paper sizes, font names, mathematical notation, and user-authored TeX are intentionally unchanged. This does **not** prove every dynamically generated error or every modal is translated.
- Full historical Chromium suite and every geometry dialog were not rerun this round.
