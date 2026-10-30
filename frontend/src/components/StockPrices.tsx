import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { quoteChange, publicPriceAllowed } from './quoteChange'

export type {ValuationQuote as Quote} from './assetValuationModel'
import type {ValuationQuote as Quote} from './assetValuationModel'
type PriceTrade={name:string;date:string;action:string;owner:string;asset:string;instrument:string;source:string}
const cash=(value:number,currency:string)=>new Intl.NumberFormat('zh-CN',{style:'currency',currency,maximumFractionDigits:2}).format(value)
const pct=(value:number)=>`${value>=0?'+':''}${value.toFixed(2)}%`
export function StockPrices({ticker,trades}:{ticker:string;trades:PriceTrade[]}){
  const [quote,setQuote]=useState<Quote|null>(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [page,setPage]=useState(0)
  const blocked=trades.some(t=>!publicPriceAllowed(t.asset))
  useEffect(()=>{let alive=true;setQuote(null);setPage(0);const load=async()=>{setLoading(true);try{if(blocked)throw Error('披露标的为非上市/非公开资产，不能匹配同名证券行情');if(!window.financialAI?.getPoliticalQuote)throw Error('请在Mac桌面应用查看真实行情；浏览器预览未连接行情服务');const result=await window.financialAI.getPoliticalQuote(ticker);if(alive){setQuote(result);setError(result.stale?'行情暂未更新，正在显示上次缓存价格':'')}}catch(e){if(alive)setError(String(e))}finally{if(alive)setLoading(false)}};void load();const timer=setInterval(()=>void load(),5*60*1000);return()=>{alive=false;clearInterval(timer)}},[ticker,blocked])
  const sorted=useMemo(()=>[...trades].sort((a,b)=>b.date.localeCompare(a.date)),[trades])
  const priceOn=(date:string)=>quote?.points.find(p=>p.date===date)?.close
  const points=useMemo(()=>{if(!quote)return[];const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-6);return quote.points.filter(p=>p.date>=cutoff.toISOString().slice(0,10))},[quote])
  const daily=quoteChange(quote||undefined),change=daily?.percent??null
  const buyDates=new Set(trades.filter(t=>t.action==='purchase').map(t=>t.date))
  const sellDates=new Set(trades.filter(t=>t.action==='sale').map(t=>t.date))
  return <section className="pr-real-prices"><div className="pr-live-price"><div><small>最新可用市场价 · 每5分钟检查</small><strong className={daily?.tone||'quote-flat'}>{quote?cash(quote.price,quote.currency):loading?'行情加载中…':'价格暂不可用'}</strong>{quote&&<span>{new Date(quote.marketTime).toLocaleString('zh-CN')} · {quote.stale?'缓存':'行情源时间'}</span>}</div>{change!=null&&<div className={change>=0?'pr-gain':'pr-loss'}>{pct(change)}<small>较前一有效交易日收盘价</small></div>}</div>{error&&<p className="pr-price-error" role="status">{error}</p>}{quote&&<><ReactECharts style={{height:245}} option={{backgroundColor:'transparent',animation:false,tooltip:{trigger:'axis'},grid:{left:55,right:18,top:20,bottom:40},xAxis:{type:'category',data:points.map(p=>p.date),axisLabel:{color:'#7894aa',formatter:(v:string)=>v.slice(5)},axisLine:{lineStyle:{color:'#294456'}}},yAxis:{type:'value',scale:true,axisLabel:{color:'#7894aa'},splitLine:{lineStyle:{color:'#1b3041'}}},series:[{name:`${ticker} 每日收盘价 (${quote.currency})`,type:'line',data:points.map(p=>p.close),showSymbol:false,lineStyle:{color:'#56c9f4',width:2},areaStyle:{color:'#2b9abe12'},markPoint:{symbolSize:11,label:{show:false},data:points.filter(p=>buyDates.has(p.date)||sellDates.has(p.date)).map(p=>({coord:[p.date,p.close],itemStyle:{color:buyDates.has(p.date)?'#55d6a4':'#f57a91'}}))}}]}}/><p className="pr-explainer">绿点：买入披露；红点：卖出披露。每日收盘价用于对比，并非申报人的实际成交价。股票与期权分别列示。</p><div className="pr-table-wrap"><table><thead><tr><th>人物 / 交易日</th><th>资产类型</th><th>交易日收盘价</th><th>最新市场价</th><th>标的价格变化</th></tr></thead><tbody>{sorted.slice(page*10,page*10+10).map((t,i)=>{const price=priceOn(t.date);const result=price?(quote.price/price-1)*100:null;const option=/\[OP\]|option/i.test(t.asset+' '+t.instrument);return <tr key={`${t.source}-${t.date}-${i}`}><td><a href={t.source} target="_blank" rel="noreferrer">{t.name}</a><br/>{t.date} · {t.action==='purchase'?'买入':t.action==='sale'?'卖出':'交换'}</td><td>{option?'期权（标的价格）':t.instrument||'按原件资产描述'}</td><td>{price?cash(price,quote.currency):'该日无有效价格'}</td><td>{cash(quote.price,quote.currency)}</td><td className={result!=null&&result>=0?'pr-gain':'pr-loss'}>{result!=null?pct(result):'—'}</td></tr>})}</tbody></table></div><div className="pr-pagination"><button disabled={!page} onClick={()=>setPage(p=>p-1)}>上一页</button><span>{page+1} / {Math.max(1,Math.ceil(sorted.length/10))}</span><button disabled={(page+1)*10>=sorted.length} onClick={()=>setPage(p=>p+1)}>下一页</button></div><p className="pr-explainer">涨跌是标的市场价格变化，不等于持有人收益，卖出和期权记录也不据此计算个人盈亏。<a href={quote.source} target="_blank" rel="noreferrer">行情来源 ↗</a></p></>}</section>
}
