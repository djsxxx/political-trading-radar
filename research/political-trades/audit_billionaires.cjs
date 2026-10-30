const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../..'),d=JSON.parse(fs.readFileSync(path.join(root,'frontend/public/billionaires-us.json'),'utf8'));
assert.equal(d.schemaVersion,1);assert.equal(d.unit,'USD');assert.equal(d.inputUnit,'million USD');assert.equal(d.people.length,500);assert.equal(new Set(d.people.map(p=>p.id)).size,500);
d.people.forEach((p,i)=>{assert.equal(p.rank,i+1);assert.ok(Number.isSafeInteger(p.worthUsd)&&p.worthUsd>0);assert.ok(p.profileSource.startsWith('https://www.forbes.com/profile/'));assert.ok(!('residence'in p));assert.ok(!('party'in p));if(i)assert.ok(d.people[i-1].worthUsd>=p.worthUsd)});
const archive=JSON.parse(fs.readFileSync(path.join(root,'research/political-trades/billionaire-snapshots',d.date+'-top500.json'),'utf8'));assert.deepEqual(archive,d);
console.log(`BILLIONAIRES_AUDIT_OK: ${d.people.length} unique US entries; descending USD estimates; immutable dated snapshot; no guessed affiliations or residential coordinates`);
