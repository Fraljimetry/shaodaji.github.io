# Reusable offline PDF regression runner (v354)

The application is **not** coupled to this tool: no OCR preloading, network
requests, PDF.js changes, runtime model calls, recovery mechanisms, or detection
heuristics were introduced. Run this locally from the repository root. Cache
and report directories are created outside the website source whenever you
supply external paths.

## Requirements

- Python 3.10+ and `PyMuPDF` (`python -m pip install pymupdf`)
- Node.js 18+ to execute source-level probes using the actual (unmodified)
  `js/41-equations-bibliography.js` functions
- Tesseract only for **plain-text proxy OCR**, not formula image-to-LaTeX;
  select `--ocr none` to skip it deliberately
- `mathjax-full` in Node's module search path to compile **provided** formula
  LaTeX with `--formula-candidates`; missing dependency fails explicitly
- Offline only: the runner never downloads PDFs, OCR models or packages

## First run on 50 original PDFs

```bash
python mathreader/regression_tools/run.py \
  --corpus-dir /path/to/original-pdfs \
  --max-files 50 \
  --cache-dir /path/to/persistent-cache \
  --out-dir /path/to/audit-first \
  --workers 3 --ocr selected --ocr-workers 3
```

Replace `/path/to/...` with your real paths. On Windows PowerShell use a
single line, or use backticks as continuation characters. You may supply
`--manifest mycorpus.json` instead of `--corpus-dir`; `documents` array entries
contain `path`, optional expected `sha256`, optional `discipline`, and optional
`source_era`. The manifest can use relative paths resolved against its parent.
A hash mismatch or duplicate original PDF **stops the run**; renamed copies
do not inflate corpus size.

On v354, a fully cached extraction pass does not spawn PDF worker processes,
and a fully cached detector pass does not start Node. Each PDF is still freshly
SHA-256-hashed and caches are checked against the original extraction version,
schema and source fingerprint. Mixed hit/miss runs process only the missing PDFs;
cache-miss subprocess failures remain visible and stop the run. This is an
execution optimization, **not** a change to detector results or acceptance.

Rerun the exact command with the **same** cache directory and a different
`--out-dir`. Extraction, detector outputs and successful OCR transcripts are
reused. A changed PDF hash invalidates that document's cache. Updated JS
detector source invalidates detector results only; changed OCR settings or
Tesseract version invalidates OCR results only; extraction schema or PyMuPDF
version invalidates cached text/geometry. Do not delete the persistent cache
between campaigns unless intentionally forcing fresh measurements.

## OCR scope: explicit, not hidden

- `--ocr none`: fastest native-text/parser checks; all image OCR is UNVERIFIED.
- `--ocr selected` (default): one crop per PDF, selected heuristically from
  native text; if no plausible formula is available, a full-page **fallback
  sample is explicitly labeled as unverified**, not claimed to be a formula.
- `--ocr low-text`: selected crop and whole pages with fewer than 30 native
  characters; downstream browser OCR remains UNVERIFIED.
- `--ocr all`: selected crop and every original page, useful when an entire
  scan is to be assessed. This can be expensive: choose the explicit budget.

`--max-ocr-pages 100` is the default *maximum*, never an implicit claim that
all page OCR is complete. Any overflow is logged as deferred page numbers.
`--ocr-dpi`, `--ocr-language`, `--ocr-psm`, `--ocr-timeout`, and `--ocr-workers`
control the proxy. `OMP_THREAD_LIMIT=1` prevents Tesseract CPU oversubscription.
Failures and timeouts are reported, never converted into empty-pass results.

## Paired formula LaTeX compilation

Actual Texify outputs are **not available to this offline runner**. To compile
raw LaTeX that you obtained independently (e.g. from a real browser Texify
session), provide a sidecar:

```json
{
  "cases": [
    {"id": "p3-crop1", "sha256": "<the original PDF SHA-256>",
     "page": 3, "provenance": "actual-browser-Texify-output",
     "latex": "\\begin{aligned}x_{i&=j}&=1\\\\y&=2\\end{aligned}"}
  ]
}
```

```bash
python mathreader/regression_tools/run.py \
  --manifest mycorpus.json --cache-dir /path/to/persistent-cache \
  --out-dir /path/to/with-formula --ocr none \
  --formula-candidates formula-candidates.json
```

