import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';

test('partial point and curve styles inherit required defaults and survive JSON roundtrip',()=>{
 const d=newDoc();
 const p=append(d,{type:'point',xy:[1,2],style:{pointShape:'cross'}});
 assert.equal(p.style.pointShape,'cross');
 assert.equal(p.style.stroke,d.settings.stroke);
 assert.equal(p.style.fill,d.settings.fill);
 assert.equal(p.style.opacity,d.settings.opacity);
 assert.equal(p.style.pointSize,d.settings.pointSize);
 const q=append(d,{type:'point',xy:[2,3]});
 d.settings.fillByType.circle=true;
 const c=append(d,{type:'circle',refs:[p.id,q.id],style:{linePattern:'dashed'}});
 assert.equal(c.style.linePattern,'dashed');
 assert.equal(c.style.fillEnabled,true);
 assert.equal(c.style.width,d.settings.width);
 assert.equal(c.style.stroke,d.settings.stroke);
 assert.equal(validateDoc(JSON.parse(JSON.stringify(d))).objects.length,3);
});

test('explicit incoming appearance overrides defaults without losing unspecified appearance',()=>{
 const d=newDoc();d.settings.fillByType.circle=true;
 const p=append(d,{type:'point',xy:[0,0]});
 const q=append(d,{type:'point',xy:[3,0]});
 const c=append(d,{type:'circle',refs:[p.id,q.id],style:{stroke:'#ff0000',fillEnabled:false}});
 assert.equal(c.style.stroke,'#ff0000');
 assert.equal(c.style.fillEnabled,false);
 assert.equal(c.style.opacity,d.settings.opacity);
 assert.equal(c.style.width,d.settings.width);
 assert.equal(validateDoc(d).objects.length,3);
});
