# Standing MathIllustrator adversarial regression policy — Cut 03 onward

**Mandatory for every feature, Settings control, bug fix, import/export change, or regression sweep.** Adapted to mathematical drawing from the user-supplied MathReader v436 `REGRESSION.md` and documentation index. Do not equate a passing happy path with release readiness. Preserve older evidence separately; never overwrite what an earlier release actually tested.

## Review matrix — apply risk-based and record omissions

1. **Interaction / time** — multiple pointers; drag start/move/end, Escape, pointercancel and lostpointercapture; rapid clicks/double-click; state changes while a popup is open; resize and panel transitions while editing; stale asynchronous SVG/image exports; undo/redo during work; delayed listeners and timers after import/reset. Restore the pre-operation state on rejected edits.
2. **Semantic geometry** — shared and hidden anchors, locked dependents, reference identity, deep/diamond/cyclic graphs, self-reference, degenerate/near-degenerate constructions, point order, nonfinite coordinates, singular function plots, offscreen curve behavior, numerical tolerance and world-to-screen zoom extremes.
3. **Persistence and compatibility** — old v1 JSON with missing optional properties, malformed or oversized ID/coordinates, storage corruption, quota denial, multiple tabs and conflicting writes, pending debounce on reload/other-tab import, serialization fidelity, `nextId` consistency and undo snapshot integrity. Do not assume localStorage is transactional. Native JSON is the durable editable source.
4. **Export / publication** — current region vs artboard crop, editor-only guide exclusion, configured inclusion, incomplete/unsupported formats disabled, alpha/background, actual decoded PNG/JPEG/WebP MIME and pixel dimensions, SVG round-trip, TeX syntax and compilation, font/label escaping, normal and edge-case styles, no silently substituted output.
5. **UI / settings** — EVERY setting's initial value, valid/invalid updates, reload, preset override, undo/redo, import from older version, narrow-screen controls, both theme states, keyboard access and error messages. Confirm an invalid edit does not leave a stale property editor or reset unrelated fields.
6. **Throughput / failures** — 100, 1000, 3000+ objects; long freehand paths; large function plots; memory and frame time, failed blob downloads, interrupted SVG decode, failed localStorage, nonblocking rendering; explicitly record environment and whether metrics are draw-only or end-to-end.
7. **Evidence** — distinguish Node model assertions, isolated browser DOM/gestures, synthetic storage events, real TeX compilation, static website/path assertions, actual deployed HTTP behavior, cross-browser screenshot comparison, and genuine mathematical/numerical correctness. A blocked run, skipped case or nonexistent environment is **UNVERIFIED**, not PASS.

## Required workflow

1. Verify the *actual supplied source/overlay* and MathIllustrator version. Preserve `mathreader/` untouched. Identify invariant, failure mode and neighboring risks.
2. Reproduce a confirmed bug against the unmodified baseline with a red test when feasible. For every stateful path, include an adversarial path (cancel/retry, invalid/valid, stale completion or update conflict).
3. Make a bounded coherent fix, add a deterministic regression, and execute that test plus neighboring tests. Do not silently repair or fallback after errors. Re-run schema consistency, JS syntax, representative UI interactions and package integration.
4. Synchronize user tutorial, `manifest.json`, `features.json`, project JSON schema, architecture, known issues, regression inventory, performance measurements and per-cut report with the *actual behavior*. Mark unsupported options disabled.
5. Release only a ZIP overlay with root-relative paths, independently verify ZIP integrity, simulate overlay over earlier cuts and confirm MathReader files remain untouched. The static homepage `index.html` and `tools.html` are explicit integration exceptions because MathIllustrator links are hard-coded there.
6. State what was **NOT VERIFIED**, exact tests and their provenance, performance caveats, and user-facing limitations. Never claim the platform is complete based on a narrow smoke suite.

## Test priority after any patch

