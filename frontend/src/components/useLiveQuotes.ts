import { useEffect, useState } from 'react'
import type { ValuationQuote } from './assetValuationModel'
const cache=new Map<string,ValuationQuote>()
const pending=new Map<string,Promise<ValuationQuote>>()
let snapshot:Promise<ValuationQuote[]>|undefined
async function getQuote(symbol:string){
 const old=cache.get(symbol)
 if(old&&Date.now()-Date.parse(old.fetchedAt)<60000)return old
 const inFlight=pending.get(symbol);if(inFlight)return inFlight
 const request=(async()=>{
  let q:ValuationQuote
  if(window.financialAI?.getPoliticalQuote)q=await window.financialAI.getPoliticalQuote(symbol)
  else {snapshot??=fetch(`${import.meta.env.BASE_URL}stock-quotes.json`).then(r=>{if(!r.ok)throw Error('浏览器未连接行情服务');return r.json()}).then(d=>d.quotes);const rows=await snapshot;q=rows.find(p=>p.symbol===symbol)!;if(!q)throw Error('未下载该代码的行情快照')}
  if(!Number.isFinite(q.price)||!q.currency)throw Error('价格或币种不可用')
  cache.set(symbol,q);return q
 })().finally(()=>pending.delete(symbol))
 pending.set(symbol,request);return request
}
export function useLiveQuotes(symbols:string[],revision=0){
 const key=[...new Set(symbols)].sort().join('|')
 const [quotes,setQuotes]=useState<Record<string,ValuationQuote>>({}),[errors,setErrors]=useState<Record<string,string>>({}),[loading,setLoading]=useState(false)
 useEffect(()=>{
  let active=true,running=false
  const list=key?key.split('|'):[]
  const load=async()=>{
   if(running||!list.length)return;running=true;setLoading(true);let cursor=0
   await Promise.all(Array.from({length:Math.min(3,list.length)},async()=>{
    while(active&&cursor<list.length){const symbol=list[cursor++];try{const quote=await getQuote(symbol);if(active){setQuotes(old=>({...old,[symbol]:quote}));setErrors(old=>({...old,[symbol]:quote.stale?'缓存行情，刷新失败':''}))}}
    catch(e){if(active)setErrors(old=>({...old,[symbol]:String(e)}))}}
   }))
   running=false;if(active)setLoading(false)
  }
  void load();const timer=setInterval(()=>void load(),60000)
  return()=>{active=false;clearInterval(timer)}
 },[key,revision])
 return {quotes,errors,loading}
}
