import { Router } from "express";
import jwt from "jsonwebtoken";

// In-memory users for demo
const users = [
  { id: 1, email: "abhamisaqi@email.com", password: "demo1234", phone: "555-111-2222" },
  { id: 2, email: "bernicehoang@email.com", password: "guest1234", phone: "555-333-4444" }
];

const r = Router();

r.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = users.find(x => x.email === email);
  if (!u || u.password !== password) return res.status(401).json({ error: "bad credentials" });

  const token = jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "1d" });
  res.json({ token, user: { id: u.id, email: u.email, phone: u.phone } });
});

export default r;
