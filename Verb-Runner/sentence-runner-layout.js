(function(global){
  const ZONES=[
    {
      id:'market',
      label:'MARKET STREETS',
      start:0,
      end:.32,
      elevation:0,
      laneSpacing:2.55,
      camera:{y:4.8,z:9.2,fov:57,lookY:1.05,lookZ:-8}
    },
    {
      id:'rooftops',
      label:'ROOFTOP RUN',
      start:.32,
      end:.66,
      elevation:4.2,
      laneSpacing:2.15,
      camera:{y:5.4,z:10.4,fov:61,lookY:1.15,lookZ:-10}
    },
    {
      id:'promenade',
      label:'SEAFRONT PROMENADE',
      start:.66,
      end:1.01,
      elevation:0,
      laneSpacing:3.25,
      camera:{y:5.15,z:10.7,fov:64,lookY:1.0,lookZ:-10}
    }
  ];

  function clamp(value,min,max){
    return Math.max(min,Math.min(max,Number(value)||0));
  }

  function zoneForProgress(progress=0){
    const p=clamp(progress,0,1);
    const zone=ZONES.find(item=>p>=item.start&&p<item.end)||ZONES.at(-1);
    return {
      ...zone,
      lanes:[-zone.laneSpacing,0,zone.laneSpacing]
    };
  }

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function buildLaneChoices(sequence,random=Math.random){
    const source=(Array.isArray(sequence)?sequence:[])
      .filter(item=>item&&item.value!=null);
    const correct=source.find(item=>item.correct===true);
    if(!correct)return [];

    const distractors=shuffled(
      source.filter(item=>item!==correct&&!item.correct),
      random
    ).slice(0,2);

    if(distractors.length<2)return [];
    return shuffled([correct,...distractors],random);
  }

  function readingLeadSeconds(values,difficulty='medium'){
    const list=Array.isArray(values)?values:[values];
    const longest=list.reduce((max,value)=>Math.max(max,String(value??'').length),0);
    const base=difficulty==='easy'?3.15:(difficulty==='hard'?2.4:2.7);
    const extra=Math.max(0,longest-8)*.085;
    return clamp(base+extra,2.4,5.5);
  }

  const api={ZONES,zoneForProgress,buildLaneChoices,readingLeadSeconds};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerSentenceLayout=api;
})(typeof window!=='undefined'?window:globalThis);
