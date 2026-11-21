/** Safe, deterministic real arithmetic for named slider parameters and point coordinates.
 * No eval, dynamic JS, implicit writes, or external dependencies. */
const FUNCTIONS={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,
 sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,ln:Math.log,log:Math.log,log10:Math.log10,
 floor:Math.floor,ceil:Math.ceil,round:Math.round,min:Math.min,max:Math.max,
 pow:Math.pow,atan2:Math.atan2,hypot:Math.hypot,
 sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,asinh:Math.asinh,acosh:Math.acosh,atanh:Math.atanh,
 cbrt:Math.cbrt,log2:Math.log2,trunc:Math.trunc,sign:Math.sign,
 clamp:(value,min,max)=>{if(min>max)throw Error('Clamp lower bound exceeds upper bound.');return Math.min(max,Math.max(min,value));},
 mod:(a,b)=>{if(b===0)throw Error('Modulo divisor cannot be zero.');return ((a%b)+Math.abs(b))%Math.abs(b);},
 rad:degrees=>degrees*Math.PI/180,deg:radians=>radians*180/Math.PI};
const CONSTANTS={pi:Math.PI,e:Math.E,phi:(1+Math.sqrt(5))/2};
const NAME=/^[A-Za-z][A-Za-z0-9_]*$/;
export const SLIDER_PLAY_MODES=Object.freeze(['periodic','oscillatory','once']);
export function sliderPlaybackValue(slider,elapsedSeconds,startValue=slider.value){
 const {min,max,step}=slider,mode=slider.playMode??'periodic',speed=slider.playSpeed??1;
 if(!SLIDER_PLAY_MODES.includes(mode)||!Number.isFinite(speed)||speed<=0||!Number.isFinite(elapsedSeconds)||elapsedSeconds<0)throw Error('Invalid slider animation.');
 if(elapsedSeconds===0)return {value:startValue,finished:mode==='once'&&startValue>=max};
 const span=max-min,travel=(startValue-min)/span+elapsedSeconds*speed;
 const phase=mode==='oscillatory'?1-Math.abs(1-((travel%2)+2)%2):mode==='once'?Math.min(1,travel):((travel%1)+1)%1;
 const target=min+phase*span;
 const index=Math.round((target-min)/step);
 const value=Math.min(max,Math.max(min,Number((min+index*step).toPrecision(12))));
 return {value,finished:mode==='once'&&travel>=1};
}
export function validSliderName(name){return NAME.test(name)&&!Object.hasOwn(FUNCTIONS,name.toLowerCase())&&!Object.hasOwn(CONSTANTS,name.toLowerCase())&&name.length<=40;}
/** Split function arguments only at top-level commas, not inside nested calls.
 * Reject unmatched parentheses here rather than accidentally creating a partial object. */
