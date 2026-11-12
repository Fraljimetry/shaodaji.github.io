# Cut 00 test report — 2026-11-12

## Environment and provenance

- Runtime: Node.js built-in `node --test` from the packaged `mathillustrator/` working folder.
- Compilation: `node --check src/model.mjs` and `node --check src/app.mjs`.
- Model regression: `node --test tests/model.test.mjs`.
- Browser E2E attempt: Playwright Python using installed Chromium. Browser navigation to both `http://127.0.0.1` and local `file:///` was blocked by administrator policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). **Not a browser PASS**.
- Files were created from the provided website ZIP's structural convention; MathReader source and unrelated pages were not modified.

## Unit regressions

See `regression-cases.json` for exact machine-readable cases. All 12 initial model tests passed after correcting the auto-generated point naming bug uncovered by test 12. The tests cover roundtrip, live midpoint/dependency links, command rollback, parser precedence/injection rejection, snapping, dependency cascade deletion, cyclic/dangling import rejection, invalid color and duplicate names, function grammar and stable IDs.

## Not yet verified

UI pointer capture, direct drawing interaction, accessible tool tiles, pan/zoom, freehand smoothing, actual PNG/WebP, SVG/TikZ visual comparison, localStorage in restricted browsers, cross-device viewport, mobile touch, 1000+ object profiling, text alignment and page guides. No fake FPS or throughput numbers are reported.

## Gates for next cut

1. Run browser smoke successfully on an authorized environment, log errors and snapshots.
2. Verify export buttons are actually disabled for unsupported formats, and native export opens with correct media type.
3. Visually verify annotations/point movement/shape circles and automatic correction.
4. Audit state transitions: drag interrupted, double-click polygon, undo/import/new project, localStorage quota, malformed project, remote fonts absent, hidden/locked objects.
5. Benchmark large scenes before claiming performance targets.
