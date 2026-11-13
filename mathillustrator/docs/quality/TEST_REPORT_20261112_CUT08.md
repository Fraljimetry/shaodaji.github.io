# MathIllustrator Cut 08 / v0.9.0 — incremental audit and red/green evidence

Date: 2026-11-12. Baseline: exact `mathillustrator_cut07_overlay.zip` plus separately delivered `mathillustrator_tools_page_overlay.zip` (latest root `tools.html`). This release never edits `mathreader/`.

## Distinct defects / risks addressed

1. **Live geometry corruption after anchor moves** — the Cut07 model accepts a point or diagram-node move which silently collapses a previously nondegenerate segment, circle or morphism; new guard rejects such newly introduced degeneracies across transitive references. Property edit and pointer-up are both guarded. Pure tests check circles/segments/rectangles/morphisms/diamonds; Chromium verifies rollback through form and mouse drag and valid subsequent undo/redo. Existing degenerate v1 imported structures are not retroactively rejected. This is not a full geometric constraint solver.
2. **XML serialization** — Cut07 accepts raw NUL, forbidden controls and lone surrogates in object names/text, which need not form legal SVG 1.0 XML. Cut08 refuses them at native project validation, leaving legitimate Unicode text untouched; schema prevents C0 controls while runtime also detects unpaired surrogates. No invisible character substitution.
3. **Numeric snap overflow** — Cut07 accepts `snapStep=1e-320`, although `5/1e-320` overflows to infinity. Cut08 bounds snap intervals to 1e-6...1000 and rejects nonfinite snapped results explicitly; runtime/schema/HTML/tutorial synchronized. Historical v1 projects using snapStep <1e-6 are now explicitly rejected instead of silently migrated; manual JSON correction of this setting is necessary.
4. **Search complexity** — Cut07 object-list search loops over all objects and, for each referenced object, calls a full-array `get()`. Cut08 constructs an ID→name map once when filtering. 4,000-object benchmark (1,600 points, 2,400 segments): baseline values 33.1/31.5/33.9/25.9/15.2/16.6 ms; updated 7.3/7.8/8.2/6.5/5.6/5.0 ms. Median 28.7→6.9 ms, **only** synchronous filter latency in one isolated Chromium environment, not a full-frame guarantee.
5. **Release integration** — cumulative overlay includes root `index.html` and **latest** separately updated `tools.html` with distinct links and design principles for MathReader and MathIllustrator. Existing historical reports and MathReader application files preserved.

## Final verification provenance

- Node: `node --test mathillustrator/tests/*.test.mjs`; current 61 model cases including six new red/green cases.
- Chromium: `tests/browser_cut08.py` for property/pointer rollback, XML/snap refusal, large linked-object search; retained `browser_smoke.py`, `browser_cut06.py`, `browser_cut07_properties.py` and `browser_cut07_adversarial.py`.
- Schema: all four shipped example JSON projects validated using Python jsonschema and model `validateDoc`; the Cut08 numeric schema bound cross-checked.
- Package: extracted cumulative overlay, path inventory/SHA256 and site integration; historical cut path coverage.
- Unknown: actual hosted site, Firefox/Safari, physical touchscreen, authentic multi-tab storage atomicity, SVG font fidelity, mathematical plot pole certification and 60 FPS in dense scenes. No claims of complete 3D, Ricci flow, Möbius, physical print PDF or native TeX source editor.

## Final extracted-ZIP checks

- **61/61** Node model tests PASS, run from the extracted release archive.
- **17 isolated Chromium editor/browser scripts** PASS: Cut02–07 retained regressions (including separate storage, stale handler, opacity, pointer, virtual-list and inventory checks), base smoke/edges/storage, and new `browser_cut08.py`. The original grouped invocation hit a wall-clock limit while entering `browser_edges.py`; a standalone run passed, and all remaining scripts were executed independently.
- **8/8 homepage UI cases** PASS for desktop/mobile × English/Chinese on `index.html` and `tools.html`, with source CSS and original language JS included as fixtures. Light/dark toggles also checked. This remains an isolated HTML browser check, not live HTTP.
- **4/4 example project JSON schema validations** PASS. Explicit invalid snap interval 1e-320 rejected by schema.
- **2/2 actual pdflatex compilations** PASS (browser-exported TikZ and semantic tikz-cd). No font-fidelity guarantee across TeX engines.
- **85/85 cumulative archive file-path checks** PASS, 83 SHA256-verified payloads (two self-referencing manifests excluded), prior Cuts 00–07 covered. Root `tools.html` is the newer standalone update, not the older Cut07 snapshot.
- **Performance renderer-only** point scenes at 100/1,000/3,000 objects measured 3.4/15.9/38.5 ms in one isolated run; 3,000 points remain above 16.7ms. Do not infer a full-frame distribution.
- **Static website integration** PASS with original site stylesheet/JS/SVG fixtures; MathReader application remains untouched.

## Important remaining limitations

Full generalized geometric constraint solving, 3D/flow models, Möbius transformations, mathematical TeX typesetting on canvas, PDF/Asymptote/animation export, live deployed GitHub Pages navigation, Firefox/Safari/touch hardware and real two-tab locking semantics are **UNVERIFIED or NOT IMPLEMENTED**, not release acceptance passes.
