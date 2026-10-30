import { Activity, Clock3, Pause, Play, RefreshCw } from 'lucide-react'
import { AlertCenter } from './components/AlertCenter'
import { AssetScanner } from './components/AssetScanner'
import { Sidebar } from './components/Sidebar'
import { TopMarketBar } from './components/TopMarketBar'
import { AccuracyCenter } from './components/AccuracyCenter'
import { MacroMarketMonitor } from './components/MacroMarketMonitor'
import { StrategySignalCenter } from './components/StrategySignalCenter'
import { BotObserver } from './components/BotObserver'
import { AgentEconomyCenter } from './components/AgentEconomyCenter'
import { RiskControlCenter } from './components/RiskControlCenter'
import { FeedStatus } from './components/FeedStatus'
import { GlobalIntelligenceDashboard } from './components/GlobalIntelligenceDashboard'
import { SettingsCenter } from './components/SettingsCenter'
import { PortfolioCenter } from './components/PortfolioCenter'
import { AssetResearch } from './components/AssetResearch'
import { useMarketSimulation } from './hooks/useMarketSimulation'
import { useEffect, useState } from 'react'
import type { AppLanguage, ViewId } from './types'
import { PoliticalRadar } from './components/PoliticalRadar'

const viewNames: Record<ViewId, { en: [string, string]; zh: [string, string] }> = {
  dashboard: { en: ['Command Center', 'GLOBAL CRYPTO INTELLIGENCE'], zh: ['指挥中心', '全球加密资产情报'] },
  funds: { en: ['Funds Center', 'OKX · BINANCE · POSITIONS · ORDERS · SAFETY'], zh: ['资金中心', 'OKX · BINANCE · 持仓 · 挂单 · 安全'] },
  research: { en: ['Asset Research', 'CANDLES · AI JUDGEMENT · EVIDENCE · REVIEW'], zh: ['复盘与归因', 'K线 · AI判断 · 证据 · 反证 · 复盘'] },
  scanner: { en: ['Crypto Asset Scanner', '200 COINS · SMART 30/50 · CUSTOM'], zh: ['加密资产扫描', '200 币种 · 智能筛选 · 自选'] },
  markets: { en: ['Agriculture & Metals', 'LEADING DRIVERS · WEATHER RISK · CROSS-MARKET'], zh: ['农产品与金属', '驱动因素 · 天气风险 · 跨市场'] },
  signals: { en: ['Dual Strategy Signals', 'SHORT 5M–4H · SWING 1–7D'], zh: ['双周期策略信号', '短线 5M–4H · 波段 1–7D'] },
  bots: { en: ['Strategy Bot Observer', '20 REFERENCES · PUBLIC + ACCOUNT READ-ONLY'], zh: ['策略机器人观察', '20 个来源 · 公开 + 账户只读'] },
  economy: { en: ['Agent Economy', 'CREDIT · RESOURCE BUDGET · VERIFIED CONTRIBUTION'], zh: ['智能体经济', '信用 · 资源预算 · 验证贡献'] },
  risk: { en: ['Leverage Risk Engine', '1×–10× · MARGIN CAP · LIQUIDATION PENALTIES'], zh: ['杠杆风险引擎', '1×–10× · 保证金上限 · 强平惩罚'] },
  audit: { en: ['Decision Audit & Accuracy', 'HIT RATE · LEAD TIME · RETURN · DRAWDOWN'], zh: ['决策审计与准确率', '命中率 · 领先时间 · 收益 · 回撤'] },
  alerts: { en: ['Alert Center', 'COMPOSITE RULES · COOLDOWN · ACKNOWLEDGEMENT'], zh: ['预警中心', '组合规则 · 冷却 · 确认'] },
  settings: { en: ['Settings', 'LANGUAGE · INTERFACE · LOCAL PREFERENCES'], zh: ['设置', '语言 · 界面 · 本地偏好'] }
}

