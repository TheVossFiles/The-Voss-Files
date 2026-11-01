/**
 * Public page routes for THE VOSS FILES.
 * Home, Game, Story, Characters, Screenshots, Download,
 * How It's Built, Leaderboard, Feedback, About.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many feedback submissions from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).render('feedback', {
      title: 'Feedback — THE VOSS FILES',
      activePage: 'feedback',
      submitted: false,
      errors: [options.message],
      formData: req.body || {}
    });
  }
});


// ── Home ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  const latestPosts = db.prepare(`
    SELECT bp.*, u.username as author_name
    FROM blog_posts bp
    JOIN users u ON bp.author_id = u.id
    WHERE bp.is_published = 1
    ORDER BY bp.created_at DESC
    LIMIT 3
  `).all();

  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort_order').all();

  res.render('home', {
    title: 'THE VOSS FILES — Official Portal',
    activePage: 'home',
    latestPosts,
    chapters
  });
});

// ── The Game ───────────────────────────────────────────────
router.get('/game', (req, res) => {
  res.render('game', {
    title: 'The Game — THE VOSS FILES',
    activePage: 'game'
  });
});

// ── Story & Chapters ───────────────────────────────────────
router.get('/story', (req, res) => {
  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort_order').all();
  res.render('story', {
    title: 'Story & Chapters — THE VOSS FILES',
    activePage: 'story',
    chapters
  });
});

// ── Characters ─────────────────────────────────────────────
router.get('/characters', (req, res) => {
  res.render('characters', {
    title: 'Characters — THE VOSS FILES',
    activePage: 'characters'
  });
});

// ── Screenshots ────────────────────────────────────────────
router.get('/screenshots', (req, res) => {
  const screenshots = db.prepare(`
    SELECT s.*, c.title as chapter_title
    FROM screenshots s
    LEFT JOIN chapters c ON s.chapter_id = c.id
    ORDER BY s.sort_order
  `).all();

  res.render('screenshots', {
    title: 'Screenshots — THE VOSS FILES',
    activePage: 'screenshots',
    screenshots
  });
});

// ── Download ───────────────────────────────────────────────
router.get('/download', (req, res) => {
  const builds = db.prepare(`
    SELECT * FROM builds
    WHERE is_published = 1
    ORDER BY release_date DESC
  `).all();

  res.render('download', {
    title: 'Download — THE VOSS FILES',
    activePage: 'download',
    builds
  });
});

// ── How It Is Built ────────────────────────────────────────
router.get('/how-its-built', (req, res) => {
  res.render('how-its-built', {
    title: 'How It Is Built — THE VOSS FILES',
    activePage: 'how-its-built'
  });
});

// ── Leaderboard ────────────────────────────────────────────
router.get('/leaderboard', (req, res) => {
  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort_order').all();
  const chapterFilter = req.query.chapter || 'all';

  let scoresQuery;
  let scores;

  if (chapterFilter === 'all') {
    // Overall best: sum of best times per chapter for each user
    scores = db.prepare(`
      SELECT
        u.username,
        SUM(best.best_time) as time_seconds,
        SUM(best.min_hints) as hints_used,
        COUNT(best.chapter_id) as chapters_completed
      FROM (
        SELECT user_id, chapter_id,
               MIN(time_seconds) as best_time,
               MIN(hints_used) as min_hints
        FROM scores
        GROUP BY user_id, chapter_id
      ) best
      JOIN users u ON best.user_id = u.id
      GROUP BY best.user_id
      ORDER BY time_seconds ASC, hints_used ASC
      LIMIT 50
    `).all();
  } else {
    scores = db.prepare(`
      SELECT
        u.username,
        s.time_seconds,
        s.hints_used,
        s.created_at
      FROM scores s
      JOIN users u ON s.user_id = u.id
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.slug = ?
      ORDER BY s.time_seconds ASC, s.hints_used ASC, s.created_at ASC
      LIMIT 50
    `).all(chapterFilter);
  }

  res.render('leaderboard', {
    title: 'Leaderboard — THE VOSS FILES',
    activePage: 'leaderboard',
    chapters,
    scores,
    chapterFilter
  });
});

// ── Feedback ───────────────────────────────────────────────
router.get('/feedback', (req, res) => {
  res.render('feedback', {
    title: 'Feedback — THE VOSS FILES',
    activePage: 'feedback',
    submitted: req.query.submitted === '1',
    errors: null,
    formData: {}
  });
});

router.post('/feedback', feedbackLimiter, (req, res) => {
  const { type, rating, message } = req.body;
  const errors = [];

  if (!['bug', 'review', 'suggestion'].includes(type)) {
    errors.push('Please select a valid feedback type.');
  }
  if (type === 'review' && (!rating || rating < 1 || rating > 5)) {
    errors.push('Please provide a rating between 1 and 5.');
  }
  if (!message || message.trim().length < 10) {
    errors.push('Please provide a message (at least 10 characters).');
  }
  if (message && message.trim().length > 5000) {
    errors.push('Message must be under 5000 characters.');
  }

  if (errors.length > 0) {
    return res.render('feedback', {
      title: 'Feedback — THE VOSS FILES',
      activePage: 'feedback',
      submitted: false,
      errors,
      formData: req.body
    });
  }

  const userId = req.session.user ? req.session.user.id : null;
  const ratingVal = type === 'review' ? parseInt(rating) : null;

  db.prepare(`
    INSERT INTO feedback (user_id, type, rating, message) VALUES (?, ?, ?, ?)
  `).run(userId, type, ratingVal, message.trim());

  res.redirect('/feedback?submitted=1');
});

// ── About / Project ────────────────────────────────────────
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About — THE VOSS FILES',
    activePage: 'about'
  });
});

module.exports = router;
