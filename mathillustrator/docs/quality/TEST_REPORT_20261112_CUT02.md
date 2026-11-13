# MathIllustrator Cut 02 · Release audit, fixes, regression provenance

**Date:** 2026-11-12  
**Version:** 0.3.0  
**Base:** Cut 00 or Cut 01. Changed-files ZIP is cumulative from Cut 00 and includes exactly two site-root integration files.  
**Policy:** Never treat a syntactically correct build, downloaded archive or disabled-button state as proof of hosted-site functionality. Document uncertainty.

## Confirmed original failure, root cause and resolution

The uploaded website's root `index.html` includes no MathIllustrator link. Its `tools.html` contains a MathReader feature and no MathIllustrator feature. Both are static documents with hard-coded links. Cut 00 and 01 only contained `mathillustrator/...`, hence could not make the new app discoverable on the existing homepage. Cut 02 adds an English/Chinese Mathematical software section on the homepage, alongside MathReader, and a separate MathIllustrator feature with launch/tutorial links on Tools. No source in `mathreader/` is edited; no new shared runtime dependency is introduced.

## Incremental subtle-issue audit and actual changes

| Issue | Mechanism | Repair | Regression |
| --- | --- | --- | --- |
| MI-SITE-020 · Homepage tool invisible | New directory not referenced in static site HTML | Add homepage card + Tools feature, bilingual data attributes | `tests/site_integration.py` |
| MI-UI-021 · Mobile panels impossible to reopen | CSS permanently hid panel controls under 700px | Clickable side rails open scrollable overlays; state and accessibility attributes follow responsive mode | `tests/browser_cut02.py` |
| MI-EDIT-022 · Stale object closure | An invalid edit replaces the document object, but captured field callbacks retain the old object | Resolve object by stable ID in each mutation transaction and guard current selection/lock state | invalid then valid side count + undo/redo browser test |
| MI-PERF-023 · Dependent deletion quadratic | Repeated scanning of all objects for every graph depth | Construct reverse-reference adjacency and run BFS | deep 3200+ node chain model test |
| MI-MODEL-024 · Failed append advances ID | ID allocated before auto-name duplicate check | Validate name before incrementing `nextId` | unit test JSON equality after failure |
| MI-MODEL-025 · Invisible degenerate regular polygons | Center equals first vertex | Reject invalid radius in command, pointer construction and imported JSON | unit + browser command test |
| MI-MOBILE-026 · Header wrap misaligns drawers | Fixed mobile `58px` top and `90px` canvas estimate | Measure actual header height through ResizeObserver | isolated narrow Chromium interaction |
| MI-STORAGE-028 · Loading another tab leaves pending save | Uncanceled timer could write stale data, undo/redo history remained misleading | Cancel timer, mark clean, set new local snapshot and clear history | `tests/browser_storage.py` with localStorage test double |

## New feature: live regular polygons

- Right-panel **Regular polygon** tool uses two clicks (center, first vertex), with configurable sides 3–100 in Settings. All vertices are derived from these two live anchors. Use Properties to edit the individual side count.
- Text command syntax: `RegularPolygon(A, B, 6)` using previously defined points or midpoints.
- Schema remains **v1**; optional `settings.polygonSides` is migrated to six. The object has `type = regularPolygon`, `refs = [centerId, vertexId]`, `sides = 3..100`.
- SVG renders actual regular vertices. Restricted TikZ exports static polygon edges/fill; JSON retains live references. `tikz-cd` correctly disables for mixed geometry scenes.
- Future feature warning: no star-polygons, geodesic/curved polygons, mathematical shape recognition, arc tangencies, or group transforms.

## Executed evidence

| Category | Run | Result |
| --- | --- | --- |
| Node model suite | `node --test tests/*.test.mjs` | **30/30 PASS** including 5 Cut02 cases |
| Chromium smoke | `python tests/browser_smoke.py` | PASS – startup, commands, search/presets, SVG/PNG/TikZ/JSON, tikz-cd, properties |
| Chromium pointer edge | `python tests/browser_edges.py` | PASS – polygon double-click, pointer cancellation/drag, undo, locking |
| Chromium Cut02 | `python tests/browser_cut02.py` | PASS – regular polygon, invalid property recovery, command rollback, SVG/TikZ/JPEG, mobile drawers |
| Chromium localStorage double | `python tests/browser_storage.py` | PASS – autosave, artificial cross-tab storage conflict, reload-newer, timer canceled, history cleared |
| Static website contract | `python tests/site_integration.py ..` | PASS – homepage & Tools bilingual links, tutorial link, CSS and JS entry paths; existing MathReader links present |
| JavaScript syntax | `node --check src/*.mjs` individually | PASS |
| JSON parse/schema/document | Python parse + JSON schema validation and demo import | PASS (see packaging verification) |
| Actual HTTP hosted route | Local Chromium `page.goto(http://127.0.0.1:.../)` | **BLOCKED** by `ERR_BLOCKED_BY_ADMINISTRATOR`; do not count as pass |

Browser tests render an isolated HTML page with inlined ES-module imports; they are genuine headless Chromium interactions but **not** an actual served network origin. The storage test injects an isolated localStorage double, so it is not a proof of atomic cross-tab synchronization. Tests were performed in this Linux Chromium environment, not on the user's Windows Edge or production GitHub Pages deployment.

## Required next audit (do not mark passed)

1. Verify uploaded ZIP overlays the **actual** live site and that both root pages visibly link to the deployed editor; test English/Chinese and light/dark.
2. Edge/Chrome/Firefox/Safari tests of ES-module import MIME, relative paths, downloads, image text, mobile touch, pointer capture and font sizing.
3. Assess browser quota failures, private mode and truly simultaneous writes across tabs; `localStorage` has no compare-and-swap primitive.
4. Plot discontinuity guard with golden samples (e.g. tan, poles, removable singularities), large-scene culling, true page physical dimensions, exact LaTeX rendering, and advanced 3D modules.
5. Test interrupted downloads and malformed project files, cyclic dependencies, divergent state after undo, and real-device 3,000-object latency. No 60 FPS promise.
