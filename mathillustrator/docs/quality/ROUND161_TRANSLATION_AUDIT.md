# Round 161 Chinese translation audit

Source audit of `index.html`, `src/app.mjs`, and `src/i18n.mjs` (local assembled baseline). These are observed dictionary gaps, not a claim that every execution path was exercised.

| English source text | Context | Round 161 disposition |
| --- | --- | --- |
| `t min`, `t max` | 2D parametric and polar limits | Added `t 下界`, `t 上界` |
| `Mesh detail` | 3D Settings | Added `网格精度` |
| `View yaw (°)`, `View pitch (°)` | 3D camera Settings | Added translations |
| `Image export options` | Accessibility group name | Added translation |
| `Drawing preset` | Hidden preset label | Added translation |
| `Load other tab`, `Keep this tab` | Multi-tab save conflict actions | Added translations |
| `Another tab changed this project.` and its autosave warning | Conflict banner | Added translations; verify actual conflict UI separately |
| `3D rendering failed · previous view preserved` | Render status | Dictionary entry added; status container is currently excluded from `localizeUI`, therefore still needs explicit translation at write time |

Pending dedicated interactive audit: error/toast messages composed from English exceptions; runtime-generated descriptive object subtitles; exact 3D render-failure UI; and untranslated instructions produced dynamically. Symbols and mathematical expressions are intentionally not translated.
