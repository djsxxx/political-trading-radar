import type { AgentEconomyAccount, StrategyBot } from '../types'

export const strategyBots: StrategyBot[] = [
  { id: 'b01', name: 'Binance Futures Lead A', platform: 'Binance', strategy: '趋势突破', sourceType: '公开信号', connection: '观察中', leverage: '1–3×', reliability: 78, sampleSize: 418, maxDrawdown: 8.4 },
  { id: 'b02', name: 'Binance Grid Stable', platform: 'Binance', strategy: '现货网格', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 74, sampleSize: 692, maxDrawdown: 11.1 },
  { id: 'b03', name: 'OKX Lead Trader A', platform: 'OKX', strategy: '波段趋势', sourceType: '公开信号', connection: '观察中', leverage: '2–5×', reliability: 76, sampleSize: 381, maxDrawdown: 9.7 },
  { id: 'b04', name: 'OKX Neutral Grid', platform: 'OKX', strategy: '合约网格', sourceType: '公开信号', connection: '观察中', leverage: '2×', reliability: 69, sampleSize: 527, maxDrawdown: 13.8 },
  { id: 'b05', name: 'TradingView Supertrend', platform: 'TradingView', strategy: '趋势跟随', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 72, sampleSize: 944, maxDrawdown: 12.4 },
  { id: 'b06', name: 'TradingView Breakout', platform: 'TradingView', strategy: '区间突破', sourceType: '公开信号', connection: '观察中', leverage: '1–2×', reliability: 70, sampleSize: 613, maxDrawdown: 14.2 },
  { id: 'b07', name: '3Commas DCA Reference', platform: '3Commas', strategy: 'DCA', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 63, sampleSize: 831, maxDrawdown: 21.5, warning: '排除马丁格尔配置' },
  { id: 'b08', name: '3Commas Signal Bot', platform: '3Commas', strategy: '外部信号', sourceType: '账户只读', connection: '待授权', leverage: '自定义', reliability: 0, sampleSize: 0, maxDrawdown: 0 },
  { id: 'b09', name: 'Cryptohopper Trend', platform: 'Cryptohopper', strategy: '趋势组合', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 68, sampleSize: 479, maxDrawdown: 16.1 },
  { id: 'b10', name: 'Cryptohopper Account', platform: 'Cryptohopper', strategy: '账户策略', sourceType: '账户只读', connection: '待授权', leverage: '自定义', reliability: 0, sampleSize: 0, maxDrawdown: 0 },
  { id: 'b11', name: 'Freqtrade Momentum', platform: 'GitHub', strategy: '动量', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 67, sampleSize: 1180, maxDrawdown: 15.7 },
  { id: 'b12', name: 'Freqtrade Mean Reversion', platform: 'GitHub', strategy: '均值回归', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 65, sampleSize: 1042, maxDrawdown: 18.3 },
  { id: 'b13', name: 'Hummingbot PMM', platform: 'GitHub', strategy: '做市', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 71, sampleSize: 1520, maxDrawdown: 10.6 },
  { id: 'b14', name: 'Hummingbot Cross Exchange', platform: 'GitHub', strategy: '跨所套利', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 73, sampleSize: 1284, maxDrawdown: 7.9 },
  { id: 'b15', name: 'Jesse Trend Reference', platform: 'GitHub', strategy: '趋势回测', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 66, sampleSize: 754, maxDrawdown: 17.2 },
  { id: 'b16', name: 'Pionex Grid Reference', platform: 'Pionex', strategy: '现货网格', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 64, sampleSize: 588, maxDrawdown: 19.4 },
  { id: 'b17', name: 'Coinrule Momentum', platform: 'Coinrule', strategy: '规则动量', sourceType: '公开信号', connection: '观察中', leverage: '1×', reliability: 67, sampleSize: 402, maxDrawdown: 14.8 },
  { id: 'b18', name: 'Your Binance Account', platform: 'Binance', strategy: '个人跟单/机器人', sourceType: '账户只读', connection: '待授权', leverage: '自定义', reliability: 0, sampleSize: 0, maxDrawdown: 0 },
  { id: 'b19', name: 'Your OKX Account', platform: 'OKX', strategy: '个人跟单/机器人', sourceType: '账户只读', connection: '待授权', leverage: '自定义', reliability: 0, sampleSize: 0, maxDrawdown: 0 },
  { id: 'b20', name: 'Custom Webhook Strategy', platform: 'Webhook', strategy: '自定义信号', sourceType: '账户只读', connection: '待授权', leverage: '自定义', reliability: 0, sampleSize: 0, maxDrawdown: 0 }
]

export const agentEconomyAccounts: AgentEconomyAccount[] = [
  { id: 'market', name: '行情智能体', credit: 88, resourceTier: 'R2', authorization: 'L2', monthlyBudget: 120, spent: 48, netContribution: 286, status: '运行' },
  { id: 'news', name: '新闻智能体', credit: 81, resourceTier: 'R2', authorization: 'L1', monthlyBudget: 90, spent: 61, netContribution: 174, status: '运行' },
  { id: 'weather', name: '天气智能体', credit: 79, resourceTier: 'R1', authorization: 'L1', monthlyBudget: 60, spent: 22, netContribution: 96, status: '运行' },
  { id: 'strategy', name: '策略验证智能体', credit: 74, resourceTier: 'R2', authorization: 'L2', monthlyBudget: 150, spent: 103, netContribution: 211, status: '审核' },
  { id: 'execution', name: '交易执行智能体', credit: 62, resourceTier: 'R0', authorization: 'L2', monthlyBudget: 0, spent: 0, netContribution: 0, status: '降级' }
]
