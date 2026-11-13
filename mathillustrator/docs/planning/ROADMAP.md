# MathIllustrator roadmap — completed work and explicit future gates

**Principle:** Broad purpose is the long-term goal; no unimplemented mathematical subject should be advertised as an existing mode. Versioned JSON, an accurate tutorial, regression provenance, performance measurements and an incremental ZIP overlay accompany every cut.

## Cut 00 — initial editor (historical baseline)

Three-panel interface, canvas primitives, native JSON document and live midpoint, limited explicit functions/TikZ, SVG/raster exporter, baseline presets. 12 initial Node tests; initial browser execution blocked. See historical `quality/TEST_REPORT_20261112.md`.

## Cut 01 — broader 2D editor, semantic diagrams and robustness (historical)

Implemented ellipse/Bézier/angle/line tools, diagram nodes and morphisms, restricted semantic `tikz-cd` import/export, live model validations and iterative long chains, customizable toolkit visibility, expanded object properties, arrow marker colors, page export crop, better bounds, pointer-cancel rollback, overlay hit targets, safer property refresh, cross-tab storage alert, bounded undo memory, runtime image MIME detection and better documentation. **25/25 Node regressions plus isolated Chromium smoke/edge tests pass**. Browser performance measured; 3,000-point rebuild is ~55ms in one isolated run, not real-time 60 FPS. Deployed-site validation remains open.

## Future phase · geometry foundations and editor usability

Prioritize direct manipulation of paths, property-driven point refs and transformations, robust intersections/perpendiculars/tangencies/circles/conics, constraint signatures and configurable tolerance, equal-angle/length markers, smart snapping, arbitrary-shape auto recognition with a priori settings, spatial indexing. Start with a canonical source/renderer interface rather than expanding a large single app module unchecked. Verify 10k mixed scenes and import/cancel/persistence races.

## Future phase · full mathematical diagrams / TeX

General node shapes and ports, routing/labels, commutative squares/cubes, algebraic-topology and category-theory templates, richer `tikz-cd` and safe TikZ parsing, faithful LaTeX math-label rendering and TeX compile reference tests. Never show an enabled export when data/style semantics cannot be represented without an acknowledged loss.

## Future phase · analysis/complex geometry

Möbius transformations, complex plane and Riemann sphere, vector fields, plot layers, parametric and implicit 2D curves where computationally feasible, parameter sliders and controlled analytic visualization. Arbitrary implicit differential-equation solving is not in scope.

## Future phase · genuine 3D geometry and geometric flows

Native camera, surfaces/meshes/manifold patches, lighting/projection, differential geometry annotations, controlled parameterized neckpinch visualizations and data-driven Ricci-flow snapshots. Do not misrepresent a schematic 2D drawing as a solved Ricci-flow PDE.

## Future phase · production figure/animation pipeline

Editable custom templates and saved workspaces, timeline/keyframes, animation, vector PDF, advanced TikZ/Asymptote export, typography controls, reproducibility metadata, accessibility, independent cross-browser quality and scene performance regression thresholds. Cache/worker/GPU layers only with measured advantages and fallbacks made explicit.

## Unresolved release gates (current)

- Hosted GitHub Pages and Windows Edge/Firefox/Safari UI smoke; no HTTP navigation was permitted in developer sandbox.
- Real SVG/raster/LaTeX compilation fidelity test fixtures; precise physical print sizes and text layout.
- Mobile/touch, keyboard navigation, cross-tab conflicts, quota/corrupt storage, and user recovery UX.
- Large-scene profiling with import/export memory and 95th-percentile latency across ordinary laptops.

See `features.json` for exact status of each capability, `quality/KNOWN_ISSUES.md` for open limits, and `quality/regression-cases.json` for evidence.


## Completed Cut 02 (v0.3): deployment/discoverability and subtle regression

- Added entry points on the site home page and Tools page, with English/Chinese variants. They were missing from Cut 00 and Cut 01; this was an actual deployment integration defect.
- Mobile panel rails now reopen usable, scrollable drawers. Header-height alignment is measured rather than guessed; font zoom and wrap remain a cross-device test target.
- Added a semantic, live `regularPolygon` shape (center + first vertex + 3–100 sides), with both command syntax and an icon+caption tool. Added shape properties, JSON schema, SVG and TikZ rendering, and invalid-degeneracy rejection.
- Replaced potentially quadratic transitive deletion with reverse-graph traversal; tightened append transaction semantics and changed stale property mutations to live ID lookup.
- Expanded model and isolated Chromium regressions; HTTP browser navigation is environment-blocked and needs post-deployment verification.

