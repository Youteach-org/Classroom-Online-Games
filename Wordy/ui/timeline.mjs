const defaultSleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export async function playResolutionTimeline(root,events,{delayMs=420,sleep=defaultSleep}={}){
  const node=root?.querySelector?.('#eventLabel');
  const timeline=Array.isArray(events)?events.filter(event=>event?.label):[];
  if(!node||timeline.length===0)return;
  for(let index=0;index<timeline.length;index++){
    node.textContent=timeline[index].label;
    if(index<timeline.length-1)await sleep(delayMs);
  }
}
