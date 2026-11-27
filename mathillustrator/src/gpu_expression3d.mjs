/** A fail-closed GLSL ES 3.00 expression compiler for future GPU 3D sampling.
 * This is NOT used to evaluate production meshes until WebGL2 sampling has
 * passed GPU/CPU equivalence tests on real rendering hardware.
 * Only arithmetic polynomials with small nonnegative integer powers are
 * admitted. No division, functions, implicit names, or GLSL injection.
 */
import {parseCurveExpression} from './plot_modes.mjs?cut=round303';
const N=400;
const VARS=new Set(['x','y','z']);
const literal=v=>{
 if(!Number.isFinite(v)||Math.abs(v)>=1e9)throw Error('GPU literal out of range');
 const f=Math.fround(v);
 if(!Number.isFinite(f)||(!f&&v))throw Error('GPU literal underflow');
 let s=f.toString();if(!s.includes('.')&&!/[eE]/.test(s))s+='.';
 return s;
};
/** Returns {glsl, variables, cpu} or null on unsupported syntax/semantics.
 * GPU numerical results are only float32 approximations, never substitutes
 * for the JS double precision evaluator without separate runtime validation.
 */
export function compileRestrictedGPUExpression(source){
 try{
  if(typeof source!=='string'||!source.trim()||source.length>N)return null;
  // First consult the application's canonical parser for validity.
  const cpu=parseCurveExpression(source,['x','y','z']);
  const tokens=[];let i=0;
  while(i<source.length){
   if(/\s/.test(source[i])){i++;continue;}
   const match=source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
   if(match){const value=Number(match[0]);if(!Number.isFinite(value)||Math.abs(value)>=1e9)return null;tokens.push({type:'number',value});i+=match[0].length;continue;}
   if(source[i]==='φ'||source[i]==='ϕ'){tokens.push({type:'word',value:'phi'});i++;continue;}
   const word=['phi','pi','x','y','z','e'].find(w=>source.slice(i,i+w.length).toLowerCase()===w);
   if(word){tokens.push({type:'word',value:word});i+=word.length;continue;}
   if('()+-*^'.includes(source[i])){tokens.push({type:source[i]});i++;continue;}
   return null;
  }
  let p=0;const next=()=>tokens[p],take=()=>tokens[p++];const variables=new Set();
  function atom(){const t=take();if(!t)throw Error('incomplete');
   if(t.type==='+'||t.type==='-'){
    const a=expr(3);return {s:t.type==='-'?`(-${a.s})`:a.s,degree:a.degree,constant:t.type==='-'&&a.constant!==null?-a.constant:a.constant};
   }
   if(t.type==='('){const a=expr(0);if(take()?.type!==')')throw Error('parenthesis');return a;}
   if(t.type==='number')return {s:literal(t.value),degree:0,constant:t.value};
   if(t.type==='word'){
    if(VARS.has(t.value)){variables.add(t.value);return {s:t.value,degree:1,constant:null};}
    const v=t.value==='pi'?Math.PI:t.value==='e'?Math.E:(1+Math.sqrt(5))/2;return {s:literal(v),degree:0,constant:v};
   }
   throw Error('operator');
  }
  const prec={'+':1,'-':1,'*':2,'^':4};
  function expr(min){let left=atom();while(true){
   const t=next();if(!t||t.type===')')break;
   const implied=['number','word','('].includes(t.type),op=implied?'*':t.type,pr=prec[op];
   if(pr===undefined||pr<min)break;
   if(!implied)take();const right=expr(op==='^'?pr:pr+1);
   if(op==='^'){
    if(right.constant===null||!Number.isInteger(right.constant)||right.constant<0||right.constant>4)throw Error('unsupported power');
    const k=right.constant,degree=left.degree*k;
    if(degree>8)throw Error('polynomial degree');
    // Integer powers need explicit products: GLSL pow has different edge behavior.
    const s=k===0?'1.':k===1?left.s:`(${Array(k).fill(left.s).join('*')})`;
    left={s,degree,constant:left.constant===null?null:left.constant**k};
   }else{
    const degree=op==='*'?left.degree+right.degree:Math.max(left.degree,right.degree);
    if(degree>8)throw Error('polynomial degree');
    const a=left.constant,b=right.constant;
    left={s:`(${left.s}${op}${right.s})`,degree,constant:a===null||b===null?null:op==='+'?a+b:op==='-'?a-b:a*b};
   }
  }return left;}
  const compiled=expr(0);if(p!==tokens.length||compiled.s.length>4096)return null;
  return {glsl:compiled.s,variables:[...variables].sort(),cpu};
 }catch{return null;}
}
/** For implicit expressions, compile both sides independently and subtract.
 * A malformed equality or an unsupported term always fails closed.
 */
export function compileRestrictedGPUImplicit(source){
 if(typeof source!=='string'||source.split('=').length>2)return null;
 const parts=source.split('='),a=compileRestrictedGPUExpression(parts[0]);
 const b=parts.length===2?compileRestrictedGPUExpression(parts[1]):compileRestrictedGPUExpression('0');
 if(!a||!b)return null;
 return {glsl:`(${a.glsl}-${b.glsl})`,variables:[...new Set([...a.variables,...b.variables])].sort(),cpu:(x,y,z)=>a.cpu({x,y,z})-b.cpu({x,y,z})};
}
