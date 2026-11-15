/** Round 119: bounded, opt-in WebGL2 numerical readback diagnostic.
 * No production 3D mesh path calls this module. No CPU fallback is disguised
 * as GPU execution. The caller must check status before using values.
 */
import {compileRestrictedGPUImplicit} from './gpu_expression3d.mjs?cut=round119';

export const MAX_GPU_PROBE_POINTS = 256;

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
 if(!Array.isArray(points)||points.length<1||points.length>MAX_GPU_PROBE_POINTS ||
    points.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e5)))
   return {status:'REJECTED',reason:'Invalid or excessive samples'};
 const compiled=compileRestrictedGPUImplicit(source);
 if(!compiled)return {status:'REJECTED',reason:'Expression outside restricted compiler'};
 let gl;
 try{canvas.width=points.length;canvas.height=1;gl=canvas.getContext('webgl2',{
  preserveDrawingBuffer:true,antialias:false,alpha:false,depth:false,stencil:false});}
 catch{return {status:'UNAVAILABLE',reason:'WebGL2 context creation threw'};}
 if(!gl)return {status:'UNAVAILABLE',reason:'No WebGL2 context'};
 let program,vs,fs,buffer,vao;
 try{
  if(gl.isContextLost())throw Error('WebGL2 context lost');
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
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS,0,points.length);
  const bytes=new Uint8Array(points.length*4);
  gl.readPixels(0,0,points.length,1,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
  if(gl.isContextLost()||gl.getError()!==gl.NO_ERROR)throw Error('GPU draw/readback failed');
  const view=new DataView(bytes.buffer);const values=[];
  for(let i=0;i<points.length;i++)values.push(view.getFloat32(i*4,true));
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
 const compiled=compileRestrictedGPUImplicit(source);
 if(!compiled||result.values.length!==points.length)return {status:'FAIL',reason:'Invalid comparison inputs'};
 let worstError=0;
 for(let i=0;i<points.length;i++){
  const actual=result.values[i],expected=compiled.cpu(...points[i]);
  const error=Math.abs(actual-expected);
  if(!Number.isFinite(actual)||!Number.isFinite(expected)||error>absoluteTolerance+relativeTolerance*Math.abs(expected))
   return {status:'FAIL',index:i,actual,expected,error};
  worstError=Math.max(worstError,error);
 }
 return {status:'PASS',samples:points.length,worstError,absoluteTolerance,relativeTolerance};
}
