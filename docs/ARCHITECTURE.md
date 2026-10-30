# Financial AI OS — v0.4 Test Architecture

## Current flow

1. `marketFeed.ts` connects to Binance and OKX public WebSockets in the Electron main process; no credentials are used.
2. Quotes are normalized, dual-source spread checked, and pushed to the renderer once per second.
3. `cryptoUniverse.ts` supplies metadata and clearly marked reference values for assets without a live quote.
4. A liquidity, activity, volatility, and AI-quality rank selects 30 or 50 active assets; custom favorites and all-200 modes remain available.
5. `alertEngine.ts` evaluates enabled composite rules and enforces rule/asset cooldown deduplication.
6. Short and swing signals keep separate evidence priorities, ledgers, and paper-trade outcomes.
7. Strategy-bot references never directly generate orders; their copied signal outcome is re-evaluated after costs.
8. Agent resource rewards use verified net contribution, drawdown, and rule compliance rather than gross profit alone.
9. Leverage and signal confidence are separate. 10x margin is capped at 5% of total capital, and liquidation events trigger persistent trust penalties.

## Apple Silicon target

The prototype is lightweight for a MacBook Pro M5 with 48 GB memory. For real feeds, network ingestion, normalization, persistence, and alert evaluation should run in the Electron main/background process. The renderer should receive throttled batches rather than one render per WebSocket message.

## Safety boundary

- Public/read-only crypto market data only
- Paper execution only
- No wallet or exchange credentials
- No trading APIs or automated orders
