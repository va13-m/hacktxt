// analyst/analyst.js
document.addEventListener('DOMContentLoaded', () => {
  const data = {
    user: {
      buyerType: "First-time buyer",
      budgetMonthly: 400,
      downPayment: 2000,
      credit: "Around 700 (Good)",
      lifestyle: "Daily commute + occasional road trips",
      space: "Prefers fuel efficiency over cargo space",
      topPriority: "Fuel savings & reliability",
      familiarity: "Likes the RAV4 and Camry"
    },
    match: [
      { rank: 1, name: "2022 Toyota Camry SE", score: 92, winner: true },
      { rank: 2, name: "2024 Toyota Corolla LE", score: 88 },
      { rank: 3, name: "2023 Toyota RAV4 XLE", score: 86 }
    ],
    price: { msrp: 28500, down: 2000, tradeIn: 0, financed: 26500 },
    finance: {
      termMonths: 60, apr: 4.5,
      monthlyPayment: 493, monthlyInsurance: 120, monthlyMaintenance: 40,
      totalMonthly: 653, totalInterest: 3990, totalCost: 32490
    },
    lease: {
      termMonths: 36, apr: 4.0, residualValue: 17000, mileageLimit: "12,000/yr",
      monthlyPayment: 310, monthlyInsurance: 120, totalMonthly: 430, totalCost: 15480
    },
    recommendation: {
      type: "lease",
      reason: "Lower monthly outlay and good fit for fuel-efficiency priority while keeping cash flow flexible."
    },
    tips: [
      "Ask about Toyota Financial promotional APR; with ~700 score you may qualify.",
      "If possible, add $1,000 to down payment to reduce finance payment by ~ $18/month.",
      "Consider the Camry SE Hybrid for additional ~$70/month fuel savings vs gas-only.",
    ]
  };

  // helpers
  const $ = (sel) => document.querySelector(sel);
  const money = (n) => `$${n.toLocaleString()}`;

  // User summary
  $("#userSummary")?.insertAdjacentHTML("beforeend", `
    <div class="kv">
      <strong>Buyer Type</strong><span>${data.user.buyerType}</span>
      <strong>Monthly Budget</strong><span>${money(data.user.budgetMonthly)}/mo</span>
      <strong>Down Payment</strong><span>${money(data.user.downPayment)}</span>
      <strong>Credit</strong><span>${data.user.credit}</span>
      <strong>Lifestyle</strong><span>${data.user.lifestyle}</span>
      <strong>Space Needs</strong><span>${data.user.space}</span>
      <strong>Top Priority</strong><span>${data.user.topPriority}</span>
      <strong>Toyota Familiarity</strong><span>${data.user.familiarity}</span>
    </div>
  `);

  // Match results
  $("#matchResults")?.insertAdjacentHTML("beforeend", `
    <div class="match-list">
      ${data.match.map(m => `
        <div class="match-item">
          <div>
            <div><strong>${m.rank === 1 ? "🥇 " : m.rank === 2 ? "🥈 " : "🥉 "}</strong>${m.name}</div>
            ${m.winner ? `<span class="badge" title="Top Match">WINNER</span>` : ""}
          </div>
          <div class="score">${m.score}%</div>
        </div>
      `).join("")}
    </div>
  `);

  // Price
  $("#priceBlock")?.insertAdjacentHTML("beforeend", `
    <table class="a-table">
      <tr><th>MSRP</th><td>${money(data.price.msrp)}</td></tr>
      <tr><th>Down Payment</th><td>${money(data.price.down)}</td></tr>
      <tr><th>Trade-in</th><td>${money(data.price.tradeIn)}</td></tr>
      <tr><th>Amount Financed</th><td><strong>${money(data.price.financed)}</strong></td></tr>
    </table>
  `);

  // Finance
  $("#financeBlock")?.insertAdjacentHTML("beforeend", `
    <table class="a-table">
      <tr><th>Monthly Payment</th><td>${money(data.finance.monthlyPayment)}</td></tr>
      <tr><th>Insurance (est.)</th><td>${money(data.finance.monthlyInsurance)}</td></tr>
      <tr><th>Maintenance (est.)</th><td>${money(data.finance.monthlyMaintenance)}</td></tr>
      <tr><th><strong>Total / Month</strong></th><td><strong>${money(data.finance.totalMonthly)}</strong></td></tr>
      <tr><th>Total Interest</th><td>${money(data.finance.totalInterest)}</td></tr>
      <tr><th>Total Cost</th><td>${money(data.finance.totalCost)}</td></tr>
    </table>
  `);

  // Lease
  $("#leaseBlock")?.insertAdjacentHTML("beforeend", `
    <table class="a-table">
      <tr><th>Monthly Payment</th><td>${money(data.lease.monthlyPayment)}</td></tr>
      <tr><th>Insurance (est.)</th><td>${money(data.lease.monthlyInsurance)}</td></tr>
      <tr><th>Mileage Limit</th><td>${data.lease.mileageLimit}</td></tr>
      <tr><th><strong>Total / Month</strong></th><td><strong>${money(data.lease.totalMonthly)}</strong></td></tr>
      <tr><th>Total Cost</th><td>${money(data.lease.totalCost)}</td></tr>
    </table>
  `);

  $("#recNote") && ($("#recNote").textContent =
    `Recommendation: ${data.recommendation.type.toUpperCase()} — ${data.recommendation.reason}`);

  // Tips
  $("#tipsList")?.insertAdjacentHTML("beforeend",
    data.tips.map(t => `<li>${t}</li>`).join("")
  );

  // What-if buttons (template literals fixed)
  $("#whatIfA")?.addEventListener("click", () => {
    alert("With 750 credit, promotional APR could drop to ~3.49%. Finance total/month might improve by ~$20–$25.");
  });
  $("#whatIfB")?.addEventListener("click", () => {
    alert(`$0 down raises finance payment by ~${money(35)} and increases total interest paid.`);
  });
  $("#whatIfC")?.addEventListener("click", () => {
    alert("TCO rough guide: Camry SE vs Corolla LE — Camry higher payment, better highway mpg; Corolla lower cost of ownership overall.");
  });
});
