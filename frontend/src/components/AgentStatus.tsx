import { Bot, CheckCircle2, LoaderCircle } from 'lucide-react'

const agents = [
  { name: 'Market Scanner', task: 'Streaming smart active set', status: 'working' },
  { name: 'News Analyst', task: 'Classifying 8 sources', status: 'working' },
  { name: 'Social Signal', task: 'Monitoring 18 accounts', status: 'ready' },
  { name: 'Macro Observer', task: 'Next cycle in 04:12', status: 'ready' }
]

export function AgentStatus() {
  return (
    <section className="border-t border-line/70">
      <div className="flex h-10 items-center justify-between px-4"><div className="flex items-center gap-2"><Bot size={12} className="text-cyan" /><span className="text-[9px] font-semibold tracking-[0.14em] text-slate-300">AGENT NETWORK</span></div><span className="font-mono text-[8px] text-positive">4/4 ONLINE</span></div>
      <div className="grid grid-cols-2 gap-px bg-line/60 border-t border-line/60">
        {agents.map((agent) => (
          <div key={agent.name} className="bg-[#0c1219] p-2.5">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-300">{agent.status === 'working' ? <LoaderCircle size={10} className="animate-spin text-cyan" /> : <CheckCircle2 size={10} className="text-positive" />}{agent.name}</div>
            <div className="mt-1 truncate text-[7px] text-slate-600">{agent.task}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
