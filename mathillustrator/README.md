# MathIllustrator · independent mathematical figure editor (v0.26.0 / Cut 25)

MathIllustrator is an independent browser-first mathematical figure editor under `/mathillustrator/`, separate from MathReader. The current application is a useful **2D baseline**, not a completed mathematical modeling system. It uses static HTML/CSS/ES modules and local browser APIs, with no required server processing or runtime service.

## Install the overlay and make it visible on the homepage

Extract **Cut 23** into the **website repository root**, not into `mathillustrator/` and not into your Downloads folder. This single ZIP is a **cumulative, changed-files overlay relative to Cut 00**: it works over an installation of any earlier Cut 00–22 and includes all cumulative MathIllustrator files and tests. It does not contain the full website or unrelated files.

**Exception to the usual mathillustrator-only overlay:** This cut must update the existing website `index.html` and `tools.html`, because the original pages hard-coded MathReader as the sole application. Those two root files create bilingual MathIllustrator entry links. It modifies no MathReader file, global stylesheet or shared JavaScript. Review site-root pages if your live website has changed since the provided `shaodaji.github.io.zip` baseline; do not blindly overwrite newer custom edits.

After deployment, open the home page and select **Mathematical software → Open MathIllustrator**, or open **Tools → Open MathIllustrator**. The editor URL is `https://shaodaji.cc/mathillustrator/`. Test `https://shaodaji.cc/mathillustrator/tutorial.html` as well. GitHub Pages deployment must publish the `mathillustrator/` folder and the root links together; simply extracting locally does not update the public site.

## Quick start

1. Open `/mathillustrator/`. The left panel contains objects, commands and properties; the middle panel is the Cartesian canvas; the right panel contains icon+caption tools, presets, toolkit visibility and immediate correction settings.
2. In the left command entry, submit `A=(0,0)`, `B=(4,2)`, `Segment(A,B)`, and `Midpoint(A,B)` separately. Use **Move** on the right to drag A and watch the dependent objects update.
3. Try the live 2-anchor rectangle (unlike a free four-point polygon), ellipse, per-point editable radius, live Regular polygon (click center and vertex; choose 3–100 sides in the right panel), Bézier, 3-point angle, freehand, diagram node and morphism tools. Switch presets to see different toolkits, and change snapping/smoothing *before* a stroke. The corrected stroke appears live before pointer release; Escape/pointer cancellation does not commit a half-finished stroke.
4. For topology/category diagrams, use **Import tikz-cd** for a supported subset, or open `examples/diagram-demo.json`. The import replaces the current document only with confirmation; it is undoable.
5. Use **Save** to download native JSON. Use **Export** for viewport/page-cropped SVG, PNG, JPEG, WebP, restricted TikZ, and restricted semantic `tikz-cd` where representable. Unsupported choices are disabled, not faked.

## Important limits

- Supported live object relations are point references, midpoint, geometry created from anchors, and node/morphism attachments. No general constraints, tangent inference, geometric intersections, group transforms or unbounded symbolic geometry. Regular polygons are live constructs, not path-fitted freehand approximations.
- Programmatic functions use a **small safe explicit** parser; implicit equations, arbitrary scripting and ODE/PDE solutions are absent. 3D, Möbius, Ricci flow, animation and a real LaTeX math-label renderer are future modules.
- Native JSON retains editable semantic information. Exported SVG/TikZ are publication depictions and **do not** preserve every dependency. `tikz-cd` preserves supported node/edge incidence but not arbitrary TeX syntax or styles.
- A4/Letter guide and page crop are currently viewport-relative visual ratios, not physical paper-size guarantees. Rasterization is browser-dependent; large scenes are not automatically 60 FPS.

## Reproducible verification

From within `mathillustrator/`:

```bash
node --test tests/*.test.mjs
node --check src/app.mjs
node --check src/model.mjs
node --check src/geometry.mjs
node --check src/diagram.mjs
node --check src/plot.mjs
node --check src/storage.mjs
python tests/tikz_compile.py
python tests/browser_cut07_inventory.py
python tests/browser_cut07_adversarial.py
python tests/browser_cut07_properties.py
python tests/browser_cut06.py
python tests/browser_cut05.py
python tests/browser_cut05_list.py
python tests/browser_cut04.py
python tests/browser_cut04_stale.py
python tests/browser_cut04_pointer.py
python tests/browser_cut04_opacity.py
python tests/browser_cut03.py
python tests/browser_cut03_storage.py
python tests/browser_cut02.py
python tests/site_integration.py ..
python tests/package_integrity.py ..
python tests/browser_smoke.py
python tests/browser_edges.py
python tests/browser_performance.py
```

