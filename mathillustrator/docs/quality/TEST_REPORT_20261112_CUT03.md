# Cut 03 — v0.4.0 comprehensive incremental audit, fixes and evidence

**Date:** 2026-11-12. **Baseline:** the exact `mathillustrator_cut02_overlay.zip` from the preceding turn; all MathIllustrator bytes matched the existing local work tree before modifications. **Source reference:** user-supplied `shaodaji.github.io.zip`, including MathReader v436 `REGRESSION.md` and `mathreader/docs/README.md`. We adopted its mandatory subtle-defect checklist and structured release evidence, not its code or runtime. **MathReader and shared site assets are untouched.** This is not a claim of complete MathIllustrator functionality.

## Reproduced baseline failures (red) → repairs (green)

| ID | Original invariant violation | Root cause | Repair | Evidence |
| --- | --- | --- | --- | --- |
| MI-EXP-030 | Exported graphics include editor grid and dashed page-frame decoration | Export uses the same background drawing function as the editor, without an export intent | Editor frame never exported; grid+axes excluded by default, explicit right-side checkbox enables them | Original Cut02 lacks the controls (`browser_cut03.py` red); browser SVG output inspection and opt-in case green |
| MI-EXP-031 | Raster image resolution fixed to 2×; impossible to tailor outputs per publication | Hard-coded scale factor and late buffer-size checks | 1–4× user setting, document-backed v1 optional property, max 36 MP/16384 pixels checked before Canvas allocation | `cut03.test.mjs` and Chromium downloaded actual PNG dimensions at 1×/4× |
| MI-PLOT-032 | Simple fixed-step plots can join past sharp changes and falsely depict singularities | Nearest-sample SVG path stitching with only coarse jump detection | Bounded adaptive subdivision, gaps for invalid/steep intervals; separate pure plot helper | Reciprocal pole example produces separated SVG paths in Node and Chromium; no analytic continuity guarantee |
| MI-STOR-033 | Corrupt saved JSON is replaced when user edits a recovered empty editor | Startup catch logged invalid data without pausing later autosave | Quarantine original storage bytes; pause autosave until explicit conflict resolution/overwrite | Original Cut02 corruption test red (no banner); isolated Chromium storage-double test green |
| MI-PTR-034/035 | Canceling pan leaves camera displaced; secondary pointers can replace active gestures | Cancel restored point state only; no primary-pointer or existing-drag guard | Restore original pan offsets on cancel/release, ignore secondary input, preserve prior drag | Chromium pointer and Escape assertions; previous pointer/undo suites still green |
| MI-MODEL-036/037 | New coincident segments/lines/circles can create invisible shapes; imported huge IDs can lose precision | Insertion only checks reference count; ID parser converted arbitrarily long decimal strings | Validate new geometry before mutations, safe-number-ID checks | Node: rejection, no `nextId` or JSON mutation, old malformed import rejected |
| MI-COMPAT-038 | A zero-height ellipse from valid older projects is invisible in SVG | SVG's zero radius renders nothing | Preserve v1 acceptance; render flattened ellipse as a line in SVG and TikZ | Existing extended regression plus code inspection, actual TeX compilation; cross-engine visual comparison remains unverified |
| MI-TEX-039 | Literal caret/tilde in plain text break TeX output | Escaper omitted two standard TeX special characters | Escape `^` and `~` as text commands | Browser export string assertions; actual local `pdflatex` compiled a mixed figure |
| MI-DIAGRAM-040 | Two labels on one imported `tikz-cd` arrow silently discard the first | Import loop overwrote `label` with no duplicate detection | Reject duplicate labels, enforce 1000-character arrow label cap | New Node regression, prior importer/exporter tests still green |

## Adversarial paths considered

- **State/reentrancy:** invalid construction followed by a valid command, then undo; active property changes; drag Escape and lost-pointer state; pending autosave after conflict; corrupt saved project and explicit overwrite path. **Tested** in isolated Chromium and model suites as listed, not all possible races.
- **Numerical/boundary:** zero-length lines/circles/rectangles/angle rays; 3–100 regular polygon sides; unsafe ID magnitude; missing and invalid v1 optional settings; pole at zero, function overflow and exceptions; 1×/4× output size. **Tested** in Node and/browser, not all singularity classes.
- **Semantic compatibility:** older v1 projects still import with `exportGuides=false` and `exportScale=2`; flattened ellipses remain representable; native JSON remains the only full editable scene; arbitrary TeX still unsupported. **Tested** in model and JSON-schema checks.
- **Exports:** SVG image excludes editor page outline at both crop options; image grid opt-in; actual PNG bytes and sizes checked; explicit TikZ/`tikz-cd` output compiled with installed `pdflatex`. **Not** a visual proof for glyph metrics, WebP/JPEG/Safari, independent pdf page sizing or mathematical topology.
- **Performance:** recomputed point-only draw measurements, but no percentiles, no off-main-thread sampler and no guarantee of 60 FPS.
- **Deployment:** `index.html` and `tools.html` bilingual entry paths checked statically, and MathReader link preserved; HTTP navigation remains **UNVERIFIED** under browser administrator policy.

