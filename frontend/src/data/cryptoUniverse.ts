import type { CryptoAsset, CryptoCategory } from '../types'

const knownCoins = [
  ['BTC', 'Bitcoin', 'Layer 1', 116842, 2280000000000], ['ETH', 'Ethereum', 'Layer 1', 3824, 462000000000],
  ['SOL', 'Solana', 'Layer 1', 178.26, 85000000000], ['BNB', 'BNB', 'Layer 1', 731, 106000000000],
  ['XRP', 'XRP', 'Layer 1', 2.91, 173000000000], ['DOGE', 'Dogecoin', 'Meme', 0.214, 32000000000],
  ['ADA', 'Cardano', 'Layer 1', 0.742, 26000000000], ['AVAX', 'Avalanche', 'Layer 1', 31.48, 13000000000],
  ['TRX', 'TRON', 'Layer 1', 0.298, 28000000000], ['LINK', 'Chainlink', 'Other', 18.72, 12000000000],
  ['SUI', 'Sui', 'Layer 1', 3.86, 13000000000], ['TON', 'Toncoin', 'Layer 1', 3.42, 8400000000],
  ['SHIB', 'Shiba Inu', 'Meme', 0.0000134, 7900000000], ['HBAR', 'Hedera', 'Layer 1', 0.224, 9500000000],
  ['XLM', 'Stellar', 'Layer 1', 0.421, 13200000000], ['DOT', 'Polkadot', 'Layer 1', 4.18, 6700000000],
  ['BCH', 'Bitcoin Cash', 'Layer 1', 523, 10400000000], ['LTC', 'Litecoin', 'Layer 1', 119, 9100000000],
  ['UNI', 'Uniswap', 'DeFi', 10.21, 6400000000], ['AAVE', 'Aave', 'DeFi', 312, 4700000000],
  ['NEAR', 'NEAR Protocol', 'AI', 3.16, 3900000000], ['TAO', 'Bittensor', 'AI', 426, 4100000000],
  ['RENDER', 'Render', 'AI', 6.72, 3600000000], ['FET', 'Artificial Superintelligence', 'AI', 0.91, 2300000000],
  ['ARB', 'Arbitrum', 'Layer 2', 0.48, 2400000000], ['OP', 'Optimism', 'Layer 2', 0.73, 1300000000],
  ['MATIC', 'Polygon', 'Layer 2', 0.31, 3300000000], ['PEPE', 'Pepe', 'Meme', 0.0000121, 5100000000],
  ['BONK', 'Bonk', 'Meme', 0.000028, 2200000000], ['WIF', 'dogwifhat', 'Meme', 1.02, 1000000000],
  ['MKR', 'Maker', 'DeFi', 1742, 1500000000], ['LDO', 'Lido DAO', 'DeFi', 1.13, 1000000000],
  ['INJ', 'Injective', 'DeFi', 14.4, 1400000000], ['ONDO', 'Ondo', 'RWA', 1.08, 3400000000],
  ['QNT', 'Quant', 'RWA', 112, 1600000000], ['IMX', 'Immutable', 'Gaming', 0.78, 1500000000],
  ['GALA', 'Gala', 'Gaming', 0.019, 860000000], ['MANA', 'Decentraland', 'Gaming', 0.34, 650000000],
  ['SAND', 'The Sandbox', 'Gaming', 0.31, 760000000], ['XMR', 'Monero', 'Privacy', 324, 5900000000],
  ['ZEC', 'Zcash', 'Privacy', 48, 780000000], ['CRO', 'Cronos', 'Exchange', 0.12, 3200000000],
  ['OKB', 'OKB', 'Exchange', 53, 3200000000], ['ENA', 'Ethena', 'DeFi', 0.56, 3400000000],
  ['APT', 'Aptos', 'Layer 1', 4.82, 3100000000], ['SEI', 'Sei', 'Layer 1', 0.28, 1600000000],
  ['ATOM', 'Cosmos', 'Layer 1', 4.71, 1900000000], ['FIL', 'Filecoin', 'Other', 2.66, 1900000000],
  ['JUP', 'Jupiter', 'DeFi', 0.51, 1600000000], ['PENDLE', 'Pendle', 'DeFi', 4.63, 750000000],
  ['WLD', 'Worldcoin', 'AI', 1.18, 2100000000], ['VIRTUAL', 'Virtuals Protocol', 'AI', 1.72, 1200000000],
  ['TRUMP', 'Official Trump', 'Meme', 10.42, 2100000000], ['FLOKI', 'Floki', 'Meme', 0.00011, 1100000000],
  ['AXS', 'Axie Infinity', 'Gaming', 2.73, 470000000], ['GRT', 'The Graph', 'AI', 0.094, 920000000],
  ['ALGO', 'Algorand', 'Layer 1', 0.24, 2100000000], ['ICP', 'Internet Computer', 'Layer 1', 5.14, 2800000000],
  ['RUNE', 'THORChain', 'DeFi', 1.61, 570000000], ['KAS', 'Kaspa', 'Layer 1', 0.083, 2200000000]
] as const

const categories: CryptoCategory[] = ['Layer 1', 'Layer 2', 'DeFi', 'AI', 'Meme', 'Gaming', 'RWA', 'Exchange', 'Privacy', 'Other']

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.713 + salt * 17.137) * 43758.5453
  return value - Math.floor(value)
}

export function createCryptoUniverse(): CryptoAsset[] {
  return Array.from({ length: 200 }, (_, index) => {
    const known = knownCoins[index]
    const symbol = known?.[0] ?? `ALT${String(index - knownCoins.length + 1).padStart(3, '0')}`
    const name = known?.[1] ?? `Altcoin Network ${index - knownCoins.length + 1}`
    const category = (known?.[2] ?? categories[index % categories.length]) as CryptoCategory
    const price = known?.[3] ?? Math.pow(10, seeded(index, 2) * 4 - 3)
    const marketCap = known?.[4] ?? 20000000 + seeded(index, 3) * 780000000
    const change24h = (seeded(index, 4) - 0.47) * 18
    const change5m = (seeded(index, 5) - 0.5) * 4.8
    const volumeMultiplier = 0.45 + seeded(index, 6) * 6.4
    const rsi = 24 + seeded(index, 7) * 60
    const volatility = 1.2 + seeded(index, 8) * 17
    const aiScore = Math.round(35 + seeded(index, 9) * 61)
    return {
      id: `crypto-${index + 1}`, symbol, name, category, price, change24h, change5m,
      volume24h: marketCap * (0.025 + seeded(index, 10) * 0.28), volumeMultiplier, marketCap,
      rsi, volatility, aiScore, signal: aiScore > 76 ? 'BUY' : aiScore < 46 ? 'SELL' : 'WATCH',
      favorite: index < 8, updatedAt: Date.now(),
      sparkline: Array.from({ length: 18 }, (_, point) => price * (1 + (seeded(index * 18 + point, 12) - 0.5) * 0.035))
    }
  })
}
