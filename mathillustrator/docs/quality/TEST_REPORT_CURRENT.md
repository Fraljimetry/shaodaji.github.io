# MathIllustrator current verification (with historical baseline)

## Scope and baseline

User-provided website ZIP `shaodaji.github.io(1).zip`; runtime version 0.26.0 / Cut 25, verified *before* maintenance. Version 0.26.1 changes documentation, historical evidence storage, active inventory and a reversible regression runner only; no `src/`, HTML, CSS, JSON project format or MathReader source is changed.

## Before-maintenance observed results (not assertions about production hosting)

| Gate | Result | Provenance |
| --- | --- | --- |
| Cumulative Cut25 file inventory | PASS, 222/222 manifest paths | Exact extracted website tree, `package_integrity_cut25.py` |
| Cumulative SHA256 bytes | PASS, 220/220 | Same historical manifest |
| Cut 02–24 historical path coverage, includes 07 and 11 | PASS | Cut25 package integrity verifier against historical path inventories |
| Model and regression Node tests | PASS, 144/144 | `node --test tests/*.test.mjs`, Node v22.16.0 |
| Isolated Chromium browser scripts | PASS, 45/45 | 44 first-pass, homepage script rerun after extracting the missing original stylesheet into the **audit copy**; `/usr/bin/chromium`, Playwright; 2 helper-only Python modules excluded |
| JSON schema and examples | PASS, 4/4 samples | Draft 2020-12 `jsonschema` validator, current `project-v1.schema.json` |
| Site navigation static checks | PASS | Actual root index/tools HTML and integration fixtures |
| Homepage bilingual responsive DOM | PASS, 8/8 cases | Actual root HTML and original locale/CSS assets, isolated Chromium |
| TeX compilation | PASS, 2 examples | Actual `pdflatex` for TikZ and restricted `tikz-cd` |
| Real hosted site / Firefox / Safari / physical touch / real simultaneous browser-tab writes | **NOT VERIFIED** | Requires a different environment and device/browser matrix |

The original archive was selectively extracted for auditing: the first homepage browser run failed only because `assets/css/style-v15.css` was not copied into the audit fixture. Copying that unmodified stylesheet from the uploaded website made the eight homepage checks pass. This is **not** evidence of a missing stylesheet in the user's original ZIP.

## Historical cleanup verification

The immutable `docs/history/release-history.zip` stores the original **173** cut-specific historical test/release files and six older central-document snapshots. `docs/history/contents.json` binds the archive and each legacy path to SHA256. Run the new `manage_history.py` integrity and staged-run commands before removing old standalone copies. Pruning is opt-in and byte-preserving/reversible; extraction of an overlay ZIP alone does not delete previous files.

## Post-maintenance / after clean pruning — confirmed PASS

- **52 active MathIllustrator files** remain after opt-in byte-verified cleanup; **173 historical originals** are recoverable from the single `docs/history/release-history.zip` archive (plus six central-document snapshots). The archive digest and all historical member digests were validated.
- The new `manage_history.py test --browser` **reconstructed the historical scripts into an isolated temporary site after pruning**, then passed **144/144 Node tests**, all ES-module syntax checks, **4/4 JSON example-schema validations**, site-root integration, **2/2 real pdfLaTeX compilations** and **45/45 isolated Chromium scripts**, including cut07, cut11 and cut25.
- A full **prune → restore → prune** round trip passed against the working copy; a separate temporary-copy self-test verified **restoration, byte equality, modified historical file rejection before cleanup**, and absence of mutations to runtime or root-site files.
- The root website `index.html`/`tools.html` and all **14 source modules** remained byte-for-byte equal to the user-supplied ZIP. Only documentation, historical evidence organization and regression tooling were changed.
- **Limit:** This is a maintenance overlay on top of the verified Cut25 runtime, not a cumulative replacement for arbitrary older installations. Publishing actual GitHub Pages deletions requires committing the verified file removals to the repository.

No v7/v11 runtime module was absent from the verified Cut25 site. Reapplying an older overlay could in fact roll back newer fixes. Runtime code has therefore **not** been altered on speculation.

## Remaining risks / follow-up

Browser tests load inlined module graphs rather than the actual hosted deployment paths. Current test results do not certify CDN caching, GitHub Pages MIME behavior, service-worker interactions, browser-specific text metrics, large real-world SVG/raster exports, security under arbitrary inputs, accessibility on assistive devices or true multi-tab transactional storage. Some dense scenes exceed a guaranteed 60 FPS budget; scene-aware routing is bounded and not an optimal crossing solver. Continue targeted red/green tests and explicitly label unverified behavior.