- High: semantic data loss, invalid document import, lost update, incorrect export, wrong mathematical geometry, inconsistent undo, unclosable UI or accidental overwrite.
- Medium: stale selection, hidden objects, invalid setting rollback, performance/cancellation, escaping and snapping.
- Lower: aesthetic spacing, typography, keyboard or tooltips — still required before production-grade release, but do not substitute them for high-risk gates.

**Permanent:** Search for subtle second-order defects in the affected feature and its neighbors *every time*, not only when explicitly asked. Increase risk coverage incrementally and keep the original case identifiers stable.


## Cut 05 new standing gates

- **SVG global namespace:** Whenever adding IDs, filters, gradients, clip paths or marker references, verify two independently exported figures embedded in one document cannot reference each other's elements. Prefer explicit per-object geometry where practical; preserve both colors and alpha.
- **Viewport culling:** Test current viewport vs data integrity and JSON export, a point just outside an edge whose label may still overlap the page, pan/zoom reappearance, and selection priority through polygons. Never accidentally delete offscreen model objects.
- **Virtual object lists:** Test the first and last rows, scroll after a hide/filter/rename/undo, selected object not currently mounted, stale DOM event handlers after replacement, and high counts. Verify exact count and retain accessible role/position attributes; do not assume full keyboard or screenreader coverage from a Chromium smoke pass.

## Cut 06 incremental risk gates

- **Multi-anchor cursor transactions:** Nearer than the anchor snap radius, two *new* vertices must remain distinct; repeated *existing* point references must not silently create zero-length new geometry. Re-run against the raw pre-change ZIP for a red test when possible.
- **Visibility asymmetry:** An object may remain in the semantic graph when hidden or opacity zero. Test automatic snapping, cursor hit-testing, editable property references and export inclusion separately; do not treat visibility as deletion.
- **Publication invariants:** Changing editor zoom or virtualized-list state must not mutate mathematical TikZ output. Hidden unsupported types should not disable an otherwise valid export; visible unsupported types must disable instead of silently rasterizing.
- **Offline coordination:** Test two stale synthetic writers, deferred lock granting after a user loads a newer project, quota errors, storage events, and unload separately. Never call this evidence a real multi-tab concurrency pass.
- **Reachable tools:** User-customizable workspace modules must not remove all controls needed to recover or change modes. Verify CSS `[hidden]` behavior against author `display` declarations rather than assuming the DOM attribute always hides a tile.
- **Cumulative release integrity:** Every new cumulative ZIP must cover the *union* of files previously delivered by earlier cuts (unless a deletion is explicitly documented and tested). Verify the extracted archive against a machine-readable manifest; do not omit original example projects, historical design records or baseline regression tests.

## Cut 07 added mandatory gates

- **Per-control inventory:** Record each currently visible tool, setting, property editor, save/open/export/dialog control, plus conditional-disabled entries, not just broad feature names. A checked control is not equivalent to tested on physical touch/hosted site.
- **Focus-and-edit races:** Test multiple rapid changes to different fields with rAF between `.fill` and `.change`, invalid value recovery, blur handling, focused controls after undo, and stale document instances. Never replace an active editor mid-change.
- **Async import identity:** A completed file read must not import over a document modified since file selection. Test delayed file reads followed by construction/undo/new; control-case import without concurrent changes should still work.
- **Geometry semantics:** For types that promise constraints (rectangles, regular polygons), drag an anchor after creation, export, re-import and undo. Do not silently substitute unlinked primitive corners. Keep legacy instances stable.
- **No silent text changes:** Enforce advertised length caps on prompts, property edits and serializers. Disable output formats for unsupported scripts/labels rather than silently truncating, substituting or downloading an uncompilable file.
- **Overlay shortcuts:** With a dialog visible, Escape must dismiss it without committing a drawing. Destructive global shortcuts should not edit the canvas behind the overlay. Restore launcher focus; full focus trap still unverified.

## Cut 07 homepage/website entry gate

