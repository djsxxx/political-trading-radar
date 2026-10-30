import ReactECharts from 'echarts-for-react'
import { Maximize2 } from 'lucide-react'
import { heatMapData } from '../data/mockData'

export function MarketHeatMap() {
  const option = {
    tooltip: {
      backgroundColor: '#101823', borderColor: '#2a3b4c', textStyle: { color: '#d9e4ee', fontSize: 11 },
      formatter: (info: { data: { name: string; change: number; group: string } }) => `${info.data.name}<br/><span style="color:${info.data.change >= 0 ? '#23d9a4' : '#ff5d72'}">${info.data.change > 0 ? '+' : ''}${info.data.change}%</span> · ${info.data.group}`
    },
    series: [{
      type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, width: '100%', height: '100%',
      data: heatMapData.map((item) => ({ ...item, itemStyle: { color: item.change >= 0 ? `rgba(35,217,164,${Math.min(.22 + item.change / 11, .76)})` : `rgba(255,93,114,${Math.min(.22 + Math.abs(item.change) / 10, .76)})`, borderColor: '#0b1118', borderWidth: 3 } })),
      label: { show: true, formatter: (p: { data: { name: string; change: number } }) => `{name|${p.data.name}}\n{change|${p.data.change > 0 ? '+' : ''}${p.data.change}%}`, rich: { name: { color: '#f2f7fb', fontSize: 12, fontWeight: 700, lineHeight: 18 }, change: { color: '#d7e3ed', fontSize: 9, fontFamily: 'monospace' } } },
      upperLabel: { show: false }, levels: [{ itemStyle: { gapWidth: 3 } }]
    }]
  }

  return (
    <section className="panel flex min-h-0 flex-col rounded-lg">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line/70 px-4">
        <div><span className="text-[10px] font-semibold tracking-[0.14em] text-slate-200">CRYPTO MARKET HEATMAP</span><span className="ml-2 text-[8px] text-slate-600">200-ASSET SIMULATION</span></div>
        <button className="text-slate-600 hover:text-white" aria-label="Expand heat map"><Maximize2 size={13} /></button>
      </div>
      <div className="min-h-0 flex-1 p-2"><ReactECharts option={option} style={{ height: '100%', minHeight: 185 }} /></div>
    </section>
  )
}
