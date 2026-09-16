const core=window.VerbRunnerPronunciationReviewCore;

export const fmt=value=>value?new Date(Number(value)).toLocaleString():'—';

export const statusLabel=status=>({
  'unreviewed':'UNREVIEWED',
  'needs-fix':'NEEDS FIX',
  'reviewed':'REVIEWED',
  'duplicate':'DUPLICATE',
  'removed-duplicate':'REMOVED DUPLICATE'
})[status]||String(status||'UNREVIEWED').toUpperCase();

function historyEntries(history){
  return Object.entries(history||{})
    .map(([id,row])=>({id,...row}))
    .sort((a,b)=>Number(b.at||0)-Number(a.at||0));
}

function renderReports(entry,card){
  const reports=core.reportEntries(entry.reports);
  card.querySelector('.report-count').textContent=`(${reports.filter(x=>x.status!=='deleted').length})`;
  const list=card.querySelector('.reports-list');
  if(!reports.length){
    list.innerHTML='<div class="report-item">No reports yet.</div>';
    return;
  }
  for(const report of reports){
    const row=document.createElement('div');
    row.className=`report-item ${report.status==='deleted'?'deleted':''}`;
    const body=document.createElement('div');
    body.textContent=report.text||'';
    row.appendChild(body);
    const meta=document.createElement('div');
    meta.className='report-meta';
    meta.textContent=`${report.kind||'report'} · ${report.status||'open'} · ${report.reviewer||'Unknown reviewer'} · ${fmt(report.createdAt)}`;
    row.appendChild(meta);

    if(report.status!=='deleted'){
      const actions=document.createElement('div');
      actions.className='report-actions';
      if(report.status!=='resolved'){
        const resolve=document.createElement('button');
        resolve.type='button';
        resolve.textContent='Resolve';
        resolve.dataset.action='resolve-report';
        resolve.dataset.reportId=report.id;
        actions.appendChild(resolve);
      }
      const del=document.createElement('button');
      del.type='button';
      del.textContent='Delete repeated';
      del.className='danger';
      del.dataset.action='delete-report';
      del.dataset.reportId=report.id;
      actions.appendChild(del);
      row.appendChild(actions);
    }
    list.appendChild(row);
  }
}

function renderHistory(entry,card){
  const rows=historyEntries(entry.history);
  card.querySelector('.history-count').textContent=`(${rows.length})`;
  const list=card.querySelector('.history-list');
  if(!rows.length){
    list.innerHTML='<div class="history-item">No history yet.</div>';
    return;
  }
  for(const item of rows){
    const row=document.createElement('div');
    row.className='history-item';
    row.textContent=item.action||'event';
    const meta=document.createElement('div');
    meta.className='history-meta';
    meta.textContent=`${item.by||'system'} · ${fmt(item.at)}${item.duplicateOf?` · original: ${item.duplicateOf}`:''}`;
    row.appendChild(meta);
    list.appendChild(row);
  }
}

export function renderCard(entry,template,audioUrl){
  const node=template.content.firstElementChild.cloneNode(true);
  node.dataset.audioId=entry.id;
  node.dataset.status=entry.status;
  node.querySelector('.number').textContent=`#${String(entry.n).padStart(3,'0')}`;
  node.querySelector('.audio-key').textContent=entry.key;
  node.querySelector('.status-badge').textContent=statusLabel(entry.status);
  node.querySelector('.changed-badge').hidden=!entry.sourceChanged;
  const sourceNode=node.querySelector('.source');
  sourceNode.textContent=String(entry.src||'').split('/').pop()||entry.src;
  sourceNode.title=entry.src||'';
  node.querySelector('.metadata').textContent=[
    `Created ${fmt(entry.assetCreatedAt)}`,
    `By ${entry.reviewedBy||'—'}`,
    `Reviewed ${fmt(entry.reviewedAt)}`,
    entry.duplicateOf?`Duplicate of: ${entry.duplicateOf}`:''
  ].filter(Boolean).join(' · ');
  node.querySelector('audio').src=audioUrl(entry.src);

  const autosaved=core.reportEntries(entry.reports)
    .find(report=>String(report.id||'').startsWith('autosave-')&&report.status==='open');
  if(autosaved){
    node.querySelector('.report-text').value=autosaved.text||'';
    node.querySelector('.report-kind').value=autosaved.kind||'pronunciation';
    node.querySelector('.autosave-status').textContent='Saved';
  }

  node.querySelector('.duplicate-target').value=entry.duplicateOf||'';
  node.querySelector('[data-action="remove-duplicate"]').hidden=entry.status!=='duplicate';
  node.querySelector('[data-action="restore-duplicate"]').hidden=entry.status!=='removed-duplicate';
  renderReports(entry,node);
  renderHistory(entry,node);
  return node;
}
