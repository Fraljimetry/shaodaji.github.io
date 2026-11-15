# MathReader v440 — conservative bibliography recovery and DOI fidelity

## Confirmed defects fixed

- The single-gap `[n]` recovery could promote a native-text or centered-page bracket token into an invented numeric reference between neighboring keys. Recovery now requires explicit OCR origin, a finite left-margin coordinate, and a plausible damaged numeral glyph. Legitimate anchored OCR `[11]` recovery stays supported.
- DOI metadata extraction stripped legitimate terminal right parentheses from balanced DOI suffixes. Terminal punctuation is now removed without corrupting balanced or nested DOI parentheses.

## Coverage and limits

- Red/green bibliography recovery and DOI parenthesis tests; existing historical `[11]`, bibliography boundary, and no-space key tests retained.
- Synthetic unit fixtures are not real scanned-PDF or Texify accuracy certification. Any external corpus/evidence limitations are reported by V5 separately.
- Bilingual tutorial updated; no changes to OCR model or verification framework.

## Local verification

- V5 full gate: 145 checks; 143 PASS, 0 FAIL, 2 INCOMPLETE (historical export corpus assets unavailable).
- New bibliography recovery: 18 assertions; DOI normalization: 5 assertions.
- Historical bibliography boundary and no-space key regressions passed.
- Real original-PDF campaign and model-backed Texify comparison were not certified.
