(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VerbRunnerPronunciationReviewCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const LEGACY_BATCH_CREATED_AT=Date.parse('2026-09-15T17:41:02Z');
  const KNOWN_SOURCE_CREATED_AT={
    'live':Date.parse('2026-09-16T04:28:06Z'),
    'close':Date.parse('2026-09-16T05:24:57Z'),
    'use':Date.parse('2026-09-16T05:24:57Z'),
    'used':Date.parse('2026-09-16T05:24:57Z'),
    'read::base':Date.parse('2026-09-16T05:24:57Z'),
    'read::past':Date.parse('2026-09-16T05:24:57Z')
  };

  function normalizeText(value){
    return String(value??'').trim().replace(/\s+/g,' ');
  }

  function normalizeKey(value){
    return normalizeText(value).toLowerCase();
  }

  function fnv1a(value){
    let hash=0x811c9dc5;
    for(const ch of String(value)){
      hash^=ch.charCodeAt(0);
      hash=Math.imul(hash,0x01000193);
    }
    return (hash>>>0).toString(36);
  }

  function slug(value){
    return normalizeKey(value)
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'')
      .slice(0,42)||'audio';
  }

  function audioIdForKey(key){
    return `${slug(key)}-${fnv1a(normalizeKey(key))}`;
  }

  function sourceType(src){
    const value=String(src||'');
    if(/cdn\.creativeclaw\.co/i.test(value))return 'external';
    if(/\.wav(?:$|\?)/i.test(value))return 'local-wav';
    return 'other';
  }

  function inferAssetCreatedAt(key,src){
    const normalized=normalizeKey(key);
    if(KNOWN_SOURCE_CREATED_AT[normalized])return KNOWN_SOURCE_CREATED_AT[normalized];
    if(sourceType(src)==='local-wav')return LEGACY_BATCH_CREATED_AT;
    return null;
  }

  function reportFingerprint(text){
    return normalizeKey(text);
  }

  function reportEntries(reports){
    return Object.entries(reports||{})
      .map(([id,row])=>({id,...row}))
      .sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
  }

  function normalizeSearchText(value){
    return normalizeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[’'`]/g,'')
      .replace(/[^a-z0-9]+/g,' ')
      .trim()
      .replace(/\s+/g,' ');
  }

  function searchableValues(entry){
    const record=entry?.record||{};
    const reports=reportEntries(entry?.reports).flatMap(report=>[
      report.text,
      report.assetSource,
      report.kind,
      report.status
    ]);
    const history=Object.values(entry?.history||{}).flatMap(row=>
      Object.values(row||{}).filter(value=>
        typeof value==='string'||typeof value==='number'
      )
    );
    const ref=String(entry?.n??'');
    const ref3=ref?ref.padStart(3,'0'):'';
    return [
      ref,
      ref3,
      ref?('#'+ref):'',
      ref3?('#'+ref3):'',
      entry?.key,
      entry?.src,
      entry?.duplicateOf,
      record.key,
      record.source,
      record.repairSource,
      ...reports,
      ...history
    ].filter(value=>value!==undefined&&value!==null&&String(value).trim()!=='');
  }

  function matchesSearch(entry,query){
    const needle=normalizeSearchText(query);
    if(!needle)return true;
    const haystack=normalizeSearchText(searchableValues(entry).join(' '));
    return needle.split(' ').every(token=>haystack.includes(token));
  }

  function hasDuplicateReport(reports,text){
    const fingerprint=reportFingerprint(text);
    if(!fingerprint)return false;
    return reportEntries(reports).some(report=>
      report.status!=='deleted' &&
      reportFingerprint(report.text)===fingerprint
    );
  }

  function visibleReports(reports){
    return reportEntries(reports).filter(report=>report.status!=='deleted');
  }

  function normalizeStatus(record){
    if(record?.removedAsDuplicate)return 'removed-duplicate';
    if(record?.duplicateOf)return 'duplicate';
    if(record?.status==='needs-fix')return 'reported';
    if(record?.status)return record.status;
    return 'unreviewed';
  }

  function mergeCatalog(manifest,records){
    return Object.entries(manifest||{})
      .map(([key,src],index)=>{
        const id=audioIdForKey(key);
        const record=records?.[id]||{};
        const inferredCreatedAt=inferAssetCreatedAt(key,src);
        const sourceChanged=Boolean(record.source&&record.source!==src);
        return {
          n:index+1,
          id,
          key,
          src,
          sourceType:sourceType(src),
          assetCreatedAt:record.assetCreatedAt||inferredCreatedAt,
          sourceChanged,
          status:sourceChanged?'review-again':normalizeStatus(record),
          reviewedBy:record.reviewedBy||'',
          reviewedAt:record.reviewedAt||null,
          firstReviewedAt:record.firstReviewedAt||null,
          reports:record.reports||{},
          history:record.history||{},
          duplicateOf:record.duplicateOf||'',
          duplicateOfRef:Number(record.duplicateOfRef)||null,
          removedAsDuplicate:Boolean(record.removedAsDuplicate),
          record
        };
      });
  }

  return {
    LEGACY_BATCH_CREATED_AT,
    KNOWN_SOURCE_CREATED_AT,
    normalizeText,
    normalizeKey,
    normalizeSearchText,
    matchesSearch,
    audioIdForKey,
    sourceType,
    inferAssetCreatedAt,
    reportFingerprint,
    reportEntries,
    hasDuplicateReport,
    visibleReports,
    normalizeStatus,
    mergeCatalog
  };
});
