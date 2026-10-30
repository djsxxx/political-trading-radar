const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quote-change-'));
require('esbuild').buildSync({entryPoints:['frontend/src/components/quoteChange.ts'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'quote.cjs')});
const {quoteChange}=require(path.join(dir,'quote.cjs'));
const q={price:110,marketTime:'2026-10-23T20:00:00Z',points:[{date:'2026-10-23',close:110},{date:'2026-10-22',close:100},{date:'2026-10-21',close:90}]};
assert.equal(quoteChange(q).percent,10);assert.equal(quoteChange(q).tone,'quote-up');assert.equal(quoteChange({...q,price:90}).tone,'quote-down');assert.equal(quoteChange({...q,price:100}).tone,'quote-flat');assert.equal(quoteChange({...q,points:[q.points[0]]}),null);assert.equal(quoteChange({...q,price:0}),null);assert.equal(quoteChange({...q,points:[{date:'2026-10-22',close:null}]}),null);
console.log('QUOTE_CHANGE_AUDIT_OK: latest market date versus previous valid daily close, up/down/flat/missing');