- **Real discoverability:** A functioning tool folder and even a valid homepage link do not guarantee users will find the tool. Assert tool cards' placement, equal prominence and standalone launch links; a third empty grid column or a section buried below unrelated content is a design regression.
- **Responsive/localized navigation:** Test English and Chinese using the site's actual language-toggle script; both light/dark CSS variables; desktop and narrow viewport; visible link text/href; no horizontal overflow; preview image availability; durable `#mathreader` and `#mathillustrator` anchors. Recheck homepage when a tool is added, renamed, removed or materially changes capability.
- **Scoped site edits:** MathIllustrator overlay may include `index.html`/`tools.html` as explicit site-root exceptions. Preserve the existing site global CSS/JS and MathReader paths. Static-file and isolated-DOM checks are not proof that deployed GitHub Pages serves the current build or that the browser downloaded it instead of caching.

## Cut 07 invalid-edit recovery / reentrancy gate

- After **valid → valid → invalid → valid** property changes without waiting for rAF, ensure the invalid value never rolls the property back past its most recently accepted value and does not prevent the next valid field edit. Include natural blur after programmatic `change` and check for page errors.
- Preserve the distinction between a *same logical document* reconstructed during validation rollback and a *genuine new/imported/undone document* with potentially reused IDs. Stable IDs alone cannot authorize a detached control from the latter.
- Do **not** synchronously replace focused form children inside an `onchange` handler without guarding reentrant blur/change; that attempted approach caused a real `replaceChildren` browser exception and was discarded.

## Cut 08 distinct-risk gates

- Test **existing valid → degenerate** on cursor drag and property edit, then undo/redo; require whole-scene rollback without an extra history entry. Test imported legacy degenerate → untouched and edit on unrelated anchor; do not invalidate historical v1 projects retroactively. Include intermediate midpoint dependencies and diagram node/morphism collapse.
- Test XML 1.0 forbidden C0 characters and unpaired UTF-16 surrogates in object labels/names before export; preserving Unicode content is mandatory, and silent removal/replacement is forbidden. Schema and runtime have different Unicode expressiveness: report that limitation.
- Include arithmetic failure cases such as subnormal snap intervals causing `v/step` overflow even when both operands are finite; keep numeric UI limits synchronized with schema and validation.
- For large-scene object-list perf, benchmark a **reference-heavy searchable** object graph, not just point-only SVG drawing; measure repeated filter inputs in original and modified source separately. Report sample values and execution environment.
- Every cumulative ZIP must include the latest separately released `tools.html` overlay and the site-root `index.html`; do not accidentally replace the former with an earlier version during packaging.

## Cut 09 additional subtle-case gates

- **Numeric publication safety:** apply the *actual output precision and unit conversion*, not just the pre-export floating-point geometry, when judging whether a shape degenerates. Also test thin axis-wise dimensions, polygon closing edges, hidden/opacity-zero objects and bounds beyond TeX's usable scale.
- **Deferred export state:** after every async SVG decode / Canvas encode boundary, verify the original doc revision, document generation, viewport and export-dialog epoch. An edited, resized or canceled drawing cannot download a stale file. Encode timeout and unsupported MIME must not quietly fall back.
- **Focus-loss transactions:** mouseup may not arrive after tab blur/window hide. Treat point/freehand/pan operations as uncommitted until completion, roll back on blur/cancel, and avoid persisting temporary coordinates. Preserve undo/redo and allow the next gesture.
- **Provenance:** failed genuine multi-tab HTTPS navigation is **BLOCKED/UNVERIFIED**, never an actual tab-concurrency PASS; maintain the runnable test script and record the exact browser policy error.

## Cut 10 new mandatory subtle-case gates

