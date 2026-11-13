# MathIllustrator Cut 17 · v0.18.0 — export fidelity and mixed-scene repaint audit

**Date:** 2026-11-12 (owner-local cut chronology). **Baseline:** exact Cut16 cumulative package; **scope:** transparent shapes, semantic node/morphism parity between SVG and TikZ, and conservative offscreen SVG geometry performance. No claim of exhaustive full-product certification.

## Red and green evidence

- Before fixes, running the newly authored `tests/browser_cut17.py` against an unmodified Cut16 extraction failed at **Transparent node rendered despite full invisibility**. The Cut16 scene emitted fully transparent SVG labels, sampleable function plots and morphism geometry; its TikZ path allowed visible arrows with transparent defining nodes.
- Cut17 skips alpha-zero rendering and sampling, refuses TikZ for visible morphisms with invisible endpoints, and omits alpha-zero objects in TikZ. The focused Chromium test passes for these cases, plus a transparent morphism whose nodes remain visible.
- Offscreen bounded primitives now use a conservative screen-space rectangle/circle preflight. A segment crossing the entire viewport (both endpoints outside) still renders. Near-edge strokes, Bézier control hulls and invalid geometry are covered by a new 5-case Node unit suite and actual SVG checks. This never mutates document JSON or math dependencies.
- The inherited Cut04 opacity test initially failed because it insisted that an invisible text label must **remain** as a DOM node with alpha 0. The representation contract is intentionally stronger: the label is omitted entirely; the test was updated to verify visual absence, zero hit-targets and identical SVG/TikZ visibility. This is not a silent regression exclusion.

## Performance (measured, not projected)

- Environment: headless Chromium 1440×900, 12 repaint observations per version after 3 warmups. Fixed scene has 3,840 objects (1,100 offscreen segments and 180 visible segments with 2,560 anchors), labels/grid/axes disabled.
- Cut16 median SVG rebuild **20.45 ms**, observed range **17.90–37.90 ms**, with 2,920 `data-id` SVG nodes.
- Cut17 median SVG rebuild **6.30 ms**, observed range **4.90–13.60 ms**, with 720 `data-id` SVG nodes.
- All raw observations are in `cut17-performance.json`. The improvement is workload-specific; it excludes file import, canvas bitmap encoding, layout and real-world device behavior. Do not present it as an end-to-end FPS certification.

## Verification and known limits

- Node baseline 100; Cut17 expanded to 105 (5 new screen-bbox cases), all pass.
- Browser: `tests/browser_cut17.py` and the retained suites, with the explicit Cut04 test semantics update. Local headless Chromium `page.set_content`, not remote browser deployment.
- Publication: actual supported TikZ and tikz-cd samples are compiled with `pdflatex` (subject to installed TeX packages).
- Inherited app and website integration remains independent of MathReader. The cumulative overlay includes current root `index.html` and `tools.html`; no `mathreader/` files are overwritten.

**Outstanding:** large on-screen label scenes, pixel-golden export across Firefox/Safari, true cross-tab crash atomicity, real device touch, 3D/flows, semantically complete TeX, and generic 60 FPS.
