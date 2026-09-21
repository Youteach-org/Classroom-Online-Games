import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const port=Number(process.env.WORDY_PREVIEW_PORT||4173);
const host=process.env.WORDY_PREVIEW_HOST||'127.0.0.1';
const repoRoot=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.wav':'audio/wav',
  '.mp3':'audio/mpeg'
};

function safePath(urlPath){
  const clean=decodeURIComponent((urlPath||'/').split('?')[0]);
  const requested=clean==='/'?'/Wordy/':clean;
  const withIndex=requested.endsWith('/')?requested+'index.html':requested;
  const relative=normalize(withIndex).replace(/^([/\\])+/, '');
  const full=resolve(repoRoot,relative);
  if(full!==repoRoot&&!full.startsWith(repoRoot+sep))return null;
  return full;
}

const server=createServer(async(req,res)=>{
  const path=safePath(req.url);
  if(!path){
    res.writeHead(403,{'content-type':'text/plain; charset=utf-8'});
    res.end('Forbidden');
    return;
  }
  try{
    const data=await readFile(path);
    res.writeHead(200,{
      'content-type':mime[extname(path).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  }catch{
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
});

server.listen(port,host,()=>{
  const displayHost=host==='0.0.0.0'?'localhost':host;
  const url=`http://${displayHost}:${port}/Wordy/`;
  console.log('\nWordy local preview');
  console.log(url);
  console.log('Press Ctrl+C to stop.\n');

  if(process.argv.includes('--open')){
    const command=process.platform==='win32'
      ?['cmd',['/c','start','',url]]
      :process.platform==='darwin'
        ?['open',[url]]
        :['xdg-open',[url]];
    try{
      const child=spawn(command[0],command[1],{detached:true,stdio:'ignore'});
      child.unref();
    }catch{
      // Opening the browser is optional; the URL is always printed above.
    }
  }
});
