# ADR-0003 · Homepage and Tools integration is a release prerequisite

**Date:** 2026-11-12 · **Decision:** Accepted for Cut 02.

The GitHub Pages homepage and `tools.html` are static standalone HTML documents. Cut 00 and 01 created `/mathillustrator/` but changed neither root page. A working application directory therefore remained undiscoverable on both entry pages. No application-local file can repair root-page links without editing those pages or introducing an unrelated site rewrite.

The Cut 02 ZIP includes two narrowly scoped exceptions: site-root `index.html` and `tools.html`, with bilingual English/Chinese MathIllustrator links and tutorial navigation. No global site scripts, styles, MathReader sources, or site architecture are changed. Future MathIllustrator code releases return to the normal `mathillustrator/`-only changed-files overlay unless a further site-root integration issue is proven.

Cut 02 is a cumulative overlay of **changes from Cut 00**, so it can upgrade a site containing either Cut 00 or Cut 01. This is necessary because the installation level reported by the user is Cut 00, even though Cut 01 was delivered. It deliberately avoids shipping the entire website or replacing untouched MathReader files.

**Risk:** The root HTML pages are based on the uploaded `shaodaji.github.io.zip` baseline. The user must review overwrite conflicts if the live site has meanwhile changed. The public deployment is not confirmed merely by generating the ZIP; a GitHub Pages publication step is required. A direct headless browser HTTP check was attempted but blocked by the sandbox's navigation policy. `tests/site_integration.py` verifies link targets and file presence statically.

## Cut 07 amendment — discoverability, not just link existence

The site had MathIllustrator links since Cut 02, but they were visually secondary: the software cards appeared **below** the About section and inherited a three-column grid although only two independent tools exist. The old static check asserted only link presence, which was insufficient to catch prominence and layout problems.

**Decision:** Keep the personal homepage intact while moving Mathematical software immediately below the featured equation, before About. Present MathReader and MathIllustrator in equal-width, responsive cards with distinct decorative previews, accurate feature/limitation descriptions, an Illustrator tutorial link, and separate tool links near the hero introduction. The dedicated Tools page obtains stable `#mathreader` / `#mathillustrator` anchors. These are website-root integration exceptions; no changes to MathReader, site-wide CSS/JS, or other academic pages.

**Safety/compatibility:** Homepage CSS is strictly scoped to `.software-*` and `.hero-tool-links`; site theme/locale continue through existing `data-en`/`data-zh` bindings and CSS variables. MathIllustrator is identified as an evolving 2D editor (not 3D-ready). The existing MathReader feature SVG is reused, not duplicated in the overlay; the preview requires `assets/img/tool-mathreader-file-search.svg` from the existing site. Because `index.html` and `tools.html` are full HTML files, their replacement can overwrite recent user edits; always review before deployment. Browser checks use original site stylesheet/script plus isolated `set_content` rather than hosted HTTP navigation.

**New release gates:** `tests/site_integration.py` validates placement, unique card counts, links and asset references. `tests/browser_site_home.py` renders desktop/mobile × English/Chinese and toggles dark theme, checking no horizontal overflow. Check routes explicitly after GitHub Pages deployment; browser tests do **not** verify CDN cache, service worker, MIME, cross-browser support or real network navigation.
