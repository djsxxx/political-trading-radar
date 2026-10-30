import type { AccuracyMetric, DecisionSignal, MacroAsset, WeatherRisk } from '../types'

export const macroAssets: MacroAsset[] = [
  { symbol: 'ZM', name: '豆粕', market: 'agriculture', price: '3,168', change: 1.42, aiScore: 86, leadDriver: '美豆天气 / 压榨利润', status: '关注' },
  { symbol: 'ZS', name: '大豆', market: 'agriculture', price: '1,024.6', change: 0.78, aiScore: 82, leadDriver: '巴西产量 / USDA', status: '正常' },
  { symbol: 'ZC', name: '玉米', market: 'agriculture', price: '421.5', change: -0.36, aiScore: 74, leadDriver: '主产区降雨 / 库存', status: '正常' },
  { symbol: 'ZW', name: '小麦', market: 'agriculture', price: '548.2', change: 1.06, aiScore: 79, leadDriver: '黑海出口 / 干旱', status: '关注' },
  { symbol: 'BO', name: '豆油', market: 'agriculture', price: '54.18', change: 2.11, aiScore: 88, leadDriver: '生物燃料 / 棕榈油', status: '高风险' },
  { symbol: 'CT', name: '棉花', market: 'agriculture', price: '68.42', change: -0.61, aiScore: 71, leadDriver: '得州天气 / 出口', status: '正常' },
  { symbol: 'XAU', name: '黄金', market: 'metal', price: '3,348.2', change: 0.84, aiScore: 91, leadDriver: '美元 / 实际利率', status: '关注' },
  { symbol: 'XAG', name: '白银', market: 'metal', price: '37.14', change: 1.76, aiScore: 87, leadDriver: '黄金联动 / 工业需求', status: '关注' },
  { symbol: 'HG', name: '铜', market: 'metal', price: '5.58', change: -0.42, aiScore: 83, leadDriver: '中国需求 / 库存', status: '正常' },
  { symbol: 'ALI', name: '铝', market: 'metal', price: '2,612', change: 0.53, aiScore: 76, leadDriver: '电力成本 / 库存', status: '正常' },
  { symbol: 'FE', name: '铁矿石', market: 'metal', price: '102.8', change: -1.28, aiScore: 80, leadDriver: '钢厂利润 / 发运量', status: '关注' },
  { symbol: 'NI', name: '镍', market: 'metal', price: '15,880', change: 2.36, aiScore: 85, leadDriver: '印尼政策 / 不锈钢', status: '高风险' }
]

export const weatherRisks: WeatherRisk[] = [
  { id: 'w1', region: '美国中西部', event: '高温少雨窗口', severity: 'P2', affected: ['大豆', '玉米', '豆粕'], direction: '供应偏紧 · 利多', leadTime: '6小时—3天', confidence: 82 },
  { id: 'w2', region: '巴西南部', event: '强降雨与洪涝', severity: 'P1', affected: ['大豆', '豆粕'], direction: '收割受阻 · 利多', leadTime: '1—5天', confidence: 88 },
  { id: 'w3', region: '澳大利亚西部', event: '港口强风预警', severity: 'P3', affected: ['铁矿石'], direction: '发运扰动 · 短多', leadTime: '12—48小时', confidence: 67 },
  { id: 'w4', region: '智利北部', event: '极端降雪风险', severity: 'P2', affected: ['铜'], direction: '矿山运输受阻 · 利多', leadTime: '1—4天', confidence: 74 }
]

