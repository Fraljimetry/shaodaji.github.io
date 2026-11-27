/** Round 119: bounded, opt-in WebGL2 numerical readback diagnostic.
 * No production 3D mesh path calls this module. No CPU fallback is disguised
 * as GPU execution. The caller must check status before using values.
 */
import {compileRestrictedGPUImplicit} from './gpu_expression3d.mjs?cut=round327';

export const MAX_GPU_PROBE_POINTS = 256;
export const MAX_GPU_PROBE_BATCH_POINTS = 4096;
const validPoints = points => Array.isArray(points)&&points.length>0&&
 points.every(p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e5));

export function buildGPUProbeShaders(glsl){
 if(typeof glsl!=='string'||glsl.length>4096||!/^[\w.()+*\-]+$/.test(glsl))throw Error('Unsafe GLSL expression');
 const vertex = `#version 300 es
 precision highp float;
 layout(location=0) in vec4 a_sample;
 out highp vec3 v_xyz;
 uniform float u_width;
 void main(){
  v_xyz=a_sample.xyz;
  gl_Position=vec4((2.0*(a_sample.w+0.5)/u_width)-1.0,0.0,0.0,1.0);
  gl_PointSize=1.0;
 }`;
 const fragment = `#version 300 es
 precision highp float;
 precision highp int;
 in highp vec3 v_xyz;
 out vec4 result;
 void main(){
  float x=v_xyz.x, y=v_xyz.y, z=v_xyz.z;
  float value=${glsl};
  uint bits=floatBitsToUint(value);
  result=vec4(float(bits & 255u),float((bits>>8u)&255u),
              float((bits>>16u)&255u),float((bits>>24u)&255u))/255.0;
 }`;
 return {vertex,fragment};
}

export function evaluateRestrictedGPUProbe(canvas, source, points){
 if(!canvas||typeof canvas.getContext!=='function')return {status:'UNAVAILABLE',reason:'No canvas'};
 if(!validPoints(points)||points.length>MAX_GPU_PROBE_POINTS)
   return {status:'REJECTED',reason:'Invalid or excessive samples'};
 const compiled=compileRestrictedGPUImplicit(source);
 if(!compiled)return {status:'REJECTED',reason:'Expression outside restricted compiler'};
 let gl;
 try{canvas.width=points.length;canvas.height=1;gl=canvas.getContext('webgl2',{
  preserveDrawingBuffer:true,antialias:false,alpha:true,depth:false,stencil:false});}
 catch{return {status:'UNAVAILABLE',reason:'WebGL2 context creation threw'};}
 if(!gl)return {status:'UNAVAILABLE',reason:'No WebGL2 context'};
 let program,vs,fs,buffer,vao;
 try{
  if(gl.isContextLost())throw Error('WebGL2 context lost');
  // The fragment shader encodes IEEE-754 float32 bits; low precision may
  // invalidate the numeric comparison even when rasterization succeeds.
  const precision=gl.getShaderPrecisionFormat?.(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
  const vertexPrecision=gl.getShaderPrecisionFormat?.(gl.VERTEX_SHADER,gl.HIGH_FLOAT);
  if(!vertexPrecision||vertexPrecision.precision<23||vertexPrecision.rangeMax<127||
     !precision||precision.precision<23||precision.rangeMax<127)
   throw Error('WebGL2 fragment highp float32 precision unsupported');
  const shaders=buildGPUProbeShaders(compiled.glsl);
  function shader(type,source){const s=gl.createShader(type);if(!s)throw Error('Shader allocation failed');
   if(type===gl.VERTEX_SHADER)vs=s;else fs=s;
   gl.shaderSource(s,source);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compile: '+String(gl.getShaderInfoLog(s)).slice(0,256));
   return s;}
  shader(gl.VERTEX_SHADER,shaders.vertex);shader(gl.FRAGMENT_SHADER,shaders.fragment);
  program=gl.createProgram();if(!program)throw Error('Program allocation failed');
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Program link: '+String(gl.getProgramInfoLog(program)).slice(0,256));
  const data=new Float32Array(points.length*4);
  points.forEach((p,i)=>{data.set(p.map(Math.fround),4*i);data[4*i+3]=i;});
  vao=gl.createVertexArray();buffer=gl.createBuffer();if(!vao||!buffer)throw Error('Buffer allocation failed');
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,16,0);
  gl.useProgram(program);gl.uniform1f(gl.getUniformLocation(program,'u_width'),points.length);
  gl.viewport(0,0,points.length,1);
  gl.disable(gl.BLEND);gl.disable(gl.DITHER);gl.disable(gl.DEPTH_TEST);gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true,true,true,true);
  // RGBA canvas preserves sentinel alpha, including on implementations that
  // otherwise force alpha=255 for opaque drawing buffers.
  // Nonzero sentinel makes an untouched framebuffer detectable.
  gl.clearColor(1,0,1,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS,0,points.length);
  const bytes=new Uint8Array(points.length*4);
  gl.readPixels(0,0,points.length,1,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
  if(gl.isContextLost()||gl.getError()!==gl.NO_ERROR)throw Error('GPU draw/readback failed');
  const view=new DataView(bytes.buffer);const values=[];
  for(let i=0;i<points.length;i++){
   const at=4*i;
   if(bytes[at]===255&&bytes[at+1]===0&&bytes[at+2]===255&&bytes[at+3]===0)
    throw Error('GPU point was not rasterized');
   values.push(view.getFloat32(at,true));
  }
  return {status:'PASS',values,backend:'WebGL2 shader pixel readback'};
 }catch(e){return {status:'FAIL',reason:String(e?.message||e).slice(0,300)};}
 finally{
  try{if(vao)gl.deleteVertexArray(vao);if(buffer)gl.deleteBuffer(buffer);
   if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);
   gl.bindVertexArray(null);}catch{/* device may be lost */}
 }
}

