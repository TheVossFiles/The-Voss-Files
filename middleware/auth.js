/**
 * Authentication and authorization middleware.
 */

/**
 * Make session user available to all EJS templates.
 */
function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

/**
 * Require any authenticated user.
 */
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

/**
 * Require admin role.
 */
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('errors/403', {
      title: 'Forbidden',
      activePage: ''
    });
  }
  next();
}

/**
 * Check if the user account is still active (could have been disabled by admin).
 */
function checkActive(req, res, next) {
  if (req.session.user) {
    const db = require('../db/database');
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(req.session.user.id);
    if (!user || !user.is_active) {
      req.session.destroy();
      return res.redirect('/login?disabled=1');
    }
  }
  next();
}

module.exports = { attachUser, requireLogin, requireAdmin, checkActive };
