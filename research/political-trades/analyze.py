from __future__ import annotations

import csv
from datetime import date, timedelta
from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parent
RAW_GLOB = str(ROOT / "raw" / "*.parquet")
OUTPUT = ROOT / "output"
AS_OF = date(2026, 10, 26)
CUTOFF = AS_OF - timedelta(days=92)


def write_csv(connection: duckdb.DuckDBPyConnection, filename: str, query: str) -> None:
    path = OUTPUT / filename
    escaped = str(path).replace("'", "''")
    connection.execute(
        f"COPY ({query}) TO '{escaped}' (HEADER, DELIMITER ',', QUOTE '\"', ESCAPE '\"')"
    )


def rows(connection: duckdb.DuckDBPyConnection, query: str):
    cursor = connection.execute(query)
    return [column[0] for column in cursor.description], cursor.fetchall()


def markdown_table(headers, data) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in data:
        values = [str(value if value is not None else "") for value in row]
        lines.append("| " + " | ".join(value.replace("|", "\\|") for value in values) + " |")
    return "\n".join(lines)


OUTPUT.mkdir(parents=True, exist_ok=True)
db = duckdb.connect()
db.execute(f"CREATE VIEW trades AS SELECT * FROM read_parquet('{RAW_GLOB}')")
db.execute(
    f"""
    CREATE VIEW recent AS
    SELECT
      chamber,
      displayName AS politician,
      owner,
      action,
      transactionDate AS transaction_date,
      notificationDate AS notification_date,
      filingDate AS filing_date,
      date_diff('day', transactionDate, filingDate) AS filing_lag_days,
      assetDescription AS asset,
      coalesce(resolvedTicker, printedTicker) AS ticker,
      assetTypeLabel AS instrument,
      amountBracket AS amount_band,
      amountLow AS amount_low,
      amountHigh AS amount_high,
      partialSale AS partial_sale,
      filingStatus AS filing_status,
      sourceUrl AS official_source
    FROM trades
    WHERE transactionDate >= DATE '{CUTOFF.isoformat()}'
      AND coalesce(filingStatus, '') <> 'Deleted'
    """
)

write_csv(
    db,
    "trades_latest_90d.csv",
    "SELECT * FROM recent ORDER BY transaction_date DESC, politician, ticker",
)
write_csv(
    db,
    "buy_consensus_latest_90d.csv",
    """
    SELECT
      ticker,
      any_value(asset) AS asset,
      count(*) AS purchase_records,
      count(DISTINCT politician) AS distinct_buyers,
      round(sum(amount_low), 2) AS disclosed_min_total,
      round(sum(amount_high), 2) AS disclosed_max_total,
      string_agg(DISTINCT politician, '; ' ORDER BY politician) AS politicians,
      max(transaction_date) AS latest_trade_date
    FROM recent
    WHERE action = 'purchase' AND ticker IS NOT NULL
    GROUP BY ticker
    HAVING count(DISTINCT politician) >= 2
    ORDER BY distinct_buyers DESC, disclosed_min_total DESC
    """,
)
write_csv(
    db,
    "active_people_latest_90d.csv",
    """
    SELECT
      politician,
      any_value(chamber) AS chamber,
      count(*) AS records,
      count(*) FILTER (WHERE action = 'purchase') AS purchases,
      count(*) FILTER (WHERE action = 'sale') AS sales,
      round(sum(amount_low), 2) AS disclosed_min_total,
      round(sum(amount_high), 2) AS disclosed_max_total,
      round(avg(filing_lag_days), 1) AS avg_filing_lag_days,
      count(*) FILTER (WHERE filing_lag_days > 45) AS over_45_day_records
    FROM recent
    GROUP BY politician
    ORDER BY records DESC, disclosed_min_total DESC
    """,
)
write_csv(
    db,
    "late_filings_latest_90d.csv",
    """
    SELECT * FROM recent
    WHERE filing_lag_days > 45
    ORDER BY filing_lag_days DESC, transaction_date DESC
    """,
)

overview_headers, overview = rows(
    db,
    """
    SELECT
      count(*) AS records,
      count(DISTINCT politician) AS people,
      count(DISTINCT ticker) AS tickers,
      count(*) FILTER (WHERE action = 'purchase') AS purchases,
      count(*) FILTER (WHERE action = 'sale') AS sales,
      count(*) FILTER (WHERE filing_lag_days > 45) AS over_45_days
    FROM recent
    """,
)
buyers_headers, buyers = rows(
    db,
    """
    SELECT
      ticker,
      count(DISTINCT politician) AS buyers,
      count(*) AS records,
      concat('$', format('{:,.0f}', sum(amount_low)), '–$', format('{:,.0f}', sum(amount_high))) AS amount_range,
      string_agg(DISTINCT politician, '; ' ORDER BY politician) AS people
    FROM recent
    WHERE action = 'purchase' AND ticker IS NOT NULL
    GROUP BY ticker
    HAVING count(DISTINCT politician) >= 2
    ORDER BY buyers DESC, sum(amount_low) DESC
    LIMIT 15
    """,
)
people_headers, people = rows(
    db,
    """
    SELECT
      politician,
      any_value(chamber) AS chamber,
      count(*) AS records,
      count(*) FILTER (WHERE action = 'purchase') AS buys,
      count(*) FILTER (WHERE action = 'sale') AS sells,
      round(avg(filing_lag_days), 1) AS avg_lag_days
    FROM recent
    GROUP BY politician
    ORDER BY records DESC
    LIMIT 15
    """,
)

report = f"""# 美国政治人物交易披露：最近90天整理

- 数据生成日：{AS_OF.isoformat()}（Asia/Shanghai）
- 交易日期范围：{CUTOFF.isoformat()} 至数据集中最新日期
- 数据来源：美国众议院 Clerk 与参议院 eFD 的公开披露，经开源数据集标准化
- 每条明细均保留 `official_source`，可回到政府原始文件复核

## 概览

{markdown_table(overview_headers, overview)}

## 多人物共同买入的股票（前15）

{markdown_table(buyers_headers, buyers)}

金额为申报区间逐条相加后的上下限，不是精确成交金额。

## 披露最活跃人物（前15）

{markdown_table(people_headers, people)}

## 输出文件

- `trades_latest_90d.csv`：逐笔明细
- `buy_consensus_latest_90d.csv`：至少两名人物共同买入的股票
- `active_people_latest_90d.csv`：人物活跃度
- `late_filings_latest_90d.csv`：交易日至申报日超过45天的记录

## 使用限制

- 披露具有滞后性，不代表当前持仓。
- 金额是区间；不要把区间上限当成实际成交金额。
- `owner` 必须区分本人、配偶、共同持有或子女。
- “超过45天”这里只按交易日到申报日计算；法规还涉及知悉日期，不能单凭本表认定违法。
- 第三方标准化可能出错，重要记录应通过 `official_source` 回看原件。
"""
(OUTPUT / "summary_latest_90d.md").write_text(report, encoding="utf-8")

print(f"Generated outputs in {OUTPUT}")
