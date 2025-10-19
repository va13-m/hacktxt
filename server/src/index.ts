import express from "express";
import cors from "cors";
import "dotenv/config";
import jwt from "jsonwebtoken";
import path from "path";


const publicDir = path.join(__dirname, "../public"); // <-- this is the correct folder

const app = express();                  
app.use(cors());
app.use(express.json({ limit: "1mb" }));
// Serve static frontend from server/public
app.use(express.static(publicDir));


// request logger
app.use((req, _res, next) => { console.log(req.method, req.url); next(); });

// --- DEBUG HELPERS: add immediately after app is created ---
app.post("/api/login-debug", (req, res) => {
  console.log(">>> /api/login-debug hit, body:", req.body);
  return res.json({ ok: true, received: req.body });
});

import type { Express } from "express";

function listRoutes(app: Express) {
  const rootStack: any[] = (app as any)?._router?.stack ?? [];
  const lines: string[] = [];

  const pushRoute = (methodsObj: Record<string, boolean> | undefined, path: string, prefix = "") => {
    const methods = Object.keys(methodsObj ?? {}).map(m => m.toUpperCase()).join(",");
    if (!methods || !path) return;
    lines.push(`${methods} ${prefix}${path}`);
  };

  const walk = (stack: any[], prefix = "") => {
    for (const layer of stack) {
      // Direct route (app.get/post/etc.)
      if (layer?.route?.path) {
        pushRoute(layer.route.methods, layer.route.path, prefix);
        continue;
      }

      // Nested router (app.use('/prefix', router))
      const isRouter = layer?.name === "router" && Array.isArray(layer?.handle?.stack);
      if (isRouter) {
        // Best-effort prefix (Express doesn't always expose a clean string path here)
        const subPrefix =
          typeof layer?.path === "string" ? prefix + layer.path :
          layer?.regexp?.fast_slash ? prefix + "/" : prefix;

        walk(layer.handle.stack, subPrefix);
      }
      // Middlewares (no routes) are ignored
    }
  };

  if (!Array.isArray(rootStack)) {
    console.warn("No router stack found (did you register routes before calling listRoutes?)");
    return;
  }

  walk(rootStack);
  console.log("REGISTERED ROUTES:\n" + (lines.length ? lines.join("\n") : "(none)"));
}

setTimeout(listRoutes, 500);
// --- end DEBUG HELPERS ---

// your real /api/login route
const users = [
  { id: 1, email: "abhamisaqi@email.com", password: "demo1234", phone: "555-111-2222" },
  { id: 2, email: "bernicehoang@email.com", password: "guest1234", phone: "555-333-4444" }
];

app.post("/api/login", (req, res) => {
  console.log("Login route hit!");
  const { email, password } = req.body || {};
  const u = users.find(x => x.email === email);
  if (!u || u.password !== password) return res.status(401).json({ error: "bad credentials" });
  const token = jwt.sign(
    { id: u.id, email: u.email },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "1d" }
  );
  res.json({ token, user: { id: u.id, email: u.email, phone: u.phone } });
});

// health route
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// start server
const port = Number(process.env.PORT || 5174);
app.listen(port, () => console.log(`API on http://localhost:${port}`));

// Root goes to signup
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "signup.html"));
});

// Pretty route for signup if you want it explicit
app.get("/signup", (_req, res) => {
  res.sendFile(path.join(publicDir, "signup.html"));
});

// Landing route
app.get("/landing", (_req, res) => {
  res.sendFile(path.join(publicDir, "landing.html"));
});

// Game route
app.get("/game", (_req, res) => {
  res.redirect("/game/p1/index.html");
});

