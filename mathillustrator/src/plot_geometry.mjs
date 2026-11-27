/** Exact, deliberately limited polynomial recognition. Never infer geometry from sampled pixels.
 * Unsupported syntax returns null; plotted paths remain ordinary curves. */
const z=()=>[0,0,0,0,0,0]; // 1,x,y,x²,xy,y²
function add(a,b,s=1){return a.map((v,i)=>v+s*b[i]);}
function mult(a,b){
 const out=z(),powers=[[0,0],[1,0],[0,1],[2,0],[1,1],[0,2]];
 for(let i=0;i<6;i++)for(let j=0;j<6;j++){
  const u=powers[i][0]+powers[j][0],v=powers[i][1]+powers[j][1];
  const k=powers.findIndex(p=>p[0]===u&&p[1]===v);
  if(k<0){if(a[i]!==0&&b[j]!==0)return null;}else out[k]+=a[i]*b[j];
 }return out;
}
export function polynomial2(source){
 if(typeof source!=='string'||source.length>240)return null;
 const compact=source.replace(/\s+/g,'').toLowerCase();
 // Use the plotting parser's multiplication and constant conventions. Never
 // approximate a sampled curve to manufacture an exact geometric object.
 const raw=compact.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|phi|φ|ϕ|pi|e|[xy()+*/^\-]/g)||[];
 if(raw.join('')!==compact)return null;
 const ts=[];
 for(const token of raw){
  const previous=ts.at(-1);
  const priorValue=previous&&(/^(?:\d|\.|pi$|phi$|φ$|ϕ$|e$|x$|y$|\)$)/.test(previous));
  const nextValue=/^(?:\d|\.|pi$|phi$|φ$|ϕ$|e$|x$|y$|\()/.test(token);
  if(priorValue&&nextValue)ts.push('*');
  ts.push(token);
 }
 let k=0;
 const peek=()=>ts[k],take=()=>ts[k++];
 function primary(){const t=take();if(!t)return null;
  if(t==='('){const a=expr();if(take()!==')')return null;return a;}
  if(t==='x'||t==='y'){const a=z();a[t==='x'?1:2]=1;return a;}
  if(['pi','e','phi','φ','ϕ'].includes(t)){const a=z();a[0]=t==='pi'?Math.PI:t==='e'?Math.E:(1+Math.sqrt(5))/2;return a;}
  const n=Number(t);if(!Number.isFinite(n))return null;const a=z();a[0]=n;return a;
 }
 function power(){let a=primary();if(!a)return null;if(peek()==='^'){take();const exp=Number(take());if(![0,1,2].includes(exp))return null;if(exp===0){a=z();a[0]=1;}else if(exp===2)a=mult(a,a);}return a;}
 function unary(){if(peek()==='+'||peek()==='-'){const op=take(),a=unary();return a&&(op==='-'?a.map(v=>-v):a);}return power();}
 function product(){let a=unary();if(!a)return null;while(peek()==='*'||peek()==='/'){const op=take(),b=unary();if(!b)return null;
  if(op==='*'){a=mult(a,b);}else{if(b.slice(1).some(v=>v!==0)||b[0]===0)return null;a=a.map(v=>v/b[0]);}if(!a)return null;
 }return a;}
 function expr(){let a=product();if(!a)return null;while(peek()==='+'||peek()==='-'){const op=take(),b=product();if(!b)return null;a=add(a,b,op==='+'?1:-1);}return a;}
 const result=expr();return result&&k===ts.length&&result.every(Number.isFinite)?result:null;
}
function zero(v){return v===0;}
function clean(source){return String(source||'').replace(/\s+/g,'').toLowerCase();}
function circleFromCoefficients(p){const [c,x,y,xx,xy,yy]=p,scale=Math.max(...p.map(Math.abs),1);
 if(!zero(xy,scale)||zero(xx,scale)||!zero(xx-yy,scale))return null;
 const cx=-x/(2*xx),cy=-y/(2*xx),r2=cx*cx+cy*cy-c/xx,r=Math.sqrt(r2);
 return Number.isFinite(r)&&r>0&&[cx,cy].every(Number.isFinite)?{kind:'circle',center:[cx,cy],radius:r}:null;
}
function lineFromCoefficients(p){const [c,x,y,xx,xy,yy]=p,scale=Math.max(...p.map(Math.abs),1);
 if(![xx,xy,yy].every(v=>zero(v,scale)))return null;
 const norm=Math.hypot(x,y);if(norm===0)return null;
 return {kind:'line',a:[-c*x/(norm*norm),-c*y/(norm*norm)],d:[-y/norm,x/norm],domain:'infinite',length:1};
}
function fullTurn(o){return Math.abs((o.tMax-o.tMin)-2*Math.PI)<=32*Number.EPSILON*Math.max(1,Math.abs(o.tMin),Math.abs(o.tMax),2*Math.PI);}
/** The returned shape is valid only for the specifically recognized syntax, not an approximation. */
export function recognizedPlotGeometry(o){
 if(!o||!['function','implicit','parametric'].includes(o.type))return null;
 if(o.type==='function'){
  const p=polynomial2(o.expr);return p&&zero(p[3])&&zero(p[4])&&zero(p[5])&&zero(p[2])
   ?{kind:'line',a:[0,p[0]],d:[1,p[1]],domain:'infinite',length:1}:null;
 }
 if(o.type==='implicit'){
  const parts=String(o.expr).split('=');if(parts.length>2)return null;
  const a=polynomial2(parts[0]),b=parts.length===2?polynomial2(parts[1]):[0,0,0,0,0,0];
  if(!a||!b)return null;const p=add(a,b,-1);
  return circleFromCoefficients(p)||lineFromCoefficients(p);
 }
 if(o.polar){
  const p=polynomial2(clean(o.rExpr).replace(/\bt\b/g,'x'));
  if(!p||p.slice(1).some(v=>!zero(v))||!fullTurn(o))return null;
  const r=Math.abs(p[0]);return r>0?{kind:'circle',center:[0,0],radius:r}:null;
 }
 const t=o.parameter||'t',x=clean(o.xExpr),y=clean(o.yExpr);
 // Full circles with simple translated/scaled sine/cosine components.
 const component=(source)=>{
  const match=source.match(/^([+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)\*?)?)(sin|cos)\((t|u|v)\)([+-](?:\d+(?:\.\d*)?|\.\d+))?$/);
  if(!match||match[3]!==t)return null;
  const raw=match[1],factor=!raw||raw==='+'?1:raw==='-'?-1:Number(raw.replace(/\*$/,''));
  const offset=Number(match[4]||0);
  return Number.isFinite(factor)&&Number.isFinite(offset)?{factor,kind:match[2],offset}:null;
 };
 const xc=component(x),yc=component(y);
 if(fullTurn(o)&&xc&&yc&&xc.kind!==yc.kind&&Math.abs(xc.factor)===Math.abs(yc.factor)&&xc.factor!==0)
  return {kind:'circle',center:[xc.offset,yc.offset],radius:Math.abs(xc.factor)};
 // Linear parameter components yield finite line segments (not infinite lines).
 const px=polynomial2(x.replace(new RegExp(`\\b${t}\\b`,'g'),'x'));
 const py=polynomial2(y.replace(new RegExp(`\\b${t}\\b`,'g'),'x'));
 if(!px||!py||[px,py].some(p=>[p[2],p[3],p[4],p[5]].some(v=>!zero(v))))return null;
 const dx=px[1],dy=py[1],norm=Math.hypot(dx,dy);if(norm===0)return null;
 return {kind:'line',a:[px[0]+dx*o.tMin,py[0]+dy*o.tMin],d:[dx/norm,dy/norm],domain:'segment',length:norm*(o.tMax-o.tMin)};
}
