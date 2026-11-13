# MathIllustrator Cut 05 — v0.6.0 new risk-class audit (2026-11-12)

## Scope and baseline

Verified current source against the exact Cut04 overlay file contents. MathReader and global site scripts are untouched. Cut05 changes the representation of SVG arrowheads and the large-scene editing path, not the version-1 editable JSON data contract. Static `index.html` and `tools.html` are retained from the previously shipped root integration because homepage links are hard-coded there.

## Confirmed red → green issues

| ID | Reproduction on Cut04 | Cut05 correction | Adversarial neighbor checked |
| --- | --- | --- | --- |
| MI-SVG-051 | SVG exports use globally repeated `mi-arrow-oN` marker IDs. Inlining separate SVGs can resolve each other's markers and colors. `browser_cut05.py` initially red on missing explicit polygon. | Use path + polygon arrowheads with screen-space terminal tangent; remove all `<marker>` / `marker-end` output. | Recolor object, export again, Undo, export again, arrowhead direction/finite shape, TikZ compilation. |
| MI-PERF-052 | Cut04 creates one transparent point hit disk per rendered point in addition to the visible marker, doubling SVG DOM in point-only scenes. | Geometric point selection on pointerdown; no extra hit disk DOM. | Point underneath later filled polygon remains draggable, undo reverts, hidden/zero-opacity points cannot intercept clicks, original pointer cancellation suites. |
| MI-PERF-053 | 3000 visible object rows exist in DOM and are rebuilt on edit and import. | Fixed 45px row virtualization with overscan and virtual scroll height. | Scroll to oldest point, select/hide/filter/rename/undo, nonmatching search, stale control tests, aria-posinset and aria-setsize. |
| MI-PERF-054 | Far-offscreen point primitives are still built into the SVG. | Conservative point viewport culling; limit respects potential visible labels. | Offscreen points remain in JSON and in full model, and reappear after Fit/pan. |

| MI-REL-057 | Replaying Cut04 ZIP did not include the original `tests/model.test.mjs`: the working tree ran 42 tests, but an extracted overlay did not contain all test source files. | Cut05 cumulative ZIP includes the missing baseline test module; extracted ZIP must run the same 45 tests as the working tree. | Full 45/45 Node suite rerun from extracted release bytes; package manifest tracks new file. |

## Test provenance and results

- `node --test tests/*.test.mjs`: **45/45 passed**; new marker-free geometry, 1,800-deep dependencies and failure-atomic command invariants.
- Twelve isolated headless Chromium scripts: **12/12 passed**. `browser_cut05.py` checks exported SVGs and overlapping point drag + rollback; `browser_cut05_list.py` checks 3000 object rows, search, hide and undo. Ten older scripts remain green, including stale-controls, pointer cancellation, corrupt backup quarantine and mobile drawers.
- `node --check src/*.mjs`: five ES module checks passed.
- Four schema example projects: **4/4** Draft 2020-12. No JSON schema version increment; Cut04 optional point-size semantics unchanged.
- Two generated LaTeX sources: **2/2 actual pdflatex compilations**; no comprehensive TeX visual parity implied.
- Static bilingual homepage and Tools-page links: checked in the locally extracted site layout. Actual hosted HTTPS and modules remain unverified.

## Performance evidence and limitations

One isolated Chromium 1440×900 point-only workload (`tests/browser_performance.py`) run three times after Cut05. In the 3000-point case the SVG DOM is now 2611 elements rather than Cut04's 6002 (many points visible); last rebuild timings: **21.8 ms, 41.9 ms, 34.2 ms**. Cut04's single rebuild was **69.8 ms**, but there is no reliable like-for-like distribution or hardware-controlled comparison. Import-to-object-count observations were 86.5, 115.6 and 113.6 ms. This is real evidence for reduced DOM count and shorter *observed* times in this environment, **not** a 60 FPS or cross-device guarantee. Search/anchor scans and full SVG rebuilds remain O(scene size).

## Unverified or intentionally not claimed

- LocalStorage has no atomic compare-and-swap; a simultaneous two-tab write race is unresolved. Browser security policy blocked real shared-origin navigation even with routes (`ERR_BLOCKED_BY_ADMINISTRATOR`). Older storage tests use isolated doubles; they are not real two-tab proofs.
- Full-screen reader navigation through virtual rows, Firefox/Safari/Edge, real mobile touch/pens, dense vector/label benchmark distributions, actual hosted website module caching/refresh, mathematical correctness of adaptive function plots and LaTeX visual equivalence remain unverified.
- Additional shapes and specialized mathematics (Möbius transforms, 3D/Ricci flow, general geometric constraints, math text rendering, PDF) are still planned. Unsupported exports remain disabled.

## Next distinct hidden-risk classes

SVG text metrics/overlarge labels at extreme zoom; document import time and memory at 10k objects; keyboard pagination through virtual lists; stale viewport caches after resizing during a freehand stroke; genuine overlapping cross-tab writes with lost storage events; vector PDF/copy-paste fidelity under non-Latin/LaTeX labels.
