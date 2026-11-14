# MathIllustrator current limitations and audit queue

**Round 16 remaining limitations:** Only the Properties inspector can float; whole Objects/Tools panels cannot detach, and mobile uses the original Objects drawer. Layout preferences are local to this browser and are not included in exported JSON. Floating positions are clipped to the visible window; actual hosted-site storage, physical touch/stylus, keyboard screen readers, browser zoom extremes and non-Chromium engines have not been validated.

# Cut 16 current status (v0.17.0)

> **Historical evidence locations (v0.26.1 maintenance):** Older `cutNN-*.json` files and per-cut test reports are archived unchanged in `docs/history/release-history.zip`. The living files in this directory retain current known issues and regression obligations. Restore archived paths safely with `python mathillustrator/tests/manage_history.py restore --apply`; no runtime sources changed.


**Fixed with directly exercised regressions:** false storage conflict from queued stale events; redundant writes and false conflicts for identical saved JSON; missing retry affordance after quota denial; stale conflict heading after a separate corrupt-startup incident; external `localStorage.clear()` must not discard the open illustration.

**Still unresolved:** Web Locks cannot guarantee durability across tab teardown; the `pagehide` fallback and browsers without Web Locks are best effort and not atomic. Two real same-origin tabs, storage eviction, power loss/crashes, Firefox/Safari, hosted deployment, and physical touch hardware are not certified in this environment. No native cloud synchronization, auto-merge, or historical version restore. The app's native JSON download remains the authoritative manual backup. No new canvas rendering performance figure is claimed.

---

# Cut 11 (v0.12.0) current known limitations — read first

Cut11 improved node-label overflow, Fit, small-number display and cursor snap performance, but it did **not** solve exact font metrics, automatic obstacle avoidance, mathematical curve completeness or multi-tab atomicity. Plot detail is now configurable; even Detailed can miss narrow features. The 80,000-evaluation ceiling creates an explicit incomplete-view warning and disables image export in that state; the native JSON project remains available. Spatial query performance gains are *lookup-only* and do not make full SVG redraws fast. The long list below preserves historical technical context; check the latest Cut11 report for current evidence.

---

# MathIllustrator current audit addendum — Cut 08 / v0.9.0

Earlier per-cut findings below are historical; some stale headings and older descriptions reflect what was known at that cut. See latest report and tutorial for current behavior.

- **Verified in Node + isolated Chromium:** new live anchor-collapse rejection and rollback; preserve old degenerate projects; XML 1.0 forbidden characters refused without silently replacing labels; subnormal snap intervals rejected; 4,000-object list search indexed and measured.
- **Not fixed / not verified:** moving a point can still change angles/lengths without a general constraint solver; very large/project-wide SVG renders are not incremental; real multi-tab Web Locks concurrency and last-chance unload remain uncertified; mathematical TeX typesetting and publication-exact PDF remain unsupported; deployed live site/Firefox/Safari/touch and accessibility remain pending.
- **Performance scope:** six query changes on 4,000 linked objects, median 28.7ms Cut07 vs 6.9ms Cut08 in isolated Chromium; separate 3,000-point renderer measurement was 38.5ms, above a 16.7ms frame budget. No claim about overall interaction frame rate.
- **Schema/runtime nuance:** JSON schema bans XML C0 control characters in names/text but cannot portably distinguish unpaired JS UTF-16 surrogates from valid supplementary Unicode across all validators. Runtime `xmlTextSafe` is authoritative for this additional condition.

---

# MathIllustrator · known limits, bugs and audit queue — v0.6.0 Cut 05

**Status discipline:** “Verified fixed” requires executed regression evidence. “Partially improved” does not close a domain. Browser-inline tests count as Chromium interaction evidence but do **not** establish that the published site or all browsers work. Details: `TEST_REPORT_20261112_CUT01.md` and `regression-cases.json`.

## Verified improvements and resolved observed failures

| ID | Status | Evidence |
| --- | --- | --- |
| MI-013 · Arrowhead default color ignored per-object edits | Verified fixed | Per-object SVG marker-free triangle arrowheads; Chromium SVG download inspected; Cut05 |
| MI-009 · Polygon doubleclick could commit unwanted extra point | Isolated-browser regression passing | Chromium 3-vertex polygon doubleclick test; still needs touchscreen/timing extremes |
| MI-FIX-01 · Active property change DOM reentrancy | Verified fixed | Chromium property-change smoke; post-change properties deferred |
| MI-FIX-02 · Filled polygon prevents dragging underlying point | Verified fixed | Chromium point hit-target drag test |
| MI-FIX-03 · `cx` undefined during hit-target construction | Verified fixed | Browser error reproduced, corrected, both browser smoke suites pass |
| MI-FIX-04 · Canceled point stroke/drag commits unintended state | Verified fixed | Chromium pointercancel rollback test and saved JSON comparison |
| MI-FIX-05 · Long dependency chain stack overflow | Verified fixed for tested depth | Node regression validates/resolves 3,500-midpoint chain; not a 10k scalability claim |

## Open or partially improved technical issues

