import { useMemo, useState } from 'react'
import type { GeoProjection } from 'd3-geo'
import data from '../../public/compute-centers.json'
import './compute-centers.css'

export type ComputeStatus = 'operating' | 'building' | 'announced'
export type ComputeGroup = 'ai-operating' | 'ai-building' | 'ai-announced' | 'super'
export interface ComputeFilter { groups: Record<ComputeGroup, boolean> }
export interface ComputeSource { title: string; url: string }
export interface ComputeFacility {
  id: string; name: string; type: 'ai-gpu' | 'supercomputer'; status: ComputeStatus; origin: string
  operator: string; users: string | null; country: string; countryId: string; location: string; coordPrecision: string
  lat?: number; lon?: number
  h100eCurrent: number | null; h100ePlanned: number | null; chips: number | null; chipTypes: string | null
  powerMW: number | null; plannedPowerMW: number | null; commissioned: string | null; plannedOnline: string | null
  top500Rank?: number | null; rmaxPF?: number | null
  sourceLevel: string; sources: ComputeSource[]; relatedClusters: string[]; checkedAt: string
}

const dataset = data as unknown as { asOf: string; threshold: number; scope: string; coverage: string; attribution: string; facilities: ComputeFacility[]; unplaced: ComputeFacility[] }
export const computeFacilities = dataset.facilities
const unplaced = dataset.unplaced
const everything = [...computeFacilities, ...unplaced]
export const defaultComputeFilter: ComputeFilter = { groups: { 'ai-operating': true, 'ai-building': true, 'ai-announced': true, super: true } }

// 颜色即分类：AI 按状态分三色，超算单独一色；圆点大小表示规模。
export const computeGroups: { key: ComputeGroup; label: string; color: string }[] = [
  { key: 'ai-operating', label: 'AI · 运营中', color: '#36e2a0' },
  { key: 'ai-building', label: 'AI · 在建', color: '#5ab4ff' },
  { key: 'ai-announced', label: 'AI · 已宣布', color: '#b28dff' },
  { key: 'super', label: '超算中心', color: '#ffb84d' },
]
const colorOf = Object.fromEntries(computeGroups.map(g => [g.key, g.color])) as Record<ComputeGroup, string>
const labelOf = Object.fromEntries(computeGroups.map(g => [g.key, g.label])) as Record<ComputeGroup, string>
const precisionZh: Record<string, string> = { address: '按地址定位', city: '城市级近似位置', site: '场址坐标（Epoch）', unknown: '位置未公开' }

export function groupOf(f: ComputeFacility): ComputeGroup {
  return f.type === 'supercomputer' ? 'super' : (`ai-${f.status}` as ComputeGroup)
}
const scaleOf = (f: ComputeFacility) => Math.max(f.h100eCurrent || 0, f.h100ePlanned || 0, f.chips || 0)
const radiusOf = (f: ComputeFacility) => { const s = scaleOf(f); return s >= 1_000_000 ? 7 : s >= 100_000 ? 4.8 : 3.2 }
const wan = (n: number | null) => n == null ? null : n >= 10000 ? `${(n / 10000).toFixed(n >= 1_000_000 ? 0 : 1)} 万` : n.toLocaleString('en-US')
function scaleText(f: ComputeFacility) {
  if (f.chips) return `${wan(f.chips)} 张卡`
  if (f.h100eCurrent) return `${wan(f.h100eCurrent)} H100 当量`
  if (f.h100ePlanned) return `规划 ${wan(f.h100ePlanned)} H100 当量`
  return f.rmaxPF ? `${f.rmaxPF.toLocaleString('en-US')} PFlop/s` : '规模未公开'
}
export function filterComputeFacilities(filter: ComputeFilter, list = computeFacilities) {
  return list.filter(f => filter.groups[groupOf(f)])
}

export function ComputeCenterDots({ projection, filter, selectedId, onSelect }: { projection: GeoProjection; filter: ComputeFilter; selectedId: string | null; onSelect: (id: string) => void }) {
  // 大的先画、小的后画，避免小点被大点盖住。
  const visible = useMemo(() => filterComputeFacilities(filter).slice().sort((a, b) => scaleOf(b) - scaleOf(a)), [filter])
  return <g className="cc-layer" aria-label="全球算力中心">
    {visible.map(f => {
      const point = f.lat != null && f.lon != null ? projection([f.lon, f.lat]) : null
      if (!point) return null
      const selected = selectedId === f.id
      const group = groupOf(f)
      return <circle key={f.id} cx={point[0]} cy={point[1]} r={selected ? radiusOf(f) + 2.5 : radiusOf(f)} fill={colorOf[group]} className={`cc-dot ${selected ? 'selected' : ''}`} role="button" tabIndex={0} aria-label={`${f.name}，${labelOf[group]}，${scaleText(f)}`} onClick={() => onSelect(f.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(f.id) } }}><title>{f.name} · {labelOf[group]} · {scaleText(f)}</title></circle>
    })}
  </g>
}

