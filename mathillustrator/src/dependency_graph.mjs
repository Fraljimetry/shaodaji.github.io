/** Shared structural dependency traversal. Ownership edges are explicitly
 * optional: they affect deletion, clipboard and locks, not geometry resolution. */
export function objectDependencies(object,{ownership=true}={}){
 return [...(object.refs||[]),...(ownership&&object.edgeOf?[object.edgeOf]:[])];
}
export function createDependencyGraph(objects,{ownership=true}={}){
 const byId=new Map(objects.map(o=>[o.id,o])),reverse=new Map();
 const parents=id=>byId.has(id)?objectDependencies(byId.get(id),{ownership}):[];
 for(const o of objects)for(const parent of parents(o.id)){
  if(!reverse.has(parent))reverse.set(parent,[]);reverse.get(parent).push(o.id);
 }
 function descendants(roots){
  const seen=new Set(roots),queue=[...seen];
  for(let i=0;i<queue.length;i++)for(const child of reverse.get(queue[i])||[])if(!seen.has(child)){seen.add(child);queue.push(child);}
  return seen;
 }
 function ancestors(roots){
  const seen=new Set(roots),queue=[...seen];
  for(let i=0;i<queue.length;i++)for(const parent of parents(queue[i]))if(!seen.has(parent)){seen.add(parent);queue.push(parent);}
  return seen;
 }
 function dependencyOrder(roots,{external=()=>false,missing='Missing object dependency.',cyclic='Cyclic object dependency.'}={}){
  const done=new Set(),active=new Set(),ordered=[];
  for(const root of roots){
   if(done.has(root)||external(root))continue;
   const stack=[{id:root,index:0,deps:null}];
   while(stack.length){
    const f=stack.at(-1);
    if(f.deps===null){if(!byId.has(f.id))throw Error(missing);active.add(f.id);f.deps=parents(f.id);}
    if(f.index<f.deps.length){
     const id=f.deps[f.index++];if(done.has(id)||external(id))continue;
     if(active.has(id))throw Error(cyclic);stack.push({id,index:0,deps:null});
    }else{active.delete(f.id);done.add(f.id);ordered.push(f.id);stack.pop();}
   }
  }
  return ordered;
 }
 return {byId,parents,descendants,ancestors,dependencyOrder};
}
/** Preserve the editor's existing expression applicability and identifier
 * boundary semantics; this is not a symbolic expression evaluator. */
export function objectFormulas(o){
 return [...(o.xyExpr||[]),...Object.values(o.measureExpr||{}),...(['function','implicit','domainColoring'].includes(o.type)?[o.expr]:[]),...(['parametric','vectorField'].includes(o.type)?[o.xExpr,o.yExpr,o.rExpr]:[])];
}
export function usesSlider(o,name){
 const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('(?:^|[^A-Za-z0-9_])'+escaped+'(?:$|[^A-Za-z0-9_])');
 return objectFormulas(o).some(f=>typeof f==='string'&&pattern.test(f));
}
export function sliderDependents(doc,name){
 const graph=createDependencyGraph(doc.objects);
 return graph.descendants(doc.objects.filter(o=>usesSlider(o,name)).map(o=>o.id));
}
function directLockPredicate(doc,graph,externalLocked){
 const locked=(doc.algebra?.sliders||[]).filter(s=>s.locked),external=new Set(externalLocked);
 return key=>{const o=graph.byId.get(key);return external.has(key)||Boolean(o&&(o.locked||locked.some(s=>usesSlider(o,s.name))));};
}
export function effectivelyLocked(doc,id,externalLocked=[]){
 const graph=createDependencyGraph(doc.objects);
 return [...graph.ancestors([id])].some(directLockPredicate(doc,graph,externalLocked));
}
/** Compute inherited locks once for a list or multi-object operation. */
export function lockedObjectIds(doc,externalLocked=[]){
 const graph=createDependencyGraph(doc.objects),direct=directLockPredicate(doc,graph,externalLocked);
 return graph.descendants([...externalLocked,...doc.objects.map(o=>o.id).filter(direct)]);
}
