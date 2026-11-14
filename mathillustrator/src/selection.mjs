/** Transient editor selection helpers. Never serialize selection into project JSON. */
export const FILL_TYPES=new Set(['polygon','regularPolygon','ellipse','rectangle','parallelogram','node']);
export const POINT_TYPES=new Set(['point','midpoint','intersection','circleIntersection','circleCircleIntersection']);
export function toggleIds(current,id){
 const next=new Set(current);
 if(id){if(next.has(id))next.delete(id);else next.add(id);}
 return next;
}
/** Window (left to right) selects wholly enclosed; crossing (right to left)
 * selects objects whose visible bounds meet the marquee. */
export function windowSelection(rects,start,end){
 const x1=Math.min(start[0],end[0]),y1=Math.min(start[1],end[1]);
 const x2=Math.max(start[0],end[0]),y2=Math.max(start[1],end[1]);
 if(x2-x1<4||y2-y1<4)return [];
 const crossing=end[0]<start[0],result=[];
 for(const [id,b] of rects){
  if(!id||!b||![b.left,b.top,b.right,b.bottom].every(Number.isFinite)||b.right<b.left||b.bottom<b.top)continue;
  const included=crossing
   ? b.left<=x2&&b.right>=x1&&b.top<=y2&&b.bottom>=y1
   : b.left>=x1&&b.right<=x2&&b.top>=y1&&b.bottom<=y2;
  if(included)result.push(id);
 }
 return result;
}
export function commonValue(objects,property){
 if(!objects.length)return null;
 const first=objects[0].style?.[property];
 return objects.every(o=>o.style?.[property]===first)?first:null;
}
export function compatibleObjects(objects,property){
 return objects.filter(o=>!o.locked&&(property==='fill'?FILL_TYPES.has(o.type):property==='pointSize'?POINT_TYPES.has(o.type):['stroke','width','opacity'].includes(property)));
}
