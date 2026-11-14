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

**Not yet implemented:** general 3D plotting, interactive parameter sliders, general implicit/symbolic geometry, PDE solvers, full MathReader-style movable/dockable *main* Objects/Tools panels, complete Chinese translation, arbitrary TeX packages, and universal TikZ support. The earlier Drawing preset selector and toolkit visibility checkboxes are intentionally hidden; tools remain reachable through the collapsible palette, with all four tool sections available.

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