| ID | Priority | Limitation / risk | Next action |
| --- | --- | --- | --- |
| MI-001 | High | No direct hosted-site HTTP/HTTPS navigation in current developer sandbox; isolated Chromium modules were successfully tested, but GitHub Pages and Windows real-site behavior are unverified. | Test deployed `/mathillustrator/` on Edge/Chrome/Firefox/Safari, check module paths, MIME, CSS and actual download handling. |
| MI-002 | High | `tikz-cd` semantic subset exists; general TikZ import/round-trip of style, live dependency structure and label rendering is not implemented. | Versioned general TeX importer, diagram syntax fixtures, compilation and loss-visibility reports. |
| MI-003 | Medium | Browser-specific raster/text fidelity and JPEG/WebP export round-trip have not been golden-tested across browsers. | Actual image decoding, comparison of glyph placement, clipping, color, transparency and SVG markup. |
| MI-004 | Medium | A4/Letter page guide, crop and output do not set true physical dimensions, margins, bleed, DPI or print-scale guarantees. | Separate physical page model from viewport and add print exactness tests. |
| MI-005 | Medium | Freehand automatic correction smooths paths only; no circle/line recognition, tangencies, symmetry, spacing, pressure or undo-to-raw toggle. | Typed shape recognition with a priori correction strength, precision controls and red/green tests. |
| MI-006 | High | Complete SVG DOM reconstruction on draw: 3,000 point scene took 55.3 ms in one isolated run; cannot promise large-scene 60 FPS. | Scene index, viewport culling, incremental updates, spatial hit grid and device matrix. |
| MI-007 | High | Adaptive sampling now creates gaps at detected poles/large jumps; mathematical completeness is not certified and implicit curves are absent. | Golden singularity fixtures, finer offscreen/boundary checks and true domain segmentation. |
| MI-008 | Medium | Selecting a segment, curve or group does not allow direct translation; no multiselection, hierarchy, property inheritance, Bézier handle drag or general transform. | Add semantic transform actions and direct handle editing. |
| MI-010 | Medium | Fit includes circles/ellipses but excludes whole unbounded functions and infinitely long lines; text shape size is point-only in bounds. | Define finite viewport and world bounds for infinite primitives; add label bounding boxes. |
| MI-011 | Medium | Named point assignment is a numeric pair; symbolic parameters/variables and general scripted expression chains are not implemented. | Dependency-aware numeric parameter expressions with safe grammar. |
| MI-012 | High | Autosave can still fail on quota/disabled storage, and manual cross-tab conflict resolution is not a transactional merge; undo snapshots are memory-only. | Fault injection, rapid two-tab races, pagehide/crash recovery and JSON backup tests. |
| MI-014 | High | SVG labels are plain text; raw TeX source is visible literally on canvas. TikZ export escapes text. Scientific mathematical typography is not fully available. | Optional local TeX math renderer with exact SVG/TikZ alignment and fallback warnings. |
| MI-015 | Medium | Touch, keyboard-only drawings, screen readers, responsive narrow sizes and Safari/Firefox checks are incomplete. | Accessibility/touch audit with reproducible interaction tests. |
| MI-016 | Medium | `tikz-cd` only supports a rectangular matrix, basic cell directions and simple labels. No bent edges, rich arrows, arbitrary macros, multiple nodes in cell or self-loops; export grid may lose exact positions. | Expand parser only with explicit fidelity/round-trip tests. |
| MI-017 | Medium | Diagram arrow attachment uses approximate node offsets and can be visually suboptimal for long or overlapping labels, short arrows and varying node widths. | Route arrows to actual node outlines and add label collision detection. |
| MI-018 | Medium | 2x raster resolution is fixed; native PDF, Asymptote and animation/GIF/video export are disabled. | Resolution UI, real vector PDF backend and animation model with output verification. |
| MI-019 | Medium | User-created named presets, reusable components, collaborative projects and robust cross-document scene copy/paste are absent. | Explicit profiles and project schema persistence. |
| MI-020 | Medium | Advanced exact geometry, 3D surfaces, Ricci flow, Möbius transformations, vector fields, algebraic topology templates and constraint solving are future scope, not supported tools. | New semantic modules with independent tests and truthful user tutorial sections. |

## Debug checklist for every subsequent cut

Test hidden/locked/ref-deleted shapes, insertion order and drag hit priorities, pointer cancellation and capture loss, doubleclick timing, dependent graph diamonds/cycles/deep chains, malformed JSON/out-of-range settings, label escaping, TeX literal-mode behavior, import/undo/redo, localStorage conflict/quota, async export error/URL cleanup, SVG font fallback, the empty-scene export, very small/large viewports, scene resize while dragging, cut-and-restore edits, and performance under background tabs. Record **which environment and exact fixture** was used, and don't silently substitute fallback formats.


## Cut 02 issue resolution and new subtle-risk register

| ID | State | Evidence and remaining scope |
| --- | --- | --- |
| MI-SITE-020 · Homepage/Tools missing editor entry | Fixed in root HTML files | Static link/path assertions PASS; live GitHub Pages HTTP browser check blocked by `ERR_BLOCKED_BY_ADMINISTRATOR`, so deployment still needs verification. |
| MI-UI-021 · Mobile tool and object panels unreopenable | Fixed in Chromium | Browser Cut02 narrow-width drawers open/close and accept commands. Actual touch hardware and screenreader audit pending. |
| MI-EDIT-022 · Stale captured object after failed validation/import/undo | Fixed in Chromium | Properties now resolve by ID inside transaction; rejected side-count followed by valid edit and undo/redo passes. Other stale asynchronous tasks must remain an ongoing regression area. |
| MI-PERF-023 · Deleting deep transitive chains potentially quadratic | Fixed in model | Indexed reverse dependency BFS tested on 3,200+ objects; no cross-device timing guarantee. |
| MI-MODEL-024 · Counter mutated on unsuccessful object-name collision | Fixed in model | Collision leaves nextId and JSON unchanged. |
| MI-MODEL-025 · Degenerate regular polygon silently invisible | Rejected with explicit warning | Command, cursor and JSON validation reject zero-radius geometry; near-zero cases remain bounded by numeric tolerance. |
| MI-MOBILE-026 · Wrapped appbar could overlap slide-out drawer | Fixed in isolated Chromium | ResizeObserver controls `--appbar-height` for viewport/drawer layout; test real Windows mobile device and font-size zoom. |
| MI-DEPLOY-027 · Running root ZIP overlay over changed site | Open release risk | Root `index.html` and `tools.html` are based on the supplied site archive. Review changes before overwriting a newer site's root pages. |

