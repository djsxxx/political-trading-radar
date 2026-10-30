# 政治人物交易雷达 · Financial AI OS

基于 Electron、React 和 TypeScript 的 Mac 桌面应用，包含政治人物交易披露、年度资产、独立权力地图、股票行情和美国富豪榜。原有多市场工作台保留在应用内。

## 在线版

- 网页版：<https://djsxxx.github.io/political-trading-radar/>
- 权力地图（世界地图 + 全球万卡算力中心）：<https://djsxxx.github.io/political-trading-radar/#power-map>
- 源码：<https://github.com/djsxxx/political-trading-radar>

在线版由 GitHub Actions 从 `main` 分支自动构建（`vite.web.config.ts`），使用仓库内的数据快照；“更新披露”、实时行情等依赖桌面端的功能在网页中不可用。公开版不含福布斯富豪榜数据和版权保留的人物头像，见 `docs/PUBLIC-RELEASE.md`。

## 用 VS Code 打开

双击 `政治人物交易雷达.code-workspace`，或在 VS Code 中打开本项目文件夹。终端应位于包含 `package.json` 的项目根目录。

```bash
npm ci
npm run dev
```

建议使用 Node.js 22 LTS 与 npm。无需交易所账户或 API 密钥；在线披露和行情更新需要网络。数据快照日期、来源和缺失范围以界面及数据文件为准。

VS Code 的“终端 → 运行任务”提供开发、类型检查、生产构建与本地数据审计任务。

## 验证和打包

```bash
npm run typecheck
npm run audit
npm run build
npm run dist:mac
```

`audit` 执行现有的八项本地数据/计算审计。`desktop/*.test.ts` 包含独立的 Electron 集成测试，部分访问外网，不包含在离线审计中。Mac 打包目标为 Apple Silicon，产物写入 `release/`。

已有应用可通过 `打开政治人物雷达.command` 打开；此入口指向本机保留的 v28 构建。新克隆没有这个构建，请先运行开发模式或打包。`START-MAC.command` 是原工作台开发启动入口。

## 目录

| 目录 | 内容 |
| --- | --- |
| `desktop/` | Electron 主进程、预加载、行情与披露服务、集成测试 |
| `frontend/src/` | React 页面、组件与计算模型 |
| `frontend/public/` | 应用内置数据快照、图片和地图 |
| `research/political-trades/` | 数据生成脚本、来源原件、历史快照、审计脚本 |
| `docs/` | 各功能说明与历史工作台说明 |
| `database/` | 数据库结构；运行数据库不提交 |
| `test-artifacts/` | 历史验收截图和核验结果 |
| `release/`、`out/`、`node_modules/` | 本机产物与依赖，Git 忽略 |

## 数据与功能边界

披露是事后记录，金额通常为区间，可能涉及配偶、共同账户或家族；不等于当前持仓、可交易信号或净资产。股票价格不是披露人的实际成交价，期权映射标的行情。富豪财富是带日期的估值快照，不能视作实时余额。保留来源链接、许可与缺失状态，原始研究文件不自动清理。

应用不执行真实下单、转账或自动跟单。旧工作台部分内容为原型/参考数据，详见[原工作台说明](docs/LEGACY-WORKBENCH.md)。

更多说明：[政治人物雷达](docs/POLITICAL-RADAR.md)、[权力地图](docs/POLITICAL-ATLAS.md)、[前500富豪榜](docs/TOP500-UNITS.md)、[数据研究](research/political-trades/README.md)、[仓库维护](docs/REPOSITORY.md)。
