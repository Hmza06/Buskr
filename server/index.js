const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ performers: [], sessions: [], tips: [] }).write();

app.post('/api/performers', (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  const performer = { id: uuidv4(), name, genre, bio, photo, venmo, paypal, created_at: new Date().toISOString() };
  db.get('performers').push(performer).write();
  res.json(performer);
});

app.get('/api/performers/:id', (req, res) => {
  const p = db.get('performers').find({ id: req.params.id }).value();
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.put('/api/performers/:id', (req, res) => {
  const { name, genre, bio, photo, venmo, paypal } = req.body;
  db.get('performers').find({ id: req.params.id }).assign({ name, genre, bio, photo, venmo, paypal }).write();
  res.json({ id: req.params.id, name, genre, bio, photo, venmo, paypal });
});

app.post('/api/sessions', (req, res) => {
  const { performer_id, song, lat, lng } = req.body;
  db.get('sessions').filter({ performer_id, active: true }).each(s => { s.active = false; s.ended_at = new Date().toISOString(); }).write();
  const session = { id: uuidv4(), performer_id, song, lat, lng, active: true, total_tips: 0, tip_count: 0, started_at: new Date().toISOString(), ended_at: null };
  db.get('sessions').push(session).write();
  res.json(session);
});

app.get('/api/sessions/active', (req, res) => {
  const sessions = db.get('sessions').filter({ active: true }).value();
  const result = sessions.map(s => {
    const performer = db.get('performers').find({ id: s.performer_id }).value();
    return { ...s, name: performer?.name, genre: performer?.genre, photo: performer?.photo };
  });
  res.json(result);
});

app.get('/api/sessions/:id', (req, res) => {
  const s = db.get('sessions').find({ id: req.params.id }).value();
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

app.post('/api/sessions/:id/end', (req, res) => {
  db.get('sessions').find({ id: req.params.id }).assign({ active: false, ended_at: new Date().toISOString() }).write();
  io.emit('session_ended', { session_id: req.params.id });
  res.json({ success: true });
});

app.get('/api/performers/:id/session', (req, res) => {
  const s = db.get('sessions').find({ performer_id: req.params.id, active: true }).value();
  res.json(s || null);
});

app.post('/api/tips', (req, res) => {
  const { session_id, performer_id, name, message, amount } = req.body;
  const tip = { id: uuidv4(), session_id, performer_id, name: name || 'Anonymous', message: message || '', amount, created_at: new Date().toISOString() };
  db.get('tips').push(tip).write();
  const session = db.get('sessions').find({ id: session_id }).value();
  if (session) {
    db.get('sessions').find({ id: session_id }).assign({ total_tips: (session.total_tips || 0) + amount, tip_count: (session.tip_count || 0) + 1 }).write();
  }
  io.to(session_id).emit('new_tip', tip);
  res.json(tip);
});

app.get('/api/sessions/:id/tips', (req, res) => {
  const tips = db.get('tips').filter({ session_id: req.params.id }).sortBy('created_at').reverse().value();
  res.json(tips);
});

io.on('connection', socket => {
  socket.on('join_session', session_id => socket.join(session_id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Buskr server running on port ${PORT}`));