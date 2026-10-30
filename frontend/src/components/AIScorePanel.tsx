import ReactECharts from 'echarts-for-react'
import { Sparkles } from 'lucide-react'

export function AIScorePanel() {
  const option = {
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100, radius: '95%', center: ['50%', '58%'],
      progress: { show: true, width: 8, roundCap: true, itemStyle: { color: '#43d9ff', shadowColor: 'rgba(67,217,255,.45)', shadowBlur: 12 } },
      axisLine: { lineStyle: { width: 8, color: [[1, '#192633']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, anchor: { show: false },
      detail: { valueAnimation: true, formatter: '{value}', color: '#f4f8fb', fontSize: 29, fontWeight: 700, fontFamily: 'monospace', offsetCenter: [0, '-3%'] },
      title: { show: true, offsetCenter: [0, '34%'], color: '#6f8294', fontSize: 9 }, data: [{ value: 78, name: 'MARKET AI SCORE' }]
    }]
  }
  return (
    <section className="panel flex min-h-0 flex-col rounded-lg">
      <div className="flex h-11 items-center justify-between border-b border-line/70 px-4"><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-200">AI MARKET SCORE</span><Sparkles size={13} className="text-cyan" /></div>
      <div className="min-h-[128px] flex-1"><ReactECharts option={option} style={{ height: '100%' }} /></div>
      <div className="grid grid-cols-3 border-t border-line/70 py-2 text-center">
        {[['MOMENTUM', '84', 'text-positive'], ['RISK', '31', 'text-warning'], ['SENTIMENT', '72', 'text-cyan']].map(([k, v, c]) => <div key={k} className="border-r border-line/60 last:border-0"><div className={`font-mono text-[11px] ${c}`}>{v}</div><div className="mt-0.5 text-[7px] tracking-wider text-slate-600">{k}</div></div>)}
      </div>
    </section>
  )
}
