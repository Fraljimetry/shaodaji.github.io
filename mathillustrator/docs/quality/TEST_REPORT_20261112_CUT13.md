# Cut 13 (v0.14.0) — Settings and UI state audit

## Baseline and scope

Source: exact `mathillustrator_cut12_overlay.zip` extracted as a website-root-relative site overlay. Original 91 Node tests passed before edits; Cut13 focused on a different risk family: Settings consistency, destructive shortcut focus, original appearance preservation for legacy JSON, and unnecessary scene invalidation on export-only options. Root `index.html` and `tools.html` remain the exact Cut12 versions. No MathReader source changed.

## Confirmed red → green evidence

| Case | Cut12 baseline (RED) | Cut13 (GREEN) | Evidence |
| --- | --- | --- | --- |
| MI13-001 focused toolbar | Backspace on Zoom deletes selected point | Zoom Save and other toolbar focus do not permit global geometry deletion; drawing/object contexts retained | `tests/browser_cut13.py` |
| MI13-002 preset mismatch | General remains shown after disabling anchor snapping | Custom displays for edited drawing defaults; selecting a named preset restores construction defaults | same |
| MI13-003 redraw waste | Export-only scale/region/guides replace entire visible SVG | Document settings/undo/autosave updated without canvas or object-row reconstruction | same, SVG first-child identity |
| MI13-004 legacy radius | Changing default point radius from 5 to 14 resizes old imported point missing `style.pointSize` | Existing point/midpoint appearance preserved at 5, future points use 14; v1 import unaffected | `tests/browser_cut13.py`, `tests/cut13.test.mjs` |

## Tested scope

- Node `node --test tests/*.test.mjs`: **93/93**; original Cut12 was 91/91.
- Isolated real Chromium: **23/23** editor suites (`browser_smoke`, edges, storage, Cuts 02–13, excluding the known blocked HTTPS-origin `browser_cut09_multitab` script). Each tests implemented paths; no all-state claim.
- Settings matrix `cut13-control-state-matrix.json` distinguishes new checks, inherited checks and missing combinations.
- Independent performance probe: 2,500 points, ten exportScale changes, median **35.6 ms (Cut12)** to **7.65 ms (Cut13)** for synchronous change handling; host/viewport controlled. It does not include GPU frame time or prove 60 FPS.
- The native project **schema is still v1**. The optional `style.pointSize` in old projects is materialized only when the default size is explicitly changed; this preserves the displayed legacy radius without silently rewriting imports.

## Failure-path qualifications and remaining risks

`exportRegion`, `exportGuides`, and `exportScale` are considered *export-only* and may skip canvas redraw. They still validate and create history/autosave records. Page, grid, plot, background, labels, object changes and Undo/Redo still redraw. The preset selector is labeled **Drawing preset** because theme/page/export options are intentionally independent. Avoid assuming that the label `Custom` means a custom profile is saved or reusable.

The previously known limitations remain: real concurrent tabs/atomicity, deployed GitHub Pages, Firefox/Safari SVG or image goldens, touch/pen hardware, screen-reader keyboard use, all 152 UI controls under every state combination, and 3D/Möbius/Ricci-flow features. Some older v1 imported projects may omit `pointSize`; style is preserved as described rather than treated as an import error.

## Release integrity

An additional red gate was found during clean extraction: the longstanding `tests/package_integrity.py` still enforced Cut12's exact file count and therefore failed even when the new Cut13 inventory was correct. This is a **test-harness/release-integrity defect**, not an application runtime regression. The standard entry point now invokes the strict current Cut13 checker; historical manifests are preserved. Both entry points must pass from the extracted archive.

See `cut13-package.json` and `package-files.json` for exact file inventory and SHA-256 values generated after documentation/test finalization. ZIP extraction and suite rerun are separate release gates; no source upload or hosted release is claimed.
