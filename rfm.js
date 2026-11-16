/**
 * RFM 客户分群引擎（纯逻辑，Node/浏览器通用）
 *
 * R = Recency 距上次购买天数（越小越好）
 * F = Frequency 购买次数（越多越好）
 * M = Monetary 累计消费（越多越好）
 * 按五分位打 1-5 分，R 反向计分。
 */
"use strict";

const RFMEngine = (() => {

  /** 五分位打分。ascending=true 表示值越大分越高 */
  function quintileScores(values, ascending = true) {
    const sorted = [...values].sort((a, b) => a - b);
    const q = [0.2, 0.4, 0.6, 0.8].map(p => sorted[Math.floor(p * (sorted.length - 1))]);
    return values.map(v => {
      let score = 1;
      for (const t of q) if (v > t) score++;
      return ascending ? score : 6 - score;
    });
  }

  /** 八类经典分群（按 R/F/M 高低组合，阈值用中位分 3） */
  const SEGMENTS = [
    { key: "champion",    name: "重要价值客户", test: (r, f, m) => r >= 4 && f >= 4 && m >= 4,
      color: "#dc2626", action: "VIP 专属服务、新品优先体验、生日礼遇" },
    { key: "loyal",       name: "重要保持客户", test: (r, f, m) => r >= 3 && f >= 4,
      color: "#ea580c", action: "会员日定向券、积分加速、专属客服回访" },
    { key: "potential",   name: "重要发展客户", test: (r, f, m) => r >= 4 && f <= 3 && m >= 3,
      color: "#d97706", action: "首单复购券、关联品类推荐、养成习惯" },
    { key: "new",         name: "新客户",       test: (r, f, m) => r >= 4 && f <= 2 && m < 3,
      color: "#65a30d", action: "新人礼包、新手教程、首评返积分" },
    { key: "promising",   name: "潜力客户",     test: (r, f, m) => r >= 3 && f <= 3 && m <= 3,
      color: "#0891b2", action: "满减券引导二次购买、内容种草" },
    { key: "needCare",    name: "重要唤回客户", test: (r, f, m) => r <= 2 && f >= 3 && m >= 3,
      color: "#7c3aed", action: "大额唤回券、专属折扣、电话回访" },
    { key: "atRisk",      name: "一般挽留客户", test: (r, f, m) => r <= 2 && f <= 3,
      color: "#9333ea", action: "短信唤回、流失调研问卷" },
    { key: "lost",        name: "流失客户",     test: () => true,
      color: "#6b7280", action: "低成本触达（邮件/ push），不投放高价资源" },
  ];

  /**
   * customers: [{ id, name, lastPurchaseDays, orderCount, totalSpent }]
   * 返回带分数与分群的客户数组 + 分群统计
   */
  function analyze(customers) {
    const rScores = quintileScores(customers.map(c => c.lastPurchaseDays), false);
    const fScores = quintileScores(customers.map(c => c.orderCount), true);
    const mScores = quintileScores(customers.map(c => c.totalSpent), true);

    const analyzed = customers.map((c, i) => {
      const r = rScores[i], f = fScores[i], m = mScores[i];
      const seg = SEGMENTS.find(s => s.test(r, f, m));
      return { ...c, r, f, m, total: r + f + m, segment: seg };
    });

    const segmentStats = SEGMENTS.map(seg => {
      const members = analyzed.filter(c => c.segment.key === seg.key);
      return {
        ...seg,
        count: members.length,
        revenue: members.reduce((s, c) => s + c.totalSpent, 0),
        avgRfm: members.length
          ? (members.reduce((s, c) => s + c.total, 0) / members.length).toFixed(1)
          : 0,
      };
    }).filter(s => s.count > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return { customers: analyzed, segmentStats };
  }

  return { analyze, SEGMENTS, quintileScores };
})();

if (typeof module !== "undefined") module.exports = RFMEngine;
