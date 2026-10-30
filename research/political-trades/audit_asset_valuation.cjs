const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'valuation-audit-'));
require('esbuild').buildSync({entryPoints:['frontend/src/components/assetValuationModel.ts'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'model.cjs')});
const {valuationCandles}=require(path.join(dir,'model.cjs'));
// Synthetic arithmetic fixtures only. Never used by the shipped UI.
const h={id:'test',symbol:'TEST',quantity:10,quantityAsOf:'2026-06-19',currency:'USD'};
const q={schemaVersion:2,symbol:'TEST',currency:'USD',splits:[],points:[{date:'2026-06-18',open:1,close:2,low:1,high:2},{date:'2026-06-22',open:10,close:12,low:9,high:13},{date:'2026-06-23',open:12,close:11,low:10,high:14}]};
assert.deepEqual(valuationCandles(h,q,'week').candles,[{date:'2026-06-22',end:'2026-06-23',open:100,close:110,low:90,high:140,samples:2}]);
assert.equal(valuationCandles(h,{...q,currency:'EUR'},'day').candles.length,0);
assert.equal(valuationCandles(h,{...q,schemaVersion:1},'day').candles.length,0);
assert.equal(valuationCandles(h,{...q,splits:[{date:'2026-07-01',ratio:'2:1'}]},'day').candles.length,0);
assert.equal(valuationCandles(h,{...q,points:[{date:'2026-06-22',close:10}]},'day').candles.length,0);
assert.equal(valuationCandles(h,{...q,points:[q.points[1],q.points[1]]},'day').candles.length,0);
const registry=JSON.parse(fs.readFileSync('frontend/public/valuation-holdings.json'));
assert.equal(new Set(registry.holdings.map(h=>h.id)).size,registry.holdings.length);
assert.equal(registry.holdings[0].quantity,114750000);
assert(registry.holdings.every(h=>h.sourceUrl.startsWith('https://www.sec.gov/')&&h.currency==='USD'));
console.log('VALUATION_AUDIT_OK: OHLC multiplication, weekly aggregation, cutoff, duplicate/missing bars, currency, split and legacy-cache guards');
