# 美国政治人物交易披露数据

本目录保存美国国会议员交易披露的本地研究副本和分析结果。

## 数据来源

- 标准化数据集：`austin-starks/congressional-stock-trades`
- 原始政府来源：美国众议院 Clerk 与参议院 eFD
- 数据快照：见 `raw/snapshot.json`
- 解析方法和人工修正记录：见 `raw/METHODOLOGY.md`

每条交易保留 `sourceUrl`，用于回到官方披露文件复核。原始 Parquet 文件覆盖2012年至2026年。

## 重新生成

安装 DuckDB Python 包后运行：

```bash
PYTHONPATH=/private/tmp/political-trades-python python3 research/political-trades/analyze.py
```

当前分析默认生成截至2026-10-26的最近90天明细与汇总。

## 注意

这些是事后披露，不是实时仓位，也不是投资建议。披露金额为区间，人物可能代表本人、配偶、共同账户或受抚养子女。
