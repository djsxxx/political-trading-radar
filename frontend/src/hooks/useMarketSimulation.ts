import { useEffect, useMemo, useState } from 'react'
import { createCryptoUniverse } from '../data/cryptoUniverse'
import { initialAlertRules } from '../data/alertRules'
import { evaluateRules } from '../services/alertEngine'
import type { AlertRule, CryptoAsset, MarketAlert, MarketFeedSnapshot, MonitorMode } from '../types'

function smartRank(asset: CryptoAsset) {
  const liquidity = Math.log10(Math.max(asset.marketCap, 1)) * 4
  const activity = Math.min(asset.volumeMultiplier, 6) * 4 + Math.min(asset.volatility, 18)
  const quality = asset.aiScore * 0.55
  return liquidity + activity + quality
}

function selectMonitored(assets: CryptoAsset[], mode: MonitorMode) {
  if (mode === 'all200') return assets
  if (mode === 'custom') return assets.filter((asset) => asset.favorite)
  const limit = mode === 'smart30' ? 30 : 50
  return [...assets].sort((a, b) => smartRank(b) - smartRank(a)).slice(0, limit)
}

export function useMarketSimulation() {
  const [assets, setAssets] = useState<CryptoAsset[]>(() => createCryptoUniverse())
  const [rules, setRules] = useState<AlertRule[]>(initialAlertRules)
  const [alerts, setAlerts] = useState<MarketAlert[]>([])
  const [streaming, setStreaming] = useState(true)
  const [monitorMode, setMonitorMode] = useState<MonitorMode>('smart50')
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [feed, setFeed] = useState<MarketFeedSnapshot | null>(null)

  useEffect(() => {
    const initial = evaluateRules(selectMonitored(assets, monitorMode), rules, [], Date.now())
    setAlerts(initial)
  // Seed once; subsequent evaluation is performed on ticks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const bridge = window.financialAI
    if (!bridge) return
    void bridge.getMarketSnapshot().then((snapshot) => snapshot && setFeed(snapshot))
    return bridge.onMarketSnapshot(setFeed)
  }, [])

  useEffect(() => {
    if (!streaming || !feed?.quotes.length) return
    const quoteMap = new Map(feed.quotes.map((quote) => [quote.symbol, quote]))
    const now = feed.generatedAt
    setAssets((current) => {
      const next = current.map((asset) => {
        const quote = quoteMap.get(asset.symbol)
        if (!quote) return asset
        const fiveMinuteBase = asset.sparkline[Math.max(0, asset.sparkline.length - 5)] || quote.price
        return {
          ...asset,
          price: quote.price,
          change24h: quote.change24h,
          change5m: ((quote.price - fiveMinuteBase) / fiveMinuteBase) * 100,
          volume24h: quote.volume24h,
          updatedAt: quote.timestamp,
          sparkline: [...asset.sparkline.slice(1), quote.price],
          dataMode: 'live' as const,
          verified: quote.verified,
          spreadPct: quote.spreadPct,
          binanceAvailable: quote.binancePrice !== undefined,
          okxAvailable: quote.okxPrice !== undefined
        }
      })
      setAlerts((currentAlerts) => [...evaluateRules(selectMonitored(next, monitorMode), rules, currentAlerts, now), ...currentAlerts].slice(0, 120))
      return next
    })
    setLastUpdated(now)
  }, [feed, streaming, rules, monitorMode])

  const monitoredAssets = useMemo(() => selectMonitored(assets, monitorMode), [assets, monitorMode])

  const stats = useMemo(() => ({
    online: monitoredAssets.length,
    universe: assets.length,
    gainers: monitoredAssets.filter((asset) => asset.change24h > 0).length,
    highVolume: monitoredAssets.filter((asset) => asset.volumeMultiplier > 3).length,
    newAlerts: alerts.filter((alert) => alert.status === 'new').length,
    live: monitoredAssets.filter((asset) => asset.dataMode === 'live').length,
    verified: monitoredAssets.filter((asset) => asset.verified).length
  }), [monitoredAssets, assets.length, alerts])

  const toggleFavorite = (id: string) => setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, favorite: !asset.favorite } : asset))
  const toggleRule = (id: string) => setRules((current) => current.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
  const acknowledgeAlert = (id: string) => setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, status: 'acknowledged' } : alert))

  return { assets, monitoredAssets, rules, alerts, stats, streaming, lastUpdated, feed, monitorMode, setMonitorMode, setStreaming, toggleFavorite, toggleRule, acknowledgeAlert }
}
