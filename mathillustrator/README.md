# MathIllustrator · first editor baseline (v0.1.0)

Independent, browser-based illustration editor deployed to a static site at `/mathillustrator/`. No MathReader files were modified. The editor uses ES modules, standard SVG, browser APIs, and no mandatory external runtime dependencies.

## Open

Overlay this package onto your site's repository root so that `mathillustrator/index.html` exists. For deployment, use GitHub Pages or a local HTTP server. Example from the site's root: `python -m http.server 8000`, then open `http://127.0.0.1:8000/mathillustrator/`. ES modules require HTTP(S); direct `file://` use may be restricted by browsers. **The ZIP is not a replacement for the entire website.**

## First drawing

Type `A=(0,0)`, `B=(4,2)`, then `Segment(A,B)` in the left command entry, pressing Enter after each. Select Move, drag A, and observe the segment update. Try the Circle, Polygon, Free curve and Text tools on the right. Use Save to download editable JSON. Load `examples/geometry-demo.json` or `examples/analysis-demo.json` with Open.

## Documentation and tests

- User tutorial: `tutorial.html` (exact capabilities, usage and limitations).
- Documentation index: `docs/INDEX.md`; architecture, decisions, schemas, JSON feature status, regression and performance reports are organized below it.
- Model tests: `node --test tests/model.test.mjs` (requires a recent Node.js version). Node module syntax check: `node --check src/model.mjs` and `node --check src/app.mjs`.
- Browser QA and actual image export require a user-accessible browser and remain open validation items in the first cut.

## First-cut limitations

Real 3D, topology diagram semantics, Möbius transformations, Ricci flow models, shape recognition, advanced geometry constraints, animation, PDF/Asymptote/tikz-cd, and semantic TikZ import/export are not yet implemented. TikZ output is coordinate-based only for simple scenes and is disabled for function objects. Unsupported export controls are disabled. See tutorial and known issues before relying on outputs in a paper.

## Overlay rule

Every subsequent development cut is a root overlay ZIP containing only added/changed `mathillustrator/` files, with original paths preserved. The user-facing tutorial and documentation/JSON records must be updated along with code changes.