**Next independently verified cuts:** page-relative export and physical print geometry; robust plot discontinuity splitting; project recovery/localStorage fault injection; shape snapping/correction recognition, cross-device mobile touch; direct Bézier handles, multiselection, and semantic geometry constraints. Avoid presenting these as already implemented.

## Completed Cut 03 (v0.4): publication exports, explicit plot safety, state recovery

- Adopted mandatory risk-based subtle-defect review from the MathReader documentation: separate actual passing evidence from untested/future work, test both invalid and valid restoration paths.
- Removed editor-only page guide from images; image grid/axes are opt-in. Added configurable 1–4× raster scale, bounded output size and snapshot-consistent asynchronous raster settings.
- Explicit function plots now use bounded adaptive sampling and break paths across detected nonfinite/very steep spans, without claiming a proof of exact graph topology.
- Corrupt locally stored JSON is quarantined: no edits can overwrite it until the user explicitly resolves the recovery banner.
- Restored pan view on canceled drags, ignored nonprimary pointer input, tightened object-ID validation and new-construction degeneracy handling, while retaining old JSON and flattened-ellipse compatibility.
- The Cut 03 unit and isolated Chromium regression artifacts reside in `tests/`, with corresponding machine-readable case records and honest provenance.

## Completed Cut 04 (v0.5) — state identity, semantic fidelity and pen feedback

- Reproduced and fixed semantically unsafe tikz-cd labels: escaped `\&` no longer changes cell count and exporter validates round-trip directed incidence. Unsafe TeX is disabled, not silently converted.
- Reproduced detached input/delete/list controls mutating a replacement document with reused IDs; guards now require live object identity, not just equal IDs.
- Added live corrected freehand feedback and final pointer-up positions, with cancellation and off-grid click safeguards.
- Same-content cross-tab updates no longer trigger false conflicts on the next legitimate edit, while divergent writes still pause save. This does not make localStorage atomic.
- Fixed opacity-zero label/hit mismatch across SVG canvas/export/TikZ, added editable per-object point radius while retaining backward-compatible version-1 project files.
- New red/green Node and isolated Chromium tests plus performance probes. No cross-browser or live-site certification, and 3,000-point SVG redraw still exceeds a frame budget on measured single runs.


## Cut 05 completed (v0.6) — distinct performance and SVG-embedding risk class

- Corrected global SVG marker ID collision by drawing arrowheads with self-contained polygons, including morphism terminal tangents and per-object colors.
- Removed the redundant transparent hit disk from every point, replaced by geometric nearest-point hit-testing; preserved point priority through filled polygons and covered invisible/locked cases.
- Added conservative point-only viewport culling; made the left object list virtual (45px rows with overscan). Node, browser and 3000-object interaction tests cover drag/undo/search/hide/scroll from the baseline.
- Measured 3k point-only rebuilds at 21.8/41.9/34.2ms in three isolated runs; still above a guaranteed 60 FPS budget. No cross-browser or real multi-tab shared-origin test was possible due browser navigation policy.
- Next: spatial indexing, full scene/label visibility bounds, buffered incremental rendering, event scheduling and explicit performance budget. Prioritize **native PDF/TikZ font fidelity, math text typesetting, general constructions**, and future specialized field modules only after reliable core editing.

## Cut 06 completion and next gates

Cut 06: snap-order defect fixed with preconstruction anchor snapshot; opacity-zero automatic snapping removed; zoom-stable TikZ output and visible-only feature gating; Move/Pan no longer disappear with Basic toolkit; saved-project cross-setting invariant; optional Web Locks normal autosave coordination. No changes to native JSON project version.

**Still required:** real same-origin multi-tab conflict/unload testing; difficult near-degenerate polygon geometry and mathematical angle invariants; print/export Unicode and math font fidelity; full keyboard-only virtual-list navigation; dense-scene culling and spatial indices; true SVG/TeX layout comparison, browser-hosted release verification. Continue targeted red/green cuts without treating a single 3,000-point draw timing as a performance guarantee.
Cut06 also restores the original Cut00 examples and decision/test records omitted by earlier cumulative overlays; preserve full historical file-union coverage in future packages.

## Cut 07 completed / next gates

Completed: per-control tested inventory with conditionally disabled options; live two-anchor rectangles (legacy polygons unaffected); prompt fidelity and explicit limits; stale async JSON-file invalidation; keyboard overlay isolation; rapidly edited property focus stabilization; restricted TikZ label gating. Results and excluded cases are in the Cut07 report and JSON coverage ledger.

Next: cross-browser deployed navigation, native real-tab concurrency, mobile gestures, semantic constraints beyond rectangles, true LaTeX math text and Unicode, proper large-label line layout, performance baseline on multiple devices. Treat every unsupported feature as explicitly disabled or documented partial.

