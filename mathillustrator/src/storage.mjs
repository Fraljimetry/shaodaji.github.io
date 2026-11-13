/** Local-project coordination. No hidden remote service or silent merge.
 * The storage check/write stays synchronous inside the browser's origin-wide
 * Web Locks critical section; where Web Locks are unavailable, this remains
 * best-effort conflict detection, NOT a transactional cross-tab guarantee.
 */
export function compareAndWrite(storage,key,expected,payload){
 const current=storage.getItem(key);
 // A second writer may already have saved exactly the same document.
 // Treat that state as synchronized; never generate a redundant event or
 // incorrectly display a conflict merely because the expected token is old.
 if(current===payload)return current===expected?{ok:true}:{ok:true,alreadyCurrent:true};
 if(current!==expected)return {ok:false,reason:'conflict'};
 storage.setItem(key,payload);
 return {ok:true};
}
export function coordinateSave(locks,key,commit){
 if(locks?.request instanceof Function){
  return locks.request('mathillustrator-save:'+key,{mode:'exclusive'},commit);
 }
 // Preserve synchronous pre-unload behavior when the Web Locks API is absent.
 return commit();
}
