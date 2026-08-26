(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.SupportMeterLanguage=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MAP={
    he:{subject:'he',object:'him',possessive:'his',be:'is'},
    she:{subject:'she',object:'her',possessive:'her',be:'is'},
    they:{subject:'they',object:'them',possessive:'their',be:'are'}
  };
  function forms(pronoun){return {...(MAP[pronoun]||MAP.they)};}
  function questionFeeling(pronoun){const p=forms(pronoun);return `What ${p.be} ${p.subject} feeling?`;}
  function questionExpression(pronoun){const p=forms(pronoun);return `What would ${p.subject} say?`;}
  return {forms,questionFeeling,questionExpression};
});
