export type ValuationHolding={id:string;personId:string;symbol:string;name:string;quantity:number;quantityAsOf:string;currency:string;owner:string;sourceUrl:string;annualSourceUrl:string;note:string}
export type MarketBar={date:string;open?:number;close:number;low?:number;high?:number}
export type ValuationQuote={symbol:string;currency:string;price:number;marketTime:string;fetchedAt:string;source:string;points:MarketBar[];splits?:{date:string;ratio:string}[];stale?:boolean;error?:string;schemaVersion?:number}
export type ValuationCandle={date:string;end:string;open:number;close:number;low:number;high:number;samples:number}
export function valuationCandles(holding:ValuationHolding,quote:ValuationQuote,period:'day'|'week'|'month'){
 const issues:string[]=[]
 if(!Number.isFinite(holding.quantity)||holding.quantity<=0)issues.push('持仓数量不可用')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(holding.quantityAsOf))issues.push('数量核实日期不可用')
 if(quote.symbol!==holding.symbol)issues.push('行情代码不匹配')
 if(quote.currency!=='USD'||holding.currency!=='USD')issues.push('不是美元行情，未擅自换汇')
 if(quote.schemaVersion!==2)issues.push('行情缺少已检查的开高低收/拆股信息')
 if(quote.splits?.some(s=>s.date>=holding.quantityAsOf))issues.push('数量核实后发生拆股，需重新核实数量与价格口径')
 if(issues.length)return {candles:[] as ValuationCandle[],issues,missing:0}
 const rows=new Map<string,MarketBar>(),duplicates=new Set<string>()
 for(const p of quote.points)if(p.date>=holding.quantityAsOf){if(rows.has(p.date))duplicates.add(p.date);rows.set(p.date,p)}
 const grouped=new Map<string,ValuationCandle>();let missing=0
 for(const p of [...rows.values()].sort((a,b)=>a.date.localeCompare(b.date))){
  const values=[p.open,p.close,p.low,p.high]
  if(duplicates.has(p.date)||values.some(v=>v==null||!Number.isFinite(v)||v<=0)||p.low!>Math.min(p.open!,p.close)||p.high!<Math.max(p.open!,p.close)||p.low!>p.high!){missing++;continue}
  const date=new Date(p.date+'T00:00:00Z');let key=p.date
  if(period==='week'){date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);key=date.toISOString().slice(0,10)}
  if(period==='month')key=p.date.slice(0,7)
  const q=holding.quantity,old=grouped.get(key)
  if(old){old.end=p.date;old.close=p.close*q;old.high=Math.max(old.high,p.high!*q);old.low=Math.min(old.low,p.low!*q);old.samples++}
  else grouped.set(key,{date:p.date,end:p.date,open:p.open!*q,close:p.close*q,low:p.low!*q,high:p.high!*q,samples:1})
 }
 if(missing)issues.push(`${missing}个交易日的行情缺失、冲突或无效，已跳过，未补价`)
 return {candles:[...grouped.values()],issues,missing}
}
