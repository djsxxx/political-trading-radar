import { net } from 'electron'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
type Row=Record<string,any>
const DAY=24*60*60*1000
export class AnnualAssetsService {
 private timer:ReturnType<typeof setInterval>|undefined
 private pending:Promise<void>|undefined
 private stopped=false
 private state:Row={running:false,done:0,total:0,lastSuccess:null,error:null,intervalHours:24}
 constructor(private root:string,private initialPath:string){}
 private async prepare(){await mkdir(join(this.root,'annual-archive'),{recursive:true})}
 private async atomic(path:string,value:unknown){const temp=path+'.annual.tmp';await writeFile(temp,JSON.stringify(value));await rename(temp,path)}
 async data(){await this.prepare();try{return JSON.parse(await readFile(join(this.root,'annual-current.json'),'utf8'))}catch{return JSON.parse(await readFile(this.initialPath,'utf8'))}}
 async status(){return {...this.state}}
 async start(){this.stopped=false;await this.prepare();const base=await this.data();const digest=createHash('sha256').update(JSON.stringify(base)).digest('hex');await this.atomic(join(this.root,'annual-archive',`snapshot-${digest}.json`),base);this.timer=setInterval(()=>void this.check(),60*60*1000);void this.check()}
 stop(){this.stopped=true;if(this.timer)clearInterval(this.timer)}
 private async check(){const data=await this.data();if(Date.now()-Date.parse(data.fetchedAt)>=DAY&&!this.pending)await this.refresh()}
 async refresh(){if(this.pending)return this.status();this.state.running=true;this.pending=this.run().finally(()=>{this.pending=undefined});return this.status()}
 private async request(url:string){const result=await net.fetch(url,{headers:{'User-Agent':'Financial-AI-OS personal research (Civitas attribution retained)'},signal:AbortSignal.timeout(35000)});if(!result.ok)throw Error(`年度资产源 HTTP ${result.status}`);const data=await result.json();return data as Row}
 private async run(){await this.prepare();this.state={...this.state,running:true,done:0,error:null};try{
  const base=await this.data();const reports:Row[]=[...base.reports];this.state.total=reports.length
  const digest=createHash('sha256').update(JSON.stringify(base)).digest('hex');await this.atomic(join(this.root,'annual-archive',`snapshot-${digest}.json`),base)
  const errors:Row[]=[]
  for(let i=0;i<reports.length&&!this.stopped;i++){
   const entry=reports[i],member=entry.member;const endpoint=member.chamber==='senate'?'senators':'representatives'
   try{
    const report=await this.request(`https://civitas-research.org/api/${endpoint}/${encodeURIComponent(member.slug)}/holdings?per_page=100`)
    if(typeof report.available!=='boolean'||!Array.isArray(report.holdings)||!Array.isArray(report.categories))throw Error('年度数据格式校验失败')
    for(let page=2;page<=(report.totalPages||1)&&!this.stopped;page++){
     await new Promise(resolve=>setTimeout(resolve,1300))
     const part=await this.request(`https://civitas-research.org/api/${endpoint}/${encodeURIComponent(member.slug)}/holdings?per_page=100&page=${page}`)
     if(part.sourceUrl!==report.sourceUrl||part.holdingsCount!==report.holdingsCount)throw Error('年度报告在分页期间变化，保留前版本')
     report.holdings.push(...part.holdings)
    }
    report.allHoldingsLoaded=report.holdings.length===report.holdingsCount
    if(report.parsed){
     if(!Number.isFinite(report.totalLow)||!Number.isFinite(report.totalHigh)||report.totalLow<0||report.totalHigh<report.totalLow)throw Error('年度总区间无效，保留前版本')
     const sum=(items:Row[],key:string)=>Math.round(items.reduce((s,h)=>s+(h[key]??0),0)*100)
     if(sum(report.categories,'valueLow')!==Math.round(report.totalLow*100)||sum(report.categories,'valueHigh')!==Math.round(report.totalHigh*100))throw Error('年度分类合计与总区间不符，保留前版本')
     if(report.allHoldingsLoaded&&(sum(report.holdings,'valueLow')!==Math.round(report.totalLow*100)||sum(report.holdings,'valueHigh')!==Math.round(report.totalHigh*100)))throw Error('年度明细合计与总区间不符，保留前版本')
    }
    const payload={member,report};const hash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');await this.atomic(join(this.root,'annual-archive',`${member.id}-${hash}.json`),payload)
    if(entry.report.available&&entry.report.parsed&&(!report.available||!report.parsed)){
     errors.push({member,error:'新报告暂无可用解析，保留已解析年报'});reports[i]={...entry,report:{...entry.report,laterFilingLabel:report.reportLabel||'新版本未解析',laterFilingUrl:report.sourceUrl||entry.report.sourceUrl}}
    }else reports[i]=payload
   }catch(e){errors.push({member,error:String(e)})}
   this.state.done=i+1
   if((i+1)%10===0||i===reports.length-1)await this.atomic(join(this.root,'annual-current.json'),{...base,reports,errors,checkedAt:new Date().toISOString(),fetchedAt:errors.length?base.fetchedAt:new Date().toISOString()})
   await new Promise(resolve=>setTimeout(resolve,1300))
  }
  this.state.error=errors.length?`${errors.length}人更新失败；保留其旧数据`:null;this.state.lastSuccess=new Date().toISOString()
 }catch(e){this.state.error=String(e)}finally{this.state.running=false;await this.atomic(join(this.root,'annual-status.json'),this.state)}}
}
