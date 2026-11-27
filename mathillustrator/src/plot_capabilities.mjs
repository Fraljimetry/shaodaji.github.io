/** Authoritative plot capabilities. Stored applicability is distinct from active UI state. */
export const MAX_DOMAIN_RESOLUTION=1536;
export const MAX_DOMAIN_PIXELS=MAX_DOMAIN_RESOLUTION*MAX_DOMAIN_RESOLUTION;
export const IMPLICIT_COLOR_SCHEMES=Object.freeze([['range','Red–purple–blue'],['diverging','Blue–white–red'],['viridis','Viridis'],['inferno','Inferno'],['grayscale','Grayscale'],['rainbow','Rainbow'],['sign','Sign coloring'],['bands','Contour bands']].map(Object.freeze));
export const IMPLICIT_COLOR_MODES=Object.freeze([...IMPLICIT_COLOR_SCHEMES.map(([key])=>key),'heat']);
export const DOMAIN_COLOR_SCHEMES=Object.freeze([['phase-modulus','Phase + modulus'],['phase','Phase only'],['contours','Modulus bands'],['phase-contours','Phase + contour lines'],['phase-checker','Phase + checkerboard'],['phase-sectors','Phase sectors']].map(Object.freeze));
export const DOMAIN_COLOR_MODES=Object.freeze(DOMAIN_COLOR_SCHEMES.map(([key])=>key));

export const MIN_RASTER_RESOLUTION=32;
export const PLOT_CAPABILITIES=Object.freeze(Object.fromEntries(Object.entries({
 function:{},parametric:{},implicit:{region:true,conditionalRegion:true,range:true,palette:'scalar',resolution:true},
 vectorField:{region:true,range:true,densityMax:40},domainColoring:{region:true,palette:'complex',resolution:true},
 surface3d:{region:true,range:true,dimension:3},parametric3d:{region:true,range:true,dimension:3,parameters:true},
 implicit3d:{region:true,range:true,dimension:3},vector3d:{region:true,range:true,dimension:3,densityMax:12,widthMax:12},
 domain3d:{region:true,range:true,dimension:3,palette:'complex',solid:true}
}).map(([key,value])=>[key,Object.freeze(value)])));
const NONE=Object.freeze({});
export function plotCapability(o){const key=o?.kind??o?.type;return Object.hasOwn(PLOT_CAPABILITIES,key)?PLOT_CAPABILITIES[key]:NONE;}
export function plotState(o){
 const c=plotCapability(o),range=o?.colorRange===true,raster=!!c.resolution&&(!c.conditionalRegion||range);
 return {raster,regionEnabled:!!c.region&&(!c.conditionalRegion||range),paletteEnabled:!!c.palette&&(c.dimension===3?!range:!c.conditionalRegion||range),solidEnabled:!raster&&!(c.range&&range)&&(!c.solid||o.colorMode==='solid'),widthEnabled:c.dimension===3?!!c.widthMax:!raster};
}
export function validRasterResolution(v){return Number.isInteger(v)&&v>=MIN_RASTER_RESOLUTION&&v<=MAX_DOMAIN_RESOLUTION;}
export function validVectorDensity(o){const c=plotCapability(o);return !!c.densityMax&&Number.isInteger(o.density)&&o.density>=3&&o.density<=c.densityMax;}
export function validPlotPalette(o){const c=plotCapability(o);return c.palette==='scalar'?IMPLICIT_COLOR_MODES.includes(o.colorMode===undefined?'range':o.colorMode):c.palette==='complex'?(DOMAIN_COLOR_MODES.includes(o.colorMode??(c.dimension===3?undefined:'phase-modulus'))||c.solid===true&&o.colorMode==='solid'):o.colorMode===undefined;}
export function unexpectedPlotProperties(o){const c=plotCapability(o);return (!c.range&&o.colorRange!==undefined)||(!c.densityMax&&(o.density!==undefined||o.normalized!==undefined))||(!c.resolution&&o.resolution!==undefined)||(!c.palette&&o.colorMode!==undefined)||(!c.region&&o.region!==undefined)||(c.dimension===3&&((!c.solid&&o.heightMode!==undefined)||(!c.widthMax&&o.lineWidth!==undefined)||(!c.parameters&&['uMin','uMax','vMin','vMax'].some(k=>o[k]!==undefined))));}