- **Screen-space diagram topology:** Compare actual arrow path endpoints against both node rectangles, not only centers. Test short but separated nodes after font-size edits, true overlap, changes in zoom, hidden/opacity-zero nodes, curved arrows and native JSON semantic persistence. Do not confuse visual layout clipping with removal of a morphism. Test TeX/SVG differences and report them.
- **Plot caching:** A cache hit is valid only if expression and viewport center/zoom/width/height match; visual styles and selection must still be freshly applied. Bound cache size, test eviction and enormous paths, and compare performance against the preceding cut on the same scene. Never turn an approximate discontinuous curve into a certified function graph by caching it.
- **Unbounded geometry / SVG numerics:** Infinite lines must not carry enormous offscreen pixel coordinates; test horizontal/vertical, corners, viewport misses, degenerate source and zoomed-away anchors. Preserve native anchor data and avoid hidden conversion to a segment.
- **Overlay pointer vs keyboard:** An export dialog with a focus trap also needs pointer isolation; dismissing its backdrop must cancel pending raster encoding. Test Escape, Tab/Shift+Tab, late toBlob callbacks, mobile viewport and successful export focus restoration. Update old tests that attempt to click background controls through a truly modal overlay rather than weakening isolation.
- **Virtualized list accessibility:** ArrowUp/ArrowDown/Home/End navigation must preserve focus and selection across recreated DOM nodes, filtered lists and far-off rows. Full assistive technology/device behavior remains unverified until physically tested.


## Cut 11 — patterns discovered from mature graphing systems

- **Multiline semantic node geometry:** Test exact string preservation and explicit newlines, unbreakable long words, Unicode scalar boundaries, node box/canvas text/arrow clipping agreement, fixed-pixel fit margins, TikZ disablement when layout cannot round-trip, and narrow-screen overflow warnings. Do not confuse approximate font metrics with exact TeX layout.
- **Spatial snap index:** Test the very first lookup, cache invalidation after committed/canceled drags, undo/redo, import, viewport pan/zoom and resize; hidden/opacity-zero points, locked but referenceable anchors, midpoints, overlapping layers and equal-distance snap ties. Never snap to newly constructed anchor during the same multi-vertex transaction. Benchmark index construction separately from cached lookups.
- **Plot quality:** Confirm source expression validity, low/high sampling path difference, per-setting project persistence, preset overrides, cache-key invalidation and evaluation ceiling. When detail is lost because of budget, show a visible incomplete-view warning and suppress incomplete image export rather than falsely reporting success. Quality settings cannot certify narrow poles, discontinuities or exact mathematical topology.
- **Malicious project content:** Test SVG/JSON textContent and escaping for markup-looking strings, bad XML codepoints, large text, invalid color values, stale import attempts and unsafe TeX labels. Browser DOM assertions are not a penetration test.
- **Source comparison integrity:** Use exact baseline source and real failure reproduction, not generic listicles of external bugs. An externally reported GeoGebra/Desmos bug is only a hypothesis until verified in MathIllustrator.


## Cut 12 permanent additional gates

- **Lifecycle target correctness:** Attach `visibilitychange` to `document`, test tab/background transition with an in-progress Move and Pan, and distinguish synthetic event tests from real OS/tab suspension. Never persist half-completed gestures.
- **Visible-only viewport calculations:** A hidden or alpha-zero point, label, or a morphism with invisible endpoints must not force Fit away from the visible figure. Data references still exist in JSON. Test empty-visible and re-show transitions.
- **Batch snap parity:** Any improvement to large polygon/polyline/Bézier completion must compare *all resulting reference IDs and inserted coordinates* with the former pre-gesture anchor scan, including ties and exact-threshold cases. Do not optimize a way that silently changes geometric meaning.
- **Staged all-function audit:** Keep the 152-control matrix and the named-function inventory up-to-date. Separate representative script PASS from full cross-product, device-specific and branch coverage; record the remaining verification stages explicitly.

