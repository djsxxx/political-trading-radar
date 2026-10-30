// 富豪榜数据的统一入口：显式声明元素类型，数据文件为空（如公开版去掉福布斯数据）时类型检查仍成立。
import usRaw from '../../public/billionaires-us.json'
import statesRaw from '../../public/billionaire-states.json'
import comparisonRaw from '../../public/billionaire-comparison.json'
import portraitsRaw from '../../public/billionaire-portraits.json'

export type BillionairePerson={id:string;name:string;rank:number;globalRank:number;worthUsd:number;industry:string[];companies:string[];photo:string|null;organization:{name:string;title:string}|null;family:boolean;birthYear:string|null;profileSource:string;mirrorProfile:string;profileAvailable:boolean}
export type BillionaireStateRecord={id:string;state:string|null;status:string;source:string}
export type BillionaireComparisonRecord={id:string;previousRank:number|null;previousWorthUsd:number|null;rankChange:number|null;worthChangeUsd:number|null;worthChangePct:number|null;enteredTop500:boolean|null}
export type PortraitSource={url:string;source:string;fileSource:string;author:string;license:string;licenseUrl:string}

export const wealthSnapshot=usRaw as unknown as Omit<typeof usRaw,'people'>&{people:BillionairePerson[]}
export const stateRecords=statesRaw as unknown as Omit<typeof statesRaw,'people'>&{people:BillionaireStateRecord[]}
export const comparisonHistory=comparisonRaw as unknown as Omit<typeof comparisonRaw,'entries'>&{entries:BillionaireComparisonRecord[]}
export const portraitSources=(portraitsRaw as unknown as {people:Record<string,PortraitSource>}).people
