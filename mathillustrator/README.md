# MathIllustrator — mathematical figure editor

MathIllustrator is a local-first, static-browser editor at `/mathillustrator/`. It is independent of MathReader. The user-facing [quick guide](tutorial.html) is concise and bilingual; the detailed development, quality and architecture references start at [docs/INDEX.md](docs/INDEX.md).

## Current capabilities

- Semantic 2D geometry: point/dependency constructions, circles, ellipses, polygons, Bézier/freehand paths, function `y=f(x)` graphs, move/pan tools and undo/redo.
- Diagram nodes and morphisms: borderless nodes by default, curved/routed arrows, line-end/dash styles, label placement controls and restricted `tikz-cd` interchange.
- **Real locally typeset LaTeX mathematics** in new diagram nodes and arrow labels, plus optional point labels and other text objects. MathJax glyphs become SVG paths, not plain-text TeX. Existing JSON labels with no `textMode` retain their original plain-text appearance.
- English/Chinese interface with a reusable translation module (**partial coverage**: some runtime warnings, prompts and accessibility copy remain English). Ordinary text objects have editable font family/size; MathJax mathematical fonts remain fixed.
- Settings, collapsible/reorderable right-panel tool sections and four independently rearrangeable Geometry categories, resizable desktop sidebars, a resizable docked or freely movable floating Properties inspector, Recently Deleted, automatic Point → Move, and locally stored interface preferences.
- Editable native JSON projects, SVG, PNG, WebP and conditional JPEG/TikZ/semantic `tikz-cd` exports. Representations that cannot preserve the current scene are explicitly refused/disabled rather than silently simplified.

Enter `A=(0,0)`, `B=(4,2)`, `Segment(A,B)` in the construction box, or use the diagram tools to create a node with label `\\frac{A_1}{B_2}`. Consult the concise [user guide](tutorial.html) for usage and the [live feature catalog](docs/planning/features.json) for current limits.

**Not yet implemented:** GPU/WebGL 3D acceleration, exact hidden-surface elimination, interactive parameter sliders, general implicit/symbolic geometry, PDE solvers, full MathReader-style movable/dockable *main* Objects/Tools panels, complete Chinese translation, arbitrary TeX packages, and universal TikZ support. The earlier Drawing preset selector and toolkit visibility checkboxes are intentionally hidden; tools remain reachable through the collapsible palette, with all four tool sections available.

## Install a changed-files-only overlay

Extract the supplied ZIP **at the website repository root**. It must preserve `mathillustrator/...` paths. Overlays do not replace unrelated MathReader files or root-site navigation. The latest overlay requires the existing verified Cut 25 site plus earlier maintenance/UI overlay(s); do not apply an older ZIP afterward. In particular, Cuts 07 and 11 are already represented in the verified cumulative site and must not be reinstalled.

## Organized project structure

| Directory | Purpose |
| --- | --- |
| `src/` | Active model, geometry, diagrams, mathematical labels, localization, browser controller |
| `vendor/` | Offline MathJax SVG bundle and its retained upstream license |
| `docs/manifest.json`, `docs/planning/`, `docs/schemas/` | Living contracts and feature catalog |
| `docs/quality/` | Current test report, known issues, regression/performance references, SHA-256 inventory |
| `docs/history/` | Immutable verified archive of 173 old release/test artifacts and six documentation snapshots |
| `tests/` | Current domain/browser tests and archive reconstruction/cleanup runner |
| `examples/`, `tutorial.html`, `index.html`, `style.css` | Example projects and concise user experience |

Update living documents in place rather than creating a new Cut-numbered file after every delivery. The old extended user guide is preserved as **historical reference**, not current truth, at `docs/reference/tutorial-extended.html`.

## Checks and safe history cleanup

From the website root:

```powershell
python mathillustrator/tests/manage_history.py verify
python mathillustrator/tests/manage_history.py test
python mathillustrator/tests/manage_history.py test --browser
python mathillustrator/tests/manage_history.py self-test
python mathillustrator/tests/manage_history.py prune
python mathillustrator/tests/manage_history.py prune --apply
python mathillustrator/tests/manage_history.py restore --apply
```

`verify` checks current active bytes and the historical archive. `test` copies the project to a temporary site, reconstructs archived tests and runs syntax/Node/schema/integration/actual TeX compilation; `--browser` additionally exercises isolated Chromium scripts. The old drawing-preset tests, and the pre-auto-Move touch test, are deliberately excluded with explicit messages (their archived bytes are preserved). A current touch regression replaces the old behavioral assumption. This is **not** testing the publicly deployed GitHub Pages origin or Firefox/Safari/physical devices.

`prune` previews removal of archived historical files; `prune --apply` removes only hashes that exactly match archived originals; `restore --apply` can recreate the originals without overwriting existing files. ZIP extraction alone cannot remove old tracked files, and publishing deletions requires committing them to Git.

See [the current verification report](docs/quality/TEST_REPORT_CURRENT.md) for exact PASS/NOT RUN provenance and [known issues](docs/quality/KNOWN_ISSUES.md) for unsupported or degraded cases. Never convert an unsupported output silently or replace the user’s existing project without a recoverable action.

### Product requirements (single living register)

See [`docs/planning/USER_REQUIREMENTS.md`](docs/planning/USER_REQUIREMENTS.md) for the full, maintained user requirement inventory, delivery status and future acceptance gates.


