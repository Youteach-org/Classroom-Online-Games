import {fmt} from './review-render.js';

const core=window.VerbRunnerPronunciationReviewCore;

function download(name,text,type){
  const blob=new Blob([text],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

export function exportJson(records){
  download('Verb-Runner-Pronunciation-Review.json',JSON.stringify({
    exportedAt:new Date().toISOString(),
    records
  },null,2),'application/json');
}

export function exportMarkdown(catalog){
  const lines=['# Verb Runner pronunciation review export','',`Exported: ${new Date().toISOString()}`,''];
  for(const entry of catalog){
    const reports=core.reportEntries(entry.reports).filter(x=>x.status!=='deleted');
    if(entry.status==='unreviewed'&&!reports.length)continue;
    lines.push(`## #${String(entry.n).padStart(3,'0')} — ${entry.key}`,'');
    lines.push(`- Status: ${entry.status}`);
    lines.push(`- Asset created: ${fmt(entry.assetCreatedAt)}`);
    lines.push(`- Reviewed by: ${entry.reviewedBy||'—'}`);
    lines.push(`- Last review: ${fmt(entry.reviewedAt)}`);
    if(entry.duplicateOf)lines.push(`- Duplicate of: #${String(entry.duplicateOfRef||'?').padStart(3,'0')} — ${entry.duplicateOf}`);
    for(const report of reports){
      lines.push(`- Report [${report.status||'open'}] ${report.reviewer||'Unknown'}: ${report.text||''}`);
    }
    lines.push('');
  }
  download('Verb-Runner-Pronunciation-Review.md',lines.join('\n'),'text/markdown');
}
