import { ShieldAlert, TriangleAlert } from 'lucide-react'

const tiers = [
  { x: '1×', label: '现货 / 低风险', condition: '默认允许', margin: '按策略仓位', color: 'text-positive border-positive/25 bg-positive/5' },
  { x: '2×', label: '杠杆风险', condition: '仅A级以上', margin: '风险预算约束', color: 'text-warning border-warning/25 bg-warning/5' },
  { x: '3×', label: '高风险', condition: '仅A+且长期复盘达标', margin: '风险预算约束', color: 'text-orange-400 border-orange-400/25 bg-orange-400/5' },
  { x: '5×', label: '极高风险', condition: 'A+、小额、逐仓、人工规则许可', margin: '随杠杆降低', color: 'text-negative border-negative/25 bg-negative/5' },
  { x: '10×', label: '可能快速强平', condition: '自动交易最高上限', margin: '总资金≤5%（1/20）', color: 'text-red-400 border-red-500/35 bg-red-500/10' }
]

export function RiskControlCenter() {
  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    <section className="panel flex h-[76px] shrink-0 items-center rounded-lg px-4"><ShieldAlert size={20} className="mr-3 text-negative"/><div><div className="text-[11px] font-semibold tracking-[.12em]">LEVERAGE & TRUST RISK ENGINE</div><div className="mt-1 text-[8px] text-slate-600">杠杆不会提高判断准确率；仓位由最大可承受损失倒推</div></div><div className="ml-auto rounded border border-red-500/35 bg-red-500/10 px-3 py-2 font-mono text-[9px] text-red-400">AUTO LEVERAGE CAP · 10×</div></section>
    <section className="grid shrink-0 grid-cols-5 gap-3">{tiers.map((tier) => <article key={tier.x} className={`rounded-lg border p-4 ${tier.color}`}><div className="font-mono text-2xl font-bold">{tier.x}</div><div className="mt-2 text-[9px] font-semibold">{tier.label}</div><div className="mt-3 text-[8px] leading-4 text-slate-500">{tier.condition}</div><div className="mt-2 border-t border-current/10 pt-2 text-[8px]">保证金：{tier.margin}</div></article>)}</section>
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
      <section className="panel rounded-lg p-4"><div className="text-[10px] font-semibold tracking-[.12em]">10× 下单硬规则</div><div className="mt-4 grid grid-cols-2 gap-3 text-[9px]"><Box title="保证金上限" value="账户总额 5%" note="10倍后名义仓位最高为总额50%"/><Box title="单笔计划亏损" value="账户总额 ≤0.5%" note="由止损距离倒推保证金"/><Box title="保证金模式" value="只允许逐仓" note="避免一笔交易拖累整个账户"/><Box title="止损要求" value="远早于强平价" note="禁止把强平当止损"/></div><div className="mt-4 flex items-start gap-2 rounded border border-negative/20 bg-negative/5 p-3 text-[8px] leading-5 text-negative"><TriangleAlert size={13} className="mt-0.5 shrink-0"/>金额很低不等于风险消失。系统同时检查名义仓位、止损距离、流动性、滑点和强平安全空间。</div></section>
      <section className="panel rounded-lg p-4"><div className="text-[10px] font-semibold tracking-[.12em]">强平 → 信用自动降级</div><div className="mt-4 space-y-3"><Penalty count="1次 / 年" title="信用明显扣分" action="立即降低杠杆与资源预算" color="text-warning"/><Penalty count="2次 / 年" title="暂停5×以上自动交易" action="所有高杠杆订单转人工审核" color="text-orange-400"/><Penalty count="3次 / 年" title="取消当年自动杠杆权限" action="退回模拟验证，重新累计样本" color="text-negative"/></div><div className="mt-4 text-[8px] leading-5 text-slate-600">强平记录永久保留，不能通过更换策略名称清零。交易所故障或异常插针可进入人工复核，但不能由机器人自行豁免。</div></section>
    </div>
  </div>
}

function Box({ title, value, note }: { title: string; value: string; note: string }) { return <div className="rounded border border-line bg-black/15 p-3"><div className="text-[8px] text-slate-600">{title}</div><div className="mt-2 font-mono text-[13px] text-cyan">{value}</div><div className="mt-1 text-[8px] text-slate-600">{note}</div></div> }
function Penalty({ count, title, action, color }: { count: string; title: string; action: string; color: string }) { return <div className="grid grid-cols-[72px_1fr] rounded border border-line bg-black/15 p-3"><span className={`font-mono text-[10px] ${color}`}>{count}</span><div><div className="text-[9px] text-slate-300">{title}</div><div className="mt-1 text-[8px] text-slate-600">{action}</div></div></div> }
