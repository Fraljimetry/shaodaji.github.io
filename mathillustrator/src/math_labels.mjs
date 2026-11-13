/** Local-first MathJax SVG labels. No HTML/foreignObject or remote fonts in exports.
 * Legacy objects remain plain until explicitly opted into textMode:'latex'.
 * A bounded LRU avoids expensive repeat typesetting during pan/drag/export.
 */
const CACHE_LIMIT=256;
const cache=new Map();
let nextMathInstance=0;
const FORBIDDEN=/\\(?:href|url|require|includegraphics|html|class|style|cssId|cssClass|bbox|unicode|newcommand|def|let|write|input|verb|special)\b/i;
export function checkLatexSource(source){
 if(typeof source!=='string'||source.length>2000||!source.trim())throw Error('LaTeX label must contain 1–2000 characters.');
 if(FORBIDDEN.test(source))throw Error('This LaTeX command is not allowed in drawing labels.');
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source))throw Error('Unsupported control character in LaTeX label.');
 return source;
}
export function mathReady(){return typeof window!=='undefined'&&typeof window.MathJax?.tex2svg==='function';}
function compile(source){
 checkLatexSource(source);
 if(!mathReady())throw Error('Local math renderer is not ready. Check that MathJax loaded.');
 if(cache.has(source)){const value=cache.get(source);cache.delete(source);cache.set(source,value);return value;}
 const container=window.MathJax.tex2svg(source,{display:false});
 if(container.querySelector('[data-mjx-error],merror'))throw Error('LaTeX syntax or command error. Correct the label before applying.');
 const svg=container.querySelector('svg');if(!svg)throw Error('LaTeX could not be converted into vector SVG.');
 const parts=svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
 if(!parts||parts.length!==4||parts.some(n=>!Number.isFinite(n))||parts[2]<=0||parts[3]<=0)throw Error('Math SVG geometry is invalid.');
 // MathJax SVG uses 1000 units per em; its local font cache includes glyph paths.
 const result={svg:svg.cloneNode(true),parts};cache.set(source,result);
 if(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
 return result;
}
export function validateLatexInput(source){compile(source);return true;}
export function mathMetrics(source,fontSize=17){
 const {parts}=compile(source);
 return {width:parts[2]*fontSize/1000,height:parts[3]*fontSize/1000,
  ascent:-parts[1]*fontSize/1000,descent:(parts[1]+parts[3])*fontSize/1000};
}
/** Returns an actual SVG subtree with embedded path glyphs and accurate bounds. */
export function renderLatexSvg(source,x,y,fontSize=17,{anchor='start',vertical='baseline',color='#000',opacity=1}={}){
 const {svg}=compile(source),m=mathMetrics(source,fontSize);
 const left=x-(anchor==='middle'?m.width/2:anchor==='end'?m.width:0);
 const top=vertical==='middle'?y-m.height/2:y-m.ascent;
 const copy=svg.cloneNode(true);
 // fontCache:'local' yields standalone <defs>/<use> glyphs, but cloned
 // cached labels would otherwise duplicate IDs when displayed twice in one
 // SVG export. Namespace both definitions and their references per instance.
 const mapped=new Map(),instance=`mi-math-${++nextMathInstance}-`;
 for(const element of copy.querySelectorAll('[id]')){
  const id=element.getAttribute('id');
  mapped.set(id,instance+id);element.setAttribute('id',instance+id);
 }
 if(mapped.size){
  for(const element of [copy,...copy.querySelectorAll('*')]){
   for(const attr of [...element.attributes]){
    let value=attr.value;
    if((attr.name==='href'||attr.name==='xlink:href')&&value.startsWith('#')&&mapped.has(value.slice(1)))value='#'+mapped.get(value.slice(1));
    else if(value.includes('url(#'))value=value.replace(/url\(#([^)]+)\)/g,(_whole,id)=>mapped.has(id)?`url(#${mapped.get(id)})`:_whole);
    if(value!==attr.value)element.setAttributeNS(attr.namespaceURI,attr.name,value);
   }
  }
 }
 copy.setAttribute('x',String(left));copy.setAttribute('y',String(top));
 copy.setAttribute('width',String(m.width));copy.setAttribute('height',String(m.height));
 copy.setAttribute('color',color);copy.setAttribute('opacity',String(opacity));
 copy.setAttribute('pointer-events','none');copy.removeAttribute('style');
 copy.removeAttribute('role');copy.removeAttribute('focusable');
 copy.setAttribute('aria-label',source);
 return copy;
}
export function mathCacheStats(){return {entries:cache.size,limit:CACHE_LIMIT};}
