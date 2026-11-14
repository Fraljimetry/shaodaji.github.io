/** Strict locally interpreted arithmetic; no eval, arbitrary calls or property access.
 * Implicit multiplication supports 2pi, 3x, (x+1)(x-1), xy and 2sin(x).
 * Complex evaluation uses two real components, with bounded sampling later.
 */
const valid=v=>typeof v==='number'&&Number.isFinite(v);
const REAL_FUNCS={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sqrt:Math.sqrt,abs:Math.abs,log:Math.log,ln:Math.log,exp:Math.exp,floor:Math.floor,ceil:Math.ceil};
const REAL_FUNCTIONS=Object.keys(REAL_FUNCS);
const COMPLEX_FUNCTIONS=['sin','cos','tan','sinh','cosh','tanh','sqrt','abs','log','ln','exp','conj','arg','re','im'];
const VARIABLES=['x','y','t','u','v','z','i'];
const TOKENS=[...new Set([...REAL_FUNCTIONS,...COMPLEX_FUNCTIONS,'pi','e',...VARIABLES])].sort((a,b)=>b.length-a.length);
function tokenize(source){
 if(typeof source!=='string'||!source.trim()||source.length>400)throw Error('Expression must contain 1–400 characters.');
 const result=[];let i=0;
 while(i<source.length){
  const c=source[i];if(/\s/.test(c)){i++;continue;}
  const num=source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
  if(num){const n=Number(num[0]);if(!valid(n)||Math.abs(n)>=1e9)throw Error('Numeric literal out of range.');result.push({kind:'num',value:n});i+=num[0].length;continue;}
  if(/[a-z]/i.test(c)){
   const word=TOKENS.find(t=>source.slice(i,i+t.length).toLowerCase()===t);
   if(!word)throw Error('Unknown symbol near: '+source.slice(i,i+16));
   result.push({kind:'word',value:word,start:i,end:i+word.length});i+=word.length;continue;
  }
  if('()+-*/^'.includes(c)){result.push({kind:c,value:c});i++;continue;}
  throw Error('Unsupported character in expression.');
 }
 return result;
}
const R={
 num:x=>x,add:(a,b)=>a+b,sub:(a,b)=>a-b,mul:(a,b)=>a*b,div:(a,b)=>a/b,pow:(a,b)=>a**b,neg:a=>-a,
 fun:(name,x)=>REAL_FUNCS[name](x),fromVar:(name,vars)=>vars[name],fromConst:name=>name==='pi'?Math.PI:Math.E
};
const C={
 num:x=>[x,0],add:(a,b)=>[a[0]+b[0],a[1]+b[1]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1]],
 mul:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],
 div:(a,b)=>{const d=b[0]**2+b[1]**2;return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];},
 neg:a=>[-a[0],-a[1]],fromVar:(_name,vars)=>vars.z,fromConst:name=>name==='pi'?[Math.PI,0]:name==='e'?[Math.E,0]:[0,1],
 fun(name,z){const [x,y]=z,r=Math.hypot(x,y),a=Math.atan2(y,x);
  if(name==='re')return [x,0];if(name==='im')return [y,0];if(name==='conj')return [x,-y];
  if(name==='arg')return [a,0];if(name==='abs')return [r,0];
  if(name==='log'||name==='ln')return [Math.log(r),a];
  if(name==='exp'){const v=Math.exp(x);return [v*Math.cos(y),v*Math.sin(y)];}
  if(name==='sqrt')return [Math.sqrt(r)*Math.cos(a/2),Math.sqrt(r)*Math.sin(a/2)];
  if(name==='sin')return [Math.sin(x)*Math.cosh(y),Math.cos(x)*Math.sinh(y)];
  if(name==='cos')return [Math.cos(x)*Math.cosh(y),-Math.sin(x)*Math.sinh(y)];
  if(name==='sinh')return [Math.sinh(x)*Math.cos(y),Math.cosh(x)*Math.sin(y)];
  if(name==='cosh')return [Math.cosh(x)*Math.cos(y),Math.sinh(x)*Math.sin(y)];
  if(name==='tan')return C.div(C.fun('sin',z),C.fun('cos',z));
  if(name==='tanh')return C.div(C.fun('sinh',z),C.fun('cosh',z));
  throw Error('Unsupported complex function: '+name);
 }
};
C.pow=(a,b)=>{
 if(a[0]===0&&a[1]===0&&b[1]===0&&b[0]>0)return [0,0];
 return C.fun('exp',C.mul(b,C.fun('log',a)));
};
function compile(source,variables,complex=false){
 const allowed=new Set(variables);const ts=tokenize(source),ops=complex?C:R,functions=complex?COMPLEX_FUNCTIONS:REAL_FUNCTIONS;
 let i=0;const peek=()=>ts[i],take=()=>ts[i++];
 function atom(){
  const t=take();if(!t)throw Error('Incomplete expression.');
  if(t.kind==='+'||t.kind==='-'){const n=expr(3);return vars=>t.kind==='-'?ops.neg(n(vars)):n(vars);}
  if(t.kind==='('){const n=expr(0);if(take()?.kind!==')')throw Error('Missing closing parenthesis.');return n;}
  if(t.kind==='num')return ()=>ops.num(t.value);
  if(t.kind==='word'){
   const name=t.value;
   if(allowed.has(name))return vars=>ops.fromVar(name,vars);
   if(name==='pi'||name==='e'||complex&&name==='i')return ()=>ops.fromConst(name);
   if(functions.includes(name)){
    if(take()?.kind!=='(')throw Error(`Function ${name} requires parentheses.`);
    const inner=expr(0);if(take()?.kind!==')')throw Error('Missing closing parenthesis.');return vars=>ops.fun(name,inner(vars));
   }
   throw Error('Unknown symbol: '+name);
  }
  throw Error('Unexpected operator: '+t.value);
 }
 const priority={'+':1,'-':1,'*':2,'/':2,'^':4};
 function expr(min){let left=atom();while(true){
  const t=peek();if(!t||t.kind===')')break;
  // Juxtaposition means multiplication, including 2pi, xy, and (...) (...).
  const implied=t.kind==='num'||t.kind==='word'||t.kind==='(';
  const op=implied?'*':t.kind,p=priority[op];if(p===undefined||p<min)break;
  if(!implied)take();const right=expr(op==='^'?p:p+1),prev=left;
  left=vars=>op==='+'?ops.add(prev(vars),right(vars)):op==='-'?ops.sub(prev(vars),right(vars)):op==='*'?ops.mul(prev(vars),right(vars)):op==='/'?ops.div(prev(vars),right(vars)):ops.pow(prev(vars),right(vars));
 }return left;}
 const result=expr(0);if(i!==ts.length)throw Error('Unexpected token: '+ts[i].value);return result;
}
export function parseCurveExpression(source,variables=['x']){
 if(!Array.isArray(variables)||variables.some(v=>!['x','y','t','u','v'].includes(v)))throw Error('Invalid expression variables.');
 return compile(source,variables);
}
/** parameter undefined means compatibility with imported legacy u=v curves only. */
export function parseParametric(xExpr,yExpr,parameter){
 if(parameter!==undefined&&!['t','u','v'].includes(parameter))throw Error('Parameter must be t, u or v.');
 const vars=parameter?[parameter]:['u','v'];
 const fx=parseCurveExpression(xExpr,vars),fy=parseCurveExpression(yExpr,vars);
 return s=>{const values=parameter?{[parameter]:s}:{u:s,v:s};return [fx(values),fy(values)];};
}
export function parseImplicit(source){
 if(typeof source!=='string'||source.length>801)throw Error('Implicit equation is too long.');
 const pieces=source.split('=');if(pieces.length>2)throw Error('Use at most one equals sign.');
 const left=parseCurveExpression(pieces[0],['x','y']);
 const right=pieces.length===2?parseCurveExpression(pieces[1],['x','y']):()=>0;
 return (x,y)=>left({x,y})-right({x,y});
}
export function parseVectorField(xExpr,yExpr){
 const x=parseCurveExpression(xExpr,['x','y']),y=parseCurveExpression(yExpr,['x','y']);
 return (a,b)=>[x({x:a,y:b}),y({x:a,y:b})];
}
/** Retarget one shared parameter without altering e.g. sqrt, pi or scientific notation. */
export function renameCurveParameter(source,oldSymbol,newSymbol){
 if(!['t','u','v'].includes(oldSymbol)||!['t','u','v'].includes(newSymbol))throw Error('Invalid parameter rename.');
 if(!source.trim())return source;
 const words=tokenize(source).filter(t=>t.kind==='word'&&t.value===oldSymbol);let next='',end=0;
 for(const t of words){next+=source.slice(end,t.start)+newSymbol;end=t.end;}
 return next+source.slice(end);
}
export function parseComplexExpression(source){const fn=compile(source,['z'],true);return (re,im)=>fn({z:[re,im]});}
export function validatePlotRegion(r){
 if(!r||typeof r!=='object'||!['xMin','xMax','yMin','yMax'].every(k=>valid(r[k])&&Math.abs(r[k])<=1e6)||r.xMin>=r.xMax||r.yMin>=r.yMax)throw Error('Region needs ascending finite x and y ranges within ±1,000,000.');
 return r;
}
/** Finite region, uniform world-space samples. Invisible/undefined vectors leave gaps. */
export function sampleVectorField(fn,region,{density=12,normalized=false,maxEvaluations=80000}={}){
 validatePlotRegion(region);
 if(!Number.isInteger(density)||density<3||density>40||typeof normalized!=='boolean')throw Error('Vector density must be 3–40.');
 const ratio=(region.yMax-region.yMin)/(region.xMax-region.xMin),nx=density,ny=Math.max(2,Math.min(60,Math.round(nx*ratio)));
 if(nx*ny>maxEvaluations)return {arrows:[],limited:true,evaluations:0};
 const dx=(region.xMax-region.xMin)/nx,dy=(region.yMax-region.yMin)/ny,scale=Math.min(dx,dy)*.37;
 const arrows=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const x=region.xMin+(i+.5)*dx,y=region.yMin+(j+.5)*dy;
  let v;try{v=fn(x,y);}catch{continue;}
  if(!Array.isArray(v)||v.length!==2||!v.every(valid))continue;
  const magnitude=Math.hypot(...v);if(!valid(magnitude)||magnitude<1e-12)continue;
  const length=normalized?scale:scale*Math.min(1.6,magnitude);
  const ux=v[0]/magnitude,uy=v[1]/magnitude;
  arrows.push({start:[x-ux*length*.5,y-uy*length*.5],end:[x+ux*length*.5,y+uy*length*.5],magnitude});
 }
 return {arrows,limited:false,evaluations:nx*ny};
}
export function domainColor(re,im,mode='phase-modulus'){
 if(!valid(re)||!valid(im))return null;
 const hue=((Math.atan2(im,re)*180/Math.PI)%360+360)%360;
 const radius=Math.hypot(re,im);
 // Keep hue continuous and use log-modulus bands to distinguish zeros/poles.
 const band=Math.log2(Math.max(1e-12,radius)),fract=((band%1)+1)%1;
 const light=mode==='phase'?0.52:mode==='contours'?0.36+0.38*fract:0.42+0.28*Math.tanh(band/3);
 const saturation=.82;
 const f=n=>{const k=(n+hue/30)%12,a=saturation*Math.min(light,1-light);return Math.round(255*(light-a*Math.max(-1,Math.min(k-3,9-k,1))));};
 return [f(0),f(8),f(4),255];
}
export function sampleDomainColors(fn,region,{resolution=128,mode='phase-modulus',maxEvaluations=80000}={}){
 validatePlotRegion(region);
 if(!Number.isInteger(resolution)||resolution<32||resolution>256||!['phase-modulus','phase','contours'].includes(mode))throw Error('Invalid domain coloring settings.');
 const height=Math.max(16,Math.round(resolution*(region.yMax-region.yMin)/(region.xMax-region.xMin)));
 const width=resolution;if(width*height>maxEvaluations)return {rgba:new Uint8ClampedArray(0),width,height,limited:true,evaluations:0};
 const rgba=new Uint8ClampedArray(width*height*4);
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  let result;try{result=fn(region.xMin+(i+.5)*(region.xMax-region.xMin)/width,region.yMax-(j+.5)*(region.yMax-region.yMin)/height);}catch{}
  const rgb=Array.isArray(result)?domainColor(result[0],result[1],mode):null;
  if(rgb)rgba.set(rgb,(j*width+i)*4);
 }
 return {rgba,width,height,limited:false,evaluations:width*height};
}
/** Adaptive screen-space chord-error sampling with conservative pole gaps. */
export function sampleParametricPlot(fn,start,end,project,{quality='balanced',maxEvaluations=80000}={}){
 if(typeof fn!=='function'||typeof project!=='function'||!valid(start)||!valid(end)||start>=end||Math.abs(start)>1e6||Math.abs(end)>1e6)throw Error('Invalid parameter range.');
 const levels={fast:[180,3],balanced:[420,5],detailed:[850,7]};if(!levels[quality])throw Error('Invalid plotting detail.');
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<100||maxEvaluations>100000)throw Error('Invalid plotting budget.');
 const [steps,depth]=levels[quality],segments=[];let evaluations=0,limited=false,breaks=0,chain=[];
 const flush=()=>{if(chain.length>1)segments.push(chain);chain=[];};
 const sample=s=>{if(evaluations>=maxEvaluations){limited=true;return null;}evaluations++;try{const p=fn(s);if(!Array.isArray(p)||p.length!==2||!p.every(valid))return null;const q=project(p);return Array.isArray(q)&&q.length===2&&q.every(x=>valid(x)&&Math.abs(x)<1e7)?q:null;}catch{return null;}};
 const add=p=>{if(p&&(!chain.length||chain.at(-1)[0]!==p[0]||chain.at(-1)[1]!==p[1]))chain.push(p);};
 function trace(a,pa,b,pb,level){
  if(limited)return;
  const mid=(a+b)/2,pm=sample(mid);
  if(!pa||!pb||!pm){
   if(level<depth){trace(a,pa,mid,pm,level+1);flush();trace(mid,pm,b,pb,level+1);}else{flush();breaks++;}
   return;
  }
  const jump=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);
  const error=Math.hypot(pm[0]-(pa[0]+pb[0])/2,pm[1]-(pa[1]+pb[1])/2);
  if((jump>200||error>2.5)&&level<depth){trace(a,pa,mid,pm,level+1);trace(mid,pm,b,pb,level+1);return;}
  if(jump>300||error>15){flush();breaks++;return;}
  add(pa);add(pb);
 }
 let a=start,pa=sample(start);
 for(let i=1;i<=steps;i++){const b=start+(end-start)*i/steps,pb=sample(b);trace(a,pa,b,pb,0);if(limited)break;a=b;pa=pb;}
 flush();return {segments,evaluations,limited,breaks};
}
/** Bounded marching squares; ambiguous saddle cells use center sign.
 * No extrapolation through nonfinite cells. Segments are screen coordinates.
 * Numeric approximation, not a certified implicit topology solver. */