## Cut 15: touch-origin, viewport and mobile navigation gate
- New tool creation on `pointerdown` is unsafe for touch: second-finger contact can follow a primary down. A single-finger tap only commits on pointerup, after final displacement, outside-canvas and cancellation checks.
- Track all originating touch IDs and clear even when release happens outside the SVG; secondary contacts on panels also interrupt drawing. Verify no ghost object, pan, old draft, blocked next gesture or bogus Undo entry.
- Pointerup is authoritative for final pen/pan position even without pointermove. Wheel deltaMode LINE/PAGE cannot be treated as CSS pixel units.
- For <=700px, verify Export/Save remain visible without horizontal document scrolling at 320/390/700px, stage follows wrapped header, and coarse targets remain usable.
- Synthetic pointer events, Chromium mobile emulation, Web Locks mocks and actual phone/stylus/browser-origin evidence are separate provenance categories. Never conflate them.


## Cut 16: queued storage notification and retry integrity

- Treat `StorageEvent.newValue` as a notification, never a durable latest state: queued older notifications can arrive after more recent writes. Read the real storage contents when processing the event; protect cross-tab `clear()` and unreadable storage.
- If a different writer saves identical JSON bytes, treat it as idempotent synchronization **without** extra `setItem()` and without displaying a conflict. A genuinely distinct payload must still block the overwrite. Verify lock-serialized identical writers as well as stale mismatching writers.
- Recovery controls must be actionable: after failed quota autosave, keep the last good snapshot untouched, show failure and a keyboard-operable Retry control, then verify that successful retry saves *the latest* in-memory document and hides retry. Keep native JSON Save available.
- A corrupted startup snapshot and later ordinary storage conflict must have accurate distinct warning headings. Undo/reload and importing a project must not silently clear a conflict banner without resolving storage.
- Keep evidence categories separate: unit/storage double, isolated Chromium UI, local HTTP/hosted origin, actual multi-tab Web Locks contention, real browser quota, cross-browser. A browser blocked from navigating an origin cannot certify atomicity.

## Cut 17: alpha-zero fidelity, semantic visibility and viewport culling

Before optimizing rendering, reproduce baseline output, include positive *and negative* visibility cases, and distinguish the model scene from the SVG DOM. Zero-opacity objects may be retained in JSON/history but must not generate display, invisible mouse targets, expensive function sampling, or misleading TikZ morphisms. A visible edge referencing an invisible node must not silently reappear in TeX. For viewport culling, test geometries that cross the view despite offscreen endpoints, thick near-edge strokes, Bézier control-point hulls, circle radius bounds, malformed values, and redraw after changing camera state. Never cull based on an approximate label box unless proven conservative. A changed representation contract may require updating a historical test; record exactly why rather than deleting the regression. Measure comparable scene, browser, repetitions, DOM count and latency distribution; do not generalize isolated SVG microbenchmarks to end-to-end FPS.

## Cut 18 publication-output rule

For all export changes, test **downloaded bytes** and **decoded raster pixels**, not merely availability of an export button. Include correct transparency, alpha/opaque boundary behavior, fallback-disabled behavior (JPEG under alpha), old-project defaults, undo/reload, page/viewport crop, font/whitespace fidelity, incomplete function plots, and cancellation after changes. Test unsupported formats are disabled rather than relabeled or silently flattened. Keep browser-engine provenance explicit.

## Cut 19 additional mandatory text/rendering checks

Treat displayed text as mathematical data. Every change to line breaks, word wrapping, fonts, label styling, or viewport culling must verify exact original author strings (including repeated/edge spaces, Unicode codepoints and explicit newlines) in native JSON and faithful representation in supported SVG outputs. Never use `trim()` when dividing a label for presentation without a proven reversible mapping. Check text editing through actual keyboard textarea controls, undo/reload, restricted TeX gating and stale-property events. When optimizing offscreen rendering, verify that crossing segments/morphisms, near-edge labels, object-list controls and project exports remain intact. Benchmark complete screen redraws using the same scene and exact predecessor ZIP; retain raw per-run observations and distinguish mostly-offscreen improvement from mostly-on-screen performance.

