import { ArrowUpRight, Radio } from 'lucide-react'
import { intelligenceFeed } from '../data/mockData'

export function AIIntelligenceFeed() {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line/70 px-4">
        <div className="flex items-center gap-2"><Radio size={12} className="text-negative" /><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-200">AI INTELLIGENCE</span></div>
        <span className="rounded bg-negative/10 px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-negative">LIVE</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {intelligenceFeed.map((item, index) => (
          <article key={`${item.time}-${item.source}`} className="group border-b border-line/50 px-4 py-3 hover:bg-white/[0.025]">
            <div className="flex items-center gap-2 font-mono text-[8px]"><span className="text-slate-600">{item.time}</span><span className="font-semibold tracking-wider text-cyan">{item.source}</span><span className={`ml-auto rounded px-1 py-0.5 ${item.impact === 'HIGH' ? 'bg-negative/10 text-negative' : 'bg-warning/10 text-warning'}`}>{item.impact}</span></div>
            <div className="mt-2 flex gap-2"><p className="m-0 flex-1 text-[10px] leading-[1.55] text-slate-300">{item.title}</p><ArrowUpRight size={11} className="mt-0.5 shrink-0 text-slate-700 group-hover:text-cyan" /></div>
            <div className="mt-2 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${item.tone === 'positive' ? 'bg-positive' : item.tone === 'negative' ? 'bg-negative' : 'bg-slate-500'}`} /><span className="text-[8px] uppercase tracking-wider text-slate-600">AI relevance {92 - index * 7}%</span></div>
          </article>
        ))}
      </div>
    </section>
  )
}
