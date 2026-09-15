(function(global){
  let currentAudio=null;
  const preloadedAudio=new Map();
  const MAX_PRELOADED=24;

  function normalizePronunciationKey(value){
    return String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
  }

  function pronunciationAsset(value){
    const key=normalizePronunciationKey(value);
    if(!key)return null;
    const manifest=global.VerbRunnerPronunciationManifest||{};
    return manifest[key]||null;
  }

  function rememberPreloaded(key,audio){
    preloadedAudio.delete(key);
    preloadedAudio.set(key,audio);
    while(preloadedAudio.size>MAX_PRELOADED){
      const oldest=preloadedAudio.keys().next().value;
      if(oldest==null)break;
      const stale=preloadedAudio.get(oldest);
      if(stale!==currentAudio){
        try{stale?.pause?.();}catch{}
      }
      preloadedAudio.delete(oldest);
    }
  }

  function preloadPronunciation(value,{AudioCtor=global.Audio}={}){
    const key=normalizePronunciationKey(value);
    if(!key||typeof AudioCtor!=='function')return false;
    const src=pronunciationAsset(key);
    if(!src)return false;

    const cached=preloadedAudio.get(key);
    if(cached){
      rememberPreloaded(key,cached);
      return true;
    }

    try{
      const audio=new AudioCtor(src);
      audio.preload='auto';
      rememberPreloaded(key,audio);
      if(typeof audio.load==='function')audio.load();
      return true;
    }catch{
      return false;
    }
  }

  function stopPronunciation(){
    if(!currentAudio)return;
    try{currentAudio.pause();}catch{}
    try{currentAudio.currentTime=0;}catch{}
    currentAudio=null;
  }

  function playCorrectPronunciation(value,{enabled=true,volume=1,AudioCtor=global.Audio}={}){
    if(!enabled)return false;
    const key=normalizePronunciationKey(value);
    const src=pronunciationAsset(key);
    if(!key||!src||typeof AudioCtor!=='function')return false;

    stopPronunciation();

    let audio=preloadedAudio.get(key);
    if(!audio){
      try{
        audio=new AudioCtor(src);
        audio.preload='auto';
        rememberPreloaded(key,audio);
      }catch{
        return false;
      }
    }else{
      rememberPreloaded(key,audio);
    }

    currentAudio=audio;
    try{audio.currentTime=0;}catch{}
    audio.volume=Math.max(0,Math.min(1,Number.isFinite(Number(volume))?Number(volume):1));
    if(typeof audio.addEventListener==='function'){
      audio.addEventListener('ended',()=>{if(currentAudio===audio)currentAudio=null;},{once:true});
    }
    try{audio.play().catch(()=>{});}catch{}
    return true;
  }

  const api={normalizePronunciationKey,pronunciationAsset,preloadPronunciation,playCorrectPronunciation,stopPronunciation};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerPronunciation=api;
})(typeof window!=='undefined'?window:globalThis);