export const decisionSignals: DecisionSignal[] = [
  { id: 's1', symbol: 'SOL', name: 'Solana', market: 'crypto', horizon: 'short', direction: 'BUY', grade: 'A+', confidence: 88, entry: '$176–179', target: '$186–191', stop: '$172.8', expectedMove: '+5%—8%', timeWindow: '30分钟—4小时', evidence: ['成交量 4.8×', '资金净流入', '突破确认', '新闻正向'], issuedAt: '09:42', locked: true, leverage: 3, marginLimitPct: 2, riskLabel: '3× 高风险' },
  { id: 's2', symbol: 'ZM', name: '豆粕', market: 'agriculture', horizon: 'short', direction: 'BUY', grade: 'B', confidence: 76, entry: '3,150–3,175', target: '3,230', stop: '3,118', expectedMove: '+1.7%—2.5%', timeWindow: '1—4小时', evidence: ['美豆同步走强', '天气P2', '持仓增加'], issuedAt: '09:34', locked: true, leverage: 1, marginLimitPct: 1, riskLabel: '1× 现货' },
  { id: 's3', symbol: 'XAU', name: '黄金', market: 'metal', horizon: 'short', direction: 'WATCH', grade: 'B', confidence: 72, entry: '突破 3,356', target: '3,382', stop: '3,329', expectedMove: '+0.8%—1.3%', timeWindow: '2—4小时', evidence: ['美元回落', '实际利率下降', '尚待突破'], issuedAt: '09:20', locked: true, leverage: 1, marginLimitPct: 0, riskLabel: '只观察' },
  { id: 's4', symbol: 'TAO', name: 'Bittensor', market: 'crypto', horizon: 'short', direction: 'BUY', grade: 'A', confidence: 84, entry: '$382–389', target: '$414', stop: '$369', expectedMove: '+6%—9%', timeWindow: '1—4小时', evidence: ['AI板块共振', '量价突破', '鲸鱼流入'], issuedAt: '08:56', locked: true, leverage: 2, marginLimitPct: 1, riskLabel: '2× 杠杆风险' },
  { id: 's5', symbol: 'BTC', name: 'Bitcoin', market: 'crypto', horizon: 'swing', direction: 'BUY', grade: 'A+', confidence: 86, entry: '$114k–117k', target: '$126k–132k', stop: '$109.8k', expectedMove: '+8%—13%', timeWindow: '2—7天', evidence: ['周线趋势', 'ETF净流入', '波动率收缩', '宏观偏多'], issuedAt: '昨日 18:30', locked: true, leverage: 5, marginLimitPct: 2, riskLabel: '5× 极高风险 · 小额' },
  { id: 's6', symbol: 'ZS', name: '大豆', market: 'agriculture', horizon: 'swing', direction: 'BUY', grade: 'A', confidence: 81, entry: '1,010–1,030', target: '1,085', stop: '987', expectedMove: '+5%—7%', timeWindow: '3—7天', evidence: ['巴西洪涝P1', '出口销售改善', '基金空头回补'], issuedAt: '昨日 16:10', locked: true, leverage: 1, marginLimitPct: 2, riskLabel: '1× 无杠杆' },
  { id: 's7', symbol: 'HG', name: '铜', market: 'metal', horizon: 'swing', direction: 'WATCH', grade: 'B', confidence: 74, entry: '站稳 $5.62', target: '$5.91', stop: '$5.39', expectedMove: '+4%—6%', timeWindow: '2—6天', evidence: ['库存下降', '矿端扰动', '需求仍待确认'], issuedAt: '昨日 14:25', locked: true, leverage: 1, marginLimitPct: 0, riskLabel: '只观察' },
  { id: 's8', symbol: 'NI', name: '镍', market: 'metal', horizon: 'swing', direction: 'SELL', grade: 'C', confidence: 61, entry: '仅记录', target: '—', stop: '—', expectedMove: '方向不稳定', timeWindow: '1—3天', evidence: ['政策传闻', '高波动', '证据不足'], issuedAt: '昨日 11:40', locked: true, leverage: 1, marginLimitPct: 0, riskLabel: '禁止交易' }
]

export const accuracyMetrics: AccuracyMetric[] = [
  { horizon: 'short', sampleSize: 186, directionAccuracy: 68.3, earlyHitRate: 61.8, highConfidenceAccuracy: 78.6, falsePositiveRate: 16.1, simulatedReturn: 12.4, maxDrawdown: 4.8, averageLeadMinutes: 38 },
  { horizon: 'swing', sampleSize: 124, directionAccuracy: 73.4, earlyHitRate: 66.9, highConfidenceAccuracy: 82.1, falsePositiveRate: 11.3, simulatedReturn: 18.7, maxDrawdown: 6.2, averageLeadMinutes: 286 }
]

export const accuracyBySource = [
  { name: '价格与成交量', short: 74, swing: 69 },
  { name: '资金流', short: 72, swing: 71 },
  { name: '新闻事件', short: 64, swing: 70 },
  { name: '灾害天气', short: 58, swing: 79 },
  { name: '供需与库存', short: 55, swing: 81 }
]
