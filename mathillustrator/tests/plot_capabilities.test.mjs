import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PLOT_CAPABILITIES,plotCapability,plotState,validRasterResolution,validVectorDensity,validPlotPalette,unexpectedPlotProperties,IMPLICIT_COLOR_MODES,DOMAIN_COLOR_MODES,MIN_RASTER_RESOLUTION,MAX_DOMAIN_RESOLUTION} from '../src/plot_capabilities.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {newScene3D,add3DPlot,validate3D} from '../src/plot3d.mjs';
const bounds={xMin:-2,xMax:2,yMin:-2,yMax:2};
test('capability states distinguish stored settings from active controls',()=>{
 for(const [type,off,on] of [['implicit',[false,false,true,true],[true,true,false,false]],['vectorField',[true,false,true,true],[true,false,false,true]],['domainColoring',[true,true,false,false],[true,true,false,false]],['domain3d',[true,true,false,false],[true,false,false,false]],['vector3d',[true,false,true,true],[true,false,false,true]]]){
  for(const [range,expected] of [[false,off],[true,on]]){const s=plotState({type,colorRange:range});assert.deepEqual([s.regionEnabled,s.paletteEnabled,s.solidEnabled,s.widthEnabled],expected,type);}
 }
 assert.equal(plotState({kind:'domain3d',colorMode:'solid'}).solidEnabled,true);
 assert.deepEqual(plotCapability({type:'constructor'}),{});
 assert.ok(Object.isFrozen(PLOT_CAPABILITIES.implicit));
});
test('registry boundaries agree with stored 2D and 3D model contracts',()=>{
 const d=newDoc(),o=append(d,{type:'implicit',expr:'x',region:bounds,colorRange:false});
 for(const colorMode of IMPLICIT_COLOR_MODES){o.colorMode=colorMode;validateDoc(d);assert.ok(validPlotPalette(o));}
 for(const resolution of [31,32,1536,1537,32.5]){o.resolution=resolution;if(validRasterResolution(resolution))validateDoc(d);else assert.throws(()=>validateDoc(d));}
 o.resolution=32;o.colorMode='phase';assert.throws(()=>validateDoc(d));
 const scene=newScene3D(),v=add3DPlot(scene,'vector3d',['x','y','z']);
 for(const density of [2,3,12,13]){v.density=density;if(validVectorDensity(v))validate3D(scene);else assert.throws(()=>validate3D(scene));}
 v.density=3;v.colorMode='phase';assert.ok(unexpectedPlotProperties(v));assert.throws(()=>validate3D(scene));
});
test('checked-in schema mirrors the registry palette enums and numeric bounds',()=>{
 const defs=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url),'utf8')).$defs;
 const obj=defs.object,plot=defs.scene3d.properties.plots.items;
 const enumFor=type=>obj.allOf.find(x=>x.if?.properties?.type?.const===type&&x.then?.properties?.colorMode).then.properties.colorMode.enum;
 assert.deepEqual(new Set(enumFor('implicit')),new Set(IMPLICIT_COLOR_MODES));
 assert.deepEqual(new Set(enumFor('domainColoring')),new Set(DOMAIN_COLOR_MODES));
 assert.deepEqual(new Set(plot.properties.colorMode.enum),new Set([...DOMAIN_COLOR_MODES,'solid']));
 assert.equal(obj.properties.resolution.minimum,MIN_RASTER_RESOLUTION);assert.equal(obj.properties.resolution.maximum,MAX_DOMAIN_RESOLUTION);
 assert.equal(obj.properties.density.maximum,PLOT_CAPABILITIES.vectorField.densityMax);assert.equal(plot.properties.density.maximum,PLOT_CAPABILITIES.vector3d.densityMax);assert.equal(plot.properties.lineWidth.maximum,PLOT_CAPABILITIES.vector3d.widthMax);
});