## Cut 09 — completed narrowly scoped safety work

- Read-only TikZ numeric preflight prevents silently collapsed tiny lines, skinny rectangles/ellipses, polygon edges and too-large TeX dimensions. Not a full TikZ correctness certification; longer term introduce a unit/scale-aware publication model and an independent TeX golden corpus.
- Stale raster callbacks are rejected, double-start and infinite waiting bounded; exact transform handles fractional crop dimensions. Next: worker-backed scene freeze, user-visible export progress/cancel, golden PNG/SVG/TeX comparisons.
- Unfinished point/pan/freehand gestures cancel on window blur/visibility transition. Next: real touch, switching browser tabs on hardware, focus capture reliability.
- Real browser multi-tab coordination remains pending; synthetic HTTPS navigation was blocked here. Do not mistake deterministic or simulated storage checks for atomicity.

## Cut 10 delivered, still planned

Delivered: node-border aware SVG morphisms and overlap handling; bounded reusable explicit graph paths; infinite-line screen clipping; export pointer backdrop and modal Tab handling; virtual object-list keyboard navigation. Unchanged: native v1 schema and root homepage/tool discoverability. Next: better font-metric measurement and label collision routing, true responsive SVG/canvas hybrid for mixed large scenes, user-adjustable diagram layout constraints, real multi-tab hosted HTTPS verification, then mathematically rich transformation and 3D modules. No promise of general ODE or implicit solution visualization.


## After Cut11 — next distinct risks

1. Replace approximate browser/TeX glyph widths with opt-in local measurement while keeping deterministic semantic layout and supporting math labels.
2. Add viewport/world spatial indexes for **nonpoint** geometry and hierarchical scene diffing; profile initial index construction, 95th percentile latency and mixed text/function/diagram scenes. Current 4,000-anchor benchmark only measures repeated lookups.
3. Add explicit plot/domain warnings with golden counterexamples for removable discontinuities and closely spaced poles; no claim of exact graph topology.
4. Genuine multi-tab HTTPS save-contention acceptance on a controlled browser, plus browser-specific SVG and canvas export fidelity.
5. Longer-term generalized geometry constraints, complex/Möbius visualization, true 3D surfaces and Ricci-flow illustration; preserve independent mathreader application.

## After Cut13 — remaining UI and Settings audit

Cut13 verified preset/default state restoration, focused deletion safety, export-only redraw avoidance and old-point-radius preservation. All 152 Cut07 control entries are still a coverage **inventory**, not a combinatorial completeness claim. Next stage: keyboard screen-reader focus semantics, continuous inputs/IME composition, invalid or unavailable color pickers, autosave quota fault injection, multi-tab focus/context loss, and realistic iOS/Android touch/pen testing. Preserve the renderer's cached plots and autosave revision invariants.

## After Cut14 — staged audits still required

Cut14 addresses document-boundary draft isolation, tab-hidden draft cleanup, delayed import identity, IME shortcut safety, viewport/gesture consistency and fault-injected autosave recovery. No whole-scene frame-rate change is claimed. Next audit candidates in priority order: real Web Locks multi-tab conflicts and `pagehide` behavior on a testable secure origin; native storage quota/private-mode recovery; touch/pen with scroll and capture loss; accessible modal keyboard semantics and focus during project replacement; high-DPI raster/TeX/SVG golden files and very large mixed-scene performance.

## After Cut15
Prioritize an unrestricted same-origin browser test runner to verify multi-tab storage atomicity, quota and crash recovery; then real multitouch/pen hardware including palm rejection, keyboard/screen-reader navigation, color/alpha and font-parity export goldens across engines, and a 10,000-object mixed-scene profiling matrix. Cut15 did not claim these complete.


## After Cut 16 — remaining staged verification

1. Real same-origin two-tab storage tests with an allowed host/browser environment, Web Locks contention while closing tabs and quota eviction; **blocked in current Chromium sandbox**, not a PASS.
2. SVG/PNG/WebP/JPEG pixel comparisons and TeX text/label fidelity across rendering engines, font availability and page crop.
3. Mixed dependency-graph scene performance and observable main-thread responsiveness under 2,000–10,000 objects.
4. Physical touch/stylus/IME and assistive-technology keyboard navigation, including screen readers.
5. All new feature implementations must extend the tutorial and machine-readable coverage ledger without silently changing the JSON v1 schema.

## After Cut 17

Continue feature-by-feature stability and performance: text/diagram label metrics and layout under Web fonts; richer shape/touch interaction; mixed-scene resolver/list scheduling; clipboard and exact publication export; cross-browser pixel and actual-browser origin persistence tests. Do not equate alpha-zero omission, viewport culling or synthetic render microbenchmarks with a complete GPU renderer, 3D support or universal correctness.

