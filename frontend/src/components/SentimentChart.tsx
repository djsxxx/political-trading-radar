import ReactECharts from 'echarts-for-react'

export function SentimentChart() {
  const option = {
    grid: { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['03:00','06:00','09:00','12:00','15:00','18:00'], axisLine: { lineStyle: { color: '#263543' } }, axisLabel: { color: '#546678', fontSize: 8 }, axisTick: { show: false } },
    yAxis: { type: 'value', min: 20, max: 100, splitLine: { lineStyle: { color: '#18232e' } }, axisLabel: { show: false } },
    series: [{ type: 'line', smooth: true, symbol: 'none', data: [44, 50, 43, 61, 67, 72], lineStyle: { color: '#43d9ff', width: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(67,217,255,.24)' }, { offset: 1, color: 'rgba(67,217,255,0)' }] } }, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#2a3947', type: 'dashed' }, data: [{ yAxis: 50 }] } }]
  }
  return (
    <section className="panel flex min-h-0 flex-col rounded-lg">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line/70 px-4"><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-200">MARKET SENTIMENT</span><span className="font-mono text-[10px] text-positive">BULLISH 72%</span></div>
      <div className="min-h-0 flex-1"><ReactECharts option={option} style={{ height: '100%', minHeight: 105 }} /></div>
    </section>
  )
}
