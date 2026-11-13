# MathIllustrator Cut 19 — v0.20.0: mathematical labels and large-scene UI

**Date:** 2026-11-12. **Baseline:** exact Cut18 root-relative cumulative ZIP. **Scope:** correct text preservation, multiline property editing, text/diagram performance, no MathReader source edits. Native project **format version remains 1**.

## Baseline failures, corrections, and independent evidence

1. **Silent label-content loss during node auto-wrap (confirmed).** Cut18 `layoutNodeLabel()` removed whitespace with `trimEnd()` / `trimStart()` and skipped leading spaces. The new `cut19.test.mjs` failed against that source. Cutting a node label across visual lines now retains every space. Programmatic source/JSON was always intact; the bug affected the visible mathematical expression and any SVG export.
2. **Single-line Properties despite multiline v1 text (confirmed UX defect).** Text, node, and morphism labels can now be edited with a real multiline textarea. Enter inserts a newline; clicking outside applies the edit, allowing the existing undo and autosave pipeline to record it. A short contextual hint explains the rule. Global Delete/Undo/Escape shortcuts already ignore focused text inputs and continue to ignore the textarea.
3. **Explicit newline drawn as one SVG text line (confirmed).** Ordinary text and morphism arrow labels now use positioned SVG `tspan`s for intentional line breaks. The exact source text is retained in JSON. Node labels still use their separate wrapping engine. The restricted TikZ export remains **disabled** where multiline or spacing cannot be represented safely; no silent fallback.
4. **Offscreen text/node DOM cost (measured).** Previously text and node objects were rendered even when entirely outside the viewport. Conservative screen-space bounding tests now skip their SVG subtrees. Their model objects, references, saved JSON, undo history, left-list selection/search and future pan/zoom behavior remain intact. The renderer intentionally uses generous width/vertical safety margins; this is not font-exact measurement.
5. **Dependent cross-viewport arrow (second-order regression guard).** New browser tests verify that a morphism crossing the visible region is rendered even if its endpoint node rectangles are culled. Arrow semantic incidences remain independent of view-only node paint decisions.
6. **Historical test selectors (test-only adaptation).** The Cut07 properties, Cut03 export and actual LaTeX compile suites formerly assumed label fields were single-line inputs. Their selectors now target the correct textarea, preserving assertions. The first combined property sweep stalled on the stale selector; after correction it passed. This was a test harness issue, not an application hang.

## Measured performance, with provenance

Controlled isolated Chromium 1350×850, 2,520 label objects: 2,400 offscreen, 120 on-screen. Same synthetic document and benchmark script on both exact Cut18 and Cut19 sources. Four warmups followed by 12 measured full SVG rebuilds per version:

| Version | Median | Range | Object-related SVG elements |
|---|---:|---:|---:|
| Cut18 | 43.80 ms | 41.1–74.2 ms | 2,520 |
| Cut19 | 8.75 ms | 7.4–24.5 ms | 120 |

Median redraw latency improved **80.0% in this specific mostly-offscreen text scene**. This does not imply the same improvement for mostly visible objects, semantic layout, JSON import, browser frame scheduling, or an arbitrary user's hardware. See `cut19-performance.json` for every raw sample.

## Regression and release evidence

- Node: **110/110** (`node --test tests/*.test.mjs`), including two new red/green Node tests.
- Chromium: **30/30** isolated editor scripts, run as individual processes; provenance and detailed per-script result file must be retained. New Cut19 suite exercises multiline text/morphism labels, SVG and JSON bytes, exact wrapped spaces, culling, viewport-crossing morphisms and offscreen list search.
- LaTeX: **2/2** representative real `pdflatex` compilation checks after updating textarea selectors.
- Site integration and JSON/schema/package integrity: verify separately on the final extracted ZIP. Do not mistake static/isolated-browser checks for a live deployment.

## Known unsolved issues and next audit

True collision-free text layout, arrows routed around other diagram nodes, font embedding, mixed-language math typography, broad on-screen object spatial indexing, and very dense live scene responsiveness remain incomplete. Browser font engines can exceed heuristic width estimates; no proof of exact typographic extents or viewport-perfect text culling is claimed. Firefox, Safari, real mobile hardware, Web Locks across actual tabs, and production hosting remain unverified.

## Installation

Deliver one **cumulative site-root ZIP overlay** with root `index.html` and `tools.html`, all `mathillustrator/` application sources, tests and structured documentation, but no `mathreader/` application files. Extract at site repository root. Review root pages if independently changed.

## Clean-extracted release acceptance

The exact cumulative ZIP was extracted into a fresh test directory. **110/110 Node**, **30/30 separate Chromium editor scripts**, **2/2 actual `pdflatex` compilations**, **4/4 example JSON Schema fixtures**, and **8/8 bilingual desktop/mobile homepage cases** passed. Static homepage launch/tutorial routes were also verified using the original site assets supplied with the user's initial archive. The 30-script timing and output details are retained in `cut19-browser-results.json`. Real production HTTP, Firefox/Safari, physical touch/IME, screen-reader operation and simultaneous-tab atomicity were **not** exercised. The only interrupted inherited property run used obsolete one-line input selectors; with the updated textarea selectors it passed in both working and clean-extracted sweeps.

The final release archive inventory and SHA-256 checksum results are verified by `tests/package_integrity.py` against `cut19-package.json`; do not confuse archive validation with deployment certification.
