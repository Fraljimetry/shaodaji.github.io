# MathIllustrator Cut 22 — v0.23.0: interactive arrow-label dragging

**Baseline:** exact cumulative Cut21 archive, 184 files, 123/123 Node baseline tests, standalone Cut21 isolated-Chromium routing regression PASS. **Native JSON remains schema version 1**; site root `index.html` and `tools.html` are retained without MathReader edits.

## New functional behavior

In **Move** mode, select a visible unlocked morphism with a nonempty label. Its temporary purple-outlined label handle appears above the path-selection hit stroke. Drag to reposition the label in pixels; a preview updates only `labelDx`/`labelDy`. Release commits exactly one undo snapshot when changed; Escape/blur/pointercancel restores the previous JSON scene. A click or sub-2px jitter leaves fractional offsets byte-for-byte unchanged. The original semantic source/target references, path geometry, label text and curve remain unchanged. The offset is bounded ±300 CSS px, consistent with the existing v1 model schema. Numeric Properties controls remain the keyboard/editing alternative.

**Red/green evidence:** First live Chromium attempt found the handle present but not clickable: `elementFromPoint` returned a transparent `path` instead of the circle, so shifts remained 0. Moving the editor-only handle above transparent path hit targets fixed the pointer event without sacrificing shaft selection. A second check identified that the model's `2.25` fractional legacy offset could have been rounded to `2.3` on a zero-motion click. The <2px no-change guard prevents this silent mutation. Tests in `tests/browser_cut22.py` and `tests/cut22.test.mjs` cover both failures and state rollback.

## Inherited stability and scope

`cut22-browser-results.json` contains per-script exit status, elapsed time and output for the full retained isolated-Chromium matrix. All 33 scripts passed in bounded batches. The complete Node suite passed 125/125. Representative actual LaTeX compilation, legacy example validation, static website integration and cumulative package integrity are separately verified at release gate and recorded below. A PASS from `page.set_content` proves only an isolated Chromium document, not an HTTP deployment or a cross-browser certification.

## Risks not silently solved

- No automatic arrow-label packing or arrow-to-arrow crossing minimization. A large manual shift may intersect neighboring objects or extend outside a fixed crop; preview the SVG before publication.
- Screen-space positions may change visually with font metrics or zoom, despite retaining JSON offsets. TikZ remains disabled when it cannot reproduce shifted visual positions; semantic `tikz-cd` never promises pixel fidelity.
- No full keyboard or screen-reader direct-drag alternative; use numeric Properties. Physical touchscreen/palm rejection, Firefox/Safari and deployed-site behavior require real-device/browser tests.
- Scene redraw still replaces the SVG during pointer movement. Dense on-screen scenes may stutter; no frame-rate or drag-latency speedup is claimed without new controlled benchmarking.
- History is memory-bounded, autosave is browser-local, and genuine simultaneous-tab atomicity is still not certified.

## Final evidence — extracted cumulative ZIP

- **Node:** 125/125 tests passed from a clean extraction (123 inherited + 2 new).
- **Chromium:** 33/33 isolated editor scripts passed from the extracted archive, each run in its own process with per-script results in `cut22-browser-results.json`. The same 33 cases also passed in the development tree.
- **LaTeX:** Actual `pdflatex` compiled both a browser-exported supported TikZ illustration and a semantic `tikz-cd` diagram (2/2).
- **Site:** Static root links passed and eight English/Chinese, desktop/mobile Chromium layout cases passed using the original website CSS and localization script. No deployed HTTP navigation was tested.
- **Examples:** Four historical JSON sample projects accepted by JSON Schema and runtime validation, with model format version 1 retained.
- **Package:** Cumulative ZIP contains **191 root-relative paths**, including `index.html` and `tools.html`, with **189 SHA-256 checks** and complete Cut02–21 historical coverage. No `mathreader/` application files or debugging screenshots are included.

**Test provenance:** These tests ran on a Linux sandbox with isolated headless Chromium and locally inlined ES modules. Pointer simulation is not physical touch/pen hardware. Actual GitHub Pages publication, Firefox/Safari, accessibility hardware and genuine cross-tab origin concurrency remain **unverified**.
