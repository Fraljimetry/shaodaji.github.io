# MathIllustrator Cut 07 / v0.8.0 — comprehensive control audit (2026-11-12)

## Basis and honest scope

Source baseline: the **exact uploaded Cut06 cumulative overlay** (`mathillustrator_cut06_overlay.zip`, 71 paths), extracted into an independent working directory; all website-root files are preserved. The app remains a local-first static editor, with no MathReader code changed. This audit enumerates all currently present tool tiles and UI controls, then maps their supported operations to executable isolated Chromium, Node, JSON-schema, compiler and static site tests. It is NOT a claim that the originally proposed 3D, Ricci-flow, Möbius, animation, arbitrary LaTeX, or general constraints features are complete.

Machine-readable truth: `cut07-control-matrix.json` records per-control status and evidence; `cut07-regressions.json` records new cases MI-RECT-071 to MI-AUDIT-079. The detailed no-hidden-fallback standard remains `REGRESSION_POLICY.md`.

## New reproducible discoveries

| ID | Actual Cut06 defect or gap | Cut07 behavior | Evidence |
| --- | --- | --- | --- |
| MI-RECT-071/072 | Rectangle tile stored a four-point unconstrained polygon; `Rectangle(A,B)` unsupported | Two live opposite-corner refs for both cursor/command; reject new zero-area rectangles | **RED** Cut06 for new `cut07.test.mjs`, **GREEN** Cut07; Chromium rect edit and TikZ export |
| MI-RECT-073 | Compatibility risk while changing rectangle semantics | Older four-point polygons unchanged, v1 schema additive | Node legacy regression; four example fixtures |
| MI-INPUT-074 | Text prompt truncated >1000 characters despite 2000-character model allowance; no rejection warning | 1200-character prompt retained byte-exact, >2000 explicitly rejected; node/morphism >1000 rejected | Isolated Chromium adversarial, JSON download |
| MI-IMPORT-075 | `File.text()` completion could overwrite document edits performed after file selection | Revision guard rejects stale result, never replaces later objects | Delayed synthetic File.text, followed by a construction, in Chromium |
| MI-UI-076 | Import/Export overlays could not be closed with Escape; global shortcut context unisolated | Escape dismisses and restores focus; canvas-wide shortcuts ignored while overlay visible | Chromium keyboard/overlay suite |
| MI-TEX-077 | TikZ button enabled for raw Unicode labels not supported by target pdfLaTeX | TikZ disabled for non-ASCII/control text; SVG/JSON still allowed | Chromium conditional option assertions |
| MI-PROP-078 | Rapid consecutive property changes sometimes lost due to rAF replacing an input during edit | Focus-sensitive panel rerender; failed changes restore original values | **RED** intermittent lost opacity/bend in initial Cut07 property sweep; repeated **GREEN** afterwards |
| MI-AUDIT-079 | Previous acceptance did not enumerate individual controls | Complete current UI control inventory with explicit disabled/not-verified statuses | New three Cut07 Chromium files and JSON matrix |

## Regression provenance, qualifications and remaining risk

- **Model:** all `tests/*.test.mjs` should be executed from fresh extracted package. New Cut07 model cases cover live rectangle, degenerate reject, legacy polygon. Runtime and v1 JSON Schema both require rectangle two-point references.
- **Isolated browser:** `tests/browser_cut07_inventory.py` exercises 15 cursor drawing actions individually plus programmatic construction families, invalid commands, presets, individual Settings controls, export types, and undo/redo; `tests/browser_cut07_properties.py` exercises focused/invalid edits, conditional property panels, lock/hide/delete/ordering, pan/zoom and new/undo; `tests/browser_cut07_adversarial.py` exercises new fidelity and negative paths. Prior browser regression scripts are retained.
- **TeX:** representative TikZ and semantic tikz-cd must compile with actual `pdflatex`; the new rectangle code is also checked. Any supported TeX source is a static depiction, not editable mathematical dependency preservation.
- **Performance:** the release makes no new large-scene frame-time claim. Prior measured 3000-point redraw times vary materially; full scene redraw, font overflow and interactive hit-test scaling remain relevant bottlenecks. No GPU acceleration or unbounded ODE solver is included.
- **Deployment boundary:** browser tests use Chromium on an inlined `about:blank` document because localhost navigation is blocked in the sandbox. This does not prove hosted GitHub Pages MIME/routing, cache freshness, Firefox/Safari, touch, screenreader, or real simultaneously racing browser tabs. Browser storage with `file://`/`about:blank` may be restricted; synthetic storage regressions do not certify Web Locks behavior on the live origin.
- **Remaining semantic limitations:** movement can still collapse an *existing* rectangle, full general geometric constraint propagation is absent, arbitrary long labels may visually overflow node boxes; TikZ Unicode/math mode is not supported. Hidden/offscreen objects remain in JSON, and legacy unconstrained polygons are not silently converted.

## Installation / cumulative package

Cut07 must be distributed as one site-root relative **cumulative MathIllustrator ZIP overlay** including all prior Cut00–06 files, current tests, documentation and JSON contracts. `index.html` / `tools.html` at site root are the explicit navigation exceptions, unchanged from Cut06; no `mathreader/` file may be present. Before extracting on a modified live website, review the two root HTML pages. The final ZIP must pass `package_integrity.py`, JavaScript syntax, Node, JSON-schema fixtures, standalone UI tests, and upgrade/union checks. Only evidence actually executed is reported as PASS.

