# MathReader v400 — Settings hierarchy and full-text export provenance

**Baseline:** the supplied v399 MathReader tree. **Delivery:** root-level patch ZIP, not full replacement.

## Confirmed UI defect

The `Settings` section heading was 12px but its child `Display`, `Formula OCR`, and `Export data` summaries inherited a larger base font. They appeared larger than the parent in the user's 1536px screenshot. The scoped CSS sets panel headings to their existing 12px, child group summaries to 11px, and nested group labels to 10px. No global font-size reduction, layout width change, or visual decoration. Check real Chromium computed sizes at 204, 220, 244, 250, 270 and 330 pixels, light/dark, all groups opened, without overflow. The note wrapping guard remains active.

## What the full-document checkbox actually does

`Include full-document text` includes native PDF.js text items, their original per-item coordinates, page-level text and detector input lines for every page **plus already available OCR evidence**. It does not trigger OCR. It does not embed the original PDF or transcribe images on demand. The option description now explicitly says *PDF text and stored OCR, if available*.

All **seven** supplied full-document exports have actual `fullDocumentText.pages` arrays, one record per PDF page (595/595). They do **not** have a stored full-document OCR cache; `exportLayers.fullDocumentOcr` is `not-stored` and `documentOcr` is null. This is not failure of the checkbox: 585 pages have native text; ten have no native text. Ahlfors p.1 and Giusti p.1 are image covers with no PDF text layer, and the other listed textless pages are blank when inspected in the original PDF. Importing these files will not silently launch an OCR pass.

A `complete: true` fullDocumentText export previously risked being read as *every page recognized*. That property only means **page extraction was attempted and succeeded for every page**. v400 retains this backward-compatible meaning and adds an explicit `nativeTextCoverage` object:

```json
{
  "nativeTextCoverage": {
    "pagesWithText": 167,
    "pagesWithoutText": [1, 7, 11, 169, 172],
    "source": "pdf-text-layer"
  }
}
```

The sample above is Ahlfors (172 PDF pages). A textless page is not automatically *blank* or *OCR failed*: it can be a raster cover, blank page, or diagram. `pagesWithText` is **not OCR accuracy**. Full document OCR requires a separate recognition run and a stored complete cache; the export itself must not start one. Older exports without the coverage object remain importable (the fullDocumentText block was export-only to begin with).

The original seven huge JSONs are **not repackaged**. Provenance, source hashes, and expected counts are in `regression/v400_export_coverage_manifest.json`. To repeat the corpus test with those exact original exports available in one directory:

```bash
MATHREADER_EXPORT_CORPUS_DIR=/path/to/jsons python mathreader/tests/full_text_exports_v400.py
```

When the originals are absent, the script checks the bundled manifest but explicitly says the original-corpus replay was SKIPPED. There is no silent fallback.

## Verification and scope

- `tests/settings_heading_hierarchy_v400.py` — real CSS/markup in Chromium; 12 width/theme cases and nested label hierarchy.
- `tests/full_text_coverage_v400_regression.js` — 12 assertions; text, empty/whitespace pages, extraction failure, no invented OCR, and PDF-switch race. Includes a failing-on-v399 shape check.
- `tests/full_text_exports_v400.py` — hashes and counts of the seven originals when supplied.
- Existing settings-orphan, export checkbox, Stop OCR, equation navigation, appendix Results/Equations, and OCR-cache suites remain unchanged in behavior.

**Outstanding:** The full-document checkbox does not guarantee a transcript for image-only pages. Genuine image-to-text and image-to-LaTeX recognition accuracy, OCR completeness across the whole PDF, and live Texify/Tesseract browser inference remain outside this patch. Do not claim a full-recognition accuracy certification from the PDF.js text export.
