# MathReader P0 — automated browser + independently verified mathematical acceptance (v355)

This is a **regression tool**, not a reader feature. It does **not** add controls to MathReader, preload Formula OCR, alter PDF extraction, or relax recognition thresholds. `p0_gate.py` is the preferred one-command entry point.

## What P0 does and does not automatically establish

1. `p0_gate.py` runs **all existing JavaScript suites**, source/assembled-module syntax, Python runner tests, and a real Chromium **isolated shell** check (full original module and HTML/CSS, but no PDF.js). It verifies initial no-Texify state, basic controls, and an injected formula-model failure with a correctly released modal. Its injected probe exists **only in a disposable test copy**, never the deployed site.
2. `p0_browser.py` can run **real PDF.js v4.10.38 in a Chromium browser** when its two exact pinned local files are available; it opens the **original PDF**, waits for final Structure/Results/Equations/Bibliography indexes, records page links/counts, verifies page navigation and reopen position, measures load/index time, and captures explicit formula-image OCR from source-linked, browser-rendered original-PDF page rectangles. It reports failures and incomplete stages instead of substituting native-text proxies for the actual engine.
3. `p0_ground_truth.py` compares those browser captures to **independently, wholly reviewed** original-page truth. It rejects missing pages/categories, wrong PDF SHA-256, missing OCR crops, insufficient engine provenance, malformed LaTeX, missing/extra/duplicate/mislocated entries, stale captures, and navigation/persistence gaps. It produces `p0_audit.json` and `p0_report.md`.
4. A formula that merely renders/compiles **is not verified as correctly transcribed**. Per-crop symbol/structure correspondence requires an independent human-approved original-page source. The comparison uses conservative normalized *literal* LaTeX matching; mathematically equivalent alternative LaTeX may require human approval, not silent equivalence detection.
5. A genuine whole-PDF **PASS — Fully verified** requires the complete independent reviewer record **and** actual browser evidence. **FAIL** indicates a reproduced known error; **UNVERIFIED** includes missing or partial ground truth, unavailable real PDF.js/Texify, incomplete indexes, untested model inference, and deferred OCR. **EXCEPTION** is reserved for a documented demonstrably human-illegible source, not an execution timeout. Do not promote any of these to PASS merely because automated suites pass.

## Requirements / offline dependency policy

From the repository root (`mathreader` is the project subfolder):

- Python 3.10+, PyMuPDF, Playwright (`pip install playwright`). Use an installed Chromium binary. In a normal desktop environment install one with `playwright install chromium` if necessary; the runner accepts `--chromium-exe` for an existing binary.
- Node.js 18+ and installed MathJax for the existing syntax tests. `p0_browser.py` optionally accepts a **local** `tex-chtml.js` script as `--mathjax-js`.
- For **real PDF browser acceptance**, obtain the site's **exact currently pinned** `pdfjs-dist@4.10.38/build/pdf.min.mjs` and `pdf.worker.min.mjs`. Supply their containing directory as `--pdfjs-build`. The runner will refuse to replace them with a mock engine. Pinned assets are **not** bundled in this small code patch.
- Formula-image inference uses MathReader's **actual Texify path**. For an explicitly requested formula batch, supply reviewer-selected original PDF page rectangles with `--formula-cases`. The runner renders each rectangle using the actual loaded PDF.js page, saves its PNG evidence outside the package, and records its SHA-256. Do not substitute an unrelated image crop. Network/model downloading is disabled by default; add `--allow-texify-network` only when the intentional real model-runtime/model requests are available and permitted. Missing model assets remain UNVERIFIED.
- Keep original PDF bytes, screenshots, OCR model files, test caches, browser captures, and any sensitive reading data **outside deployment ZIPs**.

## One-command code + isolated Chromium shell gate

```bash
python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir /path/to/p0-gate
```

This command tests source and UI behavior automatically. It does **not** claim real PDF/browser recognition. To make unfinished mathematical acceptance a nonzero gate add `--require-p0-full`; that remains INCOMPLETE until a verified corpus is supplied.

## Full real-browser corpus + golden comparison

First, prepare a **user-owned** JSON manifest containing exact PDFs and optionally reviewed truth. Paths are relative to the manifest directory or absolute:

