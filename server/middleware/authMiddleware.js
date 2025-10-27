// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const COOKIE_NAME = process.env.COOKIE_NAME || 'jwt_token';

function getTokenFromReq(req) {
  // First try cookie
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  // Then try Authorization header (Bearer ...)
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function verifyJWT(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role, iat, exp, ... }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.user.role !== role) return res.status(403).json({ success: false, error: 'Forbidden' });
    next();
  };
}

module.exports = {
  verifyJWT,
  requireRole,
  COOKIE_NAME,
};
