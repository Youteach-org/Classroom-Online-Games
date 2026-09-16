(function(global){
  let currentAudio=null;
  const prefetchedAssets=new Set();
  const SILENT_WAV='data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

  function normalizePronunciationKey(value){
    return String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
  }

  function pronunciationKey(value,context={}){
    const key=normalizePronunciationKey(value);
    if(key!=='read')return key;

    const base=normalizePronunciationKey(context?.base);
    const blankIndex=Number(context?.blankIndex);
    if(base==='read'&&Number.isInteger(blankIndex)){
      return blankIndex===0?'read::base':'read::past';
    }

    const group=normalizePronunciationKey(context?.group);
    if(group==='past-simple')return 'read::past';
    return 'read::base';
  }

  function pronunciationAsset(value,context={}){
    const key=pronunciationKey(value,context);
    if(!key)return null;
    const manifest=global.VerbRunnerPronunciationManifest||{};
    return manifest[key]||null;
  }

  function ensurePlaybackAudio(AudioCtor=global.Audio){
    if(currentAudio)return currentAudio;
    if(typeof AudioCtor!=='function')return null;
    try{
      currentAudio=new AudioCtor();
      currentAudio.preload='auto';
      return currentAudio;
    }catch{
      return null;
    }
  }

  function unlockPronunciation({AudioCtor=global.Audio}={}){
    const audio=ensurePlaybackAudio(AudioCtor);
    if(!audio)return false;

    try{
      audio.pause();
      audio.muted=true;
      audio.src=SILENT_WAV;
      audio.currentTime=0;
      const result=audio.play();
      if(result&&typeof result.then==='function'){
        result.then(()=>{
          try{audio.pause();}catch{}
          try{audio.currentTime=0;}catch{}
          audio.muted=false;
        }).catch(()=>{audio.muted=false;});
      }else{
        audio.muted=false;
      }
      return true;
    }catch{
      audio.muted=false;
      return false;
    }
  }

  function preloadPronunciation(value,context={}){
    const src=pronunciationAsset(value,context);
    if(!src||prefetchedAssets.has(src))return Boolean(src);
    prefetchedAssets.add(src);
    if(typeof global.fetch==='function'){
      global.fetch(src,{cache:'force-cache'}).catch(()=>prefetchedAssets.delete(src));
    }
    return true;
  }

  function stopPronunciation(){
    if(!currentAudio)return;
    try{currentAudio.pause();}catch{}
    try{currentAudio.currentTime=0;}catch{}
  }

  function playCorrectPronunciation(value,{enabled=true,volume=1,AudioCtor=global.Audio,context={}}={}){
    if(!enabled)return false;
    const src=pronunciationAsset(value,context);
    if(!src)return false;

    const audio=ensurePlaybackAudio(AudioCtor);
    if(!audio)return false;

    try{currentAudio.pause();}catch{}
    try{audio.currentTime=0;}catch{}
    audio.muted=false;
    audio.preload='auto';
    if(audio.src!==new URL(src,global.location?.href||'http://localhost/').href){
      audio.src=src;
    }
    audio.volume=Math.max(0,Math.min(1,Number.isFinite(Number(volume))?Number(volume):1));
    try{audio.play().catch(()=>{});}catch{}
    return true;
  }

  const api={
    normalizePronunciationKey,
    pronunciationKey,
    pronunciationAsset,
    unlockPronunciation,
    preloadPronunciation,
    playCorrectPronunciation,
    stopPronunciation
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerPronunciation=api;
})(typeof window!=='undefined'?window:globalThis);
