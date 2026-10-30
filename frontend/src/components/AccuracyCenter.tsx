import { useMemo, useState } from 'react'
import { Activity, BarChart3, Clock3, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import { accuracyBySource, accuracyMetrics } from '../data/decisionData'
import type { StrategyHorizon } from '../types'

export function AccuracyCenter() {
  const [horizon, setHorizon] = useState<StrategyHorizon>('short')
  const metric = useMemo(() => accuracyMetrics.find((item) => item.horizon === horizon)!, [horizon])
  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    <section className="panel flex h-[72px] shrink-0 items-center rounded-lg px-4"><div><div className="text-[11px] font-semibold tracking-[.12em]">DECISION AUDIT & ACCURACY CENTER</div><div className="mt-1 text-[8px] text-slate-600">固定判定标准 · 保留行情快照 · 分周期验证 · 不允许事后改口</div></div><div className="ml-auto flex rounded-md border border-line bg-black/20 p-1">{(['short','swing'] as const).map((item) => <button key={item} onClick={() => setHorizon(item)} className={`rounded px-4 py-2 text-[9px] ${horizon === item ? 'bg-cyan/15 text-cyan' : 'text-slate-600'}`}>{item === 'short' ? '短线复盘' : '波段复盘'}</button>)}</div></section>
    <section className="grid shrink-0 grid-cols-4 gap-3">
      <Metric icon={Target} label="方向准确率" value={`${metric.directionAccuracy}%`} note={`${metric.sampleSize} 个已结算样本`} color="text-positive"/>
      <Metric icon={Clock3} label="提前命中率" value={`${metric.earlyHitRate}%`} note={`平均提前 ${metric.averageLeadMinutes} 分钟`} color="text-cyan"/>
      <Metric icon={TrendingUp} label="模拟收益率" value={`+${metric.simulatedReturn}%`} note="已计手续费与滑点" color="text-positive"/>
      <Metric icon={ShieldCheck} label="最大回撤" value={`-${metric.maxDrawdown}%`} note="独立风险门槛" color="text-negative"/>
    </section>
    <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_.8fr] gap-3">
      <section className="panel flex min-h-0 flex-col rounded-lg"><div className="flex h-12 items-center border-b border-line/70 px-4"><BarChart3 size={14} className="mr-2 text-cyan"/><span className="text-[10px] font-semibold tracking-[.14em]">SIGNAL SOURCE ACCURACY</span><span className="ml-auto text-[8px] text-slate-600">按资产与周期持续校准权重</span></div><div className="min-h-0 flex-1 overflow-auto p-4 space-y-4">{accuracyBySource.map((item) => { const value = horizon === 'short' ? item.short : item.swing; return <div key={item.name}><div className="mb-1.5 flex text-[9px]"><span className="text-slate-400">{item.name}</span><span className="ml-auto font-mono text-slate-200">{value}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${value >= 75 ? 'bg-positive' : value >= 65 ? 'bg-cyan' : 'bg-warning'}`} style={{ width: `${value}%` }}/></div></div>})}</div></section>
      <section className="panel flex min-h-0 flex-col rounded-lg"><div className="flex h-12 items-center border-b border-line/70 px-4"><Activity size={14} className="mr-2 text-warning"/><span className="text-[10px] font-semibold tracking-[.14em]">QUALITY GATES</span></div><div className="grid flex-1 grid-cols-2 gap-3 p-4"><Quality label="高置信度准确率" value={`${metric.highConfidenceAccuracy}%`} target="目标 ≥ 75%" ok={metric.highConfidenceAccuracy >= 75}/><Quality label="误报率" value={`${metric.falsePositiveRate}%`} target="目标 ≤ 15%" ok={metric.falsePositiveRate <= 15}/><Quality label="样本完整度" value={`${metric.sampleSize}/300`} target="满300次再升级" ok={metric.sampleSize >= 300}/><Quality label="真实交易权限" value="锁定" target="仅模拟验证" ok={false}/></div><div className="border-t border-line/60 p-4 text-[9px] leading-5 text-slate-500">系统不会只追求“猜对比例”。A级信号必须同时通过方向准确率、盈亏比、最大回撤和样本量门槛，之后才可提交人工审核。</div></section>
    </div>
  </div>
}

function Metric({ icon: Icon, label, value, note, color }: { icon: typeof Target; label: string; value: string; note: string; color: string }) { return <div className="panel rounded-lg p-4"><div className="flex items-center text-[8px] tracking-wider text-slate-600"><Icon size={12} className="mr-2"/>{label}</div><div className={`mt-2 font-mono text-2xl ${color}`}>{value}</div><div className="mt-1 text-[8px] text-slate-600">{note}</div></div> }
function Quality({ label, value, target, ok }: { label: string; value: string; target: string; ok: boolean }) { return <div className="rounded-lg border border-line bg-black/15 p-3"><div className="text-[8px] text-slate-600">{label}</div><div className={`mt-2 font-mono text-lg ${ok ? 'text-positive' : 'text-warning'}`}>{value}</div><div className="mt-1 text-[8px] text-slate-600">{target}</div></div> }
