import { Activity, Bot, ChevronRight, CircleDollarSign, Clock3, Globe2, ListChecks, LockKeyhole, Moon, Radio, ShieldCheck, Star, Sun, Zap } from 'lucide-react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import countries110m from 'world-atlas/countries-110m.json'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology } from 'topojson-specification'
import { useEffect, useRef, useState } from 'react'
import type { AppLanguage, CryptoAsset } from '../types'

const worldTopology = countries110m as unknown as Topology
const countryCollection = feature(worldTopology, worldTopology.objects.countries) as unknown as FeatureCollection<Geometry>
const mapProjection = geoEquirectangular().scale(760 / (2 * Math.PI)).translate([380, 170])
const mapPath = geoPath(mapProjection)
const countryShapes = countryCollection.features.map((country, index) => {
  return { id: String(country.id ?? index), d: mapPath(country) ?? '' }
}).filter((country) => country.d)

interface CityLight {
  longitude: number
  latitude: number
  population: number
}

interface CityGeoJson {
  features: Array<{
    geometry: { coordinates: [number, number] }
    properties: { pop_max?: number }
  }>
}

const radians = (degrees: number) => degrees * Math.PI / 180

const solarParameters = (date: Date) => {
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0)
  const day = Math.floor((date.getTime() - yearStart) / 86400000)
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const gamma = 2 * Math.PI / 365 * (day - 1 + (hour - 12) / 24)
  const equationOfTime = 229.18 * (.000075 + .001868 * Math.cos(gamma) - .032077 * Math.sin(gamma) - .014615 * Math.cos(2 * gamma) - .040849 * Math.sin(2 * gamma))
  const declination = .006918 - .399912 * Math.cos(gamma) + .070257 * Math.sin(gamma) - .006758 * Math.cos(2 * gamma) + .000907 * Math.sin(2 * gamma) - .002697 * Math.cos(3 * gamma) + .00148 * Math.sin(3 * gamma)
  const subsolarLongitude = (720 - hour * 60 - equationOfTime) / 4
  return { declination, subsolarLongitude }
}

const solarAltitude = (latitude: number, longitude: number, solar: ReturnType<typeof solarParameters>) => {
  const latitudeRadians = radians(latitude)
  const hourAngle = radians(longitude - solar.subsolarLongitude)
  const cosineZenith = Math.sin(latitudeRadians) * Math.sin(solar.declination) + Math.cos(latitudeRadians) * Math.cos(solar.declination) * Math.cos(hourAngle)
  return 90 - Math.acos(Math.max(-1, Math.min(1, cosineZenith))) * 180 / Math.PI
}

const formatPrice = (value: number) => value >= 1000
  ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  : value >= 1 ? value.toFixed(3) : value.toPrecision(4)

function PanelTitle({ icon: Icon, title, action }: { icon?: typeof Activity; title: string; action?: string }) {
  return <div className="flex h-9 shrink-0 items-center border-b border-[#182635] px-3">
    {Icon && <Icon size={12} className="mr-2 text-cyan"/>}<h2 className="m-0 text-[9px] font-semibold tracking-wide text-slate-100">{title}</h2>
    {action && <button className="ml-auto flex items-center gap-1 text-[7px] text-[#4097ff]">{action}<ChevronRight size={8}/></button>}
  </div>
}

