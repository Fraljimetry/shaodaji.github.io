/** Deterministic, browser-independent *approximate* screen-space diagram layout.
 * Source text stays unmodified. We wrap displayed node text and reuse the same
 * bounds for arrow endpoints and fit-to-view; this does not typeset LaTeX.
 */
const MAX_TEXT_WIDTH=308, MAX_BOX_WIDTH=340, CACHE_LIMIT=256;
const cache=new Map();
function glyphAdvance(ch,size){
 if(ch===' ')return size*.33;
 if(/[ilI.,'`!:;|]/u.test(ch))return size*.34;
 if(/[MW@#%]/u.test(ch))return size*.88;
 if(/[A-Za-z0-9]/u.test(ch))return size*.62;
 if(ch.codePointAt(0)>0x2e80)return size*1.05;
 return size*.68;
}
function measure(line,size){let w=0;for(const ch of line)w+=glyphAdvance(ch,size);return w;}
function buildLabel(text,fontSize){
 const size=Number.isFinite(fontSize)&&fontSize>0?fontSize:17;
 const lines=[];
 // Preserve author line breaks and every whitespace character across visual
 // wraps. SVG xml:space=preserve requires exact text: trimming a line is
 // mathematical data corruption (e.g. "A  B" becomes "AB").
 for(const paragraph of String(text).split(/\r\n?|\n/u)){
  if(!paragraph){lines.push('');continue;}
  let current='',width=0;
  for(const ch of paragraph){
   const dw=glyphAdvance(ch,size);
   if(current&&width+dw>MAX_TEXT_WIDTH){
    const cut=current.lastIndexOf(' ');
    if(cut>0&&measure(current.slice(0,cut),size)>=MAX_TEXT_WIDTH*.53){
     lines.push(current.slice(0,cut+1));current=current.slice(cut+1);width=measure(current,size);
    }else{lines.push(current);current='';width=0;}
   }
   current+=ch;width+=dw;
  }
  lines.push(current);
 }
 const lineHeight=size*1.35;
 return {lines,width:Math.max(64,Math.min(MAX_BOX_WIDTH,Math.max(...lines.map(line=>measure(line,size)),0)+32)),height:Math.max(size*2.1,lines.length*lineHeight+20),lineHeight};
}
export function layoutNodeLabel(text,fontSize=17){
 const key=fontSize+'\u0000'+String(text);
 if(cache.has(key)){const found=cache.get(key);cache.delete(key);cache.set(key,found);return found;}
 const result=buildLabel(text,fontSize);cache.set(key,result);
 if(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
 return result;
}
export function nodeBox(text,fontSize=17){return layoutNodeLabel(text,fontSize);}
export function nodeLayoutCacheStats(){return {entries:cache.size,limit:CACHE_LIMIT};}
export function edgeBetweenBoxes(a,b,fromBox,toBox,margin=6){
 if(![...a,...b,fromBox.width,fromBox.height,toBox.width,toBox.height,margin].every(Number.isFinite))return null;
 const dx=b[0]-a[0],dy=b[1]-a[1],dist=Math.hypot(dx,dy);
 if(dist<1e-7)return null;
 const ux=dx/dist,uy=dy/dist;
 const trim=box=>{
  const x=Math.abs(ux)<1e-10?Infinity:box.width/2/Math.abs(ux);
  const y=Math.abs(uy)<1e-10?Infinity:box.height/2/Math.abs(uy);
  return Math.min(x,y);
 };
 const startBoundary=trim(fromBox),endBoundary=trim(toBox);
 const gap=dist-startBoundary-endBoundary;
 if(gap<=2)return null;
 const padding=Math.min(Math.max(0,margin),Math.max(0,(gap-4)/2));
 const start=startBoundary+padding,end=endBoundary+padding;
 return {start:[a[0]+ux*start,a[1]+uy*start],end:[b[0]-ux*end,b[1]-uy*end],length:dist-start-end};
}
