# 政治人物交易雷达：本地可用版

双击项目根目录的「打开政治人物雷达.command」，或打开 `release/political-radar-v5/mac-arm64/MXdai.app`。

默认展示全部人物；共和党、民主党、独立人士筛选同时作用于人物、资产去重数、股票共识、买卖交易、关联人物、迟报与CSV导出。资产去重采用申报代码优先、没有代码时按资产描述去重；不同写法可能仍产生重复，不代表当前持仓数量或资产总额。搜索目前筛选列表，顶部统计保持所选党派的完整半年范围。

人物名录539人，半年原始披露4763行。交易窗口为2026-04-26至2026-10-26；最新交易日2026-10-20、最新申报日2026-10-22。每个原始年度文件已按下载快照SHA256复核。

来源：austin-starks/congressional-stock-trades，人物与头像来自unitedstates/congress-legislators与其公开照片库。逐笔政府原件链接在交易表中。第三方解析未逐笔人工核验。

股票和期权可能对应同一代码，资产名称保留原始描述及工具标记。修订披露可能重述交易，当前计数为披露记录数；Deleted行不计共识，迟报档案保留。超过45天只是日期差筛选。

已接入Yahoo最新可用市场价和一年日线，并显示近半年曲线、交易日收盘价及至今标的价格变化。价格不是实际成交价，期权使用标的价格，卖出后的变化不代表申报人盈亏。正在查看的证券每5分钟刷新；失败时使用缓存并标明缓存状态。

桌面应用每6小时同步公开披露，启动时补查；关闭应用后暂停。手动按钮可立即同步。每个下载的Parquet文件按发布清单SHA256核验；同步前后快照、原始文件、行情快照保存在Electron用户目录的 `political-radar/archive` 下，可在“数据与来源”查看路径。没有清理策略，不自动删除；超过45天记录跨窗口保留。半年界面展示当前窗口，完整历史文件仍在原研究目录与归档中。

加密披露页保留历史相关记录，并区分直接加密资产、加密ETF/基金、相关公司股票。BTC、BCH、ETH、ETC分别映射行情。没有披露时显示“未发现已收录披露”；未接入年度持仓不能证明今天持有或不持有。

年度资产已通过Civitas Research公开持仓API接入（CC BY 4.0，https://civitas-research.org/developers），覆盖范围以界面人数为准。人物详情默认进入年度资产，人物卡显示最近年报区间；党派筛选同步影响年度合计、股票与加密资产分类。资产截止日、提交日和报告年份分别保留，每份报告链接政府原件。报告未扣负债，因此不是净资产；完整持仓数量仍未知，不算实时估值。

年度数据每天检查，另有“更新年度资产”按钮；按源频率限制依次核对人物和分页。下载的初始原始响应保存在 `research/political-trades/annual-raw/civitas`，桌面更新前后的原始响应保存在用户目录 `political-radar/annual-archive`。不自动删除。

入职申报不计入年度合计；无法解析的扫描件、缺少年报的人和全未标价报告不填零；无上限档显示“至少”。每人使用最近可用的年度报告，群体合计可能涵盖不同报告年度，并显示覆盖日期范围。分类占比按金额下限计算；缺失价值项单列。股票、期权、直接加密货币、加密ETF、普通基金、房地产、私人企业、现金、债券分别显示。完整明细按原件类型二次细分OP期权及明确名称的加密ETF，分类合计与报告总区间核验。

半年买卖累计规模保留在独立折叠面板中，不作为总资产。目录新增历史人物党派未知时不猜测。

构建：`npm run build`；生成Mac应用：`./node_modules/.bin/electron-builder --mac dir --arm64 --config.directories.output=release/political-radar-v5`。

数据生成脚本为 `research/political-trades/build_app_data.py`，依赖DuckDB；人物元数据已保存在 `research/political-trades/raw/legislators-current.json`。当前版本的窗口日期固定在脚本中。

验收：Electron集成测试验证真实MSFT报价与251个日线点、报价缓存、真实在线披露同步、Parquet校验、更新归档和模拟断网保留。打包应用实测MSFT半年图表、逐笔收盘价/至今涨跌、加密披露和亿美元结构。截图位于 `test-artifacts/political-radar-real-prices.png`、`political-radar-crypto.png` 和 `political-radar-asset-structure.png`。

年度检查：`node research/political-trades/audit_annual.cjs` 验证身份去重、官方链接、明细/分类/总额逐分一致、入职报告与缺失排除；`desktop/annualAssets.test.ts` 验证年度归档及不一致数据回退。官方佩洛西2025报告第一页已下载渲染抽核，修正另一数据源URL错误年份。