Cut 02 does **not** claim completion of general constraints, symbolic/implicit shapes, true 3D Ricci flow or Möbius transformation, physical PDF output, fully semantic TeX labels, or reliable 60 FPS on large SVG scenes. Preserve the earlier open issues as active until individually resolved and verified.

## Cut 03 targeted findings, resolved and still open

| ID | Status | Evidence / qualifications |
| --- | --- | --- |
| MI-EXP-030 editor page outline and grids contaminate journal figures | Fixed in image export | Isolated Chromium SVG inspection defaults and opted-in guide; cannot certify fonts/golden pixels across browsers |
| MI-EXP-031 fixed 2× raster output | Fixed | Isolated Chromium PNG binary dimensions at 1× and 4×; 36 MP/16384 max applied before Canvas allocation |
| MI-PLOT-032 fixed plot sampling connects some visible discontinuities | Partially improved | Bounded adaptive subdivision with explicit gaps at tested reciprocal pole; not a symbolic continuity/singularity test |
| MI-STOR-033 corrupt local autosave silently overwritten by next edit | Fixed for isolated storage test | Quarantine until explicit Keep this tab, tested by mocked localStorage; real storage quotas/crash races remain unverified |
| MI-PTR-034 Escape from pan leaves changed view | Fixed | Chromium pointer drag + Escape + world-to-screen position restoration |
| MI-PTR-035 secondary pointer hijacks active drag | Fixed by rejecting nonprimary events | Isolated Chromium synthetic secondary pointer; real touch hardware unverified |
| MI-MODEL-036 new collapsed segment/line/arrow/circle/rectangle can falsely succeed | Fixed for new command/cursor creations | Node rollback test + Chromium command; legacy JSON is accepted to preserve v1 compatibility |
| MI-MODEL-037 imported huge numeric object IDs lose precision | Fixed | Node malicious import test rejects IDs above JS safe-integer limit |
| MI-COMPAT-038 historical flat ellipse disappears | Fixed in SVG/TikZ depiction | Flattened ellipse imported in Node; line rendering source verified, browser visual parity across engines unverified |

**Still open:** Real hosted navigation, cross-browser typography and raster fidelity, full tikz-cd/TikZ math-text interchange, true print dimensions/DPI, exact singularity isolation, performant 10k-object scenes, mobile hardware pointer pinch/pressure, semantic arbitrary shapes, animation, 3D, Ricci-flow diagrams, Möbius transformations, and full offline cache policy. Do not infer a PASS from absence of a test.

## Cut 04 additional adversarial findings

| ID | Status | Verification / risk |
| --- | --- | --- |
| MI-TEX-040 · `\&` interpreted as a cell separator | Verified fixed | Node red/green preserves 2 nodes + edge; exporter semantic round-trip now checked |
| MI-TEX-041 · Embedded node arrow commands and raw `&` silently change exported graph | Verified fixed for supported subset | `canExportTikzCd` disabled for semantically unsafe labels; Node roundtrip + prior compiler tests |
| MI-PTR-042 · No live corrected freehand preview; final pointerup coordinate lost | Verified fixed | Isolated Chromium visible draft, endpoint, interrupted-stroke rollback |
| MI-UI-043 · Detached old input/delete/list controls mutate new document with same object IDs | Verified fixed | Isolated Chromium RED/green replacement + reused-ID controls |
| MI-PTR-044 · Clicking an off-grid point can silently snap it | Verified fixed | Chromium precision-preserving click and pointerup-only move with undo |
| MI-STOR-045 · Another tab stores exact same document, next save falsely conflicts | Verified fixed for synthetic storage event | Isolated localStorage double; true simultaneous tab race still open |
| MI-EXP-046 · Opacity-zero points leak labels and invisible hit targets | Verified fixed | Chromium SVG/TikZ inspection and SVG hit layer validation; cross-browser alpha pixels unverified |
| MI-EDIT-047 · Global point size cannot be overridden per existing point | Partial improvement | Per-object radius for points/midpoints and new style default; old v1 missing property remains usable |
| MI-PERF-048 · Big-scene interactive draw below 60 FPS | Open | Single-run Cut04 at 3,000 points 69.8 ms draw-only; no evidence of improvement vs prior cut |

New nonclaims: arbitrary LaTeX is still not importable; compiler acceptance is not semantic or visual parity, and no cross-browser or deployed HTTP checks were possible. Continue challenging pointer reentrancy, view zoom during preview, filename collisions, SVG marker IDs across embedded documents, and true multi-tab write races in later cuts.


## Cut 05 new defects and adversarial limitations (v0.6)

| Case | Current status | Evidence / limitation |
| --- | --- | --- |
| MI-REL-058 · Cumulative overlay omitted original baseline model test module | **Fixed** | Release Cut05 now includes `tests/model.test.mjs`; full tests executed from extracted archive, not just working tree. |
| MI-SVG-051 · Global SVG marker IDs collide across separately embedded exported figures | **Fixed** | Cut04 generated identical IDs for repeated object IDs; Cut05 uses path + filled triangle geometry, no `<marker>` or `marker-end`. Chromium exported SVG checks + explicit arrow direction Node tests. |
| MI-PERF-052 · Every point creates a second invisible hit circle | **Fixed** | Cut04 SVG DOM had ~2N descendants for N points. Geometric hit test is used at pointerdown; overlapping filled polygons still allow points to be selected/dragged. Cut05 point scene is ~2600 descendants at 3000 objects, not 6002. |
| MI-PERF-053 · Object sidebar renders thousands of full DOM rows per edit | **Fixed for row DOM size** | 45px row virtualization with 10-row overscan; Chromium scroll bottom, search/hide and edit/undo pass with 3000 objects. Filter remains linear in object count. |
| MI-PERF-054 · Offscreen SVG points inflate DOM and frame cost | **Partially fixed** | Conservative point-only viewport culling; non-point shapes and long paths still drawn globally. JSON, dependencies and full-world Fit remain unchanged. |
| MI-ACCESS-055 · Keyboard-only navigation across virtualized object rows | **Unverified** | Rows have aria-posinset and aria-setsize, but complete screen-reader and keyboard traversal to non-mounted rows was not evaluated. Search and scrolling remain functional. |
| MI-STOR-056 · Simultaneous cross-tab autosave write collisions | **Open** | localStorage has no compare-and-swap; read/check/write is not atomic. Isolated storage double tests pass but real shared-origin multi-tab browser checks were blocked by sandbox policy. Download native JSON before conflict resolution. |
| MI-PERF-057 · Full visible-scene SVG redraw may miss 60 FPS | **Open** | Three Cut05 3k-point rebuilds: 21.8, 41.9, 34.2ms; point-only isolated Chromium. No claim of reliable 60 FPS or end-to-end UI performance. |

