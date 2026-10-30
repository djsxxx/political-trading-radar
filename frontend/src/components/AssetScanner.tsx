import { useMemo, useState } from 'react'
import { ArrowDownUp, Search, Star } from 'lucide-react'
import type { CryptoAsset, CryptoCategory, MonitorMode } from '../types'
import { MiniSparkline } from './MiniSparkline'

type SortKey = 'marketCap' | 'change24h' | 'volumeMultiplier' | 'volatility' | 'aiScore'
const categories: Array<'全部' | CryptoCategory> = ['全部', 'Layer 1', 'Layer 2', 'DeFi', 'AI', 'Meme', 'Gaming', 'RWA', 'Exchange', 'Privacy', 'Other']
const compact = (value: number) => value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` : value >= 1e6 ? `$${(value / 1e6).toFixed(1)}M` : `$${value.toLocaleString()}`
const price = (value: number) => value >= 1000 ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : value >= 1 ? `$${value.toFixed(3)}` : `$${value.toPrecision(4)}`

export function AssetScanner({ assets, monitorMode, onMonitorModeChange, onToggleFavorite }: { assets: CryptoAsset[]; monitorMode: MonitorMode; onMonitorModeChange: (mode: MonitorMode) => void; onToggleFavorite: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'全部' | CryptoCategory>('全部')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const smartScore = (asset: CryptoAsset) => Math.log10(Math.max(asset.marketCap, 1)) * 4 + Math.min(asset.volumeMultiplier, 6) * 4 + Math.min(asset.volatility, 18) + asset.aiScore * .55
  const modeAssets = useMemo(() => {
    if (monitorMode === 'all200') return assets
    if (monitorMode === 'custom') return assets.filter((asset) => asset.favorite)
    return [...assets].sort((a, b) => smartScore(b) - smartScore(a)).slice(0, monitorMode === 'smart30' ? 30 : 50)
  }, [assets, monitorMode])
  const rows = useMemo(() => [...modeAssets.filter((asset) => (!query || `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.toLowerCase())) && (category === '全部' || asset.category === category))].sort((a, b) => b[sortKey] - a[sortKey]), [modeAssets, query, category, sortKey])

  return <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line/70 px-4">
      <div><div className="text-[11px] font-semibold tracking-[.14em] text-slate-100">CRYPTO ASSET SCANNER</div><div className="mt-1 text-[8px] tracking-wider text-slate-600">200 COIN POOL · SMART ACTIVE SET</div></div>
      <label className="ml-4 flex h-8 w-56 items-center gap-2 rounded border border-line bg-black/20 px-2 text-slate-500"><Search size={13}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索币种 / 代码" className="w-full bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-700" /></label>
      <div className="flex h-8 items-center rounded border border-line bg-black/20 p-0.5">{([['smart30','精选30'],['smart50','精选50'],['custom','我的自选'],['all200','全部200']] as const).map(([mode, label]) => <button key={mode} onClick={() => onMonitorModeChange(mode)} className={`h-6 rounded px-2 text-[8px] ${monitorMode === mode ? 'bg-cyan/15 text-cyan' : 'text-slate-600 hover:text-slate-300'}`}>{label}</button>)}</div>
      <div className="ml-auto font-mono text-[9px] text-slate-500">激活 <span className="text-cyan">{rows.length}</span> / 币池 {assets.length}</div>
    </div>
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line/50 px-4 py-2">
      {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded px-2 py-1 text-[8px] ${category === item ? 'bg-cyan/10 text-cyan' : 'text-slate-600 hover:text-slate-300'}`}>{item}</button>)}
    </div>
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[#0c121a] text-[7px] tracking-[.12em] text-slate-600"><tr><th className="w-9 px-3 py-2"></th><th className="px-2 py-2">币种</th><th className="px-2 py-2">分类</th><th className="px-2 py-2">价格</th><th className="px-2 py-2"><SortButton active={sortKey === 'change24h'} onClick={() => setSortKey('change24h')}>24H</SortButton></th><th className="px-2 py-2">5分钟</th><th className="px-2 py-2"><SortButton active={sortKey === 'volumeMultiplier'} onClick={() => setSortKey('volumeMultiplier')}>量能</SortButton></th><th className="px-2 py-2"><SortButton active={sortKey === 'volatility'} onClick={() => setSortKey('volatility')}>波动率</SortButton></th><th className="px-2 py-2">RSI</th><th className="px-2 py-2">趋势</th><th className="px-2 py-2"><SortButton active={sortKey === 'aiScore'} onClick={() => setSortKey('aiScore')}>AI</SortButton></th><th className="px-2 py-2"><SortButton active={sortKey === 'marketCap'} onClick={() => setSortKey('marketCap')}>市值</SortButton></th></tr></thead>
        <tbody>{rows.map((asset) => <tr key={asset.id} className="asset-row border-t border-line/40 text-[9px] hover:bg-white/[.025]">
          <td className="px-3 py-2"><button onClick={() => onToggleFavorite(asset.id)} className={asset.favorite ? 'text-warning' : 'text-slate-700 hover:text-warning'}><Star size={11} fill={asset.favorite ? 'currentColor' : 'none'}/></button></td>
          <td className="px-2 py-2"><span className="font-semibold text-slate-100">{asset.symbol}</span><span className="ml-2 text-slate-600">{asset.name}</span>{asset.dataMode === 'live' ? <span className={`ml-2 rounded px-1 py-0.5 text-[6px] ${asset.verified ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning'}`}>{asset.verified ? '双源' : '单源'}</span> : <span className="ml-2 rounded bg-slate-800 px-1 py-0.5 text-[6px] text-slate-600">参考</span>}</td><td className="px-2 py-2 text-slate-500">{asset.category}</td><td className="px-2 py-2 font-mono text-slate-300">{price(asset.price)}</td>
          <Change value={asset.change24h}/><Change value={asset.change5m}/><td className={`px-2 py-2 font-mono ${asset.volumeMultiplier > 3 ? 'text-warning' : 'text-slate-500'}`}>{asset.volumeMultiplier.toFixed(1)}×</td><td className="px-2 py-2 font-mono text-slate-500">{asset.volatility.toFixed(1)}%</td><td className={`px-2 py-2 font-mono ${asset.rsi > 70 ? 'text-warning' : asset.rsi < 30 ? 'text-cyan' : 'text-slate-500'}`}>{asset.rsi.toFixed(0)}</td><td className="px-2 py-1"><MiniSparkline values={asset.sparkline} positive={asset.change24h >= 0}/></td><td className="px-2 py-2"><span className="font-mono text-cyan">{asset.aiScore}</span></td><td className="px-2 py-2 font-mono text-slate-500">{compact(asset.marketCap)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>
}

function Change({ value }: { value: number }) { return <td className={`px-2 py-2 font-mono ${value >= 0 ? 'text-positive' : 'text-negative'}`}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</td> }
function SortButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex items-center gap-1 ${active ? 'text-cyan' : ''}`}>{children}<ArrowDownUp size={8}/></button> }
