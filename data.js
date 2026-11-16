// 客户交易数据生成器（可复现伪随机，原创）
(function () {
  let seed = 20261116;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  const SURNAMES = ["张", "王", "李", "赵", "陈", "刘", "杨", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡", "郭", "何", "林", "罗", "郑"];
  const GIVEN = ["伟", "芳", "娜", "敏", "静", "磊", "洋", "艳", "勇", "军", "杰", "娟", "涛", "明", "超", "秀", "霞", "平", "刚", "桂"];

  // 生成 200 个客户，消费行为分几种画像
  const customers = [];
  for (let i = 0; i < 200; i++) {
    const name = SURNAMES[Math.floor(rand() * SURNAMES.length)] +
                 GIVEN[Math.floor(rand() * GIVEN.length)];
    const profile = rand();
    let lastDays, orders, spent;
    if (profile < 0.12) {        // 高价值活跃
      lastDays = rand() * 15;
      orders = 12 + Math.floor(rand() * 20);
      spent = 3000 + rand() * 9000;
    } else if (profile < 0.3) {  // 活跃普通
      lastDays = rand() * 30;
      orders = 4 + Math.floor(rand() * 8);
      spent = 600 + rand() * 2400;
    } else if (profile < 0.5) {  // 新客户
      lastDays = rand() * 20;
      orders = 1 + Math.floor(rand() * 2);
      spent = 80 + rand() * 400;
    } else if (profile < 0.7) {  // 沉默中价值
      lastDays = 60 + rand() * 90;
      orders = 3 + Math.floor(rand() * 6);
      spent = 500 + rand() * 2000;
    } else if (profile < 0.88) { // 流失高价值（曾经的大客户）
      lastDays = 120 + rand() * 180;
      orders = 8 + Math.floor(rand() * 14);
      spent = 2500 + rand() * 6000;
    } else {                     // 流失边缘
      lastDays = 90 + rand() * 200;
      orders = 1 + Math.floor(rand() * 3);
      spent = 100 + rand() * 500;
    }
    customers.push({
      id: "C" + String(10001 + i),
      name,
      lastPurchaseDays: Math.round(lastDays),
      orderCount: orders,
      totalSpent: Math.round(spent),
    });
  }

  window.CRM_CUSTOMERS = customers;
})();
