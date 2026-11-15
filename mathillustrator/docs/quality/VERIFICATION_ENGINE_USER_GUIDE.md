# MathIllustrator — Verification engine user guide (Round 112)

The verification engine is a developer-side script, **not** a toolbar feature in the website. Run commands from inside the `mathillustrator` project directory (Windows, macOS or Linux with Node, Python and Playwright/Chromium installed).

## One command, three profiles

```sh
# During ordinary development: fast Node + 1,200 trials per family + critical Chromium
python tests/verification/release_gate.py --profile quick

# Before deploying: extended 10,000 trials per family, all required local browser and performance gates
python tests/verification/release_gate.py --profile local

# Hosted release certification: same local checks plus an actual HTTPS deployment smoke test
python tests/verification/release_gate.py --profile release --hosted-url=https://shaodaji.cc/mathillustrator/
```

The gate always emits a JSON result in `tests/verification/release_gate_result.json` (override with `--output=path.json`). This file is **generated**, not part of the source release. For every individual check, inspect `status`, `command`, `returnCode`, elapsed time and captured stdout/stderr tails. The overall status is:

- `PASS` (exit 0): every required check **actually executed** and passed. `releaseCertified=true` only for the release profile with a successful hosted check.
- `FAIL` (exit 1): at least one executed mandatory check failed or timed out. Remaining checks still execute so all failures are reported.
- `INCOMPLETE` (exit 2): no executed failure, but a prerequisite, executable or required certification evidence was missing. A release with no `--hosted-url` is incomplete by design.

**Do not** use catalog percentages as a substitute for these results. `28/28` means that the original inventory has 28 entries with declared checks; it **does not** represent every geometry tool, rendering mode, export format, platform, accessibility rule or mathematical singularity. The coverage reporter distinguishes `declaredCovered` from `executedVerified`, and for a local/release gate it requires actual PASS evidence in this run for Chromium interaction and both performance benchmark scripts. `node tests/verification/report_coverage.mjs --catalog-only` inspects declarations but deliberately reports zero executed verification. The old bare reporter command is **not** a release check.

## Reproducing numerical failures

```sh
node tests/verification/run_kernel_properties.mjs --seed=1511506142 --cases=10000
```

The seed, family, case number, scale and failing details are logged. The extended gate runs 10,000 cases **per family** (31 families, 310,000 property cases); quick mode runs 1,200 per family. These are seeded sampled checks, not mathematical proofs. A new adversarial family tests near-tangency, near-endpoint exclusion and root multiplicity at six different scales. Rare rounding, ill-conditioned configurations, browser rendering, and independent high-precision oracle risks remain open research areas unless separately tested.

## Performance budgets

Local/release default limits: **1,500 ms** Node 3D cold and warm p95 projection, **2,000 ms** maximum of three Chromium document-import/render samples. These limits catch serious regressions, but do not establish smooth 60 fps interaction. They are intentionally configurable for hardware-specific baseline policies:

```sh
MI_PERF_P95_MS=1500 MI_BROWSER_IMPORT_P95_MS=2000 python tests/verification/release_gate.py --profile local
```

On Windows, set environment variables using your preferred shell before invoking Python. Benchmark results include measured timings and budgets. Device-tier targets should be lowered once real reference hardware baselines exist; noisy CI machines need stable baselines rather than arbitrarily loosening thresholds. Browser benchmark's three samples yield a **maximum sampled latency**, not a statistically meaningful population p95. The 3D benchmark measures projection, not continuous GPU frame pacing.

## Dependencies, scope, and release policy

- Requires modern Node.js, Python 3 with `playwright` installed, and working Chromium binaries (`python -m playwright install chromium`). The existing browser test harness may use `MATHILLUSTRATOR_CHROMIUM` for a system Chromium path.
- The local gate uses isolated Chromium HTML harnesses, which test real browser JS behavior but not the public web server, CDN or caching. Hosted mode checks HTTPS navigation, application DOM initialization, and page errors. Manual production spot-checks of 2D/3D creation, SVG/PNG/JSON, import and saved-project reload still add value.
- Git commits are not created. The gate does not modify application code; only its JSON result file is produced.
- A newly failing invariant should be entered in `BUG_REGISTER_AND_DEBUG_ROUTE.md` with a reproduction and a permanent regression. Do not increase catalog counts as a proxy for quality.
