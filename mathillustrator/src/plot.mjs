/** Bounded adaptive sampling of explicit real functions. No ODE, implicit curve, or pole certification.
 * Input/output are screen coordinates. A large jump, nonfinite sample or unresolved high
 * curvature creates a deliberate gap rather than a misleading line through a singularity.
 */
export function sampleExplicitPlot(fn, xAtPixel, yAtWorld, width, height, options={}){
 if(typeof fn!=='function'||typeof xAtPixel!=='function'||typeof yAtWorld!=='function'||!Number.isFinite(width)||width<=0||width>100000||!Number.isFinite(height)||height<=0)throw Error('Invalid plot viewport.');
 const quality=options.quality??'balanced';
 const modes={fast:{minStep:4,maxSamples:600,depth:4},balanced:{minStep:2,maxSamples:1200,depth:6},detailed:{minStep:1,maxSamples:2200,depth:8}};
 if(!Object.hasOwn(modes,quality))throw Error('Unsupported plot quality.');
 const chosen=modes[quality],step=Math.max(chosen.minStep,Math.ceil(width/chosen.maxSamples)),depth=options.depth??chosen.depth;
 const maxEvaluations=options.maxEvaluations??80000;
 if(!Number.isInteger(maxEvaluations)||maxEvaluations<10||maxEvaluations>100000)throw Error('Invalid plot evaluation budget.');
 if(!Number.isInteger(depth)||depth<0||depth>9)throw Error('Invalid subdivision limit.');
 const segments=[];let current=[],evaluations=0,breaks=0,limited=false;
 const flush=()=>{if(current.length>1)segments.push(current);current=[];};
 const gap=()=>{flush();breaks++;};
 const limit=Math.min(height*8,1e6);
 const get=px=>{if(evaluations>=maxEvaluations){limited=true;return null;}evaluations++;try{const y=fn(xAtPixel(px)),sy=yAtWorld(y);return Number.isFinite(y)&&Number.isFinite(sy)&&Math.abs(sy)<limit?[px,sy]:null;}catch{return null;}};
 const add=p=>{if(!p)return;if(!current.length||current.at(-1)[0]!==p[0])current.push(p);};
 const trace=(left,right,middle,level)=>{
  const [pa,a]=left,[pb,b]=right,[pm,m]=middle;
  if(!a||!b||!m){
   if(!a&&!b&&!m){gap();return;}
   if(level<depth&&pb-pa>0.35){const l=[(pa+pm)/2,get((pa+pm)/2)],r=[(pm+pb)/2,get((pm+pb)/2)];trace(left,middle,l,level+1);gap();trace(middle,right,r,level+1);}else gap();
   return;
  }
  const jump=Math.abs(a[1]-b[1]),error=Math.abs(m[1]-(a[1]+b[1])/2);
  const suspect=jump>height*0.65||error>Math.max(5,height*0.018);
  if(suspect&&level<depth&&pb-pa>0.35){const l=[(pa+pm)/2,get((pa+pm)/2)],r=[(pm+pb)/2,get((pm+pb)/2)];trace(left,middle,l,level+1);trace(middle,right,r,level+1);return;}
  if(suspect){gap();return;}
  add(a);add(b);
 };
 let prev=[0,get(0)];
 for(let px=step;px<=width+step;px+=step){const x=Math.min(width,px),next=[x,get(x)],mid=[(prev[0]+x)/2,get((prev[0]+x)/2)];trace(prev,next,mid,0);prev=next;if(x===width)break;}
 flush();return {segments,evaluations,breaks,limited};
}
export function plotPath(segments){return segments.map(points=>'M'+points.map((p,i)=>`${i?'L':''}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')).join(' ');}
