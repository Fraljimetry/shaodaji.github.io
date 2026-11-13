# MathIllustrator · documentation index — v0.26.0 Cut 25

This is a managed documentation system, not a loose collection of markdown files. Its purpose is to preserve verified behavior, architectural decisions, machine-readable JSON contracts, development progress, performance observations, and subtle regressions for subsequent AI/developer handovers.

## Authority and provenance

- **Executable authority:** `src/model.mjs` (validation/JSON), `src/app.mjs` (UI/render/export), `src/geometry.mjs` (geometry helpers), `src/diagram.mjs` (restricted LaTeX interchange).
- **User-facing capability contract:** `../tutorial.html` (all currently usable actions, syntax, limitations, troubleshooting).
- **Machine-readable inventory:** `manifest.json` and `planning/features.json` (statuses implemented/partial/planned/unsupported).
- **Data contract:** `schemas/project-v1.schema.json`, with cross-document invariants enforced by the runtime validator. Current project schema version is 1 while application release is 0.26.0. **Never change project schema version merely because the app release changes.**
- **Acceptance evidence:** `quality/regression-cases.json` and current `quality/TEST_REPORT_20261112_CUT25.md`; `quality/performance.json` has measured data and provenance. Cut00 report remains as historical evidence, not current acceptance.

## Structured directories

| Folder | Files and responsibility |
| --- | --- |
| `architecture/` | `OBJECT_MODEL.md` — semantic geometry graph, screen transform, renderer, state/persistence contract |
| `decisions/` | `ADR-0001-browser-first-semantic-editor.md`; `ADR-0002-restricted-tikzcd-interchange.md` — architectural choices and honest compromises |
| `schemas/` | `project-v1.schema.json` — machine-readable versioned JSON interchange schema |
| `planning/` | `features.json` for status; `ROADMAP.md` for roadmap/cut scope and explicit release gates |
| `quality/` | `KNOWN_ISSUES.md`, `regression-cases.json`, `performance.json`, the cut-based test reports and package inventory |

## Every-cut discipline — no documentation drift

1. Always start from the actual latest MathIllustrator overlay/site files. Never assume a previous chat provides the complete source, and never modify MathReader.
2. Deliver **one ZIP overlay** with cumulative application files under `mathillustrator/` plus required root `index.html`/`tools.html` integration files, relative to the site root, not a full site archive. No generated caches, `.pyc`, `.git`, temporary outputs or scattered code files.
3. Update the tutorial in the same cut whenever controls, limits or file formats change. Keep `manifest.json`, `features.json`, schema, roadmap, regression case inventory, known issues, measured performance data and handover report consistent with code.
4. Fix using reproduce → failing test → minimal repair → green test → documented provenance. Check second-order cases: pointer capture/cancel, reentrancy, drag/undo, hidden/locked dependencies, name/ID collisions, cycles/diamonds/deep chains, malformed/out-of-range data, autosave races, broken exports, unsupported formats, zoom/clipping, responsiveness, security and stale state.
5. Avoid silently changing data meaning. A changed v1 field must remain backward compatible; incompatible changes require an explicit version and migration tests. **JSON is the lossless editable project source.** `tikz-cd` is supported only for documented semantic subset; ordinary TikZ/SVG exports are depictions.
6. Keep three separate kinds of evidence: pure Node/model test, isolated real-browser UI test, and real deployed-site cross-browser/manual verification. Never label the latter PASS if only the first two were performed.
7. Record actual and unmeasured performance honestly; don't claim 60 FPS from a small isolated benchmark. If the browser does not support a format or the current scene cannot be represented, disable the option or report a hard error.

## Next iteration handover

Read in order: `manifest.json`, `planning/features.json`, `architecture/OBJECT_MODEL.md`, newest `quality/TEST_REPORT_*.md`, `quality/KNOWN_ISSUES.md`, `quality/regression-cases.json`, `quality/performance.json`, `../tutorial.html`. Run both Node and isolated-browser suites before changing source. Prefer strict small cuts with an exact overlay delta and no hidden fallbacks.


## Cut 02 release integration and regression policy

- `quality/TEST_REPORT_20261112_CUT02.md`: confirmed fixes, static site link checks, exact regression provenance and limitations.
- `quality/cut02-regressions.json`: machine-readable newly added tests and outcomes.
- `quality/cut02-package.json`: cumulative ZIP contents, scope and base assumptions.
- `tests/site_integration.py`: validate homepage/Tools links, editor entry and module/style paths against a local extracted website root.
- `../index.html` and `../tools.html` are **site-root integration exceptions only**; they must be included whenever otherwise the application would be undiscoverable from the actual homepage.

