# MathReader JavaScript layout

`mathreader.js` is the small bootstrap. The application source remains one logical ES module: the bootstrap fetches the files in this directory in order, concatenates them, and imports the assembled module once. This preserves the lexical scope and hoisting behavior of the former monolithic file while keeping maintenance boundaries explicit.

Do not load these files as independent `<script>` or `<script type="module">` tags. They intentionally share module-local state. Keep their order synchronized with the `PARTS` manifest in `../mathreader.js`.

Subsystems:

- `00-core.js` — state, persistence, document OCR, preferences, base UI
- `10-formula-ocr.js` — formula OCR engine, LaTeX repair, diagnostics
- `11-formula-vector.js` — vector extraction, image preprocessing, OCR/vector fusion
- `20-selection-annotations.js` — selection, annotations, manual edits
- `30-rendering-navigation.js` — rendering, continuous mode, zoom, navigation
- `40-outline-structure.js` — outline inference and Structure UI
- `41-equations-bibliography.js` — equation/results/bibliography indexing and UI
- `50-references-search.js` — references, TOC, backlinks, glossary, search
- `60-notes-bookmarks-data.js` — comments, notes, bookmarks, document I/O, recovery
- `70-command-ui-runtime.js` — command palette, event wiring, sidebars, shortcuts, startup

Maintenance baseline (v351): only the ten manifest-listed subsystem files form
MathReader's runtime. Top-level private declarations may be referenced across
subsystems despite appearing unused within one file. Before pruning one, check
references across the complete assembled source, including UI event bindings;
leave any detection or OCR behavior uncertain rather than deleting it. The v351
maintenance pass removed only declarations with no lexical references across all
ten source files; it did not rearrange the assembly, OCR pipeline, or indexers.
Run every `tests/*.js` file independently, and syntax-check both the bootstrap
and the assembled runtime after any structural maintenance. In particular,
`tests/maintenance_integrity_regression.js` protects manifest/cache and lazy-OCR
wiring but is not production-browser acceptance.


v352 Formula OCR rule: the rendered OCR LaTeX is sanitized for *syntactic* safety
using actual TeX environment/brace scope. Preserve legitimate aligned/matrix/
cases/array alignment separators; remove only illegal stray math-level `&` and
escape intended text ampersands. MathJax's rendered error nodes must be
recognized as failures even when its async API resolves. Keep the original
recognition available for editing, do not invent missing mathematical content,
and never represent syntax compilation as mathematical transcription accuracy.
For the authoritative old/new example corpus and its provenance, see
`../regression/formula_syntax_v352.json` and the v352 section of `../REGRESSION.md`.

Permanent paired regression requirement (2026-11-05): any document/text-index regression must also audit formulas from those **same** PDFs, with original-page/crop provenance, real image-to-LaTeX output when available, MathJax compilation and independent visual accuracy checks. See `../REGRESSION.md` and `../regression/paired_text_formula_50_20261105.json`. A syntax-only proxy is not recognition accuracy; incomplete stages remain UNVERIFIED.


v353 offline regression infrastructure: `../regression_tools/run.py` provides a
content-addressed PDF text/page-geometry cache, stage-specific detector/OCR
cache and paired formula compilation sidecar. It does not run in the website.
Do not describe native-text parser probes or Tesseract transcripts as final
browser indexes, Texify output, or verified mathematical recognition. See
`../regression_tools/README.md` and v353 entry in `../REGRESSION.md`.


## v354 safe performance maintenance

The ordered ten-part lexical module layout is unchanged. In
`30-rendering-navigation.js`, large continuous-document scroll-position lookup
now narrows its candidate window using frame offsets, then applies the same
existing rectangle-based visibility/distance comparison; small/irregular
layouts use the original full scan. The horizontal-overflow width maximum
avoids spreading all page widths into one JavaScript call. Keep mixed-page-size
anchor semantics and first-visible-page rendering intact; do not replace exact
page metrics with guesses. `mathreader.css` removes an accidental duplicate
OCR-modal rule inside the mobile media block. No detection or OCR behavior was
changed. Validate with `node mathreader/tests/performance_safe_regression.js`
as well as the complete regression suite.

## v355 P0 reliability infrastructure (offline tests only)

`../regression_tools/p0_gate.py`, `p0_browser.py`, `p0_browser_probe.js` and
`p0_ground_truth.py` implement the automated P0 code/browser/truth gates.
The probe is appended **only to a temporary test copy** of the final module;
it must not ship in the production runtime. No extra runtime JavaScript
module, panel, OCR trigger, cache schema or detector/recovery behavior was
introduced. Browser PDF.js and actual Texify acceptance require their real
pinned assets and whole-document independent ground truth. See
`../regression_tools/P0_ACCEPTANCE.md` and the v355 section of
`../REGRESSION.md` for exact PASS/FAIL/UNVERIFIED definitions.


## v356 P1: user-confirmed references to locally cached PDFs

The existing Bibliography rows now offer **Link PDF** for manually choosing an
*exact* different local-library PDF. Subsequent **Open PDF** uses that confirmed
association, flushes the current exact document session, and exposes a temporary
**↩ Paper** button to restore the originating page/ratio. Linked-document
Results/Equations use the existing sidebar; no automated cross-paper theorem
number matching, preview, network fetch, or new panel is introduced.

Mappings live in IndexedDB `meta/crossdoc-links:v1:<sourceId>` and never travel
with private reading-state export. Forgetting a PDF deletes the outgoing mapping;
unavailable inbound target bytes never trigger a guessed match. The return stack
is intentionally in-memory, though each PDF retains its independent normal
reading position. Link changes are reversible. During any PDF switch, previous
session and recovery saves are scoped to their captured document identity.

