export function normalizeWord(value){
  return String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
}

export function spanForWord(value){
  const word=normalizeWord(value);
  if(!word)throw new Error('word is required');
  if(word.length<=2)return 1;
  if(word.length<=5)return 2;
  if(word.length<=8)return 3;
  return 4;
}
