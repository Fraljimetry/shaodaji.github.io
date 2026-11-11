# MathReader v432 — Settings: Content Detection, Display, Formula OCR

Date: 2026-11-11. Baseline: reconstructed v431 (v418 complete + v419–v431 sequential overlay ZIPs). Delivery: changed/new-file overlay, single `mathreader/` top-level folder; do not replace untouched files.

## User-facing changes

1. **Settings → Content Detection** is the fourth settings group. It offers three *view-only* controls: show all or numbered-only Results, show/hide proof and corollary relationship chips, and filter indexed equations by existing confidence tier (all/high/medium/review). The equation setting is synchronized with the existing Equations panel filter. The item-count badge continues to represent the **total indexed entries**, rather than the number currently shown. Reset filters restores the default complete view. These controls never erase detected entries, change detector thresholds, or modify annotations.
2. Two explicit detection actions: **Rebuild Results & Bibliography** reruns the existing mathematical structure index (when PDF native text is available); **Scan equation margins** invokes the existing optional local page-image OCR. Neither starts automatically on settings changes. Image OCR can be expensive and can still make errors. Unnumbered Results hidden by the display filter remain in the underlying index and export.
3. **Display** adds a 10/15/20% zoom-button step. It changes the existing zoom-in/out actions, not PDF text/layout detection. The default remains 15%.
4. **Formula OCR** adds first-pass crop padding (tight/default or relaxed) and a checkbox to enable/disable **one** severe-corruption retry (default enabled). A relaxed first pass uses a tight retry if necessary; a tight first pass uses a relaxed retry. The selection is snapshotted per recognition attempt; no uncontrolled repeated inference and no automatic engine switching. Disabling retries never suppresses structural error warnings or the editable LaTeX. Mathematical transcription is still best effort.
5. Preferences are browser-local and validated on load. Older v431 preferences retain the same visible defaults. No reading-data, equation-index or Structure-index schema change was introduced. The English/Chinese user tutorial has been updated with current limitations and the meaning of view filters versus detection.

## Tests and evidence

- **Red / green:** `tests/settings_content_detection_v432_regression.js` failed against unchanged v431 because Content Detection controls did not exist, then passed against v432. `tests/extreme_formula_retry_v429_regression.js` now exercises both new crop choices and disabled retry, including preservation of severe warnings. Existing v397/v420 cache-assertion fixtures were revised for v432 rather than bypassed.
- **JavaScript:** 80/80 test files passed individually, including the new v432 file. `node --check` for all ten source modules and `mathreader.js` passed. Assembled source syntax was also checked separately.
- **Python/Chromium:** 35/35 test files passed across independent batches/reruns. Initial `appendix_equation_sidebar_browser_v388.py` failed because its isolated VM lacked the newly introduced Settings reference; the isolated harness was updated, and the original large-index test passed. The 176/176 responsive assertions passed. The original `settings_heading_hierarchy_v400.py` now checks four group headings.
- **Browser:** offline Chromium Settings interaction test passed, using production settings HTML/CSS and the actual extracted preference functions/event listeners. It covers persist/restore, reset, no-PDF action guards, explicitly invoked actions, and narrow widths. Isolated **P0 Chromium browser shell PASS**.
- The documented monolithic `p0_gate.py` invocation **exceeded the container execution limit**, so it is **not** claimed as a monolithic PASS. Its source/boundary suites and isolated shell were run separately. No pinned real PDF.js/real Texify complete-document acceptance or independent page-by-page mathematical golden corpus was introduced in v432. No 100% accuracy claim is made.

## Known limits

- Content Detection filters do not improve recall/precision; user-triggered rebuild reruns the **same detector**. Low-confidence entries remain available through the All view. Results/Bibliography still cannot be manually corrected.
- The optional equation-margin scan may be slow and may not recognize image-only or unusual labels. Previously accepted Ahlfors reload OCR-evidence limitation remains unchanged.
- OCR padding may include surrounding prose and cannot restore symbols not recognized by the model; no true Texify inference or numerical accuracy benchmark was performed in this release.
- Live user PDF.js integration, some unusual multi-column selection/copy/export ordering, full-document image OCR coverage and complex diagram OCR remain unverified.

Installation: extract the ZIP at the parent of `mathreader/`, overwriting matching files only. Refresh the page to load v432 assets. No cache deletion, cleanup script, or whole-folder replacement is required.
