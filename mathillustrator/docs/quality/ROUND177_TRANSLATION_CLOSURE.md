# Round 177 — Translation coverage and verified fixes

## Scope
Full static and dynamic 2D editor UI inspection, empty object states, plotted mode options, populated point Properties, 3D mode labels, viewport-responsive switches, historical dialog and arrowhead translations.

## Confirmed defects
1. Empty object/search states were rendered directly into the excluded object-list subtree, so the generic translation pass never translated them. They now use the locale translator at render time.
2. Construction command aria-label is managed outside the generic translation pass and was not retranslated on language changes. Language switching now synchronizes its active plot mode.
3. Active Properties can contain already-translated dynamic controls whose generated text is not reversible by static DOM translation alone. Language switching now re-renders the Properties controls using the selected language.

## Coverage
- Verified current 2D labels/options by comparing 302 scoped DOM elements in English and Chinese. Unchanged strings: brand, language selector, font names, paper formats (intentional).
- Repeated switches: Chinese → English → Chinese → English.
- Browser: 1440, 768, 390, 320 px (empty-state and input labels); 1440 and 768 px (populated Properties, 3D modes).
- Historical browser localization tests R174 and R175: 1440, 768 and 390 px.
- Node regressions: 586 passed; JS syntax passed.

## Not certified
Uncommon runtime errors, every construction dialog under every tool mode, full historical Chromium collection, physical touch devices, and hosted deployment. The sweep substantially reduces known UI gaps but cannot prove no future state can produce an untranslated string.
