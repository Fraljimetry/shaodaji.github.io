# MathIllustrator documentation index — v0.26.1 / Cut 25 maintenance

This directory is the source of truth for what MathIllustrator **actually** implements and has verified. Browser-first 2D mathematical diagrams and mathematical figure editing are the current product; true 3D, full symbolic geometry and PDE-driven visualization remain longer-term ambitions, not implemented tools.

## Read in this order

1. [manifest.json](manifest.json): release, stable source entry points and delivery contract.
2. [planning/features.json](planning/features.json): structured feature-by-feature implementation/partial/unsupported truth (75 features in this baseline).
3. [architecture/OBJECT_MODEL.md](architecture/OBJECT_MODEL.md) and [schemas/project-v1.schema.json](schemas/project-v1.schema.json): source-of-truth editable objects, dependencies, v1 JSON import rules.
4. [../tutorial.html](../tutorial.html): user-facing instructions and honest limitations; must match shipped UI.
5. [quality/KNOWN_ISSUES.md](quality/KNOWN_ISSUES.md) and [planning/ROADMAP.md](planning/ROADMAP.md): outstanding issues, measured limits and planned work.
6. [quality/REGRESSION_POLICY.md](quality/REGRESSION_POLICY.md), [quality/regression-cases.json](quality/regression-cases.json), [quality/performance.json](quality/performance.json): adversarial test policy and current accumulative quality evidence.
7. [quality/TEST_REPORT_CURRENT.md](quality/TEST_REPORT_CURRENT.md) and [quality/package-files.json](quality/package-files.json): last verified state, installed-file integrity.
8. [history/INDEX.md](history/INDEX.md): original Cut 02–25 reports, tests, historical package manifests and handover snapshots, preserved byte-for-byte in one ZIP with exact checksums.

## Executable architecture

`src/model.mjs` owns validation, commands, dependencies and v1 JSON semantics. `src/geometry.mjs` and `src/plot.mjs` own supported geometry/plot computation; `src/diagram*.mjs` and `src/morphism_label_layout.mjs` own semantic diagrams, label placement and bounded routing. `src/anchor_index.mjs`, `src/label_layout.mjs`, `src/plot_cache.mjs` and `src/storage.mjs` support interactive behavior. `src/app.mjs` coordinates view, state, gesture and rendering. This maintenance revision deliberately does not change these runtime files.

No module may silently invent unsupported mathematical semantics; preserve document identity, abort/undo invariants, import/export disabled states, long-scene work limits, malicious input handling and recoverable storage. No MathReader application files should ever be changed as a side-effect.

## Test provenance / file lifecycle

`python mathillustrator/tests/manage_history.py verify` checks active + archived files; `... self-test` fault-injects cleanup/restore into a disposable copy; `... test` reconstructs historical tests in a **temporary** site copy, then executes Node/syntax/integration/TeX. `... test --browser` additionally runs the 45 historical/current browser scripts against isolated inline-modules Chromium. Real hosted navigation, all browser engines, physical input and genuine same-origin multi-tab arbitration are not certified by this setup.

Never label unrun tests PASS, silently drop earlier regression coverage, or delete old files merely because they were renamed. An overlay ZIP cannot remove superseded files. For a safe post-overlay cleanup run `... prune` for preview, then `... prune --apply`; this checks historical SHA-256 before deleting and is reversible with `... restore --apply`. Legacy archives never replace the live feature/schema/issue records. To publish the smaller directory on GitHub Pages, stage and commit verified deletions after cleanup; an overlay ZIP cannot express deletions.

## Future releases

Maintain a **stable set of filenames**: update `TEST_REPORT_CURRENT.md`, `package-files.json`, `regression-cases.json`, `performance.json`, `KNOWN_ISSUES.md`, `features.json`, `ROADMAP.md`, `tutorial.html`, and any affected source/tests. Append newly retired evidence to `history/release-history.zip` (archive naming may be changed as it grows) and update `history/contents.json` as one managed archive. Add actual feature-domain tests instead of indefinitely growing `cutNN` script families. Regenerate the active SHA inventory only *after* all other new/modified files are final. Preserve archive provenance and test round-trips. Deliver only changed/new website-root-relative `mathillustrator/` paths plus root-site navigation files **only when they must change**.

## Recent historical milestones

Cut 07 introduced full control/feature inventory and improved document-boundary and import constraints; Cut 11 added label wrapping, world/viewport fitting, high-precision coordinate display, anchor indexing and plot-resolution safety; Cut 25 added opt-in `scene-crossings` routing across at most 48 drawable arrows. Their exact reports and tests are in [history/INDEX.md](history/INDEX.md); all earlier cut paths can be restored without reinstalling obsolete overlays.
