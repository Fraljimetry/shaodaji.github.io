/** Optional, deterministic screen-space positioning for semantic morphism labels.
 * Only visual positions change. Labels, arrow routes and mathematical refs remain
 * untouched. Reserve manually positioned labels FIRST so auto labels yield to
 * the author's explicit choices, independently of object creation order.
 * Approximate text bounds; this is NOT mathematical TeX typesetting.
 */
const CELL=96;
const MOVES=[[0,0],[0,-24],[0,24],[24,0],[-24,0],[0,-48],[0,48],
 [24,-24],[-24,-24],[24,24],[-24,24],[48,0],[-48,0],
 [48,-24],[-48,-24],[48,24],[-48,24],[0,-72],[0,72]];
const good=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e8;
const intersect=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
function textBounds(e,x,y){
 const lines=String(e.text).split(/\r\n?|\n/u);
 const longest=Math.max(1,...lines.map(s=>[...s].reduce((w,ch)=>w+(ch.codePointAt(0)>0x2e80?15:/[ilI.,'`!:;|]/u.test(ch)?5:9),0)));
 const width=Math.min(1600,longest+12),height=Math.max(20,lines.length*21+5);
 return {left:x-width/2,right:x+width/2,top:y-17,bottom:y-17+height};
}
function makeIndex(){
 const bins=new Map(),large=[],MAX_BUCKET=48,MAX_LARGE_EXACT=64;
 let largeCount=0;
 function keys(box){const x1=Math.floor(box.left/CELL),x2=Math.floor(box.right/CELL),y1=Math.floor(box.top/CELL),y2=Math.floor(box.bottom/CELL);
  if(![x1,x2,y1,y2].every(Number.isSafeInteger)||x2-x1>32||y2-y1>32||(x2-x1+1)*(y2-y1+1)>150)return null;
  const out=[];for(let x=x1;x<=x2;x++)for(let y=y1;y<=y2;y++)out.push(`${x}/${y}`);return out;
 }
 return {
  add(box){const cells=keys(box);if(!cells){largeCount++;if(large.length<MAX_LARGE_EXACT)large.push(box);return;}
   for(const key of cells){if(!bins.has(key))bins.set(key,{items:[],overflow:0});const bucket=bins.get(key);
    if(bucket.items.length<MAX_BUCKET)bucket.items.push(box);else bucket.overflow++;}},
  overlap(box){const seen=new Set();let area=0;
   // A giant label cannot be precisely indexed. Fail visibly (crowded) instead
   // of reporting a false clear placement from an incomplete spatial lookup.
   if(keys(box)===null)area+=1000;
   for(const target of large)area+=intersect(box,target);
   if(largeCount>MAX_LARGE_EXACT)area+=(largeCount-MAX_LARGE_EXACT)*40;
   for(const key of keys(box)||[]){const bucket=bins.get(key);if(!bucket)continue;
    area+=bucket.overflow*40;
    for(const target of bucket.items){if(seen.has(target))continue;seen.add(target);area+=intersect(box,target);}
   }return area;
  }
 };
}
/** Narrow collision obstacles along visible arrow routes, not the large bounding
 * rectangle of a diagonal segment. Bounds are clipped to a work budget so
 * extreme imported paths cannot freeze an interactive render. */
export function strokeObstacleRectangles(points,padding=4,limit=128){
 if(!Array.isArray(points)||!good(padding)||padding<0||padding>40||!Number.isInteger(limit)||limit<1||limit>4096)return [];
 const boxes=[];
 for(let i=1;i<points.length&&boxes.length<limit;i++){
  const a=points[i-1],b=points[i];
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==2||b.length!==2||![...a,...b].every(good))continue;
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const n=Math.max(1,Math.min(limit-boxes.length,Math.ceil(len/22)));
  for(let j=0;j<n;j++){
   const u=j/n,v=(j+1)/n;
   const x=a[0]+(b[0]-a[0])*u,y=a[1]+(b[1]-a[1])*u;
   const xx=a[0]+(b[0]-a[0])*v,yy=a[1]+(b[1]-a[1])*v;
   boxes.push({left:Math.min(x,xx)-padding,top:Math.min(y,yy)-padding,right:Math.max(x,xx)+padding,bottom:Math.max(y,yy)+padding});
  }
 }
 return boxes;
}

/** entries: [{id,text,x,y,auto}] in visible scene order.
 * rectangles: [{left,right,top,bottom}] from visible diagram nodes.
 * Selected manual edits are reserved before automatic labels.
 * Returned positions include a visible 'crowded' status when no tested
 * candidate avoids all occupied space. No hidden text or semantic fallback.
 */
export function layoutMorphismLabels(entries,rectangles,width,height){
 if(!Array.isArray(entries)||!Array.isArray(rectangles)||!good(width)||!good(height)||width<=0||height<=0)
  throw Error('Invalid morphism label layout input.');
 const index=makeIndex(),positions=new Map();
 for(const rect of rectangles){if(rect&&[rect.left,rect.top,rect.right,rect.bottom].every(good)&&rect.right>=rect.left&&rect.bottom>=rect.top){
  index.add({left:rect.left-4,right:rect.right+4,top:rect.top-4,bottom:rect.bottom+4});}}
 const valid=entries.filter(e=>e&&typeof e.id==='string'&&typeof e.text==='string'&&e.text.length&&good(e.x)&&good(e.y));
 for(const e of valid.filter(e=>!e.auto)){
  const box=textBounds(e,e.x,e.y);index.add(box);positions.set(e.id,{x:e.x,y:e.y,dx:0,dy:0,status:'manual'});
 }
 for(const e of valid.filter(e=>e.auto)){
  let best=null,score=Infinity,overlap=Infinity;
  for(let i=0;i<MOVES.length;i++){
   const [dx,dy]=MOVES[i],x=e.x+dx,y=e.y+dy,b=textBounds(e,x,y);
   const area=index.overlap(b);
   const outside=Math.max(0,-b.left)+Math.max(0,b.right-width)+Math.max(0,-b.top)+Math.max(0,b.bottom-height);
   const s=area*2+outside*24+Math.hypot(dx,dy)*.05+i*.001;
   if(s<score){score=s;overlap=area;best={x,y,dx,dy,status:area>0||outside>0?'crowded':'clear',box:b};}
  }
  if(best){positions.set(e.id,{x:best.x,y:best.y,dx:best.dx,dy:best.dy,status:best.status});index.add(best.box);}
 }
 return positions;
}