// 浮层放在地图上：左上是颜色图例（兼开关），右下是清单或详情，页面高度不变。
export function ComputeCenterOverlay({ filter, onFilter, selectedId, onSelect }: { filter: ComputeFilter; onFilter: (next: ComputeFilter) => void; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const selected = everything.find(f => f.id === selectedId)
  const counts = Object.fromEntries(computeGroups.map(g => [g.key, computeFacilities.filter(f => groupOf(f) === g.key).length])) as Record<ComputeGroup, number>
  const q = query.trim().toLowerCase()
  const match = (f: ComputeFacility) => !q || `${f.name} ${f.operator} ${f.location} ${f.country}`.toLowerCase().includes(q)
  const placedList = filterComputeFacilities(filter).filter(match)
  const hiddenList = filterComputeFacilities(filter, unplaced).filter(match)
  const row = (f: ComputeFacility) => <li key={f.id}><button onClick={() => onSelect(f.id)}><i style={{ background: colorOf[groupOf(f)] }}/><span>{f.name}<small>{f.operator !== '未公开' ? f.operator : f.country}</small></span><em>{scaleText(f)}</em></button></li>
  return <>
    <div className="cc-legend" aria-label="算力中心图例">
      <b>万卡算力中心 <small>{computeFacilities.length} 个</small></b>
      {computeGroups.filter(g => counts[g.key]).map(g => <button key={g.key} className={filter.groups[g.key] ? 'on' : 'off'} onClick={() => onFilter({ groups: { ...filter.groups, [g.key]: !filter.groups[g.key] } })} aria-pressed={filter.groups[g.key]}><i style={{ background: g.color }}/>{g.label}<small>{counts[g.key]}</small></button>)}
      <span className="cc-size">规模：<i className="s1"/>1–10万 <i className="s2"/>10–100万 <i className="s3"/>100万+</span>
    </div>
    <section className="cc-drawer" aria-live="polite">
      {selected ? <article className="cc-detail">
        <div className="cc-detail-head"><button className="cc-back" onClick={() => onSelect(null)}>← 返回清单</button></div>
        <h3>{selected.name}</h3>
        <p className="cc-detail-tag" style={{ color: colorOf[groupOf(selected)] }}>{labelOf[groupOf(selected)]}</p>
        <dl>
          <dt>运营方</dt><dd>{selected.operator}</dd>
          {selected.users && <><dt>使用方</dt><dd>{selected.users}</dd></>}
          <dt>位置</dt><dd>{selected.location}<small>{selected.country} · {precisionZh[selected.coordPrecision] || selected.coordPrecision}</small></dd>
          {selected.chips != null && <><dt>加速卡</dt><dd>{selected.chips.toLocaleString('en-US')} 张{selected.chipTypes && <small>{selected.chipTypes}</small>}</dd></>}
          {selected.h100eCurrent != null && <><dt>当前算力</dt><dd>{wan(selected.h100eCurrent)} H100 当量{selected.chips == null && selected.chipTypes && <small>芯片：{selected.chipTypes}</small>}</dd></>}
          {selected.h100ePlanned != null && <><dt>规划算力</dt><dd>{wan(selected.h100ePlanned)} H100 当量</dd></>}
          <dt>电力</dt><dd>{selected.powerMW != null ? `${selected.powerMW.toLocaleString('en-US')} MW` : '未公开'}{selected.plannedPowerMW != null && ` · 规划 ${selected.plannedPowerMW.toLocaleString('en-US')} MW`}</dd>
          <dt>投运</dt><dd>{selected.commissioned || (selected.plannedOnline ? `预计 ${selected.plannedOnline}` : '未公开')}</dd>
          {selected.top500Rank != null && <><dt>TOP500</dt><dd>2026 年 6 月第 {selected.top500Rank} 名{selected.rmaxPF != null && ` · ${selected.rmaxPF.toLocaleString('en-US')} PFlop/s`}</dd></>}
          {selected.relatedClusters.length > 0 && <><dt>同址集群</dt><dd>{selected.relatedClusters.map(c => <small key={c}>{c}</small>)}</dd></>}
        </dl>
        <ul className="cc-sources">{selected.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></li>)}</ul>
        <p className="cc-note">核对 {selected.checkedAt} · H100 当量为 Epoch AI 折算值，不是实际卡数。</p>
      </article> : <>
        <input type="search" placeholder="搜索名称、运营方、地点" value={query} onChange={e => setQuery(e.target.value)} aria-label="搜索算力中心"/>
        <ul className="cc-list">
          {placedList.map(row)}
          {hiddenList.length > 0 && <li className="cc-list-head">位置未公开 · {hiddenList.length} 个（不在地图上）</li>}
          {hiddenList.map(row)}
        </ul>
        <p className="cc-note">{dataset.scope} 数据：{dataset.attribution}。</p>
      </>}
    </section>
  </>
}
