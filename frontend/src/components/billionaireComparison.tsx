import { comparisonHistory as history } from './billionaireData'
import { useBillionaireMoney } from './billionaireMoney'
const records=new Map(history.entries.map(p=>[p.id,p]))
export const comparisonPeriod=`${history.from} → ${history.to}（${history.days}天）`
export const comparisonFor=(id:string)=>records.get(id)
export function BillionaireChange({id,detail=false}:{id:string;detail?:boolean}){
 const {money}=useBillionaireMoney(),entry=records.get(id)
 if(!entry||entry.previousRank==null||entry.rankChange==null||entry.worthChangeUsd==null)return <small className="bb-change-missing">历史同身份资料不足，不补算变化</small>
 const rank=entry.rankChange>0?`↑${entry.rankChange}名`:entry.rankChange<0?`↓${Math.abs(entry.rankChange)}名`:'排名持平',amount=`${entry.worthChangeUsd>0?'+':''}${money(entry.worthChangeUsd)}`
 return <div className={detail?'bb-history-detail':'bb-card-change'} title={`${comparisonPeriod}；估值变化 ${entry.worthChangeUsd.toLocaleString('en-US')}美元；不是投资收益`}>
 {detail&&<small>真实快照对比：{comparisonPeriod}</small>}<span className={entry.rankChange>0?'bb-change-up':entry.rankChange<0?'bb-change-down':''}>{rank}</span><span className={entry.worthChangeUsd>0?'bb-change-up':entry.worthChangeUsd<0?'bb-change-down':''}>{detail?'估值变化 ':''}{amount}</span>{detail&&<><span>变化率 {entry.worthChangePct?.toFixed(2)}% · 上期美国排名 #{entry.previousRank}</span><a href={history.source} target="_blank" rel="noreferrer">上期快照来源 ↗</a><small>比较当前榜单人物的两个估值，不代表已实现收益；不推断变化原因。</small></>}
 </div>
}
