import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append} from '../src/model.mjs';
import {exportTikzCd,importTikzCd} from '../src/diagram.mjs';
function diagram(){const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3.5,0],text:'B'});const e=append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});return {d,e};}
test('Round 61: arrowless, harpoon, hooks and line patterns export and import without silently losing styles',()=>{
 for(const heads of ['none','end','start','both','double-end','hook','tail','harpoon'])for(const line of ['solid','dashed','dotted','wavy',...(heads==='none'?[]:[])]){
  const {d,e}=diagram();e.morphismHeads=heads;e.morphismLine=line;e.swap=true;
  const tex=exportTikzCd(d);const recovered=importTikzCd(tex).objects.find(x=>x.type==='morphism');
  assert.equal(recovered.morphismHeads,['double','wavy'].includes(line)?'none':heads,`${heads}/${line} ${tex}`);assert.equal(recovered.morphismLine,line);assert.equal(recovered.swap,true);
 }
});
test('Round 61: harpoon flips with label side; hook uses genuine semicircle and is not replaced by the broken Bezier',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(app,/kind==='harpoon'\?\[swapSide\?-1:1\]/);
 assert.match(app,/visibleArrowheads\(appearance\.line,appearance\.heads\)==='hook'\?hookTailGeometry\(a,b,!!o\.swap\)/);
 assert.match(app,/if\(hook\)item\.append\(el\('path',\{d:hook\.d/);
 assert.doesNotMatch(app,/Q\$\{a\[0\]-dx\/r\*7/);
});