Future novel cases: text bounding boxes under mixed fonts, Figma-like snapping to curves/intersections, pointer gestures during zoom/resize, data races on missing storage events, JSON processing near 12MB/10000-object cap, behavior under Safari rendering and mobile touch.

## Cut 06 newly confirmed issues / remaining subtleties

| ID | State | Proof and caveat |
| --- | --- | --- |
| MI-SNAP-061 · Newly created endpoint snaps back to sibling in same construction | **Fixed** | RED browser Cut05 generated `segment.refs=['o1','o1']` for two distinct 7px clicks; Cut06 snapshots candidates before insertion, GREEN same test. |
| MI-SNAP-062 · Transparent mathematical anchor unexpectedly snaps to cursor | **Fixed** | Chromium draws near opacity-zero point and asserts new independent reference. Hidden and zero-opacity point still participates in existing references. |
| MI-TEX-063 · Hidden function disables TikZ export | **Fixed** | Only visible supported objects determine whether TikZ is available; actual TeX compile verified. |
| MI-TEX-064 · TikZ line width depends on view zoom | **Fixed for source reproducibility** | Same scene exports byte-identical TikZ at different zoom levels; exact font and SVG parity still unverified. |
| MI-UI-065 · Basic toolkit OFF hides Move/Pan controls | **Fixed** | Isolated Chromium toggles module OFF, confirms both essential tools reachable, restores with Undo. |
| MI-SET-066 · Infinite/page-only contradictory JSON setting | **Fixed** | Runtime + JSON schema check, old optional v1 fields still default. |
| MI-REL-068 · Cumulative ZIP omits original Cut00 assets | **Fixed** | Restored 4 exact Cut00 files including 2 mathematical example JSONs and 2 history/design docs; added extracted-package inventory validation. |
| MI-SAVE-067 · Concurrent tab writes without atomic locking | **Partially mitigated** | Web Locks coordinates normal saves when browser supports it; deterministic Node synthetic two-writer test passes. `pagehide` and unsupported browser paths remain non-atomic, real multi-tab not yet verified. |

**No premature closure:** The residual true cross-tab save race is still *open*, not PASS merely because a synthetic lock was tested. No cloud sync or hidden best-effort merge exists. User should download native JSON backup before conflict resolution.

## Cut 07 audit outcomes and still-open limitations

- **MI-RECT-071–073 FIXED:** The old Rectangle tile inserted a free four-vertex polygon rather than live rectangle semantics. Cut07 adds two-anchor `rectangle` and `Rectangle(A,B)`; older polygon documents remain unchanged. Zero-area new rectangles are rejected. Dependent movement can still produce a zero-area *existing* rectangle; no global constraint solver yet.
- **MI-INPUT-074 FIXED:** Prompt Text previously truncated to 1,000 characters although the model permitted 2,000. Oversized text/node/morphism prompts now reject visibly; no silent clip. Rendered very long labels may visually overflow their node/paper bounds; automatic text wrapping remains pending.
- **MI-IMPORT-075 FIXED:** Delayed native JSON file reads no longer overwrite intervening document edits. An in-memory revision guard rejects stale file completions. Browser cancellation and drag reentrancy are covered in isolated Chromium, not full multi-tab filesystem scenarios.
- **MI-UI-076 FIXED (PARTIAL ACCESSIBILITY):** Escape closes both import/export panels and restores launcher focus; global destructive shortcuts are ignored while overlays are open. Focus-trap semantics and comprehensive screen-reader testing remain unverified.
- **MI-TEX-077 MITIGATED:** Visible non-ASCII/control text disables pdfLaTeX-targeted TikZ rather than producing unsupported literal source. Multilingual and math-mode TikZ labels remain future work; SVG and JSON preserve Unicode.
- **MI-PROP-078 FIXED:** Deferred property-panel rebuilds used to replace focused controls during adjacent valid edits, losing changes intermittently. The rebuild now respects an active property focus and invalid edits explicitly restore the control.
- **Still open:** real two-tab races for non-locking browsers/unload; deployed hosted-site caching/MIME; Safari/Firefox; physical touch; long-label layout; huge vector scene frame times; certified plot discontinuity topology; native PDF/3D/animations; full TikZ/LaTeX.

## Cut 07 homepage integration and test caveats

- MI-SITE-080–082: **Improved / isolated browser verified**: formerly buried MathIllustrator/MathReader cards are now equally prominent above About, with responsive 2-column/1-column layout and direct hero shortcuts; both languages and dark theme checked in headless Chromium. The real hosted homepage and appearance under Safari/Firefox are not verified.
- MI-TEST-083: **Intermittent test failure / not classified as fixed**: one `browser_cut07_properties.py` run timed out waiting for JSON download after toggling object visibility, and a rerun passed. A stable root cause has not been demonstrated. Preserve this observation and avoid making zero-flake claims.
- Site-root file overwrite risk: the overlay contains full `index.html` and `tools.html` derived from the supplied site baseline. If the hosted source was edited since that baseline, merge the MathIllustrator changes rather than blindly replacing newer work.

