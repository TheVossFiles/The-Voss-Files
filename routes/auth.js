/**
 * Authentication routes: register, login, logout, profile.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { requireLogin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for authentication attempts (15 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const isLogin = req.path.includes('login');
    res.status(429).render(isLogin ? 'auth/login' : 'auth/register', {
      title: isLogin ? 'Login — THE VOSS FILES' : 'Register — THE VOSS FILES',
      activePage: isLogin ? 'login' : 'register',
      error: options.message,
      errors: [options.message],
      formData: req.body || {}
    });
  }
});


// ── Register (GET) ─────────────────────────────────────────
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register', {
    title: 'Register — THE VOSS FILES',
    activePage: 'register',
    errors: null,
    formData: {}
  });
});

// ── Register (POST) ────────────────────────────────────────
router.post('/register', authLimiter, (req, res) => {
  const { username, email, password, password_confirm } = req.body;
  const errors = [];

  // Validate
  if (!username || username.trim().length < 3 || username.trim().length > 30) {
    errors.push('Username must be 3–30 characters.');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    errors.push('Username can only contain letters, numbers, and underscores.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (password !== password_confirm) {
    errors.push('Passwords do not match.');
  }

  // Check uniqueness
  if (errors.length === 0) {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());
    if (existingUser) errors.push('That username is already taken.');

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email.trim());
    if (existingEmail) errors.push('That email is already registered.');
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register — THE VOSS FILES',
      activePage: 'register',
      errors,
      formData: { username, email }
    });
  }

  // Create user
  const hash = bcrypt.hashSync(password, 12);
  const apiToken = uuidv4();

  const result = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, api_token)
    VALUES (?, ?, ?, 'player', ?)
  `).run(username.trim(), email.trim().toLowerCase(), hash, apiToken);

  // Auto-login
  req.session.user = {
    id: result.lastInsertRowid,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    role: 'player'
  };

  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

// ── Login (GET) ────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', {
    title: 'Login — THE VOSS FILES',
    activePage: 'login',
    error: req.query.disabled ? 'Your account has been disabled.' : null,
    formData: {}
  });
});

// ── Login (POST) ───────────────────────────────────────────
router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('auth/login', {
      title: 'Login — THE VOSS FILES',
      activePage: 'login',
      error: 'Invalid username or password.',
      formData: { username }
    });
  }

  if (!user.is_active) {
    return res.render('auth/login', {
      title: 'Login — THE VOSS FILES',
      activePage: 'login',
      error: 'Your account has been disabled. Contact an administrator.',
      formData: { username }
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

// ── Logout ─────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ── Profile ────────────────────────────────────────────────
router.get('/profile', requireLogin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);

  const scores = db.prepare(`
    SELECT s.*, c.title as chapter_title, c.slug as chapter_slug
    FROM scores s
    JOIN chapters c ON s.chapter_id = c.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.session.user.id);

  const feedbackList = db.prepare(`
    SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.session.user.id);

  res.render('auth/profile', {
    title: 'My Profile — THE VOSS FILES',
    activePage: 'profile',
    user,
    scores,
    feedbackList
  });
});

// ── Regenerate API Token ───────────────────────────────────
router.post('/profile/regenerate-token', requireLogin, (req, res) => {
  const newToken = uuidv4();
  db.prepare('UPDATE users SET api_token = ? WHERE id = ?').run(newToken, req.session.user.id);
  req.flash('success', 'API token regenerated successfully.');
  res.redirect('/profile');
});

module.exports = router;
