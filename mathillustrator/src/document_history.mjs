// Document and Recently Deleted are one history entry, never parallel stacks.
// Store serialized pairs so the same estimated UTF-16 budget covers both stacks.
export function createDocumentHistory({maxEntries=80,maxBytes=30*1024*1024}={}){
 const past=[],future=[];let bytes=0;
 const snapshot=(document,trash)=>{const serializedTrash=JSON.stringify(trash);return {document,trash:serializedTrash,bytes:2*(document.length+serializedTrash.length)};};
 function push(stack,entry){stack.push(entry);bytes+=entry.bytes;}
 function pop(stack){const entry=stack.pop();bytes-=entry.bytes;return entry;}
 function trim(preferred,other){let evicted=false;
  // Retain the nearest newly recorded/restorable entry even if it alone exceeds budget.
  while(past.length+future.length>1&&(past.length+future.length>maxEntries||bytes>maxBytes)){
   const stack=other.length?other:preferred;bytes-=stack.shift().bytes;evicted=true;
  }return evicted;
 }
 function transfer(from,to,current,trash,prepare){
  if(!from.length)return null;
  const entry=from.at(-1),next=snapshot(current,trash);
  // Validate before moving either stack. The caller owns rendering/persistence.
  const result=prepare(entry.document);
  const restoredTrash=JSON.parse(entry.trash);
  pop(from);push(to,next);trim(to,from);return {document:result,trash:restoredTrash};
 }
 return {
  get canUndo(){return past.length>0;},get canRedo(){return future.length>0;},
  record(before,trash){const entry=snapshot(before,trash);while(future.length)pop(future);push(past,entry);return trim(past,future);},
  undo(current,trash,prepare){return transfer(past,future,current,trash,prepare);},
  redo(current,trash,prepare){return transfer(future,past,current,trash,prepare);},
  clear(){past.length=0;future.length=0;bytes=0;}
 };
}
// All accepted gesture and ordinary edit boundaries use the same change test.
export function commitDocumentChange(before,after,commit){
 if(before===null||before===undefined||before===after)return false;
 commit(before);return true;
}
