export type AssetRow={asset:string;instrument:string;low:number|null;high:number|null;action:string;status:string|null}
export function cryptoKind(row:Pick<AssetRow,'asset'|'instrument'>):'direct'|'fund'|'related'|null{
 const name=(row.asset+' '+(row.instrument||'')).toLowerCase()
 if(/bitcoin|ethereum|crypto|digital currency/.test(name)){if(/etf|trust|fund/.test(name))return 'fund';if(/\binc\b|\bcorp\b|\bstock\b/.test(name))return 'related';return 'direct'}
 if(/coinbase|microstrategy|strategy inc|riot platforms|mara holdings|marathon digital|cleanspark/.test(name))return 'related'
 return null
}
export const cryptoLabel=(kind:ReturnType<typeof cryptoKind>)=>kind==='direct'?'直接加密资产':kind==='fund'?'加密ETF / 基金':kind==='related'?'加密相关公司股票':'其他资产'
function category(row:AssetRow){const crypto=cryptoKind(row);if(crypto)return cryptoLabel(crypto);const name=(row.asset+' '+row.instrument).toLowerCase();if(/\[op\]|option|\bcall\b|\bput\b/.test(name))return '期权';if(/etf|fund|trust/.test(name))return 'ETF / 基金';if(/bond|treasury|municipal|rev ser|notes due/.test(name))return '债券';if(/stock|common|corp|inc\.|shares/.test(name))return '股票';return '其他 / 未分类'}
const yi=(value:number)=>`${value.toLocaleString('en-US',{maximumFractionDigits:2})} 美元`
export function AssetStructure({trades,title}:{trades:AssetRow[];title:string}){
 const rows=trades.filter(t=>t.status!=='Deleted'&&['purchase','sale'].includes(t.action))
 const groups=new Map<string,{low:number;high:number;n:number;missing:number}>()
 for(const t of rows){const key=category(t);const item=groups.get(key)||{low:0,high:0,n:0,missing:0};item.low+=t.low||0;item.high+=t.high||0;item.n++;if(t.low==null||t.high==null)item.missing++;groups.set(key,item)}
 const low=rows.reduce((s,t)=>s+(t.low||0),0),high=rows.reduce((s,t)=>s+(t.high||0),0)
 return <section className="pr-valuation"><div className="pr-valuation-head"><div><small>{title} · 金额单位：美元</small><h3>半年交易规模结构</h3><p>年度资产请查看个人资产申报；本区域只统计交易金额。</p></div><div><small>半年已披露买卖规模区间</small><strong>{yi(low)} — {yi(high)}</strong><p>买入＋卖出累计披露金额；不代表持仓或总资产</p></div></div><div className="pr-structure">{Array.from(groups.entries()).sort((a,b)=>b[1].low-a[1].low).map(([key,g])=><div key={key}><div><span>{key}</span><span>{yi(g.low)} — {yi(g.high)}</span></div><div className="pr-structure-track"><i style={{width:`${low?g.low/low*100:0}%`}}/></div><small>{g.n} 条记录 · 金额下限占比 {low?(g.low/low*100).toFixed(1):'0'}%{g.missing?` · ${g.missing}条金额缺失`:''}</small></div>)}</div><p className="pr-explainer">结构按申报买卖金额下限计算占比；非实时持仓结构。修订可能重述交易，请结合原件核验。</p></section>
}