The Python browser tests require Playwright and a local Chromium binary; they use an **isolated inline-modules workaround**, not actual localhost navigation, because the developer environment blocks local browser navigation. Details and the expanded model regression suite are in `docs/quality/TEST_REPORT_20261112_CUT07.md` and `docs/quality/regression-cases.json`. A published-site, cross-browser test remains required.

## Documentation contracts

- Complete tutorial and precise limitations: `tutorial.html`
- Navigation and development discipline: `docs/INDEX.md`
- Data format and supported objects: `docs/schemas/project-v1.schema.json`, `docs/architecture/OBJECT_MODEL.md`
- Feature-by-feature implementation truth: `docs/planning/features.json`
- Scope roadmap: `docs/planning/ROADMAP.md`
- Bugs, risks, measurements, tests: `docs/quality/`
- Delivery rule: **each code/doc iteration includes a ZIP overlay**, normally containing only new/modified `mathillustrator/` files. **Site-root integration is a documented necessary exception** for root HTML navigation links. No scattered files and no MathReader changes.

## Cut 04 audit and targeted changes

- Visible live preview of corrected freehand strokes and final pointer-up coordinate capture; click-only selection no longer changes off-grid point coordinates.
- Reused project IDs are not authority: old detached property fields, delete buttons, and object list controls cannot mutate a replacement document.
- `tikz-cd` handles TeX `\&` as a literal label ampersand, and export refuses any source that would change nodes, labels or morphism incidence if reimported. Unsafe exports are disabled before clicking.
- Same-version storage events adopt the other tab’s exact persisted token rather than triggering a false conflict on the next edit. This is *not* transactional multi-tab merge.
- SVG/editor/TikZ labels respect zero opacity; invisible points have no invisible hit target overlay. New points get a per-object editable Point radius, legacy v1 projects remain readable without that property.
- Evidence: `docs/quality/TEST_REPORT_20261112_CUT04.md`, `docs/quality/cut04-regressions.json`. Isolated Chromium and Node do not replace deployed-site verification.


## Cut 05 (v0.6) — publication-safe SVG and bounded rendering

- SVG arrowheads are actual filled triangle geometry rather than SVG `<marker id>` references. Multiple separately exported figures can be embedded in a single publication without marker-ID collisions or cross-figure color leakage. Arrowheads inherit each object's color/opacity; compare SVG and raster output when preparing print-quality figures.
- Point picking now happens in document coordinates at pointer-down; selecting a point through a later-filled polygon remains possible, but thousands of redundant transparent SVG hit circles are no longer created. Invisible points never intercept clicks; locked points remain selectable but are not draggable.
- Points far offscreen are culled from SVG rendering when they cannot contribute visible labels. Native JSON still retains every object, and Fit/dependency resolution still uses the full document. Performance is scene/viewport dependent.
- The left object list now draws only a bounded window of 45-pixel rows (with overscan). All objects remain available by scrolling or filtering; click/lock/visibility/rename/undo are tested with 3,000 objects. Full keyboard/screen-reader navigation through a virtualized list is **not yet certified**.
- Cumulative package fix: `tests/model.test.mjs` was missing from earlier Cut04 ZIP despite being used in its working-tree test count. Cut05 includes it and re-runs all model tests from extracted ZIP bytes.
- New tests: `tests/browser_cut05.py`, `tests/browser_cut05_list.py`, `tests/cut05.test.mjs`; current release evidence: `docs/quality/TEST_REPORT_20261112_CUT05.md`. Existing regressions remain in place.
- Still open: localStorage cannot guarantee atomic simultaneous writes, true deployed-site/cross-browser and mobile touch behavior are not verified, and densely visible geometry can still miss a 60 FPS budget.

## Cut 06 — v0.7.0 (new subtle regressions)

