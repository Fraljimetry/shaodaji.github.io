# MathIllustrator Cut 21 — v0.22.0: opt-in semantic diagram routing and manual label placement

**Baseline:** exact cumulative Cut 20 ZIP. **Scope:** diagram arrows, obstacle detection, curved/direct compatibility, label positioning, export gating, strict schema, and dense-scene performance. **Native JSON project version remains 1.** Website root `index.html` and `tools.html` are retained; MathReader application code is untouched.

## Actual baseline risks and reproduced defects

- Cut20 morphisms were represented with a direct quadratic SVG path between node boxes. A third visible node overlapping that line was ignored, and the arrow could pass through a node's content. The Cut21 browser fixture puts a visible `Blocker` between two nodes; the old route cannot avoid it.
- The arrow label offset was hard-coded at 17 screen pixels perpendicular to the center chord. Selecting a morphism offered curve/bend and swap only, so labels could overlap arrows or nodes without any numerical adjustment. The new controls expose label fraction, distance, and X/Y shifts without modifying semantic endpoints.
- Unrestricted TikZ/PGF export would misrepresent newly routed screen-space polylines and manually shifted labels. Export preflight now disables this format for those visible morphisms. Restricted `tikz-cd` is separately **semantic**, not an exact visual conversion; SVG and native JSON retain the visual settings.

## Design and honest limitations

- `src/diagram_routing.mjs` provides pure geometry and deterministic intersection checks. On opting in, it first checks the direct line against visible third-party node boxes. If blocked, it tests up to four two-turn corridors above/below or left/right of their screen rectangles, with a 10px obstacle margin. It chooses a clear, shortest candidate. The old direct/curved mode is the default for existing projects and new morphisms.
- The routing mode is **best effort, not a complete orthogonal router**. If all candidate corridors are obstructed, the SVG shows a dashed amber line and accessible SVG `<title>` warning, with `data-route-status="blocked"`. It never claims a mathematically clear route. If source/destination boxes overlap, no visible arrow is fabricated; the semantic edge remains editable.
- In Avoid mode, the visual bend is ignored in favor of straight/orthogonal segments; the bend field is preserved if the user switches back. Auto routing is recalculated when nodes move, hide/unhide, change text size, or change visibility. The chosen path may shift on zoom because node boxes are measured in CSS pixels.
- Labels can move along a quadratic or polyline path from 0.05 to 0.95, 0–200 CSS px perpendicularly, and ±300 CSS px horizontally/vertically, with the existing Swap label side checkbox. **No label collision-free guarantee**: manual placement remains the author’s responsibility. Width calculations are approximate and browser font metrics may differ.
- TikZ/PGF is disabled for visible morphisms with Avoid routing or nondefault screen-space label positions (and still obeys earlier safety guards). SVG, supported raster and JSON retain the visual setting. `tikz-cd` is a restricted graph-only interchange; it does not preserve line routing or screen-space label offsets.
- Fit-to-scene and fixed-page crop do not yet guarantee containment of routed detours or large manual label offsets; review exported crops manually. Dense on-screen diagrams and many automatically routed morphisms can be expensive. Only the necessary visible node boxes are calculated once per repaint when at least one visible Avoid-mode edge exists. Direct mode does not pay the routing computation cost. Raw timing is retained in `cut21-performance.json` with all samples, not just the fastest.

## Regression matrix

1. Pure Node cases: direct arrow, blocked/clear detection, multiple obstacles, tangent/axis-aligned segment–rectangle intersections, impossible corridor, overlapping source/target node boxes, quadratic and polyline label positions, strict malformed-field validation, v1 legacy defaults.
2. Isolated Chromium: explicit blocker causes a routed SVG polyline; manual shifts and fractions redraw correctly; native JSON export preserves endpoints and settings; unsafe TikZ is disabled; direct mode restores a quadratic and Undo returns to routing; hiding a blocker restores a clear route, Undo reinstates it; invalid label input rolls back.
3. Retained suite: inherited browser scripts, Node cases, schema examples, real `pdflatex` compilations, homepage integration and cumulative package checks. Per-script evidence and any incomplete tests are recorded independently.
4. Performance: paired 320-node + 80-morphism project, 11 measured SVG rebuilds after 3 warmups per mode. This workload does not establish end-to-end frame rates or broad production performance.

## Items deliberately not certified

- Full optimal/obstacle-minimizing arrow routing, automatic non-overlapping arrow labels, arrow-to-arrow crossings, exact mathematical text metrics, SVG/raster pixel identity, published HTTP site, Firefox/Safari, real touchscreen/pen hardware, simultaneous-tab storage atomicity, or 60 FPS dense-scene performance.
- General TikZ visual equivalence for screen-space routing. An unsupported conversion is disabled, not hidden behind a silent fallback.

## Final evidence

See `cut21-browser-results.json`, `cut21-performance.json`, `cut21-regressions.json` and `cut21-package.json`. Historical test reports have not been altered.
