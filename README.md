# CRM RFM · 客户分群分析

电商运营必备的 RFM 客户分层模型完整实现，含分析引擎、可视化看板与运营策略建议。

## 模型实现（`rfm.js`，纯逻辑，Node/浏览器通用）

- **R/F/M 五分位打分**（1-5 分，R 反向）
- **8 类经典客群**：重要价值 / 重要保持 / 重要发展 / 新客户 / 潜力 / 重要唤回 / 一般挽留 / 流失
- 每类客群附带**可直接落地的运营策略**

## 看板功能

- KPI：客户总数 / 累计 GMV / 重要价值客户数 / 待挽回 GMV 风险
- 客群收入贡献柱状图（Canvas 手绘）
- R-F 分布散点图（点色区分客群，一眼看出右下角的「高价值待唤回」区）
- 客群明细卡：人数、收入贡献、平均 RFM、运营策略
- 客户明细表：R/F/M 分 pill 高亮（高分绿/低分红），按客群筛选
- 200 个客户演示数据（6 种消费画像，可复现伪随机生成）

## 引擎 API

```js
const { customers, segmentStats } = RFMEngine.analyze([
  { id, name, lastPurchaseDays, orderCount, totalSpent }, ...
]);
```

## 运行

浏览器直接打开 `index.html`。

## License

MIT
