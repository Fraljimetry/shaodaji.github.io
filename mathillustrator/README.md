# MathIllustrator — semantic mathematical figure editor

**Current baseline: v0.26.1, Cut 25 maintenance revision.** This is the independent, static-browser MathIllustrator application at `/mathillustrator/`, separate from MathReader. The mathematics and drawing behavior of Cut 25 is unchanged in this maintenance revision; old release documentation and cut-specific tests have been collected into a verified, recoverable history archive.

## What it does today

A three-pane 2D editor with points, dependent objects, construction commands, circles, ellipses, Bézier curves, lines, polygons, freehand strokes, explicit-function plots, node/morphism diagrams, configurable drawing settings and presets. Editable JSON is the authoritative lossless project format. SVG and PNG/JPEG/WebP are rendered outputs; restricted TikZ and semantic `tikz-cd` are available only when representable. Diagram routing includes direct, node-aware, earlier-arrow-aware and opt-in bounded scene-aware crossing reduction. The last mode does not guarantee globally optimal routing.

Try `A=(0,0)`, `B=(4,2)`, `Segment(A,B)` and `Midpoint(A,B)` in the command box. Use the Move tool to change A and inspect the dependent result. Try the examples under `examples/`; the full user guide is [tutorial.html](tutorial.html).

**Not supported as full solutions:** general symbolic constraints, arbitrary implicit equations, all intersections/tangencies, full TeX math-label layout, genuine 3D, numerical PDE/Ricci-flow solvers, full animation, arbitrary TikZ import or guaranteed high-performance rendering of complex scenes. See [features.json](docs/planning/features.json) and [KNOWN_ISSUES.md](docs/quality/KNOWN_ISSUES.md) for exact distinctions.

## Installation / avoiding missed overlays

Apply the supplied MathIllustrator overlay ZIP **at the website repository root**, not inside `mathillustrator/`. All paths in the ZIP are website-root relative. Your supplied Cut 25 website already contains the full current runtime, including all Cut 07 and Cut 11 modules; this **maintenance-only overlay does not re-ship runtime source** and assumes that verified Cut 25 baseline. Do not install skipped intermediate overlays. Never layer an older overlay on top of a newer one.

The existing website's root `index.html` and `tools.html` links to MathIllustrator must remain intact. No root files are changed in this maintenance patch, and no MathReader files are changed. Open `/mathillustrator/` and `/mathillustrator/tutorial.html` after deployment. The actual hosted pages, browser engine compatibility and shared-origin multi-tab storage must still be tested separately.

## Stable directory layout (instead of one new file per cut)

| Location | Purpose | Growth rule |
| --- | --- | --- |
| `src/` | Current ES modules; `app.mjs` controls the UI | Change the existing module or introduce a module only for a clear boundary |
| `docs/manifest.json`, `docs/planning/`, `docs/schemas/` | Current architecture/feature/schema contracts | Update in place |
| `docs/quality/` | Current issue catalog, regression policy, performance ledger, release report and package inventory | Update existing living documents; no `cutNN-*` file proliferation |
| `docs/history/release-history.zip`, `contents.json` | Exact archived cut reports, per-cut tests and former handover snapshots | Retain immutable history; fold old cut evidence into archive on future release |
| `tests/` | Stable tests + maintenance/regression entry point | Add checks to stable domain suites; temporary extraction runs archived regressions |
| `examples/`, `tutorial.html`, `index.html`, `style.css` | Sample projects and user interface | Keep consistent with verified behavior |

The historical ZIP contains **173 byte-preserved reports/test artifacts**, plus 6 snapshots of older central documents. Its SHA-256 inventory is in `docs/history/contents.json`; the archive is not part of runtime loading. Existing historical files may remain on disk after extracting an overlay; ZIP extraction **cannot delete files**. Removing them is a separate, safe, reversible action. **For a GitHub Pages deployment, commit and push the resulting Git deletions as well as the overlay additions; extracting the ZIP alone does not remove existing tracked files from the published repository.**

## Verify, clean and restore

From the **website repository root**:

```powershell
python mathillustrator/tests/manage_history.py verify
python mathillustrator/tests/manage_history.py self-test
python mathillustrator/tests/manage_history.py test
python mathillustrator/tests/manage_history.py test --browser
python mathillustrator/tests/manage_history.py prune
python mathillustrator/tests/manage_history.py prune --apply
python mathillustrator/tests/manage_history.py restore --apply
```

- `self-test` verifies prune/restore and altered-file rejection in a disposable copy. `verify` checks the active package's SHA-256 hashes, the history ZIP, and any legacy originals. It refuses unexplained or changed files rather than deleting them.
- `test` reconstructs archived tests in an isolated temporary copy and runs **all 144 Node tests, site integration, actual TeX compilation and ES-module syntax**; `--browser` also runs the 45 isolated Chromium scripts. Requires Node.js, Python, Playwright + Chromium for the browser option, and `pdflatex` for TeX compilation. Set `MATHILLUSTRATOR_CHROMIUM` if the browser executable is not auto-located.
- `prune` is a read-only preview. `prune --apply` removes **only byte-identical historical test/report files already secured in the archive**. It does not touch `src/`, active contracts, MathReader or the website root. `restore --apply` restores only missing archived originals and never overwrites changed files.

**After consolidation**, the staged historical runner was also rerun after deleting the standalone legacy copies: 144/144 Node tests, 45/45 isolated Chromium scripts, 4/4 schema examples, 2 TeX compilations, integration checks and the reversible-cleanup self-test passed.

**Verification provenance, not marketing:** The supplied original Cut25 tree passed 144/144 Node tests, 45/45 isolated Chromium scripts (one retried after restoring a missing audit fixture), four JSON examples, two pdfLaTeX compilations, static site checks and 220/220 cumulative SHA checks. The stable current report is [TEST_REPORT_CURRENT.md](docs/quality/TEST_REPORT_CURRENT.md). No live hosted-site, Safari/Firefox or physical-touch certification is implied.

For developers, start at [docs/INDEX.md](docs/INDEX.md). Every change must include subtly affected states, failure/rollback behavior, data compatibility, performance implications, source evidence and the overlay ZIP. Never silently fall back from an unsupported output.
