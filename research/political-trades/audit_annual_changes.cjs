const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(os.tmpdir(),'annual-change-model-test.cjs');cp.execFileSync(path.join(root,'node_modules/.bin/esbuild'),[path.join(root,'frontend/src/components/annualChangeModel.ts'),'--bundle','--platform=node','--format=cjs','--outfile='+out]);
const {compareEntry,summarizeParty}=require(out);
const report=(year,low,high)=>({year,asOfDate:year+'-12-31',sourceUrl:'https://example.test/annual',filedDate:null,provider:'unit-test-only',holdingsCount:1,verified:true,unvaluedCount:0,totalLow:low,totalHigh:high,totalOpenEnded:false});
const entry=(a,b)=>({member:{id:'fixture',name:'unit test only',party:'Republican',state:'CA',chamber:'house'},previous:report(2024,...a),current:report(2025,...b),issues:[],versions:[]});
let e=entry([100,200],[150,300]);assert.deepEqual(compareEntry(e),{kind:'overlap',low:-50,high:200,issues:[]});
e=entry([100,200],[250,400]);assert.equal(compareEntry(e).kind,'increase');
e=entry([100,200],[20,80]);assert.equal(compareEntry(e).kind,'decrease');
e.current.totalOpenEnded=true;assert.equal(compareEntry(e).kind,'missing');
e=entry([100,200],[250,400]);e.current.unvaluedCount=1;assert.equal(compareEntry(e).kind,'missing');
e=entry([100,200],[250,400]);e.current.year=2026;assert.equal(compareEntry(e).kind,'missing');
const file=path.join(root,'frontend/public/annual-history.json');if(!fs.existsSync(file)){console.log('INTERVAL_UNIT_TESTS_OK; real archive not generated yet');process.exit(0)}
const data=JSON.parse(fs.readFileSync(file));assert.equal(data.previousYear,2024);assert.equal(data.currentYear,2025);assert.equal(new Set(data.entries.map(e=>e.member.id)).size,data.entries.length);
for(const e of data.entries){const c=compareEntry(e);if(c.kind!=='missing'){for(const r of [e.previous,e.current]){assert.match(r.sourceUrl,/^https:\/\/(disclosures-clerk\.house\.gov|efdsearch\.senate\.gov)\//);assert.equal(r.unvaluedCount,0);assert.equal(r.totalOpenEnded,false);assert.match(r.sha256,/^[a-f0-9]{64}$/)}assert.equal(e.current.officialVerified,true);assert.equal(e.previous.year,2024);assert.equal(e.current.year,2025);assert.equal(e.issues.length,0);if(c.kind==='increase')assert.ok(e.current.totalLow>e.previous.totalHigh);if(c.kind==='decrease')assert.ok(e.current.totalHigh<e.previous.totalLow)}}
const summary=['Republican','Democrat'].map(p=>{const s=summarizeParty(data,p);assert.equal(s.covered+s.missing,s.entries.length);assert.equal(s.increase+s.decrease+s.overlap,s.covered);return {party:p,people:s.entries.length,comparable:s.covered,missing:s.missing,increase:s.increase,decrease:s.decrease,overlap:s.overlap,previous:[s.previousLow,s.previousHigh],current:[s.currentLow,s.currentHigh],change:[s.changeLow,s.changeHigh]}});
console.log(JSON.stringify({result:'ANNUAL_CHANGES_AUDIT_OK',people:data.entries.length,summary},null,2));
