const fs=require('node:fs/promises');const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const mirror='https://raw.githubusercontent.com/komed3/rtb-api/main/api';
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`HTTP ${r.status} ${url}`);return r.json()}
async function main(){
 const date=process.argv[2];if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Pass YYYY-MM-DD; never trust mirror latest alias');
 const url=`${mirror}/list/rtb/${date}`,raw=await json(url);if(raw.date!==date)throw Error('Snapshot date mismatch');
 const rows=raw.list.filter(p=>p.citizenship==='us'&&Number.isFinite(p.networth)&&p.networth>0).sort((a,b)=>b.networth-a.networth||a.rank-b.rank).slice(0,500);
 if(rows.length!==500||new Set(rows.map(p=>p.uri)).size!==500)throw Error('Incomplete/duplicate top500');
 const people=[],locations=[];for(let i=0;i<rows.length;i+=5){await Promise.all(rows.slice(i,i+5).map(async(p,j)=>{
  let info=null;try{info=await json(`${mirror}/profile/${p.uri}/info`)}catch{}
  locations.push({id:p.uri,state:info?.residence?.country==='us'?info.residence.state||null:null,status:info?.residence?.country==='us'&&info.residence.state?'reported':info?.residence?.country&&info.residence.country!=='us'?'outside_us':'missing',source:`${mirror}/profile/${p.uri}/info`});
  people.push({id:p.uri,name:p.name,rank:i+j+1,globalRank:p.rank,worthUsd:Math.round(p.networth*1e6),industry:p.industry||[],companies:p.source||[],photo:info?.image||null,organization:info?.organization||null,family:!!info?.family,birthYear:info?.birthDate?.slice(0,4)||null,profileSource:`https://www.forbes.com/profile/${p.uri}/`,mirrorProfile:`${mirror}/profile/${p.uri}/info`,profileAvailable:!!info});
 }));process.stdout.write(`Profiles ${Math.min(i+5,500)}/500\n`)}
 people.sort((a,b)=>a.rank-b.rank);
 const result={schemaVersion:1,date:raw.date,retrievedAt:new Date().toISOString(),scope:'Forbes citizenship us; first 500 by estimated net worth',source:'https://www.forbes.com/real-time-billionaires/',mirror:url,mirrorProject:'https://github.com/komed3/rtb-api',unit:'USD',inputUnit:'million USD',politicalEvidenceStatus:'not_collected',people};
 locations.sort((a,b)=>a.id.localeCompare(b.id));
 const stateResult={retrievedAt:new Date().toISOString(),wealthDate:date,scope:'Public profile state-level residence, may be stale; not preference or live location',people:locations};
 const archive=path.join(ROOT,'research/political-trades/billionaire-snapshots');await fs.mkdir(archive,{recursive:true});
 const archivePath=path.join(archive,`${date}-top500.json`);
 try{await fs.writeFile(archivePath,JSON.stringify(result,null,2)+'\n',{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e;const existing=JSON.parse(await fs.readFile(archivePath,'utf8'));const withoutTime=x=>JSON.stringify({...x,retrievedAt:null});if(withoutTime(existing)!==withoutTime(result))throw Error('Dated snapshot exists with different content; retain original and review as a revision');result.retrievedAt=existing.retrievedAt}
 await fs.writeFile(path.join(archive,`${date}-states-top500.json`),JSON.stringify(stateResult,null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(ROOT,'frontend/public/billionaire-states.json'),JSON.stringify(stateResult,null,2)+'\n');
 await fs.writeFile(path.join(ROOT,'frontend/public/billionaires-us.json'),JSON.stringify(result,null,2)+'\n');
 console.log(`TOP500_OK ${people.length}; photos ${people.filter(p=>p.photo).length}; USD conversion x1000000; date ${date}`);
}main().catch(e=>{console.error(e);process.exitCode=1});
