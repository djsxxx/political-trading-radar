import type { ReactNode } from 'react'
import { annualRange, type AnnualEntry } from './AnnualAssets'
import evidence from '../../public/valuation-holdings.json'
type BuyerTrade={person:string;action:string;date:string;low:number|null;high:number|null;asset:string;source:string}
function PartyBadge({value}:{value:string}){
 const label=value==='Republican'?'共和党':value==='Democrat'?'民主党':value==='Independent'?'独立人士':'党派待核实'
 return <span className={`sp-party-badge ${['Republican','Democrat','Independent'].includes(value)?value:'Unknown'}`}>{label}</span>
}
export function StockParticipants({ticker,holders,trades,allowedIds,name,party,portrait,onPerson}:{ticker:string;holders:AnnualEntry[];trades:BuyerTrade[];allowedIds:string[];name:(id:string)=>string;party:(id:string)=>string;portrait:(id:string)=>ReactNode;onPerson:(id:string)=>void}){
 const quantities=evidence.holdings.filter(h=>h.symbol===ticker&&allowedIds.includes(h.personId))
 const holderIds=[...new Set([...holders.map(e=>e.member.id),...quantities.map(h=>h.personId)])]
 const buyers=[...new Set(trades.filter(t=>t.action==='purchase').map(t=>t.person))]
 const buyerHolding=(id:string)=>{
  const q=quantities.find(h=>h.personId===id)
  if(q)return `申报 ${q.quantity.toLocaleString('en-US')}股 · ${q.quantityAsOf}`
  const rows=holders.find(e=>e.member.id===id)?.report.holdings.filter(h=>h.ticker===ticker&&h.includedInTotal!==false&&h.valueLow!=null&&h.valueHigh!=null)
  return rows?.length?`申报 ${annualRange(rows.reduce((s,h)=>s+h.valueLow!,0),rows.reduce((s,h)=>s+h.valueHigh!,0),rows.some(h=>h.valueOpenEnded))} · 股数未披露`:'持仓股数待核实，不能由买入额反推'
 }
 return <section className="stock-participants"><h3>申报持仓 · {holderIds.length}人</h3><p className="pr-explainer">按披露日期展示，不保证今天仍持有；期权不折算成股票股数。</p><div className="sp-grid">{holderIds.map(id=>{
  const entry=holders.find(e=>e.member.id===id),q=quantities.find(h=>h.personId===id),rows=entry?.report.holdings.filter(h=>h.ticker===ticker&&h.includedInTotal!==false)||[]
  const priced=rows.filter(h=>h.valueLow!=null&&h.valueHigh!=null)
  return <button key={id} className={`sp-participant sp-party-${party(id)}`} onClick={()=>onPerson(id)}>{portrait(id)}<span><b className="sp-name-line"><span>{name(id)}</span><PartyBadge value={party(id)}/></b><strong>{q?`${q.quantity.toLocaleString('en-US')}股 · ${q.quantityAsOf}`:priced.length?annualRange(priced.reduce((s,h)=>s+h.valueLow!,0),priced.reduce((s,h)=>s+h.valueHigh!,0),priced.some(h=>h.valueOpenEnded)):'已披露关联资产，金额待核实'}</strong><small>{q?'信托权益 · 固定数量估值依据':'股数未披露'}{!q&&rows.some(h=>h.category==='OPTIONS')?' · 含期权':''} · {entry?.report.asOfDate||'见原件'}</small></span></button>
 })}{!holderIds.length&&<p>尚无可匹配的年度持仓，不能由买入记录推断余额。</p>}</div>
 <h3>近半年买过 · {buyers.length}人</h3><div className="sp-grid">{buyers.map(id=>{const rows=trades.filter(t=>t.person===id&&t.action==='purchase'),missing=rows.some(t=>t.low==null||t.high==null);return <button key={id} className={`sp-participant sp-party-${party(id)}`} onClick={()=>onPerson(id)}>{portrait(id)}<span><b className="sp-name-line"><span>{name(id)}</span><PartyBadge value={party(id)}/></b><strong>{rows.length}笔买入</strong><small>{buyerHolding(id)}</small><small>{missing?'部分金额未列明':annualRange(rows.reduce((s,t)=>s+t.low!,0),rows.reduce((s,t)=>s+t.high!,0),false)} · 交易额，非持仓</small></span></button>})}{!buyers.length&&<p>当前筛选范围内没有已收录的买入披露。</p>}</div></section>
}
