import WebSocket from 'ws'

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

export interface FeedSnapshot {
  quotes: LiveQuote[]
  sources: {
    binance: { state: FeedState; lastMessageAt: number | null; reconnects: number }
    okx: { state: FeedState; lastMessageAt: number | null; reconnects: number }
  }
  generatedAt: number
}

export interface PublicCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  source: 'binance' | 'okx'
}

export async function getPublicCandles(symbol: string, interval = '1H'): Promise<PublicCandle[]> {
  const safeSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const candleLimit = interval === '1D' ? 30 : interval === '4H' ? 42 : 96
  const binanceIntervals: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d' }
  const okxIntervals: Record<string, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1H', '4H': '4H', '1D': '1Dutc' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${safeSymbol}USDT&interval=${binanceIntervals[interval] ?? '1h'}&limit=${candleLimit}`, { signal: controller.signal })
    if (!response.ok) throw new Error(`Binance candles ${response.status}`)
    const rows = await response.json() as Array<[number, string, string, string, string, string]>
    return rows.map((row) => ({ timestamp: row[0], open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]), source: 'binance' as const }))
  } catch {
    const response = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${safeSymbol}-USDT&bar=${okxIntervals[interval] ?? '1H'}&limit=${candleLimit}`, { signal: controller.signal })
    if (!response.ok) throw new Error(`OKX candles ${response.status}`)
    const payload = await response.json() as { data?: Array<[string, string, string, string, string, string]> }
    return (payload.data ?? []).map((row) => ({ timestamp: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]), source: 'okx' as const })).reverse()
  } finally {
    clearTimeout(timer)
  }
}

type SourceName = 'binance' | 'okx'
type RawQuote = Omit<LiveQuote, 'verified' | 'spreadPct' | 'binancePrice' | 'okxPrice'>

const OKX_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'TRX', 'LINK',
  'SUI', 'TON', 'SHIB', 'HBAR', 'XLM', 'DOT', 'BCH', 'LTC', 'UNI', 'AAVE',
  'NEAR', 'TAO', 'RENDER', 'ARB', 'OP', 'PEPE', 'BONK', 'WIF', 'ONDO', 'APT'
]

export class DualMarketFeed {
  private sockets: Partial<Record<SourceName, WebSocket>> = {}
  private reconnectTimers: Partial<Record<SourceName, NodeJS.Timeout>> = {}
  private attempts: Record<SourceName, number> = { binance: 0, okx: 0 }
  private lastMessage: Record<SourceName, number | null> = { binance: null, okx: null }
  private sourceState: Record<SourceName, FeedState> = { binance: 'offline', okx: 'offline' }
  private quotes: Record<SourceName, Map<string, RawQuote>> = { binance: new Map(), okx: new Map() }
  private flushTimer?: NodeJS.Timeout
  private stopped = false

  constructor(private readonly publish: (snapshot: FeedSnapshot) => void) {}

  start(): void {
    this.stopped = false
    this.connectBinance()
    this.connectOkx()
    this.flushTimer = setInterval(() => this.flush(), 1000)
  }

  stop(): void {
    this.stopped = true
    if (this.flushTimer) clearInterval(this.flushTimer)
    for (const source of ['binance', 'okx'] as const) {
      if (this.reconnectTimers[source]) clearTimeout(this.reconnectTimers[source])
      this.sockets[source]?.close()
    }
  }

  snapshot(): FeedSnapshot {
    return this.buildSnapshot()
  }

  private connectBinance(): void {
    this.connect('binance', 'wss://stream.binance.com:9443/ws/!miniTicker@arr', (socket) => {
      socket.on('message', (data) => {
        const payload = JSON.parse(data.toString()) as Array<{ s: string; c: string; o: string; q?: string; v?: string; E?: number }>
        const now = Date.now()
        for (const item of payload) {
          if (!item.s.endsWith('USDT')) continue
          const symbol = item.s.slice(0, -4)
          const price = Number(item.c)
          const open = Number(item.o)
          if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(open) || open <= 0) continue
          this.quotes.binance.set(symbol, {
            symbol, price, change24h: ((price - open) / open) * 100,
            volume24h: Number(item.q ?? item.v ?? 0), timestamp: item.E ?? now
          })
        }
        this.markMessage('binance', now)
      })
    })
  }

  private connectOkx(): void {
    this.connect('okx', 'wss://ws.okx.com:8443/ws/v5/public', (socket) => {
      socket.on('open', () => {
        socket.send(JSON.stringify({
          op: 'subscribe',
          args: OKX_SYMBOLS.map((symbol) => ({ channel: 'tickers', instId: `${symbol}-USDT` }))
        }))
      })
      socket.on('message', (data) => {
        const payload = JSON.parse(data.toString()) as { event?: string; data?: Array<{ instId: string; last: string; open24h: string; volCcy24h: string; ts: string }> }
        if (!payload.data) return
        const now = Date.now()
        for (const item of payload.data) {
          const symbol = item.instId.replace('-USDT', '')
          const price = Number(item.last)
          const open = Number(item.open24h)
          if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(open) || open <= 0) continue
          this.quotes.okx.set(symbol, {
            symbol, price, change24h: ((price - open) / open) * 100,
            volume24h: Number(item.volCcy24h), timestamp: Number(item.ts) || now
          })
        }
        this.markMessage('okx', now)
      })
    })
  }

  private connect(source: SourceName, url: string, configure: (socket: WebSocket) => void): void {
    if (this.stopped) return
    this.sourceState[source] = 'connecting'
    const socket = new WebSocket(url, { handshakeTimeout: 12000 })
    this.sockets[source] = socket
    configure(socket)
    socket.on('open', () => {
      this.sourceState[source] = 'live'
      this.attempts[source] = 0
    })
    socket.on('error', () => {
      this.sourceState[source] = this.lastMessage[source] ? 'degraded' : 'offline'
    })
    socket.on('close', () => {
      if (this.stopped) return
      this.sourceState[source] = this.lastMessage[source] ? 'degraded' : 'offline'
      this.scheduleReconnect(source)
    })
  }

  private markMessage(source: SourceName, timestamp: number): void {
    this.lastMessage[source] = timestamp
    this.sourceState[source] = 'live'
  }

  private scheduleReconnect(source: SourceName): void {
    this.attempts[source] += 1
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.attempts[source], 5))
    this.reconnectTimers[source] = setTimeout(() => {
      if (source === 'binance') this.connectBinance()
      else this.connectOkx()
    }, delay)
  }

  private flush(): void {
    const now = Date.now()
    for (const source of ['binance', 'okx'] as const) {
      const last = this.lastMessage[source]
      if (last && now - last > 12000) this.sourceState[source] = 'degraded'
    }
    this.publish(this.buildSnapshot())
  }

  private buildSnapshot(): FeedSnapshot {
    const symbols = new Set([...this.quotes.binance.keys(), ...this.quotes.okx.keys()])
    const quotes: LiveQuote[] = []
    for (const symbol of symbols) {
      const binance = this.quotes.binance.get(symbol)
      const okx = this.quotes.okx.get(symbol)
      const primary = binance ?? okx
      if (!primary) continue
      const spreadPct = binance && okx ? Math.abs(binance.price - okx.price) / ((binance.price + okx.price) / 2) * 100 : undefined
      quotes.push({
        ...primary,
        price: binance && okx ? (binance.price + okx.price) / 2 : primary.price,
        binancePrice: binance?.price,
        okxPrice: okx?.price,
        spreadPct,
        verified: Boolean(binance && okx && spreadPct !== undefined && spreadPct <= 0.35),
        timestamp: Math.max(binance?.timestamp ?? 0, okx?.timestamp ?? 0)
      })
    }
    return {
      quotes,
      sources: {
        binance: { state: this.sourceState.binance, lastMessageAt: this.lastMessage.binance, reconnects: this.attempts.binance },
        okx: { state: this.sourceState.okx, lastMessageAt: this.lastMessage.okx, reconnects: this.attempts.okx }
      },
      generatedAt: Date.now()
    }
  }
}