Regression remains incremental: do not mark a feature verified solely because unit tests pass. Include object identity and stale-task/closure hazards, page reload, import and export compatibility, errors/rollback, mobile state transitions, dependency graph depth, output-disabled cases, oversized scenes and real deployment paths. Record any browser/network policy block explicitly rather than calling it a success.

## Cut 03 integration of MathReader documentation lessons

- Standing adversarial checklist: [quality/REGRESSION_POLICY.md](quality/REGRESSION_POLICY.md), adapted from the inspected MathReader v436 `REGRESSION.md` rules; use on **every** change, not only reported bugs.
- Current release evidence: [quality/TEST_REPORT_20261112_CUT03.md](quality/TEST_REPORT_20261112_CUT03.md) and [quality/cut03-regressions.json](quality/cut03-regressions.json). Historical releases remain separately located.
- A feature is not implemented merely because an option is visible; only tested user behavior and documented limitations count. Every Settings control requires valid/default/bad-value/import/reload/export/undo checks where relevant.
- Browser tests using data: modules on `about:blank` verify interaction, not deployment or cross-browser fidelity. **Unverified is not PASS.**

## Cut 04 / v0.5 handover and evidence

- Current reproducible evidence: `quality/TEST_REPORT_20261112_CUT04.md`, `quality/cut04-regressions.json` and `quality/cut04-package.json`. Earlier cut reports remain historical and are not retroactively altered.
- New invariants: freehand correction is visible live, pointer-up positions are authoritative without moving point-on-click; detached controls cannot act on replacement documents even if object IDs match; zero-opacity objects do not retain opaque labels or hit disks.
- tikz-cd export now re-imports the resulting source and checks node texts/cell positions and arrow incidence/labels/directions before enabling it. Escaped `\&` remains part of a node label, and unsupported source is rejected explicitly.
- New optional `style.pointSize` is valid on point-like objects only. Legacy projects lacking the field remain valid and use global settings. Keep schema, runtime and tutorial synchronized.
- Browser regression suites run on isolated inline modules and cannot establish production module MIME, HTTP caching, cross-browser font metrics, or real multi-tab atomicity. Preserve this distinction in every release.


## Cut 05 / v0.6 handover

- Current evidence: `quality/TEST_REPORT_20261112_CUT05.md`, `quality/cut05-regressions.json`, `quality/cut05-package.json`. Historical release documents are immutable and remain under `quality/`.
- SVG arrows now draw marker-free triangle geometry. This matters when figures from different exports are embedded together in an HTML page; per-object stroke/opacity remains meaningful.
- A 3000-object scroll list is windowed (only visible DOM rows and overscan), without changing the JSON schema, undo or object count. Visible point selection uses nearest-point geometric picking instead of per-point SVG hit overlays, even if another shape covers the point. Offscreen **point-only** primitives may be culled from drawing, never from native data.
- New tests are `tests/cut05.test.mjs`, `tests/browser_cut05.py`, `tests/browser_cut05_list.py`. Existing scripts `browser_smoke.py`, `browser_edges.py`, and `browser_cut04_pointer.py` were adjusted to target visible circles instead of deprecated hit disks; behavior assertions remain intact. No MathReader edits.
- Remaining critical unverified items: real atomic two-tab saves (no localStorage CAS), browser MIME/navigation on the hosted site, mobile touch, full screenreader navigation through virtualization, and 60 FPS with dense visible objects.

## Cut 06 handover / storage guarantee boundary

Source of truth: `src/storage.mjs` implements explicit compare-and-write and optional origin-wide browser lock; `src/app.mjs` requests lock for normal saves and validates actual storage token before commit. Neither localStorage fallback nor `pagehide` last-chance write is guaranteed atomic, and there is no silent merge. `tests/cut06.test.mjs` tests deterministic simulated contention, not actual real-tab browser lock behavior. A real cross-tab navigation test on the hosted HTTPS domain remains mandatory before claiming atomicity.

New case ledger: `quality/cut06-regressions.json`, `quality/TEST_REPORT_20261112_CUT07.md`. **Do not infer that an editor canvas zoom should change TikZ source code**: Cut06 intentionally makes static vector publication output zoom-independent, although viewport-specific SVG exports remain view-dependent.

