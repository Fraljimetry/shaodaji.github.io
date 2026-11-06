// v366 sidebar defaults and annotation-reveal contract (zero-network/source-level).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const core = read('js/00-core.js');
const annotation = read('js/20-selection-annotations.js');
const runner = read('js/70-command-ui-runtime.js');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks += 1; }
check(/<main class="reader-shell" id="reader-shell">/.test(html), 'fresh desktop shell starts with both sidebars visible');
check(/shell\.classList\.remove\('left-collapsed', 'right-collapsed'\);\s*activatePanel\('outline-panel', false\)/.test(core), 'document load begins with visible sidebars');
check(/shell\.classList\.remove\('left-collapsed', 'right-collapsed'\);\s*}\s*if \(generalPrefs\.rememberActivePanel/.test(core), 'unremembered visibility uses open default');
check(core.includes("shell.classList.toggle('left-collapsed', Boolean(session.ui?.leftCollapsed))"), 'explicitly saved document visibility is respected');
const match = core.match(/const defaults = new Set\(\[([^\]]+)\]\);/);
check(Boolean(match), 'default collapsible set exists');
const collapsed = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
for (const id of ['contents-structure-section','contents-theorems-section','contents-equations-section','contents-bibliography-section'])
  check(!collapsed.includes(id), `${id} defaults expanded`);
check(collapsed.includes('contents-annotations-section'), 'left annotations initially collapsed');
for (const id of [...html.matchAll(/<section class="workspace-section[^\"]*" id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith('contents-')))
  check(collapsed.includes(id), `right ${id} initially collapsed`);
check(core.includes('Object.prototype.hasOwnProperty.call(saved, section.id)'), 'remembered individual section choices take precedence');
check(/annotations\.push\(item\);[\s\S]{0,420}expandWorkspaceSection\('contents-annotations-section'\);/.test(annotation), 'annotation creation expands left annotations');
check(annotation.includes("if (type === 'margin') autoOpenRightSection('annotations-section');"), 'existing margin-note right-side behavior retained');
check(!/function addSelectionAnnotation[\s\S]*?expandWorkspaceSection\('contents-annotations-section'\)[\s\S]*?activatePanel\(/.test(annotation), 'annotation reveal does not switch active left tab');
check(runner.includes("setupWorkspaceCollapsibles();"), 'collapse initialization remains registered');
console.log(`OK: ${checks} sidebar default and annotation behavior checks`);
