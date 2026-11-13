/** Memory-bounded plot path cache. Keys include expression and full view/size.
 * Only immutable path strings are cached, never mutable documents or functions.
 */
export function createPlotCache({maxEntries=32,maxCharacters=1200000}={}){
 const entries=new Map();let characters=0,hits=0,misses=0;
 return {
  get(key,compute){
   if(entries.has(key)){
    const value=entries.get(key);entries.delete(key);entries.set(key,value);hits++;return value;
   }
   misses++;
   const result=compute();
   if(typeof result!=='string'||result.length>maxCharacters)return result;
   entries.set(key,result);characters+=result.length;
   while(entries.size>maxEntries||characters>maxCharacters){
    const oldest=entries.keys().next().value,old=entries.get(oldest);
    entries.delete(oldest);characters-=old.length;
   }
   return result;
  },
  stats:()=>({entries:entries.size,characters,hits,misses}),
  clear:()=>{entries.clear();characters=0;},
 };
}
