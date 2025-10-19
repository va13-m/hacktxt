import { Router } from "express";
import { requireAuth, AuthReq } from "../middleware/auth";

const r = Router();

// in-memory favorites: userId -> Set(modelId)
const favs = new Map<number, Set<number>>();

r.get("/favorites", requireAuth, (req: AuthReq, res) => {
  const set = favs.get(req.user!.id) || new Set<number>();
  res.json({ favorites: Array.from(set.values()) });
});

r.post("/favorites", requireAuth, (req: AuthReq, res) => {
  const { modelId } = req.body || {};
  if (!modelId) return res.status(400).json({ error: "modelId required" });
  const set = favs.get(req.user!.id) || new Set<number>();
  set.add(Number(modelId));
  favs.set(req.user!.id, set);
  res.json({ ok: true });
});

r.delete("/favorites/:modelId", requireAuth, (req: AuthReq, res) => {
  const id = Number(req.params.modelId);
  const set = favs.get(req.user!.id);
  if (set) set.delete(id);
  res.json({ ok: true });
});

export default r;
