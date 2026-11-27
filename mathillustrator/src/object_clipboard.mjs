import {createDependencyGraph,objectDependencies} from './dependency_graph.mjs?cut=round311';
import {append,clone,validateDoc} from './model.mjs?cut=round315';

/** In-editor 2D clipboard. Snapshot the transitive parents of each selected
 * object so copies can be moved independently of the originals. Nothing is
 * written to the operating-system clipboard or the project JSON schema. */
export function captureObjectSelection(doc,selectedIds){
 const graph=createDependencyGraph(doc.objects);
 const roots=[...new Set(selectedIds)].filter(id=>graph.byId.has(id));
 if(!roots.length)return null;
 const ordered=graph.dependencyOrder(roots,{missing:'Missing clipboard dependency.',cyclic:'Cyclic clipboard dependency.'}).map(id=>clone(graph.byId.get(id)));
 return {version:1,roots,objects:ordered};
}

/** Mutates a document only after callers arrange rollback (the editor's
 * existing update() does so). Also self-validates to support direct callers. */
export function pasteObjectSelection(doc,clip,{offset=0.5}={}){
 if(!clip||clip.version!==1||!Array.isArray(clip.objects)||!Array.isArray(clip.roots)||!clip.objects.length)throw Error('No compatible objects to paste.');
 if(!Number.isFinite(offset)||Math.abs(offset)>1e6)throw Error('Invalid paste offset.');
 if(doc.objects.length+clip.objects.length>10000)throw Error('Too many objects to paste.');
 const clipboardIds=new Set();
 for(const original of clip.objects){
  if(!original||typeof original.id!=='string'||!/^o[1-9]\d*$/.test(original.id)||clipboardIds.has(original.id))throw Error('Invalid clipboard object identity.');
  clipboardIds.add(original.id);
 }
 if(clip.roots.some(id=>!clipboardIds.has(id)))throw Error('Missing clipboard root.');
 for(const original of clip.objects){
  for(const ref of objectDependencies(original)){
   if(!clipboardIds.has(ref))throw Error('Clipboard contains external dependency.');
  }
 }
 const before=clone(doc),mapped=new Map();
 try{
  for(const original of clip.objects){
   if(mapped.has(original.id))throw Error('Invalid clipboard object identity.');
   const copy=clone(original),oldId=copy.id;
   if(copy.refs){copy.refs=copy.refs.map(id=>{if(!mapped.has(id))throw Error('Unordered clipboard dependency.');return mapped.get(id);});}
   if(copy.edgeOf){if(!mapped.has(copy.edgeOf))throw Error('Unordered clipboard dependency.');copy.edgeOf=mapped.get(copy.edgeOf);}
   delete copy.id;delete copy.name;
   // Only intrinsically positioned geometry may be translated. Driven points
   // retain their expressions and update through their copied parents.
   if(['point','node','text'].includes(copy.type)&&Array.isArray(copy.xy)){
    if(!copy.xyExpr)copy.xy=[copy.xy[0]+offset,copy.xy[1]+offset];
    else if(Array.isArray(copy.xyExpr)&&copy.xyExpr.length===2&&copy.xyExpr.every(v=>typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v)))){
     // Algebra-created constant points retain coordinate expressions. Moving
     // the coordinates alone would be undone on the next dependency resolve.
     copy.xyExpr=copy.xyExpr.map(v=>String(Number(v)+offset));
     copy.xy=[copy.xy[0]+offset,copy.xy[1]+offset];
    }
    // Nonconstant expressions keep their exact formula and dependency semantics.
   }
   if(copy.type==='freehand'){
    for(const field of ['path','rawPath'])if(Array.isArray(copy[field]))copy[field]=copy[field].map(([x,y])=>[x+offset,y+offset]);
   }
   const added=append(doc,copy);mapped.set(oldId,added.id);
  }
  validateDoc(doc);
  return clip.roots.map(id=>mapped.get(id)).filter(Boolean);
 }catch(error){
  for(const key of Object.keys(doc))delete doc[key];
  Object.assign(doc,before);
  throw error;
 }
}