## UI/drawing implementation pass — 2026-11-13

New work: compact settings overlay, common-label Chinese locale (partial), interface font, section order persistence, collapsible Properties, 2×2 actions, local Recently Deleted with dependency restore, automatic point-to-Move, unbordered nodes, dashed/hooked/dotted/twoheaded/tail arrows, optional closed free curves, cubic freehand SVG. Active manifest updated; no legacy test/report files duplicated. New targeted Node tests cover model validation, defaults, cubic geometry, old project compatibility and `tikz-cd` unsupported style rejection.

**Evidence:** 144 pre-existing Node assertions passed via the historical staged runner, four new targeted tests passed locally; full static-site and TeX checks passed after restoring original website assets to the selective test fixture. Chromium interactive smoke navigation was blocked by execution-environment administrator policy, so **browser interaction, mobile responsiveness, visual overflow, storage permission failures and live-site correctness are not certified** by this pass.

**Open:** TeX source is not mathematical SVG layout; full bilingual UI, 3D plotting, parameter sliders, additional domain tools, draggable/dockable top-level panels, and a full user-facing tutorial reduction remain unimplemented.


## Math labels and bilingual quick guide — implementation round 2

The active editor now bundles MathJax SVG locally under `vendor/`, with the Apache-2.0 license preserved. A mathematical label is converted to embedded SVG glyph geometry and nested within exported SVG; PNG and WebP/JPEG are derived from the same SVG scene. New diagram nodes/morphism labels and newly imported `tikz-cd` nodes/labels opt into math rendering; preexisting JSON labels remain plain until users explicitly switch format. Geometry point/midpoint display labels may opt into TeX independently of their semantic object names. Plain labels have selectable serif/sans/monospace fonts.

Bilingual English/Chinese UI strings are handled by a reusable, local DOM translation module, with no modifications to object contents; longer walkthroughs are now in developer reference documentation instead of overwhelming the user quick guide. Chinese UI coverage is extensive but not yet exhaustive for all runtime notices, dialog prompts and advanced technical explanations.

**Focused verification (round 2):** 152/152 Node tests; four example schemas; isolated Chromium browser checks of SVG/PNG math, Chinese toggling, rejected TeX edits and legacy plain-text compatibility; all without an HTTP-origin deployment. Full staged browser suite details are recorded in the subsequent section. URL/origin-specific deployment, Edge/Safari/Firefox behavior and real touch hardware remain unverified.

**Bounds:** No network fetch required for core math labels; math engine takes time to initialize and may not support arbitrary user macros, embedded external assets, CJK fallback fonts or complex TeX packages. TikZ/PGF export remains disabled for math-mode labels instead of dropping typesetting. The mathematical-label cache is limited to 256 distinct expressions; extremely large mathematical diagrams need performance profiling. `tikz-cd` interchange retains restricted semantics and cannot round-trip all new arrow styles.


## Latest isolated verification — offline mathematical labels + UI (2026-11-13)

- **Implementation:** Local MathJax SVG engine, embedded vector paths in exported SVG and raster, measured math-node bounds for diagram routing, per-label `textMode` and optional point-label TeX, plain-label fonts, reusable English/Chinese UI dictionary, concise bilingual quick guide. An editor-only invisible hit target makes unbordered nodes selectable; repeated math glyph IDs are namespaced so exported SVG definitions remain unique.
- **Data integrity:** Older JSON without `textMode` stays plain; invalid TeX property edits roll back. Unsupported TikZ conversion is disabled, not silently flattened. Dangerous TeX extensions are rejected; SVG math compilation requires the local vendor engine. The upstream MathJax license accompanies the bundle.
- **Node and schema:** 152/152 tests and 4/4 JSON example documents. ES-module syntax, root-site static integration, two real `pdflatex` compilations passed.
- **Browser:** 43/43 *applicable* isolated headless Chromium scripts passed on the previous full staged run; **five obsolete archived UI scripts were not run** because they assert retired preset controls or persistent Point mode. Their immutable originals remain inside the checksum-verified archive. Two current browser successors check the updated touch and mobile contracts, and `browser_latex_i18n.py` covers true `\frac`, `\sqrt` and `\circ`, locale switching, duplicate glyph IDs, invalid-TeX rollback, legacy plain labels, export and unbordered pointer interaction. The final latest-source staged regression independently reran and passed 43/43 applicable Chromium scripts (five obsolete archived UI scripts were explicitly excluded, preserved in the immutable history ZIP). This check used the current runtime including compact tool help and the corrected real-TeX test fixture.
- **One-shot stress observation:** 64 identical typeset fraction nodes, 1440×900 isolated Chromium, grid/axes off: 157.6 ms from file input to updated object count and 50.4 ms reported synchronous SVG rebuild; 64 mathematical SVG objects and zero error glyphs. This is a *single sample*, not p50/p95 or a claim of 60 FPS. Performance will depend on mathematical complexity and device.
- **Not verified:** public GitHub Pages origin, actual HTTP/module-cache behavior, physical stylus/touch hardware, Safari/Firefox/Edge, very long TeX, arbitrary TeX extensions, mobile virtual keyboard and simultaneous multi-tab writes.
- **Deferred:** native 3D surface plotting, parameter sliders, broader field-specific tools and dockable main panels remain future work, with no UI placeholder claimed complete.

