const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('users.db');

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`
  );
});

const app = express();
app.use(express.json());
app.use(
  session({
    secret: 'change_this_secret',
    resave: false,
    saveUninitialized: false,
  })
);

function adminExists(cb) {
  db.get('SELECT COUNT(*) AS cnt FROM users WHERE role = "admin"', (err, row) => {
    if (err) return cb(err);
    cb(null, row.cnt > 0);
  });
}

app.get('/api/admin-exists', (req, res) => {
  adminExists((err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ exists });
  });
});

app.post('/api/init', async (req, res) => {
  const { username, password } = req.body;
  adminExists(async (err, exists) => {
    if (err) return res.status(500).json({ error: err.message });
    if (exists) return res.status(400).json({ error: 'admin already exists' });
    if (!username || !password) return res.status(400).json({ error: 'missing' });
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, "admin")',
      [username, hash],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        req.session.user = { id: this.lastID, username, role: 'admin' };
        res.json({ success: true });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'invalid' });
    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'invalid' });
    req.session.user = { id: row.id, username: row.username, role: row.role };
    res.json({ success: true, user: { username: row.username, role: row.role } });
  });
});

app.post('/api/users', (req, res) => {
  const user = req.session.user;
  if (!user || user.role !== 'admin') return res.status(401).json({ error: 'unauthorized' });
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing' });
  bcrypt.hash(password, 10).then((hash) => {
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, "user")',
      [username, hash],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
