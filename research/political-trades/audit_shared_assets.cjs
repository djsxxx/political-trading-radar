const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shared-assets-audit-'));
require('esbuild').buildSync({entryPoints:['frontend/src/components/sharedAssetModel.ts'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'model.cjs')});
const {sharedAssets,sharedAnnualChanges,stockTicker}=require(path.join(dir,'model.cjs'));
const data=require('../../frontend/public/annual-assets.json'),history=require('../../frontend/public/annual-history.json');
assert.equal(stockTicker({assetName:'LOW - Lowe Company (NYSE)',ticker:'NYSE'}),'LOW');
assert.equal(stockTicker({assetName:'Unidentified (NYSE)',ticker:'NYSE'}),null);
const make=(id,party,owner,low,high)=>({member:{id,party,name:id},report:{available:true,parsed:true,reportLabel:'2025 annual report',asOfDate:'2025-12-31',filedDate:'2026-01-01',holdingsCount:1,unvaluedCount:low==null?1:0,holdings:[{assetName:'AAPL - Apple',ticker:'AAPL',assetType:'Stock',category:'STOCKS',owner,valueLow:low,valueHigh:high,valueOpenEnded:false}]}});
const a=make('a','Republican','self',1,100),b=make('b','Democrat','joint',2,200);
a.report.holdings.push({...a.report.holdings[0],owner:'spouse'});a.report.holdingsCount++;
const sample={reports:[a,b],fetchedAt:''};
assert.equal(sharedAssets(sample,'all','2025').common[0].holders.length,2);
assert.equal(sharedAssets(sample,'all','2025').common[0].low,4);
assert.equal(sharedAssets(sample,'Republican','2025').common.length,0);
assert.equal(sharedAssets(sample,'all','2024').stocks.length,0);
const partial=make('c','Democrat','self',5,50);partial.report.partial=true;
assert.equal(sharedAssets({reports:[partial]},'all','2025').usable.length,0);
const results=[];
for(const party of ['all','Republican','Democrat']){
 const m=sharedAssets(data,party,'2025');const c=sharedAnnualChanges(history,party,data);
 for(const s of m.stocks){assert.equal(s.holders.length,new Set(s.holders.map(h=>h.entry.member.id)).size);assert.equal(s.low,s.holders.reduce((n,h)=>n+h.low,0));assert.equal(s.high,s.holders.reduce((n,h)=>n+h.high,0));if(party!=='all')assert(s.holders.every(h=>h.entry.member.party===party));}
 assert.equal(Math.round(m.sectors.reduce((n,s)=>n+s.low,0)*100),Math.round(m.stocks.reduce((n,s)=>n+s.low,0)*100));
 assert(c.cohort.every(e=>e.previous.sha256&&e.current.sha256&&e.current.officialVerified));
 results.push({party,usable:m.usable.length,common:m.common.length,unidentified:m.unidentified,cohort:c.cohort.length,changes:c.rows.length,top:m.common[0]?.ticker,people:m.common[0]?.holders.length});
}
const exec=require('../../frontend/public/executive-assets.json');
const trump=exec.reports.find(e=>e.member.id==='US-PRESIDENT').report;
assert(trump.partial&&trump.sha256&&trump.holdings.length>6099);assert.equal(trump.holdings.filter(h=>h.sourceSection==='OGE Part 6').length,6099);
assert.equal(trump.totalLow,trump.holdings.filter(h=>h.includedInTotal!==false).reduce((n,h)=>n+(h.valueLow||0),0));
assert.equal(trump.holdings.find(h=>h.sourceId==='OGE Part 2:21').includedInTotal,false);
assert.equal(trump.holdings.find(h=>h.sourceId==='OGE Part 2:21.5').includedInTotal,true);
assert.equal(trump.holdings.find(h=>h.sourceId==='OGE Part 2:124.6').includedInTotal,false);
assert.equal(trump.holdings.find(h=>h.sourceId==='OGE Part 2:21.4a').valueLow,null,'质押收入不得计成资产值');
assert(trump.holdings.some(h=>h.owner==='spouse'&&h.valueLow>0));
const vance=exec.reports.find(e=>e.member.id==='US-VICE-PRESIDENT').report;
assert(vance.partial&&vance.holdings.length>17);
assert.equal(vance.holdings.find(h=>h.category==='CRYPTO').valueLow,250001);
assert.equal(vance.holdings.filter(h=>h.sourceSection==='OGE Part 6').length,17);
assert(vance.holdings.some(h=>h.owner==='spouse'&&h.valueLow===100001));
console.log('SHARED_ASSETS_AUDIT_OK',JSON.stringify(results,null,2));
require('esbuild').buildSync({entryPoints:['frontend/src/components/AnnualAssets.tsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'annual.cjs')});
const {mergeExecutive,annualRange}=require(path.join(dir,'annual.cjs'));
assert(!annualRange(0,0,false).includes('0.0000'));
assert.equal(annualRange(1001,15000,false),'1,001 — 15,000 美元');
assert.equal(annualRange(100000000,100000000,true),'至少 100,000,000 美元');
const merged=mergeExecutive(data);
assert(merged.reports.find(e=>e.member.id==='US-PRESIDENT').report.partial);
for(const id of ['M001184','M001212']){const e=merged.reports.find(e=>e.member.id===id);if(e)assert(e.report);}
assert(merged.reports.length>=data.reports.length);
const pelosi=merged.reports.find(e=>e.member.id==='P000197').report;
assert.equal(pelosi.totalLow,85944060);assert.equal(pelosi.totalHigh,412412000);assert.equal(pelosi.holdings.length,68);
for(const original of data.reports){const next=merged.reports.find(e=>e.member.id===original.member.id);assert(next,'不得隐藏既有人物');if(original.report.parsed&&original.report.holdings.length)assert.equal(next.report.holdings.length,original.report.holdings.length,'不得删除原资产行');}
console.log('SINGLE_YEAR_DISPLAY_AUDIT_OK',merged.reports.length);
