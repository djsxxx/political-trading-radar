import { useMemo, useState } from 'react'
import { normalizeAnnual, usableAnnual } from './annualModel'
import executive from '../../public/executive-assets.json'
import { AnnualHoldingDetails } from './AnnualHoldingDetails'
export type AnnualHolding={assetName:string;account:string|null;ticker:string|null;assetType:string;category:string;categoryLabel:string;owner:string;valueText:string;valueLow:number|null;valueHigh:number|null;valueOpenEnded:boolean;sourceId?:string;sourceSection?:string;sourcePage?:number;sourceRow?:string;parentId?:string|null;ownershipText?:string;disclosureNote?:string;valuationScope?:string;includedInTotal?:boolean;exclusionReason?:string|null}
export type AnnualCategory={category:string;label:string;count:number;unvaluedCount:number;valueLow:number;valueHigh:number;openEnded:boolean;excludedCount?:number}
export type AnnualReport={available:boolean;parsed:boolean;reportLabel:string|null;asOfDate:string|null;filedDate:string|null;sourceUrl:string|null;holdingsCount:number;unvaluedCount:number;totalLow:number;totalHigh:number;totalOpenEnded:boolean;categories:AnnualCategory[];holdings:AnnualHolding[];total:number;totalPages:number;laterFilingLabel:string|null;laterFilingUrl:string|null;unreadableReason:string|null;allHoldingsLoaded?:boolean;partial?:boolean;coverageNote?:string;sha256?:string;excludedCount?:number;aggregationNote?:string;normalizationApplied?:boolean}
export type AnnualEntry={member:{id:string;slug:string;name:string;party:string;state:string;chamber:string;identity:string};report:AnnualReport}
export type AnnualData={provider:string;providerUrl:string;license:string;fetchedAt:string;reports:AnnualEntry[];errors:{member:{id:string};error:string}[];rosterCount:number}
const names:Record<string,string>={STOCKS:'股票',CRYPTO:'直接加密货币',CRYPTO_FUNDS:'加密ETF / 信托',FUNDS:'ETF / 基金',BONDS:'债券',CASH:'现金与存款',REAL_ESTATE:'房地产',BUSINESS:'私人企业',RETIREMENT:'退休与养老金',OPTIONS:'期权',OTHER:'其他资产',UNCLASSIFIED:'待核实资产类别'}
const yi=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:2})
export const annualRange=(low:number,high:number,open:boolean)=>!low&&!high?'该披露范围无可计价金额（非总资产为零）':open?`至少 ${yi(low)} 美元`:`${yi(low)} — ${yi(high)} 美元`
export function mergeExecutive(data:AnnualData):AnnualData{const additions=(executive.reports as AnnualEntry[]).filter(x=>{const old=data.reports.find(e=>e.member.id===x.member.id);return !old||!usableAnnual(old.report)});return {...data,reports:[...data.reports.filter(e=>!additions.some(x=>x.member.id===e.member.id)),...additions].map(e=>({...e,report:normalizeAnnual(e.report)}))}}
export function annualEntry(data:AnnualData|null,id:string){return data?.reports.find(r=>r.member.id===id)||executive.reports.find(e=>e.member.id===id) as AnnualEntry|undefined}
export function AnnualAssets({data,person,party,allowedIds,peopleCount,onPerson,onStock}:{data:AnnualData|null;person?:string|null;party:string;allowedIds?:string[];peopleCount:number;onPerson?:(id:string)=>void;onStock?:(ticker:string)=>void}){
 const [category,setCategory]=useState('all')
 const [page,setPage]=useState(0)
 const entries=useMemo(()=>data?mergeExecutive(data).reports.filter(e=>(!person||e.member.id===person)&&(!allowedIds||allowedIds.includes(e.member.id))&&(person||party==='all'||e.member.party===party)).map(e=>({...e,report:normalizeAnnual(e.report)})):[],[data,person,party,allowedIds])
 const valid=entries.filter(e=>usableAnnual(e.report))
 const covered=valid.length
 const low=valid.reduce((s,e)=>s+e.report.totalLow,0),high=valid.reduce((s,e)=>s+e.report.totalHigh,0)
 const open=valid.some(e=>e.report.totalOpenEnded)
 const unvalued=valid.reduce((s,e)=>s+e.report.unvaluedCount,0)
 const groups=new Map<string,{low:number;high:number;count:number;open:boolean;missing:number;excluded:number}>()
 for(const entry of valid)for(const c of entry.report.categories){const g=groups.get(c.category)||{low:0,high:0,count:0,open:false,missing:0,excluded:0};g.low+=c.valueLow;g.high+=c.valueHigh;g.count+=c.count;g.missing+=c.unvaluedCount;g.excluded+=c.excludedCount||0;g.open||=c.openEnded;groups.set(c.category,g)}
 // Always show stock and crypto explicitly, including known-zero for a covered report.
 for(const key of ['STOCKS','CRYPTO'])if(!groups.has(key))groups.set(key,{low:0,high:0,count:0,open:false,missing:0,excluded:0})
 const selected=person?entries[0]:undefined
 
 const stock=groups.get('STOCKS')!,crypto=groups.get('CRYPTO')!
 const missing=person?1-covered:Math.max(0,peopleCount-covered)
 const asOfDates=valid.map(e=>e.report.asOfDate).filter(Boolean).sort()
 const report=selected?.report
 if(!data)return <section className="pr-annual pr-empty">年度资产数据正在读取。</section>
 return <section className="pr-annual"><div className="pr-annual-heading"><div><small>ANNUAL DISCLOSURE / 年度资产申报</small><h2>{selected?selected.member.name+' · 披露资产':'年度披露资产总区间'}</h2><p>{report?.partial?'仅展示已解析的申报范围 · 其他部分待核验 · 非实时估值':'未扣负债 · 含申报范围内本人、配偶与子女资产 · 非实时估值'}</p></div><a href={report?.sourceUrl||data.providerUrl+'/developers'} target="_blank" rel="noreferrer">{report?.sourceUrl?'官方申报原件':'Civitas Research'} ↗</a></div>
 {covered?<>{valid.some(e=>e.report.partial)&&<p className="pr-price-error">部分解析：{report?.coverageNote||'包含仅取得部分资产明细的人物，合计不是完整总资产。'} 股票、加密货币未列出不表示没有；未核实部分不按零补齐。</p>}<div className="pr-annual-total"><div><span>{person?report?.partial?'已核实资产小计（非完整总资产）':report?.excludedCount?'可核资产小计（未计价/待核项目另列）':'本年度申报合计':'已收录资产区间合计（含部分解析）'}</span><strong>{annualRange(low,high,open)}</strong><small>{person?`${report?.reportLabel||'年度报告'} · 资产截止 ${report?.asOfDate||'未注明'} · 提交 ${report?.filedDate||'未注明'}`:`采用每人最近已收录年报 · 截止日期 ${asOfDates[0]} 至 ${asOfDates.at(-1)}`}</small></div><div><span>股票</span><b>{stock.count?annualRange(stock.low,stock.high,stock.open):report?.partial?'类别待核实':'报告未列示'}</b><small>{report?.partial?'不按零判断':`${stock.count} 项`}</small></div><div><span>直接加密货币</span><b>{crypto.count?crypto.missing===crypto.count?'价值未列明':annualRange(crypto.low,crypto.high,crypto.open):report?.partial?'尚未覆盖相关附表':'报告未列示'}</b><small>{crypto.count?`${crypto.count} 项已披露`:'不代表绝对没有持币'}</small></div></div>
 <p className="pr-annual-coverage">覆盖 {covered} / {person?1:peopleCount} 人 · {missing} 人缺少可用年报，未按零计入{unvalued?` · ${unvalued} 项未列明价值，合计仅含可计价部分`:''}{open?' · 存在无上限档，展示已披露最低合计，不设置虚假上限':''}</p>
 {report?.aggregationNote&&<p className="pr-price-error">{report.aggregationNote}</p>}
 {report?.laterFilingLabel&&<p className="pr-price-error">另有较新的文件：<a href={report.laterFilingUrl||'#'} target="_blank" rel="noreferrer">{report.laterFilingLabel}</a>；当前展示最近可解析的年报。</p>}
 <div className="pr-annual-categories">{Array.from(groups.entries()).filter(([,g])=>!report?.partial||g.count>0).sort((a,b)=>b[1].low-a[1].low).map(([key,g])=><button key={key} onClick={()=>{setCategory(category===key?'all':key);setPage(0)}} className={category===key?'chosen':''}><div><b>{names[key]||key}</b><small>{g.count} 项</small></div><strong>{!g.count?'报告未列示':g.excluded===g.count?'未纳入小计（查看逐项原因）':g.missing===g.count?'价值未列明':annualRange(g.low,g.high,g.open)}</strong><div className="pr-structure-track"><i style={{width:`${low?g.low/low*100:0}%`}}/></div><small>金额下限占比 {low?(g.low/low*100).toFixed(1):'0.0'}%{g.missing?` · ${g.missing}项未标价`:''}</small></button>)}</div>
 {person&&report&&<AnnualHoldingDetails report={report} category={category} onCategory={setCategory} onStock={onStock}/>}
 {!person&&onPerson&&<details><summary>逐人查看已覆盖年度资产（{covered}人）</summary><div className="pr-annual-people">{valid.sort((a,b)=>b.report.totalLow-a.report.totalLow).map(e=><button key={e.member.id} onClick={()=>onPerson(e.member.id)}><b>{e.member.name}</b><span>{e.report.reportLabel}</span><small>{annualRange(e.report.totalLow,e.report.totalHigh,e.report.totalOpenEnded)}</small></button>)}</div></details>}
 </>:<div className="pr-empty">{report?.unreadableReason==='scanned'?'最新年报为扫描件，尚无可靠资产解析，未填成零。':report?.reportLabel&&!/annual report/i.test(report.reportLabel)?`已知文件为 ${report.reportLabel}，不计入年度资产合计。`:selected?.report.unreadableReason||'尚无可用年度资产申报，未填成零。'}{report?.sourceUrl&&<p><a href={report.sourceUrl} target="_blank" rel="noreferrer">查看已知官方文件 ↗</a></p>}</div>}
 {person&&report?.sourceUrl&&<a href={report.sourceUrl} target="_blank" rel="noreferrer">官方年度申报原件 ↗</a>}
 {!covered&&person&&report&&report.holdings.length>0&&<AnnualHoldingDetails report={report} category={category} onCategory={setCategory} onStock={onStock}/>}
 <p className="pr-explainer">资产区间来自年度申报，可能有豁免资产及未标价项。未扣负债，不等于净资产；类别占比按金额下限计算。直接加密货币与加密ETF在原申报分类下区分。数据：{report?.sourceUrl?.includes('oge.')?'US OGE 官方年报（部分解析）':'Civitas Research（CC BY 4.0）/ 官方历史原件'} · 采集 {new Date(report?.sourceUrl?.includes('oge.')?executive.fetchedAt:data.fetchedAt).toLocaleDateString('zh-CN')}</p></section>
}
