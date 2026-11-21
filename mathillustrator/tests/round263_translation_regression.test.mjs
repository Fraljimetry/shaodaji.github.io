import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translated} from '../src/i18n.mjs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const required=['Expression','Color','Step','Value','Show border','Locked — unlock in the three-dot menu.','Locked (including dependencies)','Transformation amount','Length expression','Angle (radians) expression','Derived side: edit the parent construction to change this edge.','Slider changed. Reopen its menu.','Unlock slider and dependent objects before deleting.'];
test('Round 263: all recently introduced Properties fields and lock hints are bilingual',()=>{
 for(const term of required){assert.ok(app.includes(term),`source field missing: ${term}`);assert.notEqual(translated(term,'zh'),term,`missing Chinese localization: ${term}`);assert.equal(translated(term,'en'),term);}
});
test('Round 263: formula symbols and user-defined object strings are never localized',()=>{
 for(const term of ['f(x)','F(z)','Circle(Point 10, Point 2)','A = (2, 3)','Student-defined Foo'])assert.equal(translated(term,'zh'),term);
});

test('Round 263: runtime animation errors have a localized prefix',()=>{assert.match(translated('Animation stopped: a value failed','zh'),/^动画已停止：/);});
