import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {readFileSync} from 'node:fs';

test('Round 56: direct is the only new morphism routing default',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[1,0],text:'B'});
 const m=append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});
 assert.equal(m.routing,'direct');
 assert.equal(m.style.width,1);
 m.routing='scene-crossings';
 assert.equal(validateDoc(d).objects.at(-1).routing,'scene-crossings','legacy saved routing remains readable');
});
test('Round 56: old automatic routing cannot affect rendered arrows',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(app,/id='morphism-routing'/);
 assert.match(app,/const mode='direct'; \/\/ Even imported legacy modes/);
 assert.match(app,/const auto=false; \/\/ Round 56/);
 assert.match(app,/routing:'direct',labelDistance:10/);
});
