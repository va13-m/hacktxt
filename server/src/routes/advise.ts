import { Router } from "express";

const r = Router();

r.post("/advise", (req, res) => {
  const { plan } = req.body || {};
  if (!plan) return res.status(400).json({ error: "plan required" });
  const { modelName, price, apr, term, down, target } = plan;

  const tips = [
    apr > 4 ? "Lowering APR by 0.5% saves noticeable interest." : "APR already looks solid.",
    down < price * 0.1 ? "Aim for ~10% down to reduce monthly payment." : "Down payment is strong.",
    term < 48 ? "Extending term reduces monthly but raises total cost." : "Term length balances payment and cost."
  ];
  const summary =
    `${modelName} matches your profile. With ${term} months and $${down} down, you're ` +
    `${(price - down) > 0 ? "financing comfortably" : "close to cash price"}. ` +
    `Target $${target}/mo: adjust APR/down to get there.`;

  res.json({ tips, summary });
});

export default r;