Cut06 cumulative integrity: `tests/package_integrity.py` now validates the complete overlay inventory, including restored original Cut00 assets. Every future cut must compare the union of earlier paths against the new archive; do not assume "cumulative" means complete without checking.

## Cut 07 acceptance and detailed control matrix

- Read `quality/cut07-control-matrix.json` before claiming a control is verified. Entries distinguish executed isolated-browser checks, older retained tests, partial checks, disabled functionality, and unverified real-world behavior.
- New controls/features: live rectangle semantics; no loss of prompted text; import task invalidation on intervening mutations; valid/invalid property input refresh; pdfLaTeX-oriented Unicode capability checks; Escape and shortcut isolation for dialogs.
- Machine-readable Cut 07 red/green cases and report: `quality/cut07-regressions.json`, `quality/TEST_REPORT_20261112_CUT07.md`. Historical evidence remains unchanged.

## Cut 07 website-root addendum

`decisions/ADR-0003-site-root-integration.md` now documents *placement and discoverability*, not merely launch-link existence. `tests/browser_site_home.py` and `tests/site_integration.py` verify the updated bilingual, theme-aware homepage and two-tool layout. Both website root HTML files are explicit overlay exceptions. The `tools.html#mathreader` and `tools.html#mathillustrator` deep links are stable. A real hosted-site acceptance check is still required.

## Cut 08 — precision, live geometry and large scenes

See [test evidence](quality/TEST_REPORT_20261112_CUT08.md) and [machine-readable cases](quality/cut08-regressions.json), plus `tests/cut08.test.mjs` and `tests/browser_cut08.py`. The [current manifest](manifest.json), [JSON schema](schemas/project-v1.schema.json), [features](planning/features.json), [standing regression policy](quality/REGRESSION_POLICY.md), and [tutorial](../tutorial.html) reflect this cut. The root Tools-page improvement delivered separately after Cut07 is included.

## Cut 09 — publication limits, asynchronous export and focus safety

[Cut 09 report](quality/TEST_REPORT_20261112_CUT09.md), [structured cases](quality/cut09-regressions.json), `tests/cut09.test.mjs`, `tests/browser_cut09.py` and `src/export_fidelity.mjs`. Document schema remains native v1. Browser-navigation policy blocked the optional genuine two-tab test; don't count it as a pass. PDF/3D/Möbius/flow features remain unimplemented.

## Cut 10 handover

Source changes: `src/diagram_layout.mjs` (screen-space edge clipping to variable-size node boxes), `src/plot_cache.mjs` (bounded cached function paths), `src/geometry.mjs` (viewport-clipped infinite lines), and `src/app.mjs` (UI wiring, modal backdrop/focus and virtual-list arrow keys). Read `quality/TEST_REPORT_20261112_CUT10.md` for evidence and limits. `tests/browser_smoke.py` now resolves the new ES modules for isolated inlined-browser tests; it does not rewrite deployment module URLs. The JSON project schema remains **v1 unchanged**.


## Cut 11 handover

Read [Cut 11 report](quality/TEST_REPORT_20261112_CUT11.md), [structured cases](quality/cut11-regressions.json), [updated standing policy](quality/REGRESSION_POLICY.md), and [performance limits](quality/performance.json). New source is `src/anchor_index.mjs`; view-oriented `src/diagram_layout.mjs`, `src/geometry.mjs` and sampler `src/plot.mjs` also changed. Native projects stay version 1 with an optional `plotQuality` setting. Execute `tests/cut11.test.mjs` and `tests/browser_cut11.py` plus all retained tests; keep site-root `index.html` and `tools.html` in any cumulative overlay.


## Cut 12 / v0.13 handover

- New report: `quality/TEST_REPORT_20261112_CUT12.md` and machine cases: `quality/cut12-regressions.json`.
- New testability inventory: `quality/cut12-function-inventory.json` (named source functions + relationship to the existing 152-control matrix); evidence levels are explicit rather than overstated.
- Verify `document` background lifecycle and worldBounds visible-only semantics; indexed `makeRefs` must preserve exact legacy anchor references, not merely improve runtime. Dedicated tests: `tests/cut12.test.mjs`, `tests/browser_cut12.py`, `tests/browser_cut12_batch.py`.

## Cut 13 handover — settings matrix and migration boundary

