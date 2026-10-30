# Financial AI OS

Mac desktop multi-market monitoring, signal, and decision-audit prototype. Designed for Apple Silicon, including MacBook Pro M5 with 48 GB memory.

## Final test build v0.4 — included

- Exact 200-coin configurable universe covering mainstream coins, altcoins, AI, DeFi, Meme, RWA, Gaming, Layer 1/2, privacy, and exchange tokens
- Default smart selection of 50 active coins, with Smart 30, Smart 50, Custom Favorites, and All 200 modes
- Binance Spot and OKX public WebSocket feeds in the Electron background process
- One-second normalized renderer batches, exponential reconnect, stale-feed degradation, and dual-source price-spread verification
- Every asset explicitly marked as live dual-source, live single-source, or reference data
- Search, category filters, favorites, sortable rankings, compact price trends, RSI, volatility, volume multiple, and AI score
- Composite alert engine with `all`/`any` matching, P1–P4 severity, cooldown deduplication, enable/pause control, evidence, and acknowledgement
- Six core agriculture markets: soybean meal, soybeans, corn, wheat, soybean oil, and cotton
- Six core metals: gold, silver, copper, aluminium, iron ore, and nickel
- Severe-weather radar linking regions and events to affected assets, expected direction, lead time, and confidence
- Independent short-term (5 minutes–4 hours) and swing (1–7 days) signal engines
- A/B/C signal grades with entry zone, target, stop/invalidation, expected move, evidence, confidence, and immutable issue record
- Decision Audit & Accuracy Center tracking direction accuracy, early-hit rate, high-confidence accuracy, false positives, simulated return, maximum drawdown, and lead time
- Twenty-source strategy-bot observation pool: public references and account read-only placeholders remain separate
- Agent economy, resource reward, credit, budget, and authorization simulation
- Leverage tiers from 1x through 10x; 10x is the automatic ceiling and margin is capped at 5% of total capital
- Liquidation penalties: first event reduces trust, second pauses 5x+, third revokes automatic leverage for the year
- Expanded SQLite schema for immutable decision signals, multi-period outcomes, weather events, assets, ticks, alerts, and data-source health
- No exchange account, API key, order placement, or real trading

## Run on Mac

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Production verification

```bash
npm run typecheck
npm run build
```

## Test boundary

Crypto prices use live public exchange streams when the source is reachable. Agriculture/metals, weather, strategy signals, bot performance figures, paper returns, and agent budgets remain clearly labeled prototype/reference data. No API keys are required. Account read-only connections are placeholders until the operator supplies platform credentials. Real order placement, wallets, transfers, and automatic follow-trading remain excluded.