export function sampleImplicitPlot(fn,xAtPx,yAtPx,width,height,{quality='balanced',cellPx=12,maxEvaluations=80000}={}){
 if(typeof fn!=='function'||typeof xAtPx!=='function'||typeof yAtPx!=='function'||!valid(width)||!valid(height)||width<=0||height<=0||width>10000||height>10000)throw Error('Invalid implicit viewport.');
 if(!['fast','balanced','detailed'].includes(quality)||!Number.isInteger(cellPx)||cellPx<6||cellPx>24)throw Error('Invalid implicit plot detail.');
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<100||maxEvaluations>100000)throw Error('Invalid plotting budget.');
 const factor={fast:1.5,balanced:1,detailed:.7}[quality],step=cellPx*factor;
 const nx=Math.max(1,Math.ceil(width/step)),ny=Math.max(1,Math.ceil(height/step));
 if((nx+1)*(ny+1)>maxEvaluations)return {segments:[],evaluations:0,breaks:0,limited:true};
 let evaluations=0,breaks=0;const vals=new Float64Array((nx+1)*(ny+1));
 const idx=(x,y)=>y*(nx+1)+x;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const px=width*i/nx,py=height*j/ny;let f;
  try{f=fn(xAtPx(px),yAtPx(py));}catch{f=NaN;}
  vals[idx(i,j)]=valid(f)?f:NaN;evaluations++;
 }
 const segments=[];
 function interp(a,b,fa,fb){const denom=fa-fb,t=denom===0?.5:Math.max(0,Math.min(1,fa/denom));return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const x0=width*i/nx,x1=width*(i+1)/nx,y0=height*j/ny,y1=height*(j+1)/ny;
  const p=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  const z=[vals[idx(i,j)],vals[idx(i+1,j)],vals[idx(i+1,j+1)],vals[idx(i,j+1)]];
  if(z.some(v=>!valid(v))){breaks++;continue;}
  const crossings=[];for(let e=0;e<4;e++){const k=(e+1)%4;if((z[e]<0)!==(z[k]<0))crossings.push(interp(p[e],p[k],z[e],z[k]));}
  if(crossings.length===2)segments.push(crossings);
  else if(crossings.length===4){const cx=(x0+x1)/2,cy=(y0+y1)/2;let center;try{center=fn(xAtPx(cx),yAtPx(cy));}catch{center=NaN;}
   evaluations++;if(evaluations>maxEvaluations)return {segments:[],evaluations,breaks,limited:true};
   if(!valid(center)){breaks++;continue;}
   // Keep the center-connected sign component continuous; isolate opposite corners.
   const same=(center<0)===(z[0]<0);
   segments.push([crossings[0],crossings[same?1:3]],[crossings[same?2:1],crossings[same?3:2]]);
  }
 }
 return {segments,evaluations,limited:false,breaks};
}
