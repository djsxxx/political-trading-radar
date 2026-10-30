import { Activity, BellRing, Bot, ChartCandlestick, ChevronDown, CircleGauge, Coins, Gauge, Landmark, Newspaper, SearchCheck, Settings, ShieldCheck, WalletCards } from 'lucide-react'
import type { AppLanguage, ViewId } from '../types'

const navItems = [
  { id: 'dashboard' as const, en: 'Decision Center', zh: '决策中心', icon: CircleGauge, childrenZh: [], childrenEn: [] },
  { id: 'funds' as const, en: 'Crypto Assets', zh: '加密货币', icon: Coins, childrenZh: ['账户总览', '现货资金', '24H 挂单'], childrenEn: ['Account overview', 'Spot funds', '24H orders'] },
  { id: 'scanner' as const, en: 'Market Watch', zh: '市场观察', icon: ChartCandlestick, childrenZh: ['市场总览', '现货市场', 'DeFi 生态'], childrenEn: ['Market overview', 'Spot market', 'DeFi ecosystem'] },
  { id: 'markets' as const, en: 'Macro Markets', zh: '贵金属 · 农产品', icon: Landmark, childrenZh: ['贵金属', '农产品'], childrenEn: ['Metals', 'Agriculture'] },
  { id: 'signals' as const, en: 'Strategy Signals', zh: '策略信号', icon: Activity, childrenZh: [], childrenEn: [] },
  { id: 'bots' as const, en: 'Robot Management', zh: '机器人管理', icon: Bot, childrenZh: ['机器人总览', '任务管理', '运行日志'], childrenEn: ['Robot overview', 'Task manager', 'Run logs'] },
  { id: 'research' as const, en: 'AI Review', zh: '复盘与归因', icon: SearchCheck, childrenZh: ['K线与判断', '依据与反证'], childrenEn: ['Candles & judgement', 'Evidence & counter'] },
  { id: 'risk' as const, en: 'Risk Control', zh: '风险控制', icon: ShieldCheck, childrenZh: [], childrenEn: [] },
  { id: 'alerts' as const, en: 'Media & Alerts', zh: '媒体与预警', icon: Newspaper, childrenZh: ['新闻快讯', '预警中心'], childrenEn: ['News feed', 'Alert center'] },
  { id: 'audit' as const, en: 'Decision Audit', zh: '决策审计', icon: Gauge, childrenZh: [], childrenEn: [] },
  { id: 'economy' as const, en: 'Agent Economy', zh: '智能体经济', icon: WalletCards, childrenZh: [], childrenEn: [] },
]

export function Sidebar({ activeView, onNavigate, alertCount, onlineCount, language }: { activeView: ViewId; onNavigate: (view: ViewId) => void; alertCount: number; onlineCount: number; language: AppLanguage }) {
  const zh = language === 'zh'
  return <aside className="flex w-[178px] shrink-0 flex-col overflow-hidden border-r border-[#172331] bg-[#080e15] px-2 py-2">
    <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
      {navItems.map(({ id, en, zh: zhLabel, icon: Icon, childrenZh, childrenEn }) => {
        const active = id === activeView
        const children = zh ? childrenZh : childrenEn
        return <div key={id}>
          <button onClick={() => onNavigate(id)} className={`group flex h-[30px] w-full items-center gap-2 rounded-md border px-2.5 text-left text-[9px] transition ${active ? 'border-[#8d3038] bg-gradient-to-r from-[#722630] to-[#4b1d27] text-white shadow-[inset_0_1px_rgba(255,255,255,.05)]' : 'border-transparent text-slate-500 hover:bg-white/[0.035] hover:text-slate-200'}`}>
            <Icon size={12} strokeWidth={1.8}/><span className="flex-1 font-medium">{zh ? zhLabel : en}</span>
            {id === 'alerts' && alertCount > 0 && <span className="rounded bg-negative/15 px-1 font-mono text-[7px] text-negative">{alertCount}</span>}
            {children.length > 0 && <ChevronDown size={9} className={active ? '' : '-rotate-90'}/>} 
          </button>
          {children.length > 0 && (active || id === 'scanner' || id === 'bots') && <div className="ml-[17px] border-l border-[#1e2b38] py-0.5 pl-3">
            {children.map((child, index) => <button key={child} onClick={() => onNavigate(id)} className={`block h-[21px] w-full truncate text-left text-[8px] ${active && index === 0 ? 'text-cyan' : 'text-slate-600 hover:text-slate-300'}`}>{child}</button>)}
          </div>}
        </div>
      })}
    </nav>

    <div className="mt-1 border-t border-[#172331] pt-1.5">
      <button onClick={() => onNavigate('settings')} className={`flex h-8 w-full items-center gap-2 rounded-md border px-2.5 text-[9px] ${activeView === 'settings' ? 'border-cyan/20 bg-cyan/10 text-cyan' : 'border-transparent text-slate-500 hover:bg-white/[.035] hover:text-white'}`}><Settings size={12}/><span>{zh ? '设置' : 'Settings'}</span><BellRing size={9} className="ml-auto text-negative"/></button>
      <div className="mt-1.5 flex items-center rounded-md border border-[#172331] bg-[#0b131c] px-2.5 py-2"><span className="h-2 w-2 rounded-full bg-positive shadow-[0_0_7px_#23d9a4]"/><div className="ml-2"><div className="text-[8px] text-slate-300">{zh ? '系统状态 · 正常' : 'SYSTEM · NORMAL'}</div><div className="mt-0.5 font-mono text-[7px] text-slate-600">{onlineCount} {zh ? '项监控' : 'monitors'} · Mac</div></div></div>
    </div>
  </aside>
}
