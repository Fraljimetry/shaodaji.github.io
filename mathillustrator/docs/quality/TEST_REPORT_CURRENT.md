# MathIllustrator current verification — 2026-11-12 / v0.26.1 maintenance

## Scope and baseline

User-provided website ZIP `shaodaji.github.io(1).zip`; runtime version 0.26.0 / Cut 25, verified *before* maintenance. Version 0.26.1 changes documentation, historical evidence storage, active inventory and a reversible regression runner only; no `src/`, HTML, CSS, JSON project format or MathReader source is changed.

## Before-maintenance observed results (not assertions about production hosting)

| Gate | Result | Provenance |
| --- | --- | --- |
| Cumulative Cut25 file inventory | PASS, 222/222 manifest paths | Exact extracted website tree, `package_integrity_cut25.py` |
| Cumulative SHA256 bytes | PASS, 220/220 | Same historical manifest |
| Cut 02–24 historical path coverage, includes 07 and 11 | PASS | Cut25 package integrity verifier against historical path inventories |
| Model and regression Node tests | PASS, 144/144 | `node --test tests/*.test.mjs`, Node v22.16.0 |
| Isolated Chromium browser scripts | PASS, 45/45 | 44 first-pass, homepage script rerun after extracting the missing original stylesheet into the **audit copy**; `/usr/bin/chromium`, Playwright; 2 helper-only Python modules excluded |
| JSON schema and examples | PASS, 4/4 samples | Draft 2020-12 `jsonschema` validator, current `project-v1.schema.json` |
| Site navigation static checks | PASS | Actual root index/tools HTML and integration fixtures |
| Homepage bilingual responsive DOM | PASS, 8/8 cases | Actual root HTML and original locale/CSS assets, isolated Chromium |
| TeX compilation | PASS, 2 examples | Actual `pdflatex` for TikZ and restricted `tikz-cd` |
| Real hosted site / Firefox / Safari / physical touch / real simultaneous browser-tab writes | **NOT VERIFIED** | Requires a different environment and device/browser matrix |

The original archive was selectively extracted for auditing: the first homepage browser run failed only because `assets/css/style-v15.css` was not copied into the audit fixture. Copying that unmodified stylesheet from the uploaded website made the eight homepage checks pass. This is **not** evidence of a missing stylesheet in the user's original ZIP.

## Historical cleanup verification

The immutable `docs/history/release-history.zip` stores the original **173** cut-specific historical test/release files and six older central-document snapshots. `docs/history/contents.json` binds the archive and each legacy path to SHA256. Run the new `manage_history.py` integrity and staged-run commands before removing old standalone copies. Pruning is opt-in and byte-preserving/reversible; extraction of an overlay ZIP alone does not delete previous files.

## Post-maintenance / after clean pruning — confirmed PASS

- **52 active MathIllustrator files** remain after opt-in byte-verified cleanup; **173 historical originals** are recoverable from the single `docs/history/release-history.zip` archive (plus six central-document snapshots). The archive digest and all historical member digests were validated.
- The new `manage_history.py test --browser` **reconstructed the historical scripts into an isolated temporary site after pruning**, then passed **144/144 Node tests**, all ES-module syntax checks, **4/4 JSON example-schema validations**, site-root integration, **2/2 real pdfLaTeX compilations** and **45/45 isolated Chromium scripts**, including cut07, cut11 and cut25.
- A full **prune → restore → prune** round trip passed against the working copy; a separate temporary-copy self-test verified **restoration, byte equality, modified historical file rejection before cleanup**, and absence of mutations to runtime or root-site files.
- The root website `index.html`/`tools.html` and all **14 source modules** remained byte-for-byte equal to the user-supplied ZIP. Only documentation, historical evidence organization and regression tooling were changed.
- **Limit:** This is a maintenance overlay on top of the verified Cut25 runtime, not a cumulative replacement for arbitrary older installations. Publishing actual GitHub Pages deletions requires committing the verified file removals to the repository.

No v7/v11 runtime module was absent from the verified Cut25 site. Reapplying an older overlay could in fact roll back newer fixes. Runtime code has therefore **not** been altered on speculation.

## Remaining risks / follow-up

Browser tests load inlined module graphs rather than the actual hosted deployment paths. Current test results do not certify CDN caching, GitHub Pages MIME behavior, service-worker interactions, browser-specific text metrics, large real-world SVG/raster exports, security under arbitrary inputs, accessibility on assistive devices or true multi-tab transactional storage. Some dense scenes exceed a guaranteed 60 FPS budget; scene-aware routing is bounded and not an optimal crossing solver. Continue targeted red/green tests and explicitly label unverified behavior.
