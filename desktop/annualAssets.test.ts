import { app } from 'electron'
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import { AnnualAssetsService } from './annualAssets'

app.whenReady().then(async()=>{
 try{
  const root=await mkdtemp(join(tmpdir(),'radar-annual-test-'))
  const source=JSON.parse(await readFile(join(process.cwd(),'frontend/public/annual-assets.json'),'utf8'))
  const reports=source.reports.filter((e:any)=>['C001098','P000197'].includes(e.member.id))
  assert.equal(reports.length,2)
  const fixture=join(root,'initial.json');await writeFile(fixture,JSON.stringify({...source,reports}))
  const service=new AnnualAssetsService(root,fixture)
  await service.refresh();while((await service.status()).running)await new Promise(r=>setTimeout(r,20))
  assert.equal((await service.status()).error,null)
  console.log('ANNUAL_LIVE_API_TWO_CHAMBERS_OK')
  ;(service as any).request=async(url:string)=>JSON.parse(JSON.stringify(reports.find((e:any)=>url.includes(e.member.slug)).report))
  await service.refresh();while((await service.status()).running)await new Promise(r=>setTimeout(r,20))
  assert.equal((await service.status()).error,null)
  const current=await service.data();assert.equal(current.reports.length,2)
  const before=current.reports.map((e:any)=>e.report.totalLow)
  const oldArchives=await readdir(join(root,'annual-archive'));assert.ok(oldArchives.length>=3)
  ;(service as any).request=async(url:string)=>{const report=JSON.parse(JSON.stringify(reports.find((e:any)=>url.includes(e.member.slug)).report));report.totalLow+=1;return report}
  await service.refresh();while((await service.status()).running)await new Promise(r=>setTimeout(r,20))
  assert.match((await service.status()).error,/2人更新失败/)
  const kept=await service.data();assert.deepEqual(kept.reports.map((e:any)=>e.report.totalLow),before)
  assert.ok((await readdir(join(root,'annual-archive'))).length>=oldArchives.length)
  console.log('ANNUAL_ARCHIVE_VALIDATION_AND_OLD_DATA_RETENTION_OK',JSON.stringify({reports:2,root}))
  app.exit(0)
 }catch(error){console.error(error);app.exit(1)}
})
