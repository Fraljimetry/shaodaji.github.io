# Round 172 — Geometry picking policy

## Root cause
Earlier revisions had divergent paths: SVG click stacking for some constructions, a point-only anchor index for Move, a separate hover resolver, and special point-first exceptions for Circle Inversion and other transformations. An overlapping later-drawn line could intercept a point in one tool but not another.

## Corrected behavior
A pure semantic ranking module orders screen-space point anchors and actual live SVG hit elements after filtering hidden objects and tool-incompatible shapes. The first eligible candidate has the highest semantic rank (points, finite strokes, infinite strokes, conics, regions). Distance order is retained for multiple point anchors; SVG stacking is a tie-breaker for equal-rank nonpoint elements. This does not reorder paint layers. An incompatible point never captures a click intended for a circle/curve. Hover, ordinary Move and construction candidates use that same core.

Point on Object is explicitly restricted to eligible shapes while selecting its source. Ctrl/Cmd-click cycling remains available. All common hover/clicks use the indexed point anchors and browser's actual SVG hit stack, without per-pointermove full-document scans.

## Evidence and limits
See `TEST_REPORT_CURRENT.md` Round 172 entry and tests `round172_geometry_picking.test.mjs`, `browser_round172_universal_geometry_pick.py` plus the Round 167/168/170/171 browser regressions. Broad historical suite, physical touch, giant-scene profiling and hosted deployment remain outside this round's executed scope. One transient 390-px browser fixture failure passed on unchanged rerun and is documented.