- New cases: `quality/cut13-regressions.json`, `quality/cut13-control-state-matrix.json`, `quality/TEST_REPORT_20261112_CUT13.md`; executable `tests/browser_cut13.py`, `tests/cut13.test.mjs`.
- Preset matching is **drawing-only**, not page/export/theme. Custom is read-only status. Preset application restores anchor snapping, point labels and polygon sides to explicitly documented defaults.
- Mutations to export-only options are still undoable, validated and saved; do not unnecessarily rerender the SVG.
- `preserveInheritedPointSizes` is only invoked when the new point-size default actually changes, preserving the displayed size of v1 legacy objects with absent `style.pointSize`; this is an explicit additive migration at user action, *not* passive import.
- Next: focused keyboard/IME navigation, real-device mobile/pen gestures, failed localStorage quota and same-origin cross-tab contention, graphical export golden baselines.

- The stable `tests/package_integrity.py` now validates Cut13 (not a stale Cut12 file count); also available as `tests/package_integrity_cut13.py`. Each future cumulative release must retarget this stable test entry point before packaging.

## Cut 14 acceptance and staged UI audit

- New executable targeted browser matrix: `tests/browser_cut14.py`, covering cross-document drafts, tab-hidden drafts, delayed identical-content New/import, IME global shortcuts (including modal), active drag + zoom, simulated quota failure, JSON manual export and recovery.
- Structured cases and evidence: `quality/cut14-regressions.json` and `quality/TEST_REPORT_20261112_CUT14.md`. Preserve every older report and corresponding historical manifest.
- These are new **controller-level** browser regressions: the unchanged 93 Node tests still pass. The cumulative UI inventory (152 entries) and function inventory (123 named functions) remain *coverage maps*, not assertions of exhaustive branch/state testing.
- Continue next with browser-origin storage/quota, real touchscreen/pen, accessible modal semantics, and export goldens; never infer those from synthetic events.

## Cut 15 — v0.16.0
- New audit: `quality/TEST_REPORT_20261112_CUT15.md`.
- Machine-readable coverage: `quality/cut15-coverage-matrix.json` and `quality/cut15-regressions.json`.
- Executable tests: `tests/browser_cut15.py` (synthetic pointer/wheel), `tests/browser_cut15_mobile.py` (Chromium touch emulation) and `tests/cut15.test.mjs` (mocked storage). This is a *partial* functional audit; do not interpret coverage as real hardware or cross-browser certification.


## Cut 16: save/recovery contract

Current acceptance evidence: `quality/TEST_REPORT_20261112_CUT16.md`, `quality/cut16-regressions.json`, `quality/cut16-package.json`, and `tests/cut16.test.mjs` / `tests/browser_cut16.py`. Older audit records remain unchanged as historical evidence.

A stale `StorageEvent.newValue` is not authority; always re-read the currently stored project. Compare-and-write may return an explicit idempotent synchronization when a concurrent tab saved the *same bytes*, but it must still reject a different payload. Test quota recovery through the visible retry control, not just by performing another document edit. `pagehide` and non-Web-Locks saves are **not transactional**. Do not claim atomic real-tab saves merely from mocks or an inline `about:blank` browser test.

## Cut 17 quality / export / rendering evidence

The latest release report is `quality/TEST_REPORT_20261112_CUT17.md`. Machine-readable new cases and fixed-scene performance probes live in `quality/cut17-regressions.json` and `quality/cut17-performance.json`. The permanent `quality/performance.json` retains older benchmarks and links this specific measurement. The editor is still an early, noncertified 2D tool: these improvements do not provide exact curve topology, arbitrary TeX support or universal 60 FPS.

## Cut 18 acceptance

Current release: **v0.19.0**. Cut 18 focused on user-selected transparent image output, actual browser-encoded alpha pixels, backward-compatible JSON settings, SVG `xml:space` and TikZ whitespace representability. Direct evidence and limitations: `quality/TEST_REPORT_20261112_CUT18.md`, `quality/cut18-regressions.json`. No broad large-scene performance improvement is claimed.

## Cut 19 acceptance and handover

Current release: **v0.20.0**, while editable project JSON remains version **1**. The new Cut19 report, regression cases and raw 12-run SVG benchmark live in `quality/TEST_REPORT_20261112_CUT19.md`, `quality/cut19-regressions.json`, and `quality/cut19-performance.json`, and `quality/cut19-browser-results.json` (30/30 clean extracted browser editor scripts). It extends, not replaces, the older acceptance records. Historical browser scripts requiring a label field changed from `input` to `textarea` were updated as test harness compatibility work. Current deployment and real multi-tab atomicity remain unverified.

## Cut 20 — v0.21.0

