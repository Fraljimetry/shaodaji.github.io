# MathIllustrator Cut 11 · v0.12.0 · adversarial audit and implementation evidence

**Baseline:** exact Cut 10 cumulative ZIP, not an assumed current deployed website. **Environment:** Node.js v22.16.0, local Python Playwright with headless Chromium, local pdfLaTeX. Browser tests use inlined ES modules because localhost/direct-HTTPS navigation has been blocked by the sandbox; no hosted-site certification.

## External bug patterns used as *risk hypotheses*, not copied bug claims

- [Desmos: Unresolved Detail in Plotted Equations](https://help.desmos.com/hc/en-us/articles/202529079-Unresolved-Detail-In-Plotted-Equations): a graph may lose detail when complex expressions cannot be fully sampled within a time budget. Cut11 adds explicit plot resolution choices, an evaluation ceiling, and an incomplete-view indicator; it **does not** mathematically certify poles, intersections or topology.
- [Desmos API changelog](https://www.desmos.com/api/changelog): historical label-position, tab-focus and untrusted-saved-graph security bugs motivate long/invalid-label and plain-text DOM test cases. These are examples of risk classes, not proof of the same vulnerabilities in this editor.
- [GeoGebra Free/Dependent objects](https://geogebra.github.io/docs/manual/en/Free_Dependent_and_Auxiliary_Objects/) and [GeoGebra 6 changelog](https://geogebra.github.io/docs/reference/en/Changelog_6_0/): live reference semantics, input/snap behaviors and SVG publication warrant end-to-end construction + pointer + export checks.
- MathReader-inspired `quality/REGRESSION_POLICY.md`: every change must cover nearby races, undo/rollback, corrupted/persisted inputs, viewport transitions, performance and false-success/fallback behavior.

## Confirmed failures and changes

| Case | Original behavior / risk | Corrective implementation | Evidence |
| --- | --- | --- | --- |
| MI11-LABEL-001 | A 100+ character diagram label had a capped ~340px box but one unwrapped SVG text run, so text overflowed the node while arrow bounds used the smaller box. | `layoutNodeLabel` greedily wraps whole source without changing text semantics; node rectangle, multiple SVG `tspan`s and morphism clipping share the same approximate bounding box. Explicit line breaks preserved. Bounded LRU-style layout cache (256 entries). | Node + actual Chromium SVG DOM and node/arrow tests. |
| MI11-FIT-002 | Fit used mathematical anchor locations, not the fixed-pixel label boxes. Nodes near frame edges were clipped. | `fitSceneView` reserves screen-pixel room for nodes, point labels and basic text; warns when impossible on a narrow viewport. | Node geometric assertions and actual rendered Chromium node bounds. |
| MI11-PRECISION-003 | `toFixed(3)` made `1e-9` appear as `0.000`, misleading for a mathematical document. | Adaptive 7-significant-digit display (scientific notation for very small/large values); native coordinates unchanged. | Node + Chromium object list. |
| MI11-INDEX-004 | Every pointer snap rebuilt a resolver and scanned all points; this is slow in large documents. | Lazy 32px spatial index for visible, nontransparent point/midpoint locations; cache keyed by document revision/generation and camera/size. Same-gesture new anchor matching remains the separate snapshot operation. | 87 Node tests + Chromium; exact Cut10 nearest query baseline compared on 120 deterministic positions. A first attempt changed 16 tie selections; fixed snap ties to preserve the previously earliest anchor. Final 0/120 mismatches. |
| MI11-PLOT-005 | Plot sampling quality was fixed and performance/resolution tradeoff not user-adjustable. | Fast / Balanced / Detailed right-panel setting; Analysis / plots preset selects Detailed. Sample budget capped at 80,000 evaluations, with visible frame warning and image output gated if budget exhausted. Cache key includes detail mode. | Node tests for evaluation ordering/budget/old v1 defaults/invalid input; Chromium verifies actual plot path changes. |
| MI11-EXPORT-006 | Geometric TikZ export could silently ignore browser-only automatic wrapping. | TikZ disabled for visible auto-wrapped node labels; SVG and lossless native JSON remain available. Semantic `tikz-cd` still represents abstract diagram data separately. | Chromium export capability and retained pdfLaTeX compilation tests. |
| MI11-SECURITY-007 | Risk hypothesis from externally reported graph editors: hostile labels interpreted as markup. | Existing textContent-based rendering preserved; new Chromium regression inserts `<img onerror=...>` as literal node label and checks that no HTML image or JS execution occurs. | Isolated Chromium, not a full security audit. |

## Performance — precise boundaries

4,000 synthetic visible points, 120 deterministic pointer snap positions, Node v22.16.0, five repeated batches after warm-up. *Lookup only; index-build cost is excluded and original SVG frame rebuilds are not accelerated by this measurement.* Original Cut10 resolver+linear query median **159.11ms per batch**; Cut11 cached spatial query median **0.2592ms per batch**. These are synthetic per-batch microbenchmarks, **not** end-to-end browser frame latency or a 60 FPS guarantee. See `quality/performance.json`. Fully overlapping objects still create dense buckets; first access builds the index.

## Verification (provenance-sensitive)

- Exact Cut10 baseline: 78/78 Node tests green before changes.
- Modified source: 87/87 Node regressions green (78 retained + 9 Cut11).
- Isolated Chromium editor scripts: 20/20 green, including Cut11 new suite; the broad batch timed out *while launching* the Cut11 script and it was executed separately with PASS. No browser-level failures were hidden by claiming the batch itself succeeded.
- Project JSON schema and four fixtures, root-site integration, actual TeX compilation, and cumulative-extraction evidence are documented in the final release verification below; these gates must be rerun from the packaged ZIP.
- `tests/browser_smoke.py` was updated to inline the new `anchor_index.mjs` and `diagram_layout.mjs` import from `geometry.mjs`; no source deployment imports are rewritten.

## Remaining major risks

Exact mathematical plotting and symbolic/implicit curves are still not present. Diagram text metrics use deterministic approximations, not browser `measureText`, real TeX glyph widths, or collision-free layout; a long node may extend beyond a very small viewport. `tikz-cd` abstract topology is distinct from rendered SVG geometry, and arbitrary TeX is not accepted. First spatial-index build and full SVG redraw still cost time. No hosted HTTP/HTTPS, Firefox/Safari, physical touch, independent screen reader, genuine simultaneous-tab Web Locks, high-precision geometry, 3D or Ricci flow certifications. Test these separately; do not call this a complete math-illustration platform.
