const fs=require('node:fs')
const assert=require('node:assert/strict')
const cp=require('node:child_process')
const path=require('node:path')
const os=require('node:os')
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../../frontend/public/annual-assets.json')))
const outfile=path.join(os.tmpdir(),'radar-annual-model-audit.cjs')
cp.execFileSync(path.join(__dirname,'../../node_modules/.bin/esbuild'),[path.join(__dirname,'../../frontend/src/components/annualModel.ts'),'--bundle','--platform=node','--format=cjs','--outfile='+outfile])
const {normalizeAnnual,usableAnnual,holdingCategory}=require(outfile)
const cents=value=>Math.round(value*100)
assert.equal(holdingCategory({assetType:'OP',assetName:'Alphabet call',category:'STOCKS'}),'OPTIONS')
assert.equal(holdingCategory({assetType:'ETF',assetName:'iShares Bitcoin Trust',ticker:'IBIT',category:'FUNDS'}),'CRYPTO_FUNDS')
assert.equal(holdingCategory({assetType:'Cryptocurrency',assetName:'Bitcoin',category:'CRYPTO'}),'CRYPTO')
const ids=new Set();let complete=0,partial=0,covered=0,missing=0,open=0
for(const {member,report:raw}of data.reports){
 assert.ok(!ids.has(member.id),'Duplicate person '+member.id);ids.add(member.id)
 if(raw.sourceUrl)assert.ok(/^https:\/\/(disclosures-clerk\.house\.gov|efdsearch\.senate\.gov)\//.test(raw.sourceUrl))
 const r=normalizeAnnual(raw)
 if(!usableAnnual(r)){missing++;continue}
 covered++
 assert.ok(r.totalLow>=0&&r.totalHigh>=r.totalLow)
 if(r.totalOpenEnded)open++
 if(r.holdings.length!==r.holdingsCount){partial++;continue}
 const included=r.holdings.filter(h=>h.includedInTotal!==false)
 assert.equal(cents(included.reduce((sum,h)=>sum+(h.valueLow??0),0)),cents(r.totalLow),member.name+' lower sum')
 assert.equal(cents(included.reduce((sum,h)=>sum+(h.valueHigh??0),0)),cents(r.totalHigh),member.name+' upper sum')
 assert.equal(cents(r.categories.reduce((sum,c)=>sum+c.valueLow,0)),cents(r.totalLow),member.name+' categories lower')
 assert.equal(cents(r.categories.reduce((sum,c)=>sum+c.valueHigh,0)),cents(r.totalHigh),member.name+' categories upper')
 complete++
}
const parties={}
for(const party of ['Republican','Democrat','Independent']){
 const rs=data.reports.filter(e=>e.member.party===party&&usableAnnual(e.report))
 parties[party]={covered:rs.length,low:rs.reduce((s,e)=>s+e.report.totalLow,0),high:rs.reduce((s,e)=>s+e.report.totalHigh,0),open:rs.some(e=>e.report.totalOpenEnded)}
}
assert.ok(!usableAnnual({available:false,parsed:false}))
assert.ok(!usableAnnual({available:true,parsed:true,reportLabel:'new-filer report',holdingsCount:1,unvaluedCount:0}))
console.log(JSON.stringify({reports:data.reports.length,covered,missing,complete,partial,open,parties,errors:data.errors.length},null,2))