- **Drawing fidelity:** short segments, circles, polygons and regular polygons no longer snap a later vertex to an anchor just created earlier in the *same gesture*. The app snapshots available visible anchors first; invisible zero-opacity points are not automatically used as snap targets. Existing named references remain live.
- **LaTeX reproducibility:** hidden unsupported objects do not disable TikZ export. Exporting the same mathematical document at different canvas zooms yields identical TikZ code; CSS pixel strokes map to 0.75pt/px rather than changing with viewport zoom. Publication font matching remains approximate.
- **Settings:** disabling the Basic toolkit hides Point, but never removes the essential Move/Pan controls. JSON import rejects infinite canvas paired with page-only export, while preserving older v1 defaults.
- **Persistence:** normal autosaves use origin-wide Web Locks when available, reducing simultaneous-tab overwrites. The lock-free and final `pagehide` paths remain non-atomic; never treat this as cloud sync or guaranteed conflict-free editing. The editor explicitly pauses on a detected conflict and offers manual resolution; save JSON before replacing a version.
- **Quality:** `tests/browser_cut06.py`, `tests/cut06.test.mjs`, and `docs/quality/TEST_REPORT_20261112_CUT06.md` capture the red/green record. Browser checks use local inline-module harness, not a hosted-site HTTP test.

Cut 06 also restores **four Cut00 files absent from the previous cumulative overlays** (the original geometry and analysis examples, ADR-0001, and original test report). This prevents missing-example and missing-history problems on a fresh installation. The release now has an automated extracted-package inventory gate.

## Cut 07 — v0.8.0 (feature-by-feature audit, not a completeness claim)

- Exercised every currently exposed drawing tile and the documented programmatic command family using isolated Chromium. New rectangles store two opposite-corner point refs; legacy polygon rectangles remain unchanged.
- Covered all individual Settings inputs, six presets, module visibility, basic layer/object controls, format buttons, and additional property-specific scenarios in new inventory, property and adversarial browser suites. Coverage truth and exclusions are in `docs/quality/cut07-control-matrix.json`.
- Removed silent prompt truncation, protected a delayed JSON import from overwriting intervening project edits, and isolated destructive shortcuts while import/export dialogs are open. Focus returns after Escape.
- Corrected a real quick-edit race: deferred property-panel replacement could discard valid successive edits. Rejected edits still restore previous values.
- TikZ output remains a narrow pdfLaTeX-oriented subset: currently unsupported visible Unicode/control text disables TikZ instead of producing likely uncompilable source. The SVG and native JSON options remain usable.
- Test provenance and remaining limits: `docs/quality/TEST_REPORT_20261112_CUT09.md`. Not a deployed-site/cross-browser/mobile certification.

## Homepage and Tools-page integration (Cut 07)

The ZIP also contains `index.html` and `tools.html`, now giving the independent MathReader and MathIllustrator tools equal prominence directly below the homepage's featured equation, with hero shortcuts, a dedicated tutorial link and responsive bilingual cards. It does **not** replace site-wide CSS/JS or MathReader files. The existing site asset `assets/img/tool-mathreader-file-search.svg` is reused. Review any local homepage changes before extracting the root HTML files. The new homepage test runs against the site's original `assets/css/style-v15.css` and `assets/js/main-v15.js`, so execute it from a merged website root, not a mathillustrator-only ZIP extraction.

## Cut 08 — v0.9.0 (live-geometry, numeric, XML and large-search audit)

- Previously valid live segments, circles, regular polygons, nonzero-area rectangles, angles, polygon edges and diagram morphisms no longer silently collapse when a point/node is dragged or edited to a coincident location. A refused edit/gesture restores document state and retains undo correctness. **This is not a full geometry solver**; an imported legacy degenerate project remains importable, and unrelated movement is not blocked.
- Runtime project validation rejects characters illegal in XML 1.0 SVG labels/names (including NUL and lone surrogates), rather than exporting malformed SVG or silently changing text. Schema rejects C0 controls; full surrogate validation is in runtime because JSON Schema regex behavior differs between languages.
- Snap interval accepts 0.000001 through 1000 world units, rejecting subnormal intervals that would overflow `roundSnap`. The UI, JSON schema and runtime validation use this same minimum.
- Object-list search indexes referenced names once per filter; a controlled 4,000-object isolated Chromium probe found a ~28.7 ms Cut07 median versus ~6.9 ms Cut08 median across six query changes. This is search-filter time only, not 60 FPS or import time.
- Cut 08 overlay includes `index.html` and the **latest** root `tools.html` from the separately delivered Tools-page integration update, not the older version from Cut07. No MathReader source is touched.
- Evidence: `docs/quality/TEST_REPORT_20261112_CUT08.md`, `cut08-regressions.json`, `cut08-package.json`, `tests/cut08.test.mjs` and `tests/browser_cut08.py`. Existing older reports are preserved.

