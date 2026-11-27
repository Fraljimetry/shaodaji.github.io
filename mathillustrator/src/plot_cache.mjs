/** Weighted LRU shared by rendering artifacts and world meshes. */
export function createWeightedCache({maxEntries,maxWeight,weight}){
 if(!Number.isSafeInteger(maxEntries)||maxEntries<0||!Number.isSafeInteger(maxWeight)||maxWeight<0)
  throw new RangeError('Cache limits must be nonnegative safe integers.');
 const entries=new Map();let total=0,hits=0,misses=0;
 return {
  lookup(key){if(!entries.has(key)){misses++;return undefined;}
   const entry=entries.get(key);entries.delete(key);entries.set(key,entry);hits++;return entry.value;},
  store(key,value){const w=weight(value);
   if(!Number.isSafeInteger(w)||w<0||w>maxWeight||!maxEntries||!maxWeight)return;
   if(entries.has(key)){total-=entries.get(key).weight;entries.delete(key);}
   entries.set(key,{value,weight:w});total+=w;
   while(entries.size>maxEntries||total>maxWeight){const oldest=entries.keys().next().value;total-=entries.get(oldest).weight;entries.delete(oldest);}
  },
  keys:()=>entries.keys(),
  stats:()=>({entries:entries.size,weight:total,hits,misses}),
  clear:()=>{entries.clear();total=0;}
 };
}
/** Historical string-only cache interface. */
export function createPlotCache({maxEntries=32,maxCharacters=1200000}={}){
 const cache=createWeightedCache({maxEntries,maxWeight:maxCharacters,weight:value=>typeof value==='string'?value.length:NaN});
 return {get(key,compute){const hit=cache.lookup(key);if(hit!==undefined)return hit;const value=compute();cache.store(key,value);return value;},
  stats(){const {entries,weight:characters,hits,misses}=cache.stats();return {entries,characters,hits,misses};},clear:cache.clear};
}
/** Cache rendering output and its budget status together; neither can outlive the other. */
export function createPlotArtifactCache({maxEntries=32,maxCharacters=1200000}={}){
 const cache=createWeightedCache({maxEntries,maxWeight:maxCharacters,weight:value=>value.content.length});
 return {get(key,compute){const hit=cache.lookup(key);if(hit!==undefined)return hit;
  const {content,limited}=compute();const value=Object.freeze({content,limited:!!limited});cache.store(key,value);return value;},stats:cache.stats,clear:cache.clear};
}
/** Explicit sampling dependencies; appearance and selection are not sampling inputs. */
export function plotArtifactKey(plot,parameters,settings,view,size,pixelBudget){
 if(plot.type==='domainColoring'||(plot.type==='implicit'&&plot.colorRange===true))return JSON.stringify([
  plot.type==='implicit'?'implicit-color-range':'domainColoring',plot.expr,plot.region,plot.resolution??768,
  plot.colorMode??(plot.type==='implicit'?'range':'phase-modulus'),plot.regionCondition||'',parameters,pixelBudget]);
 return JSON.stringify([plot.type,plot.expr,plot.xExpr,plot.yExpr,plot.parameter,plot.tMin,plot.tMax,plot.polar,plot.rExpr,
  parameters,settings.plotQuality,settings.plotBudget,settings.implicitGrid,view.cx,view.cy,view.scale,size.w,size.h]);
}