function RiskMap({ zh }: { zh: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cities, setCities] = useState<CityLight[]>([])
  const now = new Date()

  useEffect(() => {
    const controller = new AbortController()
    fetch('./assets/cities-50m.geojson', { signal: controller.signal })
      .then((response) => response.json() as Promise<CityGeoJson>)
      .then((data) => setCities(data.features.map((city) => ({
        longitude: city.geometry.coordinates[0],
        latitude: city.geometry.coordinates[1],
        population: city.properties.pop_max ?? 0,
      })).filter((city) => city.population >= 25000).sort((a, b) => a.population - b.population)))
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const draw = () => {
      const currentTime = new Date()
      const solar = solarParameters(currentTime)
      const { width, height } = canvas
      const pixels = context.createImageData(width, height)

      for (let y = 0; y < height; y += 1) {
        const mapY = y / height * 340
        const latitude = (170 - mapY) / (760 / 360)
        for (let x = 0; x < width; x += 1) {
          const longitude = x / width * 360 - 180
          const altitude = solarAltitude(latitude, longitude, solar)
          let opacity = 0
          let red = 3
          let green = 8
          let blue = 17

          if (altitude < 6 && altitude >= 0) {
            const twilight = (6 - altitude) / 6
            opacity = .02 + twilight * .13
            red = 40; green = 27; blue = 54
          } else if (altitude < 0 && altitude >= -6) {
            const twilight = -altitude / 6
            opacity = .15 + twilight * .37
            red = Math.round(42 - twilight * 25)
            green = Math.round(22 - twilight * 8)
            blue = Math.round(48 - twilight * 14)
          } else if (altitude < -6 && altitude >= -12) {
            const twilight = (-altitude - 6) / 6
            opacity = .52 + twilight * .22
            red = Math.round(17 - twilight * 11)
            green = Math.round(14 - twilight * 6)
            blue = Math.round(34 - twilight * 16)
          } else if (altitude < -12) {
            opacity = .78
          }

          const offset = (y * width + x) * 4
          pixels.data[offset] = red
          pixels.data[offset + 1] = green
          pixels.data[offset + 2] = blue
          pixels.data[offset + 3] = Math.round(opacity * 255)
        }
      }

      context.clearRect(0, 0, width, height)
      context.putImageData(pixels, 0, 0)
      context.save()
      context.globalCompositeOperation = 'screen'

      cities.forEach((city) => {
        const altitude = solarAltitude(city.latitude, city.longitude, solar)
        const nightVisibility = Math.max(0, Math.min(1, (-altitude + 1) / 10))
        if (nightVisibility <= .03) return
        const point = mapProjection([city.longitude, city.latitude])
        if (!point) return
        const populationWeight = Math.max(0, Math.min(1, (Math.log10(Math.max(city.population, 25000)) - 4.4) / 3.1))
        const radius = .2 + populationWeight * .68
        const alpha = nightVisibility * (.28 + populationWeight * .44)
        context.beginPath()
        context.arc(point[0] / 2, point[1] / 2, radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(255, 211, 132, ${alpha})`
        context.shadowColor = `rgba(255, 177, 72, ${alpha})`
        context.shadowBlur = .7 + radius * 1.8
        context.fill()
      })

      context.restore()
    }

    draw()
    const timer = window.setInterval(draw, 60000)
    return () => window.clearInterval(timer)
  }, [cities])

  return <section className="mxdai-panel intel-map relative min-h-0 overflow-hidden rounded-md">
    <div className="absolute inset-x-0 top-0 z-20 flex h-10 items-center border-b border-[#182635] bg-[#09111a]/95 px-3">
      <Globe2 size={13} className="text-slate-300"/><span className="ml-2 text-[10px] font-semibold text-slate-100">{zh ? '全球昼夜与城市灯光' : 'GLOBAL DAY / NIGHT & CITY LIGHTS'}</span>
      <span className="ml-2 flex items-center gap-1 text-[7px] text-positive"><Radio size={8}/>{zh ? '实时太阳位置' : 'LIVE SOLAR'}</span>
      <div className="ml-auto flex items-center gap-2"><span className="font-mono text-[7px] text-slate-500">UTC+8 · {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span><div className="flex items-center gap-1 rounded-full border border-[#2a3947] bg-[#101923] px-2 py-1 text-[7px] text-slate-400"><Sun size={9} className="text-[#ffb348]"/><span>{zh ? '时区自动' : 'AUTO TZ'}</span><Moon size={8} className="text-[#6e91ca]"/></div></div>
    </div>

    <img src="./assets/earth-blue-marble.png" alt="" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[calc(100%-40px)] w-full object-cover saturate-[.82] brightness-[.88]"/>
    <canvas ref={canvasRef} width="380" height="170" className="absolute inset-x-0 bottom-0 h-[calc(100%-40px)] w-full" aria-label={zh ? '根据实时太阳位置生成的昼夜与城市灯光图层' : 'Live solar day-night and city-light layer'}/>
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(100%-40px)] w-full" viewBox="0 0 760 340" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="#d8ebf5" strokeOpacity=".13" strokeWidth=".34">{countryShapes.map((country) => <path key={country.id} d={country.d}/>)}</g>
      <g opacity=".11" fill="none" stroke="#b9d3e7" strokeWidth=".35"><path d="M0 85H760M0 170H760M0 255H760"/><path d="M126.7 0V340M253.3 0V340M380 0V340M506.7 0V340M633.3 0V340"/></g>
    </svg>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[#06101a] via-[#06101a]/65 to-transparent"/>

    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-md border border-[#273544] bg-[#081019]/88 px-3 py-2 text-[8px] shadow-xl backdrop-blur"><i className="h-1.5 w-1.5 rounded-full bg-[#ffd68e] shadow-[0_0_7px_#ffb448]"/><span className="text-slate-300">{zh ? '城市灯光 · 人口越多越亮' : 'CITY LIGHTS · POPULATION WEIGHTED'}</span></div>
    <div className="absolute bottom-3 right-3 z-20 rounded border border-cyan/15 bg-[#06121e]/85 px-2.5 py-1.5 text-[7px] text-slate-400">{zh ? '白天 → 黄昏 → 暮光 → 黑夜 · 每分钟更新' : 'DAY → SUNSET → TWILIGHT → NIGHT · 1 MIN UPDATE'}</div>
  </section>
}

function RobotCenter({ zh }: { zh: boolean }) {
  const ranking = [
    { rank: '01', name: zh ? '辰龙' : 'Dragon', icon: '🐲', score: 92, change: '+18.6%', color: '#4ee78d' },
    { rank: '02', name: zh ? '寅虎' : 'Tiger', icon: '🐯', score: 88, change: '+12.3%', color: '#f7c84b' },
    { rank: '12', name: zh ? '未羊' : 'Goat', icon: '🐑', score: 41, change: '-4.8%', color: '#ff5368' },
  ]
  const agents = [
    ['🐭', zh ? '子鼠' : 'Rat', 'active'], ['🐮', zh ? '丑牛' : 'Ox', 'active'], ['🐯', zh ? '寅虎' : 'Tiger', 'active'],
    ['🐰', zh ? '卯兔' : 'Rabbit', 'active'], ['🐲', zh ? '辰龙' : 'Dragon', 'active'], ['🐍', zh ? '巳蛇' : 'Snake', 'active'],
    ['🐴', zh ? '午马' : 'Horse', 'active'], ['🐑', zh ? '未羊' : 'Goat', 'training'], ['🐵', zh ? '申猴' : 'Monkey', 'active'],
    ['🐔', zh ? '酉鸡' : 'Rooster', 'active'], ['🐶', zh ? '戌狗' : 'Dog', 'watch'], ['🐷', zh ? '亥猪' : 'Pig', 'watch'],
  ] as const
  return <section className="mxdai-panel flex min-h-0 flex-col rounded-md">
    <PanelTitle icon={Bot} title={zh ? '机器人控制中心 · 模拟' : 'ROBOT CONTROL · PAPER'} action={zh ? '12 个智能体' : '12 AGENTS'}/>
    <div className="grid grid-cols-3 gap-1.5 p-2 pb-1.5">{ranking.map((agent) => <div key={agent.rank} className="ranking-agent" title={agent.name} aria-label={`${agent.name} rank ${agent.rank} ${agent.change}`}><div className="agent-dial" style={{ '--agent-value': `${agent.score}%`, '--agent-color': agent.color } as React.CSSProperties}><div><span>{agent.icon}</span><b>{agent.score}</b></div></div><div className="mt-1 flex items-center gap-1.5 font-mono"><span className="text-[6px] text-slate-600">R{agent.rank}</span><span className={`text-[7px] ${agent.change.startsWith('+') ? 'text-positive' : 'text-negative'}`}>{agent.change}</span></div></div>)}</div>
    <div className="flex items-center px-2 py-1 text-[7px]"><span className="font-semibold text-slate-300">{zh ? '十二生肖智能体' : 'ZODIAC AGENTS'}</span><span className="ml-2 rounded bg-positive/10 px-1.5 py-0.5 text-positive">9 {zh ? '运行' : 'ACTIVE'}</span><span className="ml-1 rounded bg-warning/10 px-1.5 py-0.5 text-warning">2 {zh ? '观察' : 'WATCH'}</span><span className="ml-1 rounded bg-negative/10 px-1.5 py-0.5 text-negative">1 {zh ? '训练' : 'TRAIN'}</span></div>
    <div className="grid grid-cols-6 gap-1 px-2 pb-2">{agents.map(([icon, name, status]) => <button key={name} className={`zodiac-agent ${status === 'training' ? 'zodiac-training' : status === 'watch' ? 'zodiac-watch' : ''}`} aria-label={`${name} ${status}`} title={name}><span className="zodiac-icon">{icon}</span><i/></button>)}</div>
    <div className="mt-auto grid grid-cols-3 gap-1.5 border-t border-[#172738] p-2"><button className="mxdai-action"><Bot size={11}/>{zh ? '智能体管理' : 'AGENTS'}</button><button className="mxdai-action"><ListChecks size={11}/>{zh ? '任务管理' : 'TASKS'}</button><button className="mxdai-action"><Zap size={11}/>{zh ? '模拟榜单' : 'PAPER RANK'}</button></div>
  </section>
}

function Opportunities({ assets, zh }: { assets: CryptoAsset[]; zh: boolean }) {
  const dualListed = assets.filter((asset) => asset.dataMode === 'live' && asset.binanceAvailable && asset.okxAvailable)
  const opportunities = (dualListed.length >= 4 ? dualListed : assets.filter((asset) => asset.dataMode === 'live')).slice().sort((a,b) => b.aiScore - a.aiScore).slice(0, 4)
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={Zap} title={zh ? 'AI 机会推荐 · 双所' : 'AI OPPORTUNITIES · DUAL'} action={zh ? '更多机会' : 'MORE'}/><div className="mxdai-table"><div className="mxdai-row mxdai-head"><span>{zh ? '机会' : 'Asset'}</span><span>{zh ? '方向' : 'Bias'}</span><span>{zh ? '置信度' : 'Score'}</span><span>24H</span></div>{opportunities.map((asset) => <div key={asset.id} className="mxdai-row"><span className="font-medium text-slate-200">{asset.symbol} {zh ? '现货机会' : 'spot'}</span><span className={asset.signal === 'BUY' ? 'text-positive' : asset.signal === 'SELL' ? 'text-negative' : 'text-warning'}>{asset.signal}</span><span className="font-mono text-slate-300">{asset.aiScore}%</span><span className={asset.change24h >= 0 ? 'text-positive' : 'text-negative'}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</span></div>)}</div></section>
}

function Watchlist({ assets, zh }: { assets: CryptoAsset[]; zh: boolean }) {
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={Star} title={zh ? '自选清单' : 'WATCHLIST'} action={zh ? '管理' : 'MANAGE'}/><div className="mxdai-table"><div className="mxdai-row watch mxdai-head"><span>{zh ? '资产' : 'Asset'}</span><span>{zh ? '价格' : 'Price'}</span><span>24H</span><span/></div>{assets.slice(0,4).map((asset) => <div key={asset.id} className="mxdai-row watch"><span className="font-medium text-slate-200">{asset.symbol}/USDT</span><span className="font-mono text-slate-300">{formatPrice(asset.price)}</span><span className={asset.change24h >= 0 ? 'text-positive' : 'text-negative'}>{asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%</span><Star size={9} className="fill-warning text-warning"/></div>)}</div></section>
}

function FundTracker({ zh }: { zh: boolean }) {
  const rings = [[zh ? '模拟总资金' : 'Paper total', '¥1,000,000', 100, 'blue'], [zh ? '策略占用' : 'Allocated', '¥0', 0, 'orange'], [zh ? '可用余额' : 'Available', '¥1,000,000', 100, 'green']]
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={CircleDollarSign} title={zh ? '资金跟踪 · 模拟' : 'FUND TRACKING · PAPER'} action={zh ? '资金分析' : 'ANALYSIS'}/><div className="flex h-[calc(100%-36px)] items-center justify-around px-2">{rings.map(([label,value,pct,tone]) => <div key={String(label)} className="text-center"><div className={`fund-ring ring-${tone}`} style={{ '--ring-value': `${pct}%` } as React.CSSProperties}><div><b>{value}</b><span>{pct}%</span></div></div><div className="mt-1 text-[7px] text-slate-500">{label}</div></div>)}</div></section>
}

function MediaFlow({ zh }: { zh: boolean }) {
  const media = [['X', 68, 'cyan'], ['Reddit', 54, 'orange'], [zh ? '新闻' : 'News', 72, 'blue'], [zh ? '链上' : 'Onchain', 61, 'purple']]
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={Activity} title={zh ? '媒体情绪流' : 'MEDIA SENTIMENT FLOW'} action={zh ? '更多' : 'MORE'}/><div className="grid grid-cols-4 gap-2 px-3 pt-2.5">{media.map(([name,score,tone]) => <div key={String(name)}><div className="flex items-center justify-between text-[7px]"><span className="text-slate-300">{name}</span><span className="text-slate-500">{score}%</span></div><div className="mt-1 h-1 rounded bg-slate-800"><div className={`h-full rounded sentiment-${tone}`} style={{width:`${score}%`}}/></div></div>)}</div><svg className="mt-2 h-[55px] w-full px-3" viewBox="0 0 340 55" preserveAspectRatio="none"><path d="M0 43C30 40 42 29 73 34S125 40 151 25 207 31 236 16 286 21 340 8" fill="none" stroke="#36d9d5" strokeWidth="1.4"/><path d="M0 43C30 40 42 29 73 34S125 40 151 25 207 31 236 16 286 21 340 8V55H0Z" fill="url(#mediaFill)"/><defs><linearGradient id="mediaFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#36d9d5" stopOpacity=".18"/><stop offset="1" stopColor="#36d9d5" stopOpacity="0"/></linearGradient></defs></svg></section>
}

function EventTimeline({ zh }: { zh: boolean }) {
  const events = [['14:30', zh ? '美国就业数据发布窗口' : 'US employment data window', zh ? '重要事件' : 'IMPORTANT'], ['13:45', zh ? 'BTC 关键价位波动提醒' : 'BTC key-level volatility alert', zh ? '市场异动' : 'VOLATILITY'], ['12:30', zh ? '双源行情价差恢复正常' : 'Dual-source spread normalized', zh ? '行情状态' : 'FEED']]
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={Clock3} title={zh ? 'AI 事件时间轴' : 'AI EVENT TIMELINE'} action={zh ? '更多' : 'MORE'}/><div className="relative px-3 py-2 before:absolute before:bottom-2 before:left-[43px] before:top-2 before:w-px before:bg-[#295c91]">{events.map(([time,title,tag]) => <div key={String(time)} className="relative flex h-[31px] items-center text-[7px]"><span className="w-9 font-mono text-slate-300">{time}</span><i className="z-10 mr-2 h-1.5 w-1.5 rounded-full bg-[#4b9fff] shadow-[0_0_6px_#4b9fff]"/><span className="min-w-0 flex-1 truncate text-slate-400">{title}</span><span className="ml-1 rounded bg-[#23497b]/40 px-1.5 py-1 text-[#83b8ff]">{tag}</span></div>)}</div></section>
}

function SafetyOverview({ zh }: { zh: boolean }) {
  return <section className="mxdai-panel min-h-0 overflow-hidden rounded-md"><PanelTitle icon={ShieldCheck} title={zh ? '账户与安全状态' : 'ACCOUNT & SECURITY'} action={zh ? '安全中心' : 'SECURITY'}/><div className="grid grid-cols-[1fr_1.15fr] gap-2 p-2"><div className="space-y-1.5">{[[zh?'Binance 公开行情':'Binance public feed','ONLINE'],[zh?'OKX 公开行情':'OKX public feed','ONLINE'],[zh?'交易 API':'Trading API','NONE'],[zh?'提现权限':'Withdrawals','LOCKED']].map(([label,status]) => <div key={label} className="flex items-center text-[7px]"><span className="h-1.5 w-1.5 rounded-full bg-positive"/><span className="ml-1.5 text-slate-500">{label}</span><span className={`ml-auto font-mono ${status === 'ONLINE' ? 'text-positive' : 'text-warning'}`}>{status}</span></div>)}</div><div className="rounded border border-positive/15 bg-positive/[.035] p-2"><div className="flex items-center gap-1.5 text-[8px] text-positive"><LockKeyhole size={10}/>{zh ? '安全演示模式' : 'SAFE DEMO MODE'}</div><p className="mb-0 mt-1 text-[7px] leading-3 text-slate-500">{zh ? '未填写密钥 · 未连接账户 · 禁止真实下单' : 'NO KEYS · NO ACCOUNT · NO LIVE ORDERS'}</p></div></div></section>
}

export function GlobalIntelligenceDashboard({ assets, language }: { assets: CryptoAsset[]; language: AppLanguage }) {
  const zh = language === 'zh'
  return <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.86fr)_minmax(280px,.92fr)] grid-rows-[minmax(286px,1.52fr)_minmax(160px,.72fr)_minmax(145px,.66fr)_28px] gap-2">
    <RiskMap zh={zh}/>
    <RobotCenter zh={zh}/>
    <div className="grid min-h-0 grid-cols-2 gap-2"><Opportunities assets={assets} zh={zh}/><Watchlist assets={assets} zh={zh}/></div>
    <FundTracker zh={zh}/>
    <div className="grid min-h-0 grid-cols-[1.08fr_.92fr] gap-2"><MediaFlow zh={zh}/><EventTimeline zh={zh}/></div>
    <SafetyOverview zh={zh}/>
    <div className="mxdai-panel col-span-2 flex min-w-0 items-center overflow-hidden rounded-md px-2 text-[7px]"><span className="mr-3 rounded bg-gradient-to-r from-[#b42232] to-[#67202d] px-3 py-1.5 font-semibold text-white">{zh ? '市场快讯' : 'MARKET NEWS'}</span><span className="truncate text-slate-400"><b className="mr-2 font-mono text-slate-300">14:25</b>{zh ? 'BTC 与 ETH 双源公开行情在线，系统处于只读演示模式' : 'BTC and ETH public dual-source feeds online; system remains read-only'}</span><span className="mx-4 text-[#243545]">|</span><span className="truncate text-slate-500"><b className="mr-2 font-mono text-slate-400">14:20</b>{zh ? '机器人实盘权限未启用' : 'Live robot permissions are disabled'}</span><button className="ml-auto shrink-0 px-2 text-[#4097ff]">{zh ? '更多快讯' : 'MORE'} ›</button></div>
  </div>
}