## Cut 10 (v0.11.0)

Safer TikZ numeric export, cancelable stale raster completions and interrupted-gesture rollback. Read `docs/quality/TEST_REPORT_20261112_CUT09.md` for verified vs. unverified behavior. MathReader is independent; website root `index.html` and `tools.html` are included in cumulative release ZIPs.

## Cut 10 / v0.11.0 incremental quality release

- Diagram morphisms stop at estimated node-box boundaries. A too-crowded diagram may temporarily suppress the visible arrow, without removing the semantic edge from JSON; moving or zooming to separate boxes restores it. Styling and full TeX font metrics remain approximate.
- Repeated redraws of unchanged explicit functions reuse bounded, viewport-keyed SVG path strings. Changing expression, view center, zoom or canvas dimensions triggers resampling. This does not cache dynamic ODEs or prove plot topology.
- Infinite straight lines are clipped to the viewport before SVG construction, preventing huge DOM coordinates after extreme pan. Source anchor positions and JSON are not clipped.
- Export popup has a dismissible pointer backdrop and focus loop; object-list rows support ArrowUp/ArrowDown/Home/End navigation. These are not a full accessibility certification.
- Read `docs/quality/TEST_REPORT_20261112_CUT10.md`, `docs/quality/cut10-regressions.json`, and `docs/quality/performance.json` before modifying any of these behaviors.


## Cut 11 · v0.12.0

Adds adaptive multiline node labels, Fit accounting for fixed-size labels, precise small-coordinate display, and lazy spatial indexing of point/midpoint picks. Right-panel function plotting now has Fast/Balanced/Detailed settings, an explicit sample budget warning, and export suppression for an incomplete budget-limited plot. The Analysis / plots preset selects Detailed. SVG is preferred for wrapped diagram labels; plain TikZ is disabled when browser wrapping would be lost. Native JSON remains v1, with optional `plotQuality` for backward compatibility. Scope and test provenance are in `docs/quality/TEST_REPORT_20261112_CUT11.md`. The cumulative overlay includes root-level homepage and Tools integration unchanged from Cut10.


## Cut 12 · v0.13.0

Fit ignores fully transparent objects and diagram arrows whose endpoint nodes are hidden. Hiding a browser tab cancels unfinished Move and Pan gestures through a `document` visibility listener. Multi-vertex constructions now reuse the pre-gesture spatial index instead of re-scanning the entire scene per vertex. These changes do not alter version-1 project JSON. The Cut12 quality report and `cut12-function-inventory.json` describe exactly what was tested and what remains for staged all-function verification.

## Cut 13 — Settings and UI recovery (v0.14.0)

- Drawing presets now classify customized anchor snapping, point-label visibility and polygon-side defaults as **Custom**. Selecting a preset resets those three construction defaults alongside its styles and visible toolkits; page size, export options and theme are *independent* and remain unchanged. Existing artwork is never restyled by a preset.
- Destructive Delete/Backspace shortcuts only apply with canvas, document body or an object-list row as the active context. Focusing Zoom, Save or another toolbar button cannot silently delete geometry.
- Changes to **Export area**, **Include grid/axes in exports** and **Raster resolution** update JSON/undo/autosave, but do not rebuild the currently displayed SVG or sidebar. They do not affect the current illustration; changes to canvas grid/page/background still trigger redraws.
- Historical v1 points/midpoints lacking an explicit individual radius are *pinned to their current visible radius* when changing the new-object point-size default. This additive per-object field preserves the artwork while applying the requested size to future points. Undo retains the pre-migration JSON; no silent import-time migration.
- Verification: 93 model tests and 23 isolated Chromium scripts (see Cut13 report), with a 2,500-point export-scale change benchmark. Not a deployed-site or multi-engine certification.

