# 政治人物交易雷达

美国联邦政治人物的公开交易披露、年度资产申报与权力地图，并在世界地图上标出全球万卡级算力中心。基于 React、TypeScript 与 Electron，可作为网页或 Mac 桌面应用运行。

## 在线版

- 网页版：<https://djsxxx.github.io/political-trading-radar/>
- 权力地图（世界地图 + 全球万卡算力中心）：<https://djsxxx.github.io/political-trading-radar/#power-map>
- 源码：<https://github.com/djsxxx/political-trading-radar>

在线版由 GitHub Actions 从 `main` 分支自动构建（`vite.web.config.ts`），使用仓库内的数据快照；“更新披露”等依赖桌面端的功能在网页中不可用。

## 功能

- **交易披露**：国会议员股票与加密资产交易、迟报档案、股票共识与交易时间线，每条记录链接官方原件。
- **年度资产**：年度财务披露的资产区间、年度变化与持仓结构；金额为披露区间，不是实时净资产。
- **权力地图**：世界地图进入美国州地图，按州与党派联动人物、资产；州名旁数字为现任联邦众议员人数。
- **全球算力中心**：单个园区或集群达到 1 万张 AI 加速卡（或 1 万 H100 当量）的算力中心，以及 TOP500 前十超算；颜色区分运营中、在建和超算，圆点大小表示规模。

## 本地运行

```bash
npm ci
npm run dev          # Electron 桌面开发模式
npx vite build --config vite.web.config.ts   # 构建网页版到 dist-web/
```

建议 Node.js 22。验证：

```bash
npm run typecheck
npm run audit        # 本地数据与计算审计
npm run build
```

## 数据来源

- 国会交易与年度披露：美国众议院 Clerk、参议院 eFD（政府公开文件）
- 国会议员照片：unitedstates.github.io（美国政府作品）
- 算力中心：Epoch AI（CC BY 4.0）、TOP500.org；地理编码 OpenStreetMap（ODbL）。生成方法见 `research/compute-centers/README.md`
- 底图：NASA Blue Marble；国界 Natural Earth

公开版不含福布斯富豪榜数据与版权保留的人物头像，富豪页面显示为无数据。详见 `docs/PUBLIC-RELEASE.md`。

所有内容均为事后公开披露的整理，不是投资建议。

## 目录

| 目录 | 内容 |
| --- | --- |
| `desktop/` | Electron 主进程、预加载、披露与行情服务 |
| `frontend/src/` | React 页面、组件与计算模型 |
| `frontend/public/` | 数据快照、地图与底图 |
| `research/` | 数据生成脚本、来源快照与审计脚本 |
| `docs/` | 各功能说明 |
