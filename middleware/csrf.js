/**
 * CSRF protection middleware.
 * Generates a per-session token and validates it on state-changing requests.
 */

const crypto = require('crypto');

/**
 * Generate CSRF token and attach to session + res.locals.
 */
function generateToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

/**
 * Validate CSRF token on POST/PUT/DELETE requests.
 * Skips API routes (they use API token auth instead).
 */
function validateToken(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints (they use bearer/token auth)
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'];

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).render('errors/403', {
      title: 'Invalid Request',
      activePage: ''
    });
  }

  next();
}

module.exports = { generateToken, validateToken };
