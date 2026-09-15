(function(global){
  let currentAudio=null;

  function normalizePronunciationKey(value){
    return String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
  }

  function pronunciationAsset(value){
    const key=normalizePronunciationKey(value);
    if(!key)return null;
    const manifest=global.VerbRunnerPronunciationManifest||{};
    return manifest[key]||null;
  }

  function stopPronunciation(){
    if(!currentAudio)return;
    try{currentAudio.pause();}catch{}
    try{currentAudio.currentTime=0;}catch{}
    currentAudio=null;
  }

  function playCorrectPronunciation(value,{enabled=true,volume=1,AudioCtor=global.Audio}={}){
    if(!enabled)return false;
    const src=pronunciationAsset(value);
    if(!src||typeof AudioCtor!=='function')return false;

    stopPronunciation();
    const audio=new AudioCtor(src);
    currentAudio=audio;
    audio.preload='auto';
    audio.volume=Math.max(0,Math.min(1,Number.isFinite(Number(volume))?Number(volume):1));
    if(typeof audio.addEventListener==='function'){
      audio.addEventListener('ended',()=>{if(currentAudio===audio)currentAudio=null;},{once:true});
    }
    try{audio.play().catch(()=>{});}catch{}
    return true;
  }

  const api={normalizePronunciationKey,pronunciationAsset,playCorrectPronunciation,stopPronunciation};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerPronunciation=api;
})(typeof window!=='undefined'?window:globalThis);
