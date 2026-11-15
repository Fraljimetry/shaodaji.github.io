# Round 166 — Plotting and geometry audit (verified scope)

## Baseline and procedure
Round 158 authoritative source plus cumulative Round 159–165 overlays, as provided in this conversation. Source-level audit of the restricted plotting grammar, exact-geometry recognizer, geometric dependencies, and existing 2D/3D regression collection. No hosted-site or GPU-hardware certification.

## Confirmed application defect and root cause
Mathematical plotting supported `pi`, `e`, implicit multiplication, and scientific notation; `src/plot_geometry.mjs` independently parsed exact algebraic geometry without constants or the full multiplication conventions. Consequently `f(x)=pi*x+e`, the implicit circle `x^2+y^2=pi`, and a constant-polar-radius circle `r(t)=pi` could be rendered but could not be recognized as geometric lines or circles for downstream construction. Fixed its restricted polynomial lexer to accept exact constants and implicit multiplication, retaining strict rejection of unsupported expressions. Does not use visual sampling or turn noncircles into circles.

## Verification actually executed
- Node full regression: **568 passed, 0 failed, 0 skipped**, previously 566. Includes new deterministic exact-geometry regression covering `pi`, `e`, case insensitivity, adjacent factors, scientific notation, malformed expressions, circle/line resolver interoperability, and false-positive protection.
- `node --check src/plot_geometry.mjs`: passed.
- Real Chromium `browser_round166_plot_geometry_constants.py`: passed at 1440 px and 390 px; tested actual entry/state of supported pi/e plots and page errors.
- Real Chromium `browser_round146_freehand_shapes.py`: passed at 1440 px, 390 px, and 320 px.
- Real Chromium `browser_round41_3d_pipeline.py`: passed (implicit preview, SVG/JSON/persistence, cancellation and 2D isolation).
- Historical scripts `browser_round145_plot_geometry.py`, `browser_round51r_plot_consistency.py`, `browser_round62_plotting.py`, `browser_round68_geometry_diagram_hierarchy.py`, `browser_round38_plot_fields.py`, `browser_round51h_derived_geometry.py`: failed assertions/selectors related to renamed or removed labels/tools. Their underlying functionality is **not certified** from those runs; do not label these as confirmed application bugs without reproduction.
- Some historical Chromium scripts, including long 3D runs, timed out or did not complete. Full historical browser suite not passed.

## Remaining gaps (not certified)
Exhaustive native and derived geometry constructions across every tool; live drag/recompute/undo/redo for every dependency chain; all 2D/3D mathematical modes under adversarial input, GPU high resolution, long-session memory, all export targets and saved-state migration; physical-mobile interaction; full bilingual/theme responsive transitions. These need current-UI test refresh and bounded, instrumented E2E before claiming comprehensive certification.
