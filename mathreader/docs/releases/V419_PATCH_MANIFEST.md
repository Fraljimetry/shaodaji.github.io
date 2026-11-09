# MathReader v419 — Manually added Structure in PDFs with embedded outlines

**Source baseline:** uploaded `mathreader_v418_complete.zip` (sole authoritative code baseline).

## Reproduced defect and general cause

On an embedded-outline PDF, select an ordinary sentence and invoke the reader's **Structure** action. The v418 handler rejected the operation with the message “Use Reselect on an existing Structure item; embedded outlines do not support adding new items.” The new `tests/structure_manual_embedded_v419_regression.js` failed on v418 with this exact behavior before the source correction.

The cause was a mutually exclusive Structure presentation model: the embedded branch could edit a PDF bookmark, while newly selected manual entries were stored and rendered through the inferred-outline branch only. Simply deleting the rejection would have hidden the PDF's embedded bookmarks and allowed later detector refreshes to overwrite manual additions.

## Corrected behavior

- Users may add arbitrary selected text as a **manual Structure entry** with an embedded outline, without automatic heading-classification requirements. Native PDF bookmarks retain their source keys, original relative order, and nesting; manual entries are interleaved by page position and carry independent user-edit metadata.
- A shared row renderer gives manual entries navigation, Reselect, Remove, Undo, and indentation (0–3), whether the document has embedded or inferred headings. Editing or deleting one manual entry does not change PDF bookmarks. Embedded bookmark Reselect/Remove remains unchanged.
- Typography detection merges its output with existing user-edited entries, including manual items added while an asynchronous detector run is pending. Detector version invalidation preserves manual entries; a manual item alone does not falsely mark automatic detection complete.
- Reading-only exports retain user-selected Structure entries; PDFs lacking extractable text can still display embedded bookmarks (and manual Structure entries). Automatic entries take lower priority than user entries at the existing 1200-item limit, and identical selected manual entries do not duplicate.
- The browser asset version is **v419**. There is **no change** to the PDF, equation-index schema (28), or Structure detection schema (55); v418 detection work is preserved.

## Runtime changes

- `js/00-core.js` — preserve manual Structure during detector cache invalidation; refine completion state on restore.
- `js/20-selection-annotations.js` — allow manual Add in embedded mode, retain bounded/manual behavior, select active rendering mode.
- `js/40-outline-structure.js` — merge manual and automatic entries safely; interleave manual and embedded rows; share manual editor actions.
- `js/50-references-search.js` — preserve manual entries on automatic refresh; render PDF bookmarks without native page text.
- `js/60-notes-bookmarks-data.js` — Undo restoration remains in the active Structure presentation and preserves manual priority.
- `mathreader.js`, `index.html` — v419 cache busting.

## Regression and evidence

- **Baseline:** all 64 v418 JavaScript suites passed before the change. New embedded-manual test failed before the fix and passed afterward.
- **JavaScript:** **66/66 PASS** on updated source, including the two new Structure tests and existing equation/OCR/export/navigation suites. Four legacy version assertions were updated from 418 to 419; the legacy Structure bound assertion now checks manual-first limiting rather than blindly requiring `slice(...)` in each module.
- **Python and Chromium:** **29/29 test files PASS individually**, including the new Chromium DOM integration test with controlled bookmark coordinates, responsive layout, export UI and hover lifecycle. The large monolithic Python batch exceeded its execution limit; the remaining files were run in isolated steps, and `regression_runner_smoke.py` completed when given a 40-second limit. Therefore **no full monolithic Python batch PASS is claimed**.
- **Syntax:** production JS modules and concatenated assembled ES module pass `node --check`; ZIP integrity and overlay file identities checked.

**Scope distinction:** Chromium UI integration tests used simulated PDF destination metadata, not a user's actual PDF. No original-document Structure ground-truth precision/recall or deployed-site real-PDF acceptance is claimed. Existing Ahlfors OCR evidence reload limitation remains acknowledged.

## Overlay installation (v418 → v419)

Package: **`mathreader_v419_patch.zip`**. The ZIP contains **only changed files**, each under a single `mathreader/` top-level directory. Back up the existing installed MathReader folder (or use Git), then extract this ZIP into the **parent directory containing `mathreader/`**, enabling file overwrite. Leave all other files unchanged. A complete replacement folder, deletion script or relocation step is **not** required.
