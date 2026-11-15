# Round 163 — Bilingual UI audit

## Confirmed defects addressed
1. Reused DOM text nodes and attributes could preserve a previous translation after their content changed.
2. Numeric range hints (`Range: 0–1`, etc.) remained English because dynamic values were not dictionary keys.
3. Tool-specific action instructions in the mode label and canvas accessibility strings stayed English.
4. Several predefined drawing presets, panel toggle titles, interface labels and accessibility labels lacked Chinese entries.
5. Plot component accessibility labels were overwritten with English on mode switches.
6. Dynamic status messages for temporary grid snapping and numerical validation lacked Chinese variants.

## Intentionally untranslated / residual
- Mathematical input placeholders and symbols, raw TeX source, exported content and user-created object names.
- Font family and paper format proper names, plus the language-switcher option `English`.

## Verification limits
Node 566/566 and dedicated real Chromium bilingual sweep at 1440/768/390/320 px passed. A complete historical browser sweep, all construction-dialog pathways, hosted-site verification and GPU stress were not executed.
