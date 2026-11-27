/** Common automatic-name formatting and SVG-safe name text for both scenes. */
export const MAX_OBJECT_NAME_LENGTH=180;
export function formatAutomaticName(type,id,convention){
 if(!['pascal','camel','snake'].includes(convention))throw Error('Invalid object naming convention.');
 const label=convention==='camel'?type:(type==='arrow'?'vector':type);
 const base=convention==='pascal'?label[0].toUpperCase()+label.slice(1):
  convention==='snake'?label.replace(/[A-Z]/g,letter=>'_'+letter.toLowerCase()):label;
 return `${base} ${id}`;
}
/** Unicode scalar values admitted by XML 1.0, including astral characters. */
export function xmlTextSafe(value){
 if(typeof value!=='string')return false;
 for(const ch of value){const c=ch.codePointAt(0);
  if(!(c===9||c===10||c===13||(c>=32&&c<=0xd7ff)||(c>=0xe000&&c<=0xfffd)||(c>=0x10000&&c<=0x10ffff)))return false;
 }
 return true;
}