The runner uses real v352+ MathReader LaTeX stabilization functions and real
MathJax compilation, checking error nodes as well as thrown exceptions.
Every case keeps raw LaTeX, processed LaTeX and compile status. Its provenance
is user supplied: the program **cannot attest** that a sidecar actually came
from Texify. Source-faithfulness, page/crop matching and mathematical meaning
still require independent human-reviewed ground truth. Compilation is **not**
recognition accuracy.

## Outputs and acceptance

- `audit.json`: per-PDF SHA-256, page counts, extraction/cache metrics, selected
  formula crop and provenance, native-source detector probes, OCR proxy calls,
  deferred pages, and explicit UNVERIFIED end-to-end statuses.
- `manifest.json`: all original paths and hashes, for intentional reruns.
- Local persistent cache: gzipped per-page geometry keyed by original PDF
  hash/schema, source-level detector summary keyed by detector source hash,
  OCR transcript keyed by original hash+page+crop+engine/version/settings.
  No original PDF bytes are copied into the cache or release patch.

The source-level parser probe checks *every page's extracted native text* using
selected actual MathReader functions. It does **not** reconstruct final PDF.js
Structure, Results, Equations, Bibliography, OCR recovery, navigation, or
browser-rendered MathJax. Raw equation-label candidates are not the finished
Equation index. This tool can speed repeatable regression preparation, but
fully verified acceptance still requires the real application, actual Texify,
whole-document ground truth, scanned/handwritten accuracy, and unresolved error
tracking under `REGRESSION.md`. No file is automatically classified PASS.

## Test

```bash
python mathreader/tests/regression_runner_smoke.py
node mathreader/tests/maintenance_integrity_regression.js
```

The smoke test verifies genuine extraction/detector reuse, invalidation on a
changed PDF, hash-mismatch/duplicate rejection, and source-linked MathJax
compilation. Its generated PDFs are temporary and not product accuracy tests.

## v355 P0 continuous reliability gate

For the new independently verified golden-corpus plus real Chromium acceptance
pipeline, see [`P0_ACCEPTANCE.md`](P0_ACCEPTANCE.md). Run
`python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir /path/to/report`.
This extends the existing cached *offline proxy* but **does not replace** it or
claim proxy/browser equivalence. Browser indexing requires the exact
`pdfjs-dist@4.10.38` assets. Model recognition requires real Texify; synthetic
or Tesseract-only outputs must remain UNVERIFIED. All tests run locally and
only generate reports outside the deployed application.


## v357 — Additional real P1 browser acceptance

Use `p1_browser_e2e.py` (or `p0_gate.py --p1-source-pdf ... --p1-target-pdf ... --require-p1-real`) for the real two-PDF Chromium/IndexedDB/PDF.js link-and-return scenario. It requires local pinned `pdfjs-dist@4.10.38` assets and two byte-distinct original PDFs, one with numbered bibliography entries. Without those exact assets, it reports BLOCKED. The normal cached parser runner does not test real P1 navigation; test-only `p1_browser_probe.js` is never used by the production application.

## v358 version and paired P0/P1 audit provenance

The offline runner reports the **actual tested application's bootstrap version** when present. This corrects the previous hard-coded v354 audit version; `infrastructure_origin` still identifies the tool's history. Test fixtures with no bootstrap report `UNKNOWN`. The v358 regression reused 110 original PDFs and 15 manually transcribed, source-page-linked LaTeX references. Tesseract remains a text-only proxy; only actual browser/PDF.js + Texify and independent ground truth can close P0/P1 acceptance.

## v359 acceptance-gap corrections

The P0 real-browser runner now decouples PDF.js indexing from actual formula-model inference. Pass `--pdfjs-build` for genuine `pdfjs-dist@4.10.38` and `--formula-cases` to obtain SHA-256-attested browser PDF crops, even without Texify network permission; those crops are **not** OCR results. Only explicit real Texify inference, compilation, independent approved LaTeX, and whole-document reviewer coverage can contribute to full P0 formula acceptance.

P0's per-document *execution status* no longer excludes failed formula cases, navigation or persisted reopen. Its strict truth gate rejects NaN/Infinity performance evidence. Real P1 browser assertions now fail even if the first assertion fails; missing pinned PDF.js remains BLOCKED. The new P0/P1 gap-regression tests exercise these negative paths without substituting a fake PDF engine for full acceptance. For actual acceptance, use the real PDF.js distribution in `node_modules/pdfjs-dist/build` (version exactly `4.10.38`) when available, passed explicitly with `--pdfjs-build`; do not use an alternate renderer to claim equivalence.
