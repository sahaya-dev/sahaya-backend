const config = require('../config');

/**
 * Protects /api/dev/* when DEV_DB_KEY is set in env.
 */
function devDbAuth(req, res, next) {
  if (!config.devDbKey) {
    return next();
  }
  const key = req.headers['x-dev-db-key'];
  if (!key || key !== config.devDbKey) {
    return res.status(401).json({ success: false, message: 'Invalid or missing X-Dev-Db-Key' });
  }
  return next();
}

module.exports = { devDbAuth };
