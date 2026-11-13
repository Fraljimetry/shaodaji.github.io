# Cut 25 — v0.26.0 · scene-aware diagram routing

**Baseline:** Exact Cut24 cumulative overlay (212 archive files). **Scope:** one optional morphism routing mode, new visual conflict detection, stronger failure signaling, regressions, tutorial/JSON/docs, no MathReader edits. Site-root `index.html` and `tools.html` remain included unchanged to preserve navigation.

## Reproduced defect and design

Cut24's **Reduce earlier crossings** considers the document-order prefix. In a two-arrow intersection, putting the crossing-aware arrow before a later fixed arrow left the first arrow unable to see that later obstacle. The feature was not defective relative to its documented contract, but the limitation frequently surprises authors of semantic diagrams who reorder objects.

Cut25 introduces **Consider all visible arrows (max 48)** as a separate, opt-in choice, represented by `routing: "scene-crossings"` on a morphism in JSON v1. The existing `direct`, `avoid`, and `avoid-crossings` semantics do not change. A scene-aware edge can move its *screen-space path* away from both earlier and later visible arrows; it does **not** modify mathematical `refs`, nodes, data, or other modes. The algorithm starts from the node-aware path and makes at most two deterministic local relaxation passes. It does not promise a planar drawing or globally minimum crossings.

Unlike the older strict interior-only detector, the Cut25 mode counts collinear partial overlaps and T-junction contact as visual conflicts, but excludes contacts where both segments merely share endpoints. All runtime work is bounded: max 48 drawable visible arrows, max two passes, max 8,192 segment-pair checks per candidate. Over-capacity, blocked or unresolved outcomes are amber/dashed rather than falsely reported as solved. Historical undrawable overlapping arrows remain in native JSON but do not consume crossing work.

## Red / green evidence

- **Node:** `tests/cut25.test.mjs` covers later fixed arrow awareness, legacy immutability, exact deterministic results, capacity, malformed geometry, JSON schema/runtime rejection, historical overlap exclusion, collinear/T-junction classification and duplicates.
- **Browser:** `tests/browser_cut25.py` uses the right Properties selector, imports a cross/blocked-capacity project, verifies displayed routes, SVG/JSON export, TikZ disabled, hide, Undo/Redo and invalid-import preservation.
- **Inherited:** All 36 isolated Chromium editor scripts pass when run in bounded groups. An earlier monolithic run timed out after its first 11 scripts; inventory and remaining scripts were rerun separately. Do not treat that interrupted command as a pass.
- **Compatibility:** JSON project schema remains **version 1**. Existing examples and previous cut paths are preserved. Browser tests use inline module URLs; real navigation and served caching/MIME are not established.

## Performance and correctness limits

In a fixed 16-node/20-arrow isolated Chromium scene, the median SVG rebuild was **2.10 ms Direct** versus **2.75 ms scene-aware**, 12 samples per mode after three warmups. The option adds work, even if the typical difference here is small. Measurements exclude compositor, pointer latency, memory pressure, other browsers and large graphs. Work limits prevent unbounded searching but cause visible warnings; these are not a solver's mathematical proof. A second independently extracted-package observation on the same scenario measured 1.95 ms Direct and 2.40 ms scene-aware; both raw distributions are retained in `cut25-performance.json` rather than selecting one as a universal result.

Global topological routing, edge-to-label collision avoidance, smooth curves, optimal crossing count, complex obstacle mazes, CSS font metrics, and consistent publication placement across browsers remain unsupported/unverified. For publication, inspect final SVG/raster output, especially after zooming or resizing.

## Release gates

Re-run from the extracted cumulative ZIP: Node tests, focused Chromium routing and prior regression scripts, example JSON schema, two actual `pdflatex` compilations, eight bilingual homepage/device cases, static site integration, package inventory/checksums and historical file coverage. The final release manifest records the exact results. The public deployment, physical pen/touch, Firefox/Safari and true multi-tab atomicity are not certified.