- Run `python tests/package_integrity.py ..` from within the extracted `mathillustrator/` directory to check Cut13's current cumulative file list and hashes. Previous cut manifests are archived data, not current release gates.

## Cut 14 — v0.15.0

**Transient construction state cannot cross document boundaries.** New, Open JSON and semantic import remove any unfinished click-by-click shape (two-point shapes, polygons, diagrams), but do not delete already committed objects. Switching tabs or losing window focus also discards an unfinished construction; restarting it is intentional, not an autosave failure. Undo/Redo retains only completed document transactions, not temporary cursor previews.

**Asynchronous file safety:** a delayed JSON file read is ignored if either project content or project identity changed during reading, even if both documents happen to be byte-identical empty documents. IME composition is protected from destructive and dismissing global shortcuts. Zooming while a drag is active cancels the incomplete drag before changing coordinates.

**Autosave failure:** if browser storage rejects a write (e.g. quota), the status explicitly says it is not locally saved; use **Save** to download native editable JSON. After storage becomes writable, a subsequent document edit retries saving. Quota behavior was tested with a controlled browser storage double; real-browser and genuine multi-tab storage concurrency are not certified. See `docs/quality/TEST_REPORT_20261112_CUT14.md`.

## Cut 15 — v0.16.0
Touch drawing now treats a single-finger release (rather than contact start) as a committed tap, blocks accidental two-finger geometry, and cancels interrupted drafts. Pen pans consume their final up position. On narrow phones, Save/Export stay visible because the header wraps; coarse-pointer targets are larger, and the stage follows measured header height. Wheel input recognizes pixel/line/page delta units. The app remains independent of MathReader.

Testing: 97 Node tests, 26 isolated Chromium editor scripts including real *emulated* `touchscreen.tap` at 320/390/700px, and browser export/LaTeX/site checks. These do not establish real physical touchscreen or genuine multi-tab correctness. See the Cut15 report and JSON coverage matrix.


## Cut 16 — v0.17.0: Recoverable local saving and correct cross-tab signals

- Normal saves under Web Locks now treat a byte-identical project already written by another tab as **synchronized**, without an unnecessary storage write or false conflict banner; genuinely different versions still refuse overwrites.
- `storage` events are queued, so an event's payload can describe a no-longer-current intermediate value. The editor now checks the actual latest browser storage content, including `localStorage.clear()`; a stale event does not pause saves incorrectly.
- The conflict banner heading distinguishes a corrupted initial snapshot from a later other-tab conflict, even after the first incident is resolved.
- Failed autosave exposes **Retry local save** in the canvas footer; it uses the same guarded save path, and never silently discards the last good snapshot. **Save** in the header still downloads a lossless JSON backup.
- 100 Node tests and the existing isolated Chromium suite plus new storage recovery tests. All tests rely on the documented harness constraints; genuine same-origin multi-tab atomicity, unload survivability, Firefox/Safari, physical touch and deployed-site behavior are not certified.

See `docs/quality/TEST_REPORT_20261112_CUT16.md` and `docs/quality/cut16-regressions.json` for red/green evidence and limitations.

## Cut 17 — v0.18.0: Export fidelity and mixed-scene SVG cost

- A fully transparent (`opacity: 0`) object stays in the editable JSON, object list, dependency graph and undo history, but is no longer emitted as invisible SVG geometry or sampled when it is a function plot. This saves DOM/evaluation work and prevents transparent labels from affecting exported content.
- TikZ/PGF now omits transparent objects. A visible morphism whose endpoint is transparent is rejected for TikZ export rather than silently drawing an arrow absent from the SVG. Other supported scene content still exports normally.
- Conservative screen-space culling skips bounded offscreen segments, arrows, circles, ellipses, rectangles, polygons, regular polygons, polylines, Bézier curves, angles and freehand strokes. Crossing or near-edge shapes and thick strokes remain visible. **Infinite lines, text, labels and semantic morphisms are not culled by an unsafe approximate box.** Panning brings stored offscreen objects back: no document object is removed.
- On a fixed synthetic 3,840-object scene, isolated Chromium median SVG rebuild time changed from 20.45 ms (Cut16) to 6.30 ms (Cut17); 12 repeats per version, not cross-device FPS or a large-scene guarantee.
- See `docs/quality/TEST_REPORT_20261112_CUT17.md`, `cut17-regressions.json`, `cut17-performance.json`. The legacy Cut04 opacity test's assertion has been tightened from *must exist with alpha 0* to *must be visually absent*, and that change is documented as a deliberate representation-level contract update.

