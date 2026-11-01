/**
 * THE VOSS FILES — Main Application
 * Express server with EJS views, SQLite database, session auth.
 */

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const { attachUser, checkActive } = require('./middleware/auth');
const { generateToken, validateToken } = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 3000;

// ── View engine ────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ───────────────────────────────────────────
// ── Static files with caching ───────────────────────────────────
// ── Static files (no-cache in dev for instant CSS reloads) ──────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: false
}));


// ── Security Headers Middleware ────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── Body parsing ───────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessions ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ── Global middleware ──────────────────────────────────────
app.use(attachUser);
app.use(checkActive);
app.use(generateToken);
app.use(validateToken);

// ── Flash messages (simple implementation) ─────────────────
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  next();
});

// Helper to set flash messages
app.use((req, res, next) => {
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };
  next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/',        require('./routes/index'));
app.use('/',        require('./routes/auth'));
app.use('/admin',   require('./routes/admin'));
app.use('/blog',    require('./routes/blog'));
app.use('/api',     require('./routes/api'));

// ── Auto-seed initial data on fresh deployment ─────────────
try {
  const db = require('./db/database');
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('No users found in database. Running initial seed...');
    require('./db/seed');
  }
} catch (seedErr) {
  console.warn('Initial seed check notice:', seedErr.message);
}

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    activePage: ''
  });
});

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('errors/500', {
    title: 'Server Error',
    activePage: ''
  });
});

// ── Start server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════════╗`);
  console.log(`  ║   THE VOSS FILES is running                  ║`);
  console.log(`  ║   http://localhost:${PORT}                      ║`);
  console.log(`  ╚══════════════════════════════════════════════╝\n`);
});

module.exports = app;
