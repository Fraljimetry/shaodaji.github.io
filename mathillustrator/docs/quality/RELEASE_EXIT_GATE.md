# MathIllustrator — Initial Verification Campaign Exit (Rounds 109–111)

**Decision: LOCAL VERIFICATION COMPLETE; HOSTED DEPLOYMENT SIGN-OFF BLOCKED BY ACCESS.**

The finite Round 72–111 reliability campaign is concluded locally. Do not represent this as a verified production release: the hosted `https://shaodaji.cc/mathillustrator/` could not be reached from the current verification environment (DNS resolution failed, and web retrieval was unavailable). The website must be checked after the overlay is deployed. This is one external sign-off task, **not** a reason to restart indefinite audit rounds.

| Gate | Final status | Evidence / limitation |
|---|---|---|
| G1 Core | PASS | 479/479 Node tests; 36,000/36,000 deterministic property cases; source module syntax checks PASS |
| G2 Browser | PASS for tested Chromium | Isolated Chromium startup and Round 76 critical geometry, Round 92 history, Round 107 export paths, Round 108 fidelity, and Round 109 interruption checks PASS |
| G3 Export fidelity | PASS | Opaque/transparent PNG corners, visible SVG/PNG scene, unsupported transparent JPEG disabled; Round 108 Chromium test |
| G4 Export interruption | PASS | `tests/browser_round109_export_interruptions.py` delays `HTMLCanvasElement.toBlob`, closes export dialog before encoding completes, verifies **zero stale downloads**, then verifies a new export yields exactly one PNG download |
| G5 Open confirmed bugs | PASS for current register | All 58 confirmed historical entries in `BUG_REGISTER_AND_DEBUG_ROUTE.md` have CLOSED statuses; no registered open P0/P1/P2 defects. Unverified risks are not falsely counted as defects. |
| G6 Compatibility / artifact | PASS in tested local scope | v1 JSON compatibility regression and imports; changed-files-only website-root ZIP; no app code, glyph, or schema changes in closing gate |
| G7 Hosted deployment | **UNVERIFIED / EXTERNAL SIGN-OFF REQUIRED** | Remote page cannot be fetched from this environment. Check after deployment in a real browser: HTTP 200, all assets, console, 2D geometry, 3D render, PNG/SVG/JSON exports, reload of saved v1 JSON. |

## Closure policy

- **No further numbered investigation rounds are required by this initial campaign.** Enter maintenance for confirmed regressions, specific feature requests, and explicitly scoped platform support.
- The `28/28` property coverage number means completion of the *initially scoped inventory*, not exhaustive correctness. Passing seeds and headless browser tests do not prove leak freedom or all device compatibility.
- Hosted release remains pending until G7 is performed in the deployed environment. If G7 fails, open only specific reproducible issues; do not resurrect indefinite catch-all auditing.
- Future enhancements outside the initial scope (Firefox/Safari, physical touch, long-duration GPU stress, high-precision singularity proofs, advanced TikZ fidelity) are optional roadmap items unless a supported-user failure makes one a blocker.

## Recorded verification commands (test names only)

`node --test tests/*.test.mjs`; `node tests/verification/run_kernel_properties.mjs`; `python tests/browser_smoke.py`; `python tests/browser_round76_remaining_points_lines.py`; `python tests/browser_round92_history.py`; `python tests/browser_round107_3d_export.py`; `python tests/browser_round108_export_fidelity.py`; `python tests/browser_round109_export_interruptions.py`.

## Round 112 — authoritative executable release gate

Use `python tests/verification/release_gate.py --profile release --hosted-url=https://shaodaji.cc/mathillustrator/` for an end-to-end release **gate**. The prior R111 table is historical, not live evidence for new builds. The gate marks missing dependencies or unavailable hosted deployment **INCOMPLETE**, actual failed checks **FAIL**, and certifies release only when every required check passes. The initial 28-operation catalog is not exhaustive application/function/platform coverage. See `VERIFICATION_ENGINE_USER_GUIDE.md`.