Current report: `quality/TEST_REPORT_20261112_CUT20.md`. Structured cases: `quality/cut20-regressions.json`; paired raw benchmark: `quality/cut20-performance.json`; package inventory: `quality/cut20-package.json`. Add `src/label_layout.mjs` to the authoritative runtime modules. The new optional `settings.labelPlacement` remains native JSON v1 with Standard mode for older documents. Ctrl-click cycles overlap candidates; the preexisting standard selection and keyboard/pointer guards remain. Explicitly disable unsupported TikZ visual layouts; neither model semantics nor mathematically meaningful labels may be silently changed. Historical release records remain immutable.


## Cut 21 handover (v0.22.0)

New source: `src/diagram_routing.mjs`. Direct routes remain default; opt-in two-turn obstacle avoidance and manual morphism label offsets are documented and strictly validated. `quality/TEST_REPORT_20261112_CUT21.md` describes red/green evidence, `quality/cut21-regressions.json` lists subtle failures and `quality/cut21-performance.json` contains all benchmark samples. Unsupported TikZ visual conversions are disabled, not silently approximated.

## Cut 22 handover (v0.23.0)

- Release evidence and red/green reproduction: `quality/TEST_REPORT_20261112_CUT22.md`; scripted results in `quality/cut22-browser-results.json`, `quality/cut22-regressions.json`.
- Source: editor-only handle and lifecycle in `src/app.mjs`; pure bounded offset calculation in `src/diagram_routing.mjs`; only selected, visible, unlocked and labeled morphisms expose a handle.
- Tests: `tests/cut22.test.mjs`, `tests/browser_cut22.py`, retained Node/Chromium suites. Native JSON schema **unchanged v1**; root `index.html`/`tools.html` retain Cut21 navigation.
- Outstanding: automatic label collision avoidance, obstacle-aware multi-edge routing, precision mathematical typography, cross-browser and actual touch/stylus hardware tests.


## Cut 23 handover (v0.24.0)

- New module: `src/morphism_label_layout.mjs`, deterministic bounded screen-space morphism-label candidates, manual-first placement, visible unresolved collision status.
- Direct browser evidence: `tests/browser_cut23.py`, pure regression: `tests/cut23.test.mjs`; per-release report `quality/TEST_REPORT_20261112_CUT23.md`; package reproducibility `tests/package_integrity_cut23.py`.
- JSON v1 extension: optional morphism-only boolean `labelAvoid`, default false; native data untouched by automatic layout.
- The previous limitations remain; zoom/crop, font metrics and unsupported TikZ are documented in the tutorial.

## Cut 24 handover (v0.25.0)

- UI: morphism Properties → Arrow routing adds **Reduce crossings (best effort)**. Direct/curved and Avoid nodes remain unchanged.
- Routing: a single stable document-order route map supplies SVG/raster rendering and morphism label layout; only earlier visible arrows participate. A curved predecessor is approximated as a 12-piece polyline. Endpoint touching is not counted as a strict crossing. A 128-prior-arrow or 8192-pair comparison limit triggers a visibly unresolved amber path rather than a silent claim.
- Data: optional `routing: "avoid-crossings"` on morphisms in unchanged project v1; invalid modes and nonmorphism uses rejected.
- Test provenance: 136 Node cases, 35 isolated Chromium editor scripts; check actual clean-ZIP acceptance in `quality/TEST_REPORT_20261112_CUT24.md`. See new machine-readable files `cut24-regressions.json`, `cut24-browser-results.json`, `cut24-performance.json`.
- Never treat arrow-crossing reduction as planar graph layout, exact TeX typography, or a guarantee of a collision-free export. Existing limitations and real-device/deployment verification remain open.

## Cut 25 — release evidence and handover

- Read `quality/TEST_REPORT_20261112_CUT25.md` and the machine-readable `cut25-regressions.json`, `cut25-performance.json`, `cut25-browser-results.json`, `cut25-package.json`.
- `src/diagram_global_routing.mjs` adds a 48-arrow/two-pass opt-in screen-space refinement; `src/diagram_routing.mjs` adds overlap/T-junction visual conflict checks. The `routing` JSON enum gains `scene-crossings` without changing schema version 1.
- Do **not** infer full global routing or planarity from this feature. Check amber warnings, editor/export matching, historical modes, and the latest tutorial.
- Browser coverage uses inline isolated Chromium; genuine server deploy, Firefox/Safari, physical pen/touch and real multi-tab atomicity remain separate acceptance gates.
