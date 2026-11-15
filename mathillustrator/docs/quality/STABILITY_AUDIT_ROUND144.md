# Round 144 — extended stability audit

## Provenance

Baseline: authoritative source ZIP plus Rounds 136–143 overlays. Local Linux headless Chromium; browser fixtures inline current application modules (not production deployment). No hardware WebGL2 or physical-touch evidence.

## Passing checks

- Node suite: 553 passed, 0 failed (`node --test tests/*.test.mjs`).
- Real Chromium extended UI soak, 1440 px and 390 px: 6 cycles per viewport × 15 object creations = **90 objects per viewport**, plus 36 history button clicks per viewport (3 undo + 3 redo each cycle), 6 language transitions, 6 theme selections, malformed JSON rejection, New followed by Undo restoration, zero page errors. All assertions passed.
- 3D export Chromium: passed.
- Export fidelity Chromium: passed.
- Centered plotting region Chromium: passed.
- Round 143 browser tests are retained unchanged.

### Interaction timing

For 15 constructions + language/theme actions + 6 history actions, per cycle: desktop 1.40–1.58 s, 390 px mobile 1.30–1.52 s, on this test environment only.

### Memory reading limitation

`performance.memory.usedJSHeapSize` reported 60,300,000 bytes in every cycle, including across growing scenes; this coarse/invariant browser value is **not meaningful evidence against memory leaks**. No claim of long-session leak freedom.

## Unresolved opacity export test

`browser_cut04_opacity.py` previously timed out, waiting to click TikZ / PGF. Reproduced and diagnosed: after creating A, B and Segment(A,B), setting A opacity to 0, the export menu presents a **disabled TikZ / PGF button** (`Not implemented or not representable in current scene`). The historical assertion expecting TikZ output cannot execute. Updated the test to fail immediately and explicitly, rather than silently waiting for the click timeout. Not yet classified as intended representation constraint versus product regression.

## Outstanding

- Hardware GPU memory/resource exhaustion and WebGL2 stability.
- 2+ hour browser process stability and multi-tab synchronization under genuine concurrency.
- Physical touch/stylus and hosted deployment.
- Exhaustive mixed-object, dense implicit-3D, and export-format parity soaks.
- Root-cause classification for the disabled TikZ option in the opacity scene.

No application code, glyphs, or schema were changed in this round.
