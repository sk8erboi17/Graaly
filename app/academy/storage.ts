export const academyStorageKey = "graaly.academy.arena.v1";

/** Catch both access denial and write/quota failures without dropping in-memory drafts. */
export function writeAcademyState(serialized:string,getStorage:()=>Pick<Storage,"setItem">=()=>localStorage):boolean {
  try { getStorage().setItem(academyStorageKey,serialized);return true; }
  catch { return false; }
}
