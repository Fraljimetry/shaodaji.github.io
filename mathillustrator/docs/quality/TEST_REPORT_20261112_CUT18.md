# MathIllustrator Cut 18 · v0.19.0 — export alpha and typography fidelity

**Date:** 2026-11-12 (owner-local cut numbering). **Source baseline:** exact Cut17 cumulative ZIP. **Scope:** transparency and label fidelity, project setting validation, regression and delivery integrity. No MathReader edits.

## Confirmed before/after findings

1. **No alpha export**: Cut17 always emitted an opaque SVG background rectangle and filled Canvas before PNG/WebP encoding. New Cut18 Chromium browser test failed on Cut17 at missing `#export-transparent`. Cut18 adds an explicit OFF-by-default export setting, skips only the export background rectangle, and lets Canvas preserve alpha for PNG/WebP. Editor appearance is unchanged. Downloaded PNG and WebP were decoded and verified with zero alpha at an empty pixel; old v1 documents remain opaque.
2. **JPEG cannot carry transparency**: Cut18 disables JPEG when exportTransparent is true; there is no silent opaque fallback, and the disabled control has an explanatory tooltip. The asynchronous JPEG path also rejects invocation while transparency is requested.
3. **SVG whitespace loss**: SVG text had no `xml:space` preservation. Exported labels now carry `xml:space="preserve"`; actual downloaded SVG is checked for repeated spaces.
4. **TikZ whitespace semantic drift**: TeX normally collapses repeated and leading/trailing spaces. The restricted TikZ option now disables itself for visible labels with that spacing. Existing ordinary labels continue to use the supported restricted exporter. This avoids pretending to represent text faithfully where it cannot.
5. **Alpha label halo**: An opaque background stroke behind semantic arrow labels is omitted only for transparent exports.

## Validation protocol and honest limits

- Node `.test.mjs` baseline Cut17=105; Cut18 adds three cases for opaque defaults, optional-field migration, and rejecting nonboolean settings (108 total).
- Chromium `tests/browser_cut18.py`: actual downloaded SVG, PNG, WebP alpha pixels where encoder supported; JPEG disabled; undo/redo; old-project import; whitespace and TikZ disabling. All assertions are against the browser or downloaded bytes.
- Retained isolated Chromium suites and existing LaTeX compilation must pass from the final extracted ZIP. Report intermittent harness failures separately; do not present partial test batches as a full pass.
- Browser-local `page.set_content` verification **does not certify** GitHub Pages deployment, Firefox/Safari font handling, physical touch, multi-tab atomicity, or end-to-end rendering speed. No new benchmark was taken for Cut18.

## Installation

Cumulative site-root ZIP includes `index.html`, `tools.html` and the complete `mathillustrator/` files. Review root pages for newer external edits; no MathReader sources are included. Project JSON remains version 1.

## Completed acceptance (from working tree and clean ZIP)

- **Node:** 108/108 passed, including three new setting/legacy/rejection tests.
- **Browser:** 27/27 retained historical Chromium editor scripts passed when run in isolated batches, plus Cut17 and Cut18, for 29/29 scripts. An aggregate run timed out while launching tests; all affected scripts subsequently passed independently, including the long Cut07 inventory and Cut14–16.
- **Cut18 actual output:** SVG bytes checked for transparent background and `xml:space`; decoded PNG and browser-supported WebP alpha pixels checked; JPEG option disabled; undo/redo, legacy JSON opaque default, TikZ whitespace disablement and semantic-arrow-label alpha halo verified. The first new halo test timed out because its harness attempted to interact behind its own open modal, not because the application failed; the test now closes the dialog before the next import.
- **Real TeX:** 2/2 representative TikZ and tikz-cd exports compiled with installed `pdflatex`.
- **Website:** 8/8 English/Chinese × desktop/mobile homepage/Tools cases passed against the locally merged original site assets. Static route check passed.
- **Schema:** four version-1 example projects passed Draft 2020-12 JSON Schema; invalid nonboolean `exportTransparent` rejected.
- **Packaging:** final ZIP inventory and SHA-256 checks, current package-integrity entry point, Cut02–17 historical coverage, root `index.html`/`tools.html`, and no MathReader modifications.

Test dependencies include **Playwright**, local Chromium, and **Pillow** for PNG/WebP decoded-pixel assertions. The editor itself does not depend on Pillow. Actual deployment, Firefox/Safari, font file embedding, physical devices and native PDF remain unverified. No cross-device or FPS performance improvement is claimed in Cut18.