- MI-TEST-083 test-harness update: **mitigated for the isolated property sweep** by reading the generated JSON blob instead of triggering a real browser download for every assertion. Two property-suite passes after the change. Real user-triggered Save/export is separately verified in smoke/inventory suites; deeper browser automatic-download throttling behavior is not claimed solved in the application.

- MI-PROP-084: **Fixed in Cut07, isolated Chromium verified**. Invalid property edits could restore an obsolete initial field value (for example point radius 9 → invalid 101 → 5), and rapid adjacent edits after rollback could be rejected due to stale object identity. Same-document rollback now retains a logical editor generation and fields track last accepted values; true project replacement invalidates old controls. Four consecutive property-suite passes plus Cut04 stale-control regression. Physical focus/blur interactions across other browsers are unverified.

## Cut 09 newly addressed and remaining subtleties

| ID | Status | Evidence and limitation |
| --- | --- | --- |
| MI09-TEX-01 — tiny segment, skinny ellipse/rectangle, polygon closure lost to five-decimal TikZ output | **Mitigated** | TikZ disabled for identified unrepresentable visible numeric geometry; SVG/JSON remain available. TeX engines, text metrics and true mathematical print precision remain unverified. |
| MI09-TEX-02 — excessive TeX world coordinates may exceed TeX dimension limits | **Mitigated conservatively** | ±300 cm world-coordinate preflight. This is a source-coordinate guard rather than a proof of safe final bounding boxes, font extents or infinite-line extensions. |
| MI09-ASYNC-03 — old raster image completes after new edit or dialog dismissal | **Fixed in isolated Chromium** | Export epoch/revision/viewport guard and bounded encode/decode; no silent stale download. Cross-browser interruption and memory profiling remain open. |
| MI09-FOCUS-04 — transient drag can survive window blur | **Fixed in synthetic browser focus test** | Explicit rollback before hidden-state save and on window blur; physical pointer-loss behavior requires device/browser verification. |
| MI09-MULTITAB-05 — authentic same-origin simultaneous-tab atomicity | **Open/blocked** | Isolated HTTPS route navigation refused with `ERR_BLOCKED_BY_ADMINISTRATOR`; script is shipped for verification in a suitable environment. Web Locks and unload fallback are not equivalent to guaranteed transactions. |

The current editor still renders mathematical labels as plain SVG text; rich TeX math typesetting, wrapped diagram labels, high-precision coordinates and physical print sizes are not yet supported. Large scenes and long SVG raster renders can be slow; 15s export timeout explicitly reports failure rather than claiming success.

- **MI09-TEST-06 (test-harness flake):** one concurrent extracted-package `browser_edges.py` run returned a missing SVG bounding box immediately after a tool switch. Standalone rerun passed. The test now waits for visibility before reading the bounding box; this does not establish full renderer determinism on slow hardware.

## Cut 10 incremental risk findings / limitations (2026-11-12)

- **DIAGRAM-BOX:** Cut 09's fixed 18px trimming let node-to-node arrows begin inside source boxes. Cut 10 uses approximate box extents and adaptive padding. Overlapping boxes may suppress the visible morphism temporarily; the semantic relation is not deleted, but a purely graphical SVG/PDF reader could miss an edge. Font metrics, complex labels, multi-line/TeX content and edge routing around intermediate nodes remain **unsupported**. The left properties pane explains overlap behavior.
- **PLOT-REDRAW:** Repeated immutable explicit-function plots now use a bounded path-string cache keyed by expression, viewport center, zoom and dimensions. Cache is limited to 32 entries and 1.2 million string characters, but not to an exact heap-byte budget. It does not solve redraw cost for 3,000+ arbitrary objects, dynamic freehand paths or spatial lookup.
- **LINE-EXTREME:** Visible infinite straight lines are clipped to screen bounds to prevent oversized SVG endpoints. Viewport clipping is intentional and lossless for the native world-coordinate line, but publication TikZ still uses a finite fixed extension and may differ visually.
- **ACCESSIBILITY:** Virtual rows now handle keyboard arrows/Home/End, and dialogs loop Tab focus. Export has a pointer backdrop. This is not a WCAG / assistive-technology certification: full screen-reader row announcements, high contrast, keyboard-only geometric construction, dialog platform behavior, touch, and RTL localization remain unverified.
- **REAL TABS/DEVICE:** Same-origin real multi-tab atomicity, hosted-site caching, Safari/Firefox, physical touch, and 60 FPS under mixed complex scenes remain unverified.


## Cut 12 findings — visible-only Fit, lifecycle and batch snapping

- **Fixed with targeted browser/Node evidence:** a `visibilitychange` listener attached to `window` missed the document event; incomplete pointer Move/Pan can now roll back on document-hidden. Actual browser background suspension, crash/pagehide and Web Locks handoff remain unverified.
- **Fixed:** `Fit` excluded visually hidden but alpha-zero outliers and arrows with invisible endpoints from its mathematical bounds calculation. Other fixed-size labels, shape extrema and unbounded functions retain their existing approximate limits.
- **Optimized, with semantic-equivalence oracle:** multi-point finalization now resolves pre-existing anchors through the settled screen-space spatial index. Strict snap-distance edge and original anchor IDs remain stable in deterministic tests. Extremely crowded indices and the full SVG/undo cost remain.
- **Still open:** real cross-tab write atomicity, hosted module MIME and paths, accurate TeX/browser text metrics, touch/pen and screen readers, complete all-settings state matrix, and cross-browser export golden image verification. These must not be marked PASS based on an isolated Chromium pass.

### Cut13 — Settings / UI state-matrix findings