```json
{
  "schema": 1,
  "documents": [
    {
      "id": "paper-1", "path": "originals/paper1.pdf",
      "sha256": "<64 lowercase hex digits of original PDF>", "pages": 12,
      "ground_truth": {
        "reviewer": "<independent reviewer>", "reviewed_at": "2026-11-05",
        "reviewed_pages": [1,2,3,4,5,6,7,8,9,10,11,12],
        "complete_categories": ["structure","results","equations","bibliography","formulas"],
        "formula_reviewed_pages": [1,2,3,4,5,6,7,8,9,10,11,12],
        "original_page_evidence": "<review notes/page images and their provenance>",
        "indexes": {
          "structure": [{"title":"Introduction","page":1,"ratio":0.12}],
          "results": [{"label":"Theorem 1.1","title":"...","page":3,"ratio":0.25}],
          "equations": [{"label":"(1.1)","page":3,"ratio":0.50}],
          "bibliography": [{"label":"[1]","title":"...","page":11,"ratio":0.40}]
        },
        "formulas": [{"id":"paper1-f1","page":3,"crop_sha256":"<64 hex digits>","latex":"x^2+y^2=1"}]
      }
    }
  ]
}
```

**Example only.** No output of a local detector, OCR engine, or existing index should be copied into these fields and called independent truth without human comparison to the original page. For a source document containing no items in a category, use an empty array only after checking **every page**. If every page was independently reviewed and contains **no formulas**, `"formulas": []` requires no Texify inference; it is not an excuse to avoid checking formula-bearing pages.

Run:

```bash
python mathreader/regression_tools/p0_gate.py \
  --source-root mathreader \
  --manifest /path/to/pilot/manifest.json \
  --pdfjs-build /path/to/node_modules/pdfjs-dist/build \
  --mathjax-js /path/to/mathjax/es5/tex-chtml.js \
  --out-dir /path/to/p0-full \
  --require-p0-full
```

Without reviewed truth, the runner still generates genuine browser capture evidence, but the result stays **UNVERIFIED**. Missing pinned PDF.js assets produce an explicit **BLOCKED** preflight and per-document UNVERIFIED captures; they do not silently fall back to a mocked PDF.js.

For approved formula regions, the optional sidecar identifies the **original PDF page** and a bounding box in PDF.js viewport coordinates at scale 1 (points measured from the **top-left** of the rendered page). The optional expected hash protects a previously reviewed crop against changes:

```json
{
  "cases": [
    {"id":"paper1-f1","pdf_sha256":"<original PDF hash>","page":3,
     "rect_pdf_pt":[45,120,310,155],"scale":2,
     "expected_crop_sha256":"<optional previously reviewed PNG hash>"}
  ]
}
```

The browser renders the original page and crops this rectangle itself, verifies the PNG hash in Python, and saves the PNG under `browser-documents/browser_formula_crops/` (outside the deployable ZIP). A reviewer must approve that exact crop, record its SHA-256 and LaTeX in the independent ground truth, and verify the entire document's formula coverage before declaring full PASS. An `expected_crop_sha256` is recommended for an already-approved golden. Real inference can require substantial loading time. Formula cases are not automatically inferred or silently OCR'ed from the full paper.

## Reporting and limits of the first v355 run

- The initial v355 infrastructure/code/browser shell gate passes locally. The Chromium shell checks are genuine browser DOM checks but run without real PDF.js/PDF page geometry and with an **explicit injected offline failure**. They are **not** production OCR acceptance.
- An eight-PDF pilot (540 pages) was SHA-256 validated and processed by the existing offline parser/Tesseract proxy with no execution failure. The **true PDF.js browser** pilot was blocked by unavailable pinned browser engine assets in this container. All eight P0 whole-document classifications therefore remain UNVERIFIED; no independent complete original-page mathematical ground truth was introduced.
- Historical scanned and handwritten formula recognition, WebGPU→CPU actual model fallback, PDF.js exact location accuracy, all-page image OCR, live navigation/persistence and deployed-browser acceptance remain to be verified with actual assets and original-page review.

## Maintaining P0

Do not turn off expensive checks to make a report green. Keep a small human-verified golden corpus and a large unverified stress corpus, preserve the hashes and all open errors, rerun both text and formulas after every relevant source change, and distinguish isolated UI fault injection from real Texify/production execution. Future PDF regression additions must continue to include paired formula evidence from those same PDFs. Mathematical detections cannot be self-certified from earlier MathReader output.
