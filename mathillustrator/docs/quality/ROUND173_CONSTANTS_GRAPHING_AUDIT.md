# Round 173 — Golden ratio constant and graphing failure-mode audit

## Implemented
- `phi` (case-insensitive), Unicode `φ` and variant `ϕ` evaluate to `(1 + sqrt(5))/2` in the same restricted real and complex expression interpreter that supports `pi` and `e`.
- Exact plotted line/circle polynomial recognition uses the same golden-ratio constant, including full-turn constant-radius polar plots; no pixel-based inference was added.
- The conservative GPU polynomial compiler accepts the golden ratio and still rejects expressions outside its existing restricted syntax.
- Bilingual plotting tutorial updated. No glyph or saved-project format changes.

## Reproduced graphing edge cases and scope
1. **Even-multiplicity implicit zeros** remain unsupported by numerical marching squares. With a 160×160 viewport and `x = px/40 - 2`, `F=(x-.173)^2` yielded **0 segments** while `F=x-.173` yielded **14 segments**. These zero sets are geometrically identical. The algorithm only traces sign changes. This is a genuine existing rendering limitation, **not fixed in this constant-focused cut**; correct remediation needs handling tangential zeros without inventing false contours for near-zero/poles.
2. **Sampling budget:** directly calling `sampleDomainColors` with its default 80,000 evaluations at square resolution 320 returns `limited:true`. Importantly, **the application supplies `MAX_DOMAIN_PIXELS` explicitly** to this function for its actual 2D domain-color rendering; this isolated default-call behavior is not evidence of a current UI failure. Tested at 256, 320, 1024.
3. **Poles:** `x(t)=1/t, y(t)=t, t in [-1,1]` produced 4 segments and 30 breaks, not a single bridge. This targeted case passed, but it does not prove all discontinuities are correctly handled.
4. **GPU numeric precision:** by design the shader subset is float32 while the CPU evaluator is float64. Large-coordinate cancellation and near-tangent surfaces can differ numerically. No discrepancy was confirmed with a hardware shader test in this cut.
5. **Analytic vs numeric graphing:** exact recognition is intentionally limited to supported polynomial/parametric syntax; not every visually circular curve is promoted to a geometric circle.

## Executed verification
- `node --test tests/*.test.mjs`: **576 passed, 0 failed, 0 skipped**, including four new tests across main/complex parser, 2D implicit/parametric/vector/domain, 3D bounds, GPU subset, geometry recognition and budgets.
- Syntax: `node --check` on the three changed JavaScript modules passed.
- Real Chromium: `tests/browser_round173_phi.py` **passed at 1440 and 390 px**; created a real function `phi*x+e` and implicit curve `x^2+y^2=φ` through the UI without page errors.
- Not executed: full historical Chromium suite, real GPU shader accuracy/performance, physical touch, hosted site, and every construction with phi-dependent objects. No blanket graphing certification.
