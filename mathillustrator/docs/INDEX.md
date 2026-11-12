# MathIllustrator documentation index (v0.1)

**Single source of truth:** The executable model in `src/model.mjs` defines actual behavior. `docs/manifest.json` is the machine-readable inventory; `docs/schemas/project-v1.schema.json` documents the native interchange structure; `tutorial.html` is the user-facing capability and limitation reference. When these disagree, fix the discrepancy rather than claiming an unverified feature.

| Directory | Purpose | Edit when |
| --- | --- | --- |
| `architecture/` | Object model, transformations, rendering, persistence, invariants | Core architectural/data contract changes |
| `decisions/` | Rationale and rejected/considered alternatives | A design choice affects later cuts |
| `schemas/` | Versioned machine-readable document definitions | Native JSON compatibility changes |
| `planning/` | Feature matrix and phased plan | Scope/status changes |
| `quality/` | Regression cases, measurements, failures, known issues | Every implementation/debug/performance iteration |

## Repeatable development rule

1. Only develop against the latest source ZIP, never guess a missing project state. Keep MathReader independent.
2. Deliver a **`mathillustrator/`-root overlay ZIP containing only added/changed MathIllustrator files**; no `.git`, unrelated site directories, libraries, or generated artifacts.
3. Update all affected source, tutorial, feature JSON, schemas, and regression/known-issue records in the same cut. Do not scatter flat documentation files.
4. For any bug: reproduce the failure, create a failing regression, repair it, run the regression, and record actual provenance (unit test/browser/manual). Never claim browser/UI testing from source inspection.
5. Investigate subtle second-order cases: stale async updates, duplicate identifiers, cyclic/deleted dependencies, undo/redo with drag and imports, persistence failure or corruption, cancellation, bizarre viewport sizes, huge paths, malformed input, export fidelity, disabled unsupported actions, mobile pointer capture and responsiveness.
6. No silent fallback: if SVG→WebP rasterization fails, report failure; if TikZ cannot represent the scene, disable it; never invent a successful export. Limit unsafe dynamic interpretation of mathematical expressions.
7. Stop/disable a feature when implementation is incomplete instead of presenting it as working. Tutorial and manifest statuses must reflect tested capabilities.

## Relevant root files

- `index.html`, `style.css`, `src/app.mjs`: application UI/controller/renderer.
- `src/model.mjs`: versioned pure geometry/document logic and safe function expression parser.
- `tutorial.html`: detailed practical guide.
- `tests/model.test.mjs`: Node.js built-in test runner; from the `mathillustrator/` directory run `node --test tests/*.test.mjs`.
