# 美国富豪榜前100

入口：政治人物交易雷达左侧，“数据与来源”之后。与政治人物资产分开，不叠加两套统计。

本版是2026-10-26单日快照，非实时账户余额。Forbes官方接口返回503，因此采用公开RTB镜像的明确日期路径，榜首5位与Forbes当日网页值核对一致。镜像`latest`曾返回2026-08-31，故不使用此别名判断数据时效。

- 原始榜：https://www.forbes.com/real-time-billionaires/
- 镜像项目、说明及MIT许可：https://github.com/komed3/rtb-api
- 本次数据：https://raw.githubusercontent.com/komed3/rtb-api/main/api/list/rtb/2026-10-26
- 范围：citizenship=us，按networth降序取100个唯一条目。不是居住在美国的人，也不是全球前100。家族条目保持原口径。
- 输入networth单位为百万美元，输出worthUsd乘以1,000,000；UI显示千分位美元，不能把估值精度理解成真实财产精度。
- 基础档案65/100有照片URL；照片不可用用占位，身份、公司字段可缺失。任职字段来自镜像档案，可能滞后。未保存私人住宅地址或坐标。
- 公司是榜单财富来源，不是完整持股清单。无连续快照，不虚构日变化或财富K线。
- 个人账号首批3人（Musk、Gates、Zuckerberg）有官方原始链接核对；其余明确待核实。链接直达不等于已监控帖子。
- 党籍、捐款、背书、证券持仓、房产尚未核实，不强制红蓝标签，不按名字或同名记录自动匹配。

手动重建：`node research/political-trades/build_billionaires.cjs YYYY-MM-DD`，需可访问公开镜像。先验证榜单日期、完整性与来源，再接受新快照。本版未新增后台定时任务。归档目录保留各日快照；如同日修订需另作版本留存，不应覆盖历史而无记录。

验收：`node research/political-trades/audit_billionaires.cjs`，以及`npm run typecheck`。界面检查搜索、行业筛选、4页分页、人物侧栏、账号与原件链接。现有政治数据源不改。
