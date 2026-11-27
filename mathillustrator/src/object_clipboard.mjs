import {append,clone,validateDoc} from './model.mjs?cut=mi271';

/** In-editor 2D clipboard. Snapshot the transitive parents of each selected
 * object so copies can be moved independently of the originals. Nothing is
 * written to the operating-system clipboard or the project JSON schema. */
export function captureObjectSelection(doc,selectedIds){
 const map=new Map(doc.objects.map(o=>[o.id,o]));
 const roots=[...new Set(selectedIds)].filter(id=>map.has(id));
 if(!roots.length)return null;
 const included=new Set(),ordered=[],visiting=new Set();
 // Explicit DFS frames preserve dependency-first clipboard ordering without
 // exhausting the call stack on long, valid construction chains.
 for(const root of roots){
  if(included.has(root))continue;
  const stack=[{id:root,entered:false,deps:null,index:0}];
  while(stack.length){
   const frame=stack[stack.length-1];
   if(included.has(frame.id)){stack.pop();continue;}
   if(!frame.entered){
    if(!map.has(frame.id))throw Error('Missing clipboard dependency.');
    if(visiting.has(frame.id))throw Error('Cyclic clipboard dependency.');
    visiting.add(frame.id);frame.entered=true;
    const o=map.get(frame.id);
    frame.deps=[...(o.refs||[]),...(o.edgeOf?[o.edgeOf]:[])];
   }
   if(frame.index<frame.deps.length){
    const ref=frame.deps[frame.index++];
    if(included.has(ref))continue;
    if(visiting.has(ref))throw Error('Cyclic clipboard dependency.');
    stack.push({id:ref,entered:false,deps:null,index:0});
   }else{
    visiting.delete(frame.id);included.add(frame.id);
    ordered.push(clone(map.get(frame.id)));
    stack.pop();
   }
  }
 }
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
  for(const ref of [...(original.refs||[]),...(original.edgeOf?[original.edgeOf]:[])]){
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