### Cut 18 completed / next

- Completed: transparent SVG/PNG/WebP with explicit no-JPEG rule; back-compatible default and validated setting; SVG whitespace preservation; TikZ refusal on unsupported spacing; browser byte/pixel assertions and alpha regressions.
- Next: genuine Firefox/Safari image-encoding matrix, deterministic font embedding/reproducible typography, large text layout, SVG/CSS whitespace interactions, real multi-tab save contention and mixed-scene profiling. Do **not** claim real-device or cross-browser results from isolated Chromium.

### After Cut 19 — next separate risks

1. Implement optional author-controlled label-offset/anchor placement and semantic routing around crowded diagram boxes; test overlap ambiguity and real font measurement, preserving deterministic JSON semantics.
2. Test near-edge culling with combining characters, RTL scripts, fallback fonts and high-DPI Firefox/Safari. Do not silently hide mathematical text under a heuristic.
3. Optimize mostly **on-screen** 3,000–10,000-object mixed scenes (incremental property/layout rendering, SVG subtree stability, cached text measurement), not merely offscreen scenes.
4. Extend spatial selection to non-point objects and document predictable z-order/hit area behavior when many shapes overlap.
5. Real-origin cross-tab persistence, physical touch/pen, accessibility and hosted release tests remain outstanding.

### Cut 20 delivered / subsequent risks

Delivered: explicit overlap-selection cycling, optional bounded point-label collision mitigation, old-project/preset compatibility, exact JSON/SVG preservation, and restricted TikZ preflight. Next: arrow routing through crowded node diagrams; per-label manual offsets and font-exact metrics; visible-scene WebGL/Canvas hybrid, accessibility for the selection stack, cross-browser export fidelity and 2-tab crash recovery. Source and standalone behavior are testable independently of MathReader.


## Cut 21 completed — limited semantic diagram routing

- Implemented opt-in node-box obstacle detection and four-candidate two-turn corridors. Unresolved geometry is explicitly amber/dashed; semantic references unchanged.
- Added manual morphism label fraction, perpendicular distance and screen X/Y adjustment, with strict v1 JSON bounds.
- Added TikZ export gating, real browser SVG/JSON/undo and hidden-node tests, Node boundary tests, and measured routing-mode overhead.
- **Still planned:** global optimal orthogonal routing, crossing-aware graph layout, draggable label handles, automatic arrow-label collision solver, exact TeX math labels, densely visible 60 FPS performance.

## Cut 22 completed — direct manipulation of morphism labels

Added editor-only handle drag with live preview, bounded screen-space shifts, exactly one undo step per completed gesture, and cancellation/rollback. Resolved the overlapping transparent-hit-target priority issue found in the first red browser test. Exported SVG never includes handles. Root website integrations and schema version remain unchanged. Full inherited regression suite passed in isolated Chromium. Next: collision diagnostics/avoidance for arrow labels, obstacle-aware multi-arrow layout, dense-scene performance, and real browsers/hardware.


## Cut 23 completed — bounded morphism-label avoidance

- Opt-in label collision avoidance for visible node boxes and neighboring morphism labels; prior author-fixed labels reserve their positions before auto placement.
- Pointer handling converts automated location to explicit manual offsets on first real movement, preserving visual continuity and rollback.
- Unsolved layouts are flagged; large scenes need separate whole-frame benchmarks and possible incremental rendering. No global crossing optimizer, exact text metrics, or automatic math typography.

## Cut 24 milestone — opt-in earlier-arrow crossing reduction

Delivered: document-order two-turn detours, strict proper-intersection tests, node obstacle checks, visibly marked unresolved/capacity states, edit/export/undo/JSON compatibility, and documented bounded performance. No scene is globally rearranged; old projects default to their original routing. Future work: orthogonal/spline global router with better corridor search, exact font/label obstacles, selective route caching/spatial index, explicit arrow-overlap handling, giant-scene memory/latency instrumentation, accessible failure summaries, and Firefox/Safari plus physical-device testing. Any optimization must retain deterministic ordering and never silently drop mathematical references.

## Cut 25 delivered / next routing work

Cut25 adds opt-in bounded all-visible-arrow refinement, JSON v1 support, testable warnings and new overlap/T-junction conflict detection; preserves direct and earlier-only modes. The 48-drawable-arrow cap and two-pass local search intentionally avoid runaway work. Future work: obstacle-grid or visibility-graph routing with more bends, arrow/label interactions, global objective evaluation with stable rerouting, on-screen layout and large-scene memory measurement, real multi-tab/browser/hardware testing. Avoid claiming current mode is a global graph optimizer.
