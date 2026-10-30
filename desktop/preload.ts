import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('financialAI', {
  platform: process.platform,
  version: '2.1.0',
  mode: 'public-read-only',
  openPowerMap:()=>ipcRenderer.invoke('political:open-map'),
  openPeopleWindow:()=>ipcRenderer.invoke('political:open-people'),
  getPoliticalData:()=>ipcRenderer.invoke('political:data'),
  getPoliticalQuote:(ticker:string)=>ipcRenderer.invoke('political:quote',ticker),
  syncPoliticalData:()=>ipcRenderer.invoke('political:sync'),
  getPoliticalStatus:()=>ipcRenderer.invoke('political:status'),
  getAnnualAssets:()=>ipcRenderer.invoke('annual:data'),
  getAnnualHistory:()=>ipcRenderer.invoke('annual:history'),
  getAnnualStatus:()=>ipcRenderer.invoke('annual:status'),
  refreshAnnualAssets:()=>ipcRenderer.invoke('annual:refresh'),
})
