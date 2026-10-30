import { useSyncExternalStore } from 'react'
export const moneyUnits={usd:{label:'美元',divisor:1},wan:{label:'万美元',divisor:10000},yi:{label:'亿美元',divisor:100000000},trillion:{label:'万亿美元',divisor:1000000000000}}
export type MoneyUnit=keyof typeof moneyUnits
const key='political-radar.billionaire-money-unit.v1'
function snapshot():MoneyUnit{try{const value=localStorage.getItem(key);return value&&value in moneyUnits?value as MoneyUnit:'yi'}catch{return 'yi'}}
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('billionaire-money-unit',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('billionaire-money-unit',callback)}}
export function formatBillionaireMoney(value:number,unit:MoneyUnit){return `${(value/moneyUnits[unit].divisor).toLocaleString('en-US',{maximumFractionDigits:unit==='usd'?0:2})} ${moneyUnits[unit].label}`}
export function useBillionaireMoney(){const unit=useSyncExternalStore(subscribe,snapshot,()=> 'yi' as MoneyUnit);const setUnit=(value:string)=>{if(!(value in moneyUnits))return;try{localStorage.setItem(key,value)}catch{}window.dispatchEvent(new Event('billionaire-money-unit'))};return{unit,setUnit,money:(v:number)=>formatBillionaireMoney(v,unit),label:moneyUnits[unit].label}}
