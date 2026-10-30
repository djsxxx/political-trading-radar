/// <reference types="vite/client" />

interface Window {
  financialAI?: {
    platform: string
    version: string
    mode: string
    openPowerMap:()=>Promise<{opened:boolean}>
    openPeopleWindow:()=>Promise<{opened:boolean}>
    getPoliticalData:()=>Promise<any>
    getPoliticalQuote:(ticker:string)=>Promise<import('./components/StockPrices').Quote>
    syncPoliticalData:()=>Promise<any>
    getPoliticalStatus:()=>Promise<any>
    getAnnualAssets:()=>Promise<import('./components/AnnualAssets').AnnualData>
    getAnnualHistory:()=>Promise<import('./components/annualChangeModel').AnnualHistory>
    getAnnualStatus:()=>Promise<any>
    refreshAnnualAssets:()=>Promise<any>
    getMarketSnapshot: () => Promise<import('./types').MarketFeedSnapshot | undefined>
    getCandles: (symbol: string, interval: string) => Promise<import('./types').Candle[]>
    onMarketSnapshot: (callback: (snapshot: import('./types').MarketFeedSnapshot) => void) => () => void
  }
}
