import type { AlertRule } from '../types'

export const initialAlertRules: AlertRule[] = [
  { id: 'rapid-move', name: '5分钟急速拉升', severity: 'P2', enabled: true, match: 'all', conditions: [{ metric: 'change5m', operator: '>', value: 1.8 }, { metric: 'volumeMultiplier', operator: '>', value: 2.5 }], cooldownMinutes: 15, triggeredCount: 0 },
  { id: 'volume-spike', name: '成交量异常放大', severity: 'P3', enabled: true, match: 'all', conditions: [{ metric: 'volumeMultiplier', operator: '>', value: 5 }], cooldownMinutes: 30, triggeredCount: 0 },
  { id: 'overbought', name: 'RSI超买风险', severity: 'P3', enabled: true, match: 'all', conditions: [{ metric: 'rsi', operator: '>', value: 75 }, { metric: 'change24h', operator: '>', value: 5 }], cooldownMinutes: 60, triggeredCount: 0 },
  { id: 'breakdown', name: '快速下跌警报', severity: 'P1', enabled: true, match: 'any', conditions: [{ metric: 'change5m', operator: '<', value: -2.1 }, { metric: 'change24h', operator: '<', value: -10 }], cooldownMinutes: 10, triggeredCount: 0 },
  { id: 'high-volatility', name: '高波动观察', severity: 'P4', enabled: true, match: 'all', conditions: [{ metric: 'volatility', operator: '>', value: 14 }], cooldownMinutes: 120, triggeredCount: 0 }
]