Use `node mathreader/tests/cross_document_regression.js` for concurrency,
missing-cache, exact-return, and persistence regression; the standard P0 gate
also runs `tests/p1_browser_smoke.py` in Chromium with a **simulated** PDF
backend. Its browser results are *not* actual PDF.js/Texify acceptance. The
v356 historical audit and remaining limitations are in `../REGRESSION.md`.


## v357 P0/P1 maintenance note

The v356 cross-document record schema (`meta/crossdoc-links:v1:<sourceId>`) and ten-part runtime are unchanged. The link-write guard now rejects delayed writes after a document switch, and the temporary Return journey is cleared on unrelated manual PDF opens; nested P1 navigation remains permitted. P0 comparison now checks real saved PNG crop evidence and finite, ordered page locations. Run `regression_tools/p1_browser_e2e.py` against genuine pinned PDF.js for end-to-end acceptance; the isolated Chromium P1 smoke is **not** equivalent.

## v358 P0/P1 audit note

v358 keeps all mathematical detectors, formula OCR runtime, lazy initialization, model fallback and index-cache schemas unchanged. A single P1 confirmed-link completion path now treats an IndexedDB write that completed after document switching as **committed to the original exact source PDF**, without touching the currently active paper's link map. P0 strict golden/capture validation and report version/status fidelity are improved in `regression_tools/`. See `../REGRESSION.md` for 110-PDF paired regression and live-engine blockers.


## v359 P0/P1 acceptance-tool cleanup

Only `mathreader.js` and the HTML version/cache-busting keys changed in the production runtime. All ten `js/*.js` subsystem bodies and the CSS are byte-identical to v358. Test-only `regression_tools/p0_browser_probe.js` now retains invalid/missing equation ratios and supports genuine PDF.js browser crop evidence without activating Texify. Regression tools do not alter production OCR loading, PDF navigation, index/recovery policies or P1 confirmed-link behavior. Real-engine acceptance remains incomplete until the original pinned PDF.js and Texify assets are available.


## v360 UI stability note

The mobile reader must use a single full-width grid track regardless of desktop
sidebar collapse classes, with `position:relative` for the reader shell so its
mobile absolute sidebars are properly anchored and clipped. Keep mobile toolbar
Open PDF, Contents/Workspace toggles and in-panel Close controls reachable,
including P1 Return at ≤520px. All desktop sidebar behavior is unchanged.
Run `python mathreader/tests/ui_responsive_regression.py` for offline actual-UI
Chromium viewport, touch, modal and repeated-interaction checks, and the full
`regression_tools/p0_gate.py` as before. Browser-shell tests are *not* genuine
PDF.js document switching or Texify acceptance. See `../REGRESSION.md`.


## v361 P1 bibliography context menu

Local PDF controls no longer occupy each Bibliography row. Right-click a
numbered bibliography entry to show a body-level **Link PDF / Relink PDF /
Open PDF / Unlink** context menu (available actions depend on confirmed link
state). On keyboard use **Shift+F10** or the **Context Menu** key while the
entry is focused; touch users can long-press the entry. A standard left click
still expands/collapses citations and a double-click still navigates to the
reference location. DOI/arXiv anchors retain native right-click behavior.
The temporary PDF picker remains embedded only while making a link.

This is a presentation-only P1 change: exact IDs, IndexedDB schema, return
position logic, PDF.js, Texify, and mathematical detectors are unchanged.
The P1 isolated Chromium test covers mouse, keyboard, and touch semantics; the
real two-PDF runner was updated but still requires pinned PDF.js assets.


## v362 header Help and standalone tutorial

The top-header Open button was replaced by a prominent `?` anchor to the static,
separate `tutorial.html` page (new tab; original reader remains open). The
standalone English/Chinese guide has its own responsive `tutorial.css` and
shares persisted language/theme preferences without importing reader modules.
Keyboard `O` / Ctrl(Cmd)+O, drag-and-drop, welcome Open PDF and command palette
Open PDF remain unchanged. For touch-only users after opening a document,
**History → Local library → Open PDF** provides the non-header file chooser.
Do not put duplicate Open buttons back in the header or hide `?` at the mobile
breakpoint. A source-only test under a browser sandbox cannot validate real
new-tab URL navigation; the hyperlink target/attributes are checked alongside
isolated Chromium rendering. Run `tests/help_tutorial_regression.py` and
`tests/ui_responsive_regression.py` in addition to the P0 gate.
No changes were made to P0 truth semantics, P1 link storage, detection, PDF.js
or Texify processing.


## v363 UI detail

Header tutorial `?` stays prominent but is exactly 34px tall like the adjacent theme/language controls across desktop and mobile. Local library's visible `Export` / `导出` label is deliberately concise; the full reading-data export description stays in the tooltip and accessible name. No feature semantics or PDF runtime changes.

## v364 UI detail (historical)

Header tutorial `?` used a 20px glyph in the existing 34px button; no changes to behavior or PDF detection.

## v365 header refinement

Header tutorial `?` uses a 15px glyph in the unchanged 34px button.

## v366 sidebar defaults

Desktop shell and new document default to both sidebars visible. Contents sections expand by default except Annotations; all right-side sections continue collapsed. Per-document sidebar visibility and per-section collapse state persist when enabled. Newly created highlights and margin notes reveal the left Contents Annotations section without tab switch or document navigation; the existing right margin-note reveal is retained. See `REGRESSION.md` and `tests/sidebar_defaults_regression.js`.