- **MI13-001 FIXED:** Backspace/Delete with focus on Zoom toolbar unintentionally removed a selected object. Restricted the global destructive shortcut to drawing/document-body and object-row focus; Undo, command-entry and intentional Delete button still work. Chromium red/green evidence in `browser_cut13.py`.
- **MI13-002 FIXED:** Preset said "General" after customized anchor snapping, sides, labels. Drawing-preset matching now covers all three; selecting a preset restores these defaults but retains independent page/export/theme settings. `Custom` is display-only.
- **MI13-003 FIXED:** Any Export-area/guides/raster scale setting caused a large-scene SVG and sidebar rebuild. Render-free update path retains validation, undo, redo, autosave and JSON export; independently tested by SVG DOM identity.
- **MI13-004 FIXED:** Changing default point radius resized legacy point/midpoint objects with missing per-point style. The old radius is pinned at the moment the default changes; passive imports are unchanged. Node and Chromium tests.
- **MI13-005 FIXED:** the generic cumulative release integrity test remained pinned to Cut12 and rejected the valid Cut13 archive. `tests/package_integrity.py` now forwards to the current strict Cut13 manifest checker, verified on clean extraction.
- **Still open:** real touchscreen and screen reader; keyboard/IME interactions across every setting, live multi-tab coordination, localStorage quota and failure recovery, Firefox/Safari export pixel comparison, generic imported documents at 10,000 object limit. The new renderer optimization is **export-settings only** and not a 60 FPS claim.

## Cut14 — cross-workflow lifecycle and storage fault injection

- **MI14-001 FIXED:** A segment/polygon/etc. draft could outlive a New/Open/diagram-import document replacement and contaminate the next canvas click. Clear transient construction state when a project is replaced; no phantom object is serialized.
- **MI14-002 FIXED with synthetic-event evidence:** Tab-hidden and window-blur now clear multi-click drafts, not only captured Move/Pan. True OS/browser suspension and mobile app-switch events remain unverified.
- **MI14-003 FIXED:** A delayed native JSON import can no longer overwrite an identical-content, newly replaced project: both revision and document generation are validated before applying file bytes.
- **MI14-004 FIXED with synthetic-event evidence:** IME composition `Delete`, `Enter`, and `Escape` must not invoke global editor controls; applies inside semantic TeX import modal as well. Physical IME platforms are still unverified.
- **MI14-005 FIXED for tested case:** Zoom/Fit/Reset/wheel viewport transitions cancel captured drag before changing the coordinate transform. Physical stylus/multitouch interruption remains open.
- **MI14-006 EXISTING BEHAVIOR VERIFIED ONLY WITH TEST DOUBLE:** A failed local write does not replace the earlier storage payload, falsely claim save success, or block manual JSON export. A subsequent write recovers when quota fault is removed. This is not an actual origin-storage-quota or multi-tab test.
- **Open:** viewport changes during uncontrolled real-browser pinch gestures; pagehide synchronous storage race; actual browsers' quota behavior; Chromium vs Firefox/Safari pixel-parity; true constrained mathematical geometry; full 152-control combinatorial matrix.

## Cut 15 — touch, toolbar, and environment status
- **MI15-001..005 fixed under isolated evidence:** delayed touch commitment, multi-touch cancellation, outside-canvas release cleanup, up-only displacement and blur cancellation; full physical touchscreen/stylus/palm-rejection remains **unverified**.
- **MI15-006 fixed under synthetic wheel input:** normalized `WheelEvent.deltaMode` across pixel/line/page. The 16 CSS px line approximation is deliberate; native device sensitivity is **not certified**.
- **MI15-007..008 fixed under emulated Chromium:** narrow-width toolbar wraps and Export is visible without root horizontal scrolling; PNG export after emulated touch succeeds. Physical browser viewport/safe-area/virtual-keyboard UI is **unverified**.
- **MI15-009 retained architectural risk:** concurrent-tab writes still rely on Web Locks when available, and best-effort compare/write during pagehide may race. Node tests cover deferred lock and stale-token cases, **not genuine simultaneous-tab atomicity**.
- **Performance:** no new frame-rendering speed claim. Touch contact set and toolbar CSS add negligible-looking bookkeeping but require actual mixed-scene/device profiling before performance certification.

## Cut 17 remaining limits (2026-11-12)

- Conservative bounded-object SVG culling improves one offscreen mixed-scene workload but leaves large text/diagram labels, morphology, explicit graph sampling, scene-level dependency resolution, and virtualized-object-list refresh as separate performance costs. No across-browser 60 FPS guarantee.
- TikZ refusal for visible morphisms attached to alpha-zero nodes prevents a misleading publication; arbitrary clipping, fonts, label wrapping, and complex diagrams still lack exact portable TeX fidelity.
- The editor/PNG rendering model has finite viewport/crop and font limitations. Vector TikZ exports retain world geometry, so a TikZ figure and current cropped SVG need not be pixel-identical. This is disclosed rather than hidden.
- Legacy source projects and undo operations are not affected by omitting fully transparent SVG elements. Old alpha-zero objects remain editable through the object list; they are not canvas-selectable because they are invisible.
- Real deployed origin, Firefox/Safari, physical touch/stylus, simultaneous-tab crash atomicity and low-memory stress remain unverified.

## Cut 18 known limitations (not silently solved)

- Transparent exports are available for **SVG, PNG, WebP**, but **JPEG is disabled** while transparency is requested. A user can switch the option off for JPEG. Arbitrary background images and selective alpha masks are not implemented.
- SVG `xml:space="preserve"` retains author-entered spacing; exact typography still depends on the viewer's fonts and SVG engine. Restricted TikZ refuses labels with adjacent or edge spaces instead of silently collapsing them. Pixel parity and font embedding across Safari/Firefox remain unverified.
- The Cut 18 browser tests ran on an isolated Chromium module page. They do not constitute a deployed-site or real-device certification. No large-scene performance improvement is claimed.

## Cut 19 limitations and adjacent risks

