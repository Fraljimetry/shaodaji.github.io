#!/usr/bin/env node
/** Round 105: force genuine LRU eviction in an isolated, instrumented copy of the
 * production mesh cache. No source or shipping cache limit is changed. */
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const src=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../src');
const temporary=await mkdtemp(path.join(tmpdir(),'mi-cache-evict-'));
const budget=1024*1024; // 1024 KiB test-only budget; production uses 224 MiB.
try {
 await cp(src,temporary,{recursive:true});
 let code=await readFile(path.join(src,'plot3d.mjs'),'utf8');
 assert(code.includes('const MAX_MESH_CACHE_BYTES=224*1024*1024;'),'production cache budget changed; revisit the test');
 code=code.replace('const MAX_MESH_CACHE_BYTES=224*1024*1024;',`const MAX_MESH_CACHE_BYTES=${budget};`);
 // Inspect internal keys without changing the runtime's eviction algorithm.
 code+='\nexport function __testCacheKeys(){return [...meshCache.keys()];}\n';
 await writeFile(path.join(temporary,'plot3d.mjs'),code);
 const {newScene3D,add3DPlot,project3DScene,meshCacheStats,__testCacheKeys,meshKey}=await import(pathToFileURL(path.join(temporary,'plot3d.mjs')).href);
 const scenes=Array.from({length:18},(_,i)=>{
  const s=newScene3D();add3DPlot(s,'surface3d',[`sin(x*${1+i/7})*cos(y)`]);s.options.detail=24;return s;
 });
 const render=s=>{const f=project3DScene(s,800,600);assert(f.faces.length>0);assert(f.faces.every(t=>t.points.every(p=>p.every(Number.isFinite))));const st=meshCacheStats();assert(st.estimatedBytes<=budget&&st.estimatedBytes>=0);return {faces:f.faces.length,lines:f.lines.length,stats:st};};
 const a=render(scenes[0]);const firstKey=__testCacheKeys()[0];assert(firstKey,'first mesh was not cached');
 const second=render(scenes[1]);const keys2=__testCacheKeys();assert(keys2.length>=2,'test cache too small for LRU ordering');
 render(scenes[0]);assert.equal(__testCacheKeys().at(-1),firstKey,'cache hit did not promote oldest entry');
 let evicted=false;
 for(let i=2;i<scenes.length;i++){
  render(scenes[i]);if(!__testCacheKeys().includes(firstKey)){evicted=true;break;}
 }
 assert(evicted,'failed to force LRU eviction');
 const before=__testCacheKeys();
 const recomputed=render(scenes[0]);
 assert.deepEqual([recomputed.faces,recomputed.lines],[a.faces,a.lines],'evicted mesh did not recompute deterministically');
 assert(__testCacheKeys().includes(firstKey),'recomputed mesh did not reenter cache');
 assert(!before.includes(firstKey),'eviction probe did not actually miss');
 assert(meshCacheStats().estimatedBytes<=budget);
 console.log(JSON.stringify({round:105,passed:true,mode:'isolated-instrumented-production-code',productionCacheLimitMiB:224,testCacheLimitKiB:budget/1024,evictionObserved:true,LRUPromotionObserved:true,deterministicRecomputation:true,cacheEntries:meshCacheStats().entries},null,2));
}finally{await rm(temporary,{recursive:true,force:true});}