export function splitAlgebraArguments(source){
 if(typeof source!=='string'||source.length>1200)throw Error('Invalid argument list.');
 const result=[];let depth=0,start=0;
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(c==='('){depth++;if(depth>32)throw Error('Expression nesting is too deep.');}
  else if(c===')'){if(--depth<0)throw Error('Unmatched closing parenthesis.');}
  else if(c===','&&depth===0){result.push(source.slice(start,i).trim());start=i+1;}
 }
 if(depth!==0)throw Error('Unclosed expression parenthesis.');
 result.push(source.slice(start).trim());return result;
}
export function evaluateAlgebra(source,values={}){
 if(typeof source!=='string'||!source.trim()||source.length>400)throw Error('Expression must contain 1–400 characters.');
 const tokens=[];let s=source.replaceAll('π','pi').replaceAll('φ','phi').replaceAll('ϕ','phi'),i=0;
 while(i<s.length){if(/\s/.test(s[i])){i++;continue;}
  const chunk=s.slice(i),m=chunk.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?/);
  if(m){const n=Number(m[0]);if(!Number.isFinite(n)||Math.abs(n)>=1e9)throw Error('Numeric literal out of range.');tokens.push({type:'number',value:n});i+=m[0].length;continue;}
  const w=chunk.match(/^[A-Za-z][A-Za-z0-9_]*/);
  if(w){tokens.push({type:'name',value:w[0]});i+=w[0].length;continue;}
  if('+-*/^(),'.includes(s[i])){tokens.push({type:s[i]});i++;continue;}
  throw Error('Unsupported expression character.');
 }
 let cursor=0;const peek=()=>tokens[cursor]?.type;
 function atom(){const t=tokens[cursor++];if(!t)throw Error('Incomplete expression.');
  if(t.type==='+'||t.type==='-'){const n=expression(3);return t.type==='-'?-n:n;}
  if(t.type==='('){const n=expression(0);if(tokens[cursor++]?.type!==')')throw Error('Missing closing parenthesis.');return n;}
  if(t.type==='number')return t.value;
  if(t.type==='name'){
   const name=t.value,lower=name.toLowerCase();
   if(peek()==='('){if(!Object.hasOwn(FUNCTIONS,lower))throw Error('Unknown function: '+name);cursor++;const args=[];
    if(peek()!==')'){args.push(expression(0));while(peek()===','){cursor++;if(args.length>=16)throw Error('Too many arguments.');args.push(expression(0));}}
    if(tokens[cursor++]?.type!==')')throw Error('Missing function parenthesis.');
    if((['min','max','hypot'].includes(lower)&&args.length<2)||(['atan2','pow','mod'].includes(lower)&&args.length!==2)||(lower==='clamp'&&args.length!==3)||(!['min','max','hypot','atan2','pow','mod','clamp'].includes(lower)&&args.length!==1))throw Error('Incorrect function argument count.');
    return FUNCTIONS[lower](...args);
   }
   if(Object.hasOwn(values,name))return values[name];
   if(Object.hasOwn(CONSTANTS,lower))return CONSTANTS[lower];
   throw Error('Undefined parameter: '+name);
  }
  throw Error('Expected number or parameter.');
 }
 const precedence={'+':1,'-':1,'*':2,'/':2,'^':4};
 function expression(min){let x=atom();while(precedence[peek()]>=min){const op=tokens[cursor++].type,p=precedence[op],y=expression(p+(op==='^'?0:1));
  x=op==='+'?x+y:op==='-'?x-y:op==='*'?x*y:op==='/'?x/y:x**y;
  if(!Number.isFinite(x)||Math.abs(x)>1e9)throw Error('Expression result out of range.');
 }return x;}
 const v=expression(0);if(cursor!==tokens.length)throw Error('Unexpected expression token.');if(!Number.isFinite(v)||Math.abs(v)>1e9)throw Error('Expression result out of range.');return v;
}
// Parameterized measurement properties are stored beside their numeric cache.
// The renderer sees only ordinary numeric fields; the document retains formulas.
export const MEASUREMENT_FIELDS=Object.freeze({
 fixedLength:Object.freeze({length:[1e-8,1e6]}),
 fixedAngle:Object.freeze({angle:[-2*Math.PI,2*Math.PI]}),
 transformCopy:Object.freeze({amount:[-1e6,1e6]})
});
export function bindMeasurement(doc,object,field,expression){
 const bounds=MEASUREMENT_FIELDS[object.type]?.[field];
 if(!bounds||typeof expression!=='string')throw Error('Unsupported programmable measurement.');
 const values=Object.fromEntries((doc.algebra?.sliders??[]).map(s=>[s.name,s.value]));
 const value=evaluateAlgebra(expression,values);
 if(value<bounds[0]||value>bounds[1]||(object.type==='transformCopy'&&object.transform==='dilate'&&Math.abs(value)<1e-9))throw Error('Measurement is outside its permitted range.');
 object.measureExpr={...(object.measureExpr||{}),[field]:expression};object[field]=value;
 return object;
}
export function validateAlgebra(doc){
 const sliders=doc.algebra?.sliders??[];
 if(!Array.isArray(sliders)||sliders.length>64)throw Error('Too many sliders.');
 const seen=new Set();const values={};
 for(const s of sliders){if(!s||!validSliderName(s.name)||seen.has(s.name)||!Number.isFinite(s.min)||!Number.isFinite(s.max)||!Number.isFinite(s.step)||!Number.isFinite(s.value)||s.min>=s.max||s.step<=0||s.step>1e6||s.min< -1e6||s.max>1e6||s.value<s.min-1e-8||s.value>s.max+1e-8||typeof s.visible!=='boolean'||(s.locked!==undefined&&typeof s.locked!=='boolean')||(s.color!==undefined&&(!/^#[0-9a-fA-F]{6}$/.test(s.color)))||(s.opacity!==undefined&&(!Number.isFinite(s.opacity)||s.opacity<0||s.opacity>1))||(s.border!==undefined&&typeof s.border!=='boolean')||(s.playSpeed!==undefined&&(!Number.isFinite(s.playSpeed)||s.playSpeed<0.05||s.playSpeed>10))||(s.playMode!==undefined&&!SLIDER_PLAY_MODES.includes(s.playMode))||!Array.isArray(s.xy)||s.xy.length!==2||s.xy.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))throw Error('Invalid slider definition.');
  if(doc.objects?.some(o=>o.name===s.name))throw Error('Slider and object names must be distinct.');
  seen.add(s.name);values[s.name]=s.value;
 }
 for(const o of doc.objects??[]){
  if(o.measureExpr!==undefined){
   const fields=MEASUREMENT_FIELDS[o.type];
   if(!fields||!o.measureExpr||typeof o.measureExpr!=='object'||Array.isArray(o.measureExpr)||Object.keys(o.measureExpr).length===0)throw Error('Invalid programmable measurement.');
   for(const [field,expression] of Object.entries(o.measureExpr)){
    if(!Object.hasOwn(fields,field)||typeof expression!=='string')throw Error('Invalid measurement formula.');
    const value=evaluateAlgebra(expression,values),[min,max]=fields[field];
    if(value<min||value>max||Math.abs(value-o[field])>1e-7*Math.max(1,Math.abs(value)))throw Error('Invalid or stale measurement value.');
    if(o.type==='transformCopy'&&o.transform==='dilate'&&Math.abs(value)<1e-9)throw Error('Dilation factor cannot be zero.');
   }
  }
  if(o.xyExpr!==undefined){if(o.type!=='point'||!Array.isArray(o.xyExpr)||o.xyExpr.length!==2||o.xyExpr.some(x=>typeof x!=='string'))throw Error('Invalid expression point.');
  const xy=o.xyExpr.map(x=>evaluateAlgebra(x,values));if(xy.some(x=>Math.abs(x)>1e6))throw Error('Expression point outside coordinate range.');
  if(!Array.isArray(o.xy)||o.xy.some((n,i)=>Math.abs(n-xy[i])>1e-7))throw Error('Stale expression point coordinates.');
 }}return values;
}
export function recalculateAlgebra(doc){const values=Object.fromEntries((doc.algebra?.sliders??[]).map(s=>[s.name,s.value]));
 for(const o of doc.objects??[]){
  if(o.xyExpr)o.xy=o.xyExpr.map(x=>evaluateAlgebra(x,values));
  if(o.measureExpr)for(const [field,expression] of Object.entries(o.measureExpr))o[field]=evaluateAlgebra(expression,values);
 }
 return values;
}
export function createSlider(doc,name,{min=0,max=10,step=.1,value=5,xy=[0,0],visible=true,playSpeed=1,playMode='periodic'}={}){
 if(!validSliderName(name)||doc.objects.some(o=>o.name===name)||(doc.algebra?.sliders??[]).some(s=>s.name===name))throw Error('Slider name is invalid or already in use.');
 const s={name,min,max,step,value,xy,visible,playSpeed,playMode};doc.algebra??={sliders:[]};doc.algebra.sliders.push(s);validateAlgebra(doc);return s;
}
export function algebraPoint(doc,name,xExpr,yExpr,appendPoint){
 if(doc.objects.some(o=>o.name===name)||(doc.algebra?.sliders??[]).some(s=>s.name===name))throw Error('Name already in use.');
 const values=Object.fromEntries((doc.algebra?.sliders??[]).map(s=>[s.name,s.value]));
 const xy=[xExpr,yExpr].map(x=>evaluateAlgebra(x,values));
 if(xy.some(x=>Math.abs(x)>1e6))throw Error('Coordinates must be within ±1,000,000.');
 const point=appendPoint(doc,xy,name);point.xyExpr=[xExpr,yExpr];return point;
}
