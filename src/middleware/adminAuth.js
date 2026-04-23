const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/response');

const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, 'Access denied. No token provided.', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return error(res, 'Admin access required.', 403);
    const user = await User.findById(decoded.id).select('tokenVersion isActive role');
    if (!user || !user.isActive) return error(res, 'Account not found or deactivated.', 401);
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion)
      return error(res, 'Session expired. Please login again.', 401);
    req.user = { id: decoded.id, role: user.role, tokenVersion: user.tokenVersion };
    next();
  } catch {
    error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = adminAuth;
