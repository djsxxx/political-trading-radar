import { stateRecords as locations, wealthSnapshot as wealth } from './billionaireData'
import { states } from './politicalAtlasModel'
const lookup=new Map(Object.entries(states).map(([code,s])=>[s[2].toLowerCase(),code]))
const stateMap=new Map(locations.people.map(p=>[p.id,p]))
export function billionaireState(id:string){const raw=stateMap.get(id);return raw?.state?lookup.get(raw.state.toLowerCase())||'unknown':raw?.status==='outside_us'?'outside':'unknown'}
export function billionaireStateLabel(id:string){const code=billionaireState(id);return states[code]?.[1]|| (code==='outside'?'美国境外（档案）':'州资料暂无')}
const counts=new Map<string,number>();for(const p of wealth.people){const code=billionaireState(p.id);if(states[code])counts.set(code,(counts.get(code)||0)+1)}
export const stateDistribution=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
export const stateCoverage=stateDistribution.reduce((s,e)=>s+e[1],0)
export const stateCount=(code:string)=>counts.get(code)||0
export const locationRetrievedAt=locations.retrievedAt
