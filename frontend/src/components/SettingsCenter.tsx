import { BellRing, Check, Info, Languages, Monitor, Server, ShieldCheck } from 'lucide-react'
import type { AppLanguage } from '../types'

export function SettingsCenter({ language, onLanguageChange }: { language: AppLanguage; onLanguageChange: (language: AppLanguage) => void }) {
  const zh = language === 'zh'
  return <section className="panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
    <div className="border-b border-line/70 px-6 py-5">
      <div className="flex items-center gap-3"><Languages className="text-cyan" size={19}/><div><h2 className="m-0 text-sm font-semibold text-slate-100">{zh ? '语言与界面' : 'Language & Interface'}</h2><p className="m-0 mt-1 text-[10px] text-slate-500">{zh ? '设置会保存在本机，重启后自动恢复' : 'Preferences are stored locally and restored after restart'}</p></div></div>
    </div>
    <div className="grid max-w-5xl grid-cols-2 gap-4 overflow-y-auto p-6">
      <div className="rounded-xl border border-line bg-black/20 p-5">
        <div className="mb-4 text-[10px] font-semibold tracking-[.15em] text-slate-400">{zh ? '界面语言' : 'INTERFACE LANGUAGE'}</div>
        <div className="grid grid-cols-2 gap-3">
          {([{ id: 'zh', label: '简体中文', sub: '中文' }, { id: 'en', label: 'English', sub: 'EN' }] as const).map((item) => <button key={item.id} onClick={() => onLanguageChange(item.id)} className={`flex items-center rounded-lg border p-4 text-left transition ${language === item.id ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-line bg-[#0b1118] text-slate-300 hover:border-slate-500'}`}><span className="grid h-8 w-8 place-items-center rounded-md bg-white/5 font-mono text-xs">{item.sub}</span><span className="ml-3 text-[11px] font-medium">{item.label}</span>{language === item.id && <Check className="ml-auto" size={15}/>}</button>)}
        </div>
      </div>
      <div className="rounded-xl border border-line bg-black/20 p-5">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[.15em] text-slate-400"><Server size={13} className="text-cyan"/>{zh ? '24H服务与通知' : '24H SERVICE & NOTIFICATIONS'}</div>
        <div className="space-y-3 text-[10px]"><div className="flex items-center gap-3 rounded-lg bg-[#0b1118] p-3"><Server className="text-warning" size={15}/><span>{zh ? '24H守望服务' : '24H watchtower'}</span><span className="ml-auto text-warning">{zh ? '规划中' : 'Planned'}</span></div><div className="flex items-center gap-3 rounded-lg bg-[#0b1118] p-3"><BellRing className="text-slate-500" size={15}/><span>{zh ? '手机安全推送' : 'Secure mobile push'}</span><span className="ml-auto text-slate-500">{zh ? '未配置' : 'Not configured'}</span></div></div>
      </div>
      <div className="rounded-xl border border-line bg-black/20 p-5">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[.15em] text-slate-400"><Info size={13} className="text-cyan"/>{zh ? '关于系统' : 'ABOUT SYSTEM'}</div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">{[[zh ? '产品' : 'Product','MXdai'],[zh ? '版本' : 'Version',window.financialAI?.version ?? '2.1.0'],[zh ? '运行模式' : 'Mode',zh ? '公开行情 / 模拟执行' : 'Public feeds / paper'],[zh ? '平台' : 'Platform',window.financialAI?.platform ?? 'darwin']].map(([label,value]) => <div key={label} className="rounded bg-[#0b1118] p-3"><div className="text-slate-600">{label}</div><div className="mt-1 font-mono text-slate-300">{value}</div></div>)}</div>
      </div>
      <div className="rounded-xl border border-line bg-black/20 p-5">
        <div className="mb-4 text-[10px] font-semibold tracking-[.15em] text-slate-400">{zh ? '系统状态' : 'SYSTEM STATUS'}</div>
        <div className="space-y-3 text-[10px]"><div className="flex items-center gap-3 rounded-lg bg-[#0b1118] p-3"><Monitor className="text-cyan" size={15}/><span>{zh ? 'Mac 桌面布局' : 'Mac desktop layout'}</span><span className="ml-auto text-positive">{zh ? '已启用' : 'Enabled'}</span></div><div className="flex items-center gap-3 rounded-lg bg-[#0b1118] p-3"><ShieldCheck className="text-positive" size={15}/><span>{zh ? '仅公开行情' : 'Public feeds only'}</span><span className="ml-auto text-positive">{zh ? '安全' : 'Safe'}</span></div></div>
      </div>
    </div>
  </section>
}