- **FIXED MI19-001:** Wrapped diagram-node labels no longer remove repeated or leading/trailing spaces. Visual line wraps may introduce *display* line breaks, while the exact project string remains untouched. Rendering still uses approximate font metrics and is not collision-free TeX typesetting.
- **FIXED MI19-002/003:** Text/node/morphism Properties accept and preserve intentional newlines. SVG uses explicit per-line tspans for ordinary text/morphism labels. Restricted TikZ may be disabled for multiline and spacing-sensitive labels, as documented; SVG + JSON remain available.
- **FIXED MI19-004:** Fully offscreen text and node glyphs are culled from current SVG output, never deleted from JSON. Browser-independent conservative width estimation cannot prove exact font extents, especially with custom fonts, long combining marks or unsupported scripts. This must be tested in Firefox/Safari rather than claimed solved.
- **GUARDED MI19-005:** Morphisms crossing the viewport retain SVG geometry when their endpoint node rectangles are outside the viewport. Fully overlapping nodes may still suppress visible arrows as already documented.
- **UNVERIFIED:** Collision-free mathematical label placement, overlapping diagram node routing, real hardware touch/stylus, cross-browser pixel parity, full 10,000 on-screen label stress, robust native PDF, real-origin multi-tab atomicity and deployed-site status.

## Cut 20 remaining risks — documented, not silently hidden

- Automatic point-label avoidance is **approximate**: labels use heuristic text widths, six candidate positions and bounded spatial buckets, not font-exact typesetting. When no free space exists, labels can still overlap; none are silently discarded. It does not route semantic morphism labels or arrows around obstacles.
- The optional setting adds CPU cost for 1,500 visible points; see raw measured paired times in `cut20-performance.json`. No 60 FPS claim.
- Browser `elementsFromPoint` is used only on explicit Ctrl/Command-click, and is not a cross-browser pointer-stacking certification. Physical touch/pen and Firefox/Safari still need verification.
- Restricted TikZ is disabled when avoidance is enabled with visible labeled points; SVG/raster/native JSON remain available. A future TikZ layout exporter must preserve explicit offsets instead of silently reverting to above-right positions.


## Cut 21 remaining known limitations and new safeguards

- **Limited auto routing:** Avoid mode tests up to four orthogonal two-turn corridors, not global shortest-path routing. Arrow-to-arrow crossings and impossible mazes remain unresolved; the latter are explicitly amber/dashed. Endpoint-node overlap can temporarily suppress the shaft. Direct/curved arrows remain the default.
- **Labels:** Manual fraction/distance/X/Y positioning is available for morphisms, but not automatic collision-free layout or draggable label handles. Font measurements vary across browsers and may move labels or node boundaries.
- **Performance:** 320 nodes + 80 arrows, isolated Chromium median redraw 14.8 ms Direct versus 17.2 ms Avoid (11 samples per mode; see `cut21-performance.json`). Do not infer 60 FPS for more complex figures.
- **Exports:** Visual TikZ is disabled for opt-in routing or nondefault morphism label positions; restricted `tikz-cd` remains semantic only. SVG/raster represent the chosen screen-space layout subject to browser-font differences.
- **Unverified:** deployed website, Firefox/Safari, physical touch/pen hardware, real same-origin simultaneous-tab atomicity and global optimal diagram routing.

- **Cut21 Fit/export crop:** The current Fit view does not fully account for automatic detours or manual morphism label shifts. A route may lie outside the viewport or a fixed page crop. Preview SVG/raster export after enabling Avoid or large label shifts; pan/zoom manually to frame it. No silent crop expansion is performed.

## Cut 22: closed defects and outstanding risks

- **MI22-001 FIXED:** The only supported way to reposition a morphism label was to type X/Y offsets repeatedly. Selected, visible, unlocked, labeled edges now have a direct-manipulation handle in Move mode, with undo and precise Properties fallback.
- **MI22-002 FIXED (red/green):** Existing transparent SVG path-selection strokes appeared above the new handle, swallowing pointer events and leaving label offsets unchanged. The editor-only handle now sits above hit strokes without modifying exported SVG. A real Chromium `elementFromPoint` inspection reproduced the defect.
- **MI22-003 FIXED:** An aborted label drag cannot leave speculative shifts in the JSON document or create an undo step. Blur and pointer cancellation restore the pre-gesture snapshot, and a normal release uses the last pointer-up coordinate.
- **MI22-004 FIXED:** Stationary or sub-2px clicks on a label handle must not quantize historical fractional offsets, create spurious undo changes or subtly alter exports.
- **MI22-005 GUARDED:** Modifier clicks on the label handle must not hijack Ctrl-click overlap cycling or Shift/Alt pan; the generic selection pathway remains available.
- **NOT SOLVED:** automatic label collision-free packing, arrow crossings, accurate TeX math labels, drag performance with many simultaneously visible nodes, true two-tab atomic storage, Firefox/Safari, public deployed origin, physical touchscreen/stylus, and full screen-reader functionality. The handle is a pointer affordance; numeric Properties are the keyboard-accessible alternative. No new frame-rate benchmark was run.


## Cut 23: visual label packing and unresolved risks

**Closed/mitigated:** In Cut22 simultaneous morphism labels could overprint each other with no local correction. Cut23 introduces explicit per-arrow best-effort label placement, keeping fixed manual labels fixed, exposing unresolved placements instead of hiding text, ensuring manual drag switches smoothly without a sudden snap, and disabling unsupported TikZ conversion. Imports remain JSON v1.

**Open:** This is not a global optimal graph-label layout. Node rectangles and morphism text (estimated CSS pixel metrics) are considered, but arrow-line collisions, point labels, text objects, multi-frame temporal stability and exact fonts are not guaranteed. In dense diagrams, candidate positions can all be occupied; amber text signals unresolved collisions and should be repositioned manually. Web exports depend on browser font availability. Zoom/crop may change automatic placement while the semantic JSON remains unchanged. No physical touch or Firefox/Safari acceptance is claimed.

## Cut 24 remaining known limitations (not defects reported as fixed)

