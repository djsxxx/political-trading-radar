import type { ValuationQuote } from './assetValuationModel'
export const publicPriceAllowed=(asset:string)=>!/Space Exploration Technologies|\bSpaceX\b|非上市|non-public/i.test(asset)
export function quoteChange(q?:ValuationQuote){
 if(!q||!Number.isFinite(q.price)||q.price<=0)return null
 const marketDay=q.marketTime?.slice(0,10)
 if(!marketDay)return null
 const prior=q.points.filter(p=>p.date<marketDay&&Number.isFinite(p.close)&&p.close>0).sort((a,b)=>b.date.localeCompare(a.date))[0]
 if(!prior)return null
 const change=q.price-prior.close
 return {change,percent:change/prior.close*100,previousClose:prior.close,referenceDate:prior.date,tone:change>0?'quote-up':change<0?'quote-down':'quote-flat'}
}
