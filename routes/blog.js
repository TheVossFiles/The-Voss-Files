/**
 * Blog routes: post listing (paginated) and post detail with comments.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'You are commenting too quickly. Please pause before posting again.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    req.flash('error', options.message);
    res.redirect(`/blog/${req.params.slug}#comments`);
  }
});


const POSTS_PER_PAGE = 6;

// ── Blog index (paginated) ─────────────────────────────────
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * POSTS_PER_PAGE;

  const total = db.prepare('SELECT COUNT(*) as count FROM blog_posts WHERE is_published = 1').get().count;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const posts = db.prepare(`
    SELECT bp.*, u.username as author_name
    FROM blog_posts bp
    JOIN users u ON bp.author_id = u.id
    WHERE bp.is_published = 1
    ORDER BY bp.created_at DESC
    LIMIT ? OFFSET ?
  `).all(POSTS_PER_PAGE, offset);

  res.render('blog/index', {
    title: 'Dev Blog — THE VOSS FILES',
    activePage: 'blog',
    posts,
    page,
    totalPages
  });
});

// ── Single post ────────────────────────────────────────────
router.get('/:slug', (req, res) => {
  const post = db.prepare(`
    SELECT bp.*, u.username as author_name
    FROM blog_posts bp
    JOIN users u ON bp.author_id = u.id
    WHERE bp.slug = ? AND bp.is_published = 1
  `).get(req.params.slug);

  if (!post) {
    return res.status(404).render('errors/404', {
      title: 'Post Not Found',
      activePage: 'blog'
    });
  }

  const comments = db.prepare(`
    SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(post.id);

  res.render('blog/show', {
    title: `${post.title} — THE VOSS FILES`,
    activePage: 'blog',
    post,
    comments
  });
});

// ── Add comment ────────────────────────────────────────────
router.post('/:slug/comment', requireLogin, commentLimiter, (req, res) => {
  const post = db.prepare('SELECT id FROM blog_posts WHERE slug = ? AND is_published = 1').get(req.params.slug);
  if (!post) {
    return res.status(404).render('errors/404', {
      title: 'Post Not Found',
      activePage: 'blog'
    });
  }

  const { body } = req.body;
  if (!body || body.trim().length < 2 || body.trim().length > 2000) {
    req.flash('error', 'Comment must be between 2 and 2000 characters.');
    return res.redirect(`/blog/${req.params.slug}`);
  }

  db.prepare(`
    INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)
  `).run(post.id, req.session.user.id, body.trim());

  res.redirect(`/blog/${req.params.slug}#comments`);
});

module.exports = router;
