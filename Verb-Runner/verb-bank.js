(function(global){
  const VERBS = [
    {forms:['be','was / were','been'],decoys:['beed','were','being']},
    {forms:['beat','beat','beaten'],decoys:['beated','beateden','bitten']},
    {forms:['become','became','become'],decoys:['becomed','becomed','becomed']},
    {forms:['begin','began','begun'],decoys:['begined','beginned','began']},
    {forms:['bend','bent','bent'],decoys:['bended','bend','bented']},
    {forms:['bet','bet','bet'],decoys:['betted','bett','betten']},
    {forms:['bite','bit','bitten'],decoys:['bited','biten','bit']},
    {forms:['bleed','bled','bled'],decoys:['bleeded','bleed','blood']},
    {forms:['blow','blew','blown'],decoys:['blowed','blown','blewed']},
    {forms:['break','broke','broken'],decoys:['breaked','broke','broked']},
    {forms:['breed','bred','bred'],decoys:['breeded','breed','breden']},
    {forms:['bring','brought','brought'],decoys:['bringed','brang','broughten']},
    {forms:['build','built','built'],decoys:['builded','build','builted']},
    {forms:['burn','burned','burned'],decoys:['burnt','burn','burneded']},
    {forms:['burst','burst','burst'],decoys:['bursted','bursed','bursten']},
    {forms:['buy','bought','bought'],decoys:['buyed','brought','boughten']},
    {forms:['catch','caught','caught'],decoys:['catched','catch','caughten']},
    {forms:['choose','chose','chosen'],decoys:['choosed','chosed','choose']},
    {forms:['come','came','come'],decoys:['comed','come','came']},
    {forms:['cost','cost','cost'],decoys:['costed','costen','costs']},
    {forms:['creep','crept','crept'],decoys:['creeped','crepten','creep']},
    {forms:['cut','cut','cut'],decoys:['cutted','cutten','cuts']},
    {forms:['deal','dealt','dealt'],decoys:['dealed','dealten','deal']},
    {forms:['dig','dug','dug'],decoys:['digged','duggen','dig']},
    {forms:['do','did','done'],decoys:['doed','did','didone']},
    {forms:['draw','drew','drawn'],decoys:['drawed','drewed','drawed']},
    {forms:['dream','dreamed','dreamed'],decoys:['dreamt','dream','dreameded']},
    {forms:['drink','drank','drunk'],decoys:['drinked','dranked','drunken']},
    {forms:['drive','drove','driven'],decoys:['drived','drove','droven']},
    {forms:['eat','ate','eaten'],decoys:['eated','ated','ate']},
    {forms:['fall','fell','fallen'],decoys:['falled','fell','felled']},
    {forms:['feed','fed','fed'],decoys:['feeded','feed','feden']},
    {forms:['feel','felt','felt'],decoys:['feeled','feel','felten']},
    {forms:['fight','fought','fought'],decoys:['fighted','fight','foughten']},
    {forms:['find','found','found'],decoys:['finded','find','founded']},
    {forms:['fit','fit','fit'],decoys:['fitted','fitten','fits']},
    {forms:['fly','flew','flown'],decoys:['flied','flyed','flowed']},
    {forms:['forbid','forbade','forbidden'],decoys:['forbidded','forbad','forbade']},
    {forms:['forget','forgot','forgotten'],decoys:['forgetted','forgot','forgotted']},
    {forms:['forgive','forgave','forgiven'],decoys:['forgived','forgave','forgivened']},
    {forms:['freeze','froze','frozen'],decoys:['freezed','frozed','froze']},
    {forms:['get','got','gotten'],decoys:['getted','got','getten']},
    {forms:['give','gave','given'],decoys:['gived','gave','gaven']}
  ];

  function findVerb(base){
    const key=String(base||'').toLowerCase();
    return VERBS.find(v=>v.forms[0]===key)||null;
  }

  const api={VERBS,findVerb};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  global.VerbRunnerBank=api;
})(typeof window!=='undefined'?window:globalThis);
