import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {exportTikzCd,importTikzCd} from '../src/diagram.mjs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const routing=readFileSync(new URL('../src/diagram_routing.mjs',import.meta.url),'utf8');
test('Round 188: double and wavy allow four elementary heads without rewriting stored heads',()=>{
 assert.match(app,/SIMPLE_DECORATED_HEADS=new Set/);
 assert.match(app,/FREE_CURVE_HEAD_CHOICES=HEAD_CHOICES.slice\(0,4\)/);
 assert.match(app,/decoratedHeads\(item,path,visibleArrowheads\(appearance.line,appearance.heads\)/);
 const d=newDoc();const f=append(d,{type:'freehand',path:[[0,0],[2,1]]});f.curveLine='double';f.curveHeads='both';assert.equal(validateDoc(d).objects.find(x=>x.id===f.id).curveHeads,'both');
});
test('Round 63: hook stays semicircular with reduced radius',()=>{
 assert.match(routing,/radius=Math.min\(5,\(len-2\)\/3\)/);
 assert.match(routing,/ A\$\{radius.toFixed\(2\)\}/);
});
test('Round 63: wavy semantic export is arrowless; double style emits a genuinely headless double shaft',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3.5,0],text:'B'}),e=append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});
 e.morphismHeads='harpoon';e.morphismLine='wavy';let tex=exportTikzCd(d);assert.match(tex,/no head, squiggly/);assert.equal(importTikzCd(tex).objects.find(x=>x.type==='morphism').morphismHeads,'none');
 e.morphismLine='double';tex=exportTikzCd(d);assert.match(tex,/equal/);
});
