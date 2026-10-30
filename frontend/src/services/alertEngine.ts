import type { AlertCondition, AlertRule, CryptoAsset, MarketAlert } from '../types'

const labels: Record<AlertCondition['metric'], string> = { change5m: '5分钟涨跌', change24h: '24小时涨跌', volumeMultiplier: '成交量倍数', rsi: 'RSI', volatility: '波动率' }

function metric(asset: CryptoAsset, key: AlertCondition['metric']) { return asset[key] as number }

export function conditionMatches(asset: CryptoAsset, condition: AlertCondition) {
  const current = metric(asset, condition.metric)
  return condition.operator === '>' ? current > condition.value : current < condition.value
}

export function evaluateRules(assets: CryptoAsset[], rules: AlertRule[], previous: MarketAlert[], now = Date.now()): MarketAlert[] {
  const created: MarketAlert[] = []
  for (const rule of rules.filter((item) => item.enabled)) {
    for (const asset of assets) {
      const results = rule.conditions.map((condition) => conditionMatches(asset, condition))
      const matched = rule.match === 'all' ? results.every(Boolean) : results.some(Boolean)
      if (!matched) continue
      const duplicate = [...previous, ...created].some((alert) => alert.ruleId === rule.id && alert.assetId === asset.id && now - alert.createdAt < rule.cooldownMinutes * 60000)
      if (duplicate) continue
      const evidence = rule.conditions.filter((condition, index) => rule.match === 'all' || results[index]).map((condition) => `${labels[condition.metric]} ${metric(asset, condition.metric).toFixed(2)} ${condition.operator} ${condition.value}`)
      created.push({ id: `${rule.id}-${asset.id}-${now}`, ruleId: rule.id, ruleName: rule.name, severity: rule.severity, assetId: asset.id, symbol: asset.symbol, message: `${asset.symbol} 触发“${rule.name}”`, evidence, createdAt: now, status: 'new' })
      if (created.length >= 24) return created
    }
  }
  return created
}
