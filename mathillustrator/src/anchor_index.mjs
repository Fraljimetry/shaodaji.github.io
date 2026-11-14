/** Screen-space grid for point and midpoint picking/snapping.
 * Built lazily from a settled document/viewport. The caller invalidates after
 * any committed mutation, undo/import or pan/zoom. Never use to decide which
 * new anchors may snap to other newly-created anchors in the same gesture.
 */
export function createAnchorIndex(doc,resolver,view,size,{cell=32}={}){
 if(!Number.isFinite(cell)||cell<=0)throw Error('Invalid spatial-index cell size.');
 const buckets=new Map();let maxRadius=9,count=0;
 const key=(x,y)=>`${x}:${y}`;
 for(let i=0;i<doc.objects.length;i++){
  const o=doc.objects[i];
  if(o.hidden||o.style?.opacity===0||!['point','midpoint','intersection','circleIntersection'].includes(o.type))continue;
  const p=resolver.at(o.id);if(!p||!p.every(Number.isFinite))continue;
  const x=(p[0]-view.cx)*view.scale+size.w/2,y=(view.cy-p[1])*view.scale+size.h/2;
  if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  const radius=Math.max(9,Number(o.style.pointSize??doc.settings.pointSize)+3);
  maxRadius=Math.max(maxRadius,radius);
  const q={id:o.id,x,y,radius,rank:i,world:p};
  const k=key(Math.floor(x/cell),Math.floor(y/cell));if(!buckets.has(k))buckets.set(k,[]);
  buckets.get(k).push(q);count++;
 }
 function query(sx,sy,mode,limit,excluded=null){
  if(!Number.isFinite(sx)||!Number.isFinite(sy))return null;
  const extent=mode==='hit'?maxRadius:limit;
  const x0=Math.floor((sx-extent)/cell),x1=Math.floor((sx+extent)/cell);
  const y0=Math.floor((sy-extent)/cell),y1=Math.floor((sy+extent)/cell);
  let best=null,score=Infinity;
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const q of buckets.get(key(x,y))||[]){
   if(excluded?.has(q.id))continue;
   const d=Math.hypot(sx-q.x,sy-q.y),r=mode==='hit'?q.radius:limit;
   if(d>r)continue;
   if(d<score||(d===score&&(mode==='hit'?q.rank>best.rank:q.rank<best.rank))){best=q;score=d;}
  }
  return best;
 }
 function hits(sx,sy){
  if(!Number.isFinite(sx)||!Number.isFinite(sy))return [];
  const x0=Math.floor((sx-maxRadius)/cell),x1=Math.floor((sx+maxRadius)/cell);
  const y0=Math.floor((sy-maxRadius)/cell),y1=Math.floor((sy+maxRadius)/cell),found=[];
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const q of buckets.get(key(x,y))||[]){
   if(excluded?.has(q.id))continue;
   const d=Math.hypot(sx-q.x,sy-q.y);if(d<=q.radius)found.push({...q,d});
  }
  return found.sort((a,b)=>a.d-b.d||b.rank-a.rank).map(q=>q.id);
 }
 return {nearest:(sx,sy,radius=12,excluded=null)=>query(sx,sy,'snap',radius,excluded),hit:(sx,sy)=>query(sx,sy,'hit',0),hits,stats:()=>({anchors:count,buckets:buckets.size,maxRadius})};
}

/** Cycle a stack of overlapping selectable objects without mutating the model. */
export function cycleSelection(ids,current){const order=[...new Set(ids)];if(!order.length)return null;const index=order.indexOf(current);return order[(index+1)%order.length];}
