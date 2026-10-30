# 公开版发布说明

公开仓库：<https://github.com/djsxxx/political-trading-radar> · 在线版：<https://djsxxx.github.io/political-trading-radar/>

## 公开版与本机版的区别

公开仓库由本机项目的导出脚本生成，历史与本机仓库独立。以下内容只保留在本机：

| 内容 | 原因 |
|---|---|
| 多市场工作台（交易机器人）：加密行情、资金中心、双周期策略信号、策略机器人、杠杆风险等页面，`desktop/marketFeed.ts`、`backend/`、`database/` | 公开版只发布政治人物交易雷达；源码中标记为交易机器人的代码块在导出时删除，未被引用的工作台前端文件一并剔除 |
| 内部工作日志（`progress.md`、`findings.md`、`task_plan.md`）与本机启动入口 | 仅本机使用 |
| 福布斯富豪榜数据（`billionaires-us.json` 等四个文件及 `research/political-trades/billionaire-snapshots/`） | 福布斯榜单受版权保护；公开版替换为空数据，富豪页面显示为无数据 |
| `frontend/public/billionaire-portraits/` 人物头像 | 多数取自基金会与公司官网，版权保留 |
| `test-artifacts/` 历史截图 | 内部验收截图，含上述头像与数据 |

文本文件中的本机用户目录在导出时替换为 `~`。

## 公开数据来源

- 国会议员交易与年度披露：美国众议院 Clerk、参议院 eFD（政府公开文件）
- 国会议员照片：unitedstates.github.io（美国政府作品）
- 算力中心：Epoch AI（CC BY 4.0）、TOP500.org；地理编码 OpenStreetMap（ODbL）
- 底图：NASA Blue Marble；国界 Natural Earth

## 更新公开仓库

```bash
node scripts/export-public.cjs ../political-trading-radar-public
cd ../political-trading-radar-public
git add -A && git commit -m "更新公开版" && git push
```

推送到 `main` 后，GitHub Actions 自动构建网页版并发布到 GitHub Pages。
