# Round 169 — Polar checkbox wording

- Restored the parametric plot checkbox from “Polar” to “Use polar coordinates” (Chinese: “使用极坐标”), including its accessible name.
- Changes are limited to the Properties presentation; polar plotting behavior is unchanged.
- Verification: `node --check src/app.mjs` passed; `node --test tests/*.test.mjs` passed 568/568, 0 failures; local Chromium rendered English and Chinese labels correctly at 1440 px.
- Chromium 390 px test was attempted but did not finish within the available time; it is **incomplete**, not a pass. The hosted site was not tested.
