import express from "express";
import cors from "cors";
import "dotenv/config";
import jwt from "jsonwebtoken";
import path from "path";
import gameRoutes from './routes/game';

const publicDir = path.join(__dirname, "../public");

const app = express();                  
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

// request logger
app.use((req, _res, next) => { console.log(req.method, req.url); next(); });

// Debug helper
app.post("/api/login-debug", (req, res) => {
  console.log(">>> /api/login-debug hit, body:", req.body);
  return res.json({ ok: true, received: req.body });
});

// Login route
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

// Health route
app.get("/api/health", (_req, res) => res.json({ ok: true }));


app.use('/api/game', gameRoutes);

// Root goes to signup
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "signup.html"));
});

app.get("/signup", (_req, res) => {
  res.sendFile(path.join(publicDir, "signup.html"));
});

app.get("/landing", (_req, res) => {
  res.sendFile(path.join(publicDir, "landing.html"));
});

app.get("/game", (_req, res) => {
  res.redirect("/game/p1/game.html");
});

// List routes helper
function listRoutes(app: express.Express) {
  const rootStack: any[] = (app as any)?._router?.stack ?? [];
  const lines: string[] = [];

  const pushRoute = (methodsObj: Record<string, boolean> | undefined, path: string, prefix = "") => {
    const methods = Object.keys(methodsObj ?? {}).map(m => m.toUpperCase()).join(",");
    if (!methods || !path) return;
    lines.push(`${methods} ${prefix}${path}`);
  };

  const walk = (stack: any[], prefix = "") => {
    for (const layer of stack) {
      if (layer?.route?.path) {
        pushRoute(layer.route.methods, layer.route.path, prefix);
        continue;
      }

      const isRouter = layer?.name === "router" && Array.isArray(layer?.handle?.stack);
      if (isRouter) {
        const subPrefix =
          typeof layer?.path === "string" ? prefix + layer.path :
          layer?.regexp?.fast_slash ? prefix + "/" : prefix;

        walk(layer.handle.stack, subPrefix);
      }
    }
  };

  walk(rootStack);
  console.log("REGISTERED ROUTES:\n" + (lines.length ? lines.join("\n") : "(none)"));
}

// Start server
const port = Number(process.env.PORT || 5174);
app.listen(port, () => {
  console.log(`🚀 API on http://localhost:${port}`);
  setTimeout(() => listRoutes(app), 100);
});