## Final executable evidence (clean package gate)

- Node model: **55/55 PASS**, including Cut07 rectangle/legacy model regressions.
- Isolated Chromium: three new feature/control suites verified (22 inventory groups, 9 property groups, 6 adversarial groups). Cut06 browser suite reran separately and passed; all older isolated suites are retained and rerun at release gate where executable.
- Actual `pdflatex`: **2 documents compile**: mixed mathematical geometry **including a Cut07 rectangle**, and semantic `tikz-cd`. Compilation alone does not certify visual layout or arbitrary TeX inputs.
- JSON Schema Draft 2020-12 validated; all 4 example projects validate.
- Cumulative ZIP inventory includes a byte-level SHA256 verification manifest for every file except the two self-referential inventory files. The integrity script is part of the archive and executes on a clean extraction.

Final web deployment, touch hardware, other rendering engines, and truly concurrent autosave tabs remain **unverified**.

## Addendum — homepage integration requested during Cut 07

The pre-addendum Cut07 overlay already had valid launch links. However, homepage software cards followed the About section and occupied 2/3 of an inherited 3-column grid, and the hero contained no direct tool discoverability affordance. This is a homepage prominence/layout gap rather than a missing path. The new design moves a balanced two-tool showcase above About, adds MathReader/MathIllustrator entry paths near the hero, and supplies dedicated Tools page anchors and a direct Illustrator tutorial link. No changes to MathReader application or global site stylesheet/script were required. Both root HTML pages are changed against Cut06 and must be reviewed before overwriting.

New execution: `tests/site_integration.py` PASS on merged original-site assets plus Cut07; `tests/browser_site_home.py` PASS for 8 combinations (homepage and Tools × 1366px/390px × English/Chinese), with dark-mode switching and no horizontal overflow. The CSS and locale JS were loaded from the original website archive (not mocked), with third-party scripts and images suppressed to isolate layout; previews' file existence was tested separately. Hosted HTTP navigation and cross-browser caching remain UNVERIFIED. During the broader Cut07 property checks, one browser run timed out waiting for a JSON Save after hiding a point, but an immediate identical rerun passed; no application bug was conclusively reproduced, so this is explicitly recorded as intermittent test flakiness and not counted as fixed.

Incremental homepage case IDs: MI-SITE-080 — page prominence/two-column card layout; MI-SITE-081 — bilingual two-tool launch and details/tutorial affordances; MI-SITE-082 — mobile/dark responsiveness and scroll-width containment. Source of truth: `cut07-regressions.json`, `site_integration.py`, `browser_site_home.py`.

### Cut 07 test-harness reliability follow-up (MI-TEST-083)

The isolated `browser_cut07_properties.py` test intermittently timed out on a JSON Save download after many repeated downloads in a single Chromium session. This is **not evidence of a production Save bug**: normal one-shot download behavior continued to pass in `browser_smoke.py` and `browser_cut07_inventory.py`. The property suite now intercepts its own generated Save JSON blob solely for *read-only test assertions* while leaving the real download test paths intact. After that bounded test-only change, the property suite passed in two successive isolated Chromium runs. The exact underlying browser-level throttling cause is plausible but not proven; do not treat that diagnosis as certified.

The retained isolated Chromium regression scripts from Cuts 00–06 were rerun in three batches and each passed (baseline smoke, edge pointer, synthetic storage, Cut02, Cut03, Cut03 storage, Cut04, Cut04 stale, Cut04 pointer, Cut04 opacity, Cut05 renderer, Cut05 virtual list, Cut06). These still do not certify hosted HTTP, other browsers, physical touch or genuine concurrent tabs.

### Newly reproduced publication-gate race — MI-PROP-084

A **clean extracted Cut07 ZIP** intermittently failed an existing property-suite assertion: after an invalid Number of sides update, an immediate valid Fill edit was lost; a second scenario rejected point radius 101 and reset the accepted radius 9 back to the initial default 5. This was confirmed independently of the earlier repeated-download harness issue. The root problem had two interacting parts: rollback recreated document objects while the prior field closures stayed mounted until rAF; `field()` reset rejected input values from the *initial render* rather than the most recent valid change. Forcing an immediate `replaceChildren()` was tried and **rejected**, because `blur`/`change` handlers re-entered the DOM update and caused browser exceptions.

Final bounded fix: a `documentGeneration` token changes only on genuine document replacement/undo/import, allowing consecutive edits after a logical same-document rollback while rejecting old controls after a different project is opened. Every `field()` tracks its latest accepted value and resets to that, rather than the initial render value. Stale list controls retain identity checks. The Cut07 properties suite passed four consecutive times after this change, and the earlier Cut04 reused-ID control suite passed again. Code changes are in `src/app.mjs`; `tests/browser_cut07_properties.py` asserts restored field values immediately, then adjacent fields. Test provenance remains isolated headless Chromium (not cross-browser).

This issue was **not** a generic failure of all Saves; it is an input/edit-state reentrancy and rollback problem, and it merits separate classification from MI-TEST-083.
