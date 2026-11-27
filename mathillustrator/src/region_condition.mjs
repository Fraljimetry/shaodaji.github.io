/** Strict spatial inequality: safe arithmetic only, with bounded input.
 * Empty means no additional restriction. Boundary points are excluded. */
import {parseCurveExpression} from './plot_modes.mjs?cut=round302';
export function compileRegionCondition(source,dimension=3){
 if(source===undefined||source===null||source==='')return null;
 if(typeof source!=='string'||source.length>240)throw Error('Region inequality must be at most 240 characters.');
 const text=source.trim();
 if(!text)throw Error('Region inequality cannot be whitespace. Clear the input to remove it.');
 const match=/^([^<>!=]+)([<>])([^<>!=]+)$/.exec(text);
 if(!match)throw Error('Use one strict inequality, such as x^2+y^2<4 (no ≤, ≥, or chained comparisons).');
 const variables=dimension===2?['x','y']:dimension===3?['x','y','z']:null;
 if(!variables)throw Error('Unsupported region dimension.');
 const left=parseCurveExpression(match[1].trim(),variables),right=parseCurveExpression(match[3].trim(),variables);
 const sign=match[2]==='>'?1:-1;
 return (x,y,z=0)=>{
  let a,b;try{const vars=dimension===2?{x,y}:{x,y,z};a=left(vars);b=right(vars);}catch{return NaN;}
  const result=sign*(a-b);return Number.isFinite(result)?result:NaN;
 };
}
export function inRegion(condition,x,y,z=0){
 if(!condition)return true;
 return condition(x,y,z)>0;
}
/** Clip a triangle with linear edge interpolation of the inequality value.
 * This is a piecewise-linear approximation to a possibly curved boundary. */
export function clipConditionTriangle(triangle,condition){
 if(!condition)return [triangle];
 let polygon=triangle.map(point=>({point,value:condition(...point)}));
 const next=[];for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=a.value>0,insideB=b.value>0;
  if(insideA!==insideB&&Number.isFinite(a.value)&&Number.isFinite(b.value)){
   const difference=a.value-b.value;
   // Opposite finite values can have an infinite difference. Normalize only
   // in that case, preserving ordinary interpolation and mesh ordering.
   const scale=Number.isFinite(difference)?1:Math.max(Math.abs(a.value),Math.abs(b.value));
   const t=Math.max(0,Math.min(1,scale===1?a.value/difference:(a.value/scale)/(a.value/scale-b.value/scale)));
   next.push({point:a.point.map((value,j)=>value+(b.point[j]-value)*t),value:0});
  }
  if(insideB)next.push(b);
 }
 if(next.length<3)return [];
 const faces=[];for(let i=1;i+1<next.length;i++)faces.push([next[0].point,next[i].point,next[i+1].point]);
 return faces;
}
