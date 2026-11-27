/** Strict locally interpreted arithmetic; no eval, arbitrary calls or property access.
 * Implicit multiplication supports 2pi, 3x, (x+1)(x-1), xy and 2sin(x).
 * Complex evaluation uses two real components, with bounded sampling later.
 */
const valid=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);
const REAL_FUNCS={
 sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,
 sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,asinh:Math.asinh,acosh:Math.acosh,atanh:Math.atanh,
 sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),
 sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,sign:Math.sign,
 log:Math.log,ln:Math.log,log10:Math.log10,log2:Math.log2,exp:Math.exp,expm1:Math.expm1,log1p:Math.log1p,
 floor:Math.floor,ceil:Math.ceil,round:Math.round,trunc:Math.trunc,
 min:Math.min,max:Math.max,hypot:Math.hypot,atan2:Math.atan2,pow:Math.pow,mod:(x,y)=>((x%y)+y)%y,clamp
};
const REAL_FUNCTIONS=Object.keys(REAL_FUNCS);
const COMPLEX_FUNCTIONS=['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','asinh','acosh','atanh','sec','csc','cot','sqrt','cbrt','abs','sign','log','ln','log10','log2','log1p','exp','expm1','conj','arg','re','im','norm','pow'];
const FUNCTION_ARITY={min:[2,32],max:[2,32],hypot:[2,32],atan2:[2,2],pow:[2,2],mod:[2,2],clamp:[3,3]};
const GOLDEN_RATIO=(1+Math.sqrt(5))/2;
const CONSTANTS={pi:Math.PI,e:Math.E,phi:GOLDEN_RATIO};
const VARIABLES=['x','y','t','u','v','z','i'];
const TOKENS=[...new Set([...REAL_FUNCTIONS,...COMPLEX_FUNCTIONS,...Object.keys(CONSTANTS),...VARIABLES])].sort((a,b)=>b.length-a.length);
function tokenize(source,extraVariables=[]){
 if(typeof source!=='string'||!source.trim()||source.length>400)throw Error('Expression must contain 1–400 characters.');
 const result=[];let i=0;
 while(i<source.length){
  const c=source[i];if(/\s/.test(c)){i++;continue;}
  const num=source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
  if(num){const n=Number(num[0]);if(!valid(n)||Math.abs(n)>=1e9)throw Error('Numeric literal out of range.');result.push({kind:'num',value:n});i+=num[0].length;continue;}
  if(c==='φ'||c==='ϕ'){result.push({kind:'word',value:'phi',start:i,end:i+1});i++;continue;}
  if(/[a-z]/i.test(c)){
   const word=[...extraVariables,...TOKENS].sort((a,b)=>b.length-a.length).find(t=>extraVariables.includes(t)?source.slice(i,i+t.length)===t:source.slice(i,i+t.length).toLowerCase()===t);
   if(!word)throw Error('Unknown symbol near: '+source.slice(i,i+16));
   result.push({kind:'word',value:word,start:i,end:i+word.length});i+=word.length;continue;
  }
  if('(),+-*/^'.includes(c)){result.push({kind:c,value:c});i++;continue;}
  throw Error('Unsupported character in expression.');
 }
 return result;
}
const R={
 num:x=>x,add:(a,b)=>a+b,sub:(a,b)=>a-b,mul:(a,b)=>a*b,div:(a,b)=>a/b,pow:(a,b)=>a**b,neg:a=>-a,
 fun:(name,args)=>REAL_FUNCS[name](...args),fromVar:(name,vars)=>vars[name],fromConst:name=>CONSTANTS[name]
};
const C={
 num:x=>[x,0],add:(a,b)=>[a[0]+b[0],a[1]+b[1]],sub:(a,b)=>[a[0]-b[0],a[1]-b[1]],
 mul:(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],
 div:(a,b)=>{
  const d=b[0]**2+b[1]**2,re=a[0]*b[0]+a[1]*b[1],im=a[1]*b[0]-a[0]*b[1];
  // Preserve ordinary arithmetic; rescale when products overflow or the
  // squared denominator approaches the subnormal range.
  if(d>=1e-300&&Number.isFinite(d)&&Math.max(Math.abs(a[0]),Math.abs(a[1]))>=1e-150&&Number.isFinite(re)&&Number.isFinite(im))return [re/d,im/d];
  const scale=Math.max(Math.abs(b[0]),Math.abs(b[1]));
  if(!(scale>0)||!Number.isFinite(scale))return [NaN,NaN];
  const x=b[0]/scale,y=b[1]/scale,n=x*x+y*y;
  const u=a[0]/scale,v=a[1]/scale;
  if(Number.isFinite(u)&&Number.isFinite(v))return [u*(x/n)+v*(y/n),v*(x/n)-u*(y/n)];
  // If dividing the numerator by scale alone overflows, apply the bounded
  // denominator coefficients first; each final component may still fit.
  return [(a[0]*(x/n)+a[1]*(y/n))/scale,(a[1]*(x/n)-a[0]*(y/n))/scale];
 },
 neg:a=>[-a[0],-a[1]],fromVar:(name,vars)=>name==='z'?vars.z:[vars[name],0],fromConst:name=>name==='i'?[0,1]:[CONSTANTS[name],0],
 fun(name,args){const z=args[0], [x,y]=z,r=Math.hypot(x,y),a=Math.atan2(y,x);
  if(name==='pow')return C.pow(z,args[1]);
  if(name==='norm')return [r*r,0];
  if(name==='sign')return r===0?[0,0]:[x/r,y/r];
  if(name==='log10'||name==='log2'){const w=C.fun('log',[z]),d=Math.log(name==='log10'?10:2);return [w[0]/d,w[1]/d];}
  if(name==='log1p')return C.fun('log',[C.add([1,0],z)]);
  if(name==='expm1')return C.sub(C.fun('exp',[z]),[1,0]);
  if(name==='cbrt')return C.pow(z,[1/3,0]);
  if(name==='sec'||name==='csc'||name==='cot')return C.div([1,0],C.fun(name==='sec'?'cos':name==='csc'?'sin':'tan',[z]));
  if(name==='asinh')return C.fun('log',[C.add(z,C.fun('sqrt',[C.add(C.mul(z,z),[1,0])]))]);
  if(name==='acosh')return C.fun('log',[C.add(z,C.mul(C.fun('sqrt',[C.add(z,[1,0])]),C.fun('sqrt',[C.sub(z,[1,0])])))]);
  if(name==='atanh')return C.mul([.5,0],C.sub(C.fun('log',[C.add([1,0],z)]),C.fun('log',[C.sub([1,0],z)])));
  if(name==='asin'){const iz=C.mul([0,1],z),inside=C.add(iz,C.fun('sqrt',[C.sub([1,0],C.mul(z,z))]));return C.mul([0,-1],C.fun('log',[inside]));}
  if(name==='acos')return C.sub([Math.PI/2,0],C.fun('asin',[z]));
  if(name==='atan'){const iz=C.mul([0,1],z);return C.mul([0,-.5],C.sub(C.fun('log',[C.add([1,0],iz)]),C.fun('log',[C.sub([1,0],iz)])));}
  if(name==='re')return [x,0];if(name==='im')return [y,0];if(name==='conj')return [x,-y];
  if(name==='arg')return [a,0];if(name==='abs')return [r,0];
  if(name==='log'||name==='ln')return [Math.log(r),a];
  if(name==='exp'){const v=Math.exp(x);return [v*Math.cos(y),v*Math.sin(y)];}
  if(name==='sqrt')return [Math.sqrt(r)*Math.cos(a/2),Math.sqrt(r)*Math.sin(a/2)];
  if(name==='sin')return [Math.sin(x)*Math.cosh(y),Math.cos(x)*Math.sinh(y)];
  if(name==='cos')return [Math.cos(x)*Math.cosh(y),-Math.sin(x)*Math.sinh(y)];
  if(name==='sinh')return [Math.sinh(x)*Math.cos(y),Math.cosh(x)*Math.sin(y)];
  if(name==='cosh')return [Math.cosh(x)*Math.cos(y),Math.sinh(x)*Math.sin(y)];
  if(name==='tan')return C.div(C.fun('sin',[z]),C.fun('cos',[z]));
  if(name==='tanh')return C.div(C.fun('sinh',[z]),C.fun('cosh',[z]));
  throw Error('Unsupported complex function: '+name);
 }
};
C.pow=(a,b)=>{
 if(b[0]===0&&b[1]===0)return [1,0];
 if(a[0]===0&&a[1]===0&&b[1]===0&&b[0]>0)return [0,0];
 return C.fun('exp',[C.mul(b,C.fun('log',[a]))]);
};
function compile(source,variables,complex=false){
 const allowed=new Set(variables);const ts=tokenize(source,variables.filter(name=>!TOKENS.includes(name))),ops=complex?C:R,functions=complex?COMPLEX_FUNCTIONS:REAL_FUNCTIONS;
 let i=0;const peek=()=>ts[i],take=()=>ts[i++];
 function atom(){
  const t=take();if(!t)throw Error('Incomplete expression.');
  if(t.kind==='+'||t.kind==='-'){const n=expr(3);return vars=>t.kind==='-'?ops.neg(n(vars)):n(vars);}
  if(t.kind==='('){const n=expr(0);if(take()?.kind!==')')throw Error('Missing closing parenthesis.');return n;}
  if(t.kind==='num')return ()=>ops.num(t.value);
  if(t.kind==='word'){
   const name=t.value;
   if(allowed.has(name))return vars=>ops.fromVar(name,vars);
   if(Object.hasOwn(CONSTANTS,name)||complex&&name==='i')return ()=>ops.fromConst(name);
   if(functions.includes(name)){
    if(take()?.kind!=='(')throw Error(`Function ${name} requires parentheses.`);
    const args=[expr(0)];while(peek()?.kind===','){take();args.push(expr(0));if(args.length>32)throw Error('Too many function arguments.');}
    if(take()?.kind!==')')throw Error('Missing closing parenthesis.');
    const [min,max]=FUNCTION_ARITY[name]||[1,1];
    if(args.length<min||args.length>max)throw Error(`${name} expects ${min===max?min:`${min}–${max}`} arguments.`);
    // Real scalar fields evaluate this closure millions of times. For the
    // overwhelmingly common unary functions, avoid allocating an argument
    // array and spreading it on every sample. Keep the complex interpreter
    // and multi-argument semantics unchanged.
    if(!complex&&args.length===1){const arg=args[0],operation=REAL_FUNCS[name];return vars=>operation(arg(vars));}
    return vars=>ops.fun(name,args.map(fn=>fn(vars)));
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
  // Select the real operator once at parse time instead of branching and
  // dispatching through the interpreter for every scalar-field sample.
  // Complex expressions retain their established vector operations.
  if(!complex){
   if(op==='+')left=vars=>prev(vars)+right(vars);
   else if(op==='-')left=vars=>prev(vars)-right(vars);
   else if(op==='*')left=vars=>prev(vars)*right(vars);
   else if(op==='/')left=vars=>prev(vars)/right(vars);
   else left=vars=>prev(vars)**right(vars);
  }else left=vars=>op==='+'?ops.add(prev(vars),right(vars)):op==='-'?ops.sub(prev(vars),right(vars)):op==='*'?ops.mul(prev(vars),right(vars)):op==='/'?ops.div(prev(vars),right(vars)):ops.pow(prev(vars),right(vars));
 }return left;}
 const result=expr(0);if(i!==ts.length)throw Error('Unexpected token: '+ts[i].value);return result;
}
export function parseCurveExpression(source,variables=['x']){
 if(!Array.isArray(variables)||variables.length>70||variables.some(v=>typeof v!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(v)||(!['x','y','z','t','u','v'].includes(v)&&(REAL_FUNCTIONS.includes(v.toLowerCase())||Object.hasOwn(CONSTANTS,v.toLowerCase())))))throw Error('Invalid expression variables.');
 return compile(source,variables);
}
/** parameter undefined means compatibility with imported legacy u=v curves only. */
export function parseParametric(xExpr,yExpr,parameter,parameters={}){
 if(parameter!==undefined&&!['t','u','v'].includes(parameter))throw Error('Parameter must be t, u or v.');
 const vars=parameter?[parameter]:['u','v'];
 const active=Object.fromEntries(Object.entries(parameters).filter(([name])=>!vars.includes(name)));
 const fx=parseCurveExpression(xExpr,[...vars,...Object.keys(active)]),fy=parseCurveExpression(yExpr,[...vars,...Object.keys(active)]);
 return s=>{const values=parameter?{...active,[parameter]:s}:{...active,u:s,v:s};return [fx(values),fy(values)];};
}
export function parseImplicit(source,parameters={}){
 if(typeof source!=='string'||source.length>801)throw Error('Implicit equation is too long.');
 const pieces=source.split('=');if(pieces.length>2)throw Error('Use at most one equals sign.');
 const active=Object.fromEntries(Object.entries(parameters).filter(([name])=>!['x','y'].includes(name)));
 const variables=['x','y',...Object.keys(active)];
 const left=parseCurveExpression(pieces[0],variables);
 const right=pieces.length===2?parseCurveExpression(pieces[1],variables):()=>0;
 return (x,y)=>left({...active,x,y})-right({...active,x,y});
}
export function parseVectorField(xExpr,yExpr,parameters={}){
 const active=Object.fromEntries(Object.entries(parameters).filter(([name])=>!['x','y'].includes(name)));
 const variables=['x','y',...Object.keys(active)];
 const x=parseCurveExpression(xExpr,variables),y=parseCurveExpression(yExpr,variables);
 return (a,b)=>[x({...active,x:a,y:b}),y({...active,x:a,y:b})];
}
/** Retarget one shared parameter without altering constants, functions or scientific notation. */
export function renameCurveParameter(source,oldSymbol,newSymbol,sliderNames=[]){
 if(!['t','u','v'].includes(oldSymbol)||!['t','u','v'].includes(newSymbol))throw Error('Invalid parameter rename.');
 if(!source.trim())return source;
 // Preserve the historical implicit-multiplication semantics (`tpi` is t*pi),
 // while accepting additional named sliders alongside built-in symbols.
 const words=tokenize(source,sliderNames.filter(name=>name!==oldSymbol&&name!==newSymbol)).filter(t=>t.kind==='word'&&t.value===oldSymbol);
 let next='',end=0;for(const t of words){next+=source.slice(end,t.start)+newSymbol;end=t.end;}
 return next+source.slice(end);
}
export function parseComplexExpression(source,parameters={}){
 const active=Object.fromEntries(Object.entries(parameters).filter(([name])=>name!=='z'&&name!=='i'));
 const fn=compile(source,['z',...Object.keys(active)],true);return (re,im)=>fn({...active,z:[re,im]});
}
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
export const IMPLICIT_COLOR_MODES=Object.freeze(['range','diverging','grayscale','heat','viridis','sign','bands']);
function interpolateStops(stops,t){
 const scaled=clamp(t,0,1)*(stops.length-1),segment=Math.min(stops.length-2,Math.floor(scaled)),mix=scaled-segment;
 return stops[segment].map((start,index)=>Math.round(start+(stops[segment+1][index]-start)*mix));
}
function normalizedScalar(value,min,max){
 if(!(valid(value)&&valid(min)&&valid(max))||!(max>min))return .5;
 if(value<=min)return 0;if(value>=max)return 1;
 const span=max-min;return valid(span)?(value-min)/span:(value/2-min/2)/(max/2-min/2);
}
function divergingScalar(value,min,max){
 const blue=[59,130,246],white=[255,255,255],red=[239,68,68];
 if(!(valid(value)&&valid(min)&&valid(max)))return white;
 if(min<0&&max>0){
  if(value<0){const t=clamp(Math.abs(value/min),0,1);return white.map((start,index)=>Math.round(start+(blue[index]-start)*t));}
  if(value>0){const t=clamp(Math.abs(value/max),0,1);return white.map((start,index)=>Math.round(start+(red[index]-start)*t));}
  return white;
 }
 const t=normalizedScalar(value,min,max);
 return t<=.5?white.map((start,index)=>Math.round(start+(blue[index]-start)*(1-t*2))):white.map((start,index)=>Math.round(start+(red[index]-start)*((t-.5)*2)));
}
function signScalar(value,min,max){
 if(!(valid(value)&&valid(min)&&valid(max)))return [255,255,255];
 const scale=Math.max(Math.abs(min),Math.abs(max),1),epsilon=scale*1e-12;
 if(Math.abs(value)<=epsilon)return [255,255,255];
 return value<0?[59,130,246]:[239,68,68];
}
/** Shared low/middle/high color ramp for real fields and 3D heights.
 * Normalize opposite extreme values before subtracting to avoid overflow. */
export function scalarColorRGB(value,min,max,mode='range'){
 const t=normalizedScalar(value,min,max);
 if(mode==='diverging')return divergingScalar(value,min,max);
 if(mode==='grayscale'){const shade=Math.round(255*t);return [shade,shade,shade];}
 if(mode==='heat')return interpolateStops([[30,9,97],[180,34,86],[239,68,68],[249,115,22],[250,204,21],[255,255,191]],t);
 if(mode==='viridis')return interpolateStops([[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]],t);
 if(mode==='sign')return signScalar(value,min,max);
 if(mode==='bands'){const steps=10;return interpolateStops([[239,68,68],[168,85,247],[59,130,246]],Math.round(t*(steps-1))/(steps-1));}
 return interpolateStops([[239,68,68],[168,85,247],[59,130,246]],t);
}
export function rangeColorRGB(value,min,max){return scalarColorRGB(value,min,max,'range');}
/** Sample a real scalar field in its fixed world-space rectangle. Undefined
 * and masked samples are transparent and never influence the color range.
 * Detail chooses the long side unless an explicit raster resolution is supplied. */
export function sampleImplicitColors(fn,region,{quality='balanced',resolution=null,mode='range',maxEvaluations=80000,includes=()=>true}={}){
 validatePlotRegion(region);
 if(typeof fn!=='function'||typeof includes!=='function'||!['fast','balanced','detailed'].includes(quality)||!Number.isInteger(maxEvaluations)||maxEvaluations<100||maxEvaluations>1000000||!IMPLICIT_COLOR_MODES.includes(mode))throw Error('Invalid implicit color settings.');
 if(resolution!==null&&(!Number.isInteger(resolution)||resolution<32||resolution>MAX_DOMAIN_RESOLUTION))throw Error('Invalid implicit color settings.');
 const dx=region.xMax-region.xMin,dy=region.yMax-region.yMin;
 let width,height,limited=false;
 if(Number.isInteger(resolution)){
  const ratio=dy/dx;height=Math.max(16,Math.min(MAX_DOMAIN_RESOLUTION,Number.isFinite(ratio)?Math.round(resolution*ratio):MAX_DOMAIN_RESOLUTION));
  width=resolution;
  if(width*height>maxEvaluations||width*height>MAX_DOMAIN_PIXELS)return {rgba:new Uint8ClampedArray(0),width,height,min:null,max:null,limited:true,evaluations:0};
 }else{
  const long=Math.max(dx,dy),detail={fast:128,balanced:256,detailed:512}[quality];
  width=Math.max(1,Math.round(detail*(dx/long)));height=Math.max(1,Math.round(detail*(dy/long)));
  limited=width*height>maxEvaluations;
  if(limited){const scale=Math.sqrt(maxEvaluations/(width*height));width=Math.max(1,Math.floor(width*scale));height=Math.max(1,Math.floor(height*scale));width=Math.min(width,maxEvaluations);height=Math.min(height,Math.floor(maxEvaluations/width));}
 }
 const values=new Float64Array(width*height).fill(NaN),rgba=new Uint8ClampedArray(width*height*4);
 let min=Infinity,max=-Infinity,evaluations=0;
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const x=region.xMin+((i+.5)/width)*dx,y=region.yMax-((j+.5)/height)*dy;
  if(!includes(x,y))continue;
  let value;try{evaluations++;value=fn(x,y);}catch{continue;}
  if(!valid(value))continue;
  values[j*width+i]=value;min=Math.min(min,value);max=Math.max(max,value);
 }
 for(let k=0;k<values.length;k++)if(valid(values[k])){const rgb=scalarColorRGB(values[k],min,max,mode);rgba.set(rgb,k*4);rgba[k*4+3]=255;}
 return {rgba,width,height,min:valid(min)?min:null,max:valid(max)?max:null,limited,evaluations};
}
export const DOMAIN_COLOR_MODES=Object.freeze(['phase-modulus','phase','contours','phase-contours','phase-checker','phase-sectors']);
export function domainColor(re,im,mode='phase-modulus'){
 if(!valid(re)||!valid(im))return null;
 let hue=((Math.atan2(im,re)*180/Math.PI)%360+360)%360;
 const radius=Math.hypot(re,im);
 // Scaled logarithm handles finite components whose modulus overflows,
 // and avoids loss of relative magnitude for subnormal components.
 const scaledLog=()=>{const scale=Math.max(Math.abs(re),Math.abs(im));return Math.log2(scale)+Math.log2(Math.hypot(re/scale,im/scale));};
 let light;
 if(mode==='phase-contours'||mode==='phase-checker'||mode==='phase-sectors'){
  if(radius===0)return [0,0,0,255];
  const angular=hue/30;
  if(mode==='phase-sectors'){hue=Math.floor(angular)*30+15;light=.52;}
  else{
   const logRadius=scaledLog(),radial=logRadius-Math.floor(logRadius);
   if(mode==='phase-contours')light=.52-.32*Math.max(0,1-Math.min(radial,1-radial)/.06);
   else light=(Math.floor(logRadius*2)+Math.floor(angular))%2===0?.64:.36;
  }
 }else{
  // Preserve the established three palettes for ordinary finite moduli.
  const band=Number.isFinite(radius)?Math.log2(Math.max(1e-12,radius)):scaledLog(),fract=((band%1)+1)%1;
  light=mode==='phase'?0.52:mode==='contours'?0.36+0.38*fract:0.42+0.28*Math.tanh(band/3);
 }
 const saturation=.82;
 const f=n=>{const k=(n+hue/30)%12,a=saturation*Math.min(light,1-light);return Math.round(255*(light-a*Math.max(-1,Math.min(k-3,9-k,1))));};
 return [f(0),f(8),f(4),255];
}
export const MAX_DOMAIN_RESOLUTION=1536;
export const MAX_DOMAIN_PIXELS=MAX_DOMAIN_RESOLUTION*MAX_DOMAIN_RESOLUTION;
export function sampleDomainColors(fn,region,{resolution=128,mode='phase-modulus',maxEvaluations=80000}={}){
 validatePlotRegion(region);
 if(!Number.isInteger(resolution)||resolution<32||resolution>MAX_DOMAIN_RESOLUTION||!DOMAIN_COLOR_MODES.includes(mode))throw Error('Invalid domain coloring settings.');
 const ratio=(region.yMax-region.yMin)/(region.xMax-region.xMin);
 const height=Math.max(16,Math.min(MAX_DOMAIN_RESOLUTION,Number.isFinite(ratio)?Math.round(resolution*ratio):MAX_DOMAIN_RESOLUTION));
 const width=resolution;if(width*height>maxEvaluations||width*height>MAX_DOMAIN_PIXELS)return {rgba:new Uint8ClampedArray(0),width,height,limited:true,evaluations:0};
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
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<100||maxEvaluations>1000000)throw Error('Invalid plotting budget.');
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
/** Bounded marching squares with edge-root verification.
 * A sign reversal alone does not imply F=0: poles (1/x) and jumps can
 * reverse sign without a zero. Refine each crossing and require the function
 * jump to contract, not explode as the bracket shrinks. Tangent/even-order
 * zeros without sign reversal still require a separate contour algorithm.
 * Purely numerical, not a certified topology solver.
 */
