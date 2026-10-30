import { Radio, ShieldCheck } from 'lucide-react'
import type { MarketFeedSnapshot } from '../types'

const stateCopy = { live: ['实时', 'text-positive'], connecting: ['连接中', 'text-warning'], degraded: ['降级', 'text-warning'], offline: ['离线', 'text-negative'] } as const

export function FeedStatus({ feed, live, verified }: { feed: MarketFeedSnapshot | null; live: number; verified: number }) {
  return <div className="flex items-center gap-2">{(['binance','okx'] as const).map((source) => { const state = feed?.sources[source].state ?? 'offline'; const copy = stateCopy[state]; return <span key={source} className={`flex items-center gap-1 rounded border border-line bg-black/20 px-2 py-1 ${copy[1]}`}><Radio size={9}/>{source.toUpperCase()} {copy[0]}</span> })}<span className="flex items-center gap-1 text-slate-500"><ShieldCheck size={10}/>{verified}/{live} 双源验证</span></div>
}
