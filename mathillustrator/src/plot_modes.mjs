/** Numeric 2D curve modes. Local, bounded, strict arithmetic expressions only.
 * Parametric x(u),y(v) share ONE parameter: at sample s, u=v=s.
 * A pair of independent parameters would describe a region, not a 2D curve.
 */
const MATH={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,log:Math.log,ln:Math.log,exp:Math.exp,floor:Math.floor,ceil:Math.ceil};
const valid=v=>typeof v==='number'&&Number.isFinite(v);
export function parseCurveExpression(source,variables=['x']){
 if(typeof source!=='string'||source.trim().length===0||source.length>400)throw Error('Expression must contain 1–400 characters.');
 if(!Array.isArray(variables)||!variables.length||variables.some(v=>!['x','y','u','v'].includes(v)))throw Error('Invalid expression variables.');
 const tokens=source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('')!==source.replace(/\s/g,''))throw Error('Unsupported character in expression.');
 let i=0;const take=()=>tokens[i++],peek=()=>tokens[i];
 function atom(){
  const t=take();if(!t)throw Error('Incomplete expression.');
  if(t==='+'||t==='-'){const n=expr(3);return vars=>(t==='-'?-1:1)*n(vars);}
  if(t==='('){const n=expr(0);if(take()!==')')throw Error('Missing closing parenthesis.');return n;}
  if(/^(?:\d|\.)/.test(t)){const n=Number(t);if(!valid(n)||Math.abs(n)>=1e9)throw Error('Numeric literal out of range.');return ()=>n;}
  if(variables.includes(t))return vars=>vars[t];
  if(t==='pi')return ()=>Math.PI;
  if(t==='e')return ()=>Math.E;
  if(Object.hasOwn(MATH,t)){if(take()!=='(')throw Error(`Function ${t} requires parentheses.`);const n=expr(0);if(take()!==')')throw Error('Missing closing parenthesis.');return vars=>MATH[t](n(vars));}
  throw Error('Unknown symbol: '+t);
 }
 const priority={'+':1,'-':1,'*':2,'/':2,'^':4};
 function expr(min){let left=atom();while(priority[peek()]>=min){const op=take(),p=priority[op],right=expr(op==='^'?p:p+1),prev=left;left=vars=>{const a=prev(vars),b=right(vars);return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a**b;};}return left;}
 const tree=expr(0);if(i!==tokens.length)throw Error('Unexpected token: '+peek());return tree;
}
export function parseParametric(xExpr,yExpr){
 const fx=parseCurveExpression(xExpr,['u','v']),fy=parseCurveExpression(yExpr,['u','v']);
 return s=>{const vars={u:s,v:s};return [fx(vars),fy(vars)];};
}
export function parseImplicit(source){
 if(typeof source!=='string'||source.length>801)throw Error('Implicit equation is too long.');
 const pieces=source.split('=');if(pieces.length>2)throw Error('Use at most one equals sign.');
 const left=parseCurveExpression(pieces[0],['x','y']);
 const right=pieces.length===2?parseCurveExpression(pieces[1],['x','y']):()=>0;
 return (x,y)=>left({x,y})-right({x,y});
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
