export type Direction = 'up' | 'down' | 'flat'

export interface MarketTicker {
  symbol: string
  value: string
  change: number
}

export type CryptoCategory = 'Layer 1' | 'Layer 2' | 'DeFi' | 'AI' | 'Meme' | 'Gaming' | 'RWA' | 'Exchange' | 'Privacy' | 'Other'

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  category: CryptoCategory
  price: number
  change24h: number
  change5m: number
  volume24h: number
  volumeMultiplier: number
  marketCap: number
  rsi: number
  volatility: number
  aiScore: number
  signal: 'BUY' | 'WATCH' | 'SELL'
  favorite: boolean
  sparkline: number[]
  updatedAt: number
  dataMode?: 'live' | 'reference'
  verified?: boolean
  spreadPct?: number
  binanceAvailable?: boolean
  okxAvailable?: boolean
}

export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: 'binance' | 'okx'
}

export type FeedState = 'connecting' | 'live' | 'degraded' | 'offline'

export interface LiveQuote {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  timestamp: number
  binancePrice?: number
  okxPrice?: number
  spreadPct?: number
  verified: boolean
}

export interface MarketFeedSnapshot {
  quotes: LiveQuote[]
  sources: Record<'binance' | 'okx', { state: FeedState; lastMessageAt: number | null; reconnects: number }>
  generatedAt: number
}

export type AlertSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type AlertStatus = 'new' | 'acknowledged'

export interface AlertCondition {
  metric: 'change5m' | 'change24h' | 'volumeMultiplier' | 'rsi' | 'volatility'
  operator: '>' | '<'
  value: number
}

export interface AlertRule {
  id: string
  name: string
  severity: AlertSeverity
  enabled: boolean
  match: 'all' | 'any'
  conditions: AlertCondition[]
  cooldownMinutes: number
  triggeredCount: number
}

export interface MarketAlert {
  id: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  assetId: string
  symbol: string
  message: string
  evidence: string[]
  createdAt: number
  status: AlertStatus
}

export type StrategyHorizon = 'short' | 'swing'
export type SignalGrade = 'A+' | 'A' | 'B' | 'C'
export type MarketClass = 'crypto' | 'agriculture' | 'metal'

export interface DecisionSignal {
  id: string
  symbol: string
  name: string
  market: MarketClass
  horizon: StrategyHorizon
  direction: 'BUY' | 'SELL' | 'WATCH'
  grade: SignalGrade
  confidence: number
  entry: string
  target: string
  stop: string
  expectedMove: string
  timeWindow: string
  evidence: string[]
  issuedAt: string
  locked: boolean
  leverage: 1 | 2 | 3 | 5 | 10
  marginLimitPct: number
  riskLabel: string
}

export interface AccuracyMetric {
  horizon: StrategyHorizon
  sampleSize: number
  directionAccuracy: number
  earlyHitRate: number
  highConfidenceAccuracy: number
  falsePositiveRate: number
  simulatedReturn: number
  maxDrawdown: number
  averageLeadMinutes: number
}

export interface MacroAsset {
  symbol: string
  name: string
  market: Exclude<MarketClass, 'crypto'>
  price: string
  change: number
  aiScore: number
  leadDriver: string
  status: '正常' | '关注' | '高风险'
}

export interface WeatherRisk {
  id: string
  region: string
  event: string
  severity: 'P1' | 'P2' | 'P3'
  affected: string[]
  direction: string
  leadTime: string
  confidence: number
}

export type ViewId = 'dashboard' | 'funds' | 'research' | 'scanner' | 'markets' | 'signals' | 'bots' | 'economy' | 'risk' | 'audit' | 'alerts' | 'settings'
export type AppLanguage = 'zh' | 'en'
export type MonitorMode = 'smart30' | 'smart50' | 'all200' | 'custom'

export interface StrategyBot {
  id: string
  name: string
  platform: string
  strategy: string
  sourceType: '公开信号' | '账户只读'
  connection: '观察中' | '待授权' | '已连接'
  leverage: string
  reliability: number
  sampleSize: number
  maxDrawdown: number
  warning?: string
}

export interface AgentEconomyAccount {
  id: string
  name: string
  credit: number
  resourceTier: 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
  authorization: 'L0' | 'L1' | 'L2' | 'L3'
  monthlyBudget: number
  spent: number
  netContribution: number
  status: '运行' | '审核' | '降级'
}
