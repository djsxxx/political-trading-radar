import { useState } from 'react'
import { annualEntry, annualRange, type AnnualData, type AnnualReport } from './AnnualAssets'
import { usableAnnual } from './annualModel'
import { personLabel } from './PoliticalAtlas'
import type { AtlasPerson } from './politicalAtlasModel'
import './personal-asset-summary.css'
import { AssetValuation } from './AssetValuation'

export function assetStatus(r?:AnnualReport){
 if(!r)return '资料待补'
 if(!r.parsed)return r.unreadableReason==='scanned'?'原件为扫描件，金额待解析':'已知原件，金额待核实'
 if(!/annual report/i.test(r.reportLabel||''))return '已取得非年度文件'
 if(r.partial)return '部分资产已核实'
 if(!r.holdingsCount)return '年报未列示可计价资产'
 if(r.unvaluedCount>=r.holdingsCount)return '资产已列示，价值未列明'
 if(r.excludedCount&&r.totalLow===0&&r.totalHigh===0)return '资产已列示，金额重叠待核'
 return '单年资产可查看'
}
export function assetAmount(r?:AnnualReport){
 if(!r||!usableAnnual(r))return assetStatus(r)
 if(r.excludedCount&&r.totalLow===0&&r.totalHigh===0)return '已披露资产，汇总金额待核实'
 return annualRange(r.totalLow,r.totalHigh,r.totalOpenEnded)
}
export function PersonalAssetSummary({data,id,onDetails}:{data:AnnualData|null;id:string;onDetails?:()=>void}){
 const r=annualEntry(data,id)?.report
 return <section className="personal-asset-summary" aria-label="人物资产摘要"><div><small>{r?.partial?'可核实资产小计 · 非完整身家':'年度披露资产 · 非实时净资产'}</small><strong>{assetAmount(r)}</strong><span>{r?.reportLabel||'尚未匹配年度申报'} · 资产截止 {r?.asOfDate||'待核实'}</span></div><p>包含原申报列示的本人、配偶及共同资产；未扣负债。{r?.unvaluedCount?`${r.unvaluedCount}项价值未列明，未当作零。`:''}{r?.excludedCount?`${r.excludedCount}项未标价、父级、引用或重叠候选未累加，仍保留逐项金额。`:''}</p><AssetValuation key={id} id={id} report={r}/><div>{onDetails&&<button onClick={onDetails}>查看资产明细</button>}{r?.sourceUrl&&<a href={r.sourceUrl} target="_blank" rel="noreferrer">年度申报原件 ↗</a>}</div></section>
}
export function AssetCoverage({data,people,onPerson}:{data:AnnualData|null;people:AtlasPerson[];onPerson:(id:string)=>void}){
 const [filter,setFilter]=useState('all')
 if(!data)return null
 const rows=people.map(p=>({p,r:annualEntry(data,p.id)?.report}))
 const known=rows.filter(e=>e.r?.parsed&&/annual report/i.test(e.r.reportLabel||'')&&e.r.holdingsCount>0)
 const pending=rows.filter(e=>!e.r?.parsed||!/annual report/i.test(e.r.reportLabel||''))
 return <details className="asset-coverage"><summary>资产资料核对 · 当前人物{rows.length}人 · 已有年度资产明细{known.length}人 · 待解析/待补{pending.length}人 · 查看逐人状态</summary><p>这里检查单年资产，不受两年可比队列限制。“空资产表”“未标价”“扫描件”分别标注，不解释成个人没有资产。</p><select aria-label="资产资料状态" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">所有人物</option><option value="pending">待补资料 / 待解析</option><option value="known">已有年度明细</option></select><div className="pr-table-wrap"><table><thead><tr><th>人物</th><th>申报资产 / 状态</th><th>报告与原件</th></tr></thead><tbody>{rows.filter(e=>filter==='all'||(filter==='known'?known:pending).includes(e)).map(({p,r})=><tr key={p.id}><td><button onClick={()=>onPerson(p.id)}>{personLabel(p)}</button></td><td>{assetAmount(r)}<small>{assetStatus(r)}</small></td><td>{r?.reportLabel||'年度文件待匹配'}<br/>{r?.sourceUrl?<a href={r.sourceUrl} target="_blank" rel="noreferrer">查看已取得原件 ↗</a>:'未取得可核实原件，不填零'}</td></tr>)}</tbody></table></div></details>
}
