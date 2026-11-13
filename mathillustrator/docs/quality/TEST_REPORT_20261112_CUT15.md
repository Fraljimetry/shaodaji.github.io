# Cut 15 · Function-by-function UI audit — 2026-11-12

Release **v0.16.0**, cumulative site-root overlay. Baseline: extracted **Cut 14** ZIP, not an inferred web deployment.

## Confirmed red → green

- On Cut14, a `touch` `pointerdown` using Point immediately created the object. A two-finger interaction therefore could create a ghost point before secondary contact detection. Now touch construction tap is deferred until a single-finger `pointerup` within 10 CSS pixels, provided it remains inside canvas.
- Multi-contact actions cancel a captured pan/point/freehand drag and clear incomplete click-by-click drafts. Contacts originating on the SVG are also cleaned when they release outside the SVG; a second touch on toolbar controls interrupts active drawing. Incomplete touch input does not acquire undo history.
- The true ending position of a pen pan, where no preceding pointermove was emitted, now determines the final viewport. The same final-position check rejects up-only long touch movements as taps.
- Wheel `deltaMode` lines/pages previously shared pixel-unit scaling. Line wheel deltas now use a documented 16 CSS pixel approximation; page deltas use canvas height. Precise behavior across touchpads/Firefox/Safari remains unverified.
- Emulated phone width 390 exposed clipped Export and document horizontal scroll. Header controls now wrap and stage/drawer offsets follow observed actual header height, with larger coarse-pointer targets. Device widths **320, 390 and 700 px** tested in Chromium emulation.

## Evidence matrix

- **Node:** 97/97 (93 inherited + 4 new deterministic storage contract tests).
- **Chromium editor:** 26/26 isolated suites (24 inherited plus new synthetic PointerEvents and mobile emulation), executed in bounded batches.
- **Chromium native mobile emulation:** `has_touch=true`, `touchscreen.tap`, 320 / 390 / 700 px; successful tap, visible Export, no root horizontal scroll; a 390px case exported PNG with valid signature/dimensions.
- **Actual TeX engine:** representative TikZ + tikz-cd `pdflatex` compiler smoke (separately performed as a gate).
- **Website:** original CSS/language script and root homepage/tools pages, eight viewport/language combinations (separately performed as gate).
- **ZIP:** see `cut15-package.json` and the stable `tests/package_integrity.py` entry point, run after fresh extraction.

**Provenance:** Browser tests ran on isolated `page.set_content` with inline application modules because this sandbox blocks `file://`, `http://localhost`, and test HTTPS navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`). Synthetic `PointerEvent`s are not equivalent to physical multi-finger hardware. Mobile emulation is Chromium, not Safari/iOS; injected `blur` is not a real OS suspension. The four new storage tests are mocked coordination and do **not** establish atomic writes between actual tabs. We make **no** general SVG frame-time or rendering-performance improvement claim in Cut 15.

## Deferred stages

1. Verify real origin via deployed or unrestricted local server: Web Locks atomicity, stale tab state and pagehide, real quota / private mode.
2. Physical iOS/Android/stylus testing: palm rejection, second-finger tap near drawers, long press/context menu, coalesced stylus events.
3. Accessibility with screen readers and keyboard-only geometry creation; high-contrast/dark-mode and 200% zoom evaluation.
4. SVG/raster pixel goldens across Chromium/Firefox/Safari; premultiplied alpha, text dimensions, wide-gamut/print fidelity.
5. Large-scene mixed-object memory and full-frame profiling; 152-entry control matrix branch completion.
