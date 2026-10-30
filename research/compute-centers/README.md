# 全球万卡算力中心

首页世界地图“算力中心”图层的数据来源与生成方法。输出文件：`frontend/public/compute-centers.json`。

## 收录口径

- 单个园区或集群达到 **1 万张 AI 加速卡**，或 **1 万 H100 当量**（含 Epoch 预测的规划规模）即收录。
- 另收 TOP500（2026 年 6 月）前十中 Epoch 未覆盖的超算：LineShine、Fugaku。
- 不含普通云数据中心。
- 不是完整清单：Epoch 自述其集群库只覆盖全球集群算力的一部分；中国条目在公开版中匿名且无位置。

## 数据来源（快照日期 2026-10-30）

| 文件 | 来源 | 许可 |
|---|---|---|
| `raw/epoch_data_centers.csv`、`raw/epoch_data_center_timelines.csv` | [Epoch AI · AI Data Centers](https://epoch.ai/data/ai-data-centers) | CC BY 4.0 |
| `raw/epoch_gpu_clusters.csv` | [Epoch AI · GPU Clusters](https://epoch.ai/data/gpu-clusters)（官方已标记停止更新） | CC BY 4.0 |
| `raw/geocode-cache.json` | 由园区公开地址经 OpenStreetMap Nominatim 查询 | ODbL |

## 生成

```bash
node research/compute-centers/geocode.cjs   # 仅新增园区时需要；联网，每秒 1 次
node research/compute-centers/build.cjs     # 离线合并，坐标不在所属国家内会直接报错
node research/political-trades/audit_compute_centers.cjs
```

## 规则

- 状态：截至快照日，时间线已有 H100 当量为“运营中”；有建设记录但当前为 0 为“在建”。
- 集群库中与园区相距 5 公里内的集群并入该园区，显示为“同址集群”；位置只到国家级的集群列入 `unplaced`，不上地图。
- 地理编码落点错误或失败的 6 个园区在 `build.cjs` 的 `manualCoords` 中人工给出城市级坐标。
- H100 当量是 Epoch 的算力折算值，不等于实际卡数；电力 MW 也不能换算成卡数。
