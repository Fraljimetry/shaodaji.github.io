# Round 143 — Overall stability audit (local, 2026-11-15)

## Baseline and methodology

Current source reconstructed from the uploaded authoritative MathIllustrator ZIP and cumulative Round 136–141 overlays; Round 142 added only documentation. Isolated headless Chromium runs the actual application module graph in a test page, **not** the hosted website. Node 22.16.0 full suite and real Chromium interaction tests were executed locally. Tests were run in independent browser processes after an overlarge parallel batch stalled. Historical expectations were compared against current app behavior, not blindly treated as requirements.

## Verified

- `node --test tests/*.test.mjs`: **553/553 passed**, 0 failed, skipped or canceled (exit 0).
- Actual Chromium, **17 tests passed** in isolated invocations or the initial completed batch: `browser_smoke.py`, `browser_storage.py`, `browser_cut04_pointer.py`, `browser_cut04_stale.py`, `browser_cut14.py`, `browser_round136_stateful.py`, `browser_round139_region_language.py`, `browser_round137_functions.py`, `browser_round130_strict_region.py`, `browser_round128_centered_regions.py`, `browser_round109_export_interruptions.py`, `browser_round138_i18n.py`, `browser_round107_3d_export.py`, `browser_round108_export_fidelity.py`, `browser_touch_current.py`, `browser_object_menu_current.py` (revised current Escape drawer contract), and **new** `browser_round143_stability.py`.
- Repeated stateful soak: 12 sequential command creations, 4 undo + 4 redo, 4 language + 4 theme transitions, malformed JSON import without data loss, New followed by undo restoring the scene. No `pageerror` events.
- Other tested paths: stale detached controls, dependency-aware object deletion/restore, localStorage conflict and delayed autosave, interrupted file imports, canceled drags, malformed plot constraints, desktop/390/320 responsive state, SVG/raster/3D export tests.

## Unresolved or incomplete

- `browser_cut04_opacity.py`: **timed out** at 16 seconds; a longer attempt in the parallel batch also did not finish. No pass claimed, and neither a functional error nor a harness deadlock has been conclusively established.
- `browser_round119_gpu_numeric.py`: exits **2 / UNAVAILABLE** because WebGL2 context cannot be created. This is a verified environment limitation, not a GPU correctness pass.
- The first wider parallel Chromium batch exceeded the tool runtime after the first eight results. Unfinished items in that batch are **not** included as passes; only the separately rerun cases above are counted.
- Physical touchscreen/stylus, Firefox/Safari/Edge, hosted-origin storage, actual concurrent cross-tab races, long-duration memory-leak soak, massive-scene editing, real hardware GPU stability, and the complete historical Chromium inventory remain **not verified**.

## Test maintenance and application changes

- `browser_object_menu_current.py`: the test previously assumed `#object-search` remains visible after Escape at mobile width. Since Round 136, Escape intentionally dismisses the mobile drawer. It now asserts dismissal then reopens the drawer and checks search visibility. PASS in real Chromium.
- `browser_round143_stability.py`: new repeatable stateful acceptance test for command entry, undo/redo, language/theme, invalid import and undoable New. The source implementation explicitly uses `update(()=>doc=newDoc())`, so prior assumption that New must clear undo history was incorrect.
- **No application code was changed** and no new confirmed runtime regressions were found in the completed scenarios. This is a limited but substantive audit, **not** certification of overall defect-free stability.