## Cut 18: export transparency and whitespace correctness (v0.19.0)

Settings → Page and output now has **Transparent SVG / PNG / WebP** (OFF by default). This applies only to downloaded images; the editor canvas background color does not change. JPEG is disabled while alpha is requested, because the format cannot preserve alpha. Turning the option back off restores JPEG when the browser encoder supports it. Zero-opacity backgrounds are not simulated with white pixels. Label backgrounds on semantic arrows do not introduce an opaque halo into transparent export.

SVG `<text>` uses explicit `xml:space="preserve"` to retain repeated/leading/trailing spaces. The restricted pdfLaTeX TikZ export option is disabled for any visible label whose leading/trailing/doubled spaces would otherwise silently collapse. Older v1 JSON missing `exportTransparent` opens with `false`; the project format remains version 1. Browser pixel checks verify actual alpha for PNG/WebP and opaque default exports. No Firefox/Safari pixel-fidelity claim is made.

The downloadable-pixel regression suite requires Playwright, local Chromium and the Python Pillow package (only for tests, not the application). Current evidence: `docs/quality/TEST_REPORT_20261112_CUT18.md`, `docs/quality/cut18-regressions.json`, `tests/cut18.test.mjs`, `tests/browser_cut18.py`.

## Cut 19 — v0.20.0: precise multiline math labels and offscreen UI cost

- Diagram-node automatic wrapping now preserves **every author space**; splitting a display line never changes mathematical notation. Exact editable JSON text is unchanged.
- Select a text, diagram node or morphism in the left object list. Its **Text / label** or **Arrow label** control is a multi-line textarea: Enter inserts a line break, and clicking outside commits. SVG text and arrow labels render those line breaks as separate `tspan` lines. Ordinary single-line behavior and disabled unsupported TikZ exports remain intact.
- Text and node SVG items wholly offscreen are conservatively skipped during drawing (never removed from model or JSON). Long visible labels and arrows crossing the viewport remain available.
- In a synthetic 2,520-label scene with 2,400 offscreen, Cut18 median SVG rebuild was 43.80 ms versus Cut19 8.75 ms (12 rebuilds each, isolated Chromium), **80.0% shorter only for this workload**. Actual layout/font fidelity, mostly-on-screen performance and physical hardware remain unverified.

See `docs/quality/TEST_REPORT_20261112_CUT19.md`, `cut19-regressions.json` and `cut19-performance.json`.

## Cut 20 — v0.21.0: crowded selection and labels

Move mode now supports **Ctrl-click** (Command-click on macOS) to cycle all hit objects beneath the pointer, including coincident points and overlapping diagram nodes. Normal clicks and drags work as before, and Shift/Alt dragging still pans. Right-panel **Point label placement** offers Standard (compatible default) and Avoid nearby overlaps (an opt-in approximate screen-space positioner). No author text or geometry is rewritten. When avoidance is enabled for visible labeled points, restricted TikZ export is disabled because its fixed above-right labels would not reproduce the arrangement; use SVG/PNG/WebP or lossless native JSON. Dense scenes can still contain overlaps, and the optional layout costs CPU. See `docs/quality/TEST_REPORT_20261112_CUT20.md` and `cut20-performance.json`.


## Cut 21 — semantic arrow routing and label controls

The editor now offers opt-in obstacle-aware two-turn routing for semantic morphisms and four manually editable screen-space label-position values. The old path remains the default. Routing that cannot avoid obstacles is marked dashed amber; restricted TikZ is disabled for visually nonrepresentable routes, while native JSON and SVG remain lossless for supported screen-space views. See `tutorial.html` and `docs/quality/TEST_REPORT_20261112_CUT21.md` for limitations, settings, regression provenance and performance measurements. JSON project version remains 1.

