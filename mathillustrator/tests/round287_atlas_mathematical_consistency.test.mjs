/** Round 287 — independent analytic oracle for imported atlas triangle constructions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateDoc,createResolver} from '../src/model.mjs';
const original=JSON.parse(fs.readFileSync(new URL('./fixtures/mathillustrator_advanced_geometry_atlas.json',import.meta.url),'utf8'));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const near=(a,b,eps=1e-8)=>{assert.ok(Array.isArray(a)&&a.length===2&&a.every(Number.isFinite),`undefined point ${a}`);assert.ok(dist(a,b)<=eps,`${a} != ${b}`);};
const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
const weighted=(a,b,c,wa,wb,wc)=>[(wa*a[0]+wb*b[0]+wc*c[0])/(wa+wb+wc),(wa*a[1]+wb*b[1]+wc*c[1])/(wa+wb+wc)];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
function circum(a,b,c){const u=[b[0]-a[0],b[1]-a[1]],v=[c[0]-a[0],c[1]-a[1]],d=2*cross(u,v);assert.ok(Math.abs(d)>1e-6);const uu=u[0]**2+u[1]**2,vv=v[0]**2+v[1]**2;return [a[0]+(uu*v[1]-vv*u[1])/d,a[1]+(vv*u[0]-uu*v[0])/d];}
function foot(p,a,b){const u=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*u[0]+(p[1]-a[1])*u[1])/(u[0]**2+u[1]**2);return[a[0]+t*u[0],a[1]+t*u[1]];}
function check(doc){const r=createResolver(doc),at=id=>r.at(id),a=at('o1'),b=at('o2'),c=at('o3');for(const [id,p] of [['o11',midpoint(a,b)],['o12',midpoint(b,c)],['o13',midpoint(c,a)],['o32',[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3]],['o17',foot(c,a,b)],['o18',foot(a,b,c)],['o19',foot(b,c,a)]])near(at(id),p);
 const center=circum(a,b,c);near(at('o33'),center);const aa=dist(b,c),bb=dist(c,a),cc=dist(a,b);near(at('o34'),weighted(a,b,c,aa,bb,cc));near(at('o36'),weighted(a,b,c,-aa,bb,cc));const ortho=[a[0]+b[0]+c[0]-2*center[0],a[1]+b[1]+c[1]-2*center[1]];near(at('o35'),ortho);near(at('o31'),ortho);}
test('atlas analytic points agree with independently calculated triangle geometry',()=>{const d=validateDoc(structuredClone(original));check(d);});
test('atlas analytic identities survive moving defining points and document round trips',()=>{const d=validateDoc(structuredClone(original));for(const [i,xy] of [[0,[-0.87,-2.01]],[1,[6.13,-1.24]],[2,[1.58,4.29]]]){d.objects[i].xy=xy;check(d);check(validateDoc(JSON.parse(JSON.stringify(d))));}});