function App() {
  const [political, setPolitical] = useState(true)
  const [activeView, setActiveView] = useState<ViewId>('dashboard')
  const [language, setLanguage] = useState<AppLanguage>(() => localStorage.getItem('financial-ai-os-language') === 'en' ? 'en' : 'zh')
  const [selectedAsset, setSelectedAsset] = useState<import('./types').CryptoAsset | null>(null)
  const market = useMarketSimulation()
  const title = viewNames[activeView][language]
  useEffect(() => { localStorage.setItem('financial-ai-os-language', language); document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en' }, [language])
  const openResearch = (asset: import('./types').CryptoAsset) => { setSelectedAsset(asset); setActiveView('research') }
  const researchAsset = selectedAsset ?? market.assets.find((asset) => asset.dataMode === 'live') ?? market.assets[0]
  if (political) return <PoliticalRadar onLegacy={() => setPolitical(false)}/>
  return <div className="flex h-full min-h-[720px] flex-col bg-canvas">
    <button onClick={()=>setPolitical(true)} className="px-3 py-1 text-left text-xs text-cyan">打开政治人物交易雷达</button>
    <TopMarketBar assets={market.assets} feed={market.feed} language={language}/>
    <div className="flex min-h-0 flex-1"><Sidebar activeView={activeView} onNavigate={setActiveView} alertCount={market.stats.newAlerts} onlineCount={market.stats.online} language={language}/>
      <main className={`subtle-grid flex min-w-0 flex-1 flex-col overflow-hidden ${activeView === 'dashboard' ? 'p-2' : 'gap-2 p-2.5'}`}>
        {activeView !== 'dashboard' && <div className="flex h-7 shrink-0 items-center"><div><h1 className="m-0 text-[12px] font-semibold tracking-wide text-slate-100">{title[0]}</h1><p className="m-0 text-[7px] tracking-wider text-slate-600">{title[1]}</p></div><div className="ml-auto flex items-center gap-3 text-[8px] text-slate-600"><FeedStatus feed={market.feed} live={market.stats.live} verified={market.stats.verified}/><span className="flex items-center gap-1.5"><Activity size={10} className="text-positive"/>{market.stats.online}</span><span className="flex items-center gap-1.5"><Clock3 size={10}/>{Math.max(0, Math.round((Date.now() - market.lastUpdated) / 1000))}S</span><button onClick={() => market.setStreaming(!market.streaming)} className={`flex items-center gap-1 rounded border px-2 py-1 ${market.streaming ? 'border-positive/20 text-positive' : 'border-warning/30 text-warning'}`}>{market.streaming ? <Pause size={9}/> : <Play size={9}/>} {market.streaming ? 'LIVE' : 'PAUSED'}</button><button className="rounded border border-line p-1.5 hover:text-white" aria-label="Refresh"><RefreshCw size={9}/></button></div></div>}
        {activeView === 'dashboard' && <GlobalIntelligenceDashboard assets={market.assets} language={language}/>} 
        {activeView === 'funds' && <PortfolioCenter assets={market.assets} language={language} onOpenResearch={openResearch}/>} 
        {activeView === 'research' && researchAsset && <AssetResearch asset={researchAsset} language={language} onBack={() => setActiveView('funds')}/>} 
        {activeView === 'scanner' && <AssetScanner assets={market.assets} monitorMode={market.monitorMode} onMonitorModeChange={market.setMonitorMode} onToggleFavorite={market.toggleFavorite}/>} 
        {activeView === 'markets' && <MacroMarketMonitor/>}
        {activeView === 'signals' && <StrategySignalCenter/>}
        {activeView === 'bots' && <BotObserver/>}
        {activeView === 'economy' && <AgentEconomyCenter/>}
        {activeView === 'risk' && <RiskControlCenter/>}
        {activeView === 'audit' && <AccuracyCenter/>}
        {activeView === 'alerts' && <AlertCenter alerts={market.alerts} rules={market.rules} onToggleRule={market.toggleRule} onAcknowledge={market.acknowledgeAlert}/>} 
        {activeView === 'settings' && <SettingsCenter language={language} onLanguageChange={setLanguage}/>} 
      </main>
    </div>
    <footer className="flex h-5 shrink-0 items-center border-t border-line/80 bg-[#080c11] px-3 font-mono text-[7px] tracking-wider text-slate-700"><span className="text-positive">●</span><span className="ml-1.5">{language === 'zh' ? '系统状态 · 正常' : 'SYSTEM · NORMAL'}</span><span className="mx-3">|</span><span>{language === 'zh' ? '公开实时行情 · 模拟执行 · 禁止真实下单' : 'PUBLIC LIVE FEEDS · PAPER EXECUTION · NO LIVE ORDERS'}</span><span className="ml-auto">OKX + BINANCE · {market.stats.live} LIVE</span></footer>
  </div>
}
export default App
