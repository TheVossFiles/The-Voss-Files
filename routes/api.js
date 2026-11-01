/**
 * Game-facing API routes.
 * POST /api/scores — record a completion time from the game client.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const rateLimit = require('express-rate-limit');

// Rate limiter: 30 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(apiLimiter);

/**
 * POST /api/scores
 *
 * Body (JSON):
 * {
 *   "api_token": "user-uuid-token",
 *   "chapter_slug": "chapter-1",
 *   "time_seconds": 142.5,
 *   "hints_used": 2
 * }
 *
 * Returns:
 * { "success": true, "score_id": 1, "rank": 3 }
 */
router.post('/scores', (req, res) => {
  try {
    const { api_token, chapter_slug, time_seconds, hints_used } = req.body;

    // ── Validate fields ────────────────────────────────────
    const errors = [];

    if (!api_token || typeof api_token !== 'string') {
      errors.push('api_token is required.');
    }
    if (!chapter_slug || typeof chapter_slug !== 'string') {
      errors.push('chapter_slug is required.');
    }
    if (time_seconds === undefined || typeof time_seconds !== 'number' || time_seconds <= 0) {
      errors.push('time_seconds must be a positive number.');
    }
    if (time_seconds !== undefined && time_seconds > 86400) {
      errors.push('time_seconds cannot exceed 86400 (24 hours).');
    }
    if (hints_used === undefined || typeof hints_used !== 'number' || hints_used < 0 || !Number.isInteger(hints_used)) {
      errors.push('hints_used must be a non-negative integer.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }

    // ── Authenticate via API token ─────────────────────────
    const user = db.prepare('SELECT id, is_active FROM users WHERE api_token = ?').get(api_token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid API token.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled.' });
    }

    // ── Validate chapter ───────────────────────────────────
    const chapter = db.prepare('SELECT id FROM chapters WHERE slug = ?').get(chapter_slug);
    if (!chapter) {
      return res.status(400).json({ error: `Unknown chapter: ${chapter_slug}` });
    }

    // ── Insert score ───────────────────────────────────────
    const result = db.prepare(`
      INSERT INTO scores (user_id, chapter_id, time_seconds, hints_used)
      VALUES (?, ?, ?, ?)
    `).run(user.id, chapter.id, time_seconds, hints_used);

    // ── Calculate rank ─────────────────────────────────────
    const rank = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM scores
      WHERE chapter_id = ? AND time_seconds < ?
    `).get(chapter.id, time_seconds);

    return res.status(201).json({
      success: true,
      score_id: result.lastInsertRowid,
      rank: rank.rank
    });

  } catch (err) {
    console.error('API /scores error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
