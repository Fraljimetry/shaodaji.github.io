# Round 147 — Compact-control opportunities (review, not a layout redesign)

Criteria: conserve vertical space only for selectors with short predetermined values or inputs that contain short style/resolution numbers; retain full widths for formulas, names, labels, and prose. Two-column pairs must have equal widths and aligned baselines at desktop, tablet, and mobile widths, with no clipping in Chinese mode. Preserve all existing glyphs.

## Strong candidates

1. **2D Settings → Plotting:** `Plot detail` + `Evaluation budget` selectors (Fast/Balanced/Detailed; finite budget presets) in one aligned row; `Implicit grid (px)` can share a row with another short resolution control if one exists, but do not squeeze unrelated long controls into it.
2. **2D Settings → Geometry options:** `Free curves` + `Curve smoothing` selectors in one row. `Label placement` is also short, but should remain semantically within Show.
3. **2D Settings → Page & appearance:** `Canvas` + `Image bounds` selectors; `Raster resolution` + `Theme` selectors. Keep `Background` full-width and immediately after Theme, as required; do not compress the color swatch.
4. **3D Settings → Visualization:** `Projection` + `Raster resolution` are short selectors; Mesh detail + Surface opacity and View yaw + View pitch already occupy numeric pairs (retain). Do not compress Background or break its Theme adjacency.
5. **2D Properties → Diagram morphism:** `Line style` + `Arrowheads` are preset selectors suitable for a matched row. Bend and the four label placement numbers are short, but the four numbers already use a compact grid.
6. **2D Properties → Label format:** `Plain text` / `LaTeX math` is a short select and could share a row with another short preset. The *Displayed label*, *Arrow label* and *Text / label* editors must remain wide or multiline.
7. **2D/3D Properties → Plot domains:** t min/max, x/y min/max, r min/max, resolution/sampling steps are short numeric controls and are good two-column candidates. Parametric x(t), y(t), r(t), implicit F(x,y), functions, vector components and domain-coloring formulas must stay full-width.
8. **2D/3D Properties → Style:** `Opacity`, `Width`, `Point size`, numeric font sizes, line thickness, mesh density, and vector sampling/resolution can be paired as already done in many contexts; never shrink actual name or label editors.
9. **2D Settings → New object style:** `Opacity`, `Line width`, `Point size` already use a compact grid. Preserve it rather than adding another design. `Object naming` is a short preset selector, a secondary candidate.
10. **Settings → Interface:** `Font` selector and checkbox groups are comparatively compact already. Avoid shrinking language/theme selectors so far that Chinese values clip.

## Not suitable for further compression

- Construction command, functions, implicit expressions, parametric x(t)/y(t)/r(t), complex formulas and vector components.
- Object Name, Displayed label, Diagram node text, morphism label, LaTeX text and other user-entered strings.
- Color palette grids, Background swatches, help text and error messages; preserving legibility takes priority over forcing two columns.

**Status:** This document identifies opportunities only. No CSS or form layout changes are made in Round 147; changes need visual validation at 1440, 768, 390 and 320 px with reversible Chinese/English labels before acceptance.

## Round 148 implementation follow-up

Implemented all five high-priority short-setting pairs: Plot detail / Evaluation budget; Free curves / Curve smoothing; Canvas / Image bounds; 2D Raster resolution / Theme; 3D Raster resolution / Theme. Also compacted Diagram morphism Line style / Arrowheads. These controls use two equal grid columns with left-aligned labels. Formula, free-text, and editable expressions are not compacted; Background remains a separate full-width color control following Theme. Verified with actual Chromium English/Chinese switching at 1440, 768, 390 and 320 px and morphism editing at 1440, 390, 320 px.
