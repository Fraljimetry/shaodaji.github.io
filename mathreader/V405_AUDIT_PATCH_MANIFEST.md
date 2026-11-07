# v404 post-release audit-only patch (campaign v405)

This ZIP is applied at the project root over the fully patched **v404** source tree. It modifies no production MathReader code, CSS or site HTML. The runtime remains v404; this patch only makes the full-corpus audit and regression policy durable.

## Changed / added paths

- `mathreader/MATHREADER_FULL_AUDIT_v405.md`
- `mathreader/REGRESSION.md`
- `mathreader/regression/v405_corpus_integrity.json`
- `mathreader/regression/v405_detector_proxy.json`
- `mathreader/regression/v405_ocr_sample_summary.json`
- `mathreader/regression/v405_saved_link_audit.json`
- `mathreader/regression/v405_suite_results.json`
- `mathreader/regression_tools/corpus_integrity_v405.py`
- `mathreader/tests/corpus_integrity_v405_regression.py`
- `mathreader/V405_AUDIT_PATCH_MANIFEST.md`

The 11 original PDFs and full text exports are external evidence and intentionally absent from the ZIP. Offline Tesseract proxy does not certify browser OCR.