## Cut 22 — v0.23.0: selected morphism label dragging

With the **Move** tool active, select a labeled morphism in the left object list. A small purple-outlined **editor-only** circle appears beside its label. Drag that handle to adjust the label's horizontal and vertical screen-space shifts; release to commit exactly **one undoable change**. Escape/window blur, pointer cancellation, and project replacement discard an unfinished gesture. Clicks and sub-2px pointer jitter do not round existing fractional values or modify history. Locked/unlabeled arrows do not expose a handle. Shift/Alt/Ctrl/Command clicking remains reserved for selection/panning behavior. Property fields remain available for precise keyboard editing and accessibility.

SVG, PNG and WebP exports omit the editor handle; native JSON stores only existing `labelDx`/`labelDy` settings. Restricted TikZ continues to refuse nondefault screen-space positions; restricted `tikz-cd` exports semantic relationships only. The project JSON schema stays **version 1**, no migration is required. Large shifts are clamped to the existing ±300px range. Real hardware, Firefox/Safari and exact font positioning are still unverified. See `docs/quality/TEST_REPORT_20261112_CUT22.md`.


## Cut 23 — v0.24.0: opt-in morphism-label collision avoidance

Select an arrow (morphism) in the left list and check **Avoid nearby nodes / labels (best effort)** under Properties. This preserves all mathematical object identities, author text, reference endpoints, and arrow paths, while choosing a nearby screen-space label position avoiding visible node rectangles and other morphism labels. Manual labels always take priority. If no safe candidate exists, the label remains visible in amber with an unresolved-collision warning. Click a selected label's purple handle and drag to switch that label to explicit manual offsets. Stationary clicks, canceled drags and Undo restore the previous state. JSON v1 persists the optional `labelAvoid` boolean (legacy absence means off); SVG and raster reflect the visible arrangement. The restricted TikZ output is disabled for opted-in visible labels because exact placement is not supported. See `tutorial.html` and `docs/quality/TEST_REPORT_20261112_CUT23.md`.

## Cut 24 — v0.25.0: reduce crossings between earlier diagram arrows (optional)

In a morphism's Properties → **Arrow routing**, select **Reduce earlier arrow crossings (best effort)**. This retains live source and target references but tries bounded node-clear two-turn corridors while preferring fewer strict interior crossings against **earlier visible** arrows. Legacy Direct and Avoid diagram nodes modes are unchanged. Hiding/repositioning an arrow triggers rerouting; Undo/Redo preserves the JSON setting. Unsolved crossings, blocked node routes, or inspection caps appear as **dashed amber** paths with an explanation; no false successful correction. The result is order dependent, cannot guarantee a planar or minimal-crossing drawing, and does not detect all overlaps, shared-endpoint ambiguities or label crossings.

Native JSON remains version 1. SVG and supported raster formats depict the current geometry; TikZ visual export is disabled for unsupported crossing-optimized paths. `tikz-cd` remains the separate semantic, not appearance-faithful format. This cut also shares computed routes between arrow rendering and automatic label placement and prevents export drawing from overwriting on-screen label-handle state.

Evidence: `docs/quality/TEST_REPORT_20261112_CUT24.md`, `cut24-regressions.json`, `cut24-browser-results.json` and `cut24-performance.json`. The scenario is **48 nodes + 80 arrows**, with median SVG rebuild 7.75 ms for Avoid nodes and 7.90 ms for crossing reduction in isolated Chromium; no universal performance claim.

## Cut 25 — v0.26.0: optional all-visible-arrow inspection

In Properties → **Arrow routing**, choose **Consider all visible arrows (max 48)** to let a morphism consider both earlier and later visible arrows. Unlike the Cut24 earlier-only mode, the opt-in `scene-crossings` route is refined against other edges in at most two bounded passes. Fixed/direct and previous modes never change automatically. Unsolved/over-limit routes are dashed amber, and collinear overlaps / T-junctions now count as conflicts for this mode. Node refs, JSON identity, and labels remain unchanged. Only screen-space presentation is optimized, not graph planarity. Restricted TikZ cannot reproduce the refined path and is disabled for this mode; native JSON remains editable schema v1. See `docs/quality/TEST_REPORT_20261112_CUT25.md` for the limits and evidence.
