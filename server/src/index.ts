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

function listRoutes() {
  const routes: string[] = [];
  // @ts-ignore
  app._router.stack.forEach((m: any) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${m.route.path}`);
    } else if (m.name === 'router' && m.handle && m.handle.stack) {
      m.handle.stack.forEach((h: any) => {
        if (h.route) {
          const methods = Object.keys(h.route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${h.route.path}`);
        }
      });
    }
  });
  console.log("REGISTERED ROUTES:\n" + routes.join("\n"));
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

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "signup.html"));
});
