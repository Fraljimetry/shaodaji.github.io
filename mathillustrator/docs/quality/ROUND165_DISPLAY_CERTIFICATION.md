# Round 165 — display regression gap closure

Source: authoritative 2026-11-15 ZIP with overlays 159–164, then Round 165 edits. Local isolated Chromium fixture; **not deployed-site verification**.

## Confirmed root cause and fix

A generic rule for editable `input[type=text]` was unintentionally matching numeric-expression fields after Round 161 replaced `type=number` with `type=text`. Thus numeric `Resolution` expanded to 100% width while `Color scheme` and `Label` remained aligned in the right column. Exclude `[data-numeric-expression=true]` from both full-width text-editor selectors. Preserve true string/expression editors as designed. Real Chromium Round 152 alignment checks pass at 1440, 768, 390, 320 (domain-coloring populated on desktop).

## Historical regression repairs (tests only)

- Round 138: match current localized opacity label rather than removed surface-opacity label.
- Round 150: point `Width` deliberately removed; compare `Size` against `Opacity`, assert absent Width.
- Round 152: match shortened `Label` and `Resolution` with exact direct label text, avoiding `Label format` ambiguity.
- Round 153: find expression-capable numeric controls by their stable semantic attribute, not `type=number`.
- Round 156: same semantic numeric selector repair.

## Executed verification

- Node: 566/566, zero failed/skipped.
- Syntax: app.mjs, i18n.mjs passed.
- Chromium: R138 1440/768/390/320; R150 1440/390/320; R152 1440/768/390/320; R153 paired 1440/390/320; R156 1440/768/390/320 (four PASS lines produced but the enclosing batch exceeded its execution limit); R161 1440/390; R164 1440/1024/768/390/320.
- New R165: 1440/768/390/320 × both languages and themes; all five 2D plot modes; desktop all five 3D plotting modes; populated desktop point Properties; import/export dialogs open and close; no JS exceptions; no detected panel text/control overflow.

## Still not certified

Not all historical browser scripts were run, nor every construction-tool dialog and populated object type. Mobile test uses real Chromium but certain collapsed controls are exercised by dispatched DOM change events, not physical panel interactions. Floating panels, device font zoom, pixel-diff screenshots, real 3D GPU load, browser memory stress, and hosted deployment are not covered. No blanket claim of complete display certification.
