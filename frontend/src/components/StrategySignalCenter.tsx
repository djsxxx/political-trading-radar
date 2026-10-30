import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, LockKeyhole, ShieldAlert, Target } from 'lucide-react'
import { decisionSignals } from '../data/decisionData'
import type { DecisionSignal, MarketClass, StrategyHorizon } from '../types'

const horizonCopy: Record<StrategyHorizon, { title: string; range: string; note: string }> = {
  short: { title: '短线策略', range: '5分钟—4小时', note: '量价、资金流、即时事件优先' },
  swing: { title: '波段策略', range: '1—7天', note: '趋势、供需、天气、宏观优先' }
}

const gradeStyle = { 'A+': 'border-cyan/40 bg-cyan/10 text-cyan', A: 'border-positive/35 bg-positive/10 text-positive', B: 'border-warning/35 bg-warning/10 text-warning', C: 'border-slate-600 bg-slate-800/50 text-slate-400' }
const marketLabel: Record<MarketClass, string> = { crypto: '加密', agriculture: '农产品', metal: '金属' }

export function StrategySignalCenter() {
  const [horizon, setHorizon] = useState<StrategyHorizon>('short')
  const [market, setMarket] = useState<'all' | MarketClass>('all')
  const rows = useMemo(() => decisionSignals.filter((signal) => signal.horizon === horizon && (market === 'all' || signal.market === market)), [horizon, market])
  const aSignals = rows.filter((signal) => signal.grade === 'A' || signal.grade === 'A+')
  const averageConfidence = rows.length ? Math.round(rows.reduce((sum, item) => sum + item.confidence, 0) / rows.length) : 0

  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    <section className="grid shrink-0 grid-cols-[1.45fr_repeat(3,1fr)] gap-3">
      <div className="panel flex min-h-[92px] items-center rounded-lg px-4">
        <div><div className="text-[8px] tracking-[.16em] text-slate-600">STRATEGY ENGINE</div><div className="mt-1 text-[15px] font-semibold text-slate-100">{horizonCopy[horizon].title}</div><div className="mt-1 text-[9px] text-slate-500">{horizonCopy[horizon].range} · {horizonCopy[horizon].note}</div></div>
        <div className="ml-auto flex rounded-md border border-line bg-black/20 p-1">{(['short', 'swing'] as const).map((item) => <button key={item} onClick={() => setHorizon(item)} className={`rounded px-4 py-2 text-[9px] ${horizon === item ? 'bg-cyan/15 text-cyan' : 'text-slate-600'}`}>{item === 'short' ? '短线 5M–4H' : '波段 1–7D'}</button>)}</div>
      </div>
      <Metric label="A级可执行信号" value={String(aSignals.length)} unit="条" tone="positive"/>
      <Metric label="平均置信度" value={String(averageConfidence)} unit="%" tone="cyan"/>
      <Metric label="人工确认" value={String(rows.filter((item) => item.direction === 'BUY').length)} unit="待复核" tone="warning"/>
    </section>

    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
      <div className="flex h-12 shrink-0 items-center border-b border-line/70 px-4"><Target size={14} className="mr-2 text-cyan"/><span className="text-[10px] font-semibold tracking-[.14em]">HIGH-CONFIDENCE SIGNAL QUEUE</span><div className="ml-5 flex gap-1">{([['all','全部'],['crypto','加密'],['agriculture','农产品'],['metal','金属']] as const).map(([id,label]) => <button key={id} onClick={() => setMarket(id)} className={`rounded px-2.5 py-1 text-[8px] ${market === id ? 'bg-cyan/10 text-cyan' : 'text-slate-600'}`}>{label}</button>)}</div><span className="ml-auto flex items-center gap-1 text-[8px] text-slate-600"><LockKeyhole size={10}/>信号发出后锁定，禁止事后修改</span></div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="grid grid-cols-2 gap-3">{rows.map((signal) => <SignalCard key={signal.id} signal={signal}/>)}</div>
      </div>
      <div className="flex h-9 shrink-0 items-center border-t border-line/60 px-4 text-[8px] text-slate-600"><ShieldAlert size={11} className="mr-2 text-warning"/>杠杆只放大结果，不提高信号准确率。5×以上仅小额逐仓测试；10×保证金不得超过总资金5%。</div>
    </section>
  </div>
}

function Metric({ label, value, unit, tone }: { label: string; value: string; unit: string; tone: 'positive' | 'cyan' | 'warning' }) {
  const color = tone === 'positive' ? 'text-positive' : tone === 'warning' ? 'text-warning' : 'text-cyan'
  return <div className="panel rounded-lg px-4 py-3"><div className="text-[8px] tracking-wider text-slate-600">{label}</div><div className={`mt-2 font-mono text-2xl ${color}`}>{value}<span className="ml-1 text-[9px] text-slate-600">{unit}</span></div></div>
}

function SignalCard({ signal }: { signal: DecisionSignal }) {
  const directionStyle = signal.direction === 'BUY' ? 'text-positive' : signal.direction === 'SELL' ? 'text-negative' : 'text-warning'
  return <article className="rounded-lg border border-line bg-black/15 p-3 hover:border-cyan/20">
    <div className="flex items-center"><span className={`rounded border px-2 py-1 font-mono text-[9px] font-bold ${gradeStyle[signal.grade]}`}>{signal.grade}级</span><div className="ml-3"><span className="text-[13px] font-semibold text-white">{signal.symbol}</span><span className="ml-2 text-[9px] text-slate-600">{signal.name} · {marketLabel[signal.market]}</span></div><div className="ml-auto text-right"><div className={`font-mono text-[12px] font-semibold ${directionStyle}`}>{signal.direction}</div><div className="mt-0.5 text-[8px] text-slate-600">置信度 <span className="text-slate-300">{signal.confidence}%</span></div></div></div>
    <div className="mt-3 grid grid-cols-4 gap-2">{[['建议区间',signal.entry],['目标',signal.target],['失效/止损',signal.stop],['预期幅度',signal.expectedMove]].map(([label,value]) => <div key={label} className="rounded bg-white/[.025] px-2 py-2"><div className="text-[7px] text-slate-600">{label}</div><div className="mt-1 font-mono text-[9px] text-slate-300">{value}</div></div>)}</div>
    <div className="mt-3 flex items-center gap-2"><span className={`rounded border px-2 py-1 text-[8px] ${signal.leverage >= 5 ? 'border-negative/30 bg-negative/10 text-negative' : signal.leverage >= 3 ? 'border-orange-400/30 bg-orange-400/10 text-orange-400' : signal.leverage === 2 ? 'border-warning/30 bg-warning/10 text-warning' : 'border-positive/25 bg-positive/10 text-positive'}`}>{signal.riskLabel}</span><span className="text-[8px] text-slate-600">保证金上限 {signal.marginLimitPct}% · 单笔计划亏损≤0.5%</span></div>
    <div className="mt-3 flex flex-wrap gap-1.5">{signal.evidence.map((item) => <span key={item} className="rounded bg-cyan/[.055] px-2 py-1 text-[8px] text-slate-400">{item}</span>)}</div>
    <div className="mt-3 flex items-center border-t border-line/50 pt-2 text-[8px] text-slate-600"><Clock3 size={10} className="mr-1.5"/>{signal.issuedAt} · {signal.timeWindow}<span className="ml-auto flex items-center gap-1 text-positive"><CheckCircle2 size={10}/>原始判断已锁定</span></div>
  </article>
}
