import test from 'node:test';
import assert from 'node:assert/strict';
import {geometryPickRank,rankGeometryHits} from '../src/geometry_pick.mjs';
const objects=new Map([
 ['p',{id:'p',type:'point'}],['l',{id:'l',type:'line'}],
 ['c',{id:'c',type:'circle'}],['s',{id:'s',type:'segment'}],
 ['f',{id:'f',type:'freehand'}],['region',{id:'region',type:'polygon'}],
 ['hidden',{id:'hidden',type:'point',hidden:true}],
]);
const pick=(anchors,elements,accept=()=>true)=>rankGeometryHits({anchors,elements,getObject:id=>objects.get(id),accept,visible:o=>!o.hidden});
test('global point-first priority independent of paint order',()=>{
 assert.deepEqual(pick(['p'],['region','c','l','s','p']),['p','s','l','c','region']);
 assert.deepEqual(pick([],['region','l','p','c']),['p','l','c','region']);
});
test('tool eligibility applied before priority',()=>{
 assert.deepEqual(pick(['p'],['l','c','p'],o=>o.type==='circle'),['c']);
 assert.deepEqual(pick(['p'],['l','c','p'],o=>o.type==='line'),['l']);
});
test('stable equal-priority spatial distance and paint order',()=>{
 const data=new Map(objects);data.set('p2',{id:'p2',type:'point'});
 assert.deepEqual(rankGeometryHits({anchors:['p2','p'],elements:['p','p2'],getObject:id=>data.get(id)}),['p2','p']);
 assert.deepEqual(pick([],['f','s','l']),['f','s','l']);
});
test('reject invisible, duplicates, and non-document hits',()=>{
 assert.deepEqual(pick(['hidden','p','p'],['hidden','missing','p','c']),['p','c']);
 assert.equal(geometryPickRank(objects.get('p')),0);
 assert.equal(geometryPickRank(objects.get('l'))<geometryPickRank(objects.get('region')),true);
});
