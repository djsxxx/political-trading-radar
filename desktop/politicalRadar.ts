import { net } from 'electron'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

export type PricePoint = {date:string;close:number;open?:number;low?:number;high?:number}
export type Quote = {symbol:string;currency:string;price:number;marketTime:string;fetchedAt:string;source:string;points:PricePoint[];splits?:{date:string;ratio:string}[];schemaVersion?:number;stale?:boolean;error?:string}
const SIX_HOURS = 6*60*60*1000
const QUOTE_TTL = 60*1000 // visible stock lists check once per minute
const HF = 'https://huggingface.co/datasets/austin-starks/congressional-stock-trades/resolve/main/'
const hash = (content:Uint8Array|string)=>createHash('sha256').update(content).digest('hex')
const day = (value:unknown)=>value instanceof Date?value.toISOString().slice(0,10):value==null?null:String(value).slice(0,10)
type Row = Record<string, any>

export class PoliticalRadarService {
  private pendingQuotes=new Map<string,Promise<Quote>>()
  private timer:ReturnType<typeof setInterval>|undefined
  private syncing:Promise<Row>|undefined
  private state:Row={lastSuccess:null,lastAttempt:null,error:null,intervalHours:6}
  constructor(private root:string,private initialPath:string){}
  private async prepare(){await mkdir(join(this.root,'archive'),{recursive:true});await mkdir(join(this.root,'quotes'),{recursive:true})}
  private async json(path:string){return JSON.parse(await readFile(path,'utf8'))}
  private async atomic(path:string,value:unknown){const temp=path+'.tmp';await writeFile(temp,JSON.stringify(value));await rename(temp,path)}
  private async fetchBytes(url:string){const res=await net.fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (FinancialAIOS public research)','Accept':'application/json,text/plain,*/*'},signal:AbortSignal.timeout(25000)});if(!res.ok)throw Error(`数据源 HTTP ${res.status}`);return new Uint8Array(await res.arrayBuffer())}
  async data(){await this.prepare();try{return await this.json(join(this.root,'current.json'))}catch{return this.json(this.initialPath)}}
  async status(){return {...this.state,running:!!this.timer,nextCheck:this.state.lastSuccess?new Date(Date.parse(this.state.lastSuccess)+SIX_HOURS).toISOString():null,storage:this.root}}
  async start(){await this.prepare();try{this.state={...this.state,...await this.json(join(this.root,'status.json'))}}catch{};this.timer=setInterval(()=>void this.check(),60*1000);void this.check()}
  stop(){if(this.timer)clearInterval(this.timer)}
  private async check(){if(!this.state.lastAttempt||Date.now()-Date.parse(this.state.lastAttempt)>=SIX_HOURS)await this.sync()}
  sync():Promise<Row>{if(this.syncing)return this.syncing;this.syncing=this.runSync().finally(()=>{this.syncing=undefined});return this.syncing}
  private async runSync(){await this.prepare();this.state.lastAttempt=new Date().toISOString();try{
    const base=await this.data();const bytes=await this.fetchBytes(HF+'snapshot.json');const manifest=JSON.parse(new TextDecoder().decode(bytes));
    if(!manifest.generatedAt||!manifest.tables?.political_trades?.manifests)throw Error('披露清单格式无效')
    await writeFile(join(this.root,'archive',`manifest-${hash(bytes)}.json`),bytes)
    const now=new Date();const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-6,now.getUTCDate()));const startDay=start.toISOString().slice(0,10)
    const manifests=manifest.tables.political_trades.manifests.filter((m:Row)=>m.year>=start.getUTCFullYear())
    const records:Row[]=[]
    for(const item of manifests){for(const file of item.files){const raw=await this.fetchBytes(HF+file.publicPath);if(hash(raw)!==file.sha256)throw Error('披露文件校验失败，保留旧数据');await writeFile(join(this.root,'archive',`${item.year}-${file.sha256}.parquet`),raw);const parsed=await parquetReadObjects({file:raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength) as ArrayBuffer,compressors});for(const r of parsed){const d=day(r.transactionDate);if(!d)continue;records.push({chamber:r.chamber,doc:r.docId,row:r.rowIndex,person:r.memberId||'name:'+r.displayName,name:r.displayName,owner:r.owner,action:r.action,date:d,filed:day(r.filingDate),notified:day(r.notificationDate),ticker:r.resolvedTicker,printedTicker:r.printedTicker,asset:r.assetDescription,amount:r.amountBracket,low:r.amountLow,high:r.amountHigh,instrument:r.assetTypeLabel,status:r.filingStatus,source:r.sourceUrl,lag:r.filingDate?Math.round((Date.parse(day(r.filingDate)!)-Date.parse(d))/86400000):null})}}}
    if(!records.length)throw Error('下载结果为空，保留旧记录')
    // Store every received version before replacing the current working snapshot.
    await this.atomic(join(this.root,'archive',`snapshot-${hash(JSON.stringify(base))}.json`),base)
    await this.atomic(join(this.root,'archive',`records-${hash(JSON.stringify(records))}.json`),records)
    const historical=new Map<string,Row>();for(const t of [...(base.cryptoHistory||[]),...records.filter(t=>/bitcoin|ethereum|crypto|digital currency/i.test(t.asset||''))])historical.set(`${t.chamber}:${t.doc}:${t.row}`,t)
    const people=new Map<string,Row>(base.people.map((p:Row)=>[p.id,p]));for(const t of records)if(!people.has(t.person))people.set(t.person,{id:t.person,name:t.name,party:'Unknown',state:'待核实',district:null,chamber:t.chamber,current:false,photo:''})
    const preservedLate=new Map<string,Row>();for(const t of [...(base.lateHistory||[]),...base.trades,...records])if(t.lag>45)preservedLate.set(`${t.chamber}:${t.doc}:${t.row}`,t)
    const current={...base,people:Array.from(people.values()),trades:records.filter(t=>t.date>=startDay&&t.date<=now.toISOString().slice(0,10)),cryptoHistory:Array.from(historical.values()),lateHistory:Array.from(preservedLate.values()),generated:manifest.generatedAt,start:startDay,end:now.toISOString().slice(0,10),latestTrade:manifest.freshness.latestTransactionDate,latestFiling:Object.values(manifest.freshness.byChamber).map((x:any)=>x.filingDate).sort().at(-1),totalArchive:manifest.totals.trades}
    await this.atomic(join(this.root,'current.json'),current);this.state.lastSuccess=new Date().toISOString();this.state.error=null
  }catch(e){this.state.error=String(e)}await this.atomic(join(this.root,'status.json'),this.state);return this.status()}
  async quote(input:string):Promise<Quote>{const ticker=input.toUpperCase();if(!/^[A-Z0-9^][A-Z0-9.^=\-]{0,24}$/.test(ticker))throw Error('不支持的证券代码');const running=this.pendingQuotes.get(ticker);if(running)return running;const request=this.loadQuote(ticker).finally(()=>this.pendingQuotes.delete(ticker));this.pendingQuotes.set(ticker,request);return request}
  private async loadQuote(ticker:string):Promise<Quote>{
    await this.prepare();const path=join(this.root,'quotes',encodeURIComponent(ticker)+'.json');let cached:Quote|undefined
    try{cached=await this.json(path);if(cached?.schemaVersion===2&&Date.now()-Date.parse(cached.fetchedAt)<QUOTE_TTL)return cached}catch{}
    let message=''
    for(const host of ['query1.finance.yahoo.com','query2.finance.yahoo.com'])try{
      const data=JSON.parse(new TextDecoder().decode(await this.fetchBytes(`https://${host}/v8/finance/chart/${encodeURIComponent(ticker.replace(/\./g,'-'))}?range=1y&interval=1d&events=splits`)))
      const result=data.chart?.result?.[0],bars=result?.indicators?.quote?.[0]
      if(!result?.meta?.regularMarketPrice||!result.timestamp?.length||!bars||!result.meta.currency)throw Error('行情或币种不完整')
      // Remove binary float feed noise without inventing missing prices.
      const price=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?Number(v.toPrecision(7)):undefined
      const points:PricePoint[]=result.timestamp.map((time:number,i:number)=>({date:new Date(time*1000).toISOString().slice(0,10),open:price(bars.open?.[i]),close:price(bars.close?.[i])!,low:price(bars.low?.[i]),high:price(bars.high?.[i])})).filter((p:PricePoint)=>Number.isFinite(p.close)&&p.close>0)
      const splits=Object.values(result.events?.splits||{}).map((s:any)=>({date:new Date(s.date*1000).toISOString().slice(0,10),ratio:s.splitRatio||`${s.numerator}:${s.denominator}`}))
      const quote:Quote={schemaVersion:2,symbol:ticker,currency:result.meta.currency,price:result.meta.regularMarketPrice,marketTime:new Date(result.meta.regularMarketTime*1000).toISOString(),fetchedAt:new Date().toISOString(),source:`https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/history/`,points,splits}
      await this.atomic(path,quote);await this.atomic(join(this.root,'archive',`quote-${ticker}-${hash(JSON.stringify(quote))}.json`),quote);return quote
    }catch(e){message=String(e)}
    if(cached)return {...cached,stale:true,error:message};throw Error(message)
  }
}