## Exact executed results and provenance

| Category | Command/fixture | Result | Provenance |
| --- | --- | --- | --- |
| Node unit | `node --test tests/*.test.mjs` | **38/38 PASS** (8 Cut03 tests) | Actual ES modules, Node test runner |
| Previous UI suites | `browser_smoke.py`, `browser_edges.py`, `browser_cut02.py` | **3/3 suites PASS** | Isolated Chromium, injected inline ES modules (`page.set_content`) |
| Storage previous + Cut03 | `browser_storage.py`, `browser_cut03_storage.py` | **2/2 suites PASS** | Isolated Chromium with an explicit localStorage double, not genuine simultaneous tabs |
| New UI | `browser_cut03.py` | **PASS** | Isolated Chromium, actual downloads and pointer actions |
| LaTeX compilation | `tikz_compile.py` | **2/2 generated PDF files PASS** | Real TeX Live `pdflatex`; one browser-exported TikZ + one semantic `tikz-cd` |
| Site integration | `site_integration.py <site-root>` | **PASS** | Static bilingual homepage/Tools paths, MathReader navigation intact |
| Example data | JSON Schema 2020-12 + `examples/*.json` | **4/4 PASS** | Python `jsonschema` and runtime schema alignment |
| JavaScript syntax | `node --check src/*.mjs` | **PASS** | Native Node parser |
| Point-only performance | `browser_performance.py`, 100/1000/3000 points | **Measured** 3.9 / 25.2 / 43.4 ms SVG rebuilds | One isolated headless Chromium run, no statistical or hardware guarantee |
| Hosted/public deployment | Direct actual `https://shaodaji.cc/mathillustrator/` verification | **UNVERIFIED** | No publication action performed; local HTTP navigation formerly blocked |
| Firefox/Safari/Windows Edge/iOS hardware | Browser/OS matrix | **UNVERIFIED** | Not available in this run |

The explicit pre-fix test source was copied to an untouched Cut02 extraction. `browser_cut03.py` failed on the absence of export controls; `browser_cut03_storage.py` failed because corrupted storage did not show a quarantine banner. Both paths pass on Cut03. The new plot module did not exist in Cut02. Tests are not evidence that all graph singularities are detected.

## Engineering tradeoffs and remaining high-priority work

1. **Primary next cut:** large-scene viewport culling/partial renderer, actual drag frame latency, indexed snapping and object lists. Even 3k simple points took ~43 ms in one isolated render; no 60 FPS claim.
2. True physical page dimensions/DPI and publication-grade SVG/LaTeX mathematical typography, exact TikZ content round-trip, shape constraints and 3D/complex-analysis modules remain future scope.
3. `localStorage` has no compare-and-swap primitive. The confirmation UI mitigates but does not guarantee atomic cross-tab resolution; quota denial and crashes can still lose unsaved changes. Keep JSON backups.
4. Runtime plots show sampled approximations. Poles in fixtures produce gaps, but arbitrary discontinuities/near-tangent extrema and high-frequency oscillations are not analytically certified.
5. Need actual site deployed and checked in Edge/Chrome/Firefox/Safari, mobile touch and screen-reader workflows. Static path assertions do not replace production acceptance.
6. Additional TeX engines, non-Latin labels, font-shape fidelity and typesetting package diversity remain unverified. Actual `pdflatex` syntax checks are stronger than substring checks but not publication-grade approval.

## Files / delivery

The accompanying ZIP is a **cumulative changed-files overlay relative to Cut00**, preserving `mathillustrator/` paths, and includes the necessary unchanged-since-Cut02 root `index.html` and `tools.html` integration exceptions. It upgrades any of Cut00/01/02 and deliberately contains no `mathreader/` entry, caches, `.git` data or generated PDFs. Extraction must be into the site's repository root. Review those two site-root HTML files before overlaying if the live website has independently evolved.

See `quality/REGRESSION_POLICY.md` for the permanent review matrix; `cut03-regressions.json` for machine-readable case/provenance records; `performance.json` for historical and new measurements; `KNOWN_ISSUES.md` for active limitations; `../manifest.json` and `../schemas/project-v1.schema.json` for the machine-readable contracts.
