import { app } from 'electron'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { PoliticalRadarService } from './politicalRadar'

app.whenReady().then(async()=>{
 try{
  const root=await mkdtemp(join(tmpdir(),'radar-integration-'))
  const project=process.cwd()
  const service=new PoliticalRadarService(root,join(project,'frontend/public/political-data.json'))
  const quote=await service.quote('MSFT')
  assert.ok(quote.points.length>100&&quote.price>0)
  console.log('REAL_QUOTE',JSON.stringify({symbol:quote.symbol,price:quote.price,marketTime:quote.marketTime,points:quote.points.length}))
  const cached=await service.quote('MSFT');assert.equal(cached.fetchedAt,quote.fetchedAt)
  console.log('QUOTE_CACHE_OK')
  const liveSync=await service.sync()
  console.log('LIVE_DISCLOSURE_SYNC',JSON.stringify(liveSync))
  assert.equal(liveSync.error,null)
  const manifest=JSON.parse(await readFile(join(project,'research/political-trades/raw/snapshot.json'),'utf8'))
  ;(service as any).fetchBytes=async(url:string)=>{
    if(url.endsWith('snapshot.json'))return new TextEncoder().encode(JSON.stringify(manifest))
    const year=url.match(/(\d{4})-00000/)! [1]
    return new Uint8Array(await readFile(join(project,`research/political-trades/raw/${year}.parquet`)))
  }
  const result=await service.sync();assert.equal(result.error,null)
  const updated=await service.data();assert.ok(updated.trades.length>1000);assert.ok(updated.cryptoHistory.length>0);assert.ok(updated.lateHistory.length>0)
  const archiveBefore=(await readdir(join(root,'archive'))).length
  ;(service as any).fetchBytes=async()=>{throw Error('TEST_OFFLINE')}
  const offline=await service.sync();assert.match(offline.error,/TEST_OFFLINE/)
  const preserved=await service.data();assert.equal(preserved.generated,updated.generated);assert.equal((await readdir(join(root,'archive'))).length,archiveBefore)
  await writeFile(join(root,'quotes/MSFT.json'),JSON.stringify({...quote,fetchedAt:'2026-01-01T00:00:00Z'}))
  const stale=await service.quote('MSFT');assert.equal(stale.stale,true);assert.equal(stale.price,quote.price)
  await assert.rejects(()=>service.quote('../INVALID'))
  console.log('STALE_PRICE_FALLBACK_AND_INPUT_VALIDATION_OK')
  console.log('SYNC_CHECKSUM_ARCHIVE_OFFLINE_OK',JSON.stringify({rows:updated.trades.length,crypto:updated.cryptoHistory.length,late:updated.lateHistory.length,archive:archiveBefore,root}))
  app.exit(0)
 }catch(e){console.error(e);app.exit(1)}
})
