import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,addPoint,command,clone,validateDoc,createResolver,position} from '../src/model.mjs';
import {smoothPath,worldBounds,pageRect,arrowCurve} from '../src/geometry.mjs';
import {importTikzCd,exportTikzCd,canExportTikzCd} from '../src/diagram.mjs';

test('v0.1 JSON remains compatible with v0.2 extended defaults',()=>{const d=newDoc();delete d.settings.snapAnchors;delete d.settings.showLabels;delete d.settings.exportRegion;const restored=validateDoc(d);assert.equal(restored.settings.snapAnchors,true);assert.equal(restored.settings.exportRegion,'viewport');});
test('ellipse, cubic Bézier and angle are typed live constructions',()=>{const d=newDoc();for(const name of ['A','B','C','D'])command(d,`${name}=(${name.charCodeAt(0)-65},1)`);for(const call of ['Ellipse(A,B)','Bezier(A,B,C,D)','Angle(A,B,C)'])assert.equal(validateDoc(d).objects.length+1,(command(d,call),validateDoc(d).objects.length));});
test('semantic nodes and morphisms move live and reject point references',()=>{const d=newDoc();const a=command(d,'A=Node(0,0,"A")'),b=command(d,'B=Node(3,0,"B")');const edge=command(d,'Morphism(A,B,"f")');assert.deepEqual(createResolver(d).points(edge),[[0,0],[3,0]]);a.xy=[2,2];assert.deepEqual(createResolver(d).points(edge),[[2,2],[3,0]]);assert.equal(validateDoc(d).objects.length,3);const invalid=clone(d);invalid.objects[0].type='point';delete invalid.objects[0].text;delete invalid.objects[0].textMode;assert.throws(()=>validateDoc(invalid),/reference target/);});
test('malformed type/object fields and invalid settings fail loudly',()=>{const d=newDoc();const a=command(d,'A=(0,0)'),b=command(d,'B=(2,1)');const s=command(d,'Segment(A,B)');const bad=clone(d);bad.objects.find(o=>o.id===s.id).refs.push(a.id);assert.throws(()=>validateDoc(bad),/count/);const evil=clone(d);evil.objects[0].path=[[0,0],[1,2]];assert.throws(()=>validateDoc(evil),/Unexpected drawing path/);const c=clone(d);c.settings.exportRegion='evil';assert.throws(()=>validateDoc(c),/extended settings/);});
test('scientific coordinates parse, invalid gigantic numerics reject',()=>{const d=newDoc();assert.deepEqual(command(d,'P=(1e-3, -2.5E+2)').xy,[.001,-250]);assert.throws(()=>command(d,'Q=(1e200,2)'),/finite/);});
test('deep valid dependency graph does not overflow during import or resolve',()=>{const d=newDoc(),b=addPoint(d,[2,4]);let prev=addPoint(d,[0,0]);for(let i=0;i<3500;i++)prev=append(d,{type:'midpoint',refs:[prev.id,b.id]});const clean=validateDoc(d);assert.deepEqual(position(clean,prev.id),[2,4]);});
test('freehand smoothing preserves endpoints and bounds path length',()=>{const path=Array.from({length:11000},(_,i)=>[i/2000,Math.sin(i/50)]);for(const mode of ['off','gentle','medium','strong']){const o=smoothPath(path,mode,50);assert.deepEqual(o[0],path[0]);assert.deepEqual(o.at(-1),path.at(-1));assert.ok(o.length<=20000);}});
test('world bounds include circle radii, ellipse corners and are not viewport dependent',()=>{const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[3,0]);append(d,{type:'circle',refs:[a.id,b.id]});assert.deepEqual(worldBounds(d,createResolver(d)),{minX:-3,maxX:3,minY:-3,maxY:3});assert.ok(pageRect({w:1000,h:600},'a4').width>0);assert.equal(pageRect({w:1000,h:600},'infinite'),null);assert.equal(arrowCurve([0,0],[0,0],1),null);});
test('tikz-cd semantic import/serialize keeps incidence and labels',()=>{const tex=String.raw`\begin{tikzcd}
A \arrow[r, "f"] & B \\
C \arrow[u, "g"'] & D
\end{tikzcd}`;const d=validateDoc(importTikzCd(tex));assert.equal(d.objects.filter(o=>o.type==='node').length,4);assert.equal(d.objects.filter(o=>o.type==='morphism').length,2);assert.ok(canExportTikzCd(d));const out=exportTikzCd(d);assert.match(out,/\\arrow\[r, "f"\]/);assert.match(out,/\\arrow\[u, "g"'\]/);assert.equal(importTikzCd(out).objects.length,6);});
test('tikz-cd rejects malformed, unsupported, mismatched and unsafe syntax',()=>{for(const src of [String.raw`\begin{tikzcd} A \arrow[r, bend left] & B \end{tikzcd}`,String.raw`\begin{tikzcd} A \arrow[r] \end{tikzcd}`,String.raw`\begin{tikzcd} A \ar[r] & B \end{tikzcd}`])assert.throws(()=>importTikzCd(src));const d=importTikzCd(String.raw`\begin{tikzcd} A \arrow[r, "f"] & B \end{tikzcd}`);d.objects.find(o=>o.type==='morphism').bend=1;assert.equal(canExportTikzCd(d),false);assert.throws(()=>exportTikzCd(d),/bent/);});
test('no unsafe URL/style or nonfinite text placement accepted from JSON',()=>{const d=newDoc();const n=command(d,'A=Node(0,0,"A")');for(const tamper of [x=>x.objects[0].style.stroke='url(evil)',x=>x.objects[0].xy=[NaN,2],x=>x.objects[0].fontSize=1e9]){const c=clone(d);tamper(c);assert.throws(()=>validateDoc(c));}});

test('shared dependency diamonds are valid and detect mutated cycles',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[4,0]);
 const c=append(d,{type:'midpoint',refs:[a.id,b.id]});
 const e=append(d,{type:'midpoint',refs:[c.id,b.id]});
 const f=append(d,{type:'midpoint',refs:[c.id,e.id]});
 assert.deepEqual(createResolver(validateDoc(d)).at(f.id),[2.5,0]);
 const bad=clone(d);bad.objects.find(o=>o.id===c.id).refs[0]=f.id;
 assert.throws(()=>validateDoc(bad),/Cyclic/);
});
test('morphism label-side flag cannot be malformed in imported JSON',()=>{
 const d=newDoc();const a=command(d,'A=Node(0,0,"A")'),b=command(d,'B=Node(3,0,"B")');
 const edge=command(d,'Morphism(A,B,"f")');edge.swap='false';
 assert.throws(()=>validateDoc(d),/label-side/);
});
