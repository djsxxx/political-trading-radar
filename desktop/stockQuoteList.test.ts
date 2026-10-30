import { app } from 'electron'
import { readFile, writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PoliticalRadarService, type Quote } from './politicalRadar'
app.whenReady().then(async()=>{try{
 const root=await mkdtemp(join(tmpdir(),'stock-list-quotes-'))
 const service=new PoliticalRadarService(root,join(process.cwd(),'frontend/public/political-data.json'))
 const data=JSON.parse(await readFile(join(process.cwd(),'frontend/public/political-data.json'),'utf8'))
 const map=new Map<string,any[]>()
 for(const t of data.trades){const s=t.printedTicker||t.ticker;if(t.status==='Deleted'||!s||/Space Exploration|spacex/i.test(t.asset))continue;map.set(s,[...(map.get(s)||[]),t])}
 const symbols=[...new Set([...map].map(([symbol,trades])=>({symbol,buyers:new Set(trades.filter(t=>t.action==='purchase').map(t=>t.person)).size,count:trades.length})).sort((a,b)=>b.buyers-a.buyers||b.count-a.count).slice(0,40).map(s=>s.symbol).concat(['DJT','BTC-USD','ETH-USD','IBIT']))]
 const quotes:Quote[]=[],errors:{symbol:string;error:string}[]=[];let cursor=0
 await Promise.all(Array.from({length:3},async()=>{while(cursor<symbols.length){const symbol=symbols[cursor++];try{quotes.push(await service.quote(symbol))}catch(e){errors.push({symbol,error:String(e)})}}}))
 await writeFile(join(process.cwd(),'frontend/public/stock-quotes.json'),JSON.stringify({quotes,errors,source:'Yahoo Finance',method:'First visible stocks and crypto examples; downloaded snapshot, not browser live data'}))
 console.log('STOCK_LIST_REAL_QUOTES',JSON.stringify({requested:symbols.length,received:quotes.length,errors,examples:quotes.slice(0,3).map(q=>({symbol:q.symbol,price:q.price,marketTime:q.marketTime}))}))
 app.exit(quotes.length?0:1)
}catch(e){console.error(e);app.exit(1)}})
