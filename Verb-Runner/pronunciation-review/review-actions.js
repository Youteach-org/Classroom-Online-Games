import {getReport,saveAudioPatch,addReport,setNamedReport,updateReport,addHistory} from './firebase-store.js';

const core=window.VerbRunnerPronunciationReviewCore;
const now=()=>Date.now();

export const SEED_REPORTS=[
  {ref:10,key:'are waiting',kind:'timing',text:'Strange vibrato at the beginning; regenerate.'},
  {ref:13,key:'asked',kind:'pronunciation',text:'Sounds like “nasked”.'},
  {ref:15,key:'at 11 tonight',kind:'file-error',text:'File/audio error; does not play correctly or appears corrupt.'},
  {ref:16,key:'ate',kind:'pronunciation',text:'Sounds like “great” rather than “ate”.'},
  {ref:17,key:'be',kind:'pronunciation',text:'Does not sound like the English verb /biː/.'},
  {ref:20,key:'became',kind:'pronunciation',text:'Sounds approximately “bequeim”; pronunciation is distorted/incorrect.'},
  {ref:33,key:'bitten',kind:'pronunciation',text:'Sounds approximately “betten”.'},
  {ref:61,key:'change',kind:'pronunciation',text:'Sounds approximately “kchain”; pronunciation is incorrect.'},
  {ref:62,key:'changed',kind:'pronunciation',text:'Sounds approximately “kchaincht”; pronunciation is distorted/incorrect.'},
  {ref:127,key:'fought',kind:'pronunciation',text:'Sounds like “fault” / otherwise incorrect.'}
];

function assetCreatedAt(entry,record){
  if(record.source&&record.source!==entry.src)return now();
  return record.assetCreatedAt||entry.assetCreatedAt||core.inferAssetCreatedAt(entry.key,entry.src)||now();
}

async function history(entry,action,by,details={}){
  await addHistory(entry.id,{action,by,at:now(),...details});
}

async function touch(entry,record,extra={}){
  const sourceChanged=Boolean(record.source&&record.source!==entry.src);
  await saveAudioPatch(entry.id,{
    key:entry.key,
    source:entry.src,
    sourceType:entry.sourceType,
    assetCreatedAt:assetCreatedAt(entry,record),
    updatedAt:now(),
    ...extra
  });
  if(sourceChanged)await history(entry,'asset-source-changed','system',{from:record.source,to:entry.src});
}

export async function seedKnownReports(catalog,records){
  const byKey=new Map(catalog.map(entry=>[entry.key,entry]));
  for(const seed of SEED_REPORTS){
    const entry=byKey.get(seed.key);
    if(!entry)continue;
    const reportId=`seed-20260916-${String(seed.ref).padStart(3,'0')}`;
    if(await getReport(entry.id,reportId))continue;
    const record=records[entry.id]||{};
    const created=Date.parse('2026-09-16T00:00:00-06:00');
    await touch(entry,record,{
      status:'needs-fix',
      reviewedBy:'Initial manual audit',
      firstReviewedAt:record.firstReviewedAt||created,
      reviewedAt:created,
      lastReviewedAt:created
    });
    await setNamedReport(entry.id,reportId,{
      text:seed.text,
      kind:seed.kind,
      status:'open',
      reviewer:'Initial manual audit',
      createdAt:created,
      source:'chat-audit',
      originalReference:seed.ref
    });
    await history(entry,'report-seeded','system',{reportId,originalReference:seed.ref});
  }
}

export async function markReviewed(entry,record,by){
  const stamp=now();
  await touch(entry,record,{
    status:'reviewed',
    reviewedBy:by,
    firstReviewedAt:record.firstReviewedAt||stamp,
    reviewedAt:stamp,
    lastReviewedAt:stamp,
    removedAsDuplicate:false,
    cleanupRequested:false
  });
  await history(entry,'reviewed-ok',by);
}

export async function saveProblem(entry,record,by,text,kind){
  if(core.hasDuplicateReport(record.reports,text))return {duplicate:true};
  const stamp=now();
  const reportId=await addReport(entry.id,{
    text:String(text).trim(),
    kind,
    status:'open',
    reviewer:by,
    createdAt:stamp,
    assetSource:entry.src
  });
  await touch(entry,record,{
    status:'needs-fix',
    reviewedBy:by,
    firstReviewedAt:record.firstReviewedAt||stamp,
    reviewedAt:stamp,
    lastReviewedAt:stamp
  });
  await history(entry,'report-added',by,{reportId,kind,text:String(text).trim()});
  return {duplicate:false,reportId};
}

function autosaveReportId(by){
  return 'autosave-'+core.audioIdForKey(by||'reviewer');
}

export async function saveAutosaveReport(entry,record,by,text,kind){
  const value=String(text||'').trim();
  if(!value)return clearAutosaveReport(entry,record,by);

  const reportId=autosaveReportId(by);
  const existing=await getReport(entry.id,reportId);
  const stamp=now();

  if(existing){
    await updateReport(entry.id,reportId,{
      text:value,
      kind,
      status:'open',
      reviewer:by,
      updatedAt:stamp,
      assetSource:entry.src,
      deletedAt:null,
      deletedBy:null
    });
  }else{
    await setNamedReport(entry.id,reportId,{
      text:value,
      kind,
      status:'open',
      reviewer:by,
      createdAt:stamp,
      updatedAt:stamp,
      assetSource:entry.src,
      previousStatus:record.status||'unreviewed'
    });
    await history(entry,'report-autosave-started',by,{reportId,kind});
  }

  await touch(entry,record,{
    status:'needs-fix',
    reviewedBy:by,
    firstReviewedAt:record.firstReviewedAt||stamp,
    reviewedAt:stamp,
    lastReviewedAt:stamp
  });

  return {reportId,saved:true};
}

export async function clearAutosaveReport(entry,record,by){
  const reportId=autosaveReportId(by);
  const existing=await getReport(entry.id,reportId);
  if(!existing||existing.status==='deleted')return {cleared:false};

  const stamp=now();
  await updateReport(entry.id,reportId,{
    status:'deleted',
    text:'',
    deletedAt:stamp,
    deletedBy:by,
    updatedAt:stamp
  });

  await touch(entry,record,{
    status:existing.previousStatus||'unreviewed',
    reviewedBy:by,
    reviewedAt:stamp,
    lastReviewedAt:stamp
  });

  await history(entry,'report-autosave-cleared',by,{reportId});
  return {cleared:true};
}

export async function resolveReport(entry,reportId,by){
  await updateReport(entry.id,reportId,{status:'resolved',resolvedAt:now(),resolvedBy:by});
  await history(entry,'report-resolved',by,{reportId});
}

export async function deleteReport(entry,reportId,by){
  await updateReport(entry.id,reportId,{status:'deleted',deletedAt:now(),deletedBy:by});
  await history(entry,'report-soft-deleted',by,{reportId});
}

export async function markDuplicate(entry,record,canonical,by){
  const stamp=now();
  const duplicateOf=canonical.key;
  const duplicateOfRef=canonical.n;
  await touch(entry,record,{
    status:'removed-duplicate',
    duplicateOf,
    duplicateOfRef,
    duplicateMarkedAt:stamp,
    duplicateMarkedBy:by,
    removedAsDuplicate:true,
    cleanupRequested:true,
    removedAt:stamp,
    removedBy:by,
    reviewedBy:by,
    firstReviewedAt:record.firstReviewedAt||stamp,
    reviewedAt:stamp,
    lastReviewedAt:stamp
  });
  await history(entry,'duplicate-cleanup-requested',by,{duplicateOf,duplicateOfRef});
}
