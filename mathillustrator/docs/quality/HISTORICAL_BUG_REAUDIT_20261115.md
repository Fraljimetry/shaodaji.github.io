# MathIllustrator — Historical bug re-audit (2026-11-15)

## Scope and evidence

Audited the current authoritative uploaded source ZIP, then applied cumulative overlays **Rounds 136–139** in order. Inspected the cumulative `USER_REQUIREMENTS.md` (1,622 lines), `KNOWN_ISSUES.md` (366 lines), `TEST_REPORT_CURRENT.md` (1,804 lines), historical release index (95 release records covering Cuts 02–25), and available active/historical test inventories. This is a **sampled executable re-audit**, **not** a claim that all old bugs are fixed. The archive's 78 historical files were inventoried via the index but were **not** all individually replayed.

## Checks executed

- All current Node `tests/*.test.mjs`: **553 passed / 0 failed / 0 skipped** (~13.6 s).
- JavaScript syntax: **30/30** top-level `src/*.mjs` syntax checks passed.
- Chromium historical checks: `browser_cut03_storage.py`, `browser_cut09_multitab.py`, `browser_cut17.py`, `browser_cut18.py`, `browser_mobile_current.py`: **5 passed**.
- Chromium modern checks: `browser_round137_functions.py`, `browser_round128_centered_regions.py`, `browser_round130_strict_region.py`, `browser_round135_controls.py` (1600, 1100, 768 px), `browser_round138_i18n.py` (1440, 768, 390, 320 px): **5 passed**.
- Historical Chromium **FAIL**: `browser_cut04_pointer.py`: after synthetic pointer-up-only drag, point `A=(0.13,0.26)` remained unchanged. **Not classified as a confirmed application defect yet**: the test synthesizes a `PointerEvent` directly onto the drawing while starting with actual mouse input; check capture/active pointer IDs and compare real mouse/stylus interactions.
- Historical Chromium **FAIL (obsolete expectation)**: `browser_cut14.py` passed its first six cases but asserted that downloaded project filename equals `mathillustrator.json`. The later user requirement deliberately changed JSON export to a timestamped filename; this assertion must be updated without undoing the user-facing naming requirement. The remaining Cut14 checks after this assertion did not run.
- Chromium **TIMEOUT/incomplete**: `browser_round139_region_language.py` hit its 22-second cap in a separate rerun, with a Node EPIPE message on termination; `browser_round68_geometry_diagram_hierarchy.py` did not return before the outer command timeout. These are **not** PASS evidence; prior release claims cannot replace current completion.
- The scheduled 28-script browser batch completed **7** scripts (5 PASS, 2 FAIL) before orchestration ended; 21 of those scheduled scripts were not executed. Five additional modern scripts passed in subsequent calls. No comprehensive 166-script live Chromium replay was completed.

## Historical bug status — avoid blanket closure

| Historical area | Current direct evidence | Re-audit verdict |
| --- | --- | --- |
| Core Node-level geometry/model/mathematical properties | 553/553 current Node tests | PASS for tested fixtures only; degenerate/unimplemented mathematical classes not certified |
| Off-grid pointer precision and drag-end | Cut04 pointer browser assertion failed | **INVESTIGATE** — possible real pointer regression or obsolete synthetic-event contract |
| Export file naming | Cut14 expects old fixed filename; current requirements demand timestamp naming | **OBSOLETE TEST** — update the historical expectation; do not revert naming |
| Autosave and synthetic cross-tab scenarios | Cut03 storage, Cut09 multitab Chromium PASS | PASS in isolated tests; true multi-tab atomicity and storage-loss crashes not certified |
| Image/SVG export behavior | Cut17/Cut18 Chromium PASS | PASS for tested format fixtures; print fidelity and cross-browser export remain open |
| Mobile UI basics | `browser_mobile_current.py` Chromium PASS; Round138 responsive locale PASS | Partial PASS; touch hardware, full mobile sweep and timed-out cases still open |
| 2D/3D scoped plotting constraints | Round128 and Round130 Chromium PASS | PASS for tested centered regions and strict inequalities |
| Mathematical function entry and tutorials | Round137 Chromium PASS; Node PASS | PASS for tested functions, not exhaustive numerical branch-cut proof |
| Chinese/English switching | Round138 Chromium PASS; Round139 dedicated rerun timed out | Partial PASS; Round139 current execution inconclusive |
| Desktop control alignment | Round135 Chromium PASS at 1600,1100,768 | PASS at tested widths; no screen-reader or browser-engine parity assertion |
| 3D GPU, dense implicit, domain-color resolution | Node regression pass; no GPU hardware/large on-screen stress replay in this pass | **UNVERIFIED CURRENTLY** |
| Historical editor events, import/export and hierarchy | Many available browser scripts not replayed | **UNVERIFIED CURRENTLY** |