## Compact editor controls and consolidated user requirements — 2026-11-13

**Scope:** A narrow UI-only pass on the already verified Round 2 math-labels baseline. Added a single cumulative user-requirements register (45 requests from the first new list + 16 semantic requests from the second list), compact icon toolbar with stable accessible labels and explanatory `title` tooltips, smaller object filter, revised Bézier/angle/line/point glyphs, user-facing `Vector` label for existing arrow tool, and Chinese `向量`. No change to JSON type, stored math geometry, MathJax renderer, dependency engine, export code or root website navigation.

**Verified in this extracted working copy (not hosted website):**

| Gate | Result | Method / scope |
| --- | --- | --- |
| Existing Node assertions | **PASS 152/152** | `node --test`, staged historical runner |
| Isolated Chromium regressions | **PASS 44/44 applicable** | All archived applicable scripts plus new `browser_compact_ui_current.py`; five obsolete UI scripts explicitly excluded, immutable originals remain archived |
| New browser UI regression | **PASS** | Header action accessible names/hover tooltip presence and width, glyph geometry including strokes, full filter semantics, undo/redo, legacy `Arrow(A,B)` and SVG export, 4 repeated English/Chinese locale transitions, 1440/700/390/320px responsive visibility |
| Historical compatibility | **PASS** | Regressions exposed and corrected exact `Save` accessible-name mismatch and ambiguous `Open a JSON project` accessible-name match; original historical tests pass unchanged |
| JSON schema fixtures | **PASS 4/4** | JSON Schema Draft 2020-12 fixtures against unchanged data format |
| Site HTML and root navigation | **PASS** | Static integration assertions; root `index.html`, `tools.html` are unmodified in this overlay |
| Real LaTeX/TikZ compilation | **PASS 2/2** | `pdflatex` compile on tested SVG/TikZ and `tikz-cd` export fixture |
| Historical cleanup | **PASS** | Verified SHA archive, prune→restore roundtrip, modified-historical-file hard rejection in a disposable copy |
| Visual inspection | **Performed, not an automated aesthetics guarantee** | Isolated desktop 1440×900 and mobile 390×844 captures; zoom controls still overlie stage, and mobile header is tall. Both remain open requirements. |

**Limitations:** Toolbar buttons use native `title` hover descriptions and `aria-label` rather than a custom tooltip component. Object search is compact but not yet an icon-only toggle. Arrow-to-Vector is a visible naming improvement only; legacy internal `arrow` remains the compatibility type and `Vector(A,B)` is not yet supported. The global Delete selected button has **not** been removed until a safe, tested object action menu replaces it. Other roadmap tasks (object graph / snapping, full 2D parametric+implicit, sliders, 3D, complete Chinese localization, true dockable panels) remain unimplemented. The 44 browser tests use an isolated Chromium `page.set_content` fixture, not the public GitHub Pages origin. Firefox, Safari, Edge and physical touch remain unverified.

## Object action menus and collapsible search — 2026-11-13 (current cut)

**Scope:** The object list now uses a single accessible `⋯` button per virtualized row with Show/Hide, Lock/Unlock and Delete in a viewport-clamped floating menu. The global Delete selected button is removed; dependency-aware deletion, Properties deletion, guarded keyboard deletion, Recently Deleted, restore, undo/redo and JSON model data are retained. Search starts hidden behind a magnifier; closing clears the filter. This is a focused editor UI cut, not a geometry/3D implementation.

