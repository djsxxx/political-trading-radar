import type { AnnualHolding, AnnualReport } from './AnnualAssets'
export const usableAnnual=(report:AnnualReport)=>report.available&&report.parsed&&/annual report/i.test(report.reportLabel||'')&&(report.holdingsCount===0||report.unvaluedCount<report.holdingsCount)
export function holdingCategory(h:AnnualHolding){
 const description=`${h.assetName} ${h.assetType}`
 if(/\bOP\b|option/i.test(h.assetType))return 'OPTIONS'
 if((/bitcoin|ethereum/i.test(description)&&/etf|trust|fund/i.test(description))||['IBIT','FBTC','BITB','ARKB','BTCW','HODL','BRRR','EZBC','GBTC','ETHE','ETHA','FETH'].includes(h.ticker||''))return 'CRYPTO_FUNDS'
 return h.category
}
export function normalizeAnnual(report:AnnualReport):AnnualReport{
 if(report.normalizationApplied||!report.parsed||report.holdings.length!==report.holdingsCount)return report
 const holdings=report.holdings.map(h=>({...h,category:holdingCategory(h)}))
 const fingerprints=new Map<string,number>()
 const fingerprint=(h:typeof holdings[number])=>JSON.stringify([h.assetName,h.account,h.owner,h.assetType,h.valueLow,h.valueHigh])
 for(const h of holdings)if(!h.sourceId)fingerprints.set(fingerprint(h),(fingerprints.get(fingerprint(h))||0)+1)
 for(const h of holdings){
  if(h.includedInTotal===false)continue
  if(!h.sourceId&&(fingerprints.get(fingerprint(h))||0)>1){h.includedInTotal=false;h.exclusionReason='相同描述、账户、持有人和金额的重复候选行；原件未确认是否不同份额，暂不累加'}
  else if(h.valueLow==null||h.valueHigh==null){h.includedInTotal=false;h.exclusionReason=h.exclusionReason||'原件资产价值未列明，不以收入或零补齐'}
  else h.includedInTotal=true
 }
 const categories=new Map<string,{category:string;label:string;count:number;unvaluedCount:number;excludedCount:number;valueLow:number;valueHigh:number;openEnded:boolean}>()
 for(const h of holdings){const category=h.category;const group=categories.get(category)||{category,label:h.categoryLabel,count:0,unvaluedCount:0,excludedCount:0,valueLow:0,valueHigh:0,openEnded:false};group.count++;if(h.valueLow==null||h.valueHigh==null)group.unvaluedCount++;if(h.includedInTotal===false)group.excludedCount++;else{group.valueLow+=h.valueLow!;group.valueHigh+=h.valueHigh!;group.openEnded||=h.valueOpenEnded}categories.set(category,group)}
 const included=holdings.filter(h=>h.includedInTotal!==false),excluded=holdings.length-included.length
 return {...report,holdings,categories:Array.from(categories.values()),allHoldingsLoaded:true,normalizationApplied:true,excludedCount:excluded,totalLow:included.reduce((n,h)=>n+h.valueLow!,0),totalHigh:included.reduce((n,h)=>n+h.valueHigh!,0),totalOpenEnded:included.some(h=>h.valueOpenEnded),aggregationNote:report.aggregationNote||(excluded?`${excluded}行不可计价或重复候选保留展示，未进入当前可核小计；不是认定申报人重复或违规。`:undefined)}
}
