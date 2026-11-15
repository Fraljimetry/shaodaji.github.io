# MathReader v438 — reading navigation concurrency and return integrity

Baseline: authoritative uploaded MathReader v436, then v437 overlay. Website-root changed-files-only ZIP. No Git commits.

## Reproduced defects and fixes

1. **Back / reading-trail global race.** Returning to an earlier reading position temporarily set a shared `suppressReadingHistory` boolean until the async navigation finished. An unrelated, newer navigation could occur while it remained true, silently dropping the newer location from the reading trail. Fixed by passing `recordHistory: false` **only to the return request**; ordinary navigation continues recording history independently.
2. **Stale landing cues.** An older Back or reading-trail click could show a cue after its navigation was overtaken by a newer click or different PDF. The cue is now contingent on the same source document, source key and navigation serial.
3. **Cross-paper return completion.** A confirmed-bibliography return previously popped its return path after `goToLocation` silently aborted because a newer navigation or document switch superseded it. The return is now consumed only if the requested navigation serial and source paper still match, preserving the path on interruption.

Preserved original history layout, v437 mathematical OCR improvements, local document-state persistence and index schemas. Bilingual Tutorial updated. `tests/reading_trail_race_v438_regression.js` adds deterministic production-function state-machine races; cross-paper regression extends return options. These tests are synthetic execution/control of real production functions, **not** real PDF navigation evidence.

## Verification Engine V5 — full run

Completed on the patched v438 source: **141 checks: 139 PASS, 0 FAIL, 2 INCOMPLETE**. Selected 82 JavaScript and 39 Python regressions, plus syntax/inventory and V5 reliability checks. `full_text_exports_v400.py` and `seven_export_evidence_v401.py` are incomplete because external historical export corpus assets are unavailable. Repeated performance/reliability gate passed; browser test coverage is limited to included local fixtures and controlled browser scenarios. This run does not certify original-PDF structure/equation indexing or genuine Texify inference; neither reviewed original-paper evidence nor actual model inference is available for those certifications.
