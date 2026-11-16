// RFM 分析看板逻辑
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const fmtWan = (n) => n >= 10000 ? (n / 10000).toFixed(1) + " 万" : n.toLocaleString();

  const { customers, segmentStats } = RFMEngine.analyze(CRM_CUSTOMERS);
  let filter = null;

  /* ---------- KPI ---------- */
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const champions = customers.filter(c => c.segment.key === "champion");
  const atRiskRevenue = customers
    .filter(c => ["needCare", "atRisk", "lost"].includes(c.segment.key))
    .reduce((s, c) => s + c.totalSpent, 0);

  $("#kpiRow").innerHTML = `
    <div class="kpi"><small>客户总数</small><b>${customers.length}</b><span class="sub">覆盖全部成交客户</span></div>
    <div class="kpi"><small>累计 GMV</small><b>¥${fmtWan(totalRevenue)}</b><span class="sub">历史总消费</span></div>
    <div class="kpi"><small>重要价值客户</small><b style="color:#dc2626">${champions.length} 人</b><span class="sub">贡献 ¥${fmtWan(champions.reduce((s, c) => s + c.totalSpent, 0))}</span></div>
    <div class="kpi"><small>待挽回 GMV 风险</small><b style="color:#7c3aed">¥${fmtWan(atRiskRevenue)}</b><span class="sub">唤回+挽留+流失客群的历史贡献</span></div>`;

  /* ---------- 柱状图：客群收入 ---------- */
  function drawBars() {
    const canvas = $("#barChart");
    const dpr = devicePixelRatio || 1;
    const W = canvas.clientWidth, H = 260;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const data = segmentStats;
    const max = Math.max(...data.map(d => d.revenue));
    const barW = Math.min(38, (W - 40) / data.length - 14);
    const slot = (W - 40) / data.length;

    ctx.font = "10.5px sans-serif";
    data.forEach((d, i) => {
      const h = (d.revenue / max) * (H - 70);
      const x = 20 + i * slot + (slot - barW) / 2;
      const y = H - 44 - h;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, 5);
      ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText(d.name.slice(0, 4), x + barW / 2, H - 30);
      ctx.fillText(`${d.count}人`, x + barW / 2, H - 16);
      ctx.fillStyle = "#17202b";
      ctx.fillText(fmtWan(d.revenue), x + barW / 2, y - 6);
    });
  }

  /* ---------- 散点图：R（横，天数越小越好） × F（纵） ---------- */
  function drawScatter() {
    const canvas = $("#scatterChart");
    const dpr = devicePixelRatio || 1;
    const W = canvas.clientWidth, H = 260;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const pad = { l: 36, r: 14, t: 12, b: 34 };
    const maxR = Math.max(...customers.map(c => c.lastPurchaseDays));
    const maxF = Math.max(...customers.map(c => c.orderCount));
    const x = (v) => pad.l + (v / maxR) * (W - pad.l - pad.r);
    const y = (v) => H - pad.b - (v / maxF) * (H - pad.t - pad.b);

    // 轴
    ctx.strokeStyle = "#e5e9f0";
    ctx.strokeRect(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("距上次购买天数 →", W / 2, H - 8);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("购买次数 →", 0, 0);
    ctx.restore();

    customers.forEach(c => {
      ctx.beginPath();
      ctx.arc(x(c.lastPurchaseDays), y(c.orderCount), 4, 0, Math.PI * 2);
      ctx.fillStyle = c.segment.color + "cc";
      ctx.fill();
    });
  }

  /* ---------- 客群明细 ---------- */
  const maxRev = Math.max(...segmentStats.map(s => s.revenue));
  $("#segmentList").innerHTML = segmentStats.map(s => `
    <div class="seg-card">
      <span class="seg-dot" style="background:${s.color}"></span>
      <div class="seg-main">
        <div class="seg-title">
          <b>${s.name}</b>
          <span class="nums">${s.count} 人 · 贡献 ¥${fmtWan(s.revenue)} · 平均 RFM ${s.avgRfm}</span>
        </div>
        <div class="seg-action"><b>运营策略：</b>${s.action}</div>
        <div class="seg-bar"><i style="width:${Math.round(s.revenue / maxRev * 100)}%;background:${s.color}"></i></div>
      </div>
    </div>`).join("");

  /* ---------- 客户表 ---------- */
  $("#filterRow").innerHTML =
    `<button class="f-chip active" data-f="">全部</button>` +
    segmentStats.map(s =>
      `<button class="f-chip" data-f="${s.key}"><i style="color:${s.color}">●</i> ${s.name}（${s.count}）</button>`).join("");

  function pillCls(v) { return v >= 4 ? "hi" : v <= 2 ? "lo" : ""; }

  function renderTable() {
    const list = customers
      .filter(c => !filter || c.segment.key === filter)
      .sort((a, b) => b.total - a.total)
      .slice(0, 40);
    $("#custTable").innerHTML = `
      <tr><th>客户</th><th>R(天)</th><th>F(次)</th><th>M(¥)</th><th>R/F/M 分</th><th>总分</th><th>客群</th></tr>` +
      list.map(c => `
        <tr>
          <td>${c.name}<br><small style="color:var(--muted)">${c.id}</small></td>
          <td>${c.lastPurchaseDays}</td>
          <td>${c.orderCount}</td>
          <td>${c.totalSpent.toLocaleString()}</td>
          <td><span class="score-pills">
            <span class="pill ${pillCls(c.r)}">${c.r}</span>
            <span class="pill ${pillCls(c.f)}">${c.f}</span>
            <span class="pill ${pillCls(c.m)}">${c.m}</span>
          </span></td>
          <td><b>${c.total}</b></td>
          <td><span class="seg-tag" style="background:${c.segment.color}">${c.segment.name}</span></td>
        </tr>`).join("");
  }

  $("#filterRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-f]");
    if (!btn) return;
    filter = btn.dataset.f || null;
    document.querySelectorAll(".f-chip").forEach(b => b.classList.toggle("active", b === btn));
    renderTable();
  });

  window.addEventListener("resize", () => { drawBars(); drawScatter(); });

  drawBars();
  drawScatter();
  renderTable();
})();
