const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new Database('buskr.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS performers (
    id TEXT PRIMARY KEY,
    name TEXT,
    genre TEXT,
    bio TEXT,
    photo TEXT,
    venmo TEXT,
    paypal TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    performer_id TEXT,
    song TEXT,
    lat REAL,
    lng REAL,
    active INTEGER DEFAULT 1,
    total_tips REAL DEFAULT 0,
    tip_count INTEGER DEFAULT 0,
    started_at TEXT,
    ended_at TEXT
  );
  CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    performer_id TEXT,
    name TEXT,
    message TEXT,
    amount REAL,
    created_at TEXT
  );
`);

// Create or get performer
app.post('/api/performers', (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO performers VALUES (?,?,?,?,?,?,?,?)`).run(id, name, genre, bio, photo, venmo, paypal, new Date().toISOString());
  res.json({ id, name, genre, bio, photo, venmo, paypal });
});

app.get('/api/performers/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM performers WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.put('/api/performers/:id', (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  db.prepare(`UPDATE performers SET name=?,genre=?,bio=?,photo=?,venmo=?,paypal=? WHERE id=?`).run(name, genre, bio, photo, venmo, paypal, req.params.id);
  res.json({ id: req.params.id, name, genre, bio, photo, venmo, paypal });
});

// Sessions
app.post('/api/sessions', (req, res) => {
  const { performer_id, song, lat, lng } = req.body;
  db.prepare('UPDATE sessions SET active=0, ended_at=? WHERE performer_id=? AND active=1')
    .run(new Date().toISOString(), performer_id);
  const id = uuidv4();
  db.prepare(`INSERT INTO sessions VALUES (?,?,?,?,?,1,0,0,?,null)`).run(id, performer_id, song, lat, lng, new Date().toISOString());
  res.json({ id, performer_id, song, lat, lng });
});

app.get('/api/sessions/active', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, p.name, p.genre, p.photo 
    FROM sessions s JOIN performers p ON s.performer_id=p.id 
    WHERE s.active=1
  `).all();
  res.json(sessions);
});

app.get('/api/sessions/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM sessions WHERE id=?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

app.post('/api/sessions/:id/end', (req, res) => {
  db.prepare('UPDATE sessions SET active=0, ended_at=? WHERE id=?').run(new Date().toISOString(), req.params.id);
  io.emit('session_ended', { session_id: req.params.id });
  res.json({ success: true });
});

app.get('/api/performers/:id/session', (req, res) => {
  const s = db.prepare('SELECT * FROM sessions WHERE performer_id=? AND active=1').get(req.params.id);
  res.json(s || null);
});

// Tips
app.post('/api/tips', (req, res) => {
  const { session_id, performer_id, name, message, amount } = req.body;
  const id = uuidv4();
  const tip = { id, session_id, performer_id, name: name || 'Anonymous', message: message || '', amount, created_at: new Date().toISOString() };
  db.prepare(`INSERT INTO tips VALUES (?,?,?,?,?,?,?)`).run(id, session_id, performer_id, tip.name, tip.message, amount, tip.created_at);
  db.prepare('UPDATE sessions SET total_tips=total_tips+?, tip_count=tip_count+1 WHERE id=?').run(amount, session_id);
  io.to(session_id).emit('new_tip', tip);
  res.json(tip);
});

app.get('/api/sessions/:id/tips', (req, res) => {
  const tips = db.prepare('SELECT * FROM tips WHERE session_id=? ORDER BY created_at DESC').all(req.params.id);
  res.json(tips);
});

// Socket
io.on('connection', (socket) => {
  socket.on('join_session', (session_id) => socket.join(session_id));
});

server.listen(4000, () => console.log('Buskr server running on port 4000'));