export function sampleImplicitPlot(fn,xAtPx,yAtPx,width,height,{quality='balanced',cellPx=12,maxEvaluations=80000}={}){
 if(typeof fn!=='function'||typeof xAtPx!=='function'||typeof yAtPx!=='function'||!valid(width)||!valid(height)||width<=0||height<=0||width>10000||height>10000)throw Error('Invalid implicit viewport.');
 if(!['fast','balanced','detailed'].includes(quality)||!Number.isInteger(cellPx)||cellPx<6||cellPx>24)throw Error('Invalid implicit plot detail.');
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<100||maxEvaluations>1000000)throw Error('Invalid plotting budget.');
 const factor={fast:1.5,balanced:1,detailed:.7}[quality],step=cellPx*factor;
 const nx=Math.max(1,Math.ceil(width/step)),ny=Math.max(1,Math.ceil(height/step));
 if((nx+1)*(ny+1)>maxEvaluations)return {segments:[],evaluations:0,breaks:0,limited:true};
 let evaluations=0,breaks=0,limited=false;const vals=new Float64Array((nx+1)*(ny+1));
 const idx=(x,y)=>y*(nx+1)+x;
 const at=(px,py)=>{
  if(evaluations>=maxEvaluations){limited=true;return NaN;}
  evaluations++;try{const v=fn(xAtPx(px),yAtPx(py));return valid(v)?v:NaN;}catch{return NaN;}
 };
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)vals[idx(i,j)]=at(width*i/nx,height*j/ny);
 const segments=[],edgeCache=new Map();
 const interpolate=(a,b,fa,fb)=>{
  const denom=fa-fb,t=!valid(denom)||denom===0?.5:Math.max(0,Math.min(1,fa/denom));
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 };
 function rootOnEdge(a,b,fa,fb,key){
  if(edgeCache.has(key))return edgeCache.get(key);
  let result=null;
  if(fa===0)result=a;
  else if(fb===0)result=b;
  else if((fa<0)!==(fb<0)){
   const initialJump=Math.abs(fa-fb),initialScale=Math.max(Math.abs(fa),Math.abs(fb));
   let lo=a,hi=b,fl=fa,fh=fb;
   for(let k=0;k<12;k++){
    const mid=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2],fm=at(mid[0],mid[1]);
    if(!valid(fm))break;
    if(fm===0){result=mid;break;}
    if((fl<0)===(fm<0)){lo=mid;fl=fm;}else{hi=mid;fh=fm;}
   }
   // A genuine continuous crossing contracts its signed bracket as we
   // bisect. At a pole the amplitude instead grows, so no contour exists.
   const shrink=valid(initialJump)?Math.abs(fl-fh)<initialJump*.75:
     Math.max(Math.abs(fl),Math.abs(fh))<initialScale*.75;
   if(!limited&&!result&&shrink)result=interpolate(lo,hi,fl,fh);
  }
  edgeCache.set(key,result);return result;
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const x0=width*i/nx,x1=width*(i+1)/nx,y0=height*j/ny,y1=height*(j+1)/ny;
  const p=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  const z=[vals[idx(i,j)],vals[idx(i+1,j)],vals[idx(i+1,j+1)],vals[idx(i,j+1)]];
  if(z.some(v=>!valid(v))){breaks++;continue;}
  const crossings=[];let unresolved=false;
  for(let e=0;e<4;e++){
   const k=(e+1)%4;if((z[e]<0)===(z[k]<0))continue;
   const key=e===0?`h:${j}:${i}`:e===1?`v:${j}:${i+1}`:e===2?`h:${j+1}:${i}`:`v:${j}:${i}`;
   const point=rootOnEdge(p[e],p[k],z[e],z[k],key);
   if(!point){unresolved=true;break;}
   crossings.push(point);
  }
  if(unresolved){breaks++;continue;}
  if(crossings.length===2)segments.push(crossings);
  else if(crossings.length===4){
   const center=at((x0+x1)/2,(y0+y1)/2);
   if(!valid(center)){breaks++;continue;}
   const same=(center<0)===(z[0]<0);
   segments.push([crossings[0],crossings[same?1:3]],[crossings[same?2:1],crossings[same?3:2]]);
  }
 }
 return limited?{segments:[],evaluations,limited:true,breaks}:{segments,evaluations,limited:false,breaks};
}
