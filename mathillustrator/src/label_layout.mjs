/** Optional conservative point-label placement in screen pixels.
 * This never changes text, mathematical coordinates, object ordering, or SVG
 * export semantics. A bounded spatial bucket prevents quadratic scans when
 * thousands of points overlap. It never silently hides an author label.
 */
const CELL=72, BUCKET_CAP=40;
function measure(text){let w=0;for(const ch of String(text))w+=ch.codePointAt(0)>0x2e80?12:/[ilI.,'`!:;|]/u.test(ch)?4.1:/[MW@#%]/u.test(ch)?10.5:7.4;return Math.max(4,w);}
function rect(x,y,anchor,width){
 const left=anchor==='end'?x-width:anchor==='middle'?x-width/2:x;
 return {left:left-2,right:left+width+2,top:y-13,bottom:y+4};
}
function intersection(a,b){const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return Math.max(0,w)*Math.max(0,h);}
export function layoutPointLabels(entries,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Array.isArray(entries))throw Error('Invalid point-label layout viewport.');
 const buckets=new Map(),result=new Map();
 const cells=b=>{const xs=Math.floor(b.left/CELL),xe=Math.floor(b.right/CELL),ys=Math.floor(b.top/CELL),ye=Math.floor(b.bottom/CELL),keys=[];
  // The editor limits label length, but reject pathological external callers.
  if(xe-xs>1000||ye-ys>1000)return keys;
  for(let x=xs;x<=xe;x++)for(let y=ys;y<=ye;y++)keys.push(`${x}:${y}`);return keys;
 };
 function add(b){for(const key of cells(b)){let bucket=buckets.get(key);if(!bucket){bucket={items:[],total:0};buckets.set(key,bucket);}bucket.total++;if(bucket.items.length<BUCKET_CAP)bucket.items.push(b);}}
 function collisions(b){const seen=new Set();let cost=0;
  for(const key of cells(b)){const bucket=buckets.get(key);if(!bucket)continue;
   // Dense buckets use a constant-time overflow penalty rather than O(N^2)
   // exact comparisons. Equal candidates remain deterministic.
   cost+=Math.max(0,bucket.total-BUCKET_CAP)*3;
   for(const other of bucket.items){if(seen.has(other))continue;seen.add(other);cost+=intersection(b,other);}
  }return cost;
 }
 // Reserve point centers first so labels do not prefer obscuring another anchor.
 for(const e of entries){if(!e||![e.x,e.y].every(Number.isFinite))continue;
  if(e.x < -16||e.x > width+16||e.y < -16||e.y > height+16)continue;
  add({left:e.x-7,right:e.x+7,top:e.y-7,bottom:e.y+7});
 }
 for(const e of entries){if(!e||typeof e.id!=='string'||![e.x,e.y].every(Number.isFinite))continue;
  if(e.x < -100||e.x > width+100||e.y < -100||e.y > height+100)continue;
  const w=measure(e.text);
  const options=[
   [e.x+9,e.y-10,'start'],[e.x+9,e.y+20,'start'],
   [e.x-9,e.y-10,'end'],[e.x-9,e.y+20,'end'],
   [e.x,e.y-17,'middle'],[e.x,e.y+26,'middle'],
  ];let best=null,score=Infinity;
  for(let i=0;i<options.length;i++){
   const [x,y,anchor]=options[i],b=rect(x,y,anchor,w);
   const clipped=Math.max(0,-b.left)+Math.max(0,b.right-width)+Math.max(0,-b.top)+Math.max(0,b.bottom-height);
   const s=collisions(b)+clipped*30+i*.01;
   if(s<score){score=s;best={x,y,anchor,b};}
  }
  if(best){result.set(e.id,{x:best.x,y:best.y,anchor:best.anchor});add(best.b);}
 }
 return result;
}

/** Small LRU for settled-scene label layouts. Pointer drags must bypass the
 * cache because anchors mutate provisionally before revision increments. */
export function createLabelLayoutCache(limit=4){
 if(!Number.isInteger(limit)||limit<1||limit>64)throw Error('Invalid label cache capacity.');
 const items=new Map();
 return {get(key,make){if(items.has(key)){const value=items.get(key);items.delete(key);items.set(key,value);return value;}
   const value=make();items.set(key,value);while(items.size>limit)items.delete(items.keys().next().value);return value;},
  clear(){items.clear();},stats(){return {entries:items.size,limit};}};
}
