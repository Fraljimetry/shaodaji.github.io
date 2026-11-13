# ADR-0004 — Screen-space label layout and lazy anchor indexing (Cut 11)

**Decision:** Keep the mathematical document model separate from screen-dependent rendering. In this static browser-only editor, diagram-node text is plain text, not evaluated HTML or TeX. A deterministic bounded line-layout utility estimates its screen pixel box and provides the same dimensions to the SVG node rectangle, SVG `tspan` text rows, edge clipping and Fit viewport. Exact font metrics, mathematical LaTeX, and obstacle avoidance are future features; no silent conversion to equivalent TikZ is claimed. Disable geometric TikZ export when auto-wrapping is needed.

For cursor performance, build an ephemeral 32-pixel grid index of rendered visible, nontransparent point/midpoint anchors on first query. Do not serialize the index to JSON. Invalidate on document revision/generation changes, zoom/pan and viewport resize. Preserve the old earliest-anchor tie behavior for mathematical snapping (an audit uncovered 16/120 tie changes in the first indexed implementation); picking overlapping points deliberately prioritizes the topmost layer. Preserve the separate pre-gesture anchor snapshot when constructing multiple new vertices.

**Performance tradeoff:** The first pointer query builds an O(N) index, repeated queries are local. Very high density in one grid bin and full SVG reconstruction remain potential hotspots. Benchmark first lookup, 95th percentile and memory usage before general performance claims.

**User safety:** A plot detail control exposes the resolution/CPU tradeoff; bounded adaptive screen sampling does not prove topology. If the evaluation budget is exceeded, mark the view incomplete and disable image output instead of silently delivering a partial publication figure. Native JSON remains editable and available.

**Rejected alternatives:** Mutable global geometry cache persisted in project files; silent export of visually wrapped labels to one-line TikZ; automatic reduction from Detailed to Fast without explicit user choice; treating a passing Node microbenchmark as a device frame-rate guarantee.
