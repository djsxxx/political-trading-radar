# 美国政治人物交易披露：最近90天整理

- 数据生成日：2026-10-26（Asia/Shanghai）
- 交易日期范围：2026-07-26 至数据集中最新日期
- 数据来源：美国众议院 Clerk 与参议院 eFD 的公开披露，经开源数据集标准化
- 每条明细均保留 `official_source`，可回到政府原始文件复核

## 概览

| records | people | tickers | purchases | sales | over_45_days |
| --- | --- | --- | --- | --- | --- |
| 1782 | 57 | 503 | 823 | 948 | 98 |

## 多人物共同买入的股票（前15）

| ticker | buyers | records | amount_range | people |
| --- | --- | --- | --- | --- |
| MSFT | 5 | 10 | $835,010–$1,775,000 | Cleo Fields; Gilbert Ray Cisneros, Jr.; Josh Gottheimer; Lisa C. McClain; Ro Khanna |
| TSM | 5 | 5 | $5,005–$75,000 | Cleo Fields; Gilbert Ray Cisneros, Jr.; Michael T. McCaul; Rick W. Allen; Ro Khanna |
| ACN | 3 | 5 | $103,005–$245,000 | Michael T. McCaul; Ro Khanna; Scott Franklin |
| HD | 3 | 4 | $18,004–$95,000 | David J. Taylor; Lloyd Doggett; Ro Khanna |
| AVGO | 3 | 4 | $18,004–$95,000 | David J. Taylor; Rick W. Allen; Ro Khanna |
| NVDA | 3 | 5 | $5,005–$75,000 | Cleo Fields; John J. McGuire III; Ro Khanna |
| PG | 3 | 5 | $5,005–$75,000 | David J. Taylor; Lloyd Doggett; Ro Khanna |
| NFLX | 3 | 4 | $4,004–$60,000 | Byron Donalds; Cleo Fields; Ro Khanna |
| IBM | 3 | 3 | $3,003–$45,000 | Gilbert Ray Cisneros, Jr.; Lloyd Doggett; Ro Khanna |
| BE | 2 | 3 | $1,001,003–$2,015,000 | Nancy Pelosi; Ro Khanna |
| EL | 2 | 2 | $51,002–$115,000 | Jonathan L. Jackson; Ro Khanna |
| PEP | 2 | 6 | $48,006–$195,000 | Ro Khanna; Scott Franklin |
| MRK | 2 | 4 | $46,004–$165,000 | Maria Elvira Salazar; Ro Khanna |
| ON | 2 | 3 | $31,003–$115,000 | Gilbert Ray Cisneros, Jr.; Ro Khanna |
| HUBB | 2 | 5 | $19,005–$110,000 | April McClain Delaney; Ro Khanna |

金额为申报区间逐条相加后的上下限，不是精确成交金额。

## 披露最活跃人物（前15）

| politician | chamber | records | buys | sells | avg_lag_days |
| --- | --- | --- | --- | --- | --- |
| Ro Khanna | house | 717 | 393 | 324 | 23.8 |
| Kevin Hern | house | 160 | 19 | 139 | 18.9 |
| Richard Blumenthal | senate | 123 | 46 | 77 | 26.8 |
| Gilbert Ray Cisneros, Jr. | house | 119 | 66 | 52 | 22.6 |
| April McClain Delaney | house | 109 | 36 | 73 | 18.3 |
| Michael T. McCaul | house | 91 | 50 | 41 | 57.6 |
| Maria Elvira Salazar | house | 58 | 17 | 41 | 18.9 |
| David McCormick | senate | 52 | 17 | 35 | 24.4 |
| Diana Harshbarger | house | 40 | 27 | 13 | 33.1 |
| John Boozman | senate | 29 | 17 | 12 | 30.4 |
| Scott H. Peters | house | 29 | 17 | 12 | 33.2 |
| Richard McCormick | house | 27 | 2 | 25 | 15.4 |
| David J. Taylor | house | 25 | 17 | 8 | 8.6 |
| Suzan K. DelBene | house | 13 | 8 | 5 | 21.5 |
| Scott Franklin | house | 12 | 7 | 5 | 24.5 |

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
