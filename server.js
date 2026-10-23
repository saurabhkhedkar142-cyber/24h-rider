const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const app = express();
const db = new Database(process.env.DB_PATH || "24h-rider.db");
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS riders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 phone TEXT UNIQUE NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 pickup TEXT NOT NULL,
 dropoff TEXT NOT NULL,
 area TEXT NOT NULL DEFAULT '',
 fare_paise INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'available',
 rider_id INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(rider_id) REFERENCES riders(id)
);
CREATE TABLE IF NOT EXISTS transactions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 rider_id INTEGER NOT NULL,
 kind TEXT NOT NULL,
 amount_paise INTEGER NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(rider_id) REFERENCES riders(id)
);
`);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "24 H Rider API" }));

// Basic rider registration for development. Add OTP verification and rate limiting before public launch.
app.post("/api/riders", (req, res) => {
  const { name, phone } = req.body || {};
  if (!name || !phone || !/^[0-9]{10}$/.test(String(phone))) {
    return res.status(400).json({ error: "Name and valid 10-digit phone number are required." });
  }
  try {
    const result = db.prepare("INSERT INTO riders (name, phone) VALUES (?, ?)").run(String(name).trim(), String(phone));
    res.status(201).json({ id: result.lastInsertRowid, name: String(name).trim(), phone: String(phone) });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "This phone number is already registered." });
    res.status(500).json({ error: "Could not create rider." });
  }
});

// These endpoints are intentionally not public-ready until authentication/authorization is added.
app.get("/api/orders", (req, res) => {
  const rows = db.prepare("SELECT id, pickup, dropoff, area, fare_paise, status FROM orders WHERE status='available' ORDER BY id DESC").all();
  res.json(rows);
});
app.post("/api/orders/:id/accept", (req, res) => {
  const riderId = Number(req.body?.riderId);
  if (!Number.isInteger(riderId) || riderId < 1) return res.status(400).json({ error: "A valid riderId is required." });
  const tx = db.transaction(() => {
    const order = db.prepare("SELECT * FROM orders WHERE id=? AND status='available'").get(Number(req.params.id));
    if (!order) return null;
    const result = db.prepare("UPDATE orders SET status='accepted', rider_id=? WHERE id=? AND status='available'").run(riderId, order.id);
    if (result.changes !== 1) return null;
    return db.prepare("SELECT id, pickup, dropoff, area, fare_paise, status FROM orders WHERE id=?").get(order.id);
  });
  const order = tx();
  if (!order) return res.status(409).json({ error: "Order is no longer available." });
  res.json(order);
});
app.get("/api/riders/:id/earnings", (req, res) => {
  const riderId = Number(req.params.id);
  if (!Number.isInteger(riderId) || riderId < 1) return res.status(400).json({ error: "Invalid rider id." });
  const totals = db.prepare("SELECT COALESCE(SUM(amount_paise),0) AS total_paise FROM transactions WHERE rider_id=?").get(riderId);
  const txs = db.prepare("SELECT kind, amount_paise, note, created_at FROM transactions WHERE rider_id=? ORDER BY id DESC LIMIT 50").all(riderId);
  res.json({ total_paise: totals.total_paise, transactions: txs });
});

// Owner/admin endpoint for creating orders. Protect this with real admin authentication before deployment.
app.post("/api/admin/orders", (req, res) => {
  const { pickup, dropoff, area = "", fareRupees } = req.body || {};
  if (!pickup || !dropoff || !Number.isFinite(Number(fareRupees)) || Number(fareRupees) <= 0) {
    return res.status(400).json({ error: "pickup, dropoff and positive fareRupees are required." });
  }
  const result = db.prepare("INSERT INTO orders (pickup, dropoff, area, fare_paise) VALUES (?, ?, ?, ?)")
    .run(String(pickup), String(dropoff), String(area), Math.round(Number(fareRupees) * 100));
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`24 H Rider listening on port ${PORT}`));