## Cut 20 addendum — crowded selection and label-cache regression invariants

When adding or changing a selection mode, explicitly verify overlap order and repeated cycling on coincident points, nested SVG elements, hidden/locked objects and normal drag/Shift-pan behavior. Screen-space layout caches must be keyed on committed document revision, project identity and viewport, while bypassed during provisional pointer moves; undo/redo/import must invalidate them. Never alter mathematical names or world coordinates to achieve a prettier drawing. Every new visual placement affecting SVG/raster output must be checked against the capabilities of TeX export, and unsupported representations disabled rather than silently downgraded. Benchmark both fast-path and opt-in expensive modes, including densely visible scenes; do not label test timing improvements as guaranteed FPS.


### Cut21 reminder: semantic graph versus visual routing

For every morphism change, test (1) identical endpoint IDs before and after route/label changes; (2) obstructing node move/hide/opacity/font-size changes; (3) impossible maze, box overlap and zero-length protection; (4) undo/import/export; (5) TikZ visual-fidelity preflight and semantic `tikz-cd` distinction; (6) densely visible redraw overhead and SVG click-target correctness. Never mark a dashed blocked route as solved. Preserve all earlier standard direct/curved behavior.

### Cut 22 addition: direct-manipulation overlays

For every temporary SVG editing affordance (handles, selection guides, control points), test its **stacking order against transparent hit paths**, pointer capture after rerender, export omission, rollback on blur/cancel, click-without-motion, modifier-click conflicts, keyboard fallback, locked/hidden status, and exactly one undo entry for completed gestures. Do not imply pointer hardware/accessibility support from isolated Chromium only.


## Cut 23 mandatory regression additions — automatic morphism labels

- **Manual precedence:** Preserve exact author-configured label positions when automatic labels are enabled or disabled nearby; verify behavior after hide/unhide, zoom and undo.
- **Visual/semantic distinction:** Auto layout may only change screen-space SVG positioning, never references, path geometry, arrow text, original stored label shifts or dependency IDs. JSON round-trip must retain all semantics.
- **Drag transition:** A selected auto label's first actual move must freeze the current visible position into manual offsets without a jump. Stationary clicks, pointer cancellations, blur and Undo must restore the original auto setting.
- **Impossible layout:** Keep crowded labels visible, signal unresolved cases, and avoid unbounded memory growth from oversized text or dense buckets. Never claim a collision-free guarantee.
- **Export:** Require SVG/raster and JSON fidelity for new positions, and disable restricted TikZ where exact output cannot follow the visual layout. Semantic tikz-cd is graph-only.
- **Tests vs implementation:** Use semantic labels/IDs in browser test selectors; do not rely on checkbox ordinal positions when adding new Properties controls.

## Cut 24 addition — crossing-routing changes

Test graph-edge ordering, hidden/transparent predecessor removal, shared endpoints, routing-field label visibility on narrow panels, strict interior versus endpoint contact, vertical/horizontal intersections, collinear overlaps (known unsupported), blocked corridors, capacity limits, arrow-label path synchronization, live node moves, undo/redo and incompatible export rejection. A passing geometry unit test alone is insufficient: require real browser SVG path/UI/JSON verification, an inherited-suite sweep, and a clean extracted package. Mark impossible layouts amber rather than claiming an exact solution.

## Cut 25 additions: all-visible-arrow routing

Whenever diagram routing changes, test **document order versus all-visible mode**, frozen legacy routes, hidden/opacity predecessors and successors, T-junction and collinear overlap versus shared-endpoint contact, historical undrawable edges, 48-arrow capacity behavior, impossible two-turn corridors, post-refinement status recomputation, zoom and label/export synchronization, JSON schema and disabled TikZ. A monolithic browser timeout is not a pass: rerun the affected scripts in bounded subprocesses and retain the timing provenance.