- **Crossings mode is not planarity:** considers earlier visible arrows in document order and strict segment interior intersections, not optimal graph layout, arrowheads, collinear overlaps, or all shared-endpoint edge tangles. Two-turn corridors may fail even when a more complex path exists; amber/dashed indicates unresolved crossing/obstruction.
- **Bounded work:** a crossing-aware arrow seeing more than 128 preceding arrow paths or exceeding 8192 segment-pair checks in a candidate is marked `capacity`; this avoids UI stalls but does not assert crossings were eliminated. Ordinary Direct/Avoid remain available.
- **Screen-space output:** routes can change with view scale, node label sizes or object order; SVG/raster follows the exported view, while TikZ visual export is explicitly disabled. Cropping can truncate a long detour; inspect the final file.
- **Unverified:** global crossing minimization, exact text/arrow collision-free layout, hosted deployment, Firefox/Safari, physical touch/stylus, screen-reader completeness and true multi-tab atomic storage. No 60 FPS claim.

## Cut 25: scene-aware routing boundaries

- **New option is not a solver:** `scene-crossings` considers both later and earlier arrows with two deterministic passes. It is opt-in, screen-space and limited to 48 drawable visible arrows. It does not guarantee removal of all crossings or overlap-free label placement. Missing obstacles, identical-node historical degeneracies or impossible corridors remain visible warning states.
- **Visual intersection approximation:** the new option counts nontrivial straight-segment overlap and T-junction contact, but does not fully model curved outlines, stroked width, arrowheads or Bézier intersection geometry. Direct curved paths are approximated with a small polyline.
- **Performance cost:** 16-node/20-arrow isolated Chromium median SVG rebuild was 2.10 ms Direct versus 2.75 ms scene-aware; no frame-rate claim. Capacity warns instead of silently skipping work.
- **Export/recovery:** native JSON stores only the routing mode, not transient screen paths. SVG/raster captures the current viewport; TikZ visual output is disabled. Page crops may cut detours. Real hosted-site, physical touch/stylus, Firefox/Safari and multi-tab atomicity remain unverified.


### UI/drawing pass (2026-11-13) — pending verification

- Recently Deleted is bounded to 20 deletion batches per browser and uses localStorage; it does not follow exported JSON or across devices. Browser-storage failures are reported; Undo remains available during this session. Recovery refuses ID/name collisions and invalid dependencies. Multi-tab trash synchronization is not provided.
- Partial Chinese translation covers fixed toolbar and several section labels, not all dynamic property forms, dialogs, exports, tutorial, or accessibility strings. Font selection changes UI font only, not mathematical publication fonts.
- Cubic freehand SVG geometry is not semantically identical to legacy straight-segment TikZ, so TikZ is explicitly disabled on visible freehand objects. Arrow styles beyond solid are not presently round-trip safe in TikZ or `tikz-cd`.
- Chrome interactive smoke was blocked by local execution policy; no visual/browser-level PASS is asserted. Device/viewport and memory/storage stress testing remain necessary.


### Math SVG / localization / layout boundaries (round 2)
- MathJax is bundled locally (no CDN), but requires a JavaScript/SVG-capable browser; while initializing, math objects show a visible warning rather than silently falling back to literal TeX. Export refuses missing/invalid mathematical glyph conversion. Large numbers of distinct formulas may cost CPU/memory; a bounded LRU limits retained compiled labels.
- New diagram labels render true TeX math; imported legacy JSON labels are deliberately kept plain to prevent silent visual changes. Latex-only font styles are not configurable via the ordinary text font choice. This is not full arbitrary LaTeX compilation.
- Diagram arrows are clipped to measured, screen-space TeX node bounds; optional collision avoidance for morphism labels remains approximate, especially for very tall matrices or long formulas.
- UI/quick guide supports English and Chinese; some runtime warnings, confirmation prompts, historical technical references and accessibility text remain English, with follow-up translation planned.
- Mobile browser, standalone exported SVG in all target software, complex/multilingual TeX fonts and real hosted GitHub Pages caching are not yet end-to-end verified.


### Additional round-2 regressions and remaining risks
- **FIXED:** Cloned MathJax local-font SVG definitions reused IDs for repeated formulas. Every math-label render now namespaces its own glyph definitions and references; exported SVG was checked for unique IDs.
- **FIXED:** Very long tool instructions could visibly overflow the canvas toolbar. The current mode is a compact name plus `?`; detailed help is available on hover/focus, and switching language updates the name without canceling an in-progress construction.
- **TEST ADAPTATION:** Five old archived Chromium UI scripts assert retired preset access or Point remaining selected after a tap. They are preserved in the immutable archive and transparently excluded by the staged runner; current touch/mobile suites replace the changed assumptions, but the old inventory test's full breadth is not reimplemented as a single replacement test.
- **PERFORMANCE:** One isolated 64-repeated-formula scene took 50.4 ms for SVG rebuild, above a 60-FPS per-frame budget. Mathematical labels are vector paths, not free. Dense diagrams still need profiling and optimization; no automatic degradation or silent fallback is allowed.

### Round 38 numerical plotting limits

- Vector-field sampling is finite and per-object, with no streamline/ODE integration. Arrow length without normalization is capped for visibility, not a globally calibrated magnitude scale. Large aspect-ratio regions can have constrained sample counts.
- Domain coloring is a bounded PNG raster within the SVG, not mathematically exact and not independently editable at the pixel level. Poles/undefined values yield empty pixels; complex logarithm/square-root branches use principal values and may have seams. High-resolution or highly elongated regions may exhaust the evaluation budget and stop image export (JSON remains available).
- The runtime caps each plot, not the sum of every plot's evaluations; hundreds of high-detail simultaneous fields can still block the main thread. Global budget, async cancellation, richer phase legends and analytic singularity analysis remain future work.
- Imported Round 36 parametric curves using `u` for x and `v` for y are supported as legacy shared-parameter `u=v` definitions. New curves enforce a single chosen t/u/v symbol; changing it in Properties converts both formulas.
