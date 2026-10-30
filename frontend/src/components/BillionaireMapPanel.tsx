import { useBillionaireMoney } from './billionaireMoney'
import { useEffect, useState, type ReactNode } from 'react'
import { wealthSnapshot as wealth } from './billionaireData'
import { BillionaireDetails, billionaireName, BillionairePhoto, portraitFor } from './BillionaireBoard'
import { billionaireState, stateCoverage, stateDistribution } from './billionaireLocations'
import { states } from './politicalAtlasModel'
export function BillionaireMapPanel({region,onRegion,controls}:{region:string;onRegion:(code:string)=>void;controls:ReactNode}){
 const {money}=useBillionaireMoney()
 const [selected,setSelected]=useState<string|null>(null)
 useEffect(()=>setSelected(null),[region])
 const people=wealth.people.filter(p=>region==='all'||billionaireState(p.id)===region),person=wealth.people.find(p=>p.id===selected)
 return <><div className="ca-panel-heading"><div><small>US TOP 500 / PUBLIC STATE RECORDS</small><h2>{region==='all'?'美国富豪州分布':states[region]?.[1]||region}</h2></div><span>{people.length}人</span></div>{controls}{person?<BillionaireDetails person={person} onClose={()=>setSelected(null)}/>:<div className="ca-panel-body"><p className="ca-wealth-note">{wealth.date}财富榜 · {stateCoverage}/500人有可归州档案。州资料可能滞后，不能当成实时位置或居住偏好。</p>{region==='all'&&<div className="ca-wealth-ranking">{stateDistribution.slice(0,5).map(([code,n],i)=><button key={code} onClick={()=>onRegion(code)}>{i+1}. {states[code][1]} <b>{n}人</b></button>)}</div>}<div className="ca-person-list">{people.map(p=><button className="ca-person-row" key={p.id} onClick={()=>setSelected(p.id)}><span className="bb-rank">{p.rank}</span><BillionairePhoto src={portraitFor(p.id,p.photo)} name={p.name}/><div><b>{billionaireName(p.id,p.name)}</b>{billionaireName(p.id,p.name)!==p.name&&<small>{p.name}</small>}<strong>{money(p.worthUsd)}</strong><small>{p.companies.join(' / ')}</small></div><span className="ca-row-arrow">›</span></button>)}</div>{!people.length&&<p className="ca-empty">前500榜单中暂无可归到该州的公开记录，不代表该州没有富豪。</p>}</div>}<footer className="ca-panel-footer">数字仅为该榜单公开居住州人数 · 不与官员资产合计</footer></>
}
