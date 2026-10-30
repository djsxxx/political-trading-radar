import { useMemo, useState } from 'react'
import { BellRing, Check, Clock3, Pause, Play, ShieldAlert } from 'lucide-react'
import type { AlertRule, AlertSeverity, MarketAlert } from '../types'

const severityStyle: Record<AlertSeverity, string> = { P1: 'bg-negative/15 text-negative border-negative/30', P2: 'bg-warning/15 text-warning border-warning/30', P3: 'bg-cyan/10 text-cyan border-cyan/25', P4: 'bg-slate-700/30 text-slate-400 border-slate-600/40' }

export function AlertCenter({ alerts, rules, onToggleRule, onAcknowledge }: { alerts: MarketAlert[]; rules: AlertRule[]; onToggleRule: (id: string) => void; onAcknowledge: (id: string) => void }) {
  const [filter, setFilter] = useState<'ALL' | AlertSeverity>('ALL')
  const visible = useMemo(() => alerts.filter((alert) => filter === 'ALL' || alert.severity === filter), [alerts, filter])
  return <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-3">
    <section className="panel flex min-h-0 flex-col rounded-lg">
      <div className="flex h-12 items-center border-b border-line/70 px-4"><ShieldAlert size={14} className="mr-2 text-warning"/><span className="text-[10px] font-semibold tracking-[.14em]">RULE ENGINE</span><span className="ml-auto font-mono text-[8px] text-positive">{rules.filter((rule) => rule.enabled).length}/{rules.length} ACTIVE</span></div>
      <div className="min-h-0 flex-1 overflow-auto p-3">{rules.map((rule) => <article key={rule.id} className={`mb-2 rounded-md border p-3 ${rule.enabled ? 'border-line bg-white/[.018]' : 'border-line/50 opacity-55'}`}>
        <div className="flex items-center"><span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] ${severityStyle[rule.severity]}`}>{rule.severity}</span><span className="ml-2 text-[10px] font-medium text-slate-200">{rule.name}</span><button onClick={() => onToggleRule(rule.id)} className={`ml-auto grid h-6 w-6 place-items-center rounded ${rule.enabled ? 'bg-positive/10 text-positive' : 'bg-slate-800 text-slate-500'}`}>{rule.enabled ? <Play size={10}/> : <Pause size={10}/>}</button></div>
        <div className="mt-2 text-[8px] text-slate-600">{rule.match === 'all' ? '全部满足' : '任一满足'} · 冷却 {rule.cooldownMinutes} 分钟</div>
        <div className="mt-2 space-y-1">{rule.conditions.map((condition, index) => <div key={`${condition.metric}-${index}`} className="rounded bg-black/20 px-2 py-1.5 font-mono text-[8px] text-slate-400">{condition.metric} {condition.operator} {condition.value}</div>)}</div>
      </article>)}</div>
    </section>
    <section className="panel flex min-h-0 flex-col rounded-lg">
      <div className="flex h-12 shrink-0 items-center border-b border-line/70 px-4"><BellRing size={14} className="mr-2 text-negative"/><span className="text-[10px] font-semibold tracking-[.14em]">ALERT STREAM</span><div className="ml-5 flex gap-1">{(['ALL','P1','P2','P3','P4'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded px-2 py-1 font-mono text-[8px] ${filter === item ? 'bg-cyan/10 text-cyan' : 'text-slate-600'}`}>{item}</button>)}</div><span className="ml-auto font-mono text-[8px] text-slate-500">{visible.length} EVENTS</span></div>
      <div className="min-h-0 flex-1 overflow-auto">{visible.map((alert) => <article key={alert.id} className={`grid grid-cols-[46px_minmax(0,1fr)_96px] gap-3 border-b border-line/45 px-4 py-3 ${alert.status === 'acknowledged' ? 'opacity-45' : 'hover:bg-white/[.02]'}`}>
        <span className={`h-fit rounded border py-1 text-center font-mono text-[9px] font-bold ${severityStyle[alert.severity]}`}>{alert.severity}</span>
        <div><div className="text-[10px] font-medium text-slate-200">{alert.message}</div><div className="mt-1.5 flex flex-wrap gap-1.5">{alert.evidence.map((item) => <span key={item} className="rounded bg-black/25 px-1.5 py-1 font-mono text-[8px] text-slate-500">{item}</span>)}</div><div className="mt-2 flex items-center gap-1 text-[7px] text-slate-700"><Clock3 size={9}/>{new Date(alert.createdAt).toLocaleTimeString('zh-CN')} · {alert.ruleName}</div></div>
        <div className="text-right">{alert.status === 'new' ? <button onClick={() => onAcknowledge(alert.id)} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1.5 text-[8px] text-slate-500 hover:border-cyan/30 hover:text-cyan"><Check size={10}/>确认</button> : <span className="text-[8px] text-slate-600">已确认</span>}</div>
      </article>)}</div>
    </section>
  </div>
}
