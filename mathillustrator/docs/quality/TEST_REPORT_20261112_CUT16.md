# MathIllustrator Cut 16 · v0.17.0 — persistence and recovery audit

**Date:** 2026-11-12 (website-owner local date). **Baseline:** supplied Cut15 cumulative overlay. **Scope:** idempotent save comparison, stale external storage events, quota recovery UI, warning-state reset, site-data clearing and compatibility. Not a general rendering enhancement.

## Reproducible red cases

1. Cut15 `tests/browser_cut16.py` raised `Stale event triggered false conflict` when a queued `StorageEvent.newValue` was older than actual localStorage.
2. The Cut15 `compareAndWrite()` rejected an old expected token even when the current saved bytes already equalled the desired bytes. New Node case was red before implementation (the first attempted test-run also contained a test syntax typo, corrected before assessing the behavior).
3. Cut15 had no `#retry-autosave` control. Under a simulated storage quota error, recovery required a new document edit or manual JSON backup; a targeted UI test reproduced the missing action.
4. Direct source inspection found a stale corrupted-project banner heading after later conflict. Test added for ordinary cross-tab title. `StorageEvent.key === null` (external clear) was added as an explicit adversarial scenario.

## Production changes and safety rationale

- **`src/storage.mjs`:** already-current payload is an idempotent successful synchronization, not a duplicate write or divergence. Mismatching bytes remain a conflict. Normal browser saves still use Web Locks where available.
- **`src/app.mjs`:** storage event receiver reads actual saved bytes instead of queued event payload; key-null clear is handled, unreadable storage pauses updates, and warning heading resets according to cause. Retry calls the existing persist path after the user addresses a storage error.
- **`index.html` and `style.css`:** small visible footer Retry control with keyboard semantics and live status. No MathReader application files, project model fields or version-1 JSON schema changes.

## Verification provenance

- **Node:** `node --test tests/*.test.mjs` — 100 tests passed in the Cut16 working copy (includes 3 new tests).
- **Focused browser:** `PYTHONPATH=tests python tests/browser_cut16.py` — stale event, conflict, quota retry and key-null clear passed using isolated Chromium and a controllable Storage-shaped test double.
- **Legacy suites and packaging:** see the final package verification ledger generated with this release. The full inherited and new browser matrix passed: **27/27 isolated Chromium scripts**, run with bounded browser concurrency. This is not network-origin or actual-device evidence.
- **No general performance measurement:** avoiding a redundant storage write is a structural optimization; it is not presented as a measured FPS/latency improvement.

## Remaining severe risks

A real same-origin two-tab navigation attempt on `http://127.0.0.1` failed with `ERR_BLOCKED_BY_ADMINISTRATOR` in this sandbox. Web Locks behavior under tab teardown and browsers without Web Locks is still not proven atomic; last-chance `pagehide` is best effort. Browser-managed storage can be cleared or evicted. Always download native JSON when the work matters. Real quota, Firefox/Safari, deployed domain, physical touch/IME, assistive technology and high-volume mixed-scene performance remain future validation tasks.

## Exact completion evidence

- Node: 100/100 PASS.
- Chromium isolated editor scripts: 27/27 PASS (all previous applicable scripts, including `browser_cut15_mobile.py`, plus Cut16).
- Controlled localStorage quota, stale notification, external clear and retry: PASS.
- Full real origin: navigation to `http://127.0.0.1:8892/mathillustrator/` was blocked by `net::ERR_BLOCKED_BY_ADMINISTRATOR`. This is **BLOCKED/UNVERIFIED**, not PASS.
- Native JSON model/schema remains v1. No editor canvas performance measurement was conducted.
