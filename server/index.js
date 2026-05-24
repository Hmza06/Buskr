const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new sqlite3.Database('./buskr.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS performers (
    id TEXT PRIMARY KEY, name TEXT, genre TEXT, bio TEXT,
    photo TEXT, venmo TEXT, paypal TEXT, created_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, performer_id TEXT, song TEXT, lat REAL, lng REAL,
    active INTEGER DEFAULT 1, total_tips REAL DEFAULT 0, tip_count INTEGER DEFAULT 0,
    started_at TEXT, ended_at TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY, session_id TEXT, performer_id TEXT,
    name TEXT, message TEXT, amount REAL, created_at TEXT)`);
});

const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err) { err ? rej(err) : res(this); }));
const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));

app.post('/api/performers', async (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  const id = uuidv4();
  await run(`INSERT INTO performers VALUES (?,?,?,?,?,?,?,?)`, [id, name, genre, bio, photo, venmo, paypal, new Date().toISOString()]);
  res.json({ id, name, genre, bio, photo, venmo, paypal });
});

app.get('/api/performers/:id', async (req, res) => {
  const p = await get('SELECT * FROM performers WHERE id=?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.put('/api/performers/:id', async (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  await run(`UPDATE performers SET name=?,genre=?,bio=?,photo=?,venmo=?,paypal=? WHERE id=?`, [name, genre, bio, photo, venmo, paypal, req.params.id]);
  res.json({ id: req.params.id, name, genre, bio, photo, venmo, paypal });
});

app.post('/api/sessions', async (req, res) => {
  const { performer_id, song, lat, lng } = req.body;
  await run('UPDATE sessions SET active=0, ended_at=? WHERE performer_id=? AND active=1', [new Date().toISOString(), performer_id]);
  const id = uuidv4();
  await run(`INSERT INTO sessions VALUES (?,?,?,?,?,1,0,0,?,null)`, [id, performer_id, song, lat, lng, new Date().toISOString()]);
  res.json({ id, performer_id, song, lat, lng });
});

app.get('/api/sessions/active', async (req, res) => {
  const sessions = await all(`SELECT s.*, p.name, p.genre, p.photo FROM sessions s JOIN performers p ON s.performer_id=p.id WHERE s.active=1`);
  res.json(sessions);
});

app.get('/api/sessions/:id', async (req, res) => {
  const s = await get('SELECT * FROM sessions WHERE id=?', [req.params.id]);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

app.post('/api/sessions/:id/end', async (req, res) => {
  await run('UPDATE sessions SET active=0, ended_at=? WHERE id=?', [new Date().toISOString(), req.params.id]);
  io.emit('session_ended', { session_id: req.params.id });
  res.json({ success: true });
});

app.get('/api/performers/:id/session', async (req, res) => {
  const s = await get('SELECT * FROM sessions WHERE performer_id=? AND active=1', [req.params.id]);
  res.json(s || null);
});

app.post('/api/tips', async (req, res) => {
  const { session_id, performer_id, name, message, amount } = req.body;
  const id = uuidv4();
  const tip = { id, session_id, performer_id, name: name || 'Anonymous', message: message || '', amount, created_at: new Date().toISOString() };
  await run(`INSERT INTO tips VALUES (?,?,?,?,?,?,?)`, [id, session_id, performer_id, tip.name, tip.message, amount, tip.created_at]);
  await run('UPDATE sessions SET total_tips=total_tips+?, tip_count=tip_count+1 WHERE id=?', [amount, session_id]);
  io.to(session_id).emit('new_tip', tip);
  res.json(tip);
});

app.get('/api/sessions/:id/tips', async (req, res) => {
  const tips = await all('SELECT * FROM tips WHERE session_id=? ORDER BY created_at DESC', [req.params.id]);
  res.json(tips);
});

io.on('connection', socket => {
  socket.on('join_session', session_id => socket.join(session_id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Buskr server running on port ${PORT}`));