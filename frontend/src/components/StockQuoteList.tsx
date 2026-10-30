import { useEffect, useState } from 'react'
import { companyZh } from './politicalAtlasModel'
import { quoteChange, publicPriceAllowed } from './quoteChange'
import { useLiveQuotes } from './useLiveQuotes'
import './stock-quote-list.css'
type StockRow={ticker:string;buyers:number;trades:{asset:string}[]}
const price=(n:number)=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4})
export function StockQuoteList({rows,selected,onSelect}:{rows:StockRow[];selected:string|null;onSelect:(v:string)=>void}){
 const [page,setPage]=useState(0),[revision,setRevision]=useState(0)
 const pageSize=40,total=Math.max(1,Math.ceil(rows.length/pageSize)),safePage=Math.min(page,total-1),visible=rows.slice(safePage*pageSize,(safePage+1)*pageSize)
 const identity=rows.map(s=>s.ticker).join('|')
 useEffect(()=>setPage(0),[identity])
 const {quotes,errors,loading}=useLiveQuotes(visible.filter(s=>s.trades.every(t=>publicPriceAllowed(t.asset))).map(s=>s.ticker),revision)
 return <section className="stock-quote-list" aria-label="股票横向行情列表"><div className="sql-status"><span>{rows.length}只 · 涨绿 / 跌红 · 较前收</span><span>{window.financialAI?'每60秒检查 · 源行情可能延迟':'已下载行情快照 · 非实时'}{loading?' · 更新中':''}</span><button onClick={()=>setRevision(v=>v+1)} disabled={loading}>更新行情</button></div><div className="sql-table"><div className="sql-head"><span>代码</span><span>名称</span><span>现价</span><span>涨跌幅</span><span>买入人数</span><span>行情时间</span></div><div className="sql-head sql-head-second"><span>代码</span><span>名称</span><span>现价</span><span>涨跌幅</span><span>买入人数</span><span>行情时间</span></div>{visible.map(s=>{
  const allowed=s.trades.every(t=>publicPriceAllowed(t.asset)),q=allowed?quotes[s.ticker]:undefined,c=quoteChange(q),name=companyZh[s.ticker]||s.trades[0]?.asset||s.ticker
  const problem=allowed?errors[s.ticker]:'非公开标的，不匹配同名证券行情',stale=!!q&&(!!q.stale||Date.now()-Date.parse(q.fetchedAt)>120000)
  return <button key={s.ticker} className={`sql-row ${selected===s.ticker?'selected':''}`} onClick={()=>onSelect(s.ticker)} aria-label={`${s.ticker} ${name} ${s.buyers}人买入`} title={`${name}${q?`；${q.currency} ${price(q.price)}；行情 ${new Date(q.marketTime).toLocaleString('zh-CN')}；参考收盘 ${c?.referenceDate||'未知'}`:''}${problem?'；'+problem:''}`}><b className={c?.tone||'quote-flat'}>{s.ticker}</b><span className="sql-name">{name}</span><span className={c?.tone||'quote-flat'}>{q?`${price(q.price)} ${q.currency}`:problem?'不可用':'读取中'}</span><span className={c?.tone||'quote-flat'}>{c?`${c.percent>=0?'+':''}${c.percent.toFixed(2)}%`:'—'}</span><span>{s.buyers}人</span><small className={stale?'sql-stale':''}>{q?`${new Date(q.marketTime).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}${stale?' 缓存':''}`:problem?'未取得行情':'—'}</small></button>
 })}{!rows.length&&<p className="pr-empty">当前筛选没有股票。</p>}</div><div className="sql-pages"><button disabled={!safePage} onClick={()=>setPage(p=>p-1)}>上一页</button><span>{safePage+1} / {total}</span><button disabled={safePage+1>=total} onClick={()=>setPage(p=>p+1)}>下一页</button></div></section>
}
