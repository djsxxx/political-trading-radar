import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { annualRange, type AnnualData, type AnnualReport } from './AnnualAssets'
import { compareEntry, reviewHistory, type AnnualHistory } from './annualChangeModel'

let historyRequest:Promise<AnnualHistory>|undefined
function loadHistory(){return historyRequest??=(window.financialAI?.getAnnualHistory?window.financialAI.getAnnualHistory():fetch(`${import.meta.env.BASE_URL}annual-history.json`).then(r=>{if(!r.ok)throw Error('历史申报读取失败');return r.json()})).catch(e=>{historyRequest=undefined;throw e})}
export function AssetGrowth({id,report,annual}:{id:string;report?:AnnualReport;annual:AnnualData|null}){
 const [history,setHistory]=useState<AnnualHistory|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;loadHistory().then(h=>{if(active)setHistory(h)}).catch(e=>{if(active)setError(String(e))});return()=>{active=false}},[])
 const entry=useMemo(()=>history?reviewHistory(history,annual).entries.find(e=>e.member.id===id):undefined,[history,annual,id])
 const points=useMemo(()=>{
  const rows=new Map<number,{year:number;low:number;high:number|null;open:boolean;url:string;partial:boolean}>()
  for(const r of [entry?.previous,entry?.current])if(r?.verified&&r.totalLow!=null&&r.totalHigh!=null&&(r.totalLow>0||r.totalHigh>0))rows.set(r.year,{year:r.year,low:r.totalLow,high:r.totalOpenEnded?null:r.totalHigh,open:!!r.totalOpenEnded,url:r.sourceUrl,partial:!!r.unvaluedCount})
  if(report?.parsed&&report.asOfDate&&report.sourceUrl&&(report.totalLow>0||report.totalHigh>0)){
   const year=Number(report.asOfDate.slice(0,4));rows.set(year,{year,low:report.totalLow,high:report.totalOpenEnded?null:report.totalHigh,open:report.totalOpenEnded,url:report.sourceUrl,partial:!!report.partial||!!report.unvaluedCount||!!report.excludedCount})
  }
  return [...rows.values()].sort((a,b)=>a.year-b.year)
 },[entry,report])
 const comparable=!!entry&&compareEntry(entry).kind!=='missing'&&points.length===2&&points[0].year===entry.previous?.year&&points[1].year===entry.current?.year&&points[1].url===entry.current?.sourceUrl&&!points.some(p=>p.partial||p.open)
 const years=history?[history.previousYear,history.currentYear]:points.map(p=>p.year)
 for(const p of points)if(!years.includes(p.year))years.push(p.year)
 years.sort((a,b)=>a-b)
 const byYear=new Map(points.map(p=>[p.year,p]))
 return <div className="asset-growth" aria-label="个人资产增长走势图" style={{borderTop:'1px solid #315064',paddingTop:10,marginTop:12,minWidth:0}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><b style={{fontSize:12}}>资产增长走势 · 年度申报区间</b><small style={{fontSize:10}}>美元</small></div>{points.length?<><ReactECharts style={{height:185,width:'100%'}} option={{animation:false,backgroundColor:'transparent',color:['#5ac7ed','#d5bc82'],legend:{data:['披露下限','披露上限'],top:0,textStyle:{color:'#8eafc1',fontSize:10},itemWidth:14,itemHeight:5},grid:{left:110,right:18,top:35,bottom:25},tooltip:{trigger:'axis',formatter:(items:{axisValue:string}[])=>{const p=byYear.get(Number(items[0]?.axisValue));return p?`${p.year} 年度披露<br/>${annualRange(p.low,p.high??p.low,p.open)}${p.partial?'<br/>仅可计价/已核实部分':''}`:'该年未取得可用金额，未补零'}},xAxis:{type:'category',data:years.map(String),axisLine:{lineStyle:{color:'#315064'}},axisLabel:{color:'#90aabd'},boundaryGap:true},yAxis:{type:'value',scale:true,axisLabel:{color:'#90aabd',fontSize:10,formatter:(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:0})},splitLine:{lineStyle:{color:'#243c4c'}}},series:[{name:'披露下限',type:'line',data:years.map(y=>byYear.has(y)?byYear.get(y)!.low:null),symbolSize:7,connectNulls:false,lineStyle:{opacity:comparable?1:0},markLine:{silent:true,symbol:['none','none'],label:{show:false},lineStyle:{color:'#5ac7ed',type:'solid',opacity:.5,width:5},data:points.filter(p=>p.high!=null).map(p=>[{coord:[String(p.year),p.low]},{coord:[String(p.year),p.high!]}])}},{name:'披露上限',type:'line',data:years.map(y=>{const p=byYear.get(y);return p?.high!=null?p.high:null}),symbolSize:7,connectNulls:false,lineStyle:{opacity:comparable?1:0}}]}}/><small style={{fontSize:10,lineHeight:1.7}}>{comparable?'连线仅连接年度披露点，不代表每日走势或投资收益。':points.length<2?'仅有单年可用金额，暂不能判断增长；缺年不补零。':'年度口径未完全可比，仅画独立区间，不连成增长曲线。'}{points.some(p=>p.open)?' 存在无上限档，仅画已披露下限。':''}</small><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:5}}>{points.map(p=><a key={p.year} href={p.url} target="_blank" rel="noreferrer" style={{fontSize:10}}>{p.year}原件 ↗</a>)}</div></>:<small style={{fontSize:11}}>{error||(!history?'读取申报历史…':'尚无可绘制的年度金额，未填成零。')}</small>}</div>
}
