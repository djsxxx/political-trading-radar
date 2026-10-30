export type HistoricalReport={year:number;asOfDate:string;sourceUrl:string;filedDate:string|null;docId?:string;sha256?:string;officialVerified?:boolean;provider:string;holdingsCount:number;verified:boolean;unvaluedCount:number;totalLow?:number;totalHigh?:number;totalOpenEnded?:boolean;issues?:string[];holdings?:{assetName:string;owner:string;ticker:string|null;low:number|null;high:number|null}[]}
export type ChangeEntry={member:{id:string;name:string;party:string;state:string;chamber:string};previous:HistoricalReport|null;current:HistoricalReport|null;issues:string[];versions:HistoricalReport[];pendingVersions?:{docId:string;filedDate:string|null;sourceUrl:string;status:string}[]}
export type AnnualHistory={previousYear:number;currentYear:number;partyAsOf:string;generatedAt:string;method:string;sources:{name:string;url:string;license:string}[];entries:ChangeEntry[]}
export function reviewHistory(history:AnnualHistory,annual?:AnnualData|null):AnnualHistory{
 if(!annual)return history
 const byId=new Map(annual.reports.map(e=>[e.member.id,e.report]))
 return {...history,entries:history.entries.map(e=>{const r=byId.get(e.member.id);if(!r||r.sourceUrl!==e.current?.sourceUrl)return e;const disputed=normalizeAnnual(r).holdings.some(h=>h.includedInTotal===false&&h.valueLow!=null&&h.valueHigh!=null);return disputed?{...e,issues:[...new Set([...e.issues,'当前同一原件存在金额重叠/重复候选待核，暂不计算年度变化'])]}:e})}
}
export type Change={kind:'increase'|'decrease'|'overlap'|'missing';low:number|null;high:number|null;issues:string[]}
export function compareEntry(e:ChangeEntry):Change{
 const issues=[...e.issues]
 for(const [label,r] of [['上年',e.previous],['本年',e.current]] as const){
  if(!r){issues.push(label+'报告缺失');continue}
  if(!r.verified)issues.push(label+'未通过原件/数据核验')
  if(r.unvaluedCount)issues.push(label+'包含未标价资产')
  if(r.totalOpenEnded)issues.push(label+'包含无上限档')
  if(!Number.isFinite(r.totalLow)||!Number.isFinite(r.totalHigh)||(r.totalLow??0)<0||(r.totalHigh??0)<(r.totalLow??0))issues.push(label+'总额不完整')
 }
 if(e.previous&&e.current&&e.current.year-e.previous.year!==1)issues.push('不是连续年度')
 if(issues.length)return {kind:'missing',low:null,high:null,issues:[...new Set(issues)]}
 const low=Math.round((e.current!.totalLow!-e.previous!.totalHigh!)*100)/100,high=Math.round((e.current!.totalHigh!-e.previous!.totalLow!)*100)/100
 return {kind:low>0?'increase':high<0?'decrease':'overlap',low,high,issues:[]}
}
export function summarizeParty(data:AnnualHistory,party:string){
 const entries=data.entries.filter(e=>e.member.party===party),valid=entries.filter(e=>compareEntry(e).kind!=='missing')
 const sum=(which:'previous'|'current',key:'totalLow'|'totalHigh')=>Math.round(valid.reduce((s,e)=>s+e[which]![key]!,0)*100)/100
 const previousLow=sum('previous','totalLow'),previousHigh=sum('previous','totalHigh'),currentLow=sum('current','totalLow'),currentHigh=sum('current','totalHigh')
 return {entries,valid,covered:valid.length,missing:entries.length-valid.length,previousLow,previousHigh,currentLow,currentHigh,changeLow:Math.round((currentLow-previousHigh)*100)/100,changeHigh:Math.round((currentHigh-previousLow)*100)/100,increase:valid.filter(e=>compareEntry(e).kind==='increase').length,decrease:valid.filter(e=>compareEntry(e).kind==='decrease').length,overlap:valid.filter(e=>compareEntry(e).kind==='overlap').length}
}
import type { AnnualData } from './AnnualAssets'
import { normalizeAnnual } from './annualModel'
