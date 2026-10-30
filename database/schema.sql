PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS crypto_assets (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_ticks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT NOT NULL REFERENCES crypto_assets(id),
  price REAL NOT NULL,
  volume_24h REAL,
  change_5m REAL,
  change_24h REAL,
  received_at TEXT NOT NULL,
  UNIQUE(asset_id, received_at)
);
CREATE INDEX IF NOT EXISTS idx_market_ticks_asset_time ON market_ticks(asset_id, received_at DESC);

CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('P1','P2','P3','P4')),
  enabled INTEGER NOT NULL DEFAULT 1,
  match_mode TEXT NOT NULL CHECK(match_mode IN ('all','any')),
  conditions_json TEXT NOT NULL,
  cooldown_minutes INTEGER NOT NULL DEFAULT 15,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES alert_rules(id),
  asset_id TEXT NOT NULL REFERENCES crypto_assets(id),
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL,
  acknowledged_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_market_alerts_status_time ON market_alerts(status, created_at DESC);

CREATE TABLE IF NOT EXISTS data_source_health (
  source_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  last_message_at TEXT,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS monitor_preferences (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  mode TEXT NOT NULL DEFAULT 'smart50' CHECK(mode IN ('smart30','smart50','custom','all200')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_assets (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  market_class TEXT NOT NULL CHECK(market_class IN ('crypto','agriculture','metal')),
  enabled INTEGER NOT NULL DEFAULT 1,
  UNIQUE(symbol, market_class)
);

CREATE TABLE IF NOT EXISTS decision_signals (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES market_assets(id),
  horizon TEXT NOT NULL CHECK(horizon IN ('short','swing')),
  direction TEXT NOT NULL CHECK(direction IN ('BUY','SELL','WATCH')),
  grade TEXT NOT NULL CHECK(grade IN ('A','B','C')),
  confidence REAL NOT NULL,
  entry_json TEXT NOT NULL,
  target_json TEXT NOT NULL,
  stop_json TEXT NOT NULL,
  expected_move TEXT,
  time_window TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  market_snapshot_json TEXT NOT NULL,
  locked_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decision_signals_horizon_time ON decision_signals(horizon, created_at DESC);

CREATE TABLE IF NOT EXISTS signal_outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id TEXT NOT NULL REFERENCES decision_signals(id),
  checkpoint TEXT NOT NULL CHECK(checkpoint IN ('5m','15m','1h','4h','24h','3d','7d')),
  actual_change REAL NOT NULL,
  direction_correct INTEGER NOT NULL,
  target_hit INTEGER NOT NULL,
  stop_hit INTEGER NOT NULL,
  simulated_pnl REAL,
  evaluated_at TEXT NOT NULL,
  UNIQUE(signal_id, checkpoint)
);

CREATE TABLE IF NOT EXISTS weather_events (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  affected_assets_json TEXT NOT NULL,
  expected_direction TEXT,
  confidence REAL,
  starts_at TEXT,
  ends_at TEXT,
  source_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS normalized_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  binance_price REAL,
  okx_price REAL,
  merged_price REAL NOT NULL,
  spread_pct REAL,
  dual_source_verified INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_normalized_quotes_symbol_time ON normalized_quotes(symbol, received_at DESC);

CREATE TABLE IF NOT EXISTS paper_trades (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES decision_signals(id),
  side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
  leverage INTEGER NOT NULL CHECK(leverage IN (1,2,3,5,10)),
  margin_amount REAL NOT NULL,
  notional_amount REAL NOT NULL,
  entry_price REAL NOT NULL,
  stop_price REAL NOT NULL,
  liquidation_price REAL,
  fee_amount REAL NOT NULL DEFAULT 0,
  slippage_amount REAL NOT NULL DEFAULT 0,
  funding_amount REAL NOT NULL DEFAULT 0,
  realized_pnl REAL,
  status TEXT NOT NULL CHECK(status IN ('open','closed','stopped','liquidated')),
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS strategy_bot_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('public','account_readonly')),
  connection_status TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  credentials_ref TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_bot_signals (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES strategy_bot_sources(id),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  leverage REAL,
  entry_price REAL,
  raw_payload_hash TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  UNIQUE(source_id, raw_payload_hash)
);

CREATE TABLE IF NOT EXISTS agent_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credit_score REAL NOT NULL DEFAULT 0,
  resource_tier TEXT NOT NULL CHECK(resource_tier IN ('R0','R1','R2','R3','R4')),
  authorization_level TEXT NOT NULL CHECK(authorization_level IN ('L0','L1','L2','L3','L4','L5')),
  monthly_budget REAL NOT NULL DEFAULT 0,
  spent REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_purchases (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_accounts(id),
  resource_type TEXT NOT NULL CHECK(resource_type IN ('data','api','compute','service')),
  purpose TEXT NOT NULL,
  simulated_cost REAL NOT NULL,
  verified_net_contribution REAL,
  approval_level TEXT NOT NULL,
  purchased_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS liquidation_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_accounts(id),
  paper_trade_id TEXT REFERENCES paper_trades(id),
  leverage REAL NOT NULL,
  loss_amount REAL NOT NULL,
  cause TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'automatic_penalty',
  credit_penalty REAL NOT NULL,
  occurred_at TEXT NOT NULL
);