### Round 38: bounded 2D plotting (five modes)

In Construction input, choose Function (`sin(x)`), Parametric (x=`cos(t)`, y=`sin(t)`, one selected t/u/v parameter and range), Implicit (`x^2+y^2=1`), Vector field (X=`-y`, Y=`x`, adjustable arrow density and normalization), or Domain coloring (`z^2+1`, complex i and color schemes). These are locally evaluated, bounded numerical paths, vector arrows, and embedded-PNG colorings. New fields capture the visible canvas rectangle, with a deliberate Redraw button for editing x/y bounds. All expression modes support pi/e, safe implicit multiplication and strict parsing. Complex singular/isolated zero contour topology is not certified. For accurate editing, retain JSON; SVG/raster export fails closed on plot-limit warnings. The pre-existing command language is still accepted in Function mode. Technical constraints and verification appear in `docs/planning/USER_REQUIREMENTS.md` and `docs/quality/TEST_REPORT_CURRENT.md`.


### Round 39: plotting-only 3D foundation and 2D corrections

Use **Interface → 3D plotting mode** to switch between independently retained 2D objects and a separate 3D plot scene. In 3D, no geometry or diagram construction is available; the command selector offers function surfaces, parametric surfaces, implicit surfaces, and vector fields. The scene has explicit finite bounds, camera orbit/zoom, perspective/orthographic projection, reference cube, basic illumination, transparency and detail settings. 3D output is a bounded local **CPU-generated SVG projection**, not WebGL or a general 3D modeller. Very large scenes are deliberately refused when they exceed the face budget; validation and export must not claim incomplete results as valid.

Domain coloring now supports 32–1024 horizontal pixels (default 768), with per-object budget validation; large values may take noticeable time. Plotting budgets include 20k/40k/80k/250k/500k/1M. Exported editable JSON uses a local date-time suffix. Existing 2D documents and older shared `u=v` parametric expressions are preserved, and other tool icons remain unchanged except the explicitly requested Ray, Line and Line–circle intersections glyphs.

### Round 40: complex 3D domain coloring and 2D background layering

The 3D plotting selector includes **Domain coloring**. Input a complex function of `z`; selected-object Properties controls height (`|F(z)|` or `arg F(z)`), the color scheme, and finite x/y/z bounds through the existing redraw workflow. The CPU mesh uses 3D detail, face caps, and conservative branch-cut gaps. 2D domain-color rasters now render behind grid/axes and foreground objects, including exported SVG/raster guides. Preserve JSON for editable projects. See the bilingual tutorial and the quality report for boundaries and test provenance.

### Round 41: robust CPU 3D preview and mesh limits

Closed implicit surfaces use consistently connected marching-tetrahedron triangles; finite region intersections are triangle-clipped instead of dropping entire cells. Camera-normalized shading and mixed vector/face depth ordering improve SVG appearance without claiming a depth buffer. 3D preview is cancellable in short slices and paints in bounded DOM batches; changing the view or switching to 2D discards obsolete partial work. Each 3D scene is subject to 60,000 total function evaluations, 12,000 projected faces and 2,400 vector strokes. Incomplete scenes are marked and cannot be exported as SVG/raster, although JSON remains available. Leftward mouse orbit now rotates the graphic left. There is **no WebGL or GPU implementation**; complex transparency and sub-grid implicit components still have known limits. See the bilingual tutorial and Round 41 test report.


### Round 42: reliable mixed plots and 3D-specific preferences

A 3D scene can contain many saved objects, but at most **three are visible** at once; showing a fourth hides an earlier visible plot without deleting it. A shared camera region now spans the visible surfaces instead of interpreting all meshes through the first plot's bounds. The renderer distributes work fairly, adaptively reduces detail when an implicit mesh is unusually complex, and supports up to **96 mesh detail** for 3D domain-color bands. The scene budgets are **230,000 evaluations / 66,000 faces / 4,800 vectors**, with a **128 MiB estimated mesh-cache** ceiling. Incomplete or legacy unnormalized views cannot be misrepresented as full image exports. Densely overlapped transparent surfaces remain approximations because the CPU SVG renderer has no Z-buffer.

In 3D, 2D-only settings are hidden; dedicated camera, appearance, theme and raster-export controls remain. The 3D Properties object opacity field aligns with neighboring fields; duplicated canvas instructions were moved out of the interface. Default detail and the existing JSON format are preserved, and undo, JSON files and 2D drawings remain compatible. Browser-provided persistent storage quotas are unchanged; **Save JSON** is still the durable fallback for large projects. No icons or root-site files were altered.


### Round 46: compact color controls

3D surfaces and 2D/3D vector fields can use a red → purple → blue scale. World z determines surface color; vector magnitude determines arrow color even when normalized lengths are displayed. Single-color pickers and centered 10-color swatches remain available when the range is disabled. The 3D Properties pane uses a symmetric two-column color/opacity layout, and parametric bounds use a 2×2 grid. The fourth 3D Interface checkbox, Fast 3D orbit, toggles responsive low-detail preview independently of saved project content. Historic JSON defaults remain visually unchanged; 3D domain phase colors remain the default. SVG/raster and JSON use the same generated appearance, subject to CPU/SVG mesh detail and painter ordering limits.
