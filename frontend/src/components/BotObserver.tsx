import { useMemo, useState } from 'react'
import { Bot, Link2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { strategyBots } from '../data/agentData'

export function BotObserver() {
  const [filter, setFilter] = useState<'全部' | '公开信号' | '账户只读'>('全部')
  const rows = useMemo(() => strategyBots.filter((bot) => filter === '全部' || bot.sourceType === filter), [filter])
  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    <section className="grid shrink-0 grid-cols-4 gap-3">
      <Summary label="策略观察池" value="20" note="公开与账户接口分开" tone="text-cyan"/>
      <Summary label="公开参考" value="15" note="只作证据，不直接跟单" tone="text-positive"/>
      <Summary label="账户接口" value="5" note="等待只读授权" tone="text-warning"/>
      <Summary label="自动跟单" value="关闭" note="本阶段禁止" tone="text-negative"/>
    </section>
    <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
      <div className="flex h-12 shrink-0 items-center border-b border-line/70 px-4"><Bot size={14} className="mr-2 text-cyan"/><span className="text-[10px] font-semibold tracking-[.14em]">STRATEGY BOT OBSERVATION POOL</span><div className="ml-5 flex gap-1">{(['全部','公开信号','账户只读'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded px-3 py-1.5 text-[8px] ${filter === item ? 'bg-cyan/10 text-cyan' : 'text-slate-600'}`}>{item}</button>)}</div><span className="ml-auto text-[8px] text-slate-600">排行榜可能存在幸存者偏差，必须重新模拟验证</span></div>
      <div className="min-h-0 flex-1 overflow-auto"><table className="w-full border-collapse text-left"><thead className="sticky top-0 bg-[#0c121a] text-[7px] tracking-wider text-slate-600"><tr><th className="px-4 py-2">机器人 / 平台</th><th>策略</th><th>数据方式</th><th>连接</th><th>杠杆</th><th>可信分</th><th>样本</th><th>最大回撤</th><th>风险检查</th></tr></thead><tbody>{rows.map((bot) => <tr key={bot.id} className="border-t border-line/40 text-[9px] hover:bg-white/[.02]"><td className="px-4 py-2.5"><div className="text-slate-200">{bot.name}</div><div className="mt-0.5 text-[7px] text-slate-600">{bot.platform}</div></td><td className="text-slate-400">{bot.strategy}</td><td><span className={`rounded px-1.5 py-1 ${bot.sourceType === '公开信号' ? 'bg-cyan/10 text-cyan' : 'bg-warning/10 text-warning'}`}>{bot.sourceType}</span></td><td className={bot.connection === '观察中' ? 'text-positive' : 'text-warning'}>{bot.connection}</td><td className="font-mono text-slate-400">{bot.leverage}</td><td className="font-mono text-slate-300">{bot.sampleSize ? bot.reliability : '—'}</td><td className="font-mono text-slate-500">{bot.sampleSize || '—'}</td><td className="font-mono text-slate-500">{bot.sampleSize ? `${bot.maxDrawdown}%` : '—'}</td><td>{bot.warning ? <span className="flex items-center gap-1 text-warning"><TriangleAlert size={10}/>{bot.warning}</span> : bot.connection === '待授权' ? <span className="flex items-center gap-1 text-slate-600"><Link2 size={10}/>未提供密钥</span> : <span className="flex items-center gap-1 text-positive"><ShieldCheck size={10}/>纳入独立复盘</span>}</td></tr>)}</tbody></table></div>
      <div className="border-t border-line/60 px-4 py-2 text-[8px] text-slate-600">公开业绩不是实时实盘证明；接入后统一扣除延迟、手续费、滑点与资金费率，再计算参考价值。</div>
    </section>
  </div>
}

function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) { return <div className="panel rounded-lg p-4"><div className="text-[8px] text-slate-600">{label}</div><div className={`mt-2 font-mono text-xl ${tone}`}>{value}</div><div className="mt-1 text-[8px] text-slate-600">{note}</div></div> }
