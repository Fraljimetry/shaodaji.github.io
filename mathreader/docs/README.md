# MathReader documentation

The `mathreader/` root contains the application and the [current regression policy](../REGRESSION.md). Historical documentation is grouped by purpose rather than mixed with production files. The documentation-only relocation originated in v414; the **current application version is v424**, with reliable local-column equation tags and the v419 manual Structure additions alongside embedded PDF bookmarks; the v418 numbering and v417 nonblocking OCR fixes remain in place.

## Where to look

| Area | Folder | Key documents |
|---|---|---|
| Recent regression policy and release evidence | [REGRESSION.md](../REGRESSION.md) | v424–v415 current findings, v414–v405 archived entries, and standing rules |
| OCR recognition | [ocr/recognition](ocr/recognition/) | [Recognition audit v384](ocr/recognition/OCR_AUDIT_v384.md), [historical audit v394](ocr/recognition/OCR_HISTORICAL_v394.md), [appendix Results v395](ocr/recognition/OCR_APPENDIX_RESULTS_v395.md) |
| OCR controls and navigation | [ocr/navigation](ocr/navigation/) | [Navigation v386](ocr/navigation/OCR_NAVIGATION_v386.md), [context menu v390](ocr/navigation/OCR_CONTEXT_MENU_v390.md) |
| OCR cache and evidence | [ocr/persistence](ocr/persistence/) | [Identity/cache v391](ocr/persistence/OCR_CACHE_v391.md), [reload evidence v404](ocr/persistence/OCR_EVIDENCE_REOPEN_v404.md) |
| Exports | [exports](exports/) | [Raw exports v393](exports/OCR_RAW_EXPORT_v393.md), [coverage v400](exports/EXPORT_COVERAGE_v400.md) |
| Comprehensive audits | [audits](audits/) | [Full v405 audit](audits/MATHREADER_FULL_AUDIT_v405.md) |
| User workflows / feature notes | [features](features/) | [Appendix equation manual operation](features/MANUAL_APPENDIX_EQUATIONS_v405.md) |
| Release manifests | [releases](releases/) | [v424](releases/V424_RELEASE.md), [v423](releases/V423_RELEASE.md), [v422](releases/V422_RELEASE.md), [v421](releases/V421_RELEASE.md), [v420](releases/V420_RELEASE.md), [v419](releases/V419_PATCH_MANIFEST.md), [v418](releases/V418_RELEASE.md), [v417](releases/V417_RELEASE.md), [v416](releases/V416_RELEASE.md), [v415](releases/V415_PATCH_MANIFEST.md), [v414](releases/V414_PATCH_MANIFEST.md), [v405](releases/V405_PATCH_MANIFEST.md), [v384](releases/v384_RELEASE.md) |
| Regression automation | [`../regression_tools/`](../regression_tools/) | [`README.md`](../regression_tools/README.md), [`P0_ACCEPTANCE.md`](../regression_tools/P0_ACCEPTANCE.md) |
| Regression results and machine evidence | [`../regression/`](../regression/) | JSON reports, and [`RESULTS_AUDIT_v408.md`](../regression/RESULTS_AUDIT_v408.md) beside its JSON |
| JavaScript subsystem layout | [`../js/README.md`](../js/README.md) | Module boundaries and maintenance notes |

## Regression history

Older sections from the former 395 KB `REGRESSION.md` are preserved in **original source order**. Some entries were appended later than their version numbers, so the filenames indicate their main scope, not an exhaustive numerical range.

- [v374–v404 primary notes](regression/history/v374-v404.md) — post-release audits, OCR/export and patch history (including v392–v404).
- [v352–v371 notes](regression/history/v352-v371.md) — audits, P0/P1 acceptance policy, formula regression and infrastructure (also v374-related material elsewhere).
- [v343–v351 notes](regression/history/v343-v351.md) — code organization, formula OCR lifecycle, precision and navigation.
- [v339–v342 notes](regression/history/v339-v342.md) — earlier detector and import/export regressions.
- [Earlier records and later addenda](regression/history/legacy-and-followups.md) — v338 records plus subsequently appended v347 and v361–v400 developments.
- [v401–v402 addenda](regression/history/v401-v402-addenda.md) — export and equation-margin OCR persistence observations.

The split is **lossless**: the archived file contents plus the unmodified v414–v405 entries reconstruct the original regression record byte-for-byte. [`layout.json`](layout.json) records exact hashes and source ranges; [`../tests/docs_layout_regression.py`](../tests/docs_layout_regression.py) verifies them.

## File conventions and safe migration

- Keep new behavioral/verification findings in `../REGRESSION.md` and move older records into topic or historical folders periodically. Never replace historical evidence with a success summary.
- Prefer a **topic folder** for related operational notes, a versioned release manifest in `releases/`, and JSON measurements next to the related corpus in `../regression/`. Avoid a separate file for every minor test run.
- Paths printed in historical manifest text (for example `mathreader/OCR_*.md`) describe the **original patch layout**, not a current hyperlink. Use this map to locate the relocated file. No production runtime or CDN path was changed.
- **Current update distribution (v419+):** use small overlay ZIPs containing only changed paths under `mathreader/`; extract at the parent directory to overwrite the corresponding files. Back up the existing folder or maintain version control first. Do not remove untouched files. Earlier v418 was distributed as a complete-folder ZIP; this is historical and is not the v419 update method.
- **Earlier documentation-only patch:** if instead you applied `mathreader_v414_docs_reorganization_patch.zip` over an existing tree, run `python .\mathreader\docs\apply_moves.py` from the parent directory to remove verified root-level duplicates. A ZIP overlay by itself cannot delete old files.

- [v421: Two-column Structure, Results and Bibliography](releases/V421_RELEASE.md)
