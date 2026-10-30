import { Bell, ChevronDown, CloudSun, Search, Wifi } from 'lucide-react'
import { marketTickers } from '../data/mockData'
import type { AppLanguage, CryptoAsset, MarketFeedSnapshot } from '../types'

const showPrice = (value: number) => value >= 1000
  ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  : value >= 1 ? value.toFixed(3) : value.toPrecision(4)

function Sparkline({ up, index }: { up: boolean; index: number }) {
  const paths = [
    'M1 15 7 13 13 14 19 9 25 11 31 6 37 8 43 3',
    'M1 12 7 14 13 10 19 12 25 7 31 9 37 5 43 6',
    'M1 14 7 10 13 12 19 6 25 8 31 4 37 7 43 2',
  ]
  return <svg viewBox="0 0 44 18" className="h-4 w-10 overflow-visible" aria-hidden="true">
    <path d={paths[index % paths.length]} fill="none" stroke={up ? '#4ee78d' : '#ff5165'} strokeWidth="1.2" />
  </svg>
}

export function TopMarketBar({ assets, feed, language }: { assets: CryptoAsset[]; feed: MarketFeedSnapshot | null; language: AppLanguage }) {
  const zh = language === 'zh'
  const liveTickers = ['BTC', 'ETH', 'SOL'].map((symbol) => assets.find((asset) => asset.symbol === symbol))
    .filter((asset): asset is CryptoAsset => Boolean(asset))
    .map((asset) => ({ symbol: `${asset.symbol}/USDT`, value: showPrice(asset.price), change: asset.change24h, reference: false }))
  const referenceTickers = marketTickers.slice(3, 7).map((ticker) => ({ ...ticker, reference: true }))
  const tickers = [...liveTickers, ...referenceTickers]
  const online = Boolean(feed && Object.values(feed.sources).some((source) => source.state === 'live'))
  const now = new Date()

  return <header className="drag-region flex h-[66px] shrink-0 items-end border-b border-[#172331] bg-[#060b11] pl-[70px] pr-3">
    <div className="flex h-[56px] min-w-0 flex-1 items-center">
      <div className="no-drag flex w-[178px] shrink-0 items-center">
        <div className="select-none text-[27px] font-black tracking-[-0.06em]">
          <span className="bg-gradient-to-r from-[#ff3138] to-[#ff5e4f] bg-clip-text text-transparent">MX</span>
          <span className="bg-gradient-to-r from-[#2f88ff] to-[#56b7ff] bg-clip-text text-transparent">dai</span>
        </div>
      </div>

      <div className="no-drag grid min-w-0 flex-1 grid-cols-7 gap-1.5 overflow-hidden pr-2">
        {tickers.map((item, index) => {
          const positive = item.change >= 0
          return <div key={item.symbol} className="min-w-0 rounded-md border border-[#12202e] bg-gradient-to-b from-[#0c151f] to-[#09111a] px-2 py-1.5 shadow-[inset_0_1px_rgba(255,255,255,.025)]">
            <div className="flex min-w-0 items-center gap-1"><span className="truncate text-[7px] font-medium tracking-wide text-slate-500">{item.symbol}</span>{item.reference && <span className="rounded bg-slate-700/40 px-1 text-[5px] text-slate-500">REF</span>}</div>
            <div className="mt-0.5 flex items-end justify-between gap-1">
              <div className="min-w-0 font-mono"><div className="truncate text-[10px] font-semibold text-slate-100">{item.value}</div><div className={`text-[7px] ${positive ? 'text-positive' : 'text-negative'}`}>{positive ? '+' : ''}{item.change.toFixed(2)}%</div></div>
              <Sparkline up={positive} index={index}/>
            </div>
          </div>
        })}
      </div>

      <div className="no-drag flex shrink-0 items-center gap-1.5">
        <button className="grid h-8 w-8 place-items-center rounded-md border border-line bg-[#0c141d] text-slate-500 hover:text-white" aria-label={zh ? '搜索' : 'Search'}><Search size={13}/></button>
        <button className="relative grid h-8 w-8 place-items-center rounded-md border border-line bg-[#0c141d] text-slate-500 hover:text-white" aria-label={zh ? '通知' : 'Notifications'}><Bell size={13}/><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-negative"/></button>
        <div className="hidden min-w-[92px] text-right font-mono xl:block"><div className="text-[7px] text-slate-300">{now.toLocaleDateString(zh ? 'zh-CN' : 'en-US')}</div><div className="mt-0.5 text-[7px] text-slate-600">{now.toLocaleTimeString(zh ? 'zh-CN' : 'en-US', { hour12: false })}</div></div>
        <button className="flex h-8 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-100 px-2.5 text-[8px] font-semibold text-slate-900"><CloudSun size={12}/>{zh ? '日间模式' : 'DAY MODE'}<ChevronDown size={9}/></button>
        <span className={`ml-0.5 h-2 w-2 rounded-full ${online ? 'bg-positive shadow-[0_0_8px_#23d9a4]' : 'bg-warning'}`} title={online ? 'Feeds online' : 'Feeds retrying'}/><Wifi size={11} className={online ? 'text-positive' : 'text-warning'}/>
      </div>
    </div>
  </header>
}
