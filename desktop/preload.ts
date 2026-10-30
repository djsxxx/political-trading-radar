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
  getMarketSnapshot: () => ipcRenderer.invoke('market:get-snapshot'),
  getCandles: (symbol: string, interval: string) => ipcRenderer.invoke('market:get-candles', symbol, interval),
  onMarketSnapshot: (callback: (snapshot: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: unknown) => callback(snapshot)
    ipcRenderer.on('market:snapshot', listener)
    return () => ipcRenderer.removeListener('market:snapshot', listener)
  }
})
