import { app } from 'electron'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'
import { PoliticalRadarService } from './politicalRadar'
app.whenReady().then(async()=>{try{
 const root=await mkdtemp(join(tmpdir(),'valuation-market-'))
 const service=new PoliticalRadarService(root,join(process.cwd(),'frontend/public/political-data.json'))
 const quote=await service.quote('DJT')
 assert.equal(quote.currency,'USD');assert.equal(quote.schemaVersion,2)
 assert(quote.points.filter(p=>p.open&&p.low&&p.high).length>50)
 await writeFile(join(process.cwd(),'frontend/public/valuation-quotes.json'),JSON.stringify({quotes:[quote],method:'Yahoo Finance daily OHLC; downloaded by PoliticalRadarService; browser snapshot only'}))
 console.log('REAL_VALUATION_QUOTE_OK',JSON.stringify({symbol:quote.symbol,marketTime:quote.marketTime,points:quote.points.length,first:quote.points[0],last:quote.points.at(-1),splits:quote.splits}))
 app.exit(0)
}catch(e){console.error(e);app.exit(1)}})
