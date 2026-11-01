/**
 * Admin dashboard routes.
 * All routes require admin role.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');
const { buildUpload, screenshotUpload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Apply admin auth to all routes in this router
router.use(requireAdmin);

// ── Dashboard Overview ─────────────────────────────────────
router.get('/', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    builds: db.prepare('SELECT COUNT(*) as count FROM builds').get().count,
    posts: db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count,
    scores: db.prepare('SELECT COUNT(*) as count FROM scores').get().count,
    openFeedback: db.prepare("SELECT COUNT(*) as count FROM feedback WHERE status = 'open'").get().count,
    screenshots: db.prepare('SELECT COUNT(*) as count FROM screenshots').get().count
  };

  const recentFeedback = db.prepare(`
    SELECT f.*, u.username
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.status = 'open'
    ORDER BY f.created_at DESC
    LIMIT 5
  `).all();

  res.render('admin/dashboard', {
    title: 'Admin Dashboard — THE VOSS FILES',
    activePage: 'admin',
    stats,
    recentFeedback
  });
});

// ═══════════════════════════════════════════════════════════
// CHAPTERS
// ═══════════════════════════════════════════════════════════

router.get('/chapters', (req, res) => {
  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort_order').all();
  res.render('admin/chapters', {
    title: 'Manage Chapters — Admin',
    activePage: 'admin',
    chapters,
    editing: null
  });
});

router.get('/chapters/:id/edit', (req, res) => {
  const chapters = db.prepare('SELECT * FROM chapters ORDER BY sort_order').all();
  const editing = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  if (!editing) return res.redirect('/admin/chapters');

  res.render('admin/chapters', {
    title: 'Edit Chapter — Admin',
    activePage: 'admin',
    chapters,
    editing
  });
});

router.post('/chapters/:id', (req, res) => {
  const { title, setting, summary, mechanic, status, sort_order } = req.body;

  db.prepare(`
    UPDATE chapters SET title = ?, setting = ?, summary = ?, mechanic = ?, status = ?, sort_order = ?
    WHERE id = ?
  `).run(title, setting, summary, mechanic, status, parseInt(sort_order) || 0, req.params.id);

  req.flash('success', 'Chapter updated.');
  res.redirect('/admin/chapters');
});

// ═══════════════════════════════════════════════════════════
// BUILDS
// ═══════════════════════════════════════════════════════════

router.get('/builds', (req, res) => {
  const builds = db.prepare('SELECT * FROM builds ORDER BY created_at DESC').all();
  res.render('admin/builds', {
    title: 'Manage Builds — Admin',
    activePage: 'admin',
    builds,
    editing: null
  });
});

router.post('/builds', buildUpload.single('build_file'), (req, res) => {
  const { version, platform, release_date, notes, is_published } = req.body;
  let filePath = null;
  let fileSize = null;

  if (req.file) {
    filePath = '/uploads/builds/' + req.file.filename;
    const sizeMB = (req.file.size / (1024 * 1024)).toFixed(1);
    fileSize = `${sizeMB} MB`;
  }

  db.prepare(`
    INSERT INTO builds (version, platform, release_date, file_path, file_size, notes, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(version, platform, release_date || null, filePath, fileSize, notes || null, is_published ? 1 : 0);

  req.flash('success', 'Build added.');
  res.redirect('/admin/builds');
});

router.get('/builds/:id/edit', (req, res) => {
  const builds = db.prepare('SELECT * FROM builds ORDER BY created_at DESC').all();
  const editing = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (!editing) return res.redirect('/admin/builds');

  res.render('admin/builds', {
    title: 'Edit Build — Admin',
    activePage: 'admin',
    builds,
    editing
  });
});

router.post('/builds/:id', buildUpload.single('build_file'), (req, res) => {
  const { version, platform, release_date, notes, is_published } = req.body;
  const existing = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (!existing) return res.redirect('/admin/builds');

  let filePath = existing.file_path;
  let fileSize = existing.file_size;

  if (req.file) {
    // Delete old file
    if (existing.file_path) {
      const oldPath = path.join(__dirname, '..', 'public', existing.file_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    filePath = '/uploads/builds/' + req.file.filename;
    const sizeMB = (req.file.size / (1024 * 1024)).toFixed(1);
    fileSize = `${sizeMB} MB`;
  }

  db.prepare(`
    UPDATE builds SET version = ?, platform = ?, release_date = ?, file_path = ?, file_size = ?, notes = ?, is_published = ?
    WHERE id = ?
  `).run(version, platform, release_date || null, filePath, fileSize, notes || null, is_published ? 1 : 0, req.params.id);

  req.flash('success', 'Build updated.');
  res.redirect('/admin/builds');
});

router.post('/builds/:id/delete', (req, res) => {
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (build && build.file_path) {
    const filePath = path.join(__dirname, '..', 'public', build.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM builds WHERE id = ?').run(req.params.id);
  req.flash('success', 'Build deleted.');
  res.redirect('/admin/builds');
});

// ═══════════════════════════════════════════════════════════
// BLOG POSTS
// ═══════════════════════════════════════════════════════════

router.get('/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT bp.*, u.username as author_name
    FROM blog_posts bp
    JOIN users u ON bp.author_id = u.id
    ORDER BY bp.created_at DESC
  `).all();

  res.render('admin/posts', {
    title: 'Manage Blog Posts — Admin',
    activePage: 'admin',
    posts
  });
});

router.get('/posts/new', (req, res) => {
  res.render('admin/post-edit', {
    title: 'New Blog Post — Admin',
    activePage: 'admin',
    post: null,
    errors: null
  });
});

router.post('/posts', (req, res) => {
  const { title, slug, body, is_published } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters.');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.push('Slug must contain only lowercase letters, numbers, and hyphens.');
  if (!body || body.trim().length < 10) errors.push('Body must be at least 10 characters.');

  // Check slug uniqueness
  if (slug) {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug);
    if (existing) errors.push('A post with that slug already exists.');
  }

  if (errors.length > 0) {
    return res.render('admin/post-edit', {
      title: 'New Blog Post — Admin',
      activePage: 'admin',
      post: req.body,
      errors
    });
  }

  db.prepare(`
    INSERT INTO blog_posts (title, slug, body, author_id, is_published)
    VALUES (?, ?, ?, ?, ?)
  `).run(title.trim(), slug.trim(), body.trim(), req.session.user.id, is_published ? 1 : 0);

  req.flash('success', 'Blog post created.');
  res.redirect('/admin/posts');
});

router.get('/posts/:id/edit', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.redirect('/admin/posts');

  res.render('admin/post-edit', {
    title: 'Edit Blog Post — Admin',
    activePage: 'admin',
    post,
    errors: null
  });
});

router.post('/posts/:id', (req, res) => {
  const { title, slug, body, is_published } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters.');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) errors.push('Slug must contain only lowercase letters, numbers, and hyphens.');
  if (!body || body.trim().length < 10) errors.push('Body must be at least 10 characters.');

  // Check slug uniqueness (excluding current post)
  if (slug) {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE slug = ? AND id != ?').get(slug, req.params.id);
    if (existing) errors.push('A post with that slug already exists.');
  }

  if (errors.length > 0) {
    return res.render('admin/post-edit', {
      title: 'Edit Blog Post — Admin',
      activePage: 'admin',
      post: { ...req.body, id: req.params.id },
      errors
    });
  }

  db.prepare(`
    UPDATE blog_posts SET title = ?, slug = ?, body = ?, is_published = ?
    WHERE id = ?
  `).run(title.trim(), slug.trim(), body.trim(), is_published ? 1 : 0, req.params.id);

  req.flash('success', 'Blog post updated.');
  res.redirect('/admin/posts');
});

router.post('/posts/:id/delete', (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  req.flash('success', 'Blog post deleted.');
  res.redirect('/admin/posts');
});

// ═══════════════════════════════════════════════════════════
// SCREENSHOTS
// ═══════════════════════════════════════════════════════════

router.get('/screenshots', (req, res) => {
  const screenshots = db.prepare(`
    SELECT s.*, c.title as chapter_title
    FROM screenshots s
    LEFT JOIN chapters c ON s.chapter_id = c.id
    ORDER BY s.sort_order
  `).all();

  const chapters = db.prepare('SELECT id, title FROM chapters ORDER BY sort_order').all();

  res.render('admin/screenshots', {
    title: 'Manage Screenshots — Admin',
    activePage: 'admin',
    screenshots,
    chapters
  });
});

router.post('/screenshots', screenshotUpload.single('screenshot_file'), (req, res) => {
  if (!req.file) {
    req.flash('error', 'Please select an image file.');
    return res.redirect('/admin/screenshots');
  }

  const { caption, chapter_id, sort_order } = req.body;
  const filePath = '/uploads/screenshots/' + req.file.filename;

  db.prepare(`
    INSERT INTO screenshots (chapter_id, caption, file_path, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(chapter_id || null, caption || null, filePath, parseInt(sort_order) || 0);

  req.flash('success', 'Screenshot uploaded.');
  res.redirect('/admin/screenshots');
});

router.post('/screenshots/:id/delete', (req, res) => {
  const screenshot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(req.params.id);
  if (screenshot && screenshot.file_path) {
    const filePath = path.join(__dirname, '..', 'public', screenshot.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM screenshots WHERE id = ?').run(req.params.id);
  req.flash('success', 'Screenshot deleted.');
  res.redirect('/admin/screenshots');
});

// ═══════════════════════════════════════════════════════════
// FEEDBACK
// ═══════════════════════════════════════════════════════════

router.get('/feedback', (req, res) => {
  const statusFilter = req.query.status || 'all';
  const typeFilter = req.query.type || 'all';

  let query = `
    SELECT f.*, u.username
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (statusFilter !== 'all') {
    query += ' AND f.status = ?';
    params.push(statusFilter);
  }
  if (typeFilter !== 'all') {
    query += ' AND f.type = ?';
    params.push(typeFilter);
  }

  query += ' ORDER BY f.created_at DESC';

  const feedbackList = db.prepare(query).all(...params);

  res.render('admin/feedback', {
    title: 'Manage Feedback — Admin',
    activePage: 'admin',
    feedbackList,
    statusFilter,
    typeFilter
  });
});

router.post('/feedback/:id/resolve', (req, res) => {
  db.prepare("UPDATE feedback SET status = 'resolved' WHERE id = ?").run(req.params.id);
  req.flash('success', 'Feedback marked as resolved.');
  res.redirect('/admin/feedback');
});

router.post('/feedback/:id/reopen', (req, res) => {
  db.prepare("UPDATE feedback SET status = 'open' WHERE id = ?").run(req.params.id);
  res.redirect('/admin/feedback');
});

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM scores WHERE user_id = u.id) as score_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  res.render('admin/users', {
    title: 'Manage Users — Admin',
    activePage: 'admin',
    users
  });
});

router.post('/users/:id/promote', (req, res) => {
  // Don't let admin demote themselves
  if (parseInt(req.params.id) === req.session.user.id) {
    req.flash('error', 'You cannot change your own role.');
    return res.redirect('/admin/users');
  }
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(req.params.id);
  req.flash('success', 'User promoted to admin.');
  res.redirect('/admin/users');
});

router.post('/users/:id/demote', (req, res) => {
  if (parseInt(req.params.id) === req.session.user.id) {
    req.flash('error', 'You cannot change your own role.');
    return res.redirect('/admin/users');
  }
  db.prepare("UPDATE users SET role = 'player' WHERE id = ?").run(req.params.id);
  req.flash('success', 'User demoted to player.');
  res.redirect('/admin/users');
});

router.post('/users/:id/toggle-active', (req, res) => {
  if (parseInt(req.params.id) === req.session.user.id) {
    req.flash('error', 'You cannot disable your own account.');
    return res.redirect('/admin/users');
  }
  const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(req.params.id);
  if (user) {
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(user.is_active ? 0 : 1, req.params.id);
    req.flash('success', user.is_active ? 'User disabled.' : 'User enabled.');
  }
  res.redirect('/admin/users');
});

// ═══════════════════════════════════════════════════════════
// SCORES
// ═══════════════════════════════════════════════════════════

router.get('/scores', (req, res) => {
  const scores = db.prepare(`
    SELECT s.*, u.username, c.title as chapter_title
    FROM scores s
    JOIN users u ON s.user_id = u.id
    JOIN chapters c ON s.chapter_id = c.id
    ORDER BY s.created_at DESC
    LIMIT 200
  `).all();

  res.render('admin/scores', {
    title: 'Manage Scores — Admin',
    activePage: 'admin',
    scores
  });
});

router.post('/scores/:id/delete', (req, res) => {
  db.prepare('DELETE FROM scores WHERE id = ?').run(req.params.id);
  req.flash('success', 'Score deleted.');
  res.redirect('/admin/scores');
});

module.exports = router;
