import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import ReactECharts from 'echarts-for-react'
import evidence from '../../public/valuation-holdings.json'
import { valuationCandles, type ValuationHolding, type ValuationQuote } from './assetValuationModel'
import type { AnnualReport } from './AnnualAssets'
import './asset-valuation.css'

const usd=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:2})
export function AssetValuation({id,report}:{id:string;report?:AnnualReport}){
 const holdings=useMemo(()=>(evidence.holdings as ValuationHolding[]).filter(h=>h.personId===id),[id])
 const [selected,setSelected]=useState(''),[period,setPeriod]=useState<'day'|'week'|'month'>('week')
 const holding=holdings.find(h=>h.id===selected)||holdings[0]
 const [quote,setQuote]=useState<ValuationQuote|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [revision,setRevision]=useState(0),[showRows,setShowRows]=useState(false)
 const chartRef=useRef<ReactECharts>(null)
 const hideTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined)
 const [hover,setHover]=useState<{date:string;key:string}|null>(null)
 useEffect(()=>()=>{if(hideTimer.current)clearTimeout(hideTimer.current)},[])
 const symbol=holding?.symbol
 useEffect(()=>{
  let active=true;setQuote(null);setError('');if(!symbol)return
  const load=async()=>{setLoading(true);try{
   let result:ValuationQuote
   if(window.financialAI?.getPoliticalQuote)result=await window.financialAI.getPoliticalQuote(symbol)
   else {const res=await fetch(`${import.meta.env.BASE_URL}valuation-quotes.json`);if(!res.ok)throw Error('浏览器未取得行情快照，请使用桌面版更新');const data=await res.json();result=data.quotes?.find((q:ValuationQuote)=>q.symbol===symbol);if(!result)throw Error('该资产尚无行情快照')}
   if(active){setQuote(result);setError(result.stale?'实时请求失败，使用带时间标记的缓存行情':'')}
  }catch(e){if(active)setError(String(e))}finally{if(active)setLoading(false)}}
  void load();const timer=setInterval(()=>void load(),300000);return()=>{active=false;clearInterval(timer)}
 },[symbol,revision])
 const result=useMemo(()=>holding&&quote?valuationCandles(holding,quote,period):{candles:[],issues:[],missing:0},[holding,quote,period])
 const last=result.candles.at(-1),first=result.candles[0]
 // Keep the chart instance/options stable during loading and unrelated parent renders.
 const chartOption=useMemo(()=>({animation:false,backgroundColor:'transparent',aria:{enabled:true},grid:{left:110,right:20,top:18,bottom:65},tooltip:{trigger:'axis',triggerOn:'mousemove|click',showDelay:0,hideDelay:700,enterable:true,confine:true,transitionDuration:0,alwaysShowContent:false,showContent:false,className:'av-axis-tooltip',axisPointer:{type:'cross',snap:true},formatter:(items:{dataIndex:number}[])=>{const c=result.candles[items[0]?.dataIndex];return c?`${c.date}${c.end!==c.date?' — '+c.end:''}<br/>开 ${usd(c.open)} 美元<br/>收 ${usd(c.close)} 美元<br/>高 ${usd(c.high)} 美元<br/>低 ${usd(c.low)} 美元<br/>${c.samples}个有效交易日 · 固定数量市场估值`:''}},xAxis:{type:'category',data:result.candles.map(c=>c.date),axisLabel:{color:'#9db4c5',showMinLabel:true,showMaxLabel:true,formatter:(v:string)=>v.slice(5)},axisLine:{lineStyle:{color:'#355164'}}},yAxis:{type:'value',scale:true,axisLabel:{color:'#9db4c5',formatter:(v:number)=>usd(v)},splitLine:{lineStyle:{color:'#243a4a'}}},dataZoom:[{type:'inside'},{type:'slider',height:18,bottom:8,textStyle:{color:'#9db4c5'},borderColor:'#355164'}],series:[{name:'固定数量市场估值 · 美元',type:'candlestick',data:result.candles.map(c=>[c.open,c.close,c.low,c.high]),itemStyle:{color:'#57bdd3',color0:'#0c1b27',borderColor:'#57bdd3',borderColor0:'#dc9d9b',borderWidth:1.5}}]}),[result.candles])
 const hoverKey=`${symbol}-${period}`
 const hovered=hover?.key===hoverKey?result.candles.find(c=>c.date===hover.date):undefined
 const keepTip=()=>{if(hideTimer.current)clearTimeout(hideTimer.current)}
 const readPointer=(event:ReactPointerEvent<HTMLDivElement>)=>{
  keepTip()
  const chart=chartRef.current?.getEchartsInstance();if(!chart)return
  const rect=event.currentTarget.getBoundingClientRect(),pixel=[event.clientX-rect.left,event.clientY-rect.top]
  if(!chart.containPixel({gridIndex:0},pixel))return
  const point=chart.convertFromPixel({gridIndex:0},pixel),c=result.candles[Math.round(point[0])]
  if(c)setHover(old=>old?.date===c.date&&old.key===hoverKey?old:{date:c.date,key:hoverKey})
 }
 const leaveTip=()=>{keepTip();hideTimer.current=setTimeout(()=>setHover(null),350)}
 return <section className="av-chart" aria-label="资产估值K线">
  <div className="av-heading"><div><h3>资产估值 K 线</h3><span className="av-estimate">市场估值 · 非申报金额</span></div>{holding&&<div className="av-controls"><select aria-label="估值持仓" value={holding.id} onChange={e=>setSelected(e.target.value)}>{holdings.map(h=><option value={h.id} key={h.id}>{h.name} · {h.symbol}</option>)}</select><select aria-label="估值K线周期" value={period} onChange={e=>setPeriod(e.target.value as typeof period)}><option value="day">日 K</option><option value="week">周 K</option><option value="month">月 K</option></select><button disabled={loading} onClick={()=>setRevision(v=>v+1)} aria-label="更新估值行情">更新</button></div>}</div>
  {!holding?<div className="av-unavailable"><b>资料不足，暂不绘制 K 线</b><p>已收录{report?.holdingsCount??0}项申报资产，尚未核实可用于估值的持仓数量和有效日期。金额区间不能代替股数；这不代表资产为零。</p></div>:<>
   <p className="av-scope">仅估值 {holding.symbol} 这一项，不代表个人总资产；其余股票、企业、房产、现金与加密资产未纳入本图。</p>
   {last&&first&&<div className="av-topline"><div><small>最近可用收盘估值 · 美元</small><strong>{usd(last.close)}</strong><span>{last.end}</span></div><div><small>相对首个有效交易日开盘估值</small><b>{last.close-first.open>=0?'+':''}{usd(last.close-first.open)} 美元</b><span>{first.date} 起 · 固定数量情景，非实际收益</span></div></div>}
   <p className="av-assumption">数量证据：{holding.quantityAsOf} · {usd(holding.quantity)}股。此后假设数量不变；未核实的买卖不补入。</p>
   {error&&<p role="status" className="av-warning">{error}</p>}
   {result.issues.map(issue=><p key={issue} className="av-warning">{issue}</p>)}
   {result.candles.length?<div className="av-canvas" onPointerMove={readPointer} onPointerDown={readPointer} onPointerEnter={keepTip} onPointerLeave={leaveTip} tabIndex={0} aria-label="资产估值K线，左右键选择周期，Esc关闭提示" onBlur={()=>setHover(null)} onKeyDown={event=>{
    if(event.key==='Escape'){setHover(null);return}
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return
    event.preventDefault();keepTip()
    const index=hovered?result.candles.findIndex(c=>c.date===hovered.date):result.candles.length-1
    const c=result.candles[Math.max(0,Math.min(result.candles.length-1,index+(event.key==='ArrowLeft'?-1:1)))]
    if(c)setHover({date:c.date,key:hoverKey})
   }}><ReactECharts ref={chartRef} key={hoverKey} style={{height:290}} option={chartOption}/>{hovered&&<div className="av-hover-tooltip" role="tooltip" onPointerEnter={keepTip} onPointerMove={event=>{event.stopPropagation();keepTip()}} onPointerDown={event=>{event.stopPropagation();keepTip()}}><b>{hovered.date}{hovered.end!==hovered.date?' — '+hovered.end:''}</b><div>开 {usd(hovered.open)} 美元</div><div>收 {usd(hovered.close)} 美元</div><div>高 {usd(hovered.high)} 美元</div><div>低 {usd(hovered.low)} 美元</div><small>{hovered.samples}个有效交易日 · 固定数量市场估值</small></div>}</div>:<div className="av-unavailable">{loading?'正在读取真实开高低收行情…':'尚无符合条件的行情，未生成替代蜡烛。'}</div>}
   <div className="av-legend"><span>实心青色：收 ≥ 开</span><span>空心浅红：收 &lt; 开</span><span>影线：周期最高 / 最低估值</span><span>末根可能为未完成周期</span></div>
   {quote&&<p className="av-freshness">行情时间 {new Date(quote.marketTime).toLocaleString('zh-CN')} · 获取 {new Date(quote.fetchedAt).toLocaleString('zh-CN')}{!window.financialAI?' · 浏览器快照':' · 打开时每5分钟检查'}{quote.stale?' · 旧缓存':''}</p>}
   <div className="av-links"><a href={holding.sourceUrl} target="_blank" rel="noreferrer">股数原件 ↗</a><a href={holding.annualSourceUrl} target="_blank" rel="noreferrer">年度申报对应行 ↗</a>{quote&&<a href={quote.source} target="_blank" rel="noreferrer">行情来源 ↗</a>}<button onClick={()=>setShowRows(v=>!v)} aria-expanded={showRows}>{showRows?'收起':'查看'}计算明细</button></div>
   {showRows&&<div className="av-evidence"><p>{holding.owner}。{holding.note}</p><p>每根 K 线 = 股数 × 同一标的美元 OHLC；周/月按首日开、末日收、最高高、最低低聚合。未从年度金额区间反推数量，不把多个证券的日内极值直接相加。</p><div className="pr-table-wrap"><table><thead><tr><th>周期</th><th>开 · USD</th><th>收 · USD</th><th>高 · USD</th><th>低 · USD</th></tr></thead><tbody>{result.candles.slice(-12).map(c=><tr key={c.date}><td>{c.date}—{c.end}</td><td>{usd(c.open)}</td><td>{usd(c.close)}</td><td>{usd(c.high)}</td><td>{usd(c.low)}</td></tr>)}</tbody></table></div></div>}
  </>}
 </section>
}
