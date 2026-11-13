# MathIllustrator historical release archive (Cuts 02–25)

Historical release records: **95**; archived tests/scripts: **78**. All original bytes and filenames have recorded SHA-256 digests in `contents.json`.

The active `src/` directory is intentionally **not** archived; current runtime modules remain in place. The archive includes the original cumulative release package manifests, verified browser/Node tests, old release reports, and old snapshots of the central handover docs. This is an audit archive rather than an alternate runtime.

To view historical material, open `release-history.zip`. To temporarily restore the legacy paths in place, use `python mathillustrator/tests/manage_history.py restore --apply` from the website repository root. The tool will not overwrite an existing file. `python mathillustrator/tests/manage_history.py prune --apply` removes only byte-identical files that are preserved in the archive.

The permanent test runner stages the archived tests into an isolated temporary website copy; it does **not** require restoring the original files into your project. `python mathillustrator/tests/manage_history.py test` runs archived and active Node tests; add `--browser` to include the full isolated Chromium suite.

## Cut index

- **Cut 02:** MathIllustrator Cut 02 · Release audit, fixes, regression provenance — `docs/quality/TEST_REPORT_20261112_CUT02.md` inside the archive
- **Cut 03:** Cut 03 — v0.4.0 comprehensive incremental audit, fixes and evidence — `docs/quality/TEST_REPORT_20261112_CUT03.md` inside the archive
- **Cut 04:** MathIllustrator Cut 04 — v0.5.0 adversarial audit and incremental verification — `docs/quality/TEST_REPORT_20261112_CUT04.md` inside the archive
- **Cut 05:** MathIllustrator Cut 05 — v0.6.0 new risk-class audit (2026-11-12) — `docs/quality/TEST_REPORT_20261112_CUT05.md` inside the archive
- **Cut 06:** MathIllustrator Cut 06 — v0.7.0, novel-risk audit (2026-11-12) — `docs/quality/TEST_REPORT_20261112_CUT06.md` inside the archive
- **Cut 07:** MathIllustrator Cut 07 / v0.8.0 — comprehensive control audit (2026-11-12) — `docs/quality/TEST_REPORT_20261112_CUT07.md` inside the archive
- **Cut 08:** MathIllustrator Cut 08 / v0.9.0 — incremental audit and red/green evidence — `docs/quality/TEST_REPORT_20261112_CUT08.md` inside the archive
- **Cut 09:** MathIllustrator Cut 09 / v0.10.0 — publication and interrupted-work audit — `docs/quality/TEST_REPORT_20261112_CUT09.md` inside the archive
- **Cut 10:** MathIllustrator Cut 10 / v0.11.0 — distinct subtle-risk audit — `docs/quality/TEST_REPORT_20261112_CUT10.md` inside the archive
- **Cut 11:** MathIllustrator Cut 11 · v0.12.0 · adversarial audit and implementation evidence — `docs/quality/TEST_REPORT_20261112_CUT11.md` inside the archive
- **Cut 12:** MathIllustrator Cut 12 · v0.13.0 — staged full-function audit, part 1 — `docs/quality/TEST_REPORT_20261112_CUT12.md` inside the archive
- **Cut 13:** Cut 13 (v0.14.0) — Settings and UI state audit — `docs/quality/TEST_REPORT_20261112_CUT13.md` inside the archive
- **Cut 14:** Cut 14 (v0.15.0) — document lifecycle, IME, viewport and storage recovery — `docs/quality/TEST_REPORT_20261112_CUT14.md` inside the archive
- **Cut 15:** Cut 15 · Function-by-function UI audit — 2026-11-12 — `docs/quality/TEST_REPORT_20261112_CUT15.md` inside the archive
- **Cut 16:** MathIllustrator Cut 16 · v0.17.0 — persistence and recovery audit — `docs/quality/TEST_REPORT_20261112_CUT16.md` inside the archive
- **Cut 17:** MathIllustrator Cut 17 · v0.18.0 — export fidelity and mixed-scene repaint audit — `docs/quality/TEST_REPORT_20261112_CUT17.md` inside the archive
- **Cut 18:** MathIllustrator Cut 18 · v0.19.0 — export alpha and typography fidelity — `docs/quality/TEST_REPORT_20261112_CUT18.md` inside the archive
- **Cut 19:** MathIllustrator Cut 19 — v0.20.0: mathematical labels and large-scene UI — `docs/quality/TEST_REPORT_20261112_CUT19.md` inside the archive
- **Cut 20:** MathIllustrator Cut 20 — v0.21.0: dense selection and point-label layout — `docs/quality/TEST_REPORT_20261112_CUT20.md` inside the archive
- **Cut 21:** MathIllustrator Cut 21 — v0.22.0: opt-in semantic diagram routing and manual label placement — `docs/quality/TEST_REPORT_20261112_CUT21.md` inside the archive
- **Cut 22:** MathIllustrator Cut 22 — v0.23.0: interactive arrow-label dragging — `docs/quality/TEST_REPORT_20261112_CUT22.md` inside the archive
- **Cut 23:** MathIllustrator Cut 23 — v0.24.0: automatic morphism-label avoidance (opt-in) — `docs/quality/TEST_REPORT_20261112_CUT23.md` inside the archive
- **Cut 24:** MathIllustrator Cut 24 — v0.25.0: earlier-arrow crossing reduction and export-state reliability — `docs/quality/TEST_REPORT_20261112_CUT24.md` inside the archive
- **Cut 25:** Cut 25 — v0.26.0 · scene-aware diagram routing — `docs/quality/TEST_REPORT_20261112_CUT25.md` inside the archive

## Stable documentation

For current behavior use `../manifest.json`, `../planning/features.json`, `../architecture/OBJECT_MODEL.md`, `../schemas/project-v1.schema.json`, `../quality/REGRESSION_POLICY.md`, `../quality/KNOWN_ISSUES.md`, `../quality/TEST_REPORT_CURRENT.md`, and the live `../../tutorial.html`. The archive is historical evidence and does not supersede these current contracts.
