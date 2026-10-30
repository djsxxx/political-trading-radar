# 年度披露资产变化：2024 → 2025

本功能为历史申报区间对照，不是投资收益、实时持仓或净资产估计。

## 范围与当前覆盖
核查539位已收录国会人物。按2025-12-31党派归属，只有2024和2025年末均在任、党派一致的人物有资格进入固定队列。总统、副总统不在本批名录；独立人士保留资料，但不并入两党表。

2024年候选历史文件407份，其中149份通过官方原件与明细核验。先得到66个两年暂定候选，再对这66人的2025官方PDF逐份复核，最终46人可比：共和党25/274人、民主党21/262人。排除/缺口分别249、241人。其余3名独立人士单独留在数据中。

最终46人的差值区间均跨零。两党明确增加和明确减少均为0，这表示尚不能根据这些区间确定方向，不表示无人实际增减。不可将该样本外推为全党财富变化。此前基于接口的暂定3个方向结论因官方原件无法可靠对齐，均撤回、未进入最终结果。

参议院历史源未完整接入；扫描件、缺报告、未标价、无上限、资产行数/金额档不一致、较新修订未解析、任期或党派变化均明确标记。核验失败说明本工具不能可靠提取/对齐，不代表申报人违规。

## 来源与原件验证
历史众议院资产行来自已下载的ZipLime公共数据。其filing_year是提交年份，不能直接作资产覆盖年份。使用官方report_url定位PDF，再检查首页Filing Year、Annual Report、姓名、州及提交日期。

提取Schedule A内资产类型标记数，要求和来源资产行数一致；逐金额档进行多重集合核对，避免错把收入、交易额或重复明细算入资产。下载原件SHA256与历史索引一致时才接受，保留本地PDF及验证JSON。无法识别或金额不一致的行不补猜测值。

2025明细来自Civitas Research公共API（CC BY 4.0），现有完整分页快照。进入可比候选的报告也独立核对官方PDF；原件不符或无法核验者退出。官方提交日期优先于接口日期，两者在数据中保留。Civitas不支持历史year参数：请求2024仍返回最新报告，因此没有用该参数伪造历史。

原件和核验文件：research/political-trades/annual-history-raw/。数据快照：frontend/public/annual-history.json。覆盖旧快照前按SHA256归档到annual-history-raw/snapshots/。同一人的修订版本不累加，较新未解析文件会阻断旧版本进入可比计算。

来源：
- https://disclosures-clerk.house.gov/FinancialDisclosure （官方原件）
- https://civitas-research.org/developers （Civitas公开数据，CC BY 4.0）
- https://huggingface.co/datasets/ZipLime/congress-trading （历史明细；以官方原件复核）
- https://github.com/unitedstates/congress-legislators （任期与党派）

## 计算
个人差值下限=currentLow−previousHigh，差值上限=currentHigh−previousLow。下限>0才记“披露区间明确增加”；上限<0才记“披露区间明确减少”；其余为重叠/方向无法确定。无资料则不计算。

党派两年金额必须对相同可比人物求和。没有取中点，没有将两年下限的差直接称为增长，没有生成投资收益率。所有金额保留原始美元值，显示换算为亿美元。

变化可能包含新增资金、资产转移、家庭范围变化及修订，不意味着市场投资赚亏。部分金额报告可供查看，但不进入完整可比总额。

## 使用与验证
侧栏“年度资产增减”→点共和党/民主党→搜索中英文人物→“对照与原件”。可查看两年美元区间、报告截止日、提交日期、未标价数量、缺口、版本和官方原件链接。此功能是已核验快照，不随普通交易刷新自动重算。

构建历史：设置PYTHONPATH包含/private/tmp/political-trades-python与bundled Python的site-packages，以系统python3运行research/political-trades/build_annual_history.py。使用duckdb和pypdf，官方请求2线程、0.65秒全局间隔，缓存续跑。

测试：node research/political-trades/audit_annual_changes.cjs，含区间重叠/明确增减/缺值/无上限/非连续年度单测，并检查真实队列唯一ID、两份原件SHA、覆盖分母、党派汇总和方向计数。

“共同资产、共同股票、行业分析台”在本轮仅讨论设计，不包含新模型、社交正文采集或该模块实现。
