import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { DualMarketFeed, getPublicCandles } from './marketFeed'
import { PoliticalRadarService } from './politicalRadar'
import { AnnualAssetsService } from './annualAssets'

let marketFeed: DualMarketFeed | undefined
let politicalRadar: PoliticalRadarService | undefined
let annualAssets: AnnualAssetsService | undefined
let mainWindow: BrowserWindow | undefined
let powerMapWindow: BrowserWindow | undefined

function openPowerMap(){
  if(powerMapWindow&&!powerMapWindow.isDestroyed()){powerMapWindow.restore();powerMapWindow.show();powerMapWindow.focus();return}
  powerMapWindow=createWindow('power-map')
  powerMapWindow.on('closed',()=>{powerMapWindow=undefined})
}

const createWindow = (view:'main'|'power-map'='main'): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    title: view==='power-map'?'权力地图 · 根深':'人物档案与资产 · 根深',
    backgroundColor: '#070b10',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 16 },
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:\/\//i.test(url))void shell.openExternal(url)
    return { action: 'deny' }
  })
  window.on('page-title-updated',event=>event.preventDefault())

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL+(view==='power-map'?'#power-map':''))
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'),view==='power-map'?{hash:'power-map'}:undefined)
  }
  return window
}

app.whenReady().then(() => {
  politicalRadar = new PoliticalRadarService(join(app.getPath('userData'),'political-radar'),join(__dirname,'../renderer/political-data.json'))
  ipcMain.handle('political:data',()=>politicalRadar!.data())
  ipcMain.handle('political:quote',(_event,ticker:string)=>politicalRadar!.quote(ticker))
  ipcMain.handle('political:sync',()=>politicalRadar!.sync())
  ipcMain.handle('political:status',()=>politicalRadar!.status())
  void politicalRadar.start()
  annualAssets=new AnnualAssetsService(join(app.getPath('userData'),'political-radar'),join(__dirname,'../renderer/annual-assets.json'))
  ipcMain.handle('annual:data',()=>annualAssets!.data())
  ipcMain.handle('annual:history',async()=>JSON.parse(await readFile(join(__dirname,'../renderer/annual-history.json'),'utf8')))
  ipcMain.handle('annual:status',()=>annualAssets!.status())
  ipcMain.handle('annual:refresh',()=>annualAssets!.refresh())
  void annualAssets.start()
  mainWindow=createWindow()
  ipcMain.handle('political:open-map',()=>{openPowerMap();return {opened:true}})
  ipcMain.handle('political:open-people',()=>{if(!mainWindow||mainWindow.isDestroyed())mainWindow=createWindow();mainWindow.restore();mainWindow.show();mainWindow.focus();return {opened:true}})
  marketFeed = new DualMarketFeed((snapshot) => {
    for (const window of BrowserWindow.getAllWindows()) window.webContents.send('market:snapshot', snapshot)
  })
  ipcMain.handle('market:get-snapshot', () => marketFeed?.snapshot())
  ipcMain.handle('market:get-candles', (_event, symbol: string, interval: string) => getPublicCandles(symbol, interval))
  marketFeed.start()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow=createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {marketFeed?.stop();politicalRadar?.stop();annualAssets?.stop()})
