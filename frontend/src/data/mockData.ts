import type { MarketTicker } from '../types'

export const marketTickers: MarketTicker[] = [
  { symbol: 'BTC/USD', value: '116,842', change: 2.64 },
  { symbol: 'ETH/USD', value: '3,824.11', change: 1.87 },
  { symbol: 'SOL/USD', value: '178.26', change: 4.21 },
  { symbol: 'XAU/USD', value: '3,348.20', change: 0.84 },
  { symbol: 'USD/CNY', value: '7.1862', change: -0.12 },
  { symbol: 'USD/JPY', value: '150.42', change: 0.36 },
  { symbol: 'USD/CHF', value: '0.8076', change: -0.09 }
]

export const heatMapData = [
  { name: 'BTC', value: 8, change: 4.6, group: 'CRYPTO' },
  { name: 'ETH', value: 6, change: 2.8, group: 'CRYPTO' },
  { name: 'SOL', value: 4, change: 5.7, group: 'CRYPTO' },
  { name: 'BNB', value: 5, change: 0.9, group: 'LAYER 1' },
  { name: 'XRP', value: 5, change: -0.4, group: 'LAYER 1' },
  { name: 'SUI', value: 4, change: 6.2, group: 'LAYER 1' },
  { name: 'LINK', value: 4, change: 1.8, group: 'ORACLE' },
  { name: 'AAVE', value: 3, change: 3.4, group: 'DEFI' },
  { name: 'ONDO', value: 3, change: -1.6, group: 'RWA' },
  { name: 'TAO', value: 3, change: 7.1, group: 'AI' },
  { name: 'PEPE', value: 3, change: -3.2, group: 'MEME' },
  { name: 'TRUMP', value: 3, change: 2.4, group: 'MEME' }
]

export const intelligenceFeed = [
  { time: '09:42', source: 'REUTERS', title: 'Fed officials signal patience as inflation data cools', impact: 'HIGH', tone: 'positive' },
  { time: '09:38', source: 'X · MUSK', title: 'New AI compute cluster update gains market attention', impact: 'MED', tone: 'neutral' },
  { time: '09:31', source: 'BLOOMBERG', title: 'Copper slips as China demand outlook is reassessed', impact: 'HIGH', tone: 'negative' },
  { time: '09:25', source: 'SEC FILING', title: 'Large-cap technology buyback authorization detected', impact: 'MED', tone: 'positive' }
]