## Prior documented open risks retained

The current `KNOWN_ISSUES.md` explicitly warns about deployed-site validation, real cross-tab Web Locks atomicity, browser/storage crash recovery, Firefox/Safari, physical touch/stylus, scalable full-SVG redraw, exact mathematical typography/export, full TikZ-cd interoperability and narrow singularity detection. Their presence in historical issue tables is not proof they remain bugs in every contemporary workflow; equally, a green Node run is not grounds to mark them fixed. Re-test against current behavior before changing status.

## Follow-up priority

1. Reproduce pointer drag with **actual** Chrome/Chromium user-generated mouse and (where possible) pen/touch events; distinguish mismatched synthetic-pointer IDs from actual drag failure. Add a current browser regression.
2. Update `browser_cut14.py` *in a separate compatible test change* to assert the documented dated JSON naming convention, then finish its interrupted scenarios.
3. Re-run the Round139 locale-switch regression in an isolated, bounded Chromium session and diagnose its intermittent hang (collect trace and actual failed step).
4. Execute all currently applicable archived/current Chromium scripts in bounded, resumable batches; report per-script PASS/FAIL/TIMEOUT, explicitly marking deprecated UI contracts rather than silently excluding them.
5. Perform real hardware/mobile, GPU, hosted-site, and cross-browser verification separately; those are currently **not** certified.

**Release decision:** Historical bug closure is **NOT CERTIFIED**. No runtime files were altered in this audit; no glyphs were modified; no Git commits were created.


## Round 141 continued replay — evidence update

Source: Round 135 authoritative ZIP with Rounds 136–140 overlays, verified using local Chromium and Node.

### Confirmed root-cause fix

- **Fast select-then-drag defect:** confirmed with real Chromium mouse events. A second pointerdown on the same point within 500 ms was treated as double-click navigation and returned before creating a drag. Waiting >500 ms made dragging work. Corrected by deferring point navigation until pointer release; if the pointer moves, the edit proceeds. The original pointer-up-only test and a new real-mouse fast-drag regression both pass. Other glyphs and non-point navigation are unchanged.

### Historical tests reconciled

- `browser_cut14.py`: updated obsolete fixed-JSON-filename assertion to the current timestamped format. **PASS**, including all eight lifecycle/quota scenarios.
- `browser_round139_region_language.py`: mobile test now opens the appropriate responsive panel before interacting. **PASS at 1440 and 390 px**, including repeated EN/ZH switching and left alignment.
- `browser_cut03.py`: its old assumption that exports exclude grids by default conflicts with requirement **R115**, which explicitly enables export guides in new documents. The local test source was explored, but the complete scenario did **not** finish and it is not included in the deliverable.
- `browser_cut02.py`: its object-count expectation of 3 conflicts with the later polygon edge-segment model (current observed count: 8 after two points and a 5-sided regular polygon). This historical assertion is **obsolete**, but the rest of the script was not run, so it remains uncertified.

### Current execution

- Node full suite: **553/553 PASS**, zero skips.
- Chromium `browser_cut04_pointer.py`: **PASS** with synthetic last-pointer-up and actual rapid mouse drag, undo.
- Chromium `browser_cut14.py`: **PASS** after aligning filename test with current requirement.
- Chromium `browser_round139_region_language.py`: **PASS** 1440 px and 390 px.
- Chromium `browser_cut04.py` and `browser_cut04_stale.py`: **PASS** in additional historical replay.
- `browser_cut04_opacity.py`: **TIMEOUT** in bounded replay, no conclusion.
- `browser_round136_stateful.py`: replay interrupted/timed out; no completion evidence.
- Remaining historical browser scripts, real touch hardware, hosted site, GPU and cross-engine tests: **NOT CERTIFIED**.

**No overall historical closure claim:** the available browser suite is extensive and several old scripts encode superseded interface contracts. Future sweeps should prioritize specific failures, update test expectations only when superseding user requirements are documented, and retain real behavior regressions.
