/** Publication preflight for basic pdfLaTeX/TikZ export.
 * The current exporter prints world coordinates to five decimal places in cm.
 * Do not silently flatten geometry after quantization or exceed TeX's bounded
 * dimensions. This check is deliberately conservative; JSON/SVG stay available.
 */
import {createResolver,focalEllipse,shapeVerticesFromPoints} from './model.mjs?cut=round35';
import {regularPolygonVertices} from './geometry.mjs?cut=round27';

export const TIKZ_DECIMALS = 5;
export const TIKZ_COORD_LIMIT = 300; // cm; allow 100cm extension for infinite lines
export function tikzPoint(p){return `(${p[0].toFixed(TIKZ_DECIMALS)},${p[1].toFixed(TIKZ_DECIMALS)})`;}
export function tikzGeometryIssue(doc){
 const resolver=createResolver(doc);
 const normal=p=>Array.isArray(p)&&p.length===2&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=TIKZ_COORD_LIMIT);
 const quant=n=>Number(n.toFixed(TIKZ_DECIMALS)); // -0 and +0 render as the same TeX dimension
 const same=(a,b)=>quant(a[0])===quant(b[0])&&quant(a[1])===quant(b[1]);
 for(const o of doc.objects){
  if(o.hidden||o.style?.opacity===0)continue;
  let ps=[];
  if(o.type==='point'||o.type==='midpoint')ps=[resolver.at(o.id)];
  else if(o.type==='node'||o.type==='text')ps=[o.xy];
  else if(o.type==='freehand')ps=o.path;
  else if(o.refs)ps=resolver.points(o);
  if(ps.some(p=>!normal(p)))return 'A visible object has coordinates beyond the reliable ±300 cm TikZ export range.';
  if(o.type==='ellipse'&&ps.length===3){
   const e=focalEllipse(ps);
   if(!e||!normal([e.cx,e.cy])||e.rx>100||e.ry>100)return 'Focal ellipse exceeds TikZ export limits or is degenerate.';
   if(quant(e.rx)<=0||quant(e.ry)<=0)return 'A focal ellipse radius would collapse after TikZ rounding.';
  }
  if(['segment','arrow','line','morphism','circle','rectangle','ellipse'].includes(o.type)&&ps.length===2){
   const [a,b]=ps;
   if(a&&b&&(a[0]!==b[0]||a[1]!==b[1])&&same(a,b))return 'A visible construction would collapse after TikZ coordinate rounding.';
   if(a&&b&&['rectangle','ellipse'].includes(o.type)){
    // A rectangle may be long in one direction but lose its thin side.
    // A nonflat ellipse may similarly turn into an invalid zero-radius ellipse.
    for(let axis=0;axis<2;axis++)if(a[axis]!==b[axis]&&quant(a[axis])===quant(b[axis]))
     return 'A thin rectangle or ellipse axis would collapse after TikZ rounding.';
   }
  }
  if(['polygon','polyline','bezier','angle','freehand'].includes(o.type)){
   for(let i=1;i<ps.length;i++)if(ps[i-1]&&ps[i]&&!((ps[i-1][0]===ps[i][0])&&(ps[i-1][1]===ps[i][1]))&&same(ps[i-1],ps[i]))
    return 'An edge or curve control point would collapse after TikZ rounding.';
  }
  if(o.type==='polygon'&&ps.length>2&&ps.at(-1)&&ps[0]&&same(ps.at(-1),ps[0])&&(ps.at(-1)[0]!==ps[0][0]||ps.at(-1)[1]!==ps[0][1]))
   return 'A polygon closing edge would collapse after TikZ rounding.';
  if(['rectangle','parallelogram'].includes(o.type)&&ps.every(Boolean)){
   const vertices=shapeVerticesFromPoints(o.type,ps);
   if(vertices.length!==4||vertices.some(v=>!normal(v))||vertices.some((v,i)=>same(v,vertices[(i+1)%4])))
    return 'The rectangle or parallelogram exceeds TikZ bounds or an edge collapses after rounding.';
  }
  if(o.type==='regularPolygon'&&ps.length===2&&ps.every(Boolean)){
   const verts=regularPolygonVertices(ps[0],ps[1],o.sides);
   if(verts.some(v=>!normal(v))||verts.some((v,i)=>same(v,verts[(i+1)%verts.length])))
    return 'The regular polygon exceeds TikZ bounds or collapses after coordinate rounding.';
  }
 }
 return null;
}