export function compareGPUProbeWithCPU(source, points, result, {absoluteTolerance=0.0002,relativeTolerance=0.0002}={}){
 if(result?.status!=='PASS')return {status:result?.status||'FAIL',reason:result?.reason||'No GPU data'};
 if(!Number.isFinite(absoluteTolerance)||absoluteTolerance<0||
    !Number.isFinite(relativeTolerance)||relativeTolerance<0)
   return {status:'FAIL',reason:'Invalid numerical tolerance'};
 if(!validPoints(points)||points.length>MAX_GPU_PROBE_POINTS||
    !Array.isArray(result.values)||result.values.length!==points.length)
   return {status:'FAIL',reason:'Invalid comparison inputs'};
 const compiled=compileRestrictedGPUImplicit(source);
 if(!compiled)return {status:'FAIL',reason:'Invalid comparison inputs'};
 let worstError=0;
 for(let i=0;i<points.length;i++){
  const actual=result.values[i],expected=compiled.cpu(...points[i]);
  const error=Math.abs(actual-expected);
  // Implicit surfaces depend on sign, not just absolute error. Opposite
  // nonzero signs can change the zero-crossing topology despite tiny error.
  const topologyMismatch=(actual===0)!==(expected===0)||
    (actual!==0&&expected!==0&&Math.sign(actual)!==Math.sign(expected));
  if(!Number.isFinite(actual)||!Number.isFinite(expected)||topologyMismatch||
     error>absoluteTolerance+relativeTolerance*Math.abs(expected))
   return {status:'FAIL',index:i,actual,expected,error};
  worstError=Math.max(worstError,error);
 }
 return {status:'PASS',samples:points.length,worstError,absoluteTolerance,relativeTolerance};
}

/** Bounded multi-draw diagnostic, not a production sampler. Each slice is a
 * separate real GPU readback; never substitute CPU values for unavailable GPU.
 * Return only PASS once every slice succeeded, avoiding partial-success data.
 */
export function evaluateRestrictedGPUBatch(canvas, source, points){
 if(!validPoints(points)||points.length>MAX_GPU_PROBE_BATCH_POINTS)
  return {status:'REJECTED',reason:'Invalid or excessive batch'};
 if(!compileRestrictedGPUImplicit(source))
  return {status:'REJECTED',reason:'Expression outside restricted compiler'};
 const values=[];
 for(let i=0;i<points.length;i+=MAX_GPU_PROBE_POINTS){
  const result=evaluateRestrictedGPUProbe(canvas,source,points.slice(i,i+MAX_GPU_PROBE_POINTS));
  if(result.status!=='PASS')return {status:result.status,reason:result.reason,failedOffset:i};
  if(!Array.isArray(result.values)||result.values.length!==Math.min(MAX_GPU_PROBE_POINTS,points.length-i))
   return {status:'FAIL',reason:'Malformed GPU chunk result',failedOffset:i};
  values.push(...result.values);
 }
 return {status:'PASS',values,backend:'WebGL2 chunked shader pixel readback',chunks:Math.ceil(points.length/MAX_GPU_PROBE_POINTS)};
}

/** Compare long batches without weakening strict per-point topology checks. */
export function compareGPUBatchWithCPU(source,points,result,options){
 if(result?.status!=='PASS')return {status:result?.status||'FAIL',reason:result?.reason||'No GPU data'};
 if(!validPoints(points)||points.length>MAX_GPU_PROBE_BATCH_POINTS||
    !Array.isArray(result.values)||result.values.length!==points.length)
  return {status:'FAIL',reason:'Invalid batch comparison inputs'};
 let worstError=0;
 for(let i=0;i<points.length;i+=MAX_GPU_PROBE_POINTS){
  const comparison=compareGPUProbeWithCPU(source,points.slice(i,i+MAX_GPU_PROBE_POINTS),
   {status:'PASS',values:result.values.slice(i,i+MAX_GPU_PROBE_POINTS)},options);
  if(comparison.status!=='PASS')return {...comparison,index:typeof comparison.index==='number'?i+comparison.index:i};
  worstError=Math.max(worstError,comparison.worstError);
 }
 return {status:'PASS',samples:points.length,worstError};
}