**Focused verified evidence (offline source-tree Chromium):** `browser_object_menu_current.py` PASS for collapsed/search/Escape state, menu keyboard arrows/Tab/Escape/focus/outside dismissal, localized labels, locked dependent refusal, cascading deletion of an unselected object with unrelated selection preserved, trash restoration, undo/redo, malformed JSON rejection without mutation, detached stale control ID reuse, simulated localStorage write, and 390px/320px drawer/menu positioning. A total of 19 focused/compatible isolated Chromium scripts passed, including compact presentation, 3,000-object virtualization, geometry/property, routing, LaTeX/i18n, corruption quarantine and touch/mobile cases. A separate multi-tab script correctly marked synthetic-origin navigation UNVERIFIED; the obsolete archived Cut13 preset test was not counted as passed. The test fixture uses inlined ES modules rather than a real deployed origin; persistent storage in the focused test is a deterministic injected `localStorage` shim because the isolated `about:blank` page blocks native storage. The current UI is tested without legacy controls; archived scripts stay byte-for-byte immutable and the active test harness maps their retired inline eye/lock/search selectors to the current menu behavior **only for historical fixtures**.

**Unverified:** live GitHub Pages deployment/cache, Firefox/Safari/Edge, actual mobile assistive technology, true multi-tab writes and physical touch. The current source ZIP includes only `mathillustrator/`, not the root-site homepage/navigation assets, so root-site link assertions cannot be rerun against this upload. No MathReader sources are modified.

**Additional verification:** `node --test tests/*.test.mjs` passed 152/152 tests; active-file and immutable-archive digests checked against the single package inventory (64 active paths). The original `manage_history.py verify` checks also reach the root-website requirement, but necessarily stop there on this mathillustrator-only upload. Archive SHA inventory was not rewritten. No historical archived test was changed.


## Round 5 — Ultra Smooth and pencil artwork (2026-11-13)

**Source:** extracted user-uploaded `mathillustrator.zip` with prior `mathillustrator_round4_overlay.zip` applied. Before editing, all 13 Round 4 overlay files matched the extracted working tree byte-for-byte. The upload contains only `mathillustrator/`, not root-site `index.html` or `tools.html`.

**Implementation:** Ultra Smooth no longer just inserts Chaikin corner points. It resamples the path in arc-length at up to 4096 points and applies a zero-phase, screen-space Gaussian position filter to suppress small hand tremor. Original stroke endpoints and invalid-data fail-closed behavior are preserved. Other correction modes, existing saved curves, and project schema are unchanged. Live freehand preview now renders the same cubic curve primitive as the committed stroke. The editor ∑ mark is replaced with a local tilted-pencil SVG; a matching self-contained landscape SVG cover is staged for `tools.html`.

**Checks actually performed in isolated current source:**
- `node --test tests/*.test.mjs`: **154/154 PASS** (previous 152 plus two new smoothing invariance/robustness assertions).
- Headless Chromium scripts: **12 PASS**: `browser_pencil_ultra_current.py`, `browser_object_menu_current.py`, `browser_compact_ui_current.py`, `browser_smoke.py`, `browser_edges.py`, `browser_touch_current.py`, `browser_latex_i18n.py`, `browser_mobile_current.py`, `browser_storage.py`, `browser_cut04_pointer.py`, `browser_cut09.py`, `browser_cut14.py`. The separate `browser_cut24_sweep.py` batch exceeded the available execution budget and is **not counted as passed**.
- New focused browser exercises 114 alternating pointer moves, cubic live preview, committed freehand shape, JSON/SVG export, undo/redo, and correct editor brand element; both SVG assets parse as valid XML.
- Synthetic high-frequency jitter RMS under new Ultra = ~14.6% of input RMS for the tested example, not a perceptual guarantee on arbitrary drawings. A single Node run on a 9,900-sample path took ~30ms for smoothing and yielded the capped 4,096 points; not a browser FPS benchmark.
- Project schema and historical runtime API are unchanged; no MathReader files touched. Archive assets are not rewritten. Active digest inventory is refreshed for this extracted tree.

**Deferred / cannot verify:** homepage software suggestion removal (requires latest website-root `index.html`), Tools-page cover hookup (requires latest website-root `tools.html`), HTTP origin/module cache, Safari/Firefox/Edge, physical stylus, deployed visual comparison to MathReader tile. Root-site integration tests cannot validate the missing two pages. Do not claim the SVG cover alone changes the Tools listing.
