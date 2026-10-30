import type { AnnualData, AnnualEntry, AnnualHolding } from './AnnualAssets'
import { holdingCategory, usableAnnual, normalizeAnnual } from './annualModel'
import { compareEntry, reviewHistory, type AnnualHistory } from './annualChangeModel'
import rawSectors from '../../public/stock-sectors.json'

export const sectorSource=rawSectors
const securities=rawSectors.stocks as Record<string,{name:string;sector:string;industry:string}>
export const sectorZh:Record<string,string>={Technology:'科技',Finance:'金融',Healthcare:'医疗健康','Health Care':'医疗健康',Energy:'能源',Industrials:'工业',Utilities:'公用事业','Consumer Staples':'必需消费','Consumer Discretionary':'可选消费','Real Estate':'房地产',Telecommunications:'通信', 'Basic Materials':'基础材料',Miscellaneous:'其他行业',Unclassified:'待分类'}
export function stockTicker(h:Pick<AnnualHolding,'assetName'|'ticker'>){
 const printed=h.assetName.match(/^([A-Z][A-Z0-9.-]{0,9})\s+-\s+/)?.[1]
 const trailing=h.assetName.match(/\(([A-Z][A-Z0-9.-]{0,9})\)\s*$/)?.[1]
 const t=printed||h.ticker||trailing
 return t&&!['NYSE','NASDAQ','AMEX','US','N/A'].includes(t)&&/^[A-Z][A-Z0-9.-]{0,9}$/.test(t)?t:null
}
export type SharedHolder={entry:AnnualEntry;holdings:AnnualHolding[];low:number;high:number;missing:number;open:boolean}
export type SharedStock={ticker:string;name:string;sector:string;industry:string;holders:SharedHolder[];low:number;high:number;missing:number;open:boolean}
export function sharedAssets(data:AnnualData,party:string,year:string){
 const scoped=data.reports.map(e=>({...e,report:normalizeAnnual(e.report)})).filter(e=>(party==='all'||e.member.party===party)&&e.report.asOfDate?.startsWith(year))
 // One latest report per person, never add multiple versions together.
 const unique=new Map<string,AnnualEntry>()
 for(const e of scoped){const old=unique.get(e.member.id);if(!old||(e.report.filedDate||'')>(old.report.filedDate||''))unique.set(e.member.id,e)}
 const entries=[...unique.values()]
 const usable=entries.filter(e=>usableAnnual(e.report)&&!e.report.partial&&e.report.holdings.length===e.report.holdingsCount)
 const stocks=new Map<string,SharedStock>();let unidentified=0,excluded=0
 for(const entry of usable)for(const h of entry.report.holdings){
  if(holdingCategory(h)!=='STOCKS'||h.includedInTotal===false)continue
  const t=stockTicker(h);if(!t){unidentified++;continue}
  if(/\b(ETF|MUTUAL FUND|NON-PUBLIC|OPTION)\b/i.test(h.assetType+' '+h.assetName)){excluded++;continue}
  const s=stocks.get(t)||{ticker:t,name:securities[t]?.name||h.assetName,sector:securities[t]?.sector||'Unclassified',industry:securities[t]?.industry||'未取得',holders:[],low:0,high:0,missing:0,open:false}
  let holder=s.holders.find(p=>p.entry.member.id===entry.member.id)
  if(!holder){holder={entry,holdings:[],low:0,high:0,missing:0,open:false};s.holders.push(holder)}
  holder.holdings.push(h)
  if(h.valueLow==null||h.valueHigh==null||!Number.isFinite(h.valueLow)||!Number.isFinite(h.valueHigh)){holder.missing++;s.missing++}
  else{holder.low+=h.valueLow;holder.high+=h.valueHigh;s.low+=h.valueLow;s.high+=h.valueHigh;holder.open||=h.valueOpenEnded;s.open||=h.valueOpenEnded}
  stocks.set(t,s)
 }
 const list=[...stocks.values()].sort((a,b)=>b.holders.length-a.holders.length||b.low-a.low||a.ticker.localeCompare(b.ticker))
 const sectors=new Map<string,{name:string;people:Set<string>;stocks:SharedStock[];low:number;high:number;missing:number;open:boolean}>()
 for(const s of list){const g=sectors.get(s.sector)||{name:s.sector,people:new Set<string>(),stocks:[],low:0,high:0,missing:0,open:false};s.holders.forEach(h=>g.people.add(h.entry.member.id));g.stocks.push(s);g.low+=s.low;g.high+=s.high;g.missing+=s.missing;g.open||=s.open;sectors.set(s.sector,g)}
 return {entries,usable,stocks:list,common:list.filter(s=>s.holders.length>=2),sectors:[...sectors.values()].sort((a,b)=>b.low-a.low),unidentified,excluded}
}
export function sharedAnnualChanges(history:AnnualHistory,party:string,annual?:AnnualData){
 const cohort=reviewHistory(history,annual).entries.filter(e=>(party==='all'||e.member.party===party)&&compareEntry(e).kind!=='missing'&&e.previous?.sha256&&e.current?.officialVerified)
 const rows=new Map<string,{ticker:string;previousLow:number;previousHigh:number;currentLow:number;currentHigh:number;previous:Set<string>;current:Set<string>;sources:typeof cohort}>()
 for(const e of cohort)for(const which of ['previous','current'] as const)for(const h of e[which]?.holdings||[]){
  const ticker=stockTicker(h)
  // Historical rows lack instrument types: use only a sourced exchange-listed
  // equity plus exclude explicit funds/debt/options. Ambiguous rows stay out.
  if(!ticker||!securities[ticker]||/\b(ETF|FUND|TRUST|BOND|OPTION|CALL|PUT|NOTE|PREFERRED)\b/i.test(h.assetName)||h.low==null||h.high==null)continue
  const r=rows.get(ticker)||{ticker,previousLow:0,previousHigh:0,currentLow:0,currentHigh:0,previous:new Set<string>(),current:new Set<string>(),sources:[]}
  r[which+'Low' as 'previousLow'|'currentLow']+=h.low;r[which+'High' as 'previousHigh'|'currentHigh']+=h.high;r[which].add(e.member.id)
  if(!r.sources.some(x=>x.member.id===e.member.id))r.sources.push(e)
  rows.set(ticker,r)
 }
 return {cohort,rows:[...rows.values()].map(r=>({...r,common:r.previous.size>=2||r.current.size>=2,low:r.currentLow-r.previousHigh,high:r.currentHigh-r.previousLow})).sort((a,b)=>b.current.size-a.current.size||b.previous.size-a.previous.size)}
}
