/** Object panels display arrays in reverse order (top = front).
 * Reorder actual document arrays, not their virtualized DOM rows. IDs and
 * references remain unchanged; operations are undoable by the app wrapper.
 */
export function reorderVisible(items,sourceId,targetId,before=true){
 if(!Array.isArray(items)||sourceId===targetId)return false;
 const source=items.findIndex(o=>o.id===sourceId);
 if(source<0||!items.some(o=>o.id===targetId))return false;
 const [moving]=items.splice(source,1);
 const target=items.findIndex(o=>o.id===targetId);
 items.splice(target+(before?1:0),0,moving);
 return true;
}
export function shiftVisible(items,id,up){
 const index=items.findIndex(o=>o.id===id),target=index+(up?1:-1);
 if(index<0||target<0||target>=items.length)return false;
 [items[index],items[target]]=[items[target],items[index]];
 return true;
